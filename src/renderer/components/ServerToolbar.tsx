import React from 'react';
import { useConfig } from '../context/ConfigContext';

interface ServerToolbarProps {
  onAdd: () => void;
  onParse: () => void;
}

const ServerToolbar: React.FC<ServerToolbarProps> = ({ onAdd, onParse }) => {
  const { openConfigLocation, configPath } = useConfig();
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>MCP Servers</h2>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => openConfigLocation()}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '36px',
            height: '36px',
            padding: '0',
            background: '#f5f5f5',
            color: '#ff9800',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: configPath ? 1 : 0.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
          }}
          disabled={!configPath}
          title={configPath ? "Open config file location" : "No config file selected"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        </button>
        <button
          onClick={onParse}
          style={{
            padding: '8px 16px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Parse Config JSON
        </button>
        <button
          onClick={onAdd}
          style={{
            padding: '8px 16px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add Server
        </button>
      </div>
    </div>
  );
};

export default ServerToolbar; 