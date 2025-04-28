import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Switch,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Server } from '../types';
import ServerForm from './ServerForm';

interface ServerListProps {
  servers: Record<string, Server>;
  onToggle: (serverName: string, enabled: boolean) => Promise<boolean>;
  onSave: (serverName: string, serverConfig: Server) => Promise<boolean>;
  onDelete: (serverName: string) => Promise<boolean>;
}

const ServerList: React.FC<ServerListProps> = ({
  servers,
  onToggle,
  onSave,
  onDelete
}) => {
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [deleteConfirmServer, setDeleteConfirmServer] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Open edit dialog
  const handleEdit = (serverName: string) => {
    setEditingServer(serverName);
  };
  
  // Open add dialog
  const handleAdd = () => {
    setIsAddingServer(true);
  };
  
  // Open delete confirmation
  const handleDeleteConfirm = (serverName: string) => {
    setDeleteConfirmServer(serverName);
  };
  
  // Handle toggle server
  const handleToggle = async (serverName: string, enabled: boolean) => {
    setIsProcessing(true);
    const success = await onToggle(serverName, enabled);
    setIsProcessing(false);
    return success;
  };
  
  // Save server (add or edit)
  const handleSave = async (serverName: string, serverConfig: Server) => {
    setIsProcessing(true);
    const success = await onSave(serverName, serverConfig);
    setIsProcessing(false);
    
    if (success) {
      setEditingServer(null);
      setIsAddingServer(false);
    }
    
    return success;
  };
  
  // Delete server
  const handleDelete = async () => {
    if (!deleteConfirmServer) return;
    
    setIsProcessing(true);
    const success = await onDelete(deleteConfirmServer);
    setIsProcessing(false);
    
    if (success) {
      setDeleteConfirmServer(null);
    }
    
    return success;
  };
  
  // Close all dialogs
  const handleCloseDialogs = () => {
    setEditingServer(null);
    setIsAddingServer(false);
    setDeleteConfirmServer(null);
  };
  
  // Get server being edited (if any)
  const getEditingServerData = (): [string, Server] | null => {
    if (!editingServer) return null;
    return [editingServer, servers[editingServer]];
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          MCP Servers
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleAdd}
        >
          Add Server
        </Button>
      </Box>
      
      {Object.keys(servers).length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No servers configured. Click "Add Server" to create one.
        </Typography>
      ) : (
        <List>
          {Object.entries(servers).map(([serverName, server], index) => (
            <React.Fragment key={serverName}>
              {index > 0 && <Divider variant="inset" component="li" />}
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title={server.enabled ? "Disable" : "Enable"}>
                      <Switch
                        edge="end"
                        checked={server.enabled}
                        onChange={(_, checked) => handleToggle(serverName, checked)}
                        disabled={isProcessing}
                      />
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleEdit(serverName)}
                        disabled={isProcessing}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDeleteConfirm(serverName)}
                        disabled={isProcessing}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemText
                  primary={serverName}
                  secondary={
                    <React.Fragment>
                      <Typography component="span" variant="body2" color="text.primary">
                        {server.command}
                      </Typography>
                      {server.args.length > 0 && (
                        <Typography component="span" variant="body2">
                          {' '}{server.args.join(' ')}
                        </Typography>
                      )}
                    </React.Fragment>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
      
      {/* Edit Server Dialog */}
      {editingServer && (
        <ServerForm
          open={true}
          title={`Edit Server: ${editingServer}`}
          initialData={getEditingServerData()}
          onSave={handleSave}
          onClose={handleCloseDialogs}
          disabled={isProcessing}
        />
      )}
      
      {/* Add Server Dialog */}
      {isAddingServer && (
        <ServerForm
          open={true}
          title="Add New Server"
          onSave={handleSave}
          onClose={handleCloseDialogs}
          disabled={isProcessing}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmServer !== null}
        onClose={handleCloseDialogs}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the server "{deleteConfirmServer}"?
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

export default ServerList; 