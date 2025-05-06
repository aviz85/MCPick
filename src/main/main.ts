import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import Store from 'electron-store';

// Define interface for our data store
interface StoreSchema {
  claudeConfigPath: string;
  servers: {
    [key: string]: {
      enabled: boolean;
      command: string;
      args: string[];
      env?: {
        [key: string]: string;
      };
    };
  };
  serverSets: {
    [key: string]: {
      name: string;
      description: string;
      prompt: string;
      servers: string[];
    }
  };
}

// Initialize electron-store
// Using any type to fix TypeScript issues with electron-store
const store = new Store<StoreSchema>() as any;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load from the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Get default Claude config path based on OS
function getDefaultClaudeConfigPath(): string {
  switch (os.platform()) {
    case 'darwin':
      return path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
    case 'win32':
      return path.join(process.env.APPDATA || '', 'Claude/claude_desktop_config.json');
    default:
      return '';
  }
}

// Check if Claude config file exists
function checkClaudeConfigExists(configPath: string): boolean {
  try {
    return fs.existsSync(configPath);
  } catch (error) {
    console.error('Error checking Claude config:', error);
    return false;
  }
}

// Read Claude config file
function readClaudeConfig(configPath: string): any {
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading Claude config:', error);
    return { mcpServers: {} };
  }
}

// Write to Claude config file
function writeClaudeConfig(configPath: string, config: any): boolean {
  try {
    // Create backup first
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup`;
      fs.copyFileSync(configPath, backupPath);
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing Claude config:', error);
    return false;
  }
}

// Update Claude config with enabled servers
function syncEnabledServersToClaudeConfig(): boolean {
  const configPath = store.get('claudeConfigPath');
  if (!configPath || !checkClaudeConfigExists(configPath)) {
    return false;
  }

  const claudeConfig = readClaudeConfig(configPath);
  const enabledServers = Object.entries(store.get('servers'))
    .filter(([_, serverConfig]: [string, any]) => serverConfig.enabled)
    .reduce((acc, [key, serverConfig]: [string, any]) => {
      const { enabled, ...serverDetails } = serverConfig;
      acc[key] = serverDetails;
      return acc;
    }, {} as Record<string, any>);

  claudeConfig.mcpServers = enabledServers;
  return writeClaudeConfig(configPath, claudeConfig);
}

// App ready event
app.on('ready', () => {
  createWindow();
  
  // Check if we have a stored Claude config path, otherwise use default
  let configPath = store.get('claudeConfigPath');
  if (!configPath) {
    configPath = getDefaultClaudeConfigPath();
    if (checkClaudeConfigExists(configPath)) {
      store.set('claudeConfigPath', configPath);
    }
  }
  
  // If we have a valid config path, read it to initialize our store
  if (configPath && checkClaudeConfigExists(configPath)) {
    const claudeConfig = readClaudeConfig(configPath);
    
    // Initialize our store with the existing MCP servers as enabled
    if (claudeConfig.mcpServers) {
      const servers = Object.entries(claudeConfig.mcpServers).reduce((acc, [key, value]: [string, any]) => {
        acc[key] = {
          enabled: true,
          ...value
        };
        return acc;
      }, {} as Record<string, any>);
      
      // Merge with existing servers in our store
      const existingServers = store.get('servers');
      store.set('servers', { ...existingServers, ...servers });
    }
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers

// Get app status
ipcMain.handle('get-app-status', () => {
  const configPath = store.get('claudeConfigPath');
  const configExists = configPath ? checkClaudeConfigExists(configPath) : false;
  
  return {
    configPath,
    configExists
  };
});

// Browse for Claude config file
ipcMain.handle('browse-config-file', async () => {
  if (!mainWindow) return { canceled: true };
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const configPath = result.filePaths[0];
    store.set('claudeConfigPath', configPath);
    
    // Re-read the servers from this config
    const claudeConfig = readClaudeConfig(configPath);
    if (claudeConfig.mcpServers) {
      const servers = Object.entries(claudeConfig.mcpServers).reduce((acc, [key, value]) => {
        acc[key] = {
          enabled: true,
          ...value as any
        };
        return acc;
      }, {} as Record<string, any>);
      
      // Merge with existing servers in our store
      const existingServers = store.get('servers');
      store.set('servers', { ...existingServers, ...servers });
    }
    
    return {
      canceled: false,
      configPath,
      configExists: true
    };
  }
  
  return {
    canceled: true
  };
});

// Get servers
ipcMain.handle('get-servers', () => {
  return store.get('servers');
});

// Toggle server
ipcMain.handle('toggle-server', (_event, serverName: string, enabled: boolean) => {
  const servers = store.get('servers');
  if (servers[serverName]) {
    servers[serverName].enabled = enabled;
    store.set('servers', servers);
    syncEnabledServersToClaudeConfig();
    return true;
  }
  return false;
});

// Add or update server
ipcMain.handle('save-server', (_event, serverName: string, serverConfig: any) => {
  const servers = store.get('servers');
  servers[serverName] = {
    ...serverConfig,
    enabled: serverConfig.enabled ?? false
  };
  store.set('servers', servers);
  syncEnabledServersToClaudeConfig();
  return true;
});

// Create a masked version of server data for display in UI
ipcMain.handle('get-masked-servers', () => {
  const servers = store.get('servers') || {};
  const maskedServers: Record<string, any> = {};
  
  // Process each server to mask sensitive data
  Object.entries(servers).forEach(([key, server]: [string, any]) => {
    const maskedServer = { ...server };
    
    // Process command args if they contain sensitive patterns
    if (Array.isArray(maskedServer.args)) {
      maskedServer.args = maskedServer.args.map((arg: string) => maskSensitiveData(arg));
    }
    
    maskedServers[key] = maskedServer;
  });
  
  return maskedServers;
});

// Delete server
ipcMain.handle('delete-server', (_event, serverName: string) => {
  const servers = store.get('servers');
  if (servers[serverName]) {
    delete servers[serverName];
    store.set('servers', servers);
    syncEnabledServersToClaudeConfig();
    return true;
  }
  return false;
});

// Get server sets
ipcMain.handle('get-server-sets', () => {
  return store.get('serverSets') || {};
});

// Save server set
ipcMain.handle('save-server-set', (_event, setId: string, setConfig: any) => {
  const serverSets = store.get('serverSets') || {};
  serverSets[setId] = setConfig;
  store.set('serverSets', serverSets);
  return true;
});

// Delete server set
ipcMain.handle('delete-server-set', (_event, setId: string) => {
  const serverSets = store.get('serverSets') || {};
  if (serverSets[setId]) {
    delete serverSets[setId];
    store.set('serverSets', serverSets);
    return true;
  }
  return false;
});

// Apply server set (enable/disable servers based on the set)
ipcMain.handle('apply-server-set', (_event, setId: string) => {
  const serverSets = store.get('serverSets') || {};
  const servers = store.get('servers') || {};
  const selectedSet = serverSets[setId];
  
  if (!selectedSet) return false;
  
  // First, disable all servers
  Object.keys(servers).forEach(serverName => {
    servers[serverName].enabled = false;
  });
  
  // Then enable only servers in the set
  selectedSet.servers.forEach((serverName: string) => {
    if (servers[serverName]) {
      servers[serverName].enabled = true;
    }
  });
  
  // Save changes and sync to Claude config
  store.set('servers', servers);
  return syncEnabledServersToClaudeConfig();
});

// Function to mask sensitive data
function maskSensitiveData(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  let result = value;
  
  // Mask URLs with UUIDs or long IDs
  const urlWithIdPattern = /(https?:\/\/[^\/\s]+\/[^\/\s]*\/)([a-zA-Z0-9\-_]{10,})(\/[^\s]*)?/gi;
  result = result.replace(urlWithIdPattern, (_match, prefix, id, suffix = '') => {
    return `${prefix}${id.substring(0, 4)}****${id.substring(id.length - 4)}${suffix}`;
  });
  
  // Mask standalone UUIDs or long IDs
  const idPattern = /\b([a-zA-Z0-9\-_]{20,})\b/g;
  result = result.replace(idPattern, (_match, id) => {
    return `${id.substring(0, 4)}****${id.substring(id.length - 4)}`;
  });
  
  return result;
} 