from __future__ import annotations

import logging
from pathlib import Path

import click

from engine.config import ConfigError, load_and_validate
from engine.renderer import DocumentRenderer, RenderError


def _configure_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=level, format="%(levelname)s: %(message)s")


@click.command()
@click.argument("input_json", type=click.Path(exists=True, dir_okay=False, path_type=Path))
@click.option("-o", "--output", type=click.Path(dir_okay=False, path_type=Path), default=Path("output.pdf"))
@click.option("--html-only", is_flag=True, help="Write rendered HTML instead of PDF.")
@click.option("--validate", "validate_only", is_flag=True, help="Validate input and exit.")
@click.option("--verbose", is_flag=True, help="Enable verbose logging.")
def main(input_json: Path, output: Path, html_only: bool, validate_only: bool, verbose: bool) -> None:
    """Generate a multi-page landscape A4 real estate exposé from JSON."""
    _configure_logging(verbose)

    root = Path(__file__).resolve().parent
    schema_path = root / "schema.json"

    try:
        config = load_and_validate(input_json, schema_path)
    except ConfigError as exc:
        raise click.ClickException(str(exc)) from exc

    if validate_only:
        click.echo("Config is valid.")
        return

    renderer = DocumentRenderer(templates_dir=root / "templates", base_dir=input_json.parent)
    html_str, valid_pages = renderer.build_html(config)

    if valid_pages == 0:
        raise click.ClickException("No valid pages could be rendered. Check required data for configured pages.")

    if html_only:
        output.write_text(html_str, encoding="utf-8")
        click.echo(f"Wrote HTML with {valid_pages} page(s): {output}")
        return

    try:
        renderer.html_to_pdf(html_str, output)
    except RenderError as exc:
        debug_html = output.with_suffix(".debug.html")
        debug_html.write_text(html_str, encoding="utf-8")
        raise click.ClickException(f"{exc}. Debug HTML written to {debug_html}") from exc

    click.echo(f"Wrote PDF with {valid_pages} page(s): {output}")


if __name__ == "__main__":
    main()
