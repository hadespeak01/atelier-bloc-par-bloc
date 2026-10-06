// Pont sécurisé entre l'interface et le système (dialogues de fichiers, menus)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  openProject: () => ipcRenderer.invoke('open-project'),
  saveProject: (data, path) => ipcRenderer.invoke('save-project', data, path || null),
  saveText: (text, name, ext) => ipcRenderer.invoke('save-text', text, name, ext),
  savePng: (dataUrl, name) => ipcRenderer.invoke('save-png', dataUrl, name),
  setTitle: (t) => ipcRenderer.send('set-title', t),
  onMenu: (cb) => ipcRenderer.on('menu', (_e, cmd) => cb(cmd)),
  onLoadFile: (cb) => ipcRenderer.on('load-file', (_e, file) => cb(file)),
});
