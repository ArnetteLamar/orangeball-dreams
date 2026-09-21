from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path.cwd()

INBOX_DIR = ROOT / "ai-engine" / "data" / "agents" / "inbox"
PROCESSED_DIR = ROOT / "ai-engine" / "data" / "agents" / "processed"
REJECTED_DIR = ROOT / "ai-engine" / "data" / "agents" / "rejected"

HOME_NEWS_PENDING_DIR = ROOT / "ai-engine" / "data" / "news" / "pending"
PLAYER_PROPOSALS_DIR = ROOT / "ai-engine" / "data" / "proposals"


CATEGORY_ES = {
    "news": "Noticias",
    "interview": "Entrevista",
    "performance": "Rendimiento",
    "club update": "Actualización de club",
    "coaching": "Entrenador",
    "coaching move": "Movimiento de entrenador",
    "player spotlight": "Foco de jugador",
    "player development": "Desarrollo de jugador",
    "transfer": "Fichaje",
    "signing": "Fichaje",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def clean_url(value: Any) -> str:
    text = clean_text(value)

    # Convert markdown links: [text](https://url.com)
    match = re.search(r"\]\((https?://[^)]+)\)", text)
    if match:
        text = match.group(1)

    text = text.replace("?utm_source=chatgpt.com", "")
    text = text.replace("&utm_source=chatgpt.com", "")

    return text.strip()


def safe_file_part(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "agent-proposal"


def make_proposal_id(prefix: str = "proposal-agent") -> str:
    return f"{prefix}-{timestamp()}"


def read_jsonish(file_path: Path) -> dict[str, Any]:
    text = file_path.read_text(encoding="utf-8-sig").strip()

    if text.startswith("```"):
        text = re.sub(r"^```json", "", text, flags=re.IGNORECASE).strip()
        text = re.sub(r"^```", "", text).strip()
        text = re.sub(r"```$", "", text).strip()

    first = text.find("{")
    last = text.rfind("}")

    if first >= 0 and last > first:
        text = text[first : last + 1]

    return json.loads(text)


def get_proposals(payload: dict[str, Any]) -> list[dict[str, Any]]:
    if isinstance(payload.get("proposals"), list):
        return payload["proposals"]

    if payload.get("proposal_type"):
        return [payload]

    return []


def require_base(proposal: dict[str, Any]) -> tuple[str, str, float]:
    proposal_type = clean_text(proposal.get("proposal_type"))

    if proposal_type == "ignored":
        raise ValueError("ignored proposal skipped")

    if proposal_type not in {"news_update", "stat_update", "profile_update"}:
        raise ValueError(f"Unsupported proposal_type: {proposal_type}")

    source_url = clean_url(
        proposal.get("source_url")
        or proposal.get("evidence", {}).get("source_url")
    )

    if not source_url:
        raise ValueError("Missing source_url")

    confidence = float(proposal.get("confidence") or 0)

    if confidence < 0.75:
        raise ValueError(f"Confidence too low: {confidence}")

    return proposal_type, source_url, confidence


def title_pair(data: dict[str, Any], spanish: dict[str, Any]) -> dict[str, str]:
    title = data.get("title")

    if isinstance(title, dict):
        en = clean_text(title.get("en") or title.get("es"))
        es = clean_text(title.get("es") or title.get("en"))
    else:
        en = clean_text(title)
        es = clean_text(spanish.get("title"))

    if not es:
        es = en

    return {"en": en, "es": es}


def summary_pair(data: dict[str, Any], spanish: dict[str, Any]) -> dict[str, str]:
    summary = data.get("summary")

    if isinstance(summary, dict):
        en = clean_text(summary.get("en") or summary.get("es"))
        es = clean_text(summary.get("es") or summary.get("en"))
    else:
        en = clean_text(summary)
        es = clean_text(spanish.get("summary"))

    if not es:
        es = en

    return {"en": en, "es": es}


def category_pair(data: dict[str, Any]) -> dict[str, str]:
    category = data.get("category")

    if isinstance(category, dict):
        en = clean_text(category.get("en") or category.get("es") or "News")
        es = clean_text(category.get("es") or category.get("en") or "Noticias")
        return {"en": en, "es": es}

    en_raw = clean_text(category or "News")
    en = en_raw[:1].upper() + en_raw[1:]
    es = CATEGORY_ES.get(en_raw.lower(), en)

    return {"en": en, "es": es}


def import_homepage_news(proposal: dict[str, Any], source_url: str, confidence: float) -> Path:
    data = proposal.get("data") or {}
    spanish = proposal.get("spanish_version") or {}
    evidence = proposal.get("evidence") or {}

    player_slug = clean_text(proposal.get("player_slug") or data.get("player_slug"))
    news_id = clean_text(data.get("id") or proposal.get("source_id") or f"{player_slug}-agent-news-{timestamp()}")

    record = {
        "proposal_type": "news_update",
        "target": "homepage",
        "source_id": clean_text(proposal.get("source_id") or news_id),
        "source_url": source_url,
        "confidence": confidence,
        "status": "pending",
        "created_at": now_iso(),
        "data": {
            "id": news_id,
            "date": clean_text(data.get("date") or data.get("published_at") or today()),
            "homepage": True,
            "category": category_pair(data),
            "title": title_pair(data, spanish),
            "summary": summary_pair(data, spanish),
            "image": clean_text(data.get("image")),
            "player_slug": player_slug,
            "href": clean_text(data.get("href") or (f"/{{locale}}/athletes/{player_slug}" if player_slug else source_url)),
            "source": clean_text(data.get("source") or data.get("source_name") or proposal.get("source_id") or "Source"),
        },
        "evidence": {
            "source_url": clean_url(evidence.get("source_url") or source_url),
            "source_name": clean_text(evidence.get("source_name") or data.get("source_name") or data.get("source") or "Source"),
            "source_date": clean_text(evidence.get("source_date") or data.get("published_at") or today()),
            "why_relevant": clean_text(evidence.get("why_relevant") or proposal.get("agent_notes")),
        },
    }

    HOME_NEWS_PENDING_DIR.mkdir(parents=True, exist_ok=True)

    file_name = f"{record['data']['date']}-{safe_file_part(news_id)}.json"
    out_path = HOME_NEWS_PENDING_DIR / file_name

    out_path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")

    return out_path


def get_player_pending_dir(slug: str) -> Path:
    return PLAYER_PROPOSALS_DIR / slug / "pending"


def import_player_news(proposal: dict[str, Any], source_url: str, confidence: float) -> Path:
    slug = clean_text(proposal.get("player_slug"))
    if not slug:
        raise ValueError("Missing player_slug")

    data = proposal.get("data") or {}
    spanish = proposal.get("spanish_version") or {}

    proposal_id = make_proposal_id()

    notes = clean_text(proposal.get("agent_notes"))
    if spanish:
        notes += "\n\nSpanish version:\n"
        notes += json.dumps(spanish, indent=2, ensure_ascii=False)

    record = {
        "proposal_id": proposal_id,
        "type": "news_update",
        "source": clean_text(proposal.get("source_id") or data.get("source_name") or "orangeball-agent"),
        "source_url": source_url,
        "confidence": confidence,
        "status": "pending",
        "created_at": now_iso(),
        "notes": notes or "Proposta de notícia criada a partir do Orangeball Scouting Agent.",
        "proposed_data": {
            "category": clean_text(data.get("category") or "News"),
            "title": clean_text(data.get("title")),
            "summary": clean_text(data.get("summary")),
            "content": clean_text(data.get("content")),
            "published_at": clean_text(data.get("published_at") or today()),
            "source_name": clean_text(data.get("source_name") or proposal.get("source_id") or "Source"),
        },
        "audit": {
            "created_by": "orangeball-scouting-agent-importer",
        },
    }

    pending_dir = get_player_pending_dir(slug)
    pending_dir.mkdir(parents=True, exist_ok=True)

    out_path = pending_dir / f"{proposal_id}.json"
    out_path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")

    return out_path


def import_stat_update(proposal: dict[str, Any], source_url: str, confidence: float) -> Path:
    slug = clean_text(proposal.get("player_slug"))
    if not slug:
        raise ValueError("Missing player_slug")

    data = proposal.get("data") or {}
    proposal_id = make_proposal_id()

    required = [
        "competition",
        "season",
        "round",
        "opponent",
        "points",
        "rebounds",
        "assists",
        "steals",
        "blocks",
        "minutes",
    ]

    missing = [field for field in required if field not in data]
    if missing:
        raise ValueError(f"Missing stat fields: {', '.join(missing)}")

    record = {
        "proposal_id": proposal_id,
        "type": "add_game",
        "source": clean_text(proposal.get("source_id") or "orangeball-agent"),
        "source_url": source_url,
        "confidence": confidence,
        "status": "pending",
        "created_at": now_iso(),
        "notes": clean_text(proposal.get("agent_notes")) or "Proposta de estatística criada a partir do Orangeball Scouting Agent.",
        "proposed_data": {
            "competition": clean_text(data.get("competition")),
            "season": clean_text(data.get("season")),
            "round": clean_text(data.get("round")),
            "opponent": clean_text(data.get("opponent")),
            "points": float(data.get("points") or 0),
            "rebounds": float(data.get("rebounds") or 0),
            "assists": float(data.get("assists") or 0),
            "steals": float(data.get("steals") or 0),
            "blocks": float(data.get("blocks") or 0),
            "minutes": float(data.get("minutes") or 0),
        },
        "audit": {
            "created_by": "orangeball-scouting-agent-importer",
        },
    }

    pending_dir = get_player_pending_dir(slug)
    pending_dir.mkdir(parents=True, exist_ok=True)

    out_path = pending_dir / f"{proposal_id}.json"
    out_path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")

    return out_path


def import_profile_update(proposal: dict[str, Any], source_url: str, confidence: float) -> Path:
    slug = clean_text(proposal.get("player_slug"))
    if not slug:
        raise ValueError("Missing player_slug")

    data = proposal.get("data") or {}
    proposal_id = make_proposal_id()

    proposed_data = {}

    editable_fields = [
        "profile_type",
        "name",
        "club",
        "position",
        "nationality",
        "gender",
        "league",
        "height_cm",
        "photo",
        "highlight_video",
        "instagram",
        "youtube",
        "bio",
        "agent_notes",
        "status",
        "tags",
    ]

    for field in editable_fields:
        value = data.get(field)
        if value not in (None, ""):
            proposed_data[field] = value

    if not proposed_data:
        raise ValueError("Profile update has no proposed_data")

    record = {
        "proposal_id": proposal_id,
        "type": "profile_update",
        "source": clean_text(proposal.get("source_id") or "orangeball-agent"),
        "source_url": source_url,
        "confidence": confidence,
        "status": "pending",
        "created_at": now_iso(),
        "notes": clean_text(proposal.get("agent_notes")) or "Proposta de perfil criada a partir do Orangeball Scouting Agent.",
        "proposed_data": proposed_data,
        "audit": {
            "created_by": "orangeball-scouting-agent-importer",
        },
    }

    pending_dir = get_player_pending_dir(slug)
    pending_dir.mkdir(parents=True, exist_ok=True)

    out_path = pending_dir / f"{proposal_id}.json"
    out_path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")

    return out_path


def import_proposal(proposal: dict[str, Any]) -> Path | None:
    proposal_type, source_url, confidence = require_base(proposal)

    target = clean_text(proposal.get("target"))

    if proposal_type == "news_update" and target == "homepage":
        return import_homepage_news(proposal, source_url, confidence)

    if proposal_type == "news_update":
        return import_player_news(proposal, source_url, confidence)

    if proposal_type == "stat_update":
        return import_stat_update(proposal, source_url, confidence)

    if proposal_type == "profile_update":
        return import_profile_update(proposal, source_url, confidence)

    return None


def main() -> None:
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    REJECTED_DIR.mkdir(parents=True, exist_ok=True)

    files = sorted(
        list(INBOX_DIR.glob("*.json"))
        + list(INBOX_DIR.glob("*.md"))
        + list(INBOX_DIR.glob("*.txt"))
    )

    if not files:
        print("No files found in ai-engine/data/agents/inbox")
        return

    total_created = 0

    for file_path in files:
        print(f"\nProcessing: {file_path.name}")

        try:
            payload = read_jsonish(file_path)
            proposals = get_proposals(payload)

            if not proposals:
                raise ValueError("No proposals found")

            created_paths: list[Path] = []
            skipped = 0

            for proposal in proposals:
                try:
                    out_path = import_proposal(proposal)
                    if out_path:
                        created_paths.append(out_path)
                        print(f"  Created: {out_path.relative_to(ROOT)}")
                except Exception as item_error:
                    skipped += 1
                    print(f"  Skipped: {item_error}")

            total_created += len(created_paths)

            destination = PROCESSED_DIR / f"{timestamp()}-{file_path.name}"
            shutil.move(str(file_path), str(destination))

            print(
                f"Done: {len(created_paths)} created, {skipped} skipped. "
                f"Moved to {destination.relative_to(ROOT)}"
            )

        except Exception as error:
            destination = REJECTED_DIR / f"{timestamp()}-{file_path.name}"
            shutil.move(str(file_path), str(destination))

            error_file = destination.with_suffix(destination.suffix + ".error.txt")
            error_file.write_text(str(error), encoding="utf-8")

            print(f"Rejected: {file_path.name}")
            print(f"Reason: {error}")

    print(f"\nImport complete. Total proposals created: {total_created}")


if __name__ == "__main__":
    main()