import React, { useState, useEffect } from 'react';
import { ServerSet } from '../types';
import { useServers } from '../context/ServersContext';

interface SetFormProps {
  initialSet?: [string, ServerSet];
  onSave: (id: string, set: ServerSet) => Promise<boolean>;
  onCancel: () => void;
  isEdit?: boolean;
}

const SetForm: React.FC<SetFormProps> = ({
  initialSet,
  onSave,
  onCancel,
  isEdit = false
}) => {
  const { servers } = useServers();
  const serverNames = Object.keys(servers);

  // Default empty set if not editing
  const defaultSet: ServerSet = {
    name: '',
    description: '',
    prompt: '',
    servers: []
  };

  // Initialize form state
  const [id, setId] = useState(initialSet ? initialSet[0] : '');
  const [name, setName] = useState(initialSet ? initialSet[1].name : defaultSet.name);
  const [description, setDescription] = useState(initialSet ? initialSet[1].description : defaultSet.description);
  const [prompt, setPrompt] = useState(initialSet ? initialSet[1].prompt : defaultSet.prompt);
  const [selectedServers, setSelectedServers] = useState<string[]>(
    initialSet ? initialSet[1].servers : defaultSet.servers
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form input
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate server set ID (only for new sets)
    if (!isEdit) {
      if (!id) {
        newErrors.id = 'Set ID is required';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        newErrors.id = 'Set ID must contain only letters, numbers, underscores, and hyphens';
      }
    }

    // Validate name
    if (!name) {
      newErrors.name = 'Set name is required';
    }

    // Validate selected servers
    if (selectedServers.length === 0) {
      newErrors.servers = 'At least one server must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle server selection toggle
  const toggleServerSelection = (serverName: string) => {
    setSelectedServers(prev => {
      if (prev.includes(serverName)) {
        return prev.filter(name => name !== serverName);
      } else {
        return [...prev, serverName];
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    // Create server set
    const setData: ServerSet = {
      name,
      description,
      prompt,
      servers: selectedServers
    };

    // Save server set
    const success = await onSave(id, setData);
    
    setIsSubmitting(false);
    
    // Close form if save was successful
    if (success) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>
        {isEdit ? 'Edit Server Set' : 'Add New Server Set'}
      </h2>
      
      {!isEdit && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Set ID:
          </label>
          <input
            id="set-id"
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: errors.id ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            placeholder="e.g., primary-set, development, production"
          />
          {errors.id && (
            <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
              {errors.id}
            </small>
          )}
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            Use letters, numbers, underscores, and hyphens only
          </small>
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Set Name:
        </label>
        <input
          id="set-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: errors.name ? '1px solid red' : '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
          placeholder="e.g., Development Environment"
        />
        {errors.name && (
          <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
            {errors.name}
          </small>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Description (optional):
        </label>
        <input
          id="set-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
          placeholder="e.g., Basic servers for development"
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Prompt (optional):
        </label>
        <textarea
          id="set-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
            minHeight: '100px'
          }}
          placeholder="Enter any special prompt for this server set"
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Select Servers:
        </label>
        {errors.servers && (
          <small style={{ color: 'red', display: 'block', marginBottom: '10px' }}>
            {errors.servers}
          </small>
        )}
        
        {serverNames.length === 0 ? (
          <div style={{ color: '#666', padding: '10px 0' }}>
            No servers available. Please add some servers first.
          </div>
        ) : (
          <div style={{ 
            border: errors.servers ? '1px solid red' : '1px solid #ddd', 
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {serverNames.map(serverName => (
              <div key={serverName} style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedServers.includes(serverName)}
                    onChange={() => toggleServerSelection(serverName)}
                    style={{ marginRight: '8px' }}
                  />
                  <span>{serverName}</span>
                </label>
              </div>
            ))}
          </div>
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
          disabled={isSubmitting || serverNames.length === 0}
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

export default SetForm; 