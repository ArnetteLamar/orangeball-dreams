import argparse
import json
from pathlib import Path

from generate_player import generate_one_player, get_player_folders
from src.generators.player_ai_report_generator import (
    generate_player_ai_report,
    generate_player_ai_report_markdown,
)


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

PLAYERS_DIR = BASE_DIR / "data" / "players"
REPORTS_OUTPUT_DIR = PROJECT_ROOT / "public" / "generated" / "reports" / "players"


def export_json(data: dict, output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with output_file.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def export_markdown(content: str, output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with output_file.open("w", encoding="utf-8") as file:
        file.write(content)


def generate_ai_report_for_player(player_folder: Path) -> dict:
    """
    Generates an AI-style scouting report for one player.

    It first generates/refreshes the public player JSON data using the existing
    Automation Layer. Then it creates a JSON and Markdown AI report.
    """
    player_data = generate_one_player(player_folder)

    profile = player_data
    averages = player_data.get("averages", {})
    latest_game = player_data.get("latest_game", {})

    report = generate_player_ai_report(profile, averages, latest_game)
    markdown = generate_player_ai_report_markdown(report)

    slug = profile.get("slug") or player_folder.name

    json_output = REPORTS_OUTPUT_DIR / f"{slug}-ai-report.json"
    md_output = REPORTS_OUTPUT_DIR / f"{slug}-ai-report.md"

    export_json(report, json_output)
    export_markdown(markdown, md_output)

    print(f"✓ AI report generated: {profile.get('name', slug)} ({slug})")
    print(f"  JSON: {json_output}")
    print(f"  MD:   {md_output}")

    return report


def generate_ai_report_by_slug(slug: str) -> None:
    player_folder = PLAYERS_DIR / slug

    if not player_folder.exists():
        print(f"Player folder not found: {player_folder}")
        return

    generate_ai_report_for_player(player_folder)


def generate_ai_reports_for_all_players() -> None:
    player_folders = get_player_folders()

    if not player_folders:
        print(f"No player folders found in: {PLAYERS_DIR}")
        return

    generated_count = 0

    print(f"Players found: {len(player_folders)}")

    for player_folder in player_folders:
        try:
            generate_ai_report_for_player(player_folder)
            generated_count += 1
        except Exception as error:
            print(f"✗ Failed to generate AI report for: {player_folder.name}")
            print(f"Error: {error}")

    print("")
    print(f"AI reports generated: {generated_count}/{len(player_folders)}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate AI-style player reports from Orangeball Dreams data."
    )

    parser.add_argument(
        "--slug",
        help="Generate report only for one player, example: joana-soeiro",
    )

    return parser


def main(slug: str | None = None) -> None:
    REPORTS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if slug:
        generate_ai_report_by_slug(slug)
        return

    generate_ai_reports_for_all_players()


if __name__ == "__main__":
    parser = build_parser()
    args = parser.parse_args()

    main(slug=args.slug)