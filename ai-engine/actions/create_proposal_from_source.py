import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

from create_proposal import create_proposal


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR.parent

PLAYERS_DIR = BASE_DIR / "data" / "players"
PROPOSALS_DIR = BASE_DIR / "data" / "proposals"

SOURCE_LOGS_DIR = BASE_DIR / "data" / "sources" / "logs"
SOURCE_PROPOSAL_LOG = SOURCE_LOGS_DIR / "source_proposals.jsonl"


def safe_text(value) -> str:
    if value is None:
        return ""

    return str(value).strip()


def normalize_text(value) -> str:
    return safe_text(value).lower()


def safe_number(value) -> int:
    if value in [None, ""]:
        return 0

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def safe_confidence(value) -> float:
    if value in [None, ""]:
        return 0.8

    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return 0.8

    if confidence < 0:
        return 0

    if confidence > 1:
        return 1

    return confidence


def resolve_source_file(source_file: str) -> Path:
    path = Path(source_file)

    if path.is_absolute():
        return path

    return PROJECT_ROOT / path


def load_source_file(source_file: Path) -> dict:
    if not source_file.exists():
        raise FileNotFoundError(f"Source file not found: {source_file}")

    with source_file.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def build_proposed_data(raw_data: dict) -> dict:
    return {
        "competition": safe_text(raw_data.get("competition")),
        "season": safe_text(raw_data.get("season")),
        "round": safe_text(raw_data.get("round")),
        "opponent": safe_text(raw_data.get("opponent")),
        "points": safe_number(raw_data.get("points")),
        "rebounds": safe_number(raw_data.get("rebounds")),
        "assists": safe_number(raw_data.get("assists")),
        "steals": safe_number(raw_data.get("steals")),
        "blocks": safe_number(raw_data.get("blocks")),
        "minutes": safe_number(raw_data.get("minutes")),
    }


def game_identity(data: dict) -> tuple[str, str, str, str]:
    return (
        normalize_text(data.get("season")),
        normalize_text(data.get("competition")),
        normalize_text(data.get("round")),
        normalize_text(data.get("opponent")),
    )


def read_json_file(file_path: Path) -> dict:
    with file_path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def duplicate_in_stats(player_slug: str, proposed_data: dict) -> str | None:
    stats_path = PLAYERS_DIR / player_slug / "stats.csv"

    if not stats_path.exists():
        return None

    proposed_identity = game_identity(proposed_data)

    with stats_path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        for row_number, row in enumerate(reader, start=2):
            if game_identity(row) == proposed_identity:
                return f"Game already exists in stats.csv on row {row_number}"

    return None


def duplicate_in_proposals(
    player_slug: str,
    proposed_data: dict,
    folders: list[str],
) -> str | None:
    proposed_identity = game_identity(proposed_data)

    for folder in folders:
        proposals_dir = PROPOSALS_DIR / player_slug / folder

        if not proposals_dir.exists():
            continue

        for proposal_file in proposals_dir.glob("*.json"):
            try:
                proposal = read_json_file(proposal_file)
            except Exception:
                continue

            existing_data = proposal.get("proposed_data", {})

            if game_identity(existing_data) == proposed_identity:
                return (
                    f"Duplicate found in {folder} proposal: "
                    f"{proposal.get('proposal_id', proposal_file.stem)}"
                )

    return None


def find_duplicate(player_slug: str, proposed_data: dict) -> str | None:
    stats_duplicate = duplicate_in_stats(player_slug, proposed_data)

    if stats_duplicate:
        return stats_duplicate

    proposal_duplicate = duplicate_in_proposals(
        player_slug=player_slug,
        proposed_data=proposed_data,
        folders=["pending", "approved"],
    )

    if proposal_duplicate:
        return proposal_duplicate

    return None


def write_source_proposal_log(
    action: str,
    source_file: Path,
    source_payload: dict,
    proposed_data: dict,
    proposal: dict | None = None,
    duplicate_reason: str = "",
) -> None:
    SOURCE_LOGS_DIR.mkdir(parents=True, exist_ok=True)

    log_entry = {
        "logged_at": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "proposal_id": proposal.get("proposal_id") if proposal else None,
        "proposal_status": proposal.get("status") if proposal else None,
        "player_slug": source_payload.get("player_slug"),
        "source_id": source_payload.get("source_id"),
        "source_url": source_payload.get("source_url", ""),
        "source_file": str(source_file),
        "confidence": proposal.get("confidence") if proposal else source_payload.get("confidence"),
        "duplicate_reason": duplicate_reason,
        "competition": proposed_data.get("competition"),
        "season": proposed_data.get("season"),
        "round": proposed_data.get("round"),
        "opponent": proposed_data.get("opponent"),
        "points": proposed_data.get("points"),
        "rebounds": proposed_data.get("rebounds"),
        "assists": proposed_data.get("assists"),
        "steals": proposed_data.get("steals"),
        "blocks": proposed_data.get("blocks"),
        "minutes": proposed_data.get("minutes"),
    }

    with SOURCE_PROPOSAL_LOG.open("a", encoding="utf-8") as file:
        file.write(json.dumps(log_entry, ensure_ascii=False) + "\n")


def create_proposal_from_source(
    source_file: str,
    confidence: float | None = None,
) -> dict:
    resolved_source_file = resolve_source_file(source_file)
    source_payload = load_source_file(resolved_source_file)

    source_id = safe_text(source_payload.get("source_id")) or "unknown_source"
    player_slug = safe_text(source_payload.get("player_slug"))
    source_url = safe_text(source_payload.get("source_url"))
    collected_at = safe_text(source_payload.get("collected_at"))
    raw_notes = safe_text(source_payload.get("notes"))
    raw_data = source_payload.get("raw_data", {})

    if not player_slug:
        raise ValueError("player_slug is required in source file")

    if not isinstance(raw_data, dict):
        raise ValueError("raw_data must be an object")

    proposed_data = build_proposed_data(raw_data)

    if not proposed_data["opponent"]:
        raise ValueError("opponent is required in raw_data")

    duplicate_reason = find_duplicate(player_slug, proposed_data)

    if duplicate_reason:
        write_source_proposal_log(
            action="skipped_duplicate",
            source_file=resolved_source_file,
            source_payload=source_payload,
            proposed_data=proposed_data,
            proposal=None,
            duplicate_reason=duplicate_reason,
        )

        print("")
        print("⚠ Duplicate detected. Proposal was not created.")
        print(f"  Player: {player_slug}")
        print(f"  Source: {source_id}")
        print(f"  Opponent: {proposed_data['opponent']}")
        print(f"  Reason: {duplicate_reason}")
        print(f"  Log: {SOURCE_PROPOSAL_LOG}")

        return {
            "status": "skipped_duplicate",
            "player_slug": player_slug,
            "source": source_id,
            "duplicate_reason": duplicate_reason,
            "proposed_data": proposed_data,
        }

    proposal_confidence = (
        safe_confidence(confidence)
        if confidence is not None
        else safe_confidence(source_payload.get("confidence", 0.8))
    )

    notes_parts = [
        f"Created from source file: {resolved_source_file}",
        f"Source ID: {source_id}",
    ]

    if source_url:
        notes_parts.append(f"Source URL: {source_url}")

    if collected_at:
        notes_parts.append(f"Collected at: {collected_at}")

    if raw_notes:
        notes_parts.append(f"Notes: {raw_notes}")

    notes = " | ".join(notes_parts)

    proposal = create_proposal(
        player_slug=player_slug,
        proposal_type="add_game",
        source=source_id,
        confidence=proposal_confidence,
        proposed_data=proposed_data,
        notes=notes,
    )

    write_source_proposal_log(
        action="created_proposal",
        proposal=proposal,
        source_file=resolved_source_file,
        source_payload=source_payload,
        proposed_data=proposed_data,
    )

    print("")
    print("✓ Source converted into pending proposal")
    print(f"  Source file: {resolved_source_file}")
    print(f"  Player: {player_slug}")
    print(f"  Source: {source_id}")
    print(f"  Opponent: {proposed_data['opponent']}")
    print(f"  Points: {proposed_data['points']}")
    print(f"  Log: {SOURCE_PROPOSAL_LOG}")

    return proposal


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Create a pending AI proposal from an external raw source file."
    )

    parser.add_argument(
        "--source-file",
        required=True,
        help="Path to raw source JSON file",
    )

    parser.add_argument(
        "--confidence",
        type=float,
        default=None,
        help="Optional confidence score from 0 to 1",
    )

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    create_proposal_from_source(
        source_file=args.source_file,
        confidence=args.confidence,
    )


if __name__ == "__main__":
    main()