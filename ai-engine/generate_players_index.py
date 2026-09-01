import json
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

GENERATED_PLAYERS_DIR = PROJECT_ROOT / "public" / "generated" / "players"
OUTPUT_FILE = GENERATED_PLAYERS_DIR / "index.json"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )


def get_generated_player_files() -> list[Path]:
    if not GENERATED_PLAYERS_DIR.exists():
        return []

    return sorted([
        path
        for path in GENERATED_PLAYERS_DIR.glob("*.json")
        if path.name != "index.json"
    ])


def build_player_index_item(player: dict) -> dict:
    averages = player.get("averages") or {}

    return {
        "slug": player.get("slug", ""),
        "name": player.get("name", ""),
        "club": player.get("club", ""),
        "position": player.get("position", ""),
        "nationality": player.get("nationality", ""),
        "gender": player.get("gender", ""),
        "league": player.get("league", ""),
        "photo": player.get("photo", ""),
        "status": player.get("status", "active"),
        "summary": player.get("summary", ""),
        "averages": {
            "games_played": averages.get("games_played", 0),
            "ppg": averages.get("ppg", 0),
            "rpg": averages.get("rpg", 0),
            "apg": averages.get("apg", 0),
            "spg": averages.get("spg", 0),
            "bpg": averages.get("bpg", 0),
            "mpg": averages.get("mpg", 0),
            "performance_index": averages.get("performance_index", 0),
        },
        "generated_at": player.get("generated_at", ""),
    }


def validate_index_item(item: dict, source_file: Path) -> list[str]:
    errors = []

    required_fields = ["slug", "name"]

    for field in required_fields:
        if not item.get(field):
            errors.append(f"{source_file.name}: missing required field '{field}'")

    return errors


def main() -> None:
    player_files = get_generated_player_files()

    if not player_files:
        print(f"No generated player files found in: {GENERATED_PLAYERS_DIR}")
        return

    players = []
    errors = []

    for player_file in player_files:
        try:
            player = load_json(player_file)
            index_item = build_player_index_item(player)

            item_errors = validate_index_item(index_item, player_file)

            if item_errors:
                errors.extend(item_errors)
                continue

            if index_item["status"] != "archived":
                players.append(index_item)

        except json.JSONDecodeError as error:
            errors.append(f"{player_file.name}: invalid JSON - {error}")

        except Exception as error:
            errors.append(f"{player_file.name}: failed to process file - {error}")

    if errors:
        print("Players index generation failed:")
        for error in errors:
            print(f"- {error}")
        return

    players = sorted(players, key=lambda player: player["name"].lower())

    save_json(OUTPUT_FILE, players)

    print("Players index generated successfully.")
    print(f"Players indexed: {len(players)}")
    print(f"Generated at: {datetime.now(timezone.utc).isoformat()}")
    print(f"Output: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()