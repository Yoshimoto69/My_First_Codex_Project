"""Report and outreach mock services."""
from __future__ import annotations

import datetime as dt
import uuid
from typing import Any, Dict

from . import utils

_owners = utils.load_seed("owners.json")


def enqueue_cma(payload: Dict[str, Any]) -> Dict[str, Any]:
    report_id = str(uuid.uuid4())
    # In real system, enqueue job. For MVP skeleton, return immediate status.
    return {"report_id": report_id, "status": "queued"}


def log_outreach(payload: Dict[str, Any]) -> Dict[str, Any]:
    owner_id = payload.get("owner_id")
    owner = next((o for o in _owners if o["id"] == owner_id), None)
    if not owner:
        return {"outreach_id": str(uuid.uuid4()), "status": "forbidden", "sent_at": None}
    if owner.get("consent_status") not in {"granted"}:
        return {"outreach_id": str(uuid.uuid4()), "status": "forbidden", "sent_at": None}
    return {
        "outreach_id": str(uuid.uuid4()),
        "status": "sent",
        "sent_at": dt.datetime.utcnow().isoformat() + "Z",
    }
