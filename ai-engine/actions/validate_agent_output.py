import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CONTRACT_PATH = ROOT / "ai-engine" / "data" / "agents" / "orangeball-agent-contract.json"


def load_json(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    with path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def add_error(errors: list[str], message: str):
    errors.append(f"ERROR - {message}")


def validate_required_fields(
    payload: dict,
    required_fields: list[str],
    context: str,
    errors: list[str],
):
    for field in required_fields:
        if field not in payload:
            add_error(errors, f"{context}: missing required field '{field}'")


def main():
    parser = argparse.ArgumentParser(description="Validate Orangeball agent output")
    parser.add_argument(
        "--file",
        required=True,
        help="Path to the agent output JSON file",
    )

    args = parser.parse_args()

    output_path = ROOT / args.file
    errors: list[str] = []

    print("Orangeball Dreams - Agent Output Validation")
    print("=" * 60)

    try:
        contract = load_json(CONTRACT_PATH)
    except Exception as error:
        add_error(errors, str(error))
        contract = {}

    try:
        output = load_json(output_path)
    except Exception as error:
        add_error(errors, str(error))
        output = {}

    if errors:
        for error in errors:
            print(error)
        sys.exit(1)

    allowed_sources = contract.get("allowed_sources", [])
    allowed_proposal_types = contract.get("allowed_proposal_types", [])
    proposal_contracts = contract.get("proposal_contracts", {})
    safety_rules = contract.get("safety_rules", {})
    minimum_confidence = safety_rules.get("minimum_confidence_for_proposal", 0.75)

    proposal_type = output.get("proposal_type")
    player_slug = output.get("player_slug")
    source_id = output.get("source_id")
    source_url = output.get("source_url")
    confidence = output.get("confidence")

    if not proposal_type:
        add_error(errors, "Missing proposal_type")

    if proposal_type == "ignored":
        required_ignored_fields = [
            "proposal_type",
            "player_slug",
            "source_id",
            "source_url",
            "confidence",
            "reason",
            "agent_notes",
        ]

        validate_required_fields(
            output,
            required_ignored_fields,
            "ignored_output",
            errors,
        )

        print(f"Output file: {output_path}")
        print("Proposal type: ignored")
        print("Status: ignored by agent")
        print()

        if errors:
            print("Validation failed:")
            for error in errors:
                print(error)
            sys.exit(1)

        print("AGENT OUTPUT VALIDATION PASSED")
        return

    if proposal_type not in allowed_proposal_types:
        add_error(errors, f"Invalid proposal_type: {proposal_type}")

    if not player_slug:
        add_error(errors, "Missing player_slug")

    if not source_id:
        add_error(errors, "Missing source_id")
    elif source_id not in allowed_sources:
        add_error(errors, f"Invalid source_id: {source_id}")

    if source_url is None:
        add_error(errors, "Missing source_url")

    if confidence is None:
        add_error(errors, "Missing confidence")
    elif not isinstance(confidence, int | float):
        add_error(errors, "confidence must be a number")
    elif confidence < minimum_confidence:
        add_error(
            errors,
            f"confidence {confidence} is below minimum {minimum_confidence}",
        )

    if proposal_type in proposal_contracts:
        proposal_contract = proposal_contracts[proposal_type]
        required_fields = proposal_contract.get("required_fields", [])
        data_fields = proposal_contract.get("data_fields", [])

        validate_required_fields(
            output,
            required_fields,
            "agent_output",
            errors,
        )

        data = output.get("data")

        if not isinstance(data, dict):
            add_error(errors, "data must be an object")
        else:
            for field in data_fields:
                if field not in data:
                    add_error(errors, f"data is missing field '{field}'")

    print(f"Output file: {output_path}")
    print(f"Proposal type: {proposal_type}")
    print(f"Player slug: {player_slug}")
    print(f"Source ID: {source_id}")
    print(f"Confidence: {confidence}")
    print()

    if errors:
        print("Validation failed:")
        for error in errors:
            print(error)
        sys.exit(1)

    print("AGENT OUTPUT VALIDATION PASSED")


if __name__ == "__main__":
    main()