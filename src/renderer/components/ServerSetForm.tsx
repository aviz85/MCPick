import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  FormHelperText,
  SelectChangeEvent,
  OutlinedInput
} from '@mui/material';
import { ServerSet } from '../types';

interface ServerSetFormProps {
  open: boolean;
  title: string;
  initialData?: [string, ServerSet] | null;
  availableServers: string[];
  onSave: (setId: string, setConfig: ServerSet) => Promise<boolean>;
  onClose: () => void;
  disabled?: boolean;
}

const ServerSetForm: React.FC<ServerSetFormProps> = ({
  open,
  title,
  initialData,
  availableServers,
  onSave,
  onClose,
  disabled = false
}) => {
  const [setId, setSetId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servers, setServers] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      const [id, data] = initialData;
      setSetId(id);
      setName(data.name);
      setDescription(data.description);
      setServers(data.servers);
      setPrompt(data.prompt);
    } else {
      // Reset form for new server set
      setSetId('');
      setName('');
      setDescription('');
      setServers([]);
      setPrompt('');
    }
    setErrors({});
  }, [initialData]);
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!setId.trim()) {
      newErrors.setId = 'ID is required';
    }
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (servers.length === 0) {
      newErrors.servers = 'At least one server must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle server selection change
  const handleServerChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setServers(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    const serverSetConfig: ServerSet = {
      name,
      description,
      servers,
      prompt
    };
    
    const success = await onSave(setId, serverSetConfig);
    
    setIsSubmitting(false);
    
    if (success) {
      onClose();
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Set ID"
            value={setId}
            onChange={(e) => setSetId(e.target.value)}
            error={!!errors.setId}
            helperText={errors.setId}
            disabled={disabled || !!initialData}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            disabled={disabled}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            disabled={disabled}
            fullWidth
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal" error={!!errors.servers}>
            <InputLabel id="servers-select-label">Servers</InputLabel>
            <Select
              labelId="servers-select-label"
              multiple
              value={servers}
              onChange={handleServerChange}
              input={<OutlinedInput label="Servers" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              disabled={disabled}
            >
              {availableServers.map((serverName) => (
                <MenuItem key={serverName} value={serverName}>
                  {serverName}
                </MenuItem>
              ))}
            </Select>
            {errors.servers && <FormHelperText>{errors.servers}</FormHelperText>}
          </FormControl>
          
          <TextField
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            rows={4}
            placeholder="Enter instructions for how to use this set of tools..."
            disabled={disabled}
            fullWidth
            margin="normal"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={disabled || isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          disabled={disabled || isSubmitting}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServerSetForm; 