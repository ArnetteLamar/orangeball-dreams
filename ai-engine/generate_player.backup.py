import argparse
from datetime import datetime, timezone
from pathlib import Path

from src.loaders.player_loader import load_player
from src.processors.player_processor import (
    calculate_player_averages,
    get_latest_game,
)
from src.generators.player_summary_generator import generate_player_summary
from src.exporters.player_exporter import export_player_json


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

PLAYERS_DIR = BASE_DIR / "data" / "players"
OUTPUT_DIR = PROJECT_ROOT / "public" / "generated" / "players"


def has_stats(stats) -> bool:
    return hasattr(stats, "empty") and not stats.empty


def empty_averages() -> dict:
    return {
        "games_played": 0,
        "ppg": 0,
        "rpg": 0,
        "apg": 0,
        "spg": 0,
        "bpg": 0,
        "mpg": 0,
        "performance_index": 0,
    }


def empty_latest_game() -> dict:
    return {
        "competition": "",
        "season": "",
        "round": "No games registered yet",
        "opponent": "",
        "points": 0,
        "rebounds": 0,
        "assists": 0,
        "steals": 0,
        "blocks": 0,
        "minutes": 0,
        "performance_index": 0,
    }


def empty_summary(profile: dict) -> str:
    name = profile.get("name", "This player")
    club = profile.get("club", "")
    position = profile.get("position", "")

    details = " ".join([club, position]).strip()

    if details:
        return (
            f"{name} has been added to Orangeball Dreams. "
            "Full performance data will appear once official game stats are registered."
        )

    return (
        f"{name} has been added to Orangeball Dreams. "
        "Full profile and performance data will be completed soon."
    )


def generate_one_player(player_folder: Path) -> dict:
    player = load_player(player_folder)

    profile = player["profile"]
    stats = player["stats"]

    slug = profile.get("slug") or player_folder.name
    name = profile.get("name") or slug

    if has_stats(stats):
        averages = calculate_player_averages(stats)
        latest_game = get_latest_game(stats)
        summary = generate_player_summary(profile, averages, latest_game)
    else:
        averages = empty_averages()
        latest_game = empty_latest_game()
        summary = empty_summary(profile)

    generated_at = datetime.now(timezone.utc).isoformat()

    player_data = {
        **profile,
        "schema_version": profile.get("schema_version", "1.0"),
        "content_type": "player_profile",
        "summary": summary,
        "averages": averages,
        "latest_game": latest_game,
        "generated_at": generated_at,
        "source": {
            "type": "ai-engine",
            "player_slug": slug,
            "profile_source": "profile.json",
            "stats_source": "stats.csv",
        },
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    output_file = OUTPUT_DIR / f"{slug}.json"
    export_player_json(player_data, output_file)

    print(f"✓ Player generated: {name} ({slug})")

    return player_data


def get_player_folders() -> list[Path]:
    if not PLAYERS_DIR.exists():
        return []

    return sorted([
        player_folder
        for player_folder in PLAYERS_DIR.iterdir()
        if player_folder.is_dir()
    ])


def generate_all_players() -> None:
    player_folders = get_player_folders()

    if not player_folders:
        print(f"No player folders found in: {PLAYERS_DIR}")
        return

    print(f"Players found: {len(player_folders)}")

    generated_count = 0

    for player_folder in player_folders:
        try:
            generate_one_player(player_folder)
            generated_count += 1
        except Exception as error:
            print(f"✗ Failed to generate player from folder: {player_folder.name}")
            print(f"Error: {error}")

    print("")
    print(f"Generated players: {generated_count}/{len(player_folders)}")


def generate_player_by_slug(slug: str) -> None:
    player_folder = PLAYERS_DIR / slug

    if not player_folder.exists():
        print(f"Player folder not found: {player_folder}")
        return

    generate_one_player(player_folder)


def main(slug: str | None = None) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if slug:
        generate_player_by_slug(slug)
        return

    generate_all_players()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate public player JSON files from AI Engine source data."
    )

    parser.add_argument(
        "--slug",
        help="Generate only one player, example: joana-soeiro"
    )

    return parser


if __name__ == "__main__":
    parser = build_parser()
    args = parser.parse_args()

    main(slug=args.slug)