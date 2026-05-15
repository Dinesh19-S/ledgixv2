const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add any inter-process communication methods here if needed
  platform: process.platform,
});
