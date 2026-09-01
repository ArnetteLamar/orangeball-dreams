import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CONTRACT_PATH = ROOT / "ai-engine" / "data" / "agents" / "orangeball-agent-contract.json"
TRAINING_PATH = (
    ROOT
    / "ai-engine"
    / "data"
    / "agents"
    / "training"
    / "orangeball-agent-training-examples.json"
)


def load_json(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    with path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def add_error(errors: list[str], message: str):
    errors.append(f"ERROR - {message}")


def add_warning(warnings: list[str], message: str):
    warnings.append(f"WARNING - {message}")


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
    errors: list[str] = []
    warnings: list[str] = []

    print("Orangeball Dreams - Agent Training Validation")
    print("=" * 60)

    try:
      contract = load_json(CONTRACT_PATH)
    except Exception as error:
      add_error(errors, str(error))
      contract = {}

    try:
      training = load_json(TRAINING_PATH)
    except Exception as error:
      add_error(errors, str(error))
      training = {}

    if errors:
        for error in errors:
            print(error)
        sys.exit(1)

    contract_agent_id = contract.get("agent_id")
    training_agent_id = training.get("agent_id")

    if not contract_agent_id:
        add_error(errors, "Contract is missing agent_id")

    if not training_agent_id:
        add_error(errors, "Training pack is missing agent_id")

    if contract_agent_id and training_agent_id and contract_agent_id != training_agent_id:
        add_error(
            errors,
            f"Agent ID mismatch: contract has '{contract_agent_id}', training has '{training_agent_id}'",
        )

    allowed_sources = contract.get("allowed_sources", [])
    allowed_proposal_types = contract.get("allowed_proposal_types", [])
    proposal_contracts = contract.get("proposal_contracts", {})

    if not allowed_sources:
        add_error(errors, "Contract has no allowed_sources")

    if not allowed_proposal_types:
        add_error(errors, "Contract has no allowed_proposal_types")

    if not proposal_contracts:
        add_error(errors, "Contract has no proposal_contracts")

    safety_rules = contract.get("safety_rules", {})

    if safety_rules.get("can_publish_directly") is not False:
        add_error(errors, "Agent safety rule must block direct publishing")

    if safety_rules.get("requires_admin_approval") is not True:
        add_error(errors, "Agent must require admin approval")

    minimum_confidence = safety_rules.get("minimum_confidence_for_proposal")

    if minimum_confidence is None:
        add_error(errors, "Contract is missing minimum_confidence_for_proposal")
        minimum_confidence = 0.75

    if minimum_confidence < 0.75:
        add_error(errors, "minimum_confidence_for_proposal must be at least 0.75")

    golden_rules = training.get("golden_rules", [])

    if len(golden_rules) < 5:
        add_error(errors, "Training pack must have at least 5 golden_rules")

    if "Nunca publicar diretamente no site." not in golden_rules:
        add_error(errors, "Training pack must include rule: Nunca publicar diretamente no site.")

    if training.get("agent_output_rule") != "A resposta final do agente deve ser sempre JSON válido, sem texto antes ou depois.":
        add_error(errors, "Training pack must enforce JSON-only output")

    good_examples = training.get("good_examples", [])
    bad_examples = training.get("bad_examples", [])

    if len(good_examples) < 3:
        add_error(errors, "Training pack must have at least 3 good_examples")

    if len(bad_examples) < 3:
        add_error(errors, "Training pack must have at least 3 bad_examples")

    for proposal_type in allowed_proposal_types:
        if proposal_type not in proposal_contracts:
            add_error(errors, f"Missing proposal contract for '{proposal_type}'")
            continue

        proposal_contract = proposal_contracts[proposal_type]
        required_fields = proposal_contract.get("required_fields", [])
        data_fields = proposal_contract.get("data_fields", [])

        if not required_fields:
            add_error(errors, f"Proposal contract '{proposal_type}' has no required_fields")

        if not data_fields:
            add_error(errors, f"Proposal contract '{proposal_type}' has no data_fields")

        if "proposal_type" not in required_fields:
            add_error(errors, f"Proposal contract '{proposal_type}' must require proposal_type")

        if "player_slug" not in required_fields:
            add_error(errors, f"Proposal contract '{proposal_type}' must require player_slug")

        if "source_id" not in required_fields:
            add_error(errors, f"Proposal contract '{proposal_type}' must require source_id")

        if "confidence" not in required_fields:
            add_error(errors, f"Proposal contract '{proposal_type}' must require confidence")

        if "data" not in required_fields:
            add_error(errors, f"Proposal contract '{proposal_type}' must require data")

    for example in good_examples:
        example_id = example.get("example_id", "unknown_example")
        expected_output = example.get("expected_output", {})

        if not expected_output:
            add_error(errors, f"{example_id}: missing expected_output")
            continue

        proposal_type = expected_output.get("proposal_type")
        source_id = expected_output.get("source_id")
        confidence = expected_output.get("confidence")
        data = expected_output.get("data", {})

        if proposal_type not in allowed_proposal_types:
            add_error(errors, f"{example_id}: invalid proposal_type '{proposal_type}'")
            continue

        if source_id not in allowed_sources:
            add_error(errors, f"{example_id}: invalid source_id '{source_id}'")

        if confidence is None:
            add_error(errors, f"{example_id}: missing confidence")
        elif confidence < minimum_confidence:
            add_error(
                errors,
                f"{example_id}: confidence {confidence} is below minimum {minimum_confidence}",
            )

        proposal_contract = proposal_contracts.get(proposal_type, {})
        required_fields = proposal_contract.get("required_fields", [])
        data_fields = proposal_contract.get("data_fields", [])

        validate_required_fields(
            expected_output,
            required_fields,
            f"{example_id}.expected_output",
            errors,
        )

        if not isinstance(data, dict):
            add_error(errors, f"{example_id}: data must be an object")
            continue

        for field in data_fields:
            if field not in data:
                add_warning(
                    warnings,
                    f"{example_id}: data field '{field}' is missing. This may be acceptable only if intentionally empty later.",
                )

    for example in bad_examples:
        example_id = example.get("example_id", "unknown_bad_example")

        if not example.get("mistake"):
            add_error(errors, f"{example_id}: missing mistake description")

        if not example.get("bad_output"):
            add_error(errors, f"{example_id}: missing bad_output")

        if not example.get("correct_behavior"):
            add_error(errors, f"{example_id}: missing correct_behavior")

    print(f"Contract: {CONTRACT_PATH}")
    print(f"Training: {TRAINING_PATH}")
    print()
    print(f"Agent ID: {contract_agent_id}")
    print(f"Allowed sources: {len(allowed_sources)}")
    print(f"Allowed proposal types: {len(allowed_proposal_types)}")
    print(f"Good examples: {len(good_examples)}")
    print(f"Bad examples: {len(bad_examples)}")
    print()

    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(warning)
        print()

    if errors:
        print("Validation failed:")
        for error in errors:
            print(error)
        sys.exit(1)

    print("AGENT TRAINING VALIDATION PASSED")


if __name__ == "__main__":
    main()