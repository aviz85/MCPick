import React from 'react';
import { ServerSet } from '../types';

interface SetItemProps {
  id: string;
  set: ServerSet;
  isActive: boolean;
  onApply: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SetItem: React.FC<SetItemProps> = ({
  id,
  set,
  isActive,
  onApply,
  onEdit,
  onDelete
}) => {
  return (
    <div style={{
      borderBottom: '1px solid #eee',
      padding: '10px 0',
      backgroundColor: isActive ? '#e3f2fd' : 'transparent'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flexGrow: 1 }}>
          <div style={{ fontWeight: 'bold' }}>{set.name}</div>
          {set.description && (
            <div style={{ color: '#666', fontSize: '0.9em' }}>{set.description}</div>
          )}
          <div style={{ fontSize: '0.8em', marginTop: '5px' }}>
            <strong>Servers:</strong> {set.servers.join(', ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onApply(id)}
            disabled={isActive}
            style={{
              padding: '6px 12px',
              background: isActive ? '#4caf50' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isActive ? 'default' : 'pointer',
              opacity: isActive ? 0.7 : 1
            }}
          >
            {isActive ? 'Active' : 'Apply'}
          </button>
          <button
            onClick={() => onEdit(id)}
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
            onClick={() => onDelete(id)}
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
    </div>
  );
};

export default SetItem; 