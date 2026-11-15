import { extractText, getDocumentProxy } from "unpdf";
import { extractTerms } from "@/lib/benefits/extract";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Send a PDF as multipart form data in the file field." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose a PDF file to upload." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "PDF must be 10 MB or smaller." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    return Response.json({ error: "Only PDF files are supported." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length < 5 || String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") {
    return Response.json({ error: "This does not look like a valid PDF." }, { status: 400 });
  }

  try {
    const pdf = await getDocumentProxy(bytes, { maxImageSize: 16_777_216 });
    try {
      if (pdf.numPages > 100) {
        return Response.json({ error: "PDF has too many pages (maximum 100)." }, { status: 400 });
      }
      const { totalPages, text } = await extractText(pdf, { mergePages: true });
      const content = text;
      if (!content.trim()) {
        return Response.json({ error: "This PDF has no selectable text (scanned?). Enter your plan terms by hand below." }, { status: 422 });
      }
      return Response.json({ pages: totalPages, characters: content.length, extraction: extractTerms(content) });
    } finally {
      await pdf.cleanup();
    }
  } catch {
    return Response.json({ error: "We could not read this PDF. Try another file or enter terms by hand." }, { status: 400 });
  }
}
