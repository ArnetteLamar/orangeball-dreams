import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]

SOURCE_PROFILES_DIR = BASE_DIR / "data" / "sources" / "players"


def load_json(file_path: Path) -> dict:
    with file_path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def is_source_ready(source: dict) -> bool:
    return (
        source.get("status") == "active"
        and bool(str(source.get("profile_url", "")).strip())
        and bool(str(source.get("external_player_id", "")).strip())
    )


def get_source_status(source: dict) -> str:
    if source.get("status") != "active":
        return "not_active"

    if not str(source.get("profile_url", "")).strip():
        return "missing_profile_url"

    if not str(source.get("external_player_id", "")).strip():
        return "missing_external_player_id"

    return "ready"


def check_source_readiness() -> bool:
    if not SOURCE_PROFILES_DIR.exists():
      print(f"Source profiles folder not found: {SOURCE_PROFILES_DIR}")
      return False

    source_files = sorted(SOURCE_PROFILES_DIR.glob("*.json"))

    if not source_files:
        print(f"No source profile files found in: {SOURCE_PROFILES_DIR}")
        return False

    total_sources = 0
    ready_sources = 0
    not_ready_sources = 0

    print("")
    print("Orangeball Dreams - Source Readiness Check")
    print("=" * 60)

    for source_file in source_files:
        profile = load_json(source_file)

        player_name = profile.get("player_name", source_file.stem)
        player_slug = profile.get("player_slug", source_file.stem)
        sources = profile.get("sources", [])

        print("")
        print(f"{player_name} ({player_slug})")
        print("-" * 60)

        if not sources:
            print("ERROR - No sources configured")
            not_ready_sources += 1
            continue

        for source in sources:
            total_sources += 1

            status = get_source_status(source)

            if status == "ready":
                ready_sources += 1
                icon = "READY"
            else:
                not_ready_sources += 1
                icon = "NOT READY"

            print(f"{icon} - {source.get('source_id', 'unknown')}")
            print(f"  Status: {source.get('status', 'unknown')}")
            print(f"  Trust: {source.get('trust_level', 'unknown')}")
            print(f"  Profile URL: {source.get('profile_url') or 'missing'}")
            print(f"  External ID: {source.get('external_player_id') or 'missing'}")
            print(f"  Readiness: {status}")

    print("")
    print("=" * 60)
    print(f"Total sources: {total_sources}")
    print(f"Ready sources: {ready_sources}")
    print(f"Not ready sources: {not_ready_sources}")

    return not_ready_sources == 0


def main() -> None:
    is_ready = check_source_readiness()

    if not is_ready:
        raise SystemExit(1)


if __name__ == "__main__":
    main()