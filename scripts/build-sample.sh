#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$APP_DIR/public/sample-benefits.pdf" \
  "file://$APP_DIR/scripts/sample-benefits.html"; then
  exit 0
fi

# Restricted macOS runners may abort Chrome before it starts. PyMuPDF is an
# optional local fallback; it renders the same HTML content into two pages.
echo "Chrome could not start; rendering the sample with PyMuPDF." >&2
python3 - "$APP_DIR" <<'PY'
from pathlib import Path
import re
import sys
import fitz

app = Path(sys.argv[1])
source = (app / 'scripts/sample-benefits.html').read_text()
css = re.search(r'<style>(.*?)</style>', source, re.S).group(1)
css += '''
.page {width:auto; height:auto; padding:0; position:static;}
.footer {position:static; margin-top:16px; padding-top:6px; font-size:8pt;}
.footer span {display:block;}
h2 {margin-top:18px;}
body {font-size:10.5pt; line-height:1.45;}
.eyebrow {font-size:8pt;}
h1 {font-size:25pt;}
.note {margin-top:10px;}
'''
doc = fitz.open()
sections = re.findall(r'<section class="page">(.*?)</section>', source, re.S)
assert len(sections) == 2, 'Expected two sample pages'
for section in sections:
    page = doc.new_page(width=612, height=792)
    spare, scale = page.insert_htmlbox(
        fitz.Rect(48, 42, 564, 748), '<div class="page">' + section + '</div>',
        css=css, scale_low=0.85,
    )
    assert spare >= 0, 'Sample content does not fit the page'
doc.save(app / 'public/sample-benefits.pdf')
print('Rendered sample-benefits.pdf: 2 pages (PyMuPDF fallback)')
PY
