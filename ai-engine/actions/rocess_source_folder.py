import argparse
from pathlib import Path

from create_proposal_from_source import create_proposal_from_source


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR.parent
DEFAULT_SOURCE_DIR = BASE_DIR / "data" / "sources" / "raw"


def resolve_source_dir(source_dir: str | None) -> Path:
    if not source_dir:
        return DEFAULT_SOURCE_DIR

    path = Path(source_dir)

    if path.is_absolute():
        return path

    return PROJECT_ROOT / path


def process_source_folder(source_dir: str | None = None) -> dict:
    resolved_source_dir = resolve_source_dir(source_dir)

    if not resolved_source_dir.exists():
        raise FileNotFoundError(f"Source folder not found: {resolved_source_dir}")

    source_files = sorted(resolved_source_dir.glob("*.json"))

    if not source_files:
        print(f"No source files found in: {resolved_source_dir}")

        return {
            "status": "empty",
            "source_dir": str(resolved_source_dir),
            "total_files": 0,
            "created": 0,
            "skipped": 0,
            "failed": 0,
        }

    created = 0
    skipped = 0
    failed = 0

    print("")
    print("Processing source folder")
    print(f"Folder: {resolved_source_dir}")
    print(f"Files found: {len(source_files)}")
    print("")

    for source_file in source_files:
        print("-" * 60)
        print(f"Source file: {source_file.name}")

        try:
            result = create_proposal_from_source(str(source_file))

            if result.get("status") == "skipped_duplicate":
                skipped += 1
            elif result.get("proposal_id"):
                created += 1
            else:
                skipped += 1

        except Exception as error:
            failed += 1
            print("✗ Failed to process source file")
            print(f"  File: {source_file}")
            print(f"  Error: {error}")

    print("")
    print("=" * 60)
    print("Source folder processing completed")
    print("=" * 60)
    print(f"Total files: {len(source_files)}")
    print(f"Created proposals: {created}")
    print(f"Skipped duplicates: {skipped}")
    print(f"Failed: {failed}")

    return {
        "status": "ok",
        "source_dir": str(resolved_source_dir),
        "total_files": len(source_files),
        "created": created,
        "skipped": skipped,
        "failed": failed,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Process all raw source JSON files and create pending proposals."
    )

    parser.add_argument(
        "--source-dir",
        default=None,
        help="Optional source folder. Default: ai-engine/data/sources/raw",
    )

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    process_source_folder(source_dir=args.source_dir)


if __name__ == "__main__":
    main()