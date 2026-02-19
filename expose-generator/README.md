# Expose Generator

Config-driven Python CLI to generate landscape A4 German real estate exposé PDFs using WeasyPrint.

## Install

```bash
cd expose-generator
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Usage

```bash
python generate.py examples/sample_expose.json -o output.pdf
python generate.py examples/sample_expose.json --html-only -o preview.html
python generate.py examples/sample_expose.json --validate
python generate.py examples/sample_expose.json -o output.pdf --verbose
```

## Notes

- Pages are rendered in `pages[]` order from input JSON.
- Pages with missing required data are skipped gracefully.
- Missing images are logged and skipped without aborting generation.
- If PDF rendering fails, a `.debug.html` file is emitted for troubleshooting.
