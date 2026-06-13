import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clientForms } from './src/forms.js';
import { generateFilledPdfs } from './src/pdf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/filled', express.static(path.join(__dirname, 'filled')));

app.get('/api/forms', (_req, res) => {
  res.json({ forms: clientForms() });
});

app.post('/api/generate', async (req, res) => {
  try {
    const answers = req.body?.answers;
    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ error: 'Missing answers object.' });
      return;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'filled', stamp);
    const files = await generateFilledPdfs({ answers, rootDir: __dirname, outputDir });
    res.json({
      outputDir,
      files: files.map((file) => ({
        formId: file.formId,
        title: file.title,
        fileName: file.fileName,
        url: `/filled/${stamp}/${file.fileName}`,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`PDF quiz app running at http://localhost:${port}`);
});
