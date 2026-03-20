"""Dataset disk persistence with in-memory fallback.

Saves datasets to disk (parquet format) so they survive server restarts.
The in-memory stores remain the primary source; disk is a fallback.

Usage:
    from app.data.persistence import save_to_disk, load_from_disk

This module does NOT replace the in-memory flow. It adds a safety net.
"""

import logging
import os
from pathlib import Path

import pandas as pd

logger = logging.getLogger("dataforge.persistence")

# ── Storage directory ──────────────────────────────────────
_PERSIST_DIR = Path(__file__).resolve().parent.parent / "artifacts" / "datasets"
_RAW_DIR = _PERSIST_DIR / "raw"
_PIPELINE_DIR = _PERSIST_DIR / "pipelines"


def _ensure_dirs():
    """Create persistence directories if they don't exist."""
    _RAW_DIR.mkdir(parents=True, exist_ok=True)
    _PIPELINE_DIR.mkdir(parents=True, exist_ok=True)


def save_raw_to_disk(key: str, df: pd.DataFrame) -> None:
    """Persist a raw dataset to disk.

    Args:
        key: Storage key (e.g. "u5_d3").
        df: The DataFrame to save.
    """
    try:
        _ensure_dirs()
        path = _RAW_DIR / f"{key}.parquet"
        df.to_parquet(path, index=False)
        logger.debug("Raw dataset saved to disk: %s", path)
    except Exception as exc:
        logger.warning("Failed to persist raw dataset '%s': %s", key, exc)


def load_raw_from_disk(key: str) -> pd.DataFrame | None:
    """Load a raw dataset from disk if available.

    Args:
        key: Storage key (e.g. "u5_d3").

    Returns:
        DataFrame if found on disk, None otherwise.
    """
    try:
        path = _RAW_DIR / f"{key}.parquet"
        if path.exists():
            df = pd.read_parquet(path)
            logger.info("Raw dataset loaded from disk: %s", path)
            return df
    except Exception as exc:
        logger.warning("Failed to load raw dataset '%s' from disk: %s", key, exc)
    return None


def save_pipeline_to_disk(pipeline_id: str, df: pd.DataFrame) -> None:
    """Persist a finalized pipeline dataset to disk.

    Args:
        pipeline_id: Pipeline identifier (e.g. "pipe_8347").
        df: The finalized DataFrame to save.
    """
    try:
        _ensure_dirs()
        path = _PIPELINE_DIR / f"{pipeline_id}.parquet"
        df.to_parquet(path, index=False)
        logger.debug("Pipeline dataset saved to disk: %s", path)
    except Exception as exc:
        logger.warning("Failed to persist pipeline dataset '%s': %s", pipeline_id, exc)


def load_pipeline_from_disk(pipeline_id: str) -> pd.DataFrame | None:
    """Load a pipeline dataset from disk if available.

    Args:
        pipeline_id: Pipeline identifier.

    Returns:
        DataFrame if found on disk, None otherwise.
    """
    try:
        path = _PIPELINE_DIR / f"{pipeline_id}.parquet"
        if path.exists():
            df = pd.read_parquet(path)
            logger.info("Pipeline dataset loaded from disk: %s", path)
            return df
    except Exception as exc:
        logger.warning("Failed to load pipeline dataset '%s' from disk: %s", pipeline_id, exc)
    return None
