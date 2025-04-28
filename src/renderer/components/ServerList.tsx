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

// Mask sensitive data like API keys, IDs, or other long sequences
const maskSensitiveValue = (value: string): string => {
  let result = value;
  
  try {
    // Find and mask long sequences of alphanumeric characters and hyphens (10+ chars)
    const longIdRegex = /([a-zA-Z0-9\-_]{10,})/g;
    let match;
    let lastIndex = 0;
    let maskedResult = '';
    
    // Reset regex state
    longIdRegex.lastIndex = 0;
    
    // Manually iterate through matches to avoid potential issues
    while ((match = longIdRegex.exec(result)) !== null) {
      const id = match[1];
      const startIndex = match.index;
      
      // For very long strings, keep fewer visible characters
      const charsToShow = Math.min(4, Math.floor(id.length / 6));
      const maskedId = `${id.substring(0, charsToShow)}${'*'.repeat(id.length - (charsToShow * 2))}${id.substring(id.length - charsToShow)}`;
      
      // Add text before this match and the masked ID
      maskedResult += result.substring(lastIndex, startIndex) + maskedId;
      
      // Update lastIndex for next iteration
      lastIndex = startIndex + id.length;
    }
    
    // Add any remaining text after the last match
    if (lastIndex < result.length) {
      maskedResult += result.substring(lastIndex);
    }
    
    // If we found and masked something, update the result
    if (lastIndex > 0) {
      result = maskedResult;
    }
    
    // Handle URL patterns separately - more aggressive approach
    const urlRegex = /(https?:\/\/[^\/\s]+)([^\s]*)/gi;
    result = result.replace(urlRegex, (match: string, domain: string, path: string) => {
      // If the path contains long IDs, mask them
      let maskedPath = path;
      
      // Look specifically for paths with "/u/", "/api/v1/", etc.
      const apiPathRegex = /(\/[^\/]+\/[^\/]*\/)([\da-f-]{10,})([^\/]*)/g;
      maskedPath = maskedPath.replace(apiPathRegex, (match: string, prefix: string, id: string, suffix: string) => {
        const maskedId = `${id.substring(0, 4)}${'*'.repeat(id.length - 8)}${id.substring(id.length - 4)}`;
        return `${prefix}${maskedId}${suffix}`;
      });
      
      return domain + maskedPath;
    });
    
    // Look for common API key prefixes
    const commonPrefixes = ['sk-', 'pk-', 'api-', 'key-', 'token-', 'secret-'];
    for (const prefix of commonPrefixes) {
      if (result.startsWith(prefix) && result.length > prefix.length + 4) {
        return `${prefix}${'*'.repeat(result.length - prefix.length)}`;
      }
    }
  } catch (error) {
    // If any errors in masking, return original
    console.error('Error in masking function:', error);
  }
  
  return result;
};

interface ServerListProps {
  servers: Record<string, Server>;
  actualServers?: Record<string, Server>;
  onToggle: (serverName: string, enabled: boolean) => Promise<boolean>;
  onSave: (serverName: string, serverConfig: Server) => Promise<boolean>;
  onDelete: (serverName: string) => Promise<boolean>;
}

const ServerList: React.FC<ServerListProps> = ({
  servers,
  actualServers = {},
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
    
    // Use actual server data for editing rather than masked version
    const serverToEdit = Object.keys(actualServers).length > 0 && actualServers[editingServer] 
      ? actualServers[editingServer] 
      : servers[editingServer];
      
    return [editingServer, serverToEdit];
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
                        color="primary"
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
                        {maskSensitiveValue(server.command)}
                      </Typography>
                      {server.args.length > 0 && (
                        <Typography component="span" variant="body2">
                          {' '}{server.args.map(arg => maskSensitiveValue(arg)).join(' ')}
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