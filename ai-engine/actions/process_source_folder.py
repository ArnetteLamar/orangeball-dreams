import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from create_proposal_from_source import create_proposal_from_source


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR.parent
DEFAULT_SOURCE_DIR = BASE_DIR / "data" / "sources" / "raw"


SKIPPABLE_STATUSES = {
    "raw_placeholder",
    "raw_sample",
    "raw_processed",
    "raw_duplicate",
    "draft",
    "incomplete",
}


ACTIONABLE_STATUS = "raw_ready"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def resolve_source_dir(source_dir: str | None) -> Path:
    if not source_dir:
        return DEFAULT_SOURCE_DIR

    path = Path(source_dir)

    if path.is_absolute():
        return path

    return PROJECT_ROOT / path


def load_json_file(file_path: Path) -> dict:
    with file_path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def write_json_file(file_path: Path, payload: dict) -> None:
    with file_path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2, ensure_ascii=False)


def mark_source_file(
    source_file: Path,
    status: str,
    result: dict | None = None,
) -> None:
    payload = load_json_file(source_file)

    payload["status"] = status
    payload["updated_at"] = now_iso()

    processing_result = {
        "processed_at": now_iso(),
        "result_status": result.get("status") if result else None,
        "proposal_id": result.get("proposal_id") if result else None,
        "duplicate_reason": result.get("duplicate_reason") if result else None,
    }

    payload["processing_result"] = processing_result

    write_json_file(source_file, payload)


def should_skip_source_file(source_file: Path) -> tuple[bool, str]:
    try:
        payload = load_json_file(source_file)
    except Exception as error:
        return False, f"invalid_json: {error}"

    status = str(payload.get("status", "")).strip()

    if not status:
        return True, "missing status"

    if status in SKIPPABLE_STATUSES:
        return True, f"status is {status}"

    if status != ACTIONABLE_STATUS:
        return True, f"status is {status}; expected {ACTIONABLE_STATUS}"

    raw_data = payload.get("raw_data", {})

    if not isinstance(raw_data, dict):
        return True, "raw_data is not an object"

    opponent = str(raw_data.get("opponent", "")).strip()

    if not opponent:
        return True, "missing opponent"

    return False, ""


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
            "skipped_not_actionable": 0,
            "failed": 0,
        }

    created = 0
    skipped = 0
    skipped_not_actionable = 0
    failed = 0

    print("")
    print("Processing source folder")
    print(f"Folder: {resolved_source_dir}")
    print(f"Files found: {len(source_files)}")
    print("")

    for source_file in source_files:
        print("-" * 60)
        print(f"Source file: {source_file.name}")

        should_skip, skip_reason = should_skip_source_file(source_file)

        if should_skip:
            skipped_not_actionable += 1
            print("SKIP - Source file is not actionable")
            print(f"  Reason: {skip_reason}")
            continue

        try:
            result = create_proposal_from_source(str(source_file))

            if result.get("status") == "skipped_duplicate":
                skipped += 1
                mark_source_file(source_file, "raw_duplicate", result)
                print("✓ Source marked as raw_duplicate")

            elif result.get("proposal_id"):
                created += 1
                mark_source_file(source_file, "raw_processed", result)
                print("✓ Source marked as raw_processed")

            else:
                skipped += 1
                print("SKIP - Source did not create a proposal")

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
    print(f"Skipped not actionable: {skipped_not_actionable}")
    print(f"Failed: {failed}")

    return {
        "status": "ok",
        "source_dir": str(resolved_source_dir),
        "total_files": len(source_files),
        "created": created,
        "skipped": skipped,
        "skipped_not_actionable": skipped_not_actionable,
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