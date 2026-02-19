from __future__ import annotations

import re
from typing import Any


_TOKEN_RE = re.compile(r"([^.\[\]]+)|(\[(\d+)\])")


class FieldResolver:
    def __init__(self, context: dict[str, Any]):
        self.context = context

    def resolve(self, path: str | None, default: Any = None) -> Any:
        if not path:
            return default

        current: Any = self.context
        for token in _TOKEN_RE.finditer(path):
            key = token.group(1)
            index = token.group(3)
            if key is not None:
                if not isinstance(current, dict) or key not in current:
                    return default
                current = current[key]
            elif index is not None:
                i = int(index)
                if not isinstance(current, list) or i >= len(current):
                    return default
                current = current[i]

        return current

    def has_value(self, path: str) -> bool:
        value = self.resolve(path)
        if value is None:
            return False
        if isinstance(value, str):
            return value.strip() != ""
        if isinstance(value, (list, dict)):
            return len(value) > 0
        return True
