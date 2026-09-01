import json
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]

SOURCE_PROFILES_DIR = BASE_DIR / "data" / "sources" / "players"
RAW_SOURCES_DIR = BASE_DIR / "data" / "sources" / "raw"


def load_json(file_path: Path) -> dict:
    with file_path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def write_json(file_path: Path, data: dict) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)

    with file_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def is_source_ready(source: dict) -> bool:
    return (
        source.get("status") == "active"
        and bool(str(source.get("profile_url", "")).strip())
        and bool(str(source.get("external_player_id", "")).strip())
    )


def build_raw_source_payload(profile: dict, source: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()

    return {
        "schema_version": "1.0",
        "source_id": source.get("source_id", ""),
        "player_slug": profile.get("player_slug", ""),
        "player_name": profile.get("player_name", ""),
        "collected_at": now,
        "status": "raw_placeholder",
        "source_url": source.get("profile_url", ""),
        "external_player_id": source.get("external_player_id", ""),
        "confidence": 0.8,
        "raw_data": {
            "competition": "",
            "season": "",
            "round": "",
            "opponent": "",
            "points": 0,
            "rebounds": 0,
            "assists": 0,
            "steals": 0,
            "blocks": 0,
            "minutes": 0
        },
        "notes": (
            "Raw placeholder criado a partir de source profile ready. "
            "Ainda falta recolher/preencher dados reais da fonte."
        ),
    }


def create_raw_files_from_ready_sources() -> dict:
    if not SOURCE_PROFILES_DIR.exists():
        raise FileNotFoundError(
            f"Source profiles folder not found: {SOURCE_PROFILES_DIR}"
        )

    source_files = sorted(SOURCE_PROFILES_DIR.glob("*.json"))

    created = 0
    skipped_not_ready = 0
    skipped_existing = 0
    failed = 0

    print("")
    print("Orangeball Dreams - Create Raw From Ready Sources")
    print("=" * 60)

    for source_file in source_files:
        try:
            profile = load_json(source_file)
            player_slug = profile.get("player_slug") or source_file.stem
            sources = profile.get("sources", [])

            if not isinstance(sources, list):
                print(f"ERROR - Invalid sources list: {source_file.name}")
                failed += 1
                continue

            for source in sources:
                source_id = source.get("source_id", "unknown")

                if not is_source_ready(source):
                    print(f"SKIP - {player_slug} / {source_id} is not ready")
                    skipped_not_ready += 1
                    continue

                output_file = RAW_SOURCES_DIR / f"{player_slug}-{source_id}-ready-raw.json"

                if output_file.exists():
                    print(f"SKIP - Raw already exists: {output_file.name}")
                    skipped_existing += 1
                    continue

                payload = build_raw_source_payload(profile, source)
                write_json(output_file, payload)

                print(f"CREATED - {output_file.name}")
                created += 1

        except Exception as error:
            print(f"ERROR - Failed to process {source_file.name}: {error}")
            failed += 1

    print("")
    print("=" * 60)
    print(f"Created raw files: {created}")
    print(f"Skipped not ready: {skipped_not_ready}")
    print(f"Skipped existing: {skipped_existing}")
    print(f"Failed: {failed}")

    return {
        "status": "ok",
        "created": created,
        "skipped_not_ready": skipped_not_ready,
        "skipped_existing": skipped_existing,
        "failed": failed,
    }


def main() -> None:
    result = create_raw_files_from_ready_sources()

    if result["failed"] > 0:
        raise SystemExit(1)


if __name__ == "__main__":
    main()