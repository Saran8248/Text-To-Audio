import asyncio
import argparse
import sys
import os
import edge_tts

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--voice", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args()

async def generate_voice(text, voice, output_path):
    max_retries = 3
    last_error = None
    
    for attempt in range(max_retries):
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            
            # Verify file exists and is not empty
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                return
            else:
                # Remove empty file if created
                if os.path.exists(output_path):
                    try:
                        os.remove(output_path)
                    except:
                        pass
                raise Exception("Generated audio file was empty")
        except Exception as exc:
            last_error = exc
            if attempt < max_retries - 1:
                # Backoff delay before retry (1.5s, 3s)
                await asyncio.sleep(1.5 * (attempt + 1))
            
    if last_error:
        raise last_error

if __name__ == "__main__":
    args = parse_args()

    try:
        asyncio.run(generate_voice(args.text, args.voice, args.output))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
