import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Instruction, InstructionsRecord } from '../types';
import { api } from '../api/ipc';

// Define the context interface
interface InstructionsContextType {
  instructions: InstructionsRecord;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  saveInstruction: (id: string, instruction: Instruction) => Promise<boolean>;
  toggleInstruction: (id: string, enabled: boolean) => Promise<boolean>;
  deleteInstruction: (id: string) => Promise<boolean>;
}

// Create the context
const InstructionsContext = createContext<InstructionsContextType | undefined>(undefined);

// Provider component
export const InstructionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instructions, setInstructions] = useState<InstructionsRecord>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load instructions
  const loadInstructions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getInstructions();
      setInstructions(result || {});
    } catch (err) {
      console.error('Failed to load instructions:', err);
      setError('Failed to load instructions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save instruction
  const saveInstruction = useCallback(async (id: string, instruction: Instruction): Promise<boolean> => {
    try {
      await api.saveInstruction(id, instruction);
      loadInstructions();
      return true;
    } catch (err) {
      console.error('Failed to save instruction:', err);
      setError('Failed to save instruction');
      return false;
    }
  }, [loadInstructions]);

  // Toggle instruction
  const toggleInstruction = useCallback(async (id: string, enabled: boolean): Promise<boolean> => {
    try {
      await api.toggleInstruction(id, enabled);
      loadInstructions();
      return true;
    } catch (err) {
      console.error('Failed to toggle instruction:', err);
      setError('Failed to toggle instruction');
      return false;
    }
  }, [loadInstructions]);

  // Delete instruction
  const deleteInstruction = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.deleteInstruction(id);
      loadInstructions();
      return true;
    } catch (err) {
      console.error('Failed to delete instruction:', err);
      setError('Failed to delete instruction');
      return false;
    }
  }, [loadInstructions]);

  // Initial load
  useEffect(() => {
    loadInstructions();
  }, [loadInstructions]);

  return (
    <InstructionsContext.Provider value={{
      instructions,
      loading,
      error,
      reload: loadInstructions,
      saveInstruction,
      toggleInstruction,
      deleteInstruction
    }}>
      {children}
    </InstructionsContext.Provider>
  );
};

// Hook for using the instructions context
export const useInstructions = (): InstructionsContextType => {
  const context = useContext(InstructionsContext);
  if (context === undefined) {
    throw new Error('useInstructions must be used within an InstructionsProvider');
  }
  return context;
}; 