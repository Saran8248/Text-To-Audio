import asyncio
import argparse
import sys
import os
import edge_tts

try:
    from gtts import gTTS, lang as gtts_lang
    HAS_GTTS = True
except ImportError:
    HAS_GTTS = False

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--voice", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--language", required=False, default=None)
    return parser.parse_args()

def get_language_from_voice(voice, requested_language=None):
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

    return "en"

def generate_voice_gtts(text, voice, language, output_path):
    if not HAS_GTTS:
        raise RuntimeError("gTTS is not installed for fallback TTS")
    
    lang_code = get_language_from_voice(voice, language)
    tts = gTTS(text=text, lang=lang_code)
    tts.save(output_path)
    if not (os.path.exists(output_path) and os.path.getsize(output_path) > 0):
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except Exception:
                pass
        raise RuntimeError("gTTS failed to produce an audio file")

async def generate_voice(text, voice, output_path, language=None):
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
            await communicate.save(output_path)
            
            # Verify file exists and is not empty
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                return
            else:
                # Remove empty file if created
                if os.path.exists(output_path):
                    try:
                        os.remove(output_path)
                    except Exception:
                        pass
                raise Exception("Generated audio file was empty")
        except Exception as exc:
            last_error = exc
            err_msg = str(exc)
            # If Microsoft blocked the connection with 403 Forbidden, retrying will not bypass the block
            if "403" in err_msg or "Invalid response status" in err_msg:
                break
            if attempt < max_retries - 1:
                # Backoff delay before retry (1.5s, 3s)
                await asyncio.sleep(1.5 * (attempt + 1))
            
    # If Edge TTS failed (e.g. 403 Forbidden datacenter block), gracefully fall back to gTTS
    if HAS_GTTS:
        try:
            generate_voice_gtts(text, voice, language, output_path)
            return
        except Exception as fallback_exc:
            raise RuntimeError(
                f"Edge TTS failed ({last_error}) and fallback TTS failed ({fallback_exc})"
            ) from fallback_exc

    if last_error:
        raise last_error

if __name__ == "__main__":
    args = parse_args()

    try:
        asyncio.run(generate_voice(args.text, args.voice, args.output, args.language))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
