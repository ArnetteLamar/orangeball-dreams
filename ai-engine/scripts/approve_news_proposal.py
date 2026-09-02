import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

PENDING_DIR = ROOT / "ai-engine" / "data" / "news" / "pending"
APPROVED_DIR = ROOT / "ai-engine" / "data" / "news" / "approved"
HOME_NEWS_DIR = ROOT / "ai-engine" / "data" / "news" / "home"
GENERATE_HOME_NEWS_SCRIPT = ROOT / "ai-engine" / "scripts" / "generate_home_news.py"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


def find_pending_file(value: str) -> Path:
    candidate = Path(value)

    if candidate.exists():
        return candidate.resolve()

    by_name = PENDING_DIR / value

    if by_name.exists():
        return by_name.resolve()

    if not value.endswith(".json"):
        by_name_with_extension = PENDING_DIR / f"{value}.json"

        if by_name_with_extension.exists():
            return by_name_with_extension.resolve()

    raise FileNotFoundError(f"Pending proposal not found: {value}")


def approve_homepage_news(proposal: dict) -> Path:
    data = proposal.get("data", {})

    if not data.get("id"):
        raise ValueError("Proposal data is missing id.")

    if not data.get("date"):
        raise ValueError("Proposal data is missing date.")

    news_item = {
        "id": data["id"],
        "date": data["date"],
        "homepage": data.get("homepage", True),
        "category": data["category"],
        "title": data["title"],
        "summary": data["summary"],
        "image": data.get("image", ""),
        "player_slug": data.get("player_slug", ""),
        "href": data["href"],
        "source": data["source"],
    }

    output_path = HOME_NEWS_DIR / f"{data['id']}.json"
    save_json(output_path, news_item)

    return output_path


def regenerate_home_news() -> None:
    subprocess.run(
        [sys.executable, str(GENERATE_HOME_NEWS_SCRIPT)],
        cwd=ROOT,
        check=True,
    )


def archive_proposal(pending_path: Path, proposal: dict) -> Path:
    APPROVED_DIR.mkdir(parents=True, exist_ok=True)

    proposal["status"] = "approved"
    proposal["approved_at"] = datetime.now(timezone.utc).isoformat()

    archived_path = APPROVED_DIR / pending_path.name
    save_json(archived_path, proposal)

    pending_path.unlink()

    return archived_path


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(
            "Usage: python ai-engine/scripts/approve_news_proposal.py pending-file-name.json"
        )

    pending_path = find_pending_file(sys.argv[1])
    proposal = load_json(pending_path)

    if proposal.get("proposal_type") != "news_update":
        raise ValueError("Only news_update proposals can be approved here.")

    if proposal.get("status") != "pending":
        raise ValueError("Only pending proposals can be approved.")

    target = proposal.get("target")

    if target not in {"homepage", "both"}:
        raise ValueError(
            "This approval script currently supports only target 'homepage' or 'both'."
        )

    news_path = approve_homepage_news(proposal)
    archived_path = archive_proposal(pending_path, proposal)

    regenerate_home_news()

    print("News proposal approved successfully.")
    print(f"News file: {news_path}")
    print(f"Archived proposal: {archived_path}")
    print("Generated public/generated/news/home.json")


if __name__ == "__main__":
    main()