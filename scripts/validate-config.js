import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { forms } from '../src/forms.js';

let errors = 0;

function fail(message) {
  errors += 1;
  console.error(`ERROR: ${message}`);
}

const root = process.cwd();

for (const form of forms) {
  let pageCount = null;
  if (form.template && fs.existsSync(path.join(root, form.template))) {
    const doc = await PDFDocument.load(fs.readFileSync(path.join(root, form.template)));
    pageCount = doc.getPageCount();
  }
  if (form.template && !fs.existsSync(path.join(root, form.template))) {
    fail(`${form.id} template is missing: ${form.template}`);
  }

  for (const question of form.questions) {
    if (!question.id) fail(`${form.id} has a question without id`);
    if (!question.label) fail(`${question.id} has no label`);

    if (['choice', 'scale', 'multi'].includes(question.type)) {
      if (!Array.isArray(question.options) || question.options.length === 0) {
        fail(`${question.id} has no options`);
      }
      for (const option of question.options ?? []) {
        if (option.value === undefined) fail(`${question.id} has an option without value`);
        if (!option.label) fail(`${question.id} option ${option.value} has no label`);
        for (const placement of option.placements ?? []) {
          if (placement.page === undefined) fail(`${question.id}/${option.value} placement has no page`);
          if (pageCount !== null && (placement.page < 0 || placement.page >= pageCount)) {
            fail(question.id + `/` + option.value + ` placement page ` + placement.page + ` is outside ` + pageCount + ` pages`);
          }
          if (!placement.type) fail(question.id + `/` + option.value + ` placement has no type`);
        }
      }
    }

    for (const placement of question.placements ?? []) {
      if (placement.page === undefined) fail(`${question.id} placement has no page`);
      if (pageCount !== null && (placement.page < 0 || placement.page >= pageCount)) {
        fail(question.id + ` placement page ` + placement.page + ` is outside ` + pageCount + ` pages`);
      }
      if (!placement.type) fail(question.id + ` placement has no type`);
    }
  }
}

if (errors > 0) {
  process.exit(1);
}

console.log(`Config OK: ${forms.length} sections, ${forms.flatMap((form) => form.questions).length} questions.`);
