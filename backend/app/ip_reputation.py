from __future__ import annotations

import hashlib
import random

# ---------------------------------------------------------------------------
# Simulated IP Reputation Service
# ---------------------------------------------------------------------------
# In a production system this would query a threat-intelligence feed such as
# AbuseIPDB or MaxMind.  For the hackathon prototype we deterministically
# classify IPs by hashing them into one of three buckets so the demo is
# reproducible and realistic-looking.

_BLACKLISTED_PREFIXES = {"10.66.", "192.0.2.", "198.51.100.", "203.0.113."}


def _hash_bucket(ip: str) -> int:
    """Return a stable integer 0-99 derived from the IP string."""
    digest = hashlib.md5(ip.encode(), usedforsecurity=False).hexdigest()
    return int(digest[:4], 16) % 100


def get_ip_risk(ip: str) -> str:
    """
    Return one of:
      - 'blacklisted'  – IP is on the simulated threat list (high risk)
      - 'suspicious'   – IP shows anomalous patterns (medium risk)
      - 'clean'        – No known issues (low risk)
    """
    # Hard-coded blacklist prefixes for demo purposes
    for prefix in _BLACKLISTED_PREFIXES:
        if ip.startswith(prefix):
            return "blacklisted"

    bucket = _hash_bucket(ip)
    if bucket < 5:
        return "blacklisted"
    if bucket < 20:
        return "suspicious"
    return "clean"


def ip_risk_to_score_delta(ip_risk: str) -> int:
    """Return additional risk points to add based on IP reputation."""
    return {"blacklisted": 25, "suspicious": 10, "clean": 0}.get(ip_risk, 0)
