import argparse
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CONTRACT_PATH = ROOT / "ai-engine" / "data" / "agents" / "orangeball-agent-contract.json"
INBOX_DIR = ROOT / "ai-engine" / "data" / "agents" / "inbox"
PROCESSED_DIR = ROOT / "ai-engine" / "data" / "agents" / "processed"
REJECTED_DIR = ROOT / "ai-engine" / "data" / "agents" / "rejected"
RAW_SOURCES_DIR = ROOT / "ai-engine" / "data" / "sources" / "raw"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def timestamp_for_file() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")


def load_json(path: Path):
    with path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def write_json(path: Path, payload: dict):
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2, ensure_ascii=False)


def safe_move(source_path: Path, target_dir: Path) -> Path:
    target_dir.mkdir(parents=True, exist_ok=True)

    target_path = target_dir / source_path.name

    if target_path.exists():
        stem = source_path.stem
        suffix = source_path.suffix
        target_path = target_dir / f"{stem}-{timestamp_for_file()}{suffix}"

    shutil.move(str(source_path), str(target_path))

    return target_path


def validate_output(output: dict, contract: dict) -> list[str]:
    errors: list[str] = []

    allowed_sources = contract.get("allowed_sources", [])
    allowed_proposal_types = contract.get("allowed_proposal_types", [])
    proposal_contracts = contract.get("proposal_contracts", {})
    safety_rules = contract.get("safety_rules", {})
    minimum_confidence = safety_rules.get("minimum_confidence_for_proposal", 0.75)

    proposal_type = output.get("proposal_type")
    source_id = output.get("source_id")
    confidence = output.get("confidence")

    if not proposal_type:
        errors.append("Missing proposal_type")
        return errors

    if proposal_type == "ignored":
        required_fields = [
            "proposal_type",
            "player_slug",
            "source_id",
            "source_url",
            "confidence",
            "reason",
            "agent_notes",
        ]

        for field in required_fields:
            if field not in output:
                errors.append(f"ignored output missing field: {field}")

        return errors

    if proposal_type not in allowed_proposal_types:
        errors.append(f"Invalid proposal_type: {proposal_type}")

    if not output.get("player_slug"):
        errors.append("Missing player_slug")

    if not source_id:
        errors.append("Missing source_id")
    elif source_id not in allowed_sources:
        errors.append(f"Invalid source_id: {source_id}")

    if output.get("source_url") is None:
        errors.append("Missing source_url")

    if confidence is None:
        errors.append("Missing confidence")
    elif not isinstance(confidence, (int, float)):
        errors.append("confidence must be a number")
    elif confidence < minimum_confidence:
        errors.append(
            f"confidence {confidence} is below minimum {minimum_confidence}"
        )

    proposal_contract = proposal_contracts.get(proposal_type)

    if proposal_contract:
        required_fields = proposal_contract.get("required_fields", [])
        data_fields = proposal_contract.get("data_fields", [])

        for field in required_fields:
            if field not in output:
                errors.append(f"Missing required field: {field}")

        data = output.get("data")

        if not isinstance(data, dict):
            errors.append("data must be an object")
        else:
            for field in data_fields:
                if field not in data:
                    errors.append(f"data is missing field: {field}")

    return errors


def build_raw_source_from_stat_update(output: dict) -> dict:
    data = output.get("data", {})

    return {
        "schema_version": "1.0",
        "source_id": output.get("source_id", ""),
        "player_slug": output.get("player_slug", ""),
        "collected_at": now_iso(),
        "updated_at": now_iso(),
        "status": "raw_ready",
        "source_url": output.get("source_url", ""),
        "confidence": output.get("confidence", 0),
        "raw_data": {
            "competition": data.get("competition", ""),
            "season": data.get("season", ""),
            "round": data.get("round", ""),
            "opponent": data.get("opponent", ""),
            "points": data.get("points", 0),
            "rebounds": data.get("rebounds", 0),
            "assists": data.get("assists", 0),
            "steals": data.get("steals", 0),
            "blocks": data.get("blocks", 0),
            "minutes": data.get("minutes", 0),
        },
        "agent": {
            "agent_id": "orangeball-scouting-agent",
            "proposal_type": output.get("proposal_type"),
            "agent_notes": output.get("agent_notes", ""),
        },
        "notes": "Raw source criado a partir de output validado do agente.",
    }


def create_raw_source(output: dict) -> Path:
    player_slug = output.get("player_slug", "unknown-player")
    source_id = output.get("source_id", "unknown-source")
    file_name = f"{player_slug}-{source_id}-agent-{timestamp_for_file()}.json"

    raw_payload = build_raw_source_from_stat_update(output)
    raw_path = RAW_SOURCES_DIR / file_name

    write_json(raw_path, raw_payload)

    return raw_path


def process_file(output_path: Path, contract: dict) -> bool:
    print(f"Processing: {output_path}")

    try:
        output = load_json(output_path)
    except Exception as error:
        print(f"ERROR - Invalid JSON: {error}")
        safe_move(output_path, REJECTED_DIR)
        return False

    errors = validate_output(output, contract)

    if errors:
        print("ERROR - Agent output rejected")
        for error in errors:
            print(f"- {error}")

        safe_move(output_path, REJECTED_DIR)
        return False

    proposal_type = output.get("proposal_type")

    if proposal_type == "ignored":
        print("SKIP - Agent ignored this input")
        safe_move(output_path, PROCESSED_DIR)
        return True

    if proposal_type == "stat_update":
        raw_path = create_raw_source(output)
        print(f"OK - Raw source created: {raw_path.name}")
        safe_move(output_path, PROCESSED_DIR)
        return True

    print(f"OK - Valid output, but routing not implemented yet: {proposal_type}")
    safe_move(output_path, PROCESSED_DIR)
    return True


def main():
    parser = argparse.ArgumentParser(description="Process Orangeball agent outputs")
    parser.add_argument(
        "--file",
        required=False,
        help="Optional specific agent output file to process",
    )

    args = parser.parse_args()

    print("Orangeball Dreams - Process Agent Output")
    print("=" * 60)

    try:
        contract = load_json(CONTRACT_PATH)
    except Exception as error:
        print(f"ERROR - Could not load contract: {error}")
        sys.exit(1)

    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    REJECTED_DIR.mkdir(parents=True, exist_ok=True)
    RAW_SOURCES_DIR.mkdir(parents=True, exist_ok=True)

    if args.file:
        files = [ROOT / args.file]
    else:
        files = sorted(INBOX_DIR.glob("*.json"))

    if not files:
        print("No agent outputs found.")
        return

    processed = 0
    failed = 0

    for file_path in files:
        if not file_path.exists():
            print(f"ERROR - File does not exist: {file_path}")
            failed += 1
            continue

        ok = process_file(file_path, contract)

        if ok:
            processed += 1
        else:
            failed += 1

        print("-" * 60)

    print()
    print(f"Processed: {processed}")
    print(f"Failed: {failed}")

    if failed > 0:
        sys.exit(1)

    print("AGENT OUTPUT PROCESSING PASSED")


if __name__ == "__main__":
    main()