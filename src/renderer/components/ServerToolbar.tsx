import React from 'react';

interface ServerToolbarProps {
  onAdd: () => void;
  onParse: () => void;
}

const ServerToolbar: React.FC<ServerToolbarProps> = ({ onAdd, onParse }) => {
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