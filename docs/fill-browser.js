import { PDFDocument, rgb } from './vendor/pdf-lib.esm.js';
import { createFiller, visibleQuestions } from './fill-pdf.js';

const { applyPlacement, placementsForForm } = createFiller(rgb);

export async function fillAnswerPdfs(forms, answers) {
  const fontkit = globalThis.fontkit;
  if (!fontkit) throw new Error('Η γραμματοσειρά για τα PDF δεν φορτώθηκε.');

  const fontBytes = await fetch(new URL('./assets/DejaVuSans.ttf', import.meta.url)).then((response) => {
    if (!response.ok) throw new Error('Η γραμματοσειρά για τα PDF δεν είναι διαθέσιμη.');
    return response.arrayBuffer();
  });

  const files = [];
  for (const form of forms) {
    if (!form.template) continue;
    const templateUrl = new URL(`./templates/${encodeURIComponent(form.template)}`, import.meta.url);
    const pdfResponse = await fetch(templateUrl);
    if (!pdfResponse.ok) throw new Error(`Το πρότυπο ${form.title} δεν είναι διαθέσιμο.`);
    const pdfDoc = await PDFDocument.load(await pdfResponse.arrayBuffer());
    pdfDoc.registerFontkit(fontkit);
    const font = await pdfDoc.embedFont(fontBytes);
    const pages = pdfDoc.getPages();
    const entries = placementsForForm(form, visibleQuestions(form.questions, answers), answers);

    for (const { placement, value } of entries) {
      const page = pages[placement.page];
      if (!page) throw new Error(`${form.id} placement references missing page ${placement.page}`);
      applyPlacement(page, font, placement, value);
    }

    const bytes = await pdfDoc.save();
    files.push({
      formId: form.id,
      title: form.title,
      fileName: `${form.id}.pdf`,
      url: URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })),
    });
  }

  return files;
}
