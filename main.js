// Atelier bloc par bloc — processus principal Electron
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;
let ready = false;
let pendingFile = null;
const isMac = process.platform === 'darwin';

const fileFromArgv = (argv) => argv.slice(1).find((a) => /\.abp$/i.test(a) && fs.existsSync(a));

function openPath(p) {
  if (!ready || !win) { pendingFile = p; return; }
  try {
    win.webContents.send('load-file', { path: p, name: path.basename(p), data: fs.readFileSync(p, 'utf8') });
  } catch (err) {
    dialog.showErrorBox('Ouverture impossible', `Le fichier n’a pas pu être lu.\n${err.message}`);
  }
}

function send(cmd) { if (win) win.webContents.send('menu', cmd); }

function buildMenu() {
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: 'À propos d’Atelier bloc par bloc' },
        { type: 'separator' },
        { role: 'hide', label: 'Masquer' },
        { role: 'hideOthers', label: 'Masquer les autres' },
        { role: 'unhide', label: 'Tout afficher' },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter' },
      ],
    }] : []),
    {
      label: 'Fichier',
      submenu: [
        { label: 'Nouveau', accelerator: 'CmdOrCtrl+N', click: () => send('new') },
        { label: 'Ouvrir…', accelerator: 'CmdOrCtrl+O', click: () => send('open') },
        { type: 'separator' },
        { label: 'Enregistrer', accelerator: 'CmdOrCtrl+S', click: () => send('save') },
        { label: 'Enregistrer sous…', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('saveAs') },
        { type: 'separator' },
        { label: 'Exporter en commandes Minecraft…', accelerator: 'CmdOrCtrl+E', click: () => send('export') },
        { label: 'Exporter le plan de la couche (PNG)…', accelerator: 'CmdOrCtrl+Shift+E', click: () => send('exportPlan') },
        ...(isMac ? [] : [{ type: 'separator' }, { role: 'quit', label: 'Quitter' }]),
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { label: 'Annuler', accelerator: 'CmdOrCtrl+Z', click: () => send('undo') },
        { label: 'Rétablir', accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y', click: () => send('redo') },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        { role: 'selectAll', label: 'Tout sélectionner' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Basculer vue 3D / plan 2D', accelerator: 'CmdOrCtrl+P', click: () => send('togglePlan') },
        { label: 'Recentrer la vue', accelerator: 'CmdOrCtrl+0', click: () => send('view') },
        { type: 'separator' },
        { role: 'zoomIn', label: 'Agrandir l’interface' },
        { role: 'zoomOut', label: 'Réduire l’interface' },
        { role: 'resetZoom', label: 'Taille réelle' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        { label: 'Raccourcis clavier', accelerator: 'F1', click: () => send('help') },
        ...(isMac ? [] : [{
          label: 'À propos',
          click: () => dialog.showMessageBox(win, {
            type: 'info', title: 'À propos', message: 'Atelier bloc par bloc',
            detail: `Version ${app.getVersion()}\nÉditeur de constructions Minecraft en 3D.`,
          }),
        }]),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 620,
    title: 'Atelier bloc par bloc',
    backgroundColor: '#12161e',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('did-finish-load', () => {
    ready = true;
    if (pendingFile) { const p = pendingFile; pendingFile = null; openPath(p); }
  });
  win.on('closed', () => { win = null; ready = false; });
  buildMenu();
}

// --- Dialogues fichiers ---
const PROJECT_FILTER = [{ name: 'Projet Atelier bloc par bloc', extensions: ['abp'] }, { name: 'JSON', extensions: ['json'] }];

ipcMain.handle('open-project', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Ouvrir un projet', filters: PROJECT_FILTER, properties: ['openFile'] });
  if (r.canceled || !r.filePaths.length) return null;
  const p = r.filePaths[0];
  return { path: p, name: path.basename(p), data: fs.readFileSync(p, 'utf8') };
});

ipcMain.handle('save-project', async (_e, data, p) => {
  if (!p) {
    const r = await dialog.showSaveDialog(win, { title: 'Enregistrer le projet', defaultPath: 'construction.abp', filters: PROJECT_FILTER });
    if (r.canceled || !r.filePath) return null;
    p = r.filePath;
  }
  fs.writeFileSync(p, data, 'utf8');
  return { path: p, name: path.basename(p) };
});

ipcMain.handle('save-text', async (_e, text, name, ext) => {
  const r = await dialog.showSaveDialog(win, {
    title: 'Exporter', defaultPath: name,
    filters: [{ name: ext === 'mcfunction' ? 'Fonction Minecraft' : 'Texte', extensions: [ext] }],
  });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, text, 'utf8');
  return r.filePath;
});

ipcMain.handle('save-png', async (_e, dataUrl, name) => {
  const r = await dialog.showSaveDialog(win, { title: 'Enregistrer le plan', defaultPath: name, filters: [{ name: 'Image PNG', extensions: ['png'] }] });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, Buffer.from(String(dataUrl).split(',')[1], 'base64'));
  return r.filePath;
});

ipcMain.on('set-title', (_e, t) => { if (win) win.setTitle(String(t)); });

// --- Ouverture des fichiers .abp (double-clic) ---
app.on('open-file', (e, p) => { e.preventDefault(); openPath(p); });

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    const f = fileFromArgv(argv);
    if (f) openPath(f);
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(() => {
    const f = fileFromArgv(process.argv);
    if (f) pendingFile = f;
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => { if (!isMac) app.quit(); });
}
