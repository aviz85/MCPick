import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Server, ServerSet } from '../types';
import ServerSetForm from './ServerSetForm';

interface ServerSetListProps {
  serverSets: Record<string, ServerSet>;
  servers: Record<string, Server>;
  onSave: (setId: string, setConfig: ServerSet) => Promise<boolean>;
  onDelete: (setId: string) => Promise<boolean>;
  onApply: (setId: string) => Promise<boolean>;
}

const ServerSetList: React.FC<ServerSetListProps> = ({
  serverSets,
  servers,
  onSave,
  onDelete,
  onApply
}) => {
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [isAddingSet, setIsAddingSet] = useState(false);
  const [deleteConfirmSetId, setDeleteConfirmSetId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Open edit dialog
  const handleEdit = (setId: string) => {
    setEditingSetId(setId);
  };
  
  // Open add dialog
  const handleAdd = () => {
    setIsAddingSet(true);
  };
  
  // Open delete confirmation
  const handleDeleteConfirm = (setId: string) => {
    setDeleteConfirmSetId(setId);
  };
  
  // Apply server set
  const handleApply = async (setId: string) => {
    setIsProcessing(true);
    const success = await onApply(setId);
    setIsProcessing(false);
    return success;
  };
  
  // Save server set (add or edit)
  const handleSave = async (setId: string, setConfig: ServerSet) => {
    setIsProcessing(true);
    const success = await onSave(setId, setConfig);
    setIsProcessing(false);
    
    if (success) {
      setEditingSetId(null);
      setIsAddingSet(false);
    }
    
    return success;
  };
  
  // Delete server set
  const handleDelete = async () => {
    if (!deleteConfirmSetId) return false;
    
    setIsProcessing(true);
    const success = await onDelete(deleteConfirmSetId);
    setIsProcessing(false);
    
    if (success) {
      setDeleteConfirmSetId(null);
    }
    
    return success;
  };
  
  // Close all dialogs
  const handleCloseDialogs = () => {
    setEditingSetId(null);
    setIsAddingSet(false);
    setDeleteConfirmSetId(null);
  };
  
  // Get server set being edited (if any)
  const getEditingSetData = (): [string, ServerSet] | null => {
    if (!editingSetId) return null;
    return [editingSetId, serverSets[editingSetId]];
  };
  
  // Get available servers for a server set
  const getAvailableServers = (): string[] => {
    return Object.keys(servers);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Server Sets
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleAdd}
        >
          Add Set
        </Button>
      </Box>
      
      {Object.keys(serverSets).length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No server sets configured. Click "Add Set" to create one.
        </Typography>
      ) : (
        <List>
          {Object.entries(serverSets).map(([setId, serverSet], index) => (
            <React.Fragment key={setId}>
              {index > 0 && <Divider variant="inset" component="li" />}
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title="Apply Set">
                      <IconButton 
                        edge="end" 
                        aria-label="apply"
                        onClick={() => handleApply(setId)}
                        disabled={isProcessing}
                        color="success"
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleEdit(setId)}
                        disabled={isProcessing}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDeleteConfirm(setId)}
                        disabled={isProcessing}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemText
                  primary={serverSet.name}
                  secondary={
                    <React.Fragment>
                      <Typography component="span" variant="body2" color="text.primary">
                        {serverSet.description}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {serverSet.servers.map(serverName => (
                          <Chip
                            key={serverName}
                            label={serverName}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </React.Fragment>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
      
      {/* Edit Server Set Dialog */}
      {editingSetId && (
        <ServerSetForm
          open={true}
          title={`Edit Set: ${serverSets[editingSetId].name}`}
          initialData={getEditingSetData()}
          availableServers={getAvailableServers()}
          onSave={handleSave}
          onClose={handleCloseDialogs}
          disabled={isProcessing}
        />
      )}
      
      {/* Add Server Set Dialog */}
      {isAddingSet && (
        <ServerSetForm
          open={true}
          title="Add New Server Set"
          availableServers={getAvailableServers()}
          onSave={handleSave}
          onClose={handleCloseDialogs}
          disabled={isProcessing}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmSetId !== null}
        onClose={handleCloseDialogs}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the server set "{deleteConfirmSetId && serverSets[deleteConfirmSetId]?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            disabled={isProcessing}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServerSetList; 