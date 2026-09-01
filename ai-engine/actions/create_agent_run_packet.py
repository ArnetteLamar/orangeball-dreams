import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

SYSTEM_PROMPT_PATH = (
    ROOT / "ai-engine" / "data" / "agents" / "orangeball-agent-system-prompt.md"
)

RUNS_DIR = ROOT / "ai-engine" / "data" / "agents" / "runs"


def load_text(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    return path.read_text(encoding="utf-8-sig")


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    with path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def write_text(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def build_run_packet(system_prompt: str, task: dict) -> str:
    task_json = json.dumps(task, indent=2, ensure_ascii=False)

    sections = [
        "# Orangeball Agent Run Packet",
        "",
        "This file contains the full instruction package for the Orangeball Scouting Agent.",
        "",
        "The agent must follow the system prompt and analyse the task JSON.",
        "",
        "The final response must be valid JSON only.",
        "",
        "---",
        "",
        "# SYSTEM PROMPT",
        "",
        system_prompt.strip(),
        "",
        "---",
        "",
        "# AGENT TASK JSON",
        "",
        task_json,
        "",
        "---",
        "",
        "# FINAL RESPONSE RULE",
        "",
        "Return only one valid JSON object.",
        "",
        "Do not include Markdown.",
        "",
        "Do not include explanations before or after the JSON.",
        "",
        "Do not publish anything.",
        "",
        "Do not update the website.",
        "",
        "Create only a structured proposal or an ignored response.",
        "",
    ]

    return "\n".join(sections)


def main():
    parser = argparse.ArgumentParser(description="Create Orangeball agent run packet")
    parser.add_argument(
        "--task-file",
        required=True,
        help="Path to the agent task JSON file",
    )

    args = parser.parse_args()

    print("Orangeball Dreams - Create Agent Run Packet")
    print("=" * 60)

    task_path = ROOT / args.task_file

    system_prompt = load_text(SYSTEM_PROMPT_PATH)
    task = load_json(task_path)

    task_id = task.get("task_id", task_path.stem)
    output_path = RUNS_DIR / f"{task_id}-run-packet.md"

    packet = build_run_packet(system_prompt, task)

    write_text(output_path, packet)

    print(f"Run packet created: {output_path}")
    print(f"Task ID: {task_id}")
    print()
    print("This file can be used in n8n, OpenAI API or a manual agent test.")


if __name__ == "__main__":
    main()