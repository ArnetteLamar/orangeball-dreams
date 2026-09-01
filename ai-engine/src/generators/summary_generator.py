def generate_summary(best_scorer, most_complete):
    return (
        f"{best_scorer['player']} foi o grande destaque da {best_scorer['round']}, "
        f"ao somar {best_scorer['points']} pontos frente ao {best_scorer['opponent']}. "
        f"No plano global, {most_complete['player']} apresentou a performance mais completa, "
        f"com um OBD Performance Index de {most_complete['performance_index']}."
    )