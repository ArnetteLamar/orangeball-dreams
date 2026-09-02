import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PENDING_DIR = ROOT / "ai-engine" / "data" / "news" / "pending"

ALLOWED_TARGETS = {"homepage", "player_profile", "both"}
REQUIRED_DATA_FIELDS = ["id", "date", "category", "title", "summary", "href", "source"]


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value)
    return value.strip("-")


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def validate_localized_field(field_name: str, value) -> None:
    if not isinstance(value, dict):
        raise ValueError(f"{field_name} must be an object with 'es' and 'en'.")

    if not value.get("es") or not value.get("en"):
        raise ValueError(f"{field_name} must include both 'es' and 'en'.")


def validate_agent_output(output: dict) -> None:
    if output.get("proposal_type") != "news_update":
        raise ValueError("proposal_type must be 'news_update'.")

    target = output.get("target")

    if target not in ALLOWED_TARGETS:
        raise ValueError(f"target must be one of: {', '.join(sorted(ALLOWED_TARGETS))}")

    confidence = output.get("confidence")

    if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
        raise ValueError("confidence must be a number between 0 and 1.")

    data = output.get("data")

    if not isinstance(data, dict):
        raise ValueError("data must be an object.")

    missing = [field for field in REQUIRED_DATA_FIELDS if not data.get(field)]

    if missing:
        raise ValueError(f"data is missing required fields: {', '.join(missing)}")

    if data["id"] != slugify(data["id"]):
        raise ValueError("data.id must be lowercase and use hyphens only.")

    validate_localized_field("data.category", data.get("category"))
    validate_localized_field("data.title", data.get("title"))
    validate_localized_field("data.summary", data.get("summary"))

    href = data.get("href", "")

    if not href.startswith("http"):
        raise ValueError("data.href must be a full source URL starting with http.")

    evidence = output.get("evidence")

    if not isinstance(evidence, dict):
        raise ValueError("evidence must be an object.")

    if not evidence.get("source_url") or not evidence.get("source_name"):
        raise ValueError("evidence must include source_url and source_name.")


def create_pending_news(output: dict) -> Path:
    PENDING_DIR.mkdir(parents=True, exist_ok=True)

    data = output["data"]
    news_id = slugify(data["id"])

    proposal = {
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "proposal_type": "news_update",
        "target": output["target"],
        "confidence": output["confidence"],
        "data": {
            **data,
            "id": news_id,
        },
        "evidence": output["evidence"],
    }

    output_path = PENDING_DIR / f"{data['date']}-{news_id}.json"

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(proposal, file, ensure_ascii=False, indent=2)

    return output_path


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(
            "Usage: python ai-engine/scripts/create_news_proposal.py path/to/agent-output.json"
        )

    input_path = Path(sys.argv[1]).resolve()

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    output = load_json(input_path)
    validate_agent_output(output)

    proposal_path = create_pending_news(output)

    print("News proposal created successfully.")
    print(f"Pending file: {proposal_path}")


if __name__ == "__main__":
    main()