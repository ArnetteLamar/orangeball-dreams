# Orangeball Dreams — Stats Rules

The Orangeball Scouting Agent may only create stat_update proposals when the source provides a complete and reliable stat line.

## Required stat_update fields

Every stat_update must include:

- player_slug
- source_id
- source_url
- confidence
- competition
- season
- round
- opponent
- points
- rebounds
- assists
- steals
- blocks
- minutes

Current stats.csv format:

competition,season,round,opponent,points,rebounds,assists,steals,blocks,minutes

## Valid stat sources

Use only:

- official league boxscores
- official federation boxscores
- official club match reports with complete individual stats
- FIBA / BAL / FEB / FPB / Liga Endesa / Liga Betclic or equivalent official data
- trusted statistics platforms only when official boxscore is unavailable

## Do not create stat_update when

Do not create stat_update if:

- only points are available
- minutes are missing
- rebounds, assists, steals or blocks are missing
- opponent is unclear
- competition is unclear
- the player identity is uncertain
- the source is social media without complete stats
- the game is preseason and stats are incomplete
- data comes from memory or assumptions

## What to do with partial stats

If a source says something like:

"Player X scored 7 points"

but does not provide rebounds, assists, steals, blocks and minutes, return:

recommendation: player_profile

Create a news_update, not a stat_update.

## What to do with incomplete official news

If the official club report mentions the player but does not show a full boxscore:

recommendation: player_profile

Do not infer missing numbers.

## What to do with uncertain stats

If the source is useful but incomplete:

recommendation: needs_manual_review

Do not create JSON stat_update.

## Example valid stat_update

{
  "proposal_type": "stat_update",
  "target": "player_profile",
  "player_slug": "player-slug",
  "source_id": "official-boxscore-short-id",
  "source_url": "https://official-boxscore-link.com",
  "confidence": 0.95,
  "data": {
    "competition": "Competition name",
    "season": "2026/27",
    "round": "Round 1",
    "opponent": "Opponent name",
    "points": 12,
    "rebounds": 5,
    "assists": 3,
    "steals": 1,
    "blocks": 0,
    "minutes": 24
  },
  "evidence": {
    "source_url": "https://official-boxscore-link.com",
    "source_name": "Official Boxscore",
    "source_date": "YYYY-MM-DD",
    "why_relevant": "Official complete boxscore for this player."
  }
}

## Example invalid stat case

If the source only says:

"Diego Niebla scored 7 points"

return:

recommendation: player_profile

Do not create stat_update because rebounds, assists, steals, blocks and minutes are missing.