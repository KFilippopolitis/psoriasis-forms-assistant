import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { forms } from '../src/forms.js';
import { generateFilledPdfs } from '../src/pdf.js';

const pestForm = forms.find((form) => form.id === 'pest');
if (!pestForm) throw new Error('PEST form is missing.');

const pestJoints = pestForm.questions.find((question) => question.id === 'pest_joints');
if (!pestJoints) throw new Error('PEST joints question is missing.');

const answers = {
  pest_joints: pestJoints.options.map((option) => option.value),
};

for (const question of pestForm.questions) {
  if (question.id === 'pest_joints') continue;
  if (question.type === 'choice') {
    answers[question.id] = question.options.at(0)?.value;
  }
}

const outputDir = path.join(process.cwd(), 'filled', 'pest-mark-feedback');
const files = await generateFilledPdfs({
  answers,
  rootDir: process.cwd(),
  outputDir,
  formIds: ['pest'],
});

const generated = files.find((file) => file.formId === 'pest');
if (!generated) throw new Error('PEST PDF was not generated.');

const stablePdfPath = path.join(outputDir, 'pest-all-marks.pdf');
await fs.copyFile(generated.path, stablePdfPath);
await fs.rm(generated.path, { force: true });

const pdftoppm = spawnSync('command', ['-v', 'pdftoppm'], { shell: true, encoding: 'utf8' });
if (pdftoppm.status === 0) {
  const imagePrefix = path.join(outputDir, 'pest-all-marks');
  const render = spawnSync('pdftoppm', ['-png', '-f', '1', '-singlefile', stablePdfPath, imagePrefix], {
    encoding: 'utf8',
  });
  if (render.status === 0) {
    console.log(`Rendered preview: ${imagePrefix}.png`);
  } else {
    console.warn(`Could not render PNG preview: ${render.stderr || render.stdout}`);
  }
}

console.log(`Generated PEST all-marks PDF: ${stablePdfPath}`);
