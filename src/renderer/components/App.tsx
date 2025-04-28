import React, { useState, useEffect } from 'react';
import { 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container,
  Paper,
  Stack,
  Alert
} from '@mui/material';
import ServerList from './ServerList';
import ConfigPathSelector from './ConfigPathSelector';
import { Server } from '../types';

declare global {
  interface Window {
    api: {
      getAppStatus: () => Promise<{ configPath: string, configExists: boolean }>;
      browseConfigFile: () => Promise<{ canceled: boolean, configPath?: string, configExists?: boolean }>;
      getServers: () => Promise<Record<string, Server>>;
      getMaskedServers: () => Promise<Record<string, Server>>;
      toggleServer: (serverName: string, enabled: boolean) => Promise<boolean>;
      saveServer: (serverName: string, serverConfig: Server) => Promise<boolean>;
      deleteServer: (serverName: string) => Promise<boolean>;
    }
  }
}

const App: React.FC = () => {
  const [configPath, setConfigPath] = useState<string>('');
  const [configExists, setConfigExists] = useState<boolean>(false);
  const [servers, setServers] = useState<Record<string, Server>>({});
  const [maskedServers, setMaskedServers] = useState<Record<string, Server>>({});
  const [error, setError] = useState<string | null>(null);

  // Function to load servers (both actual and masked)
  const loadServers = async () => {
    try {
      // Get actual servers for operations
      const serverList = await window.api.getServers();
      setServers(serverList);
      
      // Get masked servers for display
      const maskedList = await window.api.getMaskedServers();
      setMaskedServers(maskedList);
    } catch (err) {
      setError('Failed to load servers.');
      console.error(err);
    }
  };

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      try {
        // Get config status
        const status = await window.api.getAppStatus();
        setConfigPath(status.configPath);
        setConfigExists(status.configExists);
        
        // If config exists, load servers
        if (status.configExists) {
          await loadServers();
        }
      } catch (err) {
        setError('Failed to initialize app. Please restart.');
        console.error(err);
      }
    };
    
    initApp();
  }, []);

  // Handle config file browsing
  const handleBrowseConfig = async () => {
    try {
      const result = await window.api.browseConfigFile();
      if (!result.canceled && result.configPath) {
        setConfigPath(result.configPath);
        setConfigExists(result.configExists || false);
        
        // Reload servers after changing config
        if (result.configExists) {
          await loadServers();
        }
      }
    } catch (err) {
      setError('Failed to select configuration file.');
      console.error(err);
    }
  };

  // Handle server toggle
  const handleToggleServer = async (serverName: string, enabled: boolean) => {
    try {
      await window.api.toggleServer(serverName, enabled);
      
      // Update local state for servers
      setServers(prev => ({
        ...prev,
        [serverName]: {
          ...prev[serverName],
          enabled
        }
      }));
      
      // Update masked servers as well
      setMaskedServers(prev => ({
        ...prev,
        [serverName]: {
          ...prev[serverName],
          enabled
        }
      }));
      
      return true;
    } catch (err) {
      setError(`Failed to ${enabled ? 'enable' : 'disable'} server "${serverName}".`);
      console.error(err);
      return false;
    }
  };

  // Handle server save (create or update)
  const handleSaveServer = async (serverName: string, serverConfig: Server) => {
    try {
      await window.api.saveServer(serverName, serverConfig);
      
      // Reload servers to get fresh data
      await loadServers();
      
      return true;
    } catch (err) {
      setError(`Failed to save server "${serverName}".`);
      console.error(err);
      return false;
    }
  };

  // Handle server deletion
  const handleDeleteServer = async (serverName: string) => {
    try {
      await window.api.deleteServer(serverName);
      
      // Update local state for both servers and masked servers
      setServers(prev => {
        const newServers = { ...prev };
        delete newServers[serverName];
        return newServers;
      });
      
      setMaskedServers(prev => {
        const newServers = { ...prev };
        delete newServers[serverName];
        return newServers;
      });
      
      return true;
    } catch (err) {
      setError(`Failed to delete server "${serverName}".`);
      console.error(err);
      return false;
    }
  };

  // Clear error message
  const clearError = () => setError(null);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MCPick - MCP Server Manager
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" onClose={clearError}>
              {error}
            </Alert>
          )}
          
          <Paper sx={{ p: 3 }}>
            <ConfigPathSelector 
              configPath={configPath} 
              configExists={configExists}
              onBrowse={handleBrowseConfig}
            />
          </Paper>
          
          {configExists && (
            <Paper sx={{ p: 3 }}>
              <ServerList 
                servers={maskedServers}
                actualServers={servers}
                onToggle={handleToggleServer}
                onSave={handleSaveServer}
                onDelete={handleDeleteServer}
              />
            </Paper>
          )}
        </Stack>
      </Container>
      
      <Box component="footer" sx={{ py: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} MCPick
        </Typography>
      </Box>
    </Box>
  );
};

export default App; 