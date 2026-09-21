# Orangeball Dreams — AI Agent Output Template

When running a scouting check, return:

1. Short audit table
2. Recommendation
3. Source links
4. JSON proposals only for strong items

## Audit table

| Player slug | Player name | Type | Source | Summary | Recommendation | Action |
|---|---|---|---|---|---|---|

## Homepage news JSON

{
  "proposal_type": "news_update",
  "target": "homepage",
  "source_id": "short-source-id",
  "source_url": "https://source-link.com",
  "confidence": 0.9,
  "data": {
    "id": "short-news-id",
    "date": "YYYY-MM-DD",
    "homepage": true,
    "category": {
      "en": "Player Spotlight",
      "es": "Foco de jugador"
    },
    "title": {
      "en": "English title",
      "es": "Spanish title"
    },
    "summary": {
      "en": "English summary.",
      "es": "Spanish summary."
    },
    "image": "",
    "player_slug": "player-slug",
    "href": "/{locale}/athletes/player-slug",
    "source": "Source name"
  },
  "evidence": {
    "source_url": "https://source-link.com",
    "source_name": "Source name",
    "source_date": "YYYY-MM-DD",
    "why_relevant": "Why this matters."
  }
}

## Player profile news JSON

{
  "proposal_type": "news_update",
  "target": "player_profile",
  "player_slug": "player-slug",
  "source_id": "short-source-id",
  "source_url": "https://source-link.com",
  "confidence": 0.9,
  "data": {
    "category": "News",
    "title": "English title",
    "summary": "English summary.",
    "content": "English full content.",
    "published_at": "YYYY-MM-DD",
    "source_name": "Source name"
  },
  "spanish_version": {
    "title": "Título en español",
    "summary": "Resumen en español.",
    "content": "Contenido completo en español."
  }
}

## Stat update JSON

{
  "proposal_type": "stat_update",
  "target": "player_profile",
  "player_slug": "player-slug",
  "source_id": "short-source-id",
  "source_url": "https://source-link.com",
  "confidence": 0.95,
  "data": {
    "competition": "Competition name",
    "season": "2026/27",
    "round": "Round or date",
    "opponent": "Opponent",
    "points": 0,
    "rebounds": 0,
    "assists": 0,
    "steals": 0,
    "blocks": 0,
    "minutes": 0
  }
}

## Ignored JSON

{
  "proposal_type": "ignored",
  "reason": "Explain why this should not become a proposal.",
  "agent_notes": "Optional notes."
}