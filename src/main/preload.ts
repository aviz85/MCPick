import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // App Status
    getAppStatus: () => ipcRenderer.invoke('get-app-status'),
    browseConfigFile: () => ipcRenderer.invoke('browse-config-file'),
    
    // Server Management
    getServers: () => ipcRenderer.invoke('get-servers'),
    getMaskedServers: () => ipcRenderer.invoke('get-masked-servers'),
    toggleServer: (serverName: string, enabled: boolean) => 
      ipcRenderer.invoke('toggle-server', serverName, enabled),
    saveServer: (serverName: string, serverConfig: any) => 
      ipcRenderer.invoke('save-server', serverName, serverConfig),
    deleteServer: (serverName: string) => 
      ipcRenderer.invoke('delete-server', serverName)
  }
); 