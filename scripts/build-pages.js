import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clientForms } from '../src/forms.js';
import { generateFilledPdfs } from '../src/pdf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const samplesDir = path.join(docsDir, 'samples');

const SAMPLE_ANSWERS = JSON.parse(
  await fs.readFile(path.join(__dirname, 'sample-answers.json'), 'utf8'),
);

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function buildStaticApp() {
  await fs.rm(docsDir, { recursive: true, force: true });
  await fs.mkdir(samplesDir, { recursive: true });

  const forms = clientForms();
  await fs.writeFile(
    path.join(docsDir, 'forms.json'),
    JSON.stringify({ forms }, null, 2),
  );

  const files = await generateFilledPdfs({
    answers: SAMPLE_ANSWERS,
    rootDir,
    outputDir: samplesDir,
  });

  const manifest = {
    note: 'Demo samples generated from scripts/sample-answers.json. Run the app locally for live PDF generation.',
    files: files.map((file) => ({
      formId: file.formId,
      title: file.title,
      fileName: file.fileName,
      url: `./samples/${file.fileName}`,
    })),
  };
  await fs.writeFile(
    path.join(docsDir, 'samples.json'),
    JSON.stringify(manifest, null, 2),
  );

  let indexHtml = await fs.readFile(path.join(rootDir, 'public', 'index.html'), 'utf8');
  indexHtml = indexHtml
    .replace('<html lang="el">', '<html lang="el" data-static="true">')
    .replace('href="/styles.css"', 'href="./styles.css"')
    .replace('src="/app.js"', 'src="./app.js"');
  await fs.writeFile(path.join(docsDir, 'index.html'), indexHtml);

  await copyFile(path.join(rootDir, 'public', 'styles.css'), path.join(docsDir, 'styles.css'));
  await copyFile(path.join(rootDir, 'public', 'app.js'), path.join(docsDir, 'app.js'));

  console.log(`Built GitHub Pages site in ${docsDir}`);
  console.log(`Included ${files.length} sample PDFs for the live demo.`);
}

buildStaticApp().catch((error) => {
  console.error(error);
  process.exit(1);
});
