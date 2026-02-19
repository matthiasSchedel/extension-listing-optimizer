from engine.resolver import FieldResolver


def test_resolve_nested_and_indexed_values() -> None:
    resolver = FieldResolver(
        {
            "property": {
                "images": {"gallery": ["a.jpg", "b.jpg"]},
                "location": {"description": "Text"},
            }
        }
    )

    assert resolver.resolve("property.images.gallery[1]") == "b.jpg"
    assert resolver.resolve("property.location.description") == "Text"
    assert resolver.resolve("property.missing", default="fallback") == "fallback"


def test_has_value() -> None:
    resolver = FieldResolver({"a": {"b": "  "}, "c": [1], "d": []})
    assert resolver.has_value("c") is True
    assert resolver.has_value("a.b") is False
    assert resolver.has_value("d") is False
