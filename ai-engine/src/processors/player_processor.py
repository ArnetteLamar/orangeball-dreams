def calculate_player_performance_index(stats_df):
    stats_df = stats_df.copy()

    stats_df["performance_index"] = (
        stats_df["points"]
        + stats_df["rebounds"] * 1.2
        + stats_df["assists"] * 1.5
        + stats_df["steals"] * 2
        + stats_df["blocks"] * 2
    ).round(1)

    return stats_df


def calculate_player_averages(stats_df):
    stats_df = calculate_player_performance_index(stats_df)

    games_played = len(stats_df)

    return {
        "games_played": games_played,
        "ppg": round(stats_df["points"].mean(), 1),
        "rpg": round(stats_df["rebounds"].mean(), 1),
        "apg": round(stats_df["assists"].mean(), 1),
        "spg": round(stats_df["steals"].mean(), 1),
        "bpg": round(stats_df["blocks"].mean(), 1),
        "mpg": round(stats_df["minutes"].mean(), 1),
        "performance_index": round(stats_df["performance_index"].mean(), 1),
    }


def get_latest_game(stats_df):
    stats_df = calculate_player_performance_index(stats_df)

    latest = stats_df.iloc[-1]

    return {
        "competition": str(latest["competition"]),
        "season": str(latest["season"]),
        "round": str(latest["round"]),
        "opponent": str(latest["opponent"]),
        "points": int(latest["points"]),
        "rebounds": int(latest["rebounds"]),
        "assists": int(latest["assists"]),
        "steals": int(latest["steals"]),
        "blocks": int(latest["blocks"]),
        "minutes": int(latest["minutes"]),
        "performance_index": float(latest["performance_index"]),
    }