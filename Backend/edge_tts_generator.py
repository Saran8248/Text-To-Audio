import asyncio
import argparse
import sys
import os
import io
import re
import subprocess
import shutil
import tempfile
import edge_tts

try:
    from gtts import gTTS, lang as gtts_lang
    HAS_GTTS = True
except ImportError:
    HAS_GTTS = False

try:
    import av
    import numpy as np
    HAS_AV = True
except ImportError:
    HAS_AV = False

BREAK_PATTERN = re.compile(
    r'[\[\(](?:break|pause|silence)(?:\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(s|sec|secs|second|seconds|ms|msec|msecs)?)?\s*[\]\)]'
    r'|<break\s+[^>]*?time\s*=\s*["\']([0-9]+(?:\.[0-9]+)?)\s*(s|sec|secs|ms|msec)?["\'][^>]*?>',
    re.IGNORECASE
)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--voice", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--language", required=False, default=None)
    return parser.parse_args()

def parse_text_segments(text):
    """
    Parses input text into alternating text and break duration segments.
    Supports formats like:
      [break: 1s], [break: 4s], [break: 2], [pause: 1s], [break],
      <break time="2s"/>, [silence: 1s]
    """
    segments = []
    last_end = 0
    for m in BREAK_PATTERN.finditer(text):
        if m.start() > last_end:
            sub = text[last_end:m.start()].strip()
            if sub:
                segments.append(('text', sub))
        val_str = m.group(1) or m.group(3)
        unit = (m.group(2) or m.group(4) or 's').lower()
        val = float(val_str) if val_str else 1.0  # default 1.0s for bare [break]
        duration = val / 1000.0 if 'ms' in unit else val
        duration = max(0.05, min(duration, 30.0))  # clamp between 50ms and 30s
        segments.append(('break', duration))
        last_end = m.end()

    if last_end < len(text):
        trailing = text[last_end:].strip()
        if trailing:
            segments.append(('text', trailing))

    return segments

def strip_mp3_headers(data: bytes) -> bytes:
    """
    Strips ID3v2 container headers and seeks to the first valid MPEG sync frame.
    Prevents corrupting the stream when stitching secondary MP3 chunks.
    """
    if data.startswith(b"ID3") and len(data) >= 10:
        size = (
            ((data[6] & 0x7F) << 21)
            | ((data[7] & 0x7F) << 14)
            | ((data[8] & 0x7F) << 7)
            | (data[9] & 0x7F)
        )
        data = data[10 + size :]

    sync_idx = -1
    for i in range(len(data) - 1):
        if data[i] == 0xFF and (data[i + 1] & 0xE0) == 0xE0:
            sync_idx = i
            break
    if sync_idx > 0:
        data = data[sync_idx:]
    return data

def stitch_to_clean_mp3(resolved_segments, output_path, sample_rate=24000, bit_rate=48000):
    """
    Decodes audio segments to PCM, inserts exact duration silent frames,
    and encodes into a single seamless MP3 container with zero mid-stream ID3 tags.
    """
    if not HAS_AV:
        return False

    try:
        output_container = av.open(output_path, mode="w", format="mp3")
        out_stream = output_container.add_stream("mp3", rate=sample_rate)
        out_stream.bit_rate = bit_rate
        out_stream.layout = "mono"

        resampler = None

        for kind, val in resolved_segments:
            if kind == "audio_bytes":
                in_container = av.open(io.BytesIO(val))
                in_stream = in_container.streams.audio[0]
                for frame in in_container.decode(in_stream):
                    if (
                        frame.format.name != "fltp"
                        or frame.sample_rate != sample_rate
                        or frame.layout.name != "mono"
                    ):
                        if resampler is None:
                            resampler = av.AudioResampler(
                                format="fltp", layout="mono", rate=sample_rate
                            )
                        for rf in resampler.resample(frame):
                            for packet in out_stream.encode(rf):
                                output_container.mux(packet)
                    else:
                        for packet in out_stream.encode(frame):
                            output_container.mux(packet)
                if resampler:
                    for rf in resampler.resample(None):
                        for packet in out_stream.encode(rf):
                            output_container.mux(packet)
                    resampler = None
                in_container.close()
            elif kind == "silence":
                duration_sec = val
                num_samples = int(duration_sec * sample_rate)
                chunk_size = 1152
                remaining = num_samples
                while remaining > 0:
                    cur_chunk = min(remaining, chunk_size)
                    samples = np.zeros((1, cur_chunk), dtype=np.float32)
                    frame = av.AudioFrame.from_ndarray(samples, format="fltp", layout="mono")
                    frame.sample_rate = sample_rate
                    for packet in out_stream.encode(frame):
                        output_container.mux(packet)
                    remaining -= cur_chunk

        for packet in out_stream.encode():
            output_container.mux(packet)

        output_container.close()
        return True
    except Exception as exc:
        print(f"[Warning] stitch_to_clean_mp3 failed: {exc}. Falling back to CLI stitch.", file=sys.stderr)
        return False

def stitch_with_ffmpeg_cli(resolved_segments, output_path, sample_rate=24000, bit_rate=48000):
    """
    Concatenates segments and generates silence using ffmpeg CLI when av is not installed.
    """
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        return False

    temp_dir = tempfile.mkdtemp(prefix="tts_stitch_")
    try:
        chunk_files = []
        for i, (kind, val) in enumerate(resolved_segments):
            chunk_path = os.path.join(temp_dir, f"chunk_{i:04d}.mp3")
            if kind == "audio_bytes":
                with open(chunk_path, "wb") as f:
                    f.write(val)
                chunk_files.append(chunk_path)
            elif kind == "silence":
                duration_sec = val
                cmd = [
                    ffmpeg_bin, "-y",
                    "-f", "lavfi",
                    "-i", f"anullsrc=r={sample_rate}:cl=mono",
                    "-t", str(duration_sec),
                    "-c:a", "libmp3lame",
                    "-b:a", f"{bit_rate // 1000}k",
                    "-ar", str(sample_rate),
                    "-ac", "1",
                    chunk_path
                ]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                chunk_files.append(chunk_path)

        list_file = os.path.join(temp_dir, "concat.txt")
        with open(list_file, "w", encoding="utf-8") as f:
            for cf in chunk_files:
                f.write(f"file '{cf.replace(os.sep, '/')}'\n")

        concat_cmd = [
            ffmpeg_bin, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file,
            "-c:a", "libmp3lame",
            "-b:a", f"{bit_rate // 1000}k",
            "-ar", str(sample_rate),
            "-ac", "1",
            output_path
        ]
        subprocess.run(concat_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        shutil.rmtree(temp_dir, ignore_errors=True)
        return os.path.exists(output_path) and os.path.getsize(output_path) > 0
    except Exception as exc:
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"[Warning] stitch_with_ffmpeg_cli failed: {exc}", file=sys.stderr)
        return False

def generate_fallback_silence_bytes(duration_sec):
    """
    Fallback MPEG-2 Layer 3 48kbps 24kHz mono silent MP3 frames (144 bytes = 24ms per frame)
    """
    num_frames = max(1, int(duration_sec / 0.024))
    raw_frame = bytes.fromhex(
        "fff364c40000000348000000004c414d455555554c414d45332e313030"
        + ("55" * 114)
    )
    return raw_frame * num_frames

def get_language_from_voice(voice, requested_language=None):
    if voice:
        parts = voice.split("-")
        if parts:
            candidate = parts[0].lower()
            if HAS_GTTS:
                try:
                    if candidate in gtts_lang.tts_langs():
                        return candidate
                except Exception:
                    pass
            return candidate

    if requested_language:
        candidate = requested_language.strip().lower()
        if HAS_GTTS:
            try:
                langs = gtts_lang.tts_langs()
                if candidate in langs:
                    return candidate
                short = candidate.split("-")[0]
                if short in langs:
                    return short
            except Exception:
                pass
        return candidate.split("-")[0]

    return "en"

def get_tld_from_voice(voice):
    if not voice:
        return "com"
    v = voice.lower()
    if "en-in" in v:
        return "co.in"
    if "en-gb" in v:
        return "co.uk"
    if "en-au" in v:
        return "com.au"
    if "en-ca" in v:
        return "ca"
    if "en-za" in v:
        return "co.za"
    if "es-mx" in v:
        return "com.mx"
    if "es-es" in v:
        return "es"
    if "fr-ca" in v:
        return "ca"
    if "fr-fr" in v:
        return "fr"
    return "com"

def generate_voice_gtts_bytes(text, voice, language):
    if not HAS_GTTS:
        raise RuntimeError("gTTS is not installed for fallback TTS")
    
    lang_code = get_language_from_voice(voice, language)
    tld = get_tld_from_voice(voice)
    buf = io.BytesIO()
    try:
        tts = gTTS(text=text, lang=lang_code, tld=tld)
    except Exception:
        tts = gTTS(text=text, lang=lang_code)
    tts.write_to_fp(buf)
    data = buf.getvalue()
    if not data:
        raise RuntimeError("gTTS failed to produce audio")
    return data

async def generate_single_segment_bytes(text, voice, language=None):
    proxy = (
        os.environ.get("EDGE_TTS_PROXY")
        or os.environ.get("HTTPS_PROXY")
        or os.environ.get("HTTP_PROXY")
    )
    max_retries = 3
    last_error = None
    
    for attempt in range(max_retries):
        try:
            communicate = edge_tts.Communicate(text, voice, proxy=proxy)
            chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    chunks.append(chunk["data"])
            data = b"".join(chunks)
            if data and len(data) > 0:
                return data
            raise Exception("Generated audio segment was empty")
        except Exception as exc:
            last_error = exc
            if attempt < max_retries - 1:
                await asyncio.sleep(1.0 * (attempt + 1))
            
    if HAS_GTTS:
        try:
            print(f"[TTS Fallback Warning] Edge TTS failed for '{voice}' ({last_error}). Falling back to gTTS.", file=sys.stderr)
            return generate_voice_gtts_bytes(text, voice, language)
        except Exception as fallback_exc:
            raise RuntimeError(
                f"Edge TTS failed ({last_error}) and fallback TTS failed ({fallback_exc})"
            ) from fallback_exc

    if last_error:
        raise last_error

async def generate_voice(text, voice, output_path, language=None):
    segments = parse_text_segments(text)
    
    # If no breaks detected, run directly
    has_breaks = any(kind == 'break' for kind, _ in segments)
    if not has_breaks:
        data = await generate_single_segment_bytes(text, voice, language)
        with open(output_path, "wb") as f:
            f.write(data)
        return

    # Handle text with custom breaks
    resolved_segments = []
    for kind, val in segments:
        if kind == 'text':
            if val.strip():
                segment_audio = await generate_single_segment_bytes(val, voice, language)
                resolved_segments.append(('audio_bytes', segment_audio))
        elif kind == 'break':
            resolved_segments.append(('silence', val))

    if not resolved_segments:
        raise RuntimeError("No audio or break segments generated")

    # 1. Attempt clean container re-encoding via PyAV
    if HAS_AV:
        success = stitch_to_clean_mp3(resolved_segments, output_path)
        if success and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            return

    # 2. Attempt clean container stitching via ffmpeg CLI
    if stitch_with_ffmpeg_cli(resolved_segments, output_path):
        return

    # 3. Fallback: Frame-level MP3 concatenation with stripped headers
    buffers = []
    for i, (kind, val) in enumerate(resolved_segments):
        if kind == 'audio_bytes':
            # Strip ID3/headers from second and subsequent audio blocks
            block = val if i == 0 else strip_mp3_headers(val)
            buffers.append(block)
        elif kind == 'silence':
            silence_block = generate_fallback_silence_bytes(val)
            buffers.append(silence_block)

    with open(output_path, "wb") as f:
        for b in buffers:
            f.write(b)

if __name__ == "__main__":
    args = parse_args()

    try:
        asyncio.run(generate_voice(args.text, args.voice, args.output, args.language))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
