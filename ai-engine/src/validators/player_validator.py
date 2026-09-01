import json
from pathlib import Path


REQUIRED_SOURCE_FILES = [
    "profile.json",
    "stats.csv"
]


REQUIRED_PROFILE_FIELDS = [
    "slug",
    "name",
    "club",
    "position",
    "nationality"
]


REQUIRED_GENERATED_FIELDS = [
    "slug",
    "name",
    "club",
    "position",
    "nationality",
    "summary",
    "averages"
]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_source_players(players_dir: Path) -> list[str]:
    """
    Validates internal player source folders:
    ai-engine/data/players/{slug}/profile.json
    ai-engine/data/players/{slug}/stats.csv
    """
    errors = []

    if not players_dir.exists():
        return [f"Missing players source folder: {players_dir}"]

    player_folders = [
        folder for folder in players_dir.iterdir()
        if folder.is_dir()
    ]

    if not player_folders:
        return [f"No player folders found in: {players_dir}"]

    for player_folder in player_folders:
        slug = player_folder.name

        for required_file in REQUIRED_SOURCE_FILES:
            file_path = player_folder / required_file

            if not file_path.exists():
                errors.append(f"{slug}: missing {required_file}")

        profile_path = player_folder / "profile.json"

        if not profile_path.exists():
            continue

        try:
            profile = load_json(profile_path)
        except json.JSONDecodeError as error:
            errors.append(f"{slug}: invalid profile.json - {error}")
            continue

        for field in REQUIRED_PROFILE_FIELDS:
            if not profile.get(field):
                errors.append(f"{slug}: profile.json missing required field '{field}'")

        profile_slug = profile.get("slug")

        if profile_slug and profile_slug != slug:
            errors.append(
                f"{slug}: folder name does not match profile slug '{profile_slug}'"
            )

    return errors


def validate_generated_players(generated_players_dir: Path) -> list[str]:
    """
    Validates public generated player files:
    public/generated/players/{slug}.json
    public/generated/players/index.json
    """
    errors = []

    if not generated_players_dir.exists():
        return [f"Missing generated players folder: {generated_players_dir}"]

    index_path = generated_players_dir / "index.json"

    if not index_path.exists():
        errors.append("Missing public/generated/players/index.json")
    else:
        try:
            index_data = load_json(index_path)

            if not isinstance(index_data, list):
                errors.append("index.json must be a JSON list")

            for index, item in enumerate(index_data):
                if not isinstance(item, dict):
                    errors.append(f"index.json item {index} is not an object")
                    continue

                if not item.get("slug"):
                    errors.append(f"index.json item {index} missing slug")

                if not item.get("name"):
                    errors.append(f"index.json item {index} missing name")

        except json.JSONDecodeError as error:
            errors.append(f"Invalid index.json - {error}")

    player_files = [
        file for file in generated_players_dir.glob("*.json")
        if file.name != "index.json"
    ]

    if not player_files:
        errors.append("No generated player JSON files found")

    for player_file in player_files:
        try:
            player = load_json(player_file)
        except json.JSONDecodeError as error:
            errors.append(f"{player_file.name}: invalid JSON - {error}")
            continue

        for field in REQUIRED_GENERATED_FIELDS:
            if field not in player:
                errors.append(f"{player_file.name}: missing generated field '{field}'")

        file_slug = player_file.stem
        player_slug = player.get("slug")

        if player_slug and player_slug != file_slug:
            errors.append(
                f"{player_file.name}: file name does not match player slug '{player_slug}'"
            )

    return errors