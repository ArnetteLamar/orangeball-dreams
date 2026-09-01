def top_players(df, stat, limit=5):
    return df.sort_values(by=stat, ascending=False).head(limit)


def calculate_performance_index(df):
    df = df.copy()

    df["performance_index"] = (
        df["points"]
        + df["rebounds"] * 1.2
        + df["assists"] * 1.5
        + df["steals"] * 2
        + df["blocks"] * 2
    ).round(1)

    return df


def get_rankings(df):
    df = calculate_performance_index(df)

    return {
        "top_points": top_players(df, "points"),
        "top_rebounds": top_players(df, "rebounds"),
        "top_assists": top_players(df, "assists"),
        "top_performance": top_players(df, "performance_index"),
    }