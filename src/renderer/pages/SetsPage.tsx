import React, { useState } from 'react';
import SetToolbar from '../components/SetToolbar';
import SetList from '../components/SetList';
import SetForm from '../components/SetForm';
import ModalHost from '../components/ModalHost';
import { useServerSets } from '../context/SetsContext';

const SetsPage: React.FC = () => {
  const { sets, save, remove } = useServerSets();
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  // Handle adding a server set
  const handleAddSet = () => {
    setIsAddModalOpen(true);
  };

  // Handle editing a server set
  const handleEditSet = (id: string) => {
    setSelectedSetId(id);
    setIsEditModalOpen(true);
  };

  // Handle deleting a server set
  const handleDeleteSet = (id: string) => {
    setSelectedSetId(id);
    setIsDeleteModalOpen(true);
  };

  // Handle confirming set deletion
  const handleConfirmDelete = async () => {
    if (selectedSetId) {
      await remove(selectedSetId);
      setSelectedSetId(null);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div>
      <SetToolbar onAdd={handleAddSet} />
      <SetList onEdit={handleEditSet} onDelete={handleDeleteSet} />

      {/* Add Set Modal */}
      <ModalHost isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <SetForm
          onSave={save}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </ModalHost>

      {/* Edit Set Modal */}
      <ModalHost isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        {selectedSetId && (
          <SetForm
            initialSet={[selectedSetId, sets[selectedSetId]]}
            onSave={save}
            onCancel={() => setIsEditModalOpen(false)}
            isEdit
          />
        )}
      </ModalHost>

      {/* Delete Confirmation Modal */}
      <ModalHost isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>Confirm Deletion</h2>
          <p>
            Are you sure you want to delete the server set "{selectedSetId && sets[selectedSetId]?.name}"?
            This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
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
              onClick={handleConfirmDelete}
              style={{
                padding: '8px 16px',
                background: '#dc004e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </ModalHost>
    </div>
  );
};

export default SetsPage; 