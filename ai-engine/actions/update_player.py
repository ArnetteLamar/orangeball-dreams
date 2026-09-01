import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
PLAYERS_DIR = BASE_DIR / "data" / "players"


def load_profile(player_slug):
    profile_path = PLAYERS_DIR / player_slug / "profile.json"

    if not profile_path.exists():
        raise FileNotFoundError(f"Player profile not found: {profile_path}")

    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    return profile_path, profile


def save_profile(profile_path, profile):
    profile_path.write_text(
        json.dumps(profile, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )


def update_player():
    player_slug = input("Player slug: ").strip()

    profile_path, profile = load_profile(player_slug)

    print("\nWhat do you want to update?")
    print("1 - Club")
    print("2 - Position")
    print("3 - Nationality")
    print("4 - Photo")
    print("5 - Highlight video")

    option = input("Choose option: ").strip()

    fields = {
        "1": ("club", "New club: "),
        "2": ("position", "New position: "),
        "3": ("nationality", "New nationality: "),
        "4": ("photo", "New photo path: "),
        "5": ("highlight_video", "New highlight video URL: "),
    }

    if option not in fields:
        print("Invalid option.")
        return

    field, question = fields[option]
    new_value = input(question).strip()

    old_value = profile.get(field, "")
    profile[field] = new_value

    save_profile(profile_path, profile)

    print("\nPlayer updated successfully.")
    print(f"{field}: {old_value} → {new_value}")


if __name__ == "__main__":
    update_player()