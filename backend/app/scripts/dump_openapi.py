"""Dump the FastAPI OpenAPI schema to stdout as stable, sorted JSON.

Used by `devbox run gen:openapi` and by the `typegen` devbox service.
Stable output (sorted keys, consistent indentation) keeps diffs minimal
when the committed `openapi.json` is regenerated.
"""

import json
import sys

from app.main import app


def main() -> None:
    schema = app.openapi()
    json.dump(schema, sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
