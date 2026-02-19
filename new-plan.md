Here's the Codex prompt:Looks like the compute environment isn't available right now. Let me give you the prompt directly — it's ready to copy into Codex or Claude Code. Here's the complete prompt as a markdown file:

---

# Codex Prompt: German Real Estate Exposé PDF Generator

## Goal

Build a Python CLI tool that generates multi-page **landscape A4 PDF** exposés for German real estate listings using **WeasyPrint**. Layout is fully **config-driven via JSON** — each page's structure (columns, image placement, text blocks) is defined in the input JSON, not hardcoded in templates.

## Core Specs

- **Output**: Landscape A4 (297×210mm), multi-page PDF
- **Engine**: WeasyPrint v60+
- **Runtime**: Python 3.12+ CLI via `click`
- **Input**: Single JSON file with property data, page definitions, brand config
- **Missing data**: Graceful — skip pages with missing required data, never crash

## Architecture

```
expose.json → python generate.py expose.json -o output.pdf
  1. Validate JSON against schema
  2. Download/normalize images (URLs → temp dir, paths → verify)
  3. For each page in order:
     - Check required data exists → skip if not
     - Render HTML from layout config via Jinja2
     - Inject brand styles
  4. Concatenate all pages into single HTML document
  5. WeasyPrint → PDF
  6. Output to path
```

## JSON Input Schema

Three top-level sections: `brand`, `property`, `pages`.

### `brand`

```json
{
  "brand": {
    "name": "Immobilien Schmidt GmbH",
    "logo": "./assets/logo.png",
    "primary_color": "#1a365d",
    "secondary_color": "#e2a93b",
    "font_heading": "Montserrat",
    "font_body": "Open Sans",
    "contact": {
      "name": "Max Schmidt",
      "title": "Geschäftsführer",
      "phone": "+49 170 1234567",
      "email": "max@schmidt-immo.de",
      "photo": "./assets/agent.jpg"
    }
  }
}
```

### `property`

Flat structure. All fields optional. Pages reference fields via dot-path notation.

```json
{
  "property": {
    "title": "Exklusive 4-Zimmer-Wohnung mit Elbblick",
    "subtitle": "Hamburg-HafenCity | Erstbezug 2024",
    "description": "Lichtdurchflutete Wohnung im 8. OG...",
    "price": "€ 895.000",
    "address": "Am Sandtorkai 42, 20457 Hamburg",
    "living_area": "128 m²",
    "rooms": "4 Zimmer",
    "bedrooms": "3 Schlafzimmer",
    "bathrooms": "2 Badezimmer",
    "floor": "8. OG",
    "year_built": "2024",
    "heating": "Fußbodenheizung",
    "energy_class": "A+",
    "garage": "Tiefgaragenstellplatz",
    "balcony": "Loggia, 12 m²",
    "features": ["Aufzug", "Concierge", "Tiefgarage", "Fußbodenheizung", "Einbauküche"],
    "images": {
      "hero": "./assets/hero.jpg",
      "gallery": ["./assets/img1.jpg", "./assets/img2.jpg", "./assets/img3.jpg"],
      "floor_plan": "./assets/grundriss.png",
      "location_map": "./assets/lage.png"
    },
    "location": {
      "description": "Die HafenCity verbindet urbanes Wohnen mit maritimem Flair...",
      "highlights": ["Elbphilharmonie 5 Min.", "U4 Überseequartier 2 Min.", "Schulen & Kitas im Quartier"]
    }
  }
}
```

### `pages` — Ordered Page Definitions

Render in array order. Skip silently if required data missing.

**Page types & required fields:**

| Type | Required fields | Description |
|------|----------------|-------------|
| `cover` | `title`, `images.hero` | Full-bleed hero with overlay |
| `details` | `title` + ≥3 detail fields | Objektdaten |
| `floor_plan` | `images.floor_plan` | Grundriss |
| `location` | `location.description` OR `images.location_map` | Lage |
| `contact` | `brand.contact.name` | Ansprechpartner |

**Layout config per page** (core flexibility mechanism — flexbox-based columns with elements):

```json
{
  "pages": [
    {
      "type": "cover",
      "layout": {
        "background_image": "property.images.hero",
        "overlay": {
          "position": "bottom-left",
          "width": "50%",
          "padding": "40px",
          "background": "rgba(0,0,0,0.6)",
          "elements": [
            { "type": "text", "field": "property.title", "style": "heading" },
            { "type": "text", "field": "property.subtitle", "style": "subheading" },
            { "type": "text", "field": "property.price", "style": "price" },
            { "type": "image", "field": "brand.logo", "max_height": "40px" }
          ]
        }
      }
    },
    {
      "type": "details",
      "layout": {
        "columns": 2,
        "gap": "40px",
        "left": {
          "elements": [
            { "type": "text", "field": "property.description", "style": "body" },
            { "type": "feature_list", "field": "property.features", "style": "tags" }
          ]
        },
        "right": {
          "elements": [
            {
              "type": "data_table", "style": "key_value",
              "fields": [
                { "label": "Wohnfläche", "field": "property.living_area" },
                { "label": "Zimmer", "field": "property.rooms" },
                { "label": "Schlafzimmer", "field": "property.bedrooms" },
                { "label": "Badezimmer", "field": "property.bathrooms" },
                { "label": "Etage", "field": "property.floor" },
                { "label": "Baujahr", "field": "property.year_built" },
                { "label": "Heizung", "field": "property.heating" },
                { "label": "Energieklasse", "field": "property.energy_class" },
                { "label": "Stellplatz", "field": "property.garage" },
                { "label": "Balkon/Loggia", "field": "property.balcony" }
              ]
            },
            { "type": "image", "field": "property.images.gallery[0]", "fit": "cover", "height": "200px" }
          ]
        }
      }
    },
    {
      "type": "floor_plan",
      "layout": {
        "columns": 1,
        "elements": [
          { "type": "section_title", "text": "Grundriss", "style": "heading" },
          { "type": "image", "field": "property.images.floor_plan", "fit": "contain", "max_height": "85%" }
        ]
      }
    },
    {
      "type": "location",
      "layout": {
        "columns": 2,
        "left": {
          "elements": [
            { "type": "section_title", "text": "Lage", "style": "heading" },
            { "type": "text", "field": "property.location.description", "style": "body" },
            { "type": "feature_list", "field": "property.location.highlights", "style": "bullets" }
          ]
        },
        "right": {
          "elements": [
            { "type": "image", "field": "property.images.location_map", "fit": "cover" }
          ]
        }
      }
    },
    {
      "type": "contact",
      "layout": {
        "columns": 2,
        "background_color": "brand.primary_color",
        "text_color": "#ffffff",
        "left": {
          "elements": [
            { "type": "section_title", "text": "Ihr Ansprechpartner", "style": "heading" },
            { "type": "image", "field": "brand.contact.photo", "fit": "cover", "width": "180px", "height": "220px", "border_radius": "8px" },
            { "type": "text", "field": "brand.contact.name", "style": "subheading" },
            { "type": "text", "field": "brand.contact.title", "style": "body" }
          ]
        },
        "right": {
          "elements": [
            { "type": "text", "field": "brand.contact.phone", "style": "body", "icon": "phone" },
            { "type": "text", "field": "brand.contact.email", "style": "body", "icon": "email" },
            { "type": "image", "field": "brand.logo", "max_height": "60px", "position": "bottom" }
          ]
        }
      }
    }
  ]
}
```

## Element Types

| Element | Description | Key Props |
|---------|-------------|-----------|
| `text` | Value from `field` path or literal `text` | `style`: heading/subheading/body/price/caption |
| `image` | Image block | `fit`: cover/contain, `width`, `height`, `max_height`, `border_radius` |
| `data_table` | Key-value table | `fields[]`: `{label, field}` — skip rows with missing field |
| `feature_list` | Features/highlights | `style`: tags (inline badges) or bullets |
| `section_title` | Heading with decorative accent line | Uses brand primary_color |
| `spacer` | Vertical whitespace | `height` in px or mm |

## CSS & Styling

- Each page: `<section>` with `page-break-after: always`
- `@page { size: 297mm 210mm; margin: 0; }` for full-bleed
- Content pages: internal padding via layout, not @page margin
- **Fonts**: Download Google Font .ttf/.woff2 at build time to local cache. Use `@font-face` with local files. Do NOT use @import URLs.
- Auto-generate color palette from primary/secondary (lighter/darker via colorsys)
- Style mapping: heading=28pt bold primary, subheading=18pt semibold, body=11pt 1.6lh, price=32pt bold secondary, caption=9pt gray

## Image Handling

1. Accept URLs and local paths
2. URLs → download to temp, retry once, skip on fail
3. Local → resolve relative to JSON location, verify exists
4. All → base64 data URIs in final HTML
5. Resize to max 2000px longest edge (Pillow)

## CLI

```bash
python generate.py expose.json -o output.pdf
python generate.py expose.json -o output.pdf --verbose
python generate.py expose.json --html-only -o preview.html
python generate.py expose.json --validate
```

## Project Structure

```
expose-generator/
├── generate.py
├── requirements.txt        # weasyprint, click, jinja2, pillow, requests, jsonschema
├── schema.json
├── engine/
│   ├── __init__.py
│   ├── config.py           # Load & validate JSON
│   ├── resolver.py         # Resolve "property.images.gallery[0]" paths
│   ├── images.py           # Download, normalize, resize, base64
│   ├── styles.py           # CSS from brand config
│   ├── layout.py           # Layout config → HTML
│   └── renderer.py         # Assemble HTML, call WeasyPrint
├── templates/
│   ├── base.html.j2
│   ├── page.html.j2
│   └── elements/           # text, image, data_table, feature_list, section_title, spacer
├── examples/
│   ├── sample_expose.json
│   └── assets/
└── README.md
```

## Constraints

- **No CSS Grid** — use flexbox only
- **No JavaScript** — WeasyPrint doesn't execute it
- **object-fit workaround**: Use `background-image` + `background-size` instead
- **Page breaks**: `page-break-after: always` per section, `page-break-inside: avoid` on elements

## Testing

Include `sample_expose.json` with realistic German data. Generate colored placeholder rects with Pillow if no images. Must produce valid 5-page PDF: `python generate.py examples/sample_expose.json -o test_output.pdf`

## Error Handling

- Invalid JSON → validation error with path to violation
- Missing image → warn, skip element, continue
- Missing page data → info, skip page, continue
- WeasyPrint fail → log error, output HTML for debug
- Zero valid pages → error, exit code 1

---

This prompt is designed to be self-contained — paste it into Codex or Claude Code and it should produce a working generator in one shot. The JSON schema examples serve as both documentation and test fixtures.

One thing to watch: if Codex struggles with the font downloading logic, you can simplify the first iteration by hardcoding system fonts and adding Google Fonts support as a follow-up.
