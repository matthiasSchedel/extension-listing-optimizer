from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from engine.images import ImageProcessor
from engine.layout import LayoutRenderer
from engine.styles import FontManager, build_css


LOGGER = logging.getLogger(__name__)


class RenderError(Exception):
    """Raised when PDF rendering fails."""


class DocumentRenderer:
    def __init__(self, templates_dir: Path, base_dir: Path):
        self.templates_dir = templates_dir
        self.base_dir = base_dir
        self.base_env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml", "j2")),
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def build_html(self, config: dict[str, Any]) -> tuple[str, int]:
        image_processor = ImageProcessor(self.base_dir)
        try:
            layout_renderer = LayoutRenderer(str(self.templates_dir), image_processor)
            font_manager = FontManager(self.base_dir / ".font_cache")
            css = build_css(config.get("brand", {}), font_manager)

            pages_html: list[str] = []
            context = {"brand": config.get("brand", {}), "property": config.get("property", {})}
            for page in config.get("pages", []):
                page_html = layout_renderer.render_page(page, context)
                if page_html:
                    pages_html.append(page_html)

            if not pages_html:
                return "", 0

            template = self.base_env.get_template("base.html.j2")
            html_str = template.render(
                title=config.get("property", {}).get("title", "Exposé"),
                css=css,
                pages_html="\n".join(pages_html),
            )
            return html_str, len(pages_html)
        finally:
            image_processor.cleanup()

    @staticmethod
    def html_to_pdf(html_str: str, output_path: Path) -> None:
        try:
            from weasyprint import HTML

            HTML(string=html_str).write_pdf(str(output_path))
        except Exception as exc:
            raise RenderError(f"WeasyPrint rendering failed: {exc}") from exc
