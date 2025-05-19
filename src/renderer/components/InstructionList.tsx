import React from 'react';
import { InstructionsRecord } from '../types';
import ToggleSwitch from './ToggleSwitch';

interface InstructionListProps {
  instructions: InstructionsRecord;
  onToggle: (id: string, enabled: boolean) => Promise<boolean>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
}

const InstructionList: React.FC<InstructionListProps> = ({ 
  instructions, 
  onToggle, 
  onEdit, 
  onDelete 
}) => {
  const handleToggle = (id: string) => {
    const instruction = instructions[id];
    onToggle(id, !instruction.enabled);
  };

  const confirmDelete = (id: string) => {
    if (window.confirm(`Are you sure you want to delete this instruction?`)) {
      onDelete(id);
    }
  };

  return (
    <div>
      {Object.keys(instructions).length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No instructions available. Click "Add Instruction" to create one.
        </div>
      ) : (
        <div>
          {Object.entries(instructions).map(([id, instruction]) => (
            <div 
              key={id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                borderBottom: '1px solid #eee',
                backgroundColor: instruction.enabled ? '#f8f8f8' : 'transparent'
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{instruction.name}</div>
                <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '4px' }}>{instruction.description}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ToggleSwitch
                  checked={instruction.enabled}
                  onChange={() => handleToggle(id)}
                />
                
                <button
                  onClick={() => onEdit(id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#1976d2'
                  }}
                >
                  Edit
                </button>
                
                <button
                  onClick={() => confirmDelete(id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#dc004e'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructionList; 