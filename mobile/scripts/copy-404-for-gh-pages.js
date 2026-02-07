/**
 * Copia dist/index.html para dist/404.html para GitHub Pages.
 * Assim, rotas do Expo Router (SPA) funcionam ao acessar URLs diretas ou refresh.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('404.html created in dist/ for GitHub Pages SPA routing.');
} else {
  console.warn('dist/index.html not found. Run "npm run build:web" first.');
  process.exit(1);
}
