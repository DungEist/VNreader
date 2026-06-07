const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getAssetStatus: () => ipcRenderer.invoke('get-asset-status'),
  importLocalAssets: (srcDir, assetTypes) => ipcRenderer.invoke('import-local-assets', srcDir, assetTypes),
  pullCloudAssets: (preset, assetTypes) => ipcRenderer.invoke('pull-cloud-assets', preset, assetTypes),
  cancelPull: () => ipcRenderer.invoke('cancel-pull'),
  onLogUpdate: (callback) => ipcRenderer.on('log-update', (event, data) => callback(data)),
  onStatusUpdate: (callback) => ipcRenderer.on('status-update', (event, data) => callback(data)),
  isElectron: () => true
});
