const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Native file dialog
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  // Native folder dialog
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),

  // Engine error notifications
  onEngineError: (callback) => ipcRenderer.on('engine-error', (_, msg) => callback(msg)),
});
