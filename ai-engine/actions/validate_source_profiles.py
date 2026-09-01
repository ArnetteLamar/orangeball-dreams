import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]

PLAYERS_DIR = BASE_DIR / "data" / "players"
SOURCE_PLAYERS_DIR = BASE_DIR / "data" / "sources" / "players"


REQUIRED_PROFILE_FIELDS = [
    "schema_version",
    "player_slug",
    "player_name",
    "status",
    "sources",
]

REQUIRED_SOURCE_FIELDS = [
    "source_id",
    "source_name",
    "status",
    "trust_level",
    "profile_url",
    "external_player_id",
    "last_checked_at",
    "notes",
]


def load_json(file_path: Path) -> dict:
    with file_path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def get_player_slugs() -> set[str]:
    if not PLAYERS_DIR.exists():
        return set()

    return {
        folder.name
        for folder in PLAYERS_DIR.iterdir()
        if folder.is_dir()
    }


def validate_required_fields(data: dict, required_fields: list[str]) -> list[str]:
    errors = []

    for field in required_fields:
        if field not in data:
            errors.append(f"Missing field: {field}")

    return errors


def validate_source_profile(file_path: Path, existing_player_slugs: set[str]) -> list[str]:
    errors = []

    try:
        data = load_json(file_path)
    except Exception as error:
        return [f"Invalid JSON: {error}"]

    errors.extend(validate_required_fields(data, REQUIRED_PROFILE_FIELDS))

    player_slug = data.get("player_slug")

    if player_slug and player_slug not in existing_player_slugs:
        errors.append(f"Player slug does not exist in ai-engine/data/players: {player_slug}")

    sources = data.get("sources")

    if not isinstance(sources, list):
        errors.append("sources must be a list")
        return errors

    if len(sources) == 0:
        errors.append("sources cannot be empty")

    for index, source in enumerate(sources):
        if not isinstance(source, dict):
            errors.append(f"sources[{index}] must be an object")
            continue

        source_errors = validate_required_fields(source, REQUIRED_SOURCE_FIELDS)

        for source_error in source_errors:
            errors.append(f"sources[{index}]: {source_error}")

        if source.get("status") not in ["active", "planned", "disabled"]:
            errors.append(
                f"sources[{index}]: invalid status '{source.get('status')}'"
            )

    return errors


def validate_all_source_profiles() -> bool:
    if not SOURCE_PLAYERS_DIR.exists():
        print(f"Source profiles folder not found: {SOURCE_PLAYERS_DIR}")
        return False

    source_files = sorted(SOURCE_PLAYERS_DIR.glob("*.json"))
    existing_player_slugs = get_player_slugs()

    if not source_files:
        print(f"No source profile files found in: {SOURCE_PLAYERS_DIR}")
        return False

    total_errors = 0

    print("")
    print("Validating source profiles")
    print(f"Folder: {SOURCE_PLAYERS_DIR}")
    print(f"Files found: {len(source_files)}")
    print("")

    for source_file in source_files:
        errors = validate_source_profile(source_file, existing_player_slugs)

        if errors:
            total_errors += len(errors)
            print(f"✗ {source_file.name}")

            for error in errors:
                print(f"  - {error}")
        else:
            print(f"✓ {source_file.name}")

    print("")
    print("=" * 60)

    if total_errors == 0:
        print("Source profiles validation passed")
        return True

    print(f"Source profiles validation failed with {total_errors} error(s)")
    return False


def main() -> None:
    valid = validate_all_source_profiles()

    if not valid:
        raise SystemExit(1)


if __name__ == "__main__":
    main()