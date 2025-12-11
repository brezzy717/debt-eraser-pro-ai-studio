import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create vault directory if it doesn't exist
const vaultDir = path.join(__dirname, '..', 'public', 'vault');
if (!fs.existsSync(vaultDir)) {
  fs.mkdirSync(vaultDir, { recursive: true });
  console.log('📁 Created vault directory');
}

// Serve static files from the vault directory
export const serveVaultFiles = (app: express.Application) => {
  app.use('/vault', express.static(vaultDir));
  console.log('📁 Vault file storage configured');
};

// Create placeholder PDF files for demo purposes
export const createPlaceholderFiles = () => {
  const placeholderFiles = [
    'section-609.pdf',
    'inquiry-removal.pdf',
    'medical-debt.pdf',
    'cease-desist.pdf',
    'vod-template.pdf'
  ];

  placeholderFiles.forEach(filename => {
    const filePath = path.join(vaultDir, filename);
    if (!fs.existsSync(filePath)) {
      // Create a simple text file as placeholder
      const content = `DEBT ERASER PRO - ${filename.replace('.pdf', '').toUpperCase()}\n\nThis is a placeholder document.\n\nIn production, replace this with actual legal templates.`;
      fs.writeFileSync(filePath, content);
    }
  });

  console.log('📄 Placeholder vault files created');
};
