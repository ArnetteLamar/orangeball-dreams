import argparse
import csv
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]

PLAYERS_DIR = BASE_DIR / "data" / "players"
PROPOSALS_DIR = BASE_DIR / "data" / "proposals"

STATS_FIELDS = [
    "competition",
    "season",
    "round",
    "opponent",
    "points",
    "rebounds",
    "assists",
    "steals",
    "blocks",
    "minutes",
]


def is_valid_slug(slug: str) -> bool:
    return bool(re.fullmatch(r"[a-z0-9-]+", slug))


def get_pending_dir(slug: str) -> Path:
    return PROPOSALS_DIR / slug / "pending"


def get_reviewed_dir(slug: str, decision: str) -> Path:
    return PROPOSALS_DIR / slug / decision


def get_stats_path(slug: str) -> Path:
    return PLAYERS_DIR / slug / "stats.csv"


def ensure_stats_file(stats_path: Path) -> None:
    stats_path.parent.mkdir(parents=True, exist_ok=True)

    if not stats_path.exists():
        with stats_path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=STATS_FIELDS)
            writer.writeheader()


def find_proposal_file(slug: str, proposal_id: str | None = None) -> Path:
    pending_dir = get_pending_dir(slug)

    if not pending_dir.exists():
        raise FileNotFoundError(f"No pending proposals found for: {slug}")

    proposal_files = sorted(
        pending_dir.glob("*.json"),
        key=lambda file: file.stat().st_mtime,
        reverse=True,
    )

    if not proposal_files:
        raise FileNotFoundError(f"No pending proposals found for: {slug}")

    if proposal_id:
        for proposal_file in proposal_files:
            if proposal_file.stem == proposal_id:
                return proposal_file

        raise FileNotFoundError(f"Proposal not found: {proposal_id}")

    return proposal_files[0]


def read_proposal(proposal_file: Path) -> dict:
    with proposal_file.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_proposal(proposal: dict, output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with output_file.open("w", encoding="utf-8") as file:
        json.dump(proposal, file, indent=2, ensure_ascii=False)


def normalize_game_data(data: dict) -> dict:
    return {
        "competition": str(data.get("competition", "")).strip(),
        "season": str(data.get("season", "")).strip(),
        "round": str(data.get("round", "")).strip(),
        "opponent": str(data.get("opponent", "")).strip(),
        "points": int(float(data.get("points", 0) or 0)),
        "rebounds": int(float(data.get("rebounds", 0) or 0)),
        "assists": int(float(data.get("assists", 0) or 0)),
        "steals": int(float(data.get("steals", 0) or 0)),
        "blocks": int(float(data.get("blocks", 0) or 0)),
        "minutes": int(float(data.get("minutes", 0) or 0)),
    }


def apply_add_game(slug: str, proposed_data: dict) -> None:
    stats_path = get_stats_path(slug)
    ensure_stats_file(stats_path)

    game_data = normalize_game_data(proposed_data)

    if not game_data["opponent"]:
        raise ValueError("Opponent is required to approve add_game proposal")

    with stats_path.open("a", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=STATS_FIELDS)
        writer.writerow(game_data)


def review_proposal(
    slug: str,
    decision: str,
    proposal_id: str | None = None,
    reviewed_by: str = "admin",
) -> dict:
    if not is_valid_slug(slug):
        raise ValueError("Invalid player slug")

    if decision not in ["approved", "rejected"]:
        raise ValueError("Decision must be approved or rejected")

    proposal_file = find_proposal_file(slug, proposal_id)
    proposal = read_proposal(proposal_file)

    if proposal.get("status") != "pending":
        raise ValueError("Only pending proposals can be reviewed")

    if decision == "approved":
        if proposal.get("type") == "add_game":
            apply_add_game(slug, proposal.get("proposed_data", {}))
        else:
            raise ValueError(f"Unsupported proposal type: {proposal.get('type')}")

    proposal["status"] = decision
    proposal["reviewed_at"] = datetime.now(timezone.utc).isoformat()
    proposal["reviewed_by"] = reviewed_by

    output_dir = get_reviewed_dir(slug, decision)
    output_file = output_dir / proposal_file.name

    write_proposal(proposal, output_file)
    proposal_file.unlink()

    print(f"✓ Proposal {decision}: {proposal['proposal_id']}")
    print(f"  Player: {slug}")
    print(f"  Type: {proposal.get('type')}")
    print(f"  Output: {output_file}")

    if decision == "approved":
        print(f"  Stats updated: {get_stats_path(slug)}")

    return proposal


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Approve or reject AI proposals for Orangeball Dreams."
    )

    parser.add_argument("--slug", required=True, help="Player slug")
    parser.add_argument(
        "--decision",
        required=True,
        choices=["approved", "rejected"],
        help="Review decision",
    )
    parser.add_argument(
        "--proposal-id",
        default=None,
        help="Proposal ID. If empty, latest pending proposal is used.",
    )
    parser.add_argument(
        "--reviewed-by",
        default="admin",
        help="Reviewer name",
    )

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    review_proposal(
        slug=args.slug,
        decision=args.decision,
        proposal_id=args.proposal_id,
        reviewed_by=args.reviewed_by,
    )


if __name__ == "__main__":
    main()