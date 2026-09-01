import argparse
import json
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


def clean_text(value) -> str:
    if value is None:
        return ""

    return str(value).strip()


def clean_number(value) -> float:
    if value is None or value == "":
        return 0

    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def clean_int(value) -> int:
    return int(clean_number(value))


def calculate_game_index(game: dict) -> float:
    points = clean_number(game.get("points"))
    rebounds = clean_number(game.get("rebounds"))
    assists = clean_number(game.get("assists"))
    steals = clean_number(game.get("steals"))
    blocks = clean_number(game.get("blocks"))
    minutes = clean_number(game.get("minutes"))

    index = (
        points
        + rebounds
        + assists
        + (steals * 2)
        + (blocks * 2)
        + (minutes * 0.125)
    )

    return round(index, 1)


def normalize_game(row, game_number: int) -> dict:
    game = {
        "game_number": game_number,
        "competition": clean_text(row.get("competition", "")),
        "season": clean_text(row.get("season", "")),
        "round": clean_text(row.get("round", "")),
        "opponent": clean_text(row.get("opponent", "")),
        "points": clean_int(row.get("points", 0)),
        "rebounds": clean_int(row.get("rebounds", 0)),
        "assists": clean_int(row.get("assists", 0)),
        "steals": clean_int(row.get("steals", 0)),
        "blocks": clean_int(row.get("blocks", 0)),
        "minutes": clean_int(row.get("minutes", 0)),
    }

    game["performance_index"] = calculate_game_index(game)

    return game


def build_games(stats) -> list[dict]:
    games = []

    for index, row in stats.iterrows():
        games.append(normalize_game(row, index + 1))

    return games


def build_averages_by_competition(stats) -> list[dict]:
    if not has_stats(stats):
        return []

    if "competition" not in stats.columns:
        return []

    if "season" not in stats.columns:
        return []

    competition_averages = []

    grouped_stats = stats.groupby(["season", "competition"], dropna=False)

    for (season, competition), group in grouped_stats:
        averages = calculate_player_averages(group)

        competition_averages.append(
            {
                "season": clean_text(season),
                "competition": clean_text(competition),
                "games_played": averages.get("games_played", 0),
                "ppg": averages.get("ppg", 0),
                "rpg": averages.get("rpg", 0),
                "apg": averages.get("apg", 0),
                "spg": averages.get("spg", 0),
                "bpg": averages.get("bpg", 0),
                "mpg": averages.get("mpg", 0),
                "performance_index": averages.get("performance_index", 0),
            }
        )

    competition_averages.sort(
        key=lambda item: (
            item.get("season", ""),
            item.get("competition", ""),
        ),
        reverse=True,
    )

    return competition_averages


def load_player_news(player_folder: Path) -> list[dict]:
    news_dir = player_folder / "news"

    if not news_dir.exists():
        return []

    news_items = []

    for news_file in sorted(news_dir.glob("*.json")):
        try:
            with news_file.open("r", encoding="utf-8") as file:
                item = json.load(file)

            news_items.append(
                {
                    "news_id": clean_text(item.get("news_id")),
                    "category": clean_text(item.get("category")),
                    "title": clean_text(item.get("title")),
                    "summary": clean_text(item.get("summary")),
                    "content": clean_text(item.get("content")),
                    "published_at": clean_text(item.get("published_at")),
                    "source_name": clean_text(item.get("source_name")),
                    "source_url": clean_text(item.get("source_url")),
                    "confidence": clean_number(item.get("confidence")),
                    "created_at": clean_text(item.get("created_at")),
                }
            )
        except Exception as error:
            print(f"Failed to load news file: {news_file.name}")
            print(f"Error: {error}")

    news_items.sort(
        key=lambda item: item.get("published_at") or item.get("created_at") or "",
        reverse=True,
    )

    return news_items


def generate_one_player(player_folder: Path) -> dict:
    player = load_player(player_folder)

    profile = player["profile"]
    stats = player["stats"]

    slug = profile.get("slug") or player_folder.name
    name = profile.get("name") or slug

    if has_stats(stats):
        averages = calculate_player_averages(stats)
        latest_game = get_latest_game(stats)
        games = build_games(stats)
        averages_by_competition = build_averages_by_competition(stats)
        summary = generate_player_summary(profile, averages, latest_game)
    else:
        averages = empty_averages()
        latest_game = empty_latest_game()
        games = []
        averages_by_competition = []
        summary = empty_summary(profile)

    news = load_player_news(player_folder)

    generated_at = datetime.now(timezone.utc).isoformat()

    player_data = {
        **profile,
        "schema_version": profile.get("schema_version", "1.0"),
        "content_type": "player_profile",
        "summary": summary,
        "averages": averages,
        "averages_by_competition": averages_by_competition,
        "latest_game": latest_game,
        "games": games,
        "news": news,
        "generated_at": generated_at,
        "source": {
            "type": "ai-engine",
            "player_slug": slug,
            "profile_source": "profile.json",
            "stats_source": "stats.csv",
            "news_source": "news/*.json",
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

    return sorted(
        [
            player_folder
            for player_folder in PLAYERS_DIR.iterdir()
            if player_folder.is_dir()
        ]
    )


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
        help="Generate only one player, example: joana-soeiro",
    )

    return parser


if __name__ == "__main__":
    parser = build_parser()
    args = parser.parse_args()

    main(slug=args.slug)