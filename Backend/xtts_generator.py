import argparse
import os
import sys


def parse_args():
    parser = argparse.ArgumentParser(description="Generate speech using Coqui XTTS-v2")
    parser.add_argument("--text", required=True)
    parser.add_argument("--language", default="en")
    parser.add_argument("--voice", default="xtts-v2")
    parser.add_argument("--speaker_wav", default=None)
    parser.add_argument("--output", required=True)
    return parser.parse_args()


def main():
    args = parse_args()

    try:
        from TTS.api import TTS
    except Exception as exc:
        print(f"XTTS unavailable: {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
        tts = TTS(model_name=model_name, progress_bar=False, gpu=False)
        tts.tts_to_file(
            text=args.text,
            file_path=args.output,
            language=args.language,
            speaker_wav=args.speaker_wav,
        )
    except Exception as exc:
        print(f"XTTS generation failed: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
