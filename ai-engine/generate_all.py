import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")
    
import traceback
from datetime import datetime, timezone
from pathlib import Path

from generate_player import main as generate_player
from generate_players_index import main as generate_players_index
from main import main as generate_stats_report
from generate_manifest import main as generate_manifest

from src.validators.player_validator import (
    validate_source_players,
    validate_generated_players,
)

from src.validators.report_validator import validate_generated_reports


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

SOURCE_PLAYERS_DIR = BASE_DIR / "data" / "players"
GENERATED_PLAYERS_DIR = PROJECT_ROOT / "public" / "generated" / "players"
GENERATED_REPORTS_DIR = PROJECT_ROOT / "public" / "generated" / "reports"


def print_header(title: str) -> None:
    print("")
    print("=" * 70)
    print(title)
    print("=" * 70)


def print_step(message: str) -> None:
    print(f"→ {message}")


def run_step(name: str, function) -> bool:
    print_step(name)

    try:
        function()
        print(f"✓ {name} completed")
        return True

    except Exception:
        print(f"✗ {name} failed")
        print("")
        traceback.print_exc()
        return False


def count_source_players() -> int:
    if not SOURCE_PLAYERS_DIR.exists():
        return 0

    return len([
        folder for folder in SOURCE_PLAYERS_DIR.iterdir()
        if folder.is_dir()
    ])


def count_generated_players() -> int:
    if not GENERATED_PLAYERS_DIR.exists():
        return 0

    return len([
        file for file in GENERATED_PLAYERS_DIR.glob("*.json")
        if file.name != "index.json"
    ])


def print_errors(title: str, errors: list[str]) -> None:
    print(title)

    for error in errors:
        print(f"- {error}")


def main() -> None:
    started_at = datetime.now(timezone.utc)

    print_header("Orangeball Dreams — Automation Layer")
    print(f"Started at: {started_at.isoformat()}")
    print(f"Project root: {PROJECT_ROOT}")
    print(f"AI Engine: {BASE_DIR}")

    print_header("1. Validating source players")

    source_errors = validate_source_players(SOURCE_PLAYERS_DIR)

    if source_errors:
        print_errors("Source validation failed:", source_errors)
        print("")
        print("Generation stopped. Fix the source data first.")
        return

    print("✓ Source validation passed")
    print(f"Players found: {count_source_players()}")

    print_header("2. Generating files")

    steps = [
        ("Generating player JSON files", generate_player),
        ("Generating players index", generate_players_index),
        ("Generating stats reports", generate_stats_report),
        ("Generating manifest", generate_manifest),
    ]

    for name, function in steps:
        success = run_step(name, function)

        if not success:
            print("")
            print("Generation stopped because one step failed.")
            return

    print_header("3. Validating generated players")

    generated_player_errors = validate_generated_players(GENERATED_PLAYERS_DIR)

    if generated_player_errors:
        print_errors("Generated player validation failed:", generated_player_errors)
        print("")
        print("Some files were generated, but player output is not fully valid.")
        return

    print("✓ Generated players validation passed")

    print_header("4. Validating generated reports")

    generated_report_errors = validate_generated_reports(GENERATED_REPORTS_DIR)

    if generated_report_errors:
        print_errors("Generated report validation failed:", generated_report_errors)
        print("")
        print("Some files were generated, but report output is not fully valid.")
        return

    print("✓ Generated reports validation passed")

    finished_at = datetime.now(timezone.utc)
    duration = finished_at - started_at

    print_header("Generation completed successfully")
    print(f"Source players: {count_source_players()}")
    print(f"Generated player JSON files: {count_generated_players()}")
    print(f"Reports folder: {GENERATED_REPORTS_DIR}")
    print(f"Finished at: {finished_at.isoformat()}")
    print(f"Duration: {duration.total_seconds():.2f}s")
    print("")
    print("Next step:")
    print("npm run dev")


if __name__ == "__main__":
    main()