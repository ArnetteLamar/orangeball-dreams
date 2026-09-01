import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

PLAYERS_DIR = ROOT / "ai-engine" / "data" / "players"
SOURCE_PROFILES_DIR = ROOT / "ai-engine" / "data" / "sources" / "players"
AGENT_TASKS_DIR = ROOT / "ai-engine" / "data" / "agents" / "tasks"


TASK_OUTPUT_MAP = {
    "analyze_stat_source": ["stat_update", "ignored"],
    "analyze_news_source": ["news_update", "ignored"],
    "analyze_profile_source": ["profile_update", "ignored"],
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def timestamp_for_file() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")


def load_json(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    with path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def write_json(path: Path, payload: dict):
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2, ensure_ascii=False)


def get_player_profile(player_slug: str) -> dict:
    profile_path = PLAYERS_DIR / player_slug / "profile.json"
    return load_json(profile_path)


def get_source_profile(player_slug: str, source_id: str) -> dict:
    source_profile_path = SOURCE_PROFILES_DIR / f"{player_slug}.json"
    source_profile = load_json(source_profile_path)

    sources = source_profile.get("sources", [])

    for source in sources:
        if source.get("source_id") == source_id:
            return source

    raise ValueError(f"Source '{source_id}' not found for player '{player_slug}'")


def read_content(args) -> str:
    if args.content_file:
        content_path = ROOT / args.content_file
        return content_path.read_text(encoding="utf-8-sig").strip()

    return args.content.strip()


def build_agent_task(args) -> dict:
    player_profile = get_player_profile(args.player_slug)
    source_profile = get_source_profile(args.player_slug, args.source_id)

    content = read_content(args)

    if not content:
        raise ValueError("Content cannot be empty")

    allowed_outputs = TASK_OUTPUT_MAP.get(args.task_type)

    if not allowed_outputs:
        raise ValueError(f"Unsupported task_type: {args.task_type}")

    task_id = f"task-{args.player_slug}-{args.source_id}-{timestamp_for_file()}"

    source_url = args.source_url or source_profile.get("profile_url", "")

    if not source_url:
        raise ValueError("source_url is required")

    return {
        "task_id": task_id,
        "task_type": args.task_type,
        "player": {
            "player_slug": args.player_slug,
            "player_name": player_profile.get("name", ""),
            "club": player_profile.get("club", ""),
            "league": player_profile.get("league", ""),
            "position": player_profile.get("position", ""),
            "nationality": player_profile.get("nationality", ""),
        },
        "source": {
            "source_id": source_profile.get("source_id", args.source_id),
            "source_name": source_profile.get("source_name", ""),
            "source_url": source_url,
            "external_player_id": source_profile.get("external_player_id", ""),
            "trust_level": source_profile.get("trust_level", ""),
        },
        "input_payload": {
            "content_type": args.content_type,
            "collected_at": now_iso(),
            "content": content,
            "notes": args.notes or "",
        },
        "requested_output": {
            "allowed_proposal_types": allowed_outputs,
        },
        "constraints": {
            "minimum_confidence": 0.75,
            "json_only": True,
            "requires_source_url": True,
            "requires_admin_approval": True,
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Create Orangeball agent task")

    parser.add_argument("--player-slug", required=True)
    parser.add_argument("--source-id", required=True)
    parser.add_argument(
        "--task-type",
        required=True,
        choices=[
            "analyze_stat_source",
            "analyze_news_source",
            "analyze_profile_source",
        ],
    )
    parser.add_argument(
        "--content-type",
        default="plain_text",
        choices=[
            "plain_text",
            "html_text",
            "manual_text",
            "structured_json",
        ],
    )
    parser.add_argument("--source-url", required=False, default="")
    parser.add_argument("--content", required=False, default="")
    parser.add_argument("--content-file", required=False, default="")
    parser.add_argument("--notes", required=False, default="")

    args = parser.parse_args()

    print("Orangeball Dreams - Create Agent Task")
    print("=" * 60)

    if not args.content and not args.content_file:
        raise ValueError("You must provide --content or --content-file")

    task = build_agent_task(args)

    file_name = f"{task['task_id']}.json"
    output_path = AGENT_TASKS_DIR / file_name

    write_json(output_path, task)

    print(f"Task created: {output_path}")
    print(f"Task ID: {task['task_id']}")
    print(f"Player: {task['player']['player_slug']}")
    print(f"Source: {task['source']['source_id']}")
    print(f"Task type: {task['task_type']}")
    print()
    print("Next validation command:")
    print(
        f'npm run obd:agent-input -- --file "ai-engine/data/agents/tasks/{file_name}"'
    )


if __name__ == "__main__":
    main()