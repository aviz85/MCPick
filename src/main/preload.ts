import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // App Status
    getAppStatus: () => ipcRenderer.invoke('get-app-status'),
    browseConfigFile: () => ipcRenderer.invoke('browse-config-file'),
    openConfigLocation: () => ipcRenderer.invoke('open-config-location'),
    
    // Server Management
    getServers: () => ipcRenderer.invoke('get-servers'),
    getMaskedServers: () => ipcRenderer.invoke('get-masked-servers'),
    toggleServer: (serverName: string, enabled: boolean) => 
      ipcRenderer.invoke('toggle-server', serverName, enabled),
    saveServer: (serverName: string, serverConfig: any) => 
      ipcRenderer.invoke('save-server', serverName, serverConfig),
    deleteServer: (serverName: string) => 
      ipcRenderer.invoke('delete-server', serverName),
      
    // Server Sets Management
    getServerSets: () => ipcRenderer.invoke('get-server-sets'),
    saveServerSet: (setId: string, setConfig: any) => 
      ipcRenderer.invoke('save-server-set', setId, setConfig),
    deleteServerSet: (setId: string) => 
      ipcRenderer.invoke('delete-server-set', setId),
    applyServerSet: (setId: string) => 
      ipcRenderer.invoke('apply-server-set', setId),
      
    // Instructions Management
    getInstructions: () => ipcRenderer.invoke('get-instructions'),
    saveInstruction: (id: string, config: any) => 
      ipcRenderer.invoke('save-instruction', id, config),
    toggleInstruction: (id: string, enabled: boolean) => 
      ipcRenderer.invoke('toggle-instruction', id, enabled),
    deleteInstruction: (id: string) => 
      ipcRenderer.invoke('delete-instruction', id),
    testInstructionsServer: () => 
      ipcRenderer.invoke('test-instructions-server')
  }
); 