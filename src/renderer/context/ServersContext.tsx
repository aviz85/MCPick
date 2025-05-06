import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/ipc';
import { Server, ServersRecord } from '../types';

interface ServersContextValue {
  servers: ServersRecord;
  loading: boolean;
  reload: () => Promise<void>;
  save: (name: string, data: Server) => Promise<boolean>;
  toggle: (name: string, enabled: boolean) => Promise<boolean>;
  remove: (name: string) => Promise<boolean>;
}

const ServersContext = createContext<ServersContextValue | undefined>(undefined);

export const useServers = (): ServersContextValue => {
  const context = useContext(ServersContext);
  if (!context) {
    throw new Error('useServers must be used within a ServersProvider');
  }
  return context;
};

interface ServersProviderProps {
  children: ReactNode;
}

export const ServersProvider: React.FC<ServersProviderProps> = ({ children }) => {
  const [servers, setServers] = useState<ServersRecord>({});
  const [loading, setLoading] = useState(true);

  const loadServers = async () => {
    setLoading(true);
    try {
      const serversData = await api.getServers() as ServersRecord;
      setServers(serversData);
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load servers on mount
  useEffect(() => {
    loadServers();
  }, []);

  const saveServer = async (name: string, data: Server): Promise<boolean> => {
    try {
      const success = await api.saveServer(name, data);
      if (success) {
        await loadServers(); // Reload servers after successful save
      }
      return success;
    } catch (error) {
      console.error('Error saving server:', error);
      return false;
    }
  };

  const toggleServer = async (name: string, enabled: boolean): Promise<boolean> => {
    try {
      const success = await api.toggleServer(name, enabled);
      if (success) {
        // Update local state to avoid full reload
        setServers(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            enabled
          }
        }));
      }
      return success;
    } catch (error) {
      console.error('Error toggling server:', error);
      return false;
    }
  };

  const deleteServer = async (name: string): Promise<boolean> => {
    try {
      const success = await api.deleteServer(name);
      if (success) {
        await loadServers(); // Reload servers after successful delete
      }
      return success;
    } catch (error) {
      console.error('Error deleting server:', error);
      return false;
    }
  };

  return (
    <ServersContext.Provider
      value={{
        servers,
        loading,
        reload: loadServers,
        save: saveServer,
        toggle: toggleServer,
        remove: deleteServer,
      }}
    >
      {children}
    </ServersContext.Provider>
  );
}; 