# Orangeball Dreams — News Agent Prompt Template

Use the instructions from:

ai-engine/data/agents/news-agent-instructions.md

Now research recent and relevant basketball news for:

PLAYER / TOPIC:
[WRITE PLAYER NAME OR TOPIC HERE]

ORANGEBALL DREAMS PLAYER SLUG, if already inside the platform:
[WRITE PLAYER SLUG HERE OR LEAVE EMPTY]

TASK:
Find one relevant, recent and verifiable news item connected with this player/topic.

The news can be about:
- club performance;
- national team call-up;
- signing or transfer;
- interview;
- scouting signal;
- market movement;
- youth development;
- injury update;
- competition performance;
- career milestone.

RULES:
- Use only reliable sources.
- Do not invent facts.
- Do not use rumours as facts.
- Do not copy article text.
- Include the original source URL.
- Return only valid JSON.
- Do not add explanation before or after the JSON.

OUTPUT:
Return the final answer using exactly the JSON structure defined in the News Agent Instructions.

TARGET:
Use "both" if the news should appear on homepage and player profile.
Use "homepage" if it is a general platform/news item.
Use "player_profile" if it should only appear in the player profile.

LANGUAGES:
Write category, title and summary in both Spanish and English.

QUALITY CHECK:
Before returning the JSON, confirm internally:
- the source exists;
- the URL works;
- the date is correct;
- the summary is factual;
- the title is not exaggerated;
- the JSON is valid.