// Copie three.js dans l'application pour qu'elle fonctionne hors ligne
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.min.js');
const dst = path.join(__dirname, '..', 'app', 'vendor', 'three.min.js');
fs.mkdirSync(path.dirname(dst), { recursive: true });
if (fs.existsSync(src)) { fs.copyFileSync(src, dst); console.log('three.js copié dans app/vendor'); }
else { console.warn('three.js introuvable : relance « npm install »'); }
