import json
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

GENERATED_DIR = PROJECT_ROOT / "public" / "generated"
PLAYERS_DIR = GENERATED_DIR / "players"
REPORTS_DIR = GENERATED_DIR / "reports"
OUTPUT_FILE = GENERATED_DIR / "manifest.json"


def count_player_files() -> int:
    if not PLAYERS_DIR.exists():
        return 0

    return len([
        file for file in PLAYERS_DIR.glob("*.json")
        if file.name != "index.json"
    ])


def count_report_files() -> int:
    if not REPORTS_DIR.exists():
        return 0

    return len(list(REPORTS_DIR.glob("report_*.json")))


def list_files(folder: Path, pattern: str) -> list[str]:
    if not folder.exists():
        return []

    return sorted([file.name for file in folder.glob(pattern)])


def main() -> None:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    manifest = {
        "schema_version": "1.0",
        "project": "Orangeball Dreams",
        "content_type": "generated_manifest",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generator": "ai-engine/generate_manifest.py",
        "players": {
            "count": count_player_files(),
            "index_file": "players/index.json",
            "files": list_files(PLAYERS_DIR, "*.json"),
        },
        "reports": {
            "count": count_report_files(),
            "files": list_files(REPORTS_DIR, "report_*.json"),
        },
        "status": "ok",
    }

    OUTPUT_FILE.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    print("Generated manifest successfully.")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    main()