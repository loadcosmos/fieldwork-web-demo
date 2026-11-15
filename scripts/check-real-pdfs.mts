// Runs the rule-based extractor over real public benefits PDFs.
// Usage: node --experimental-strip-types scripts/check-real-pdfs.mts <file.pdf> [...]
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import { extractTerms } from "../src/lib/benefits/extract.ts";

for (const path of process.argv.slice(2)) {
  const pdf = await getDocumentProxy(new Uint8Array(await readFile(path)));
  const { text } = await extractText(pdf, { mergePages: true });
  const { found, terms } = extractTerms(text);
  const values = found.map((key) => `${key}=${JSON.stringify(terms[key])}`).join(", ");
  console.log(`${basename(path)}: ${pdf.numPages} pages, found ${found.length}/12 — ${values || "nothing"}`);
}
