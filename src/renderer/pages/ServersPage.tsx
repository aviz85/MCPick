import React, { useState } from 'react';
import ServerToolbar from '../components/ServerToolbar';
import ServerList from '../components/ServerList';
import ServerForm from '../components/ServerForm';
import ParseConfigDialog from '../components/ParseConfigDialog';
import ModalHost from '../components/ModalHost';
import { useServers } from '../context/ServersContext';
import { Server } from '../types';

const ServersPage: React.FC = () => {
  const { servers, save, remove } = useServers();
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParseModalOpen, setIsParseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  // Handle adding a server
  const handleAddServer = () => {
    setIsAddModalOpen(true);
  };

  // Handle editing a server
  const handleEditServer = (name: string) => {
    setSelectedServer(name);
    setIsEditModalOpen(true);
  };

  // Handle deleting a server
  const handleDeleteServer = (name: string) => {
    setSelectedServer(name);
    setIsDeleteModalOpen(true);
  };

  // Handle confirming server deletion
  const handleConfirmDelete = async () => {
    if (selectedServer) {
      await remove(selectedServer);
      setSelectedServer(null);
      setIsDeleteModalOpen(false);
    }
  };

  // Handle parsing config
  const handleParseConfig = () => {
    setIsParseModalOpen(true);
  };

  // Handle saving parsed servers
  const handleSaveParsedServers = async (parsedServers: Record<string, Server>) => {
    let success = true;
    
    for (const [name, server] of Object.entries(parsedServers)) {
      const result = await save(name, server);
      if (!result) {
        success = false;
      }
    }
    
    return success;
  };

  return (
    <div>
      <ServerToolbar onAdd={handleAddServer} onParse={handleParseConfig} />
      <ServerList onEdit={handleEditServer} onDelete={handleDeleteServer} />

      {/* Add Server Modal */}
      <ModalHost isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <ServerForm
          onSave={save}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </ModalHost>

      {/* Edit Server Modal */}
      <ModalHost isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        {selectedServer && (
          <ServerForm
            initialServer={[selectedServer, servers[selectedServer]]}
            onSave={save}
            onCancel={() => setIsEditModalOpen(false)}
            isEdit
          />
        )}
      </ModalHost>

      {/* Parse Config Modal */}
      <ModalHost isOpen={isParseModalOpen} onClose={() => setIsParseModalOpen(false)}>
        <ParseConfigDialog
          onParse={handleSaveParsedServers}
          onCancel={() => setIsParseModalOpen(false)}
        />
      </ModalHost>

      {/* Delete Confirmation Modal */}
      <ModalHost isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>Confirm Deletion</h2>
          <p>
            Are you sure you want to delete the server "{selectedServer}"?
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

export default ServersPage; 