import json
from pathlib import Path

import pandas as pd


def load_player_profile(player_folder: Path):
    profile_path = player_folder / "profile.json"

    if not profile_path.exists():
        raise FileNotFoundError(f"Profile não encontrado: {profile_path}")

    return json.loads(profile_path.read_text(encoding="utf-8"))


def load_player_stats(player_folder: Path):
    stats_path = player_folder / "stats.csv"

    if not stats_path.exists():
        raise FileNotFoundError(f"Stats não encontradas: {stats_path}")

    return pd.read_csv(stats_path)


def load_player(player_folder: Path):
    profile = load_player_profile(player_folder)
    stats = load_player_stats(player_folder)

    return {
        "profile": profile,
        "stats": stats,
    }