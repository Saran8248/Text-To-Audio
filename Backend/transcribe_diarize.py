import sys
import os
import json
import numpy as np
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import speech_recognition as sr

def kmeans_2(features):
    # Normalize features to [0, 1] range for robust clustering
    features = np.array(features)
    if len(features) < 2:
        return {0: "Speaker 1"}, 0.0

    f_min = features.min(axis=0)
    f_max = features.max(axis=0)
    f_range = f_max - f_min
    # Avoid division by zero
    f_range[f_range == 0] = 1.0
    norm_features = (features - f_min) / f_range

    # Initialize centroids: pick first point and the point furthest from it
    c1 = norm_features[0]
    distances = np.linalg.norm(norm_features - c1, axis=1)
    c2 = norm_features[np.argmax(distances)]

    # If the furthest distance is tiny, it's a monologue
    if np.linalg.norm(c1 - c2) < 0.05:
        return {i: "Speaker 1" for i in range(len(features))}, 0.0

    # Run k-means iterations
    for _ in range(25):
        clusters = [[], []]
        indices = [[], []]
        for idx, f in enumerate(norm_features):
            d1 = np.linalg.norm(f - c1)
            d2 = np.linalg.norm(f - c2)
            if d1 <= d2:
                clusters[0].append(f)
                indices[0].append(idx)
            else:
                clusters[1].append(f)
                indices[1].append(idx)

        if len(clusters[0]) == 0 or len(clusters[1]) == 0:
            break

        new_c1 = np.mean(clusters[0], axis=0)
        new_c2 = np.mean(clusters[1], axis=0)
        if np.allclose(c1, new_c1) and np.allclose(c2, new_c2):
            break
        c1, c2 = new_c1, new_c2

    labels = {}
    for idx in indices[0]:
        labels[idx] = "Speaker 1"
    for idx in indices[1]:
        labels[idx] = "Speaker 2"

    centroid_dist = np.linalg.norm(c1 - c2)
    return labels, centroid_dist

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
        
        # 2. Spectral Centroid (Center of gravity of the spectrum)
        fft_vals = np.abs(np.fft.rfft(samples))
        freqs = np.fft.rfftfreq(len(samples), 1.0 / sr_sample_rate)
        fft_sum = np.sum(fft_vals)
        centroid = np.sum(freqs * fft_vals) / fft_sum if fft_sum > 0 else 0.0
        
        # 3. Standard deviation of amplitude envelope
        std_amp = np.std(samples)
        
        features.append([zcr, centroid, std_amp])

    # Cluster segments to identify speaker turns
    speaker_labels, separation = kmeans_2(features)
    
    # If the voices are extremely similar (separation < 0.15), classify as monologue
    is_monologue = bool(separation < 0.15)

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
