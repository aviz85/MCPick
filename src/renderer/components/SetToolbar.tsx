import React from 'react';

interface SetToolbarProps {
  onAdd: () => void;
}

const SetToolbar: React.FC<SetToolbarProps> = ({ onAdd }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>Server Sets</h2>
      <div>
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
          Add Set
        </button>
      </div>
    </div>
  );
};

export default SetToolbar; 