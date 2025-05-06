import React, { useState } from 'react';
import { Server } from '../types';

interface ParseConfigDialogProps {
  onParse: (servers: Record<string, Server>) => Promise<boolean>;
  onCancel: () => void;
}

const ParseConfigDialog: React.FC<ParseConfigDialogProps> = ({
  onParse,
  onCancel
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    
    if (!jsonInput.trim()) {
      setError('Please enter JSON configuration');
      return;
    }
    
    try {
      const parsed = JSON.parse(jsonInput);
      
      if (typeof parsed !== 'object' || parsed === null) {
        setError('JSON must be an object');
        return;
      }
      
      setIsSubmitting(true);
      
      // For each server, validate structure
      const validServers: Record<string, Server> = {};
      let hasErrors = false;
      
      Object.entries(parsed).forEach(([name, config]) => {
        if (typeof config !== 'object' || config === null) {
          setError(`Server "${name}" configuration must be an object`);
          hasErrors = true;
          return;
        }
        
        const server = config as any;
        
        if (!server.command || typeof server.command !== 'string') {
          setError(`Server "${name}" is missing a valid command`);
          hasErrors = true;
          return;
        }
        
        // Ensure args is an array of strings
        if (!Array.isArray(server.args)) {
          server.args = [];
        }
        
        // Ensure enabled is a boolean
        if (typeof server.enabled !== 'boolean') {
          server.enabled = false;
        }
        
        validServers[name] = {
          command: server.command,
          args: server.args,
          enabled: server.enabled,
          ...(server.env && typeof server.env === 'object' ? { env: server.env } : {})
        };
      });
      
      if (hasErrors) {
        setIsSubmitting(false);
        return;
      }
      
      // If there are no servers in the JSON
      if (Object.keys(validServers).length === 0) {
        setError('No valid servers found in the configuration');
        setIsSubmitting(false);
        return;
      }
      
      const success = await onParse(validServers);
      
      setIsSubmitting(false);
      
      if (success) {
        onCancel();
      }
    } catch (err) {
      setError(`Invalid JSON: ${(err as Error).message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>Parse Server Configuration</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Server Configuration JSON:
        </label>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: error ? '1px solid red' : '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
            minHeight: '300px',
            fontFamily: 'monospace'
          }}
          placeholder={`{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"],
    "enabled": true
  },
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem"],
    "enabled": false,
    "env": {
      "BASE_PATH": "/path/to/files"
    }
  }
}`}
        />
        {error && (
          <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
            {error}
          </small>
        )}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: '8px 16px',
            background: '#f5f5f5',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '8px 16px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isSubmitting ? 'Parsing...' : 'Parse and Add'}
        </button>
      </div>
    </form>
  );
};

export default ParseConfigDialog; 