import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

PENDING_DIR = ROOT / "ai-engine" / "data" / "news" / "pending"
REJECTED_DIR = ROOT / "ai-engine" / "data" / "news" / "rejected"


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


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(
            "Usage: python ai-engine/scripts/reject_news_proposal.py pending-file-name.json"
        )

    pending_path = find_pending_file(sys.argv[1])
    proposal = load_json(pending_path)

    if proposal.get("proposal_type") != "news_update":
        raise ValueError("Only news_update proposals can be rejected here.")

    if proposal.get("status") != "pending":
        raise ValueError("Only pending proposals can be rejected.")

    proposal["status"] = "rejected"
    proposal["rejected_at"] = datetime.now(timezone.utc).isoformat()

    REJECTED_DIR.mkdir(parents=True, exist_ok=True)

    rejected_path = REJECTED_DIR / pending_path.name

    save_json(rejected_path, proposal)
    pending_path.unlink()

    print("News proposal rejected successfully.")
    print(f"Rejected file: {rejected_path}")


if __name__ == "__main__":
    main()