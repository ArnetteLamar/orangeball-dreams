def generate_player_summary(profile, averages, latest_game):
    return (
        f"{profile['name']} representa o {profile['club']} como "
        f"{profile['position']} e tem vindo a destacar-se pela sua consistência. "
        f"Na época atual apresenta médias de {averages['ppg']} pontos, "
        f"{averages['rpg']} ressaltos e {averages['apg']} assistências por jogo. "
        f"No jogo mais recente frente ao {latest_game['opponent']}, registou "
        f"{latest_game['points']} pontos, {latest_game['rebounds']} ressaltos "
        f"e {latest_game['assists']} assistências."
    )