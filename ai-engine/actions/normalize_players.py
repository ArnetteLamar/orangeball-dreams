import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
PLAYERS_DIR = BASE_DIR / "data" / "players"


DEFAULT_PROFILE = {
    "schema_version": "1.0",
    "slug": "",
    "name": "",
    "club": "",
    "position": "",
    "nationality": "",
    "gender": "",
    "birth_date": "",
    "height_cm": None,
    "league": "",
    "photo": "",
    "highlight_video": "",
    "status": "active",
    "featured": False,
    "tags": [],
    "bio": "",
    "instagram": "",
    "youtube": "",
    "agent_notes": ""
}


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}

    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )


def normalize_profile(player_dir: Path) -> bool:
    profile_path = player_dir / "profile.json"
    metadata_path = player_dir / "metadata.json"

    if not profile_path.exists():
        print(f"SKIP - Missing profile.json in {player_dir.name}")
        return False

    profile = load_json(profile_path)
    original_profile = dict(profile)

    slug = profile.get("slug") or player_dir.name
    name = profile.get("name") or slug.replace("-", " ").title()

    normalized = dict(DEFAULT_PROFILE)
    normalized.update(profile)

    normalized["slug"] = slugify(slug)
    normalized["name"] = name

    if not normalized.get("photo"):
        normalized["photo"] = f"/images/players/{normalized['slug']}.jpg"

    if normalized.get("height_cm") == "":
        normalized["height_cm"] = None

    if isinstance(normalized.get("height_cm"), str):
        value = normalized["height_cm"].strip()
        normalized["height_cm"] = int(value) if value.isdigit() else None

    if not isinstance(normalized.get("tags"), list):
        normalized["tags"] = []

    for folder in ["photos", "videos", "news"]:
        (player_dir / folder).mkdir(exist_ok=True)

    now = datetime.now(timezone.utc).isoformat()

    metadata = load_json(metadata_path)

    if not metadata:
        metadata = {
            "schema_version": "1.0",
            "slug": normalized["slug"],
            "created_at": now,
            "source": "normalize_players.py",
            "generated": False,
            "notes": ""
        }

    metadata["slug"] = normalized["slug"]
    metadata["updated_at"] = now
    metadata["last_normalized_by"] = "normalize_players.py"

    save_json(profile_path, normalized)
    save_json(metadata_path, metadata)

    changed = normalized != original_profile

    if changed:
        print(f"OK - Normalized {normalized['name']} ({normalized['slug']})")
    else:
        print(f"OK - Already normalized {normalized['name']} ({normalized['slug']})")

    return True


def main() -> None:
    print("")
    print("Orangeball Dreams - Normalize Players")
    print("=" * 60)

    if not PLAYERS_DIR.exists():
        print(f"ERROR - Players folder not found: {PLAYERS_DIR}")
        return

    player_dirs = sorted([
        folder for folder in PLAYERS_DIR.iterdir()
        if folder.is_dir()
    ])

    if not player_dirs:
        print("No players found.")
        return

    count = 0

    for player_dir in player_dirs:
        if normalize_profile(player_dir):
            count += 1

    print("")
    print(f"Players normalized: {count}/{len(player_dirs)}")
    print("")
    print("Next step:")
    print("npm run obd:generate")


if __name__ == "__main__":
    main()