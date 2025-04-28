import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Server, EnvVar } from '../types';

interface ServerFormProps {
  open: boolean;
  title: string;
  initialData?: [string, Server] | null;
  onSave: (serverName: string, serverConfig: Server) => Promise<boolean>;
  onClose: () => void;
  disabled?: boolean;
}

const ServerForm: React.FC<ServerFormProps> = ({
  open,
  title,
  initialData,
  onSave,
  onClose,
  disabled = false
}) => {
  // Form state
  const [serverName, setServerName] = useState('');
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState<string[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [enabled, setEnabled] = useState(false);
  
  // New arg/env input state
  const [newArg, setNewArg] = useState('');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  
  // Validation
  const [nameError, setNameError] = useState('');
  const [commandError, setCommandError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize form with initial data (if editing)
  useEffect(() => {
    if (initialData) {
      const [name, config] = initialData;
      setServerName(name);
      setCommand(config.command);
      setArgs(config.args || []);
      setEnabled(config.enabled);
      
      // Convert env object to array of key-value pairs
      if (config.env) {
        const envArray = Object.entries(config.env).map(([key, value]) => ({
          key,
          value
        }));
        setEnvVars(envArray);
      } else {
        setEnvVars([]);
      }
    } else {
      // Reset form for new server
      setServerName('');
      setCommand('npx');
      setArgs(['-y']);
      setEnvVars([]);
      setEnabled(false);
    }
    
    // Reset errors
    setNameError('');
    setCommandError('');
  }, [initialData, open]);
  
  // Add argument
  const handleAddArg = () => {
    if (newArg.trim()) {
      setArgs([...args, newArg.trim()]);
      setNewArg('');
    }
  };
  
  // Remove argument
  const handleRemoveArg = (index: number) => {
    setArgs(args.filter((_, i) => i !== index));
  };
  
  // Add environment variable
  const handleAddEnvVar = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setEnvVars([...envVars, { key: newEnvKey.trim(), value: newEnvValue.trim() }]);
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };
  
  // Remove environment variable
  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };
  
  // Validate form
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate server name
    if (!serverName.trim()) {
      setNameError('Server name is required');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_-]+$/.test(serverName)) {
      setNameError('Server name must contain only letters, numbers, underscores, and hyphens');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Validate command
    if (!command.trim()) {
      setCommandError('Command is required');
      isValid = false;
    } else {
      setCommandError('');
    }
    
    return isValid;
  };
  
  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    // Convert env vars array to object
    const envObject = envVars.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    // Create server config
    const serverConfig: Server = {
      enabled,
      command,
      args,
      ...(envVars.length > 0 ? { env: envObject } : {})
    };
    
    const success = await onSave(serverName, serverConfig);
    setIsSaving(false);
    
    if (success) {
      onClose();
    }
  };
  
  // Handle key press in arg input
  const handleArgKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddArg();
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={disabled || isSaving ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Basic Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    label="Server Name"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    fullWidth
                    required
                    error={!!nameError}
                    helperText={nameError}
                    disabled={disabled || isSaving || (initialData !== undefined && initialData !== null)}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        disabled={disabled || isSaving}
                      />
                    }
                    label="Enable Server"
                  />
                </Grid>
              </Grid>
            </Grid>
            
            {/* Command */}
            <Grid item xs={12}>
              <TextField
                label="Command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                fullWidth
                required
                error={!!commandError}
                helperText={commandError}
                disabled={disabled || isSaving}
              />
            </Grid>
            
            {/* Arguments */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Arguments
              </Typography>
              
              <Box sx={{ mb: 2, display: 'flex' }}>
                <TextField
                  label="Add Argument"
                  value={newArg}
                  onChange={(e) => setNewArg(e.target.value)}
                  onKeyDown={handleArgKeyPress}
                  fullWidth
                  disabled={disabled || isSaving}
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddArg}
                  disabled={!newArg.trim() || disabled || isSaving}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {args.map((arg, index) => (
                  <Chip
                    key={index}
                    label={arg}
                    onDelete={() => handleRemoveArg(index)}
                    disabled={disabled || isSaving}
                  />
                ))}
                {args.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No arguments added
                  </Typography>
                )}
              </Box>
            </Grid>
            
            {/* Environment Variables */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Environment Variables
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Environment Variable Key"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    fullWidth
                    disabled={disabled || isSaving}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Environment Variable Value"
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    fullWidth
                    disabled={disabled || isSaving}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="contained"
                    onClick={handleAddEnvVar}
                    disabled={!newEnvKey.trim() || !newEnvValue.trim() || disabled || isSaving}
                    startIcon={<AddIcon />}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
              
              {envVars.length > 0 ? (
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  {envVars.map((env, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <Divider />}
                      <Box sx={{ display: 'flex', p: 1, alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Tooltip title={env.value} placement="top">
                            <Typography>
                              <strong>{env.key}:</strong> {env.value.length > 30 ? `${env.value.substring(0, 30)}...` : env.value}
                            </Typography>
                          </Tooltip>
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveEnvVar(index)}
                          disabled={disabled || isSaving}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </React.Fragment>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No environment variables added
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={disabled || isSaving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={disabled || isSaving}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServerForm; 