import json
from pathlib import Path


def export_player_json(player_data: dict, output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)

    output_path.write_text(
        json.dumps(player_data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )