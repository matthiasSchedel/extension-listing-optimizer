from __future__ import annotations

import html
import logging
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from engine.images import ImageProcessor
from engine.resolver import FieldResolver


LOGGER = logging.getLogger(__name__)


class LayoutRenderer:
    def __init__(self, templates_dir: str, image_processor: ImageProcessor):
        self.env = Environment(
            loader=FileSystemLoader(templates_dir),
            autoescape=select_autoescape(enabled_extensions=("html", "xml", "j2")),
            trim_blocks=True,
            lstrip_blocks=True,
        )
        self.image_processor = image_processor

    def render_page(self, page: dict[str, Any], context: dict[str, Any]) -> str | None:
        resolver = FieldResolver(context)
        page_type = page.get("type", "")
        if not self._page_has_required_data(page_type, resolver):
            LOGGER.info("Skipping page '%s': required data missing", page_type)
            return None

        layout = page.get("layout", {})

        if page_type == "cover":
            body_html = self._render_cover(layout, resolver)
        else:
            body_html = self._render_standard(layout, resolver)

        if not body_html.strip():
            LOGGER.info("Skipping page '%s': no renderable content", page_type)
            return None

        page_style = self._build_page_style(layout)
        page_tpl = self.env.get_template("page.html.j2")
        return page_tpl.render(page_type=page_type, body_html=body_html, page_style=page_style)

    def _page_has_required_data(self, page_type: str, resolver: FieldResolver) -> bool:
        if page_type == "cover":
            return resolver.has_value("property.title") and resolver.has_value("property.images.hero")
        if page_type == "details":
            candidates = [
                "property.living_area",
                "property.rooms",
                "property.bedrooms",
                "property.bathrooms",
                "property.floor",
                "property.year_built",
                "property.heating",
                "property.energy_class",
                "property.garage",
                "property.balcony",
            ]
            detail_count = sum(1 for path in candidates if resolver.has_value(path))
            return resolver.has_value("property.title") and detail_count >= 3
        if page_type == "floor_plan":
            return resolver.has_value("property.images.floor_plan")
        if page_type == "location":
            return resolver.has_value("property.location.description") or resolver.has_value("property.images.location_map")
        if page_type == "contact":
            return resolver.has_value("brand.contact.name")
        return True

    @staticmethod
    def _build_page_style(layout: dict[str, Any]) -> str:
        styles: list[str] = []
        background = layout.get("background_color")
        if background:
            styles.append(f"background-color: {background};")
        text_color = layout.get("text_color")
        if text_color:
            styles.append(f"color: {text_color};")
        return " ".join(styles)

    def _render_cover(self, layout: dict[str, Any], resolver: FieldResolver) -> str:
        bg_field = layout.get("background_image")
        bg_source = resolver.resolve(bg_field) if isinstance(bg_field, str) else None
        bg_uri = self.image_processor.resolve_to_data_uri(bg_source)
        if not bg_uri:
            return ""

        overlay = layout.get("overlay", {})
        position = overlay.get("position", "bottom-left")
        overlay_style = self._style_from_map(
            {
                "width": overlay.get("width"),
                "padding": overlay.get("padding"),
                "background": overlay.get("background"),
            }
        )
        overlay_elements = self._render_elements(overlay.get("elements", []), resolver)

        return (
            f'<div class="cover-background" style="background-image: url(\'{bg_uri}\');"></div>'
            f'<div class="cover-overlay {html.escape(position)}" style="{overlay_style}">{overlay_elements}</div>'
        )

    def _render_standard(self, layout: dict[str, Any], resolver: FieldResolver) -> str:
        columns = int(layout.get("columns", 1))
        gap = layout.get("gap", "20px")

        if columns <= 1:
            elements = layout.get("elements", [])
            content = self._render_elements(elements, resolver)
            if not content:
                return ""
            return f'<div class="content-layout"><div class="column">{content}</div></div>'

        left_content = self._render_elements(layout.get("left", {}).get("elements", []), resolver)
        right_content = self._render_elements(layout.get("right", {}).get("elements", []), resolver)
        if not left_content and not right_content:
            return ""

        return (
            '<div class="content-layout">'
            f'<div class="columns" style="gap: {html.escape(str(gap))};">'
            f'<div class="column">{left_content}</div>'
            f'<div class="column">{right_content}</div>'
            "</div></div>"
        )

    def _render_elements(self, elements: list[dict[str, Any]], resolver: FieldResolver) -> str:
        parts: list[str] = []
        for element in elements:
            rendered = self._render_element(element, resolver)
            if rendered:
                parts.append(rendered)
        return "".join(parts)

    def _render_element(self, element: dict[str, Any], resolver: FieldResolver) -> str:
        element_type = element.get("type")

        if element_type == "text":
            text_value = self._resolve_text_value(element, resolver)
            if text_value is None:
                return ""
            style = html.escape(str(element.get("style", "body")))
            icon = element.get("icon")
            content = html.escape(str(text_value))
            if icon:
                icon_label = "Telefon" if icon == "phone" else "E-Mail" if icon == "email" else html.escape(str(icon))
                return f'<div class="element text style-{style} icon-line"><strong>{icon_label}:</strong> {content}</div>'
            return f'<div class="element text style-{style}">{content}</div>'

        if element_type == "section_title":
            title = element.get("text")
            if not title:
                return ""
            return f'<div class="element section-title">{html.escape(str(title))}</div>'

        if element_type == "spacer":
            height = html.escape(str(element.get("height", "12px")))
            return f'<div class="element spacer" style="height: {height};"></div>'

        if element_type == "image":
            source = resolver.resolve(element.get("field")) if element.get("field") else None
            uri = self.image_processor.resolve_to_data_uri(source)
            if not uri:
                return ""
            fit = element.get("fit", "cover")
            styles = {
                "background-image": f"url('{uri}')",
                "background-size": "contain" if fit == "contain" else "cover",
                "height": element.get("height"),
                "width": element.get("width"),
                "max-height": element.get("max_height"),
                "border-radius": element.get("border_radius"),
            }
            if fit == "contain":
                styles["background-color"] = "#ffffff"
            if element.get("position") == "bottom":
                styles["margin-top"] = "auto"
            return f'<div class="element image-block" style="{self._style_from_map(styles)}"></div>'

        if element_type == "data_table":
            rows: list[str] = []
            for field_map in element.get("fields", []):
                value = resolver.resolve(field_map.get("field"))
                if value in (None, "", []):
                    continue
                label = html.escape(str(field_map.get("label", "")))
                value_html = html.escape(str(value))
                rows.append(
                    '<div class="data-row">'
                    f'<span class="data-key">{label}</span>'
                    f'<span class="data-value">{value_html}</span>'
                    "</div>"
                )
            if not rows:
                return ""
            return f'<div class="element data-table">{"".join(rows)}</div>'

        if element_type == "feature_list":
            items = resolver.resolve(element.get("field"))
            if not isinstance(items, list) or not items:
                return ""
            style = element.get("style", "bullets")
            if style == "tags":
                tags = "".join(f'<span class="feature-tag">{html.escape(str(item))}</span>' for item in items)
                return f'<div class="element feature-list feature-list-tags">{tags}</div>'
            bullets = "".join(f'<p class="feature-bullet">• {html.escape(str(item))}</p>' for item in items)
            return f'<div class="element feature-list feature-list-bullets">{bullets}</div>'

        LOGGER.warning("Unknown element type '%s' skipped", element_type)
        return ""

    @staticmethod
    def _style_from_map(style_map: dict[str, Any]) -> str:
        parts: list[str] = []
        for key, value in style_map.items():
            if value is None:
                continue
            parts.append(f"{key}: {html.escape(str(value))};")
        return " ".join(parts)

    @staticmethod
    def _resolve_text_value(element: dict[str, Any], resolver: FieldResolver) -> Any | None:
        if "text" in element:
            return element.get("text")
        if "field" in element:
            return resolver.resolve(element.get("field"))
        return None
