from __future__ import annotations

import colorsys
import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from urllib.parse import quote

import requests

LOGGER = logging.getLogger(__name__)


@dataclass
class FontReference:
    family: str
    file_path: Optional[Path]


class FontManager:
    def __init__(self, cache_dir: Path) -> None:
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def fetch_google_font(self, family: str) -> FontReference:
        safe_name = family.lower().replace(" ", "-")
        cached = next(self.cache_dir.glob(f"{safe_name}.*"), None)
        if cached:
            return FontReference(family=family, file_path=cached)

        try:
            family_param = quote(
                family.replace(" ", "+") + ":wght@400;600;700", safe="+:@;"
            )
            css_url = (
                f"https://fonts.googleapis.com/css2?family={family_param}&display=swap"
            )
            response = requests.get(
                css_url, timeout=20, headers={"User-Agent": "Mozilla/5.0"}
            )
            response.raise_for_status()
            urls = re.findall(r"url\((https://[^)]+)\)", response.text)
            if not urls:
                raise ValueError("No downloadable URL found in Google Fonts CSS")

            font_url = urls[0]
            font_response = requests.get(font_url, timeout=20)
            font_response.raise_for_status()
            extension = Path(font_url).suffix or ".ttf"
            target = self.cache_dir / f"{safe_name}{extension}"
            target.write_bytes(font_response.content)
            return FontReference(family=family, file_path=target)
        except Exception as exc:  # pragma: no cover - depends on network
            LOGGER.warning("Unable to fetch Google Font '%s': %s", family, exc)
            return FontReference(family=family, file_path=None)


def _hex_to_rgb(color: str) -> tuple[float, float, float]:
    value = color.lstrip("#")
    if len(value) != 6:
        raise ValueError(f"Expected #RRGGBB, got {color}")
    r = int(value[0:2], 16) / 255
    g = int(value[2:4], 16) / 255
    b = int(value[4:6], 16) / 255
    return r, g, b


def _rgb_to_hex(rgb: tuple[float, float, float]) -> str:
    return "#{:02x}{:02x}{:02x}".format(
        max(0, min(255, round(rgb[0] * 255))),
        max(0, min(255, round(rgb[1] * 255))),
        max(0, min(255, round(rgb[2] * 255))),
    )


def _tint(color: str, amount: float) -> str:
    r, g, b = _hex_to_rgb(color)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = max(0.0, min(1.0, l + amount))
    return _rgb_to_hex(colorsys.hls_to_rgb(h, l, s))


def _font_face(reference: FontReference, weight: int) -> str:
    if not reference.file_path:
        return ""
    uri = reference.file_path.resolve().as_uri()
    suffix = reference.file_path.suffix.lower()
    fmt = (
        "woff2"
        if suffix == ".woff2"
        else "truetype"
        if suffix == ".ttf"
        else "opentype"
        if suffix == ".otf"
        else "woff2"
    )
    return (
        "@font-face {"
        f"font-family: '{reference.family}';"
        "font-style: normal;"
        f"font-weight: {weight};"
        f"src: url('{uri}') format('{fmt}');"
        "}"
    )


def build_css(brand: dict, font_manager: FontManager) -> str:
    primary = brand.get("primary_color", "#1a365d")
    secondary = brand.get("secondary_color", "#e2a93b")

    heading_family = brand.get("font_heading", "Montserrat")
    body_family = brand.get("font_body", "Open Sans")

    heading_ref = font_manager.fetch_google_font(heading_family)
    body_ref = font_manager.fetch_google_font(body_family)

    heading_stack = f"'{heading_ref.family}', 'Segoe UI', sans-serif"
    body_stack = f"'{body_ref.family}', 'Helvetica Neue', Arial, sans-serif"

    primary_light = _tint(primary, 0.15)
    primary_dark = _tint(primary, -0.15)
    gray_700 = "#374151"
    gray_500 = "#6b7280"
    surface = "#f8fafc"

    return f"""
{_font_face(heading_ref, 700)}
{_font_face(body_ref, 400)}
{_font_face(body_ref, 600)}

@page {{
  size: 297mm 210mm;
  margin: 0;
}}

* {{
  box-sizing: border-box;
}}

html, body {{
  margin: 0;
  padding: 0;
  font-family: {body_stack};
  color: {gray_700};
}}

.page {{
  width: 297mm;
  height: 210mm;
  page-break-after: always;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}}

.page:last-child {{
  page-break-after: auto;
}}

.cover-background {{
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}}

.cover-overlay {{
  position: absolute;
  max-width: 80%;
  color: #ffffff;
}}

.cover-overlay.bottom-left {{
  left: 24mm;
  bottom: 18mm;
}}

.content-layout {{
  padding: 18mm 18mm 14mm;
  display: flex;
  width: 100%;
  height: 100%;
}}

.columns {{
  display: flex;
  width: 100%;
  height: 100%;
}}

.column {{
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4mm;
}}

.element {{
  page-break-inside: avoid;
}}

.style-heading, .section-title {{
  font-family: {heading_stack};
  font-size: 28pt;
  font-weight: 700;
  color: {primary};
  line-height: 1.2;
}}

.style-subheading {{
  font-family: {heading_stack};
  font-size: 18pt;
  font-weight: 600;
  color: {primary_dark};
  line-height: 1.3;
}}

.style-body {{
  font-family: {body_stack};
  font-size: 11pt;
  line-height: 1.6;
  color: {gray_700};
}}

.style-price {{
  font-family: {heading_stack};
  font-size: 32pt;
  font-weight: 700;
  color: {secondary};
  line-height: 1.1;
}}

.style-caption {{
  font-size: 9pt;
  color: {gray_500};
}}

.section-title {{
  padding-bottom: 3mm;
  border-bottom: 1.5mm solid {primary_light};
  margin-bottom: 1mm;
}}

.data-table {{
  border: 1px solid {primary_light};
  border-radius: 6px;
  overflow: hidden;
  font-size: 10.5pt;
}}

.data-row {{
  display: flex;
  justify-content: space-between;
  padding: 2.5mm 3mm;
  border-bottom: 1px solid {surface};
}}

.data-row:last-child {{
  border-bottom: none;
}}

.data-key {{
  color: {gray_500};
}}

.data-value {{
  font-weight: 600;
  color: {gray_700};
  margin-left: 4mm;
  text-align: right;
}}

.feature-list-tags {{
  display: flex;
  flex-wrap: wrap;
  gap: 2mm;
}}

.feature-tag {{
  background: {surface};
  color: {primary_dark};
  border: 1px solid {primary_light};
  border-radius: 999px;
  padding: 1.5mm 2.5mm;
  font-size: 9.5pt;
}}

.feature-list-bullets {{
  display: block;
}}

.feature-bullet {{
  margin: 0 0 2mm;
  font-size: 10.5pt;
}}

.image-block {{
  width: 100%;
  min-height: 35mm;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 4px;
}}

.icon-line {{
  display: flex;
  align-items: center;
  gap: 2mm;
}}

.contact-page .style-body,
.contact-page .style-subheading,
.contact-page .section-title {{
  color: #ffffff;
}}
""".strip()
