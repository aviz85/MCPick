import React from 'react';
import { Server } from '../types';
import { useMask } from '../hooks/useMask';
import ToggleSwitch from './ToggleSwitch';

interface ServerItemProps {
  name: string;
  server: Server;
  onToggle: (name: string, enabled: boolean) => void;
  onEdit: (name: string) => void;
  onDelete: (name: string) => void;
}

const ServerItem: React.FC<ServerItemProps> = ({
  name,
  server,
  onToggle,
  onEdit,
  onDelete
}) => {
  const commandStr = server.command;
  const argsStr = server.args.join(' ');
  
  const { maskedValue: maskedCommand, masked: isCommandMasked, toggle: toggleCommand } = 
    useMask(commandStr);
  const { maskedValue: maskedArgs, masked: isArgsMasked, toggle: toggleArgs } = 
    useMask(argsStr);
  
  // Determine if there's anything to mask (true if either command or args is masked)
  const hasMaskedContent = maskedCommand !== commandStr || maskedArgs !== argsStr;
  const isMasked = isCommandMasked || isArgsMasked;
  
  // Toggle both command and args together
  const toggleMask = () => {
    toggleCommand();
    toggleArgs();
  };

  return (
    <div style={{
      borderBottom: '1px solid #eee',
      padding: '10px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ flexGrow: 1, marginRight: '10px' }}>
        <div style={{ fontWeight: 'bold' }}>{name}</div>
        <div 
          style={{ color: '#666', fontSize: '0.9em' }}
          className="command-container"
        >
          {isCommandMasked ? maskedCommand : commandStr} {isArgsMasked ? maskedArgs : argsStr}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {hasMaskedContent && (
          <button 
            onClick={toggleMask}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#1976d2',
              fontSize: '0.8em'
            }}
          >
            {isMasked ? 'Show' : 'Hide'}
          </button>
        )}
        <ToggleSwitch 
          checked={server.enabled} 
          onChange={(checked) => onToggle(name, checked)} 
        />
        <button 
          onClick={() => onEdit(name)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#1976d2'
          }}
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(name)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#dc004e'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ServerItem; 