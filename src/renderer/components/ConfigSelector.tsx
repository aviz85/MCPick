import React from 'react';
import { useConfig } from '../context/ConfigContext';

const ConfigSelector: React.FC = () => {
  const { configPath, configExists, browseConfigFile } = useConfig();

  return (
    <div style={{
      background: 'white',
      borderRadius: '5px',
      padding: '20px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>Claude Configuration</h2>
      
      <p id="config-path-display">
        {configPath ? (
          <>
            <span style={{ color: configExists ? 'green' : 'red' }}>
              {configExists ? '✓' : '✗'}
            </span>
            {' '}
            {configPath}
            {!configExists && ' (File not found)'}
          </>
        ) : (
          'No configuration file selected'
        )}
      </p>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={browseConfigFile}
          style={{
            padding: '8px 16px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Browse...
        </button>
      </div>
    </div>
  );
};

export default ConfigSelector; 