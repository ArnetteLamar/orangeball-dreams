import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT / "ai-engine" / "data" / "news" / "home"
OUTPUT_DIR = ROOT / "public" / "generated" / "news"
OUTPUT_FILE = OUTPUT_DIR / "home.json"


REQUIRED_FIELDS = ["id", "date", "category", "title", "summary"]


def load_news_item(path: Path) -> dict:
    with path.open("r", encoding="utf-8-sig") as file:
        item = json.load(file)

    missing = [field for field in REQUIRED_FIELDS if field not in item]

    if missing:
        raise ValueError(f"{path.name} is missing fields: {', '.join(missing)}")

    item.setdefault("homepage", True)
    item.setdefault("source", "Orange Ball Dreams")

    return item


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    items = []

    if INPUT_DIR.exists():
        for path in sorted(INPUT_DIR.glob("*.json")):
            items.append(load_news_item(path))

    items = [
        item
        for item in items
        if item.get("homepage", True) is True
    ]

    items.sort(key=lambda item: item.get("date", ""), reverse=True)

    with OUTPUT_FILE.open("w", encoding="utf-8-sig") as file:
        json.dump(items, file, ensure_ascii=False, indent=2)

    print(f"Generated {OUTPUT_FILE}")
    print(f"Total news: {len(items)}")


if __name__ == "__main__":
    main()
