from pathlib import Path

from engine.images import ImageProcessor
from engine.layout import LayoutRenderer


def test_floor_plan_page_skips_when_required_data_missing(project_root: Path) -> None:
    image_processor = ImageProcessor(base_dir=project_root / "examples")
    try:
        renderer = LayoutRenderer(str(project_root / "templates"), image_processor)
        html = renderer.render_page(
            {"type": "floor_plan", "layout": {"columns": 1, "elements": []}},
            {"brand": {}, "property": {}},
        )
        assert html is None
    finally:
        image_processor.cleanup()
