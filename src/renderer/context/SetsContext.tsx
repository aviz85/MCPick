import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/ipc';
import { ServerSet, ServerSetsRecord, ServersRecord } from '../types';
import { useServers } from './ServersContext';

interface SetsContextValue {
  sets: ServerSetsRecord;
  activeSetId: string | null;
  loading: boolean;
  reload: () => Promise<void>;
  save: (id: string, data: ServerSet) => Promise<boolean>;
  apply: (id: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

const SetsContext = createContext<SetsContextValue | undefined>(undefined);

export const useServerSets = (): SetsContextValue => {
  const context = useContext(SetsContext);
  if (!context) {
    throw new Error('useServerSets must be used within a SetsProvider');
  }
  return context;
};

interface SetsProviderProps {
  children: ReactNode;
}

export const SetsProvider: React.FC<SetsProviderProps> = ({ children }) => {
  const { servers, reload: reloadServers } = useServers();
  const [sets, setSets] = useState<ServerSetsRecord>({});
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSets = async () => {
    setLoading(true);
    try {
      const setsData = await api.getServerSets() as ServerSetsRecord;
      setSets(setsData);
    } catch (error) {
      console.error('Error loading server sets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load sets on mount
  useEffect(() => {
    loadSets();
  }, []);

  // Detect active set when servers change
  useEffect(() => {
    detectActiveSet(servers, sets);
  }, [servers, sets]);

  // Function to determine the active set based on enabled servers
  const detectActiveSet = (servers: ServersRecord, sets: ServerSetsRecord) => {
    // Get names of enabled servers
    const enabledServers = Object.entries(servers)
      .filter(([_, server]) => server.enabled)
      .map(([name]) => name);

    if (enabledServers.length === 0) {
      setActiveSetId(null);
      return;
    }

    // Check each set to see if it matches the enabled servers exactly
    for (const [setId, set] of Object.entries(sets)) {
      if (!set.servers) continue;
      
      // Convert to Set for easier comparison
      const setServers = new Set(set.servers);
      
      // Check if the lengths match and all enabled servers are in the set
      if (enabledServers.length === setServers.size && 
          enabledServers.every(server => setServers.has(server))) {
        setActiveSetId(setId);
        return;
      }
    }

    // No matching set found
    setActiveSetId(null);
  };

  const saveSet = async (id: string, data: ServerSet): Promise<boolean> => {
    try {
      const success = await api.saveServerSet(id, data);
      if (success) {
        await loadSets(); // Reload sets after successful save
      }
      return success;
    } catch (error) {
      console.error('Error saving server set:', error);
      return false;
    }
  };

  const applySet = async (id: string): Promise<boolean> => {
    try {
      const success = await api.applyServerSet(id);
      if (success) {
        setActiveSetId(id);
        // Reload servers state to sync with changes in the config file
        await reloadServers();
      }
      return success;
    } catch (error) {
      console.error('Error applying server set:', error);
      return false;
    }
  };

  const deleteSet = async (id: string): Promise<boolean> => {
    try {
      const success = await api.deleteServerSet(id);
      if (success) {
        await loadSets(); // Reload sets after successful delete
      }
      return success;
    } catch (error) {
      console.error('Error deleting server set:', error);
      return false;
    }
  };

  return (
    <SetsContext.Provider
      value={{
        sets,
        activeSetId,
        loading,
        reload: loadSets,
        save: saveSet,
        apply: applySet,
        remove: deleteSet,
      }}
    >
      {children}
    </SetsContext.Provider>
  );
}; 