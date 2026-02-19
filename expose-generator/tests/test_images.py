from pathlib import Path

from engine.images import ImageProcessor


def test_local_image_to_data_uri(project_root: Path) -> None:
    base_dir = project_root / "examples"
    processor = ImageProcessor(base_dir=base_dir)
    try:
        uri = processor.resolve_to_data_uri("./assets/logo.png")
        assert uri is not None
        assert uri.startswith("data:image/")
    finally:
        processor.cleanup()


def test_missing_image_returns_none(tmp_path: Path) -> None:
    processor = ImageProcessor(base_dir=tmp_path)
    try:
        assert processor.resolve_to_data_uri("./does-not-exist.png") is None
    finally:
        processor.cleanup()
