import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { forms } from './forms.js';
import { createFiller, visibleQuestions } from '../public/fill-pdf.js';

const FONT_CANDIDATES = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
];

const { applyPlacement, placementsForForm } = createFiller(rgb);

async function firstExisting(paths) {
  for (const candidate of paths) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next font candidate.
    }
  }
  throw new Error('No Greek-capable font found. Expected DejaVu Sans or Noto Sans.');
}

export async function generateFilledPdfs({ answers, rootDir, outputDir, formIds }) {
  await fs.mkdir(outputDir, { recursive: true });
  const fontPath = await firstExisting(FONT_CANDIDATES);
  const fontBytes = await fs.readFile(fontPath);
  const output = [];
  const selectedFormIds = formIds ? new Set(formIds) : null;

  for (const form of forms.filter((item) => item.template && (!selectedFormIds || selectedFormIds.has(item.id)))) {
    const templatePath = path.join(rootDir, form.template);
    const pdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const font = await pdfDoc.embedFont(fontBytes);
    const pages = pdfDoc.getPages();
    const entries = placementsForForm(form, visibleQuestions(form.questions, answers), answers);

    for (const { placement, value } of entries) {
      const page = pages[placement.page];
      if (!page) {
        throw new Error(`${form.id} placement references missing page ${placement.page}`);
      }
      applyPlacement(page, font, placement, value);
    }

    const outputName = `${form.id}-${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputName);
    await fs.writeFile(outputPath, await pdfDoc.save());
    output.push({
      formId: form.id,
      title: form.title,
      fileName: outputName,
      path: outputPath,
    });
  }

  return output;
}
