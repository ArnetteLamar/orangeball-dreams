import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

INPUT_CONTRACT_PATH = (
    ROOT / "ai-engine" / "data" / "agents" / "orangeball-agent-input-contract.json"
)

AGENT_CONTRACT_PATH = (
    ROOT / "ai-engine" / "data" / "agents" / "orangeball-agent-contract.json"
)


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
    parser = argparse.ArgumentParser(description="Validate Orangeball agent input")
    parser.add_argument(
        "--file",
        required=True,
        help="Path to the agent input JSON file",
    )

    args = parser.parse_args()

    input_path = ROOT / args.file
    errors: list[str] = []

    print("Orangeball Dreams - Agent Input Validation")
    print("=" * 60)

    try:
        input_contract = load_json(INPUT_CONTRACT_PATH)
    except Exception as error:
        add_error(errors, str(error))
        input_contract = {}

    try:
        agent_contract = load_json(AGENT_CONTRACT_PATH)
    except Exception as error:
        add_error(errors, str(error))
        agent_contract = {}

    try:
        agent_input = load_json(input_path)
    except Exception as error:
        add_error(errors, str(error))
        agent_input = {}

    if errors:
        for error in errors:
            print(error)
        sys.exit(1)

    required_fields = input_contract.get("required_fields", [])
    allowed_task_types = input_contract.get("allowed_task_types", [])
    allowed_content_types = input_contract.get("allowed_content_types", [])
    allowed_requested_output_types = input_contract.get(
        "allowed_requested_output_types",
        [],
    )

    allowed_sources = agent_contract.get("allowed_sources", [])
    allowed_proposal_types = agent_contract.get("allowed_proposal_types", [])
    minimum_confidence = (
        agent_contract.get("safety_rules", {}).get(
            "minimum_confidence_for_proposal",
            0.75,
        )
    )

    validate_required_fields(
        agent_input,
        required_fields,
        "agent_input",
        errors,
    )

    task_id = agent_input.get("task_id")
    task_type = agent_input.get("task_type")
    player = agent_input.get("player", {})
    source = agent_input.get("source", {})
    input_payload = agent_input.get("input_payload", {})
    requested_output = agent_input.get("requested_output", {})
    constraints = agent_input.get("constraints", {})

    if task_type not in allowed_task_types:
        add_error(errors, f"Invalid task_type: {task_type}")

    if not isinstance(player, dict):
        add_error(errors, "player must be an object")
        player = {}

    if not isinstance(source, dict):
        add_error(errors, "source must be an object")
        source = {}

    if not isinstance(input_payload, dict):
        add_error(errors, "input_payload must be an object")
        input_payload = {}

    if not isinstance(requested_output, dict):
        add_error(errors, "requested_output must be an object")
        requested_output = {}

    if not isinstance(constraints, dict):
        add_error(errors, "constraints must be an object")
        constraints = {}

    validate_required_fields(
        player,
        ["player_slug", "player_name"],
        "player",
        errors,
    )

    validate_required_fields(
        source,
        ["source_id", "source_name", "source_url"],
        "source",
        errors,
    )

    validate_required_fields(
        input_payload,
        ["content_type", "collected_at", "content"],
        "input_payload",
        errors,
    )

    validate_required_fields(
        requested_output,
        ["allowed_proposal_types"],
        "requested_output",
        errors,
    )

    validate_required_fields(
        constraints,
        [
            "minimum_confidence",
            "json_only",
            "requires_source_url",
            "requires_admin_approval",
        ],
        "constraints",
        errors,
    )

    source_id = source.get("source_id")

    if source_id and source_id not in allowed_sources:
        add_error(errors, f"source.source_id is not allowed: {source_id}")

    content_type = input_payload.get("content_type")

    if content_type and content_type not in allowed_content_types:
        add_error(errors, f"input_payload.content_type is not allowed: {content_type}")

    content = input_payload.get("content", "")

    if not isinstance(content, str) or not content.strip():
        add_error(errors, "input_payload.content must be a non-empty string")

    allowed_outputs = requested_output.get("allowed_proposal_types", [])

    if not isinstance(allowed_outputs, list) or not allowed_outputs:
        add_error(errors, "requested_output.allowed_proposal_types must be a non-empty list")
    else:
        for output_type in allowed_outputs:
            if output_type not in allowed_requested_output_types:
                add_error(errors, f"requested output type is not allowed: {output_type}")

            if output_type != "ignored" and output_type not in allowed_proposal_types:
                add_error(errors, f"requested output type is not in agent contract: {output_type}")

    constraint_minimum_confidence = constraints.get("minimum_confidence")

    if constraint_minimum_confidence is None:
        add_error(errors, "constraints.minimum_confidence is missing")
    elif not isinstance(constraint_minimum_confidence, (int, float)):
        add_error(errors, "constraints.minimum_confidence must be a number")
    elif constraint_minimum_confidence < minimum_confidence:
        add_error(
            errors,
            f"constraints.minimum_confidence must be at least {minimum_confidence}",
        )

    if constraints.get("json_only") is not True:
        add_error(errors, "constraints.json_only must be true")

    if constraints.get("requires_source_url") is not True:
        add_error(errors, "constraints.requires_source_url must be true")

    if constraints.get("requires_admin_approval") is not True:
        add_error(errors, "constraints.requires_admin_approval must be true")

    if not source.get("source_url"):
        add_error(errors, "source.source_url cannot be empty")

    print(f"Input file: {input_path}")
    print(f"Task ID: {task_id}")
    print(f"Task type: {task_type}")
    print(f"Player: {player.get('player_slug')}")
    print(f"Source: {source_id}")
    print()

    if errors:
        print("Validation failed:")
        for error in errors:
            print(error)
        sys.exit(1)

    print("AGENT INPUT VALIDATION PASSED")


if __name__ == "__main__":
    main()