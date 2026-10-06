import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clientForms } from '../src/forms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

const FONT_CANDIDATES = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
];

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

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

async function buildStaticApp() {
  await fs.rm(docsDir, { recursive: true, force: true });
  await fs.mkdir(docsDir, { recursive: true });

  const forms = clientForms({ placements: true });
  await fs.writeFile(
    path.join(docsDir, 'forms.json'),
    `${JSON.stringify({ forms }, null, 2)}\n`,
  );

  let indexHtml = await fs.readFile(path.join(rootDir, 'public', 'index.html'), 'utf8');
  indexHtml = indexHtml
    .replace('<html lang="el">', '<html lang="el" data-static="true">')
    .replace('href="/styles.css"', 'href="./styles.css"')
    .replace('src="/app.js"', 'src="./app.js"')
    .replace(
      '<script type="module" src="./app.js"></script>',
      '<script src="./vendor/fontkit.umd.js"></script>\n    <script type="module" src="./app.js"></script>',
    );
  await fs.writeFile(path.join(docsDir, 'index.html'), indexHtml);

  await copyFile(path.join(rootDir, 'public', 'styles.css'), path.join(docsDir, 'styles.css'));
  await copyFile(path.join(rootDir, 'public', 'app.js'), path.join(docsDir, 'app.js'));
  await copyFile(path.join(rootDir, 'public', 'fill-pdf.js'), path.join(docsDir, 'fill-pdf.js'));
  await copyFile(path.join(rootDir, 'public', 'fill-browser.js'), path.join(docsDir, 'fill-browser.js'));
  await copyFile(
    path.join(rootDir, 'public', 'assets', 'pest-body-map.png'),
    path.join(docsDir, 'assets', 'pest-body-map.png'),
  );
  await copyFile(
    path.join(rootDir, 'node_modules', 'pdf-lib', 'dist', 'pdf-lib.esm.js'),
    path.join(docsDir, 'vendor', 'pdf-lib.esm.js'),
  );
  await copyFile(
    path.join(rootDir, 'node_modules', '@pdf-lib', 'fontkit', 'dist', 'fontkit.umd.js'),
    path.join(docsDir, 'vendor', 'fontkit.umd.js'),
  );
  await copyFile(await firstExisting(FONT_CANDIDATES), path.join(docsDir, 'assets', 'DejaVuSans.ttf'));

  for (const form of forms) {
    if (!form.template) continue;
    await copyFile(path.join(rootDir, form.template), path.join(docsDir, 'templates', form.template));
  }

  console.log(`Built GitHub Pages site in ${docsDir}`);
  console.log('PDF generation uses the answers selected in the browser.');
}

buildStaticApp().catch((error) => {
  console.error(error);
  process.exit(1);
});
