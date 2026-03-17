from __future__ import annotations

import hashlib


def mask_user_id(user_id: str) -> str:
    """
    Return a privacy-safe representation of a user identifier.

    The first two characters are preserved for readability; the remainder is
    replaced with asterisks, and a 4-character hex suffix derived from a
    one-way hash is appended so that the same user always gets the same masked
    ID without exposing the original value.

    Example:
        "user-12345"  ->  "us***-a3f1"
        "U00042"      ->  "U0***-7c9e"
    """
    if len(user_id) <= 2:
        return "**"
    prefix = user_id[:2]
    suffix = hashlib.sha256(user_id.encode()).hexdigest()[:4]
    return f"{prefix}***-{suffix}"


def mask_txn_id(txn_id: str) -> str:
    """Return a partially masked transaction ID safe for display."""
    if len(txn_id) <= 4:
        return "****"
    return txn_id[:4] + "****" + txn_id[-4:]
