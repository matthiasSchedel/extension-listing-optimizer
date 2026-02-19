from pathlib import Path

import pytest

from engine.config import ConfigError, load_and_validate


def test_load_and_validate_success(project_root: Path) -> None:
    config_path = project_root / "examples" / "sample_expose.json"
    schema_path = project_root / "schema.json"

    config = load_and_validate(config_path, schema_path)
    assert config["brand"]["name"] == "Immobilien Schmidt GmbH"


def test_load_and_validate_invalid_json(project_root: Path, tmp_path: Path) -> None:
    bad_path = tmp_path / "bad.json"
    bad_path.write_text("{ not-json", encoding="utf-8")

    with pytest.raises(ConfigError):
        load_and_validate(bad_path, project_root / "schema.json")
