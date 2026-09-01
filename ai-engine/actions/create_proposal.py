import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


BASE_DIR = Path(__file__).resolve().parents[1]

PLAYERS_DIR = BASE_DIR / "data" / "players"
PROPOSALS_DIR = BASE_DIR / "data" / "proposals"


def is_valid_slug(slug: str) -> bool:
    return bool(re.fullmatch(r"[a-z0-9-]+", slug))


def safe_text(value: str | None) -> str:
    if value is None:
        return ""

    return str(value).strip()


def safe_number(value: str | int | float | None) -> int:
    if value in [None, ""]:
        return 0

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def ensure_player_exists(slug: str) -> None:
    player_dir = PLAYERS_DIR / slug

    if not player_dir.exists():
        raise FileNotFoundError(f"Player not found: {slug}")


def build_add_game_data(args: argparse.Namespace) -> dict:
    return {
        "competition": safe_text(args.competition),
        "season": safe_text(args.season),
        "round": safe_text(args.round),
        "opponent": safe_text(args.opponent),
        "points": safe_number(args.points),
        "rebounds": safe_number(args.rebounds),
        "assists": safe_number(args.assists),
        "steals": safe_number(args.steals),
        "blocks": safe_number(args.blocks),
        "minutes": safe_number(args.minutes),
    }


def create_proposal(
    player_slug: str,
    proposal_type: str,
    source: str,
    confidence: float,
    proposed_data: dict,
    notes: str = "",
) -> dict:
    if not is_valid_slug(player_slug):
        raise ValueError("Invalid player slug")

    ensure_player_exists(player_slug)

    now = datetime.now(timezone.utc)
    proposal_id = f"proposal-{now.strftime('%Y%m%d-%H%M%S')}-{uuid4().hex[:8]}"

    proposal = {
        "proposal_id": proposal_id,
        "type": proposal_type,
        "player_slug": player_slug,
        "source": source,
        "confidence": confidence,
        "status": "pending",
        "created_at": now.isoformat(),
        "reviewed_at": None,
        "reviewed_by": None,
        "notes": notes,
        "proposed_data": proposed_data,
    }

    output_dir = PROPOSALS_DIR / player_slug / "pending"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / f"{proposal_id}.json"

    with output_file.open("w", encoding="utf-8") as file:
        json.dump(proposal, file, indent=2, ensure_ascii=False)

    print(f"✓ Proposal created: {proposal_id}")
    print(f"  Player: {player_slug}")
    print(f"  Type: {proposal_type}")
    print(f"  Status: pending")
    print(f"  File: {output_file}")

    return proposal


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Create AI validation proposals for Orangeball Dreams."
    )

    parser.add_argument("--slug", required=True, help="Player slug")
    parser.add_argument(
        "--type",
        required=True,
        choices=["add_game"],
        help="Proposal type",
    )

    parser.add_argument(
        "--source",
        default="manual_test",
        help="Source of the proposed data",
    )

    parser.add_argument(
        "--confidence",
        type=float,
        default=0.85,
        help="Confidence score from 0 to 1",
    )

    parser.add_argument("--notes", default="", help="Internal proposal notes")

    parser.add_argument("--competition", default="Liga Betclic")
    parser.add_argument("--season", default="2026/27")
    parser.add_argument("--round", default="")
    parser.add_argument("--opponent", default="")
    parser.add_argument("--points", default="0")
    parser.add_argument("--rebounds", default="0")
    parser.add_argument("--assists", default="0")
    parser.add_argument("--steals", default="0")
    parser.add_argument("--blocks", default="0")
    parser.add_argument("--minutes", default="0")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.type == "add_game":
        proposed_data = build_add_game_data(args)

        if not proposed_data["opponent"]:
            raise ValueError("Opponent is required for add_game proposals")

        create_proposal(
            player_slug=args.slug,
            proposal_type=args.type,
            source=args.source,
            confidence=args.confidence,
            proposed_data=proposed_data,
            notes=args.notes,
        )


if __name__ == "__main__":
    main()