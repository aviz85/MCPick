import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
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
  instructions: {
    [key: string]: {
      name: string;
      description: string;
      content: string;
      enabled: boolean;
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
  
  // Get enabled servers
  const enabledServers = Object.entries(store.get('servers'))
    .filter(([_, serverConfig]: [string, any]) => serverConfig.enabled)
    .reduce((acc, [key, serverConfig]: [string, any]) => {
      const { enabled, ...serverDetails } = serverConfig;
      acc[key] = serverDetails;
      return acc;
    }, {} as Record<string, any>);
  
  // Create MCPick stdio server if there are any enabled instructions
  const enabledInstructions = Object.entries(store.get('instructions') || {})
    .filter(([_, instructionConfig]: [string, any]) => instructionConfig.enabled);
  
  if (enabledInstructions.length > 0) {
    enabledServers['mcpick-instructions'] = generateMCPickInstructionsServer(enabledInstructions);
  }

  claudeConfig.mcpServers = enabledServers;
  return writeClaudeConfig(configPath, claudeConfig);
}

// Generate the MCPick instructions stdio server configuration
function generateMCPickInstructionsServer(enabledInstructions: any[]): any {
  // Create a permanent directory in the user's home folder
  const mcpickDir = path.join(os.homedir(), '.mcpick');
  const serversDir = path.join(mcpickDir, 'servers');
  
  if (!fs.existsSync(serversDir)) {
    fs.mkdirSync(serversDir, { recursive: true });
  }

  // Generate the server file
  const serverFilePath = path.join(serversDir, 'mcpick-instructions-server.js');
  const serverContent = generateServerScript(enabledInstructions);
  fs.writeFileSync(serverFilePath, serverContent);
  
  // Make the file executable
  try {
    fs.chmodSync(serverFilePath, '755');
  } catch (error) {
    console.error('Error making server file executable:', error);
  }

  // Return the server configuration
  return {
    command: 'node',
    args: [serverFilePath]
  };
}

// Generate the server script for the MCPick instructions
function generateServerScript(enabledInstructions: any[]): string {
  // Create tool definitions array for the ListToolsRequestSchema handler
  const toolDefinitionsArray = enabledInstructions.map(([id, instruction]) => {
    return `    {
      name: "${id}",
      description: "${instruction.description.replace(/"/g, '\\"')}",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }`;
  }).join(',\n');

  // Create the call handler cases for each tool
  const callHandlerCases = enabledInstructions.map(([id, instruction]) => {
    return `  if (request.params.name === "${id}") {
    return { 
      toolResult: { 
        content: [{ type: "text", text: \`${instruction.content.replace(/`/g, '\\`')}\` }] 
      } 
    };
  }`;
  }).join('\n');

  return `#!/usr/bin/env node

const { McpServer, McpError, ErrorCode } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { ListToolsRequestSchema, CallToolRequestSchema } = require("@modelcontextprotocol/sdk/server/schema.js");

const server = new McpServer({
  name: "MCPickInstructions",
  version: "1.0.0"
});

// Register the tools listing handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
${toolDefinitionsArray}
    ]
  };
});

// Register the tool calling handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
${callHandlerCases}
  throw new McpError(ErrorCode.ToolNotFound, "Tool not found");
});

// Initialize the server
const transport = new StdioServerTransport();
server.connect(transport);
`;
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
  
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }
  
  const selectedPath = result.filePaths[0];
  const configExists = checkClaudeConfigExists(selectedPath);
  
  if (configExists) {
    store.set('claudeConfigPath', selectedPath);
  }
  
  return {
    canceled: false,
    configPath: selectedPath,
    configExists
  };
});

// Get servers
ipcMain.handle('get-servers', () => {
  return store.get('servers') || {};
});

// Save server
ipcMain.handle('save-server', (_, name: string, config: any) => {
  try {
    const servers = store.get('servers') || {};
    servers[name] = config;
    store.set('servers', servers);
    
    // Sync with Claude config if enabled
    if (config.enabled) {
      syncEnabledServersToClaudeConfig();
    }
    
    return true;
  } catch (error) {
    console.error('Error saving server:', error);
    return false;
  }
});

// Toggle server
ipcMain.handle('toggle-server', (_, name: string, enabled: boolean) => {
  try {
    const servers = store.get('servers') || {};
    
    if (!servers[name]) {
      return false;
    }
    
    servers[name].enabled = enabled;
    store.set('servers', servers);
    
    // Sync with Claude config
    syncEnabledServersToClaudeConfig();
    
    return true;
  } catch (error) {
    console.error('Error toggling server:', error);
    return false;
  }
});

// Delete server
ipcMain.handle('delete-server', (_, name: string) => {
  try {
    const servers = store.get('servers') || {};
    
    if (!servers[name]) {
      return false;
    }
    
    delete servers[name];
    store.set('servers', servers);
    
    // Sync with Claude config
    syncEnabledServersToClaudeConfig();
    
    return true;
  } catch (error) {
    console.error('Error deleting server:', error);
    return false;
  }
});

// Get server sets
ipcMain.handle('get-server-sets', () => {
  return store.get('serverSets') || {};
});

// Save server set
ipcMain.handle('save-server-set', (_, id: string, config: any) => {
  try {
    const sets = store.get('serverSets') || {};
    sets[id] = config;
    store.set('serverSets', sets);
    return true;
  } catch (error) {
    console.error('Error saving server set:', error);
    return false;
  }
});

// Apply server set
ipcMain.handle('apply-server-set', (_, id: string) => {
  try {
    const sets = store.get('serverSets') || {};
    const servers = store.get('servers') || {};
    
    if (!sets[id]) {
      return false;
    }
    
    const setServers = sets[id].servers;
    
    // Update enabled state for each server
    Object.keys(servers).forEach(serverName => {
      servers[serverName].enabled = setServers.includes(serverName);
    });
    
    store.set('servers', servers);
    
    // Sync with Claude config
    syncEnabledServersToClaudeConfig();
    
    return true;
  } catch (error) {
    console.error('Error applying server set:', error);
    return false;
  }
});

// Delete server set
ipcMain.handle('delete-server-set', (_, id: string) => {
  try {
    const sets = store.get('serverSets') || {};
    
    if (!sets[id]) {
      return false;
    }
    
    delete sets[id];
    store.set('serverSets', sets);
    return true;
  } catch (error) {
    console.error('Error deleting server set:', error);
    return false;
  }
});

// Get instructions
ipcMain.handle('get-instructions', () => {
  return store.get('instructions') || {};
});

// Save instruction
ipcMain.handle('save-instruction', (_, id: string, config: any) => {
  try {
    const instructions = store.get('instructions') || {};
    instructions[id] = config;
    store.set('instructions', instructions);
    
    // Sync with Claude config if enabled
    if (config.enabled) {
      syncEnabledServersToClaudeConfig();
    }
    
    return true;
  } catch (error) {
    console.error('Error saving instruction:', error);
    return false;
  }
});

// Toggle instruction
ipcMain.handle('toggle-instruction', (_, id: string, enabled: boolean) => {
  try {
    const instructions = store.get('instructions') || {};
    
    if (!instructions[id]) {
      return false;
    }
    
    instructions[id].enabled = enabled;
    store.set('instructions', instructions);
    
    // Sync with Claude config
    syncEnabledServersToClaudeConfig();
    
    return true;
  } catch (error) {
    console.error('Error toggling instruction:', error);
    return false;
  }
});

// Delete instruction
ipcMain.handle('delete-instruction', (_, id: string) => {
  try {
    const instructions = store.get('instructions') || {};
    
    if (!instructions[id]) {
      return false;
    }
    
    delete instructions[id];
    store.set('instructions', instructions);
    
    // Sync with Claude config
    syncEnabledServersToClaudeConfig();
    
    return true;
  } catch (error) {
    console.error('Error deleting instruction:', error);
    return false;
  }
});

// Test instructions MCP server
ipcMain.handle('test-instructions-server', async () => {
  try {
    // Get enabled instructions
    const enabledInstructions = Object.entries(store.get('instructions') || {})
      .filter(([_, instructionConfig]: [string, any]) => instructionConfig.enabled);
    
    if (enabledInstructions.length === 0) {
      return { success: false, error: 'No enabled instructions available', output: '' };
    }
    
    // Generate the server file
    const { spawn } = require('child_process');
    
    // Use the permanent directory in the user's home folder
    const mcpickDir = path.join(os.homedir(), '.mcpick');
    const serversDir = path.join(mcpickDir, 'servers');
    
    if (!fs.existsSync(serversDir)) {
      fs.mkdirSync(serversDir, { recursive: true });
    }
    
    const serverFilePath = path.join(serversDir, 'mcpick-instructions-server.js');
    const serverContent = generateServerScript(enabledInstructions);
    fs.writeFileSync(serverFilePath, serverContent);
    
    // Make the file executable
    try {
      fs.chmodSync(serverFilePath, '755');
    } catch (error) {
      console.error('Error making server file executable:', error);
    }
    
    // Test simple input to see if the server responds
    const nodePath = process.execPath;
    const nodeProcess = spawn(nodePath, [serverFilePath]);
    
    let output = '';
    let isReady = false;
    
    // Create a promise that will resolve when the server is ready or timeout
    const serverReady = new Promise<void>((resolve, reject) => {
      // Set a timeout of 5 seconds
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timed out'));
      }, 5000);
      
      nodeProcess.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        output += chunk;
        
        // If we see any output, consider the server ready
        if (!isReady) {
          isReady = true;
          clearTimeout(timeout);
          resolve();
        }
      });
      
      nodeProcess.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        output += `ERROR: ${chunk}`;
        
        // If we get stderr output, still mark as ready but capture the error
        if (!isReady) {
          isReady = true;
          clearTimeout(timeout);
          resolve();
        }
      });
      
      nodeProcess.on('error', (err: Error) => {
        output += `Process error: ${err.message}`;
        clearTimeout(timeout);
        reject(err);
      });
    });
    
    try {
      // Wait for the server to be ready
      await serverReady;
      
      // Send a test MCP protocol message
      const testMessage = JSON.stringify({
        jsonrpc: "2.0",
        id: "test",
        method: "discover",
        params: {}
      }) + "\n";
      
      nodeProcess.stdin.write(testMessage);
      
      // Wait a moment for the response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Kill the process
      nodeProcess.kill();
      
      // Get absolute path information
      const absolutePath = path.resolve(serverFilePath);
      const directoryPath = path.dirname(absolutePath);
      
      // Determine how the server should be run
      const runCommand = process.platform === 'win32' 
        ? `node "${absolutePath}"` 
        : `node "${absolutePath}"`;
      
      return { 
        success: true, 
        output: output || 'Server started successfully, but no output was captured.',
        serverPath: absolutePath,
        directoryPath: directoryPath,
        runCommand: runCommand
      };
    } catch (err) {
      // Kill the process if it's still running
      try {
        nodeProcess.kill();
      } catch (e) {
        // Ignore errors when killing
      }
      
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error', 
        output
      };
    }
  } catch (error) {
    console.error('Error testing instructions server:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      output: ''
    };
  }
});

// Open Claude config file location in the file explorer
ipcMain.handle('open-config-location', async () => {
  const configPath = store.get('claudeConfigPath');
  
  if (!configPath) {
    return { success: false, reason: 'No config path set' };
  }

  try {
    // Open the containing folder, not the file itself
    const dirPath = path.dirname(configPath);
    await shell.openPath(dirPath);
    return { success: true };
  } catch (error) {
    console.error('Error opening config location:', error);
    return { success: false, reason: 'Failed to open location' };
  }
});

function maskSensitiveData(value: string): string {
  if (!value) return '';
  
  // Check if the value is a path to a file or directory
  const isPath = /^(\/|[A-Z]:\\)/.test(value) || /^\.\.?\//.test(value);
  
  // Check if the value is likely an npm package
  const isNpmPackage = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(@[^/]+)?$/.test(value);
  
  // Don't mask if it's a path or npm package
  if (isPath || isNpmPackage) {
    return value;
  }
  
  // Mask the value
  return value.length > 6
    ? `${value.substring(0, 3)}${'•'.repeat(Math.min(10, value.length - 6))}${value.substring(value.length - 3)}`
    : '•'.repeat(value.length);
} 