import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/ipc';
import { AppStatus } from '../types';

interface ConfigContextValue {
  configPath: string | undefined;
  configExists: boolean;
  browseConfigFile: () => Promise<void>;
  reload: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const useConfig = (): ConfigContextValue => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [configPath, setConfigPath] = useState<string | undefined>();
  const [configExists, setConfigExists] = useState(false);

  const loadConfig = async () => {
    try {
      const status: AppStatus = await api.getAppStatus();
      setConfigPath(status.configPath);
      setConfigExists(status.configExists);
    } catch (error) {
      console.error('Error loading config status:', error);
    }
  };

  // Load config status on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const browseConfigFile = async () => {
    try {
      const result = await api.browseConfigFile();
      if (!result.canceled && result.configPath) {
        setConfigPath(result.configPath);
        setConfigExists(result.configExists || false);
      }
    } catch (error) {
      console.error('Error browsing config file:', error);
    }
  };

  return (
    <ConfigContext.Provider
      value={{
        configPath,
        configExists,
        browseConfigFile,
        reload: loadConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}; 