import React from 'react';
import { useServerSets } from '../context/SetsContext';
import SetItem from './SetItem';

interface SetListProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SetList: React.FC<SetListProps> = ({ onEdit, onDelete }) => {
  const { sets, activeSetId, apply, loading } = useServerSets();
  const setEntries = Object.entries(sets);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading server sets...</div>;
  }

  if (setEntries.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No server sets found</div>;
  }

  return (
    <div>
      {setEntries.map(([id, set]) => (
        <SetItem
          key={id}
          id={id}
          set={set}
          isActive={activeSetId === id}
          onApply={apply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default SetList; 