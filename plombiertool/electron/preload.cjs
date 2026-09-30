const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('plombiertoolPlatform', {
  native: true,
  platform: 'windows'
});
