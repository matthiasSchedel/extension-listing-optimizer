from __future__ import annotations

import json
from pathlib import Path

from click.testing import CliRunner

from generate import main


def test_validate_command(project_root: Path) -> None:
    runner = CliRunner()
    result = runner.invoke(main, [str(project_root / "examples" / "sample_expose.json"), "--validate"])

    assert result.exit_code == 0
    assert "Config is valid." in result.output


def test_html_only_generation(project_root: Path, tmp_path: Path) -> None:
    runner = CliRunner()
    output = tmp_path / "preview.html"

    result = runner.invoke(
        main,
        [
            str(project_root / "examples" / "sample_expose.json"),
            "--html-only",
            "-o",
            str(output),
        ],
    )

    assert result.exit_code == 0
    assert output.exists()
    text = output.read_text(encoding="utf-8")
    assert "<section" in text


def test_zero_valid_pages_returns_error(project_root: Path, tmp_path: Path) -> None:
    config = json.loads((project_root / "examples" / "sample_expose.json").read_text(encoding="utf-8"))
    config["pages"] = [{"type": "floor_plan", "layout": {"columns": 1, "elements": []}}]
    config["property"]["images"].pop("floor_plan", None)

    config_path = tmp_path / "invalid-pages.json"
    config_path.write_text(json.dumps(config), encoding="utf-8")

    runner = CliRunner()
    result = runner.invoke(main, [str(config_path), "--html-only", "-o", str(tmp_path / "out.html")])

    assert result.exit_code != 0
    assert "No valid pages could be rendered" in result.output
