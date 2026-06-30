import argparse
import asyncio
import sys

import edge_tts


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--voice", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args()


async def generate_voice(text, voice, output_path):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)


if __name__ == "__main__":
    args = parse_args()

    try:
        asyncio.run(generate_voice(args.text, args.voice, args.output))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
