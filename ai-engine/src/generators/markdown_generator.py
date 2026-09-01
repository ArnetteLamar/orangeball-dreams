def generate_markdown(title, summary, best_scorer, most_complete, rankings):
    top_points = rankings["top_points"]
    top_rebounds = rankings["top_rebounds"]
    top_assists = rankings["top_assists"]
    top_performance = rankings["top_performance"]

    return f"""# {title}

## Resumo

{summary}

---

## Melhor Marcador

**{best_scorer['player']}** ({best_scorer['team']})  
{best_scorer['points']} pontos vs {best_scorer['opponent']}

---

## Jogador Mais Completo

**{most_complete['player']}** ({most_complete['team']})  
OBD Performance Index: {most_complete['performance_index']}

---

## Top Scorers

{top_points[['player', 'team', 'points']].to_markdown(index=False)}

---

## Top Rebounders

{top_rebounds[['player', 'team', 'rebounds']].to_markdown(index=False)}

---

## Top Assists

{top_assists[['player', 'team', 'assists']].to_markdown(index=False)}

---

## OBD Performance Index

{top_performance[['player', 'team', 'performance_index']].to_markdown(index=False)}

---

_Gerado automaticamente pelo Oragenball AI Engine._
"""