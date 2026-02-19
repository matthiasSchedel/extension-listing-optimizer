from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


class ConfigError(Exception):
    """Raised when configuration loading or validation fails."""


def _format_validation_error(error: Any) -> str:
    path = ".".join([str(part) for part in error.absolute_path])
    location = path if path else "<root>"
    return f"Validation error at '{location}': {error.message}"


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ConfigError(f"Invalid JSON in {path}: {exc}") from exc


def load_and_validate(config_path: Path, schema_path: Path) -> dict[str, Any]:
    if not config_path.exists():
        raise ConfigError(f"Config file not found: {config_path}")
    if not schema_path.exists():
        raise ConfigError(f"Schema file not found: {schema_path}")

    config = load_json(config_path)
    schema = load_json(schema_path)

    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(config), key=lambda err: list(err.path))
    if errors:
        raise ConfigError(_format_validation_error(errors[0]))

    return config
