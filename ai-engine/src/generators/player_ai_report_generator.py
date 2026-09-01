from datetime import datetime, timezone


def _safe_number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def _format_number(value):
    number = _safe_number(value)

    if number.is_integer():
        return str(int(number))

    return f"{number:.1f}"


def detect_strengths(averages: dict) -> list[str]:
    strengths = []

    ppg = _safe_number(averages.get("ppg"))
    rpg = _safe_number(averages.get("rpg"))
    apg = _safe_number(averages.get("apg"))
    spg = _safe_number(averages.get("spg"))
    mpg = _safe_number(averages.get("mpg"))

    if ppg >= 12:
        strengths.append("Boa capacidade de pontuação e impacto ofensivo.")

    if apg >= 4:
        strengths.append("Boa visão de jogo e capacidade de criação para colegas.")

    if rpg >= 5:
        strengths.append("Boa presença física e contributo no ressalto.")

    if spg >= 1.5:
        strengths.append("Impacto defensivo interessante através de roubos de bola.")

    if mpg >= 25:
        strengths.append("Volume de minutos relevante, sugerindo confiança competitiva.")

    if not strengths:
        strengths.append(
            "Perfil ainda com dados limitados. É necessário acompanhar mais jogos."
        )

    return strengths


def detect_improvement_points(averages: dict) -> list[str]:
    improvements = []

    ppg = _safe_number(averages.get("ppg"))
    rpg = _safe_number(averages.get("rpg"))
    apg = _safe_number(averages.get("apg"))
    mpg = _safe_number(averages.get("mpg"))

    if ppg < 8:
        improvements.append(
            "Aumentar consistência ofensiva e volume de contribuição em pontos."
        )

    if apg < 3:
        improvements.append("Melhorar impacto na criação de jogo e distribuição.")

    if rpg < 4:
        improvements.append("Aumentar presença no ressalto e envolvimento físico.")

    if mpg < 18:
        improvements.append(
            "Conquistar maior estabilidade de minutos através de consistência competitiva."
        )

    if not improvements:
        improvements.append(
            "Manter consistência e transformar bons indicadores em regularidade ao longo da época."
        )

    return improvements


def build_recommendation(averages: dict) -> str:
    ppg = _safe_number(averages.get("ppg"))
    apg = _safe_number(averages.get("apg"))
    performance_index = _safe_number(averages.get("performance_index"))
    games_played = int(_safe_number(averages.get("games_played")))

    if games_played == 0:
        return "Ainda não existem dados suficientes para uma recomendação sólida de scouting."

    if performance_index >= 18 or ppg >= 15 or apg >= 6:
        return (
            "Atleta com indicadores fortes. Deve ser acompanhado de perto para "
            "oportunidades competitivas superiores."
        )

    if performance_index >= 10:
        return (
            "Atleta com perfil interessante. Recomenda-se acompanhamento contínuo "
            "e análise de evolução nos próximos jogos."
        )

    return (
        "Atleta ainda em fase de avaliação. É recomendável recolher mais jogos "
        "antes de tomar decisões de scouting."
    )


def build_final_classification(averages: dict) -> dict:
    games_played = int(_safe_number(averages.get("games_played")))
    ppg = _safe_number(averages.get("ppg"))
    apg = _safe_number(averages.get("apg"))
    rpg = _safe_number(averages.get("rpg"))
    performance_index = _safe_number(averages.get("performance_index"))

    if games_played < 3:
        return {
            "label": "Precisa de mais dados",
            "reason": "O atleta ainda tem poucos jogos registados para uma avaliação sólida.",
        }

    if performance_index >= 18 or ppg >= 15 or apg >= 6:
        return {
            "label": "Alto potencial",
            "reason": (
                "Os indicadores atuais mostram impacto competitivo relevante "
                "e sinais fortes para acompanhamento de scouting."
            ),
        }

    if performance_index >= 10 or ppg >= 10 or rpg >= 5:
        return {
            "label": "Em observação",
            "reason": (
                "O atleta apresenta indicadores interessantes, mas precisa de "
                "confirmar regularidade nos próximos jogos."
            ),
        }

    return {
        "label": "Precisa de mais dados",
        "reason": (
            "Os dados atuais ainda não mostram impacto suficiente para uma "
            "avaliação definitiva."
        ),
    }


def generate_player_ai_report(profile: dict, averages: dict, latest_game: dict) -> dict:
    name = profile.get("name", "Unknown player")
    club = profile.get("club", "")
    position = profile.get("position", "")
    nationality = profile.get("nationality", "")

    strengths = detect_strengths(averages)
    improvements = detect_improvement_points(averages)
    recommendation = build_recommendation(averages)
    classification = build_final_classification(averages)

    games_played = int(_safe_number(averages.get("games_played")))

    summary = (
        f"{name} é um atleta de {position or 'posição não definida'}"
        f"{f' no {club}' if club else ''}. "
        f"O perfil tem atualmente {games_played} jogo(s) registado(s) no Orangeball Dreams."
    )

    latest_game_summary = (
        f"Último jogo: {latest_game.get('round', '—')} vs "
        f"{latest_game.get('opponent', '—')} — "
        f"{latest_game.get('points', 0)} PTS, "
        f"{latest_game.get('rebounds', 0)} REB, "
        f"{latest_game.get('assists', 0)} AST."
    )

    report = {
        "content_type": "player_ai_report",
        "player_slug": profile.get("slug"),
        "player_name": name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "profile": {
            "club": club,
            "position": position,
            "nationality": nationality,
        },
        "averages": averages,
        "latest_game": latest_game,
        "summary": summary,
        "latest_game_summary": latest_game_summary,
        "strengths": strengths,
        "improvement_points": improvements,
        "classification": classification,
        "recommendation": recommendation,
    }

    return report


def generate_player_ai_report_markdown(report: dict) -> str:
    lines = []

    lines.append(f"# Relatório AI — {report['player_name']}")
    lines.append("")
    lines.append(f"Gerado em: {report['generated_at']}")
    lines.append("")
    lines.append("## Resumo")
    lines.append(report["summary"])
    lines.append("")
    lines.append("## Médias")
    lines.append(f"- Jogos registados: {report['averages'].get('games_played', 0)}")
    lines.append(f"- Pontos por jogo: {_format_number(report['averages'].get('ppg'))}")
    lines.append(f"- Ressaltos por jogo: {_format_number(report['averages'].get('rpg'))}")
    lines.append(f"- Assistências por jogo: {_format_number(report['averages'].get('apg'))}")
    lines.append(
        f"- OBD Index: {_format_number(report['averages'].get('performance_index'))}"
    )
    lines.append("")
    lines.append("## Último jogo")
    lines.append(report["latest_game_summary"])
    lines.append("")
    lines.append("## Pontos fortes")

    for item in report["strengths"]:
        lines.append(f"- {item}")

    lines.append("")
    lines.append("## Pontos a melhorar")

    for item in report["improvement_points"]:
        lines.append(f"- {item}")

    lines.append("")
    lines.append("## Classificação final")
    lines.append(f"**{report['classification']['label']}**")
    lines.append("")
    lines.append(report["classification"]["reason"])
    lines.append("")
    lines.append("## Recomendação de scouting")
    lines.append(report["recommendation"])
    lines.append("")

    return "\n".join(lines)