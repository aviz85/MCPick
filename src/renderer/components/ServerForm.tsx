import React, { useState } from 'react';
import { Server } from '../types';

interface ServerFormProps {
  initialServer?: [string, Server];
  onSave: (name: string, server: Server) => Promise<boolean>;
  onCancel: () => void;
  isEdit?: boolean;
}

const ServerForm: React.FC<ServerFormProps> = ({
  initialServer,
  onSave,
  onCancel,
  isEdit = false
}) => {
  // Default empty server if not editing
  const defaultServer: Server = {
    command: 'npx',
    args: ['-y'],
    enabled: false
  };

  // Initialize form state
  const [name, setName] = useState(initialServer ? initialServer[0] : '');
  const [command, setCommand] = useState(initialServer ? initialServer[1].command : defaultServer.command);
  const [args, setArgs] = useState(initialServer ? initialServer[1].args.join(' ') : defaultServer.args.join(' '));
  const [enabled, setEnabled] = useState(initialServer ? initialServer[1].enabled : defaultServer.enabled);
  const [envJson, setEnvJson] = useState(
    initialServer && initialServer[1].env
      ? JSON.stringify(initialServer[1].env, null, 2)
      : '{}'
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form input
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate server name (only for new servers)
    if (!isEdit) {
      if (!name) {
        newErrors.name = 'Server name is required';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        newErrors.name = 'Server name must contain only letters, numbers, underscores, and hyphens';
      }
    }

    // Validate command
    if (!command) {
      newErrors.command = 'Command is required';
    }

    // Validate env JSON
    if (envJson) {
      try {
        const parsedEnv = JSON.parse(envJson);
        if (typeof parsedEnv !== 'object' || parsedEnv === null) {
          newErrors.env = 'Environment variables must be a JSON object';
        }
      } catch (error) {
        newErrors.env = `Invalid JSON: ${(error as Error).message}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    // Parse environment variables
    let env = {};
    if (envJson) {
      try {
        env = JSON.parse(envJson);
      } catch (error) {
        // Validation should catch this, but just in case
        setErrors({ env: `Invalid JSON: ${(error as Error).message}` });
        setIsSubmitting(false);
        return;
      }
    }

    // Parse arguments
    const argsArray = args.split(' ').filter(arg => arg.trim());

    // Create server config
    const serverConfig: Server = {
      command,
      args: argsArray,
      enabled,
      ...(Object.keys(env).length > 0 ? { env } : {})
    };

    // Save server
    const success = await onSave(name, serverConfig);
    
    setIsSubmitting(false);
    
    // Close form if save was successful
    if (success) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>
        {isEdit ? 'Edit Server' : 'Add New Server'}
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Server Name:
        </label>
        <input
          id="server-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isEdit}
          style={{
            width: '100%',
            padding: '8px',
            border: errors.name ? '1px solid red' : '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
          placeholder="e.g., memory, filesystem, github"
        />
        {errors.name && (
          <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
            {errors.name}
          </small>
        )}
        <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
          Use letters, numbers, underscores, and hyphens only
        </small>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Command:
        </label>
        <input
          id="server-command"
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: errors.command ? '1px solid red' : '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
          placeholder="e.g., npx"
        />
        {errors.command && (
          <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
            {errors.command}
          </small>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Arguments (space separated):
        </label>
        <input
          id="server-args"
          type="text"
          value={args}
          onChange={(e) => setArgs(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
          placeholder="e.g., -y @modelcontextprotocol/server-memory"
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Environment Variables (JSON):
        </label>
        <textarea
          id="server-env"
          value={envJson}
          onChange={(e) => setEnvJson(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: errors.env ? '1px solid red' : '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
            minHeight: '100px',
            fontFamily: 'monospace'
          }}
          placeholder={'{\n  "KEY1": "value1",\n  "KEY2": "value2"\n}'}
        />
        {errors.env && (
          <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
            {errors.env}
          </small>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            id="server-enabled"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          <span>Enable Server</span>
        </label>
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
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default ServerForm; 