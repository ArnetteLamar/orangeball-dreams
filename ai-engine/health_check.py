from pathlib import Path
import json


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

SOURCE_PLAYERS = BASE_DIR / "data" / "players"
SOURCE_PROFILES = BASE_DIR / "data" / "sources" / "players"

GENERATED_PLAYERS = PROJECT_ROOT / "public" / "generated" / "players"
GENERATED_REPORTS = PROJECT_ROOT / "public" / "generated" / "reports"
MANIFEST = PROJECT_ROOT / "public" / "generated" / "manifest.json"


REQUIRED_SOURCE_PROFILE_FIELDS = [
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

VALID_SOURCE_STATUSES = {"active", "planned", "disabled"}
VALID_TRUST_LEVELS = {"high", "medium", "low", "verified_by_admin"}


def check_file(path, label):
    if path.exists():
        print(f"OK - {label}")
        return True

    print(f"ERROR - Missing {label}: {path}")
    return False


def check_json(path, label):
    if not check_file(path, label):
        return False

    try:
        json.loads(path.read_text(encoding="utf-8-sig"))
        print(f"OK - {label} is valid JSON")
        return True
    except Exception as error:
        print(f"ERROR - {label} invalid JSON: {error}")
        return False


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def get_player_slugs():
    if not SOURCE_PLAYERS.exists():
        return set()

    return {
        folder.name
        for folder in SOURCE_PLAYERS.iterdir()
        if folder.is_dir()
    }


def validate_required_fields(data, required_fields, label):
    errors = []

    for field in required_fields:
        if field not in data:
            errors.append(f"{label}: missing field '{field}'")

    return errors


def validate_source_profile_file(profile_file, existing_player_slugs):
    errors = []

    try:
        data = load_json(profile_file)
    except Exception as error:
        return [f"Invalid JSON: {error}"]

    errors.extend(
        validate_required_fields(
            data,
            REQUIRED_SOURCE_PROFILE_FIELDS,
            profile_file.name,
        )
    )

    player_slug = data.get("player_slug")

    if player_slug and player_slug not in existing_player_slugs:
        errors.append(
            f"Player slug does not exist in ai-engine/data/players: {player_slug}"
        )

    if player_slug and profile_file.stem != player_slug:
        errors.append(
            f"File name does not match player_slug: {profile_file.stem} != {player_slug}"
        )

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

        errors.extend(
            validate_required_fields(
                source,
                REQUIRED_SOURCE_FIELDS,
                f"sources[{index}]",
            )
        )

        source_status = source.get("status")

        if source_status not in VALID_SOURCE_STATUSES:
            errors.append(
                f"sources[{index}]: invalid status '{source_status}'"
            )

        trust_level = source.get("trust_level")

        if trust_level not in VALID_TRUST_LEVELS:
            errors.append(
                f"sources[{index}]: invalid trust_level '{trust_level}'"
            )

    return errors


def check_source_profiles():
    print("")
    print("Checking source profiles")
    print("-" * 60)

    ok = True

    if not check_file(SOURCE_PROFILES, "source profiles folder"):
        return False

    existing_player_slugs = get_player_slugs()
    source_profile_files = sorted(SOURCE_PROFILES.glob("*.json"))
    source_profile_slugs = {file.stem for file in source_profile_files}

    if not source_profile_files:
        print(f"ERROR - No source profile files found in: {SOURCE_PROFILES}")
        return False

    missing_profiles = sorted(existing_player_slugs - source_profile_slugs)

    for slug in missing_profiles:
        print(f"ERROR - Missing source profile for player: {slug}")
        ok = False

    orphan_profiles = sorted(source_profile_slugs - existing_player_slugs)

    for slug in orphan_profiles:
        print(f"ERROR - Source profile without matching player folder: {slug}")
        ok = False

    for profile_file in source_profile_files:
        errors = validate_source_profile_file(profile_file, existing_player_slugs)

        if errors:
            ok = False
            print(f"ERROR - {profile_file.name}")

            for error in errors:
                print(f"  - {error}")
        else:
            print(f"OK - {profile_file.name}")

    return ok


def main():
    print("")
    print("Orangeball Dreams - Automation Health Check")
    print("=" * 60)

    ok = True

    ok = check_file(SOURCE_PLAYERS, "source players folder") and ok
    ok = check_file(GENERATED_PLAYERS, "generated players folder") and ok
    ok = check_file(GENERATED_REPORTS, "generated reports folder") and ok
    ok = check_json(GENERATED_PLAYERS / "index.json", "players index") and ok
    ok = check_json(MANIFEST, "manifest") and ok

    ok = check_source_profiles() and ok

    player_files = list(GENERATED_PLAYERS.glob("*.json"))
    report_files = list(GENERATED_REPORTS.glob("report_*.json"))

    print("")
    print(
        f"Generated player files: "
        f"{len([file for file in player_files if file.name != 'index.json'])}"
    )
    print(f"Generated report files: {len(report_files)}")

    print("")
    if ok:
        print("HEALTH CHECK PASSED")
        print("Automation Layer is healthy.")
    else:
        print("HEALTH CHECK FAILED")
        print("Run:")
        print("  npm run obd:source-profiles")
        print("  npm run obd:generate")
        raise SystemExit(1)


if __name__ == "__main__":
    main()