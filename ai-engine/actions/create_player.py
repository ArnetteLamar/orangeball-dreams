import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
PLAYERS_DIR = BASE_DIR / "data" / "players"


ALLOWED_PROFILE_FIELDS = {
    "name": "Player full name",
    "club": "Current club",
    "position": "Player position",
    "nationality": "Player nationality",
    "gender": "Player gender",
    "birth_date": "Birth date YYYY-MM-DD",
    "height_cm": "Height in centimeters",
    "league": "Current league",
    "photo": "Photo path",
    "highlight_video": "Highlight video URL",
    "status": "Player status"
}


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}

    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )


def load_profile(player_slug: str) -> tuple[Path, dict]:
    profile_path = PLAYERS_DIR / player_slug / "profile.json"

    if not profile_path.exists():
        raise FileNotFoundError(f"Player profile not found: {profile_path}")

    profile = load_json(profile_path)
    return profile_path, profile


def update_metadata(player_slug: str) -> None:
    metadata_path = PLAYERS_DIR / player_slug / "metadata.json"
    metadata = load_json(metadata_path)

    now = datetime.now(timezone.utc).isoformat()

    if not metadata:
        metadata = {
            "schema_version": "1.0",
            "slug": player_slug,
            "created_at": now,
            "source": "update_player.py",
            "generated": False,
            "notes": ""
        }

    metadata["updated_at"] = now
    metadata["last_updated_by"] = "update_player.py"

    save_json(metadata_path, metadata)


def parse_value(field: str, value: str):
    """
    Converts some fields to the right data type.
    Example: height_cm should be saved as number, not text.
    """
    value = value.strip()

    if value.lower() in ["none", "null"]:
        return None

    if field == "height_cm":
        return int(value) if value.isdigit() else None

    return value


def choose_slug(args: argparse.Namespace) -> str:
    if args.slug:
        return args.slug.strip()

    return input("Player slug: ").strip()


def choose_field(args: argparse.Namespace) -> str:
    if args.field:
        return args.field.strip()

    print("")
    print("Available fields:")

    fields = list(ALLOWED_PROFILE_FIELDS.keys())

    for index, field in enumerate(fields, start=1):
        description = ALLOWED_PROFILE_FIELDS[field]
        print(f"{index} - {field} ({description})")

    print(f"{len(fields) + 1} - Custom field")

    option = input("Choose option: ").strip()

    if option.isdigit():
        option_number = int(option)

        if 1 <= option_number <= len(fields):
            return fields[option_number - 1]

        if option_number == len(fields) + 1:
            return input("Custom field name: ").strip()

    print("Invalid option.")
    return ""


def choose_value(args: argparse.Namespace, field: str) -> str:
    if args.value is not None:
        return args.value

    return input(f"New value for {field}: ").strip()


def update_player(args: argparse.Namespace) -> None:
    player_slug = choose_slug(args)

    if not player_slug:
        print("Player slug is required.")
        return

    profile_path, profile = load_profile(player_slug)

    if args.list_fields:
        print("")
        print("Current profile fields:")
        for key, value in profile.items():
            print(f"{key}: {value}")
        return

    field = choose_field(args)

    if not field:
        return

    if field not in ALLOWED_PROFILE_FIELDS and not args.allow_new_field:
        print("")
        print(f"Field '{field}' is not in the allowed profile fields.")
        print("Use --allow-new-field if you really want to add it.")
        return

    new_value_raw = choose_value(args, field)
    new_value = parse_value(field, new_value_raw)

    old_value = profile.get(field, None)
    profile[field] = new_value

    save_json(profile_path, profile)
    update_metadata(player_slug)

    print("")
    print("Player updated successfully.")
    print(f"Slug: {player_slug}")
    print(f"Field: {field}")
    print(f"Old value: {old_value}")
    print(f"New value: {new_value}")
    print("")
    print("Next step:")
    print("python ai-engine/generate_all.py")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Update a player profile inside ai-engine/data/players."
    )

    parser.add_argument("--slug", help="Player slug, example: joana-soeiro")
    parser.add_argument("--field", help="Profile field to update, example: club")
    parser.add_argument("--value", help="New value for the selected field")
    parser.add_argument(
        "--allow-new-field",
        action="store_true",
        help="Allow adding a field that is not in the default profile schema"
    )
    parser.add_argument(
        "--list-fields",
        action="store_true",
        help="List current fields and values for the selected player"
    )

    return parser


if __name__ == "__main__":
    parser = build_parser()
    update_player(parser.parse_args())