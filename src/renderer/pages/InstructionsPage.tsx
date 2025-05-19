import React, { useState } from 'react';
import { useInstructions } from '../context/InstructionsContext';
import { Instruction } from '../types';
import InstructionList from '../components/InstructionList';
import InstructionForm from '../components/InstructionForm';
import ServerTestModal from '../components/ServerTestModal';
import { api } from '../api/ipc';

const InstructionsPage: React.FC = () => {
  const { instructions, toggleInstruction, deleteInstruction } = useInstructions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<{ id: string; instruction: Instruction } | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<{
    isLoading: boolean;
    success?: boolean;
    error?: string;
    output: string;
    serverPath?: string;
    directoryPath?: string;
    runCommand?: string;
  }>({
    isLoading: false,
    output: ''
  });

  const handleAdd = () => {
    setEditItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditItem({ id, instruction: instructions[id] });
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditItem(null);
  };

  const handleTestServer = async () => {
    setIsTestModalOpen(true);
    setTestResults({
      isLoading: true,
      output: ''
    });

    try {
      const result = await api.testInstructionsServer();
      setTestResults({
        isLoading: false,
        success: result.success,
        error: result.error,
        output: result.output,
        serverPath: result.serverPath,
        directoryPath: result.directoryPath,
        runCommand: result.runCommand
      });
    } catch (err) {
      setTestResults({
        isLoading: false,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        output: ''
      });
    }
  };

  const handleTestModalClose = () => {
    setIsTestModalOpen(false);
  };

  // Calculate if any instructions are enabled
  const hasEnabledInstructions = Object.values(instructions).some(instruction => instruction.enabled);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Instructions</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleTestServer}
            disabled={!hasEnabledInstructions}
            style={{
              backgroundColor: hasEnabledInstructions ? '#4caf50' : '#ccc',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: hasEnabledInstructions ? 'pointer' : 'not-allowed'
            }}
            title={hasEnabledInstructions ? 'Test the MCP server' : 'Enable at least one instruction to test the server'}
          >
            Test Server
          </button>
          <button
            onClick={handleAdd}
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Instruction
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p>
          These instructions are available as tools triggered when a user says "Hi, MCPick" to Claude.
          Add custom instructions that Claude can retrieve for users.
        </p>
      </div>

      <InstructionList
        instructions={instructions}
        onToggle={toggleInstruction}
        onEdit={handleEdit}
        onDelete={deleteInstruction}
      />

      {isFormOpen && (
        <InstructionForm
          editId={editItem?.id}
          initialValues={editItem?.instruction}
          onClose={handleFormClose}
        />
      )}

      <ServerTestModal
        isOpen={isTestModalOpen}
        isLoading={testResults.isLoading}
        success={testResults.success}
        error={testResults.error}
        output={testResults.output}
        serverPath={testResults.serverPath}
        directoryPath={testResults.directoryPath}
        runCommand={testResults.runCommand}
        onClose={handleTestModalClose}
      />
    </div>
  );
};

export default InstructionsPage; 