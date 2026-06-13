import fs from 'node:fs/promises';
import path from 'node:path';
import { forms, isQuestionVisible } from '../src/forms.js';
import { generateFilledPdfs } from '../src/pdf.js';

const answers = JSON.parse(await fs.readFile(new URL('./sample-answers.json', import.meta.url), 'utf8'));

let changed = true;
while (changed) {
  changed = false;
  for (const form of forms) {
    for (const question of form.questions) {
      if (!isQuestionVisible(question, answers)) continue;
      if (answers[question.id] !== undefined) continue;
      changed = true;
      if (question.type === 'choice') {
        answers[question.id] = question.options.at(0)?.value;
      } else if (question.type === 'scale') {
        answers[question.id] = '5';
      } else if (question.type === 'multi') {
        answers[question.id] = question.options.slice(0, 2).map((option) => option.value);
      } else if (question.type === 'date' || question.inputType === 'date') {
        answers[question.id] = new Date().toISOString().slice(0, 10);
      } else if (question.type === 'number' || question.inputType === 'number') {
        answers[question.id] = question.max === 100 ? '75' : '1';
      } else {
        answers[question.id] = '1';
      }
    }
  }
}

const stamp = `sample-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const outputDir = path.join(process.cwd(), 'filled', stamp);
const files = await generateFilledPdfs({ answers, rootDir: process.cwd(), outputDir });

console.log(`Generated ${files.length} sample PDFs in ${outputDir}`);
