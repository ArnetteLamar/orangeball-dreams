import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
RAW_SOURCES_DIR = BASE_DIR / "data" / "sources" / "raw"


def load_json(file_path: Path) -> dict:
    with file_path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def write_json(file_path: Path, data: dict) -> None:
    with file_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def resolve_raw_file(player_slug: str, source_id: str, file_path: str | None) -> Path:
    if file_path:
        path = Path(file_path)

        if path.is_absolute():
            return path

        return BASE_DIR.parent / path

    return RAW_SOURCES_DIR / f"{player_slug}-{source_id}-ready-raw.json"


def update_raw_placeholder(args: argparse.Namespace) -> dict:
    raw_file = resolve_raw_file(args.player_slug, args.source_id, args.file)

    if not raw_file.exists():
        raise FileNotFoundError(f"Raw file not found: {raw_file}")

    payload = load_json(raw_file)

    if payload.get("status") not in {"raw_placeholder", "draft", "incomplete", "raw_ready"}:
        raise ValueError(
            f"Raw file has invalid status for manual update: {payload.get('status')}"
        )

    now = datetime.now(timezone.utc).isoformat()

    payload["status"] = "raw_ready"
    payload["updated_at"] = now
    payload["confidence"] = args.confidence

    payload["raw_data"] = {
        "competition": args.competition,
        "season": args.season,
        "round": args.round,
        "opponent": args.opponent,
        "points": args.points,
        "rebounds": args.rebounds,
        "assists": args.assists,
        "steals": args.steals,
        "blocks": args.blocks,
        "minutes": args.minutes,
    }

    payload["notes"] = (
        "Raw preenchido manualmente através do editor assistido. "
        "Pronto para ser transformado em proposta pendente."
    )

    write_json(raw_file, payload)

    print("")
    print("Orangeball Dreams - Raw Placeholder Updated")
    print("=" * 60)
    print(f"File: {raw_file.name}")
    print(f"Player: {payload.get('player_slug')}")
    print(f"Source: {payload.get('source_id')}")
    print(f"Status: {payload.get('status')}")
    print("")
    print("Game data")
    print("-" * 60)
    print(f"Competition: {args.competition}")
    print(f"Season: {args.season}")
    print(f"Round: {args.round}")
    print(f"Opponent: {args.opponent}")
    print(f"PTS: {args.points}")
    print(f"REB: {args.rebounds}")
    print(f"AST: {args.assists}")
    print(f"STL: {args.steals}")
    print(f"BLK: {args.blocks}")
    print(f"MIN: {args.minutes}")
    print("")
    print("Raw is ready to be processed into a pending proposal.")

    return payload


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Update a raw placeholder with manual game data."
    )

    parser.add_argument("--player-slug", required=True)
    parser.add_argument("--source-id", default="fpb")
    parser.add_argument("--file", default=None)

    parser.add_argument("--competition", required=True)
    parser.add_argument("--season", required=True)
    parser.add_argument("--round", required=True)
    parser.add_argument("--opponent", required=True)

    parser.add_argument("--points", type=int, required=True)
    parser.add_argument("--rebounds", type=int, required=True)
    parser.add_argument("--assists", type=int, required=True)
    parser.add_argument("--steals", type=int, default=0)
    parser.add_argument("--blocks", type=int, default=0)
    parser.add_argument("--minutes", type=int, required=True)

    parser.add_argument("--confidence", type=float, default=0.9)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    update_raw_placeholder(args)


if __name__ == "__main__":
    main()