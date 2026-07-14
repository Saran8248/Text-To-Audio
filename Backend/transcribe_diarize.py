import sys
import os
import json
import numpy as np
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import speech_recognition as sr

def cluster_speakers(features):
    features = np.array(features)
    n_samples = len(features)
    if n_samples == 0:
        return {}, 0.0
    if n_samples == 1:
        return {0: "Speaker 1"}, 0.0

    # Normalize each feature dimension to [0, 1] range
    f_min = features.min(axis=0)
    f_max = features.max(axis=0)
    f_range = f_max - f_min
    f_range[f_range == 0] = 1.0
    norm_features = (features - f_min) / f_range

    # Threshold for grouping voice profiles (0.24 is optimal to separate neural voices)
    THRESHOLD = 0.24
    
    speakers = []       # List of centroids (numpy arrays)
    speaker_counts = [] # List of segment counts per speaker
    labels = {}         # Map of segment index to speaker name

    for idx, f in enumerate(norm_features):
        if not speakers:
            # First segment is Speaker 1
            speakers.append(f)
            speaker_counts.append(1)
            labels[idx] = "Speaker 1"
            continue

        # Find closest speaker centroid
        best_dist = float('inf')
        best_spk_idx = -1
        for spk_idx, centroid in enumerate(speakers):
            dist = np.linalg.norm(f - centroid)
            if dist < best_dist:
                best_dist = dist
                best_spk_idx = spk_idx

        if best_dist < THRESHOLD:
            # Assign to closest speaker and update their centroid incrementally
            labels[idx] = f"Speaker {best_spk_idx + 1}"
            count = speaker_counts[best_spk_idx]
            speakers[best_spk_idx] = (speakers[best_spk_idx] * count + f) / (count + 1)
            speaker_counts[best_spk_idx] += 1
        else:
            # Create a new speaker
            new_spk_idx = len(speakers)
            speakers.append(f)
            speaker_counts.append(1)
            labels[idx] = f"Speaker {new_spk_idx + 1}"

    # If only 1 speaker is detected, separation is 0.0. Otherwise, average distance between centroids.
    if len(speakers) <= 1:
        separation = 0.0
    else:
        dists = []
        for i in range(len(speakers)):
            for j in range(i + 1, len(speakers)):
                dists.append(np.linalg.norm(speakers[i] - speakers[j]))
        separation = float(np.mean(dists))

    return labels, separation

def load_audio(file_path):
    from pydub.utils import which
    has_ffmpeg = which("ffmpeg") is not None or which("avconv") is not None
    
    if not has_ffmpeg and file_path.lower().endswith(".mp3"):
        try:
            import mp3
            with open(file_path, "rb") as f:
                dec = mp3.Decoder(f)
                pcm = []
                while True:
                    chunk = dec.read(4096)
                    if not chunk:
                        break
                    pcm.append(chunk)
                raw = b"".join(pcm)
                return AudioSegment(
                    data=raw,
                    sample_width=2,
                    frame_rate=dec.get_sample_rate(),
                    channels=dec.get_channels()
                )
        except Exception as e:
            sys.stderr.write(f"Warning: Failed to decode MP3 using pymp3 ({e}). Falling back to default.\n")
            
    return AudioSegment.from_file(file_path)

def process_audio(file_path):
    # Load audio file (handling offline fallback without ffmpeg for mp3)
    audio = load_audio(file_path)
    sr_sample_rate = audio.frame_rate
    
    # Detect nonsilent intervals
    # min_silence_len: 600ms silence minimum to split speakers
    # silence_thresh: -38dB
    intervals = detect_nonsilent(audio, min_silence_len=600, silence_thresh=-38)
    
    # Fallback to single segment if no silences detected
    if not intervals:
        intervals = [[0, len(audio)]]

    features = []
    chunks = []
    
    for start, end in intervals:
        chunk = audio[start:end]
        chunks.append((start, end, chunk))
        
        # Extract features for speaker classification
        samples = np.array(chunk.get_array_of_samples(), dtype=float)
        if len(samples) == 0:
            features.append([0.0, 0.0, 0.0])
            continue
            
        # 1. Zero Crossing Rate (ZCR)
        zcr = np.sum(np.diff(np.sign(samples)) != 0) / len(samples)
        
        # 2. Spectral Centroid
        fft_vals = np.abs(np.fft.rfft(samples))
        freqs = np.fft.rfftfreq(len(samples), 1.0 / sr_sample_rate)
        fft_sum = np.sum(fft_vals)
        centroid = np.sum(freqs * fft_vals) / fft_sum if fft_sum > 0 else 0.0
        
        # 3. Spectral Rolloff (85% energy frequency)
        rolloff = 0.0
        if fft_sum > 0:
            cumsum = np.cumsum(fft_vals)
            idx_rolloff = np.searchsorted(cumsum, 0.85 * fft_sum)
            rolloff = freqs[idx_rolloff] if idx_rolloff < len(freqs) else freqs[-1]
            
        features.append([zcr, centroid, rolloff])

    # Cluster segments to identify speaker turns dynamically
    speaker_labels, separation = cluster_speakers(features)
    
    # If the number of unique speakers is 1, classify as monologue
    unique_speakers = set(speaker_labels.values())
    is_monologue = len(unique_speakers) <= 1

    recognizer = sr.Recognizer()
    segments = []

    for idx, (start, end, chunk) in enumerate(chunks):
        # Convert chunk to WAV bytes for SpeechRecognition
        wav_io = chunk.export(format="wav").read()
        audio_data = sr.AudioData(wav_io, sr_sample_rate, 2)
        
        text = ""
        try:
            # Transcribe via Google speech recognition
            text = recognizer.recognize_google(audio_data)
        except sr.UnknownValueError:
            # Speech was unintelligible
            text = "[unintelligible]"
        except sr.RequestError as e:
            text = f"[Transcription service error: {e}]"

        # Format timestamps as [MM:SS]
        start_sec = start / 1000.0
        end_sec = end / 1000.0
        
        segments.append({
            "speaker": "Speaker 1" if is_monologue else speaker_labels.get(idx, "Speaker 1"),
            "start": round(start_sec, 2),
            "end": round(end_sec, 2),
            "text": text
        })

    # Prepare final output structure
    output = {
        "is_monologue": is_monologue,
        "segments": segments
    }
    return output

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"Audio file not found at {file_path}"}))
        sys.exit(1)

    try:
        result = process_audio(file_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
