import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PENDING_DIR = ROOT / "ai-engine" / "data" / "news" / "pending"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def get_localized(value, lang: str = "es") -> str:
    if isinstance(value, str):
        return value

    if isinstance(value, dict):
        return value.get(lang) or value.get("en") or value.get("es") or ""

    return ""


def main() -> None:
    if not PENDING_DIR.exists():
        print("No pending news proposals folder found.")
        return

    files = sorted(PENDING_DIR.glob("*.json"))

    if not files:
        print("No pending news proposals.")
        return

    print(f"Pending news proposals: {len(files)}")
    print("-" * 60)

    for index, path in enumerate(files, start=1):
        proposal = load_json(path)
        data = proposal.get("data", {})

        title = get_localized(data.get("title", ""), "es")
        category = get_localized(data.get("category", ""), "es")

        print(f"{index}. {path.name}")
        print(f"   title: {title}")
        print(f"   date: {data.get('date', '—')}")
        print(f"   category: {category}")
        print(f"   source: {data.get('source', '—')}")
        print(f"   target: {proposal.get('target', '—')}")
        print(f"   confidence: {proposal.get('confidence', '—')}")
        print("-" * 60)


if __name__ == "__main__":
    main()