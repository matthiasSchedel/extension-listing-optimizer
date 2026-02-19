from __future__ import annotations

import base64
import io
import logging
import shutil
import tempfile
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import requests
from PIL import Image


LOGGER = logging.getLogger(__name__)


class ImageProcessor:
    def __init__(self, base_dir: Path, max_edge: int = 2000) -> None:
        self.base_dir = base_dir
        self.max_edge = max_edge
        self.cache: dict[str, str] = {}
        self.temp_dir = Path(tempfile.mkdtemp(prefix="expose-images-"))

    def cleanup(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def resolve_to_data_uri(self, source: str | None) -> Optional[str]:
        if not source:
            return None
        if source in self.cache:
            return self.cache[source]

        path = self._resolve_source(source)
        if not path:
            return None

        data_uri = self._image_file_to_data_uri(path)
        if not data_uri:
            return None

        self.cache[source] = data_uri
        return data_uri

    def _resolve_source(self, source: str) -> Optional[Path]:
        if self._is_url(source):
            return self._download_url(source)

        local_path = Path(source)
        if not local_path.is_absolute():
            local_path = (self.base_dir / local_path).resolve()

        if not local_path.exists():
            LOGGER.warning("Image not found, skipping: %s", local_path)
            return None
        return local_path

    @staticmethod
    def _is_url(value: str) -> bool:
        parsed = urlparse(value)
        return parsed.scheme in {"http", "https"}

    def _download_url(self, url: str) -> Optional[Path]:
        last_error: Exception | None = None
        for attempt in range(2):
            try:
                response = requests.get(url, timeout=20)
                response.raise_for_status()
                suffix = Path(urlparse(url).path).suffix or ".img"
                target = self.temp_dir / f"img_{len(self.cache)}_{attempt}{suffix}"
                target.write_bytes(response.content)
                return target
            except Exception as exc:  # pragma: no cover - network path
                last_error = exc
        LOGGER.warning("Image download failed, skipping %s: %s", url, last_error)
        return None

    def _image_file_to_data_uri(self, path: Path) -> Optional[str]:
        try:
            with Image.open(path) as image:
                image.load()
                image.thumbnail((self.max_edge, self.max_edge), Image.Resampling.LANCZOS)

                output = io.BytesIO()
                fmt = (image.format or "PNG").upper()
                if fmt not in {"PNG", "JPEG", "JPG", "WEBP"}:
                    fmt = "PNG"

                if fmt in {"JPEG", "JPG"}:
                    if image.mode not in {"RGB", "L"}:
                        image = image.convert("RGB")
                    image.save(output, format="JPEG", quality=88, optimize=True)
                    mime = "image/jpeg"
                else:
                    if image.mode == "P":
                        image = image.convert("RGBA")
                    image.save(output, format="PNG", optimize=True)
                    mime = "image/png"

            encoded = base64.b64encode(output.getvalue()).decode("ascii")
            return f"data:{mime};base64,{encoded}"
        except Exception as exc:
            LOGGER.warning("Unable to process image %s: %s", path, exc)
            return None
