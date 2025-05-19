import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField,
  Stack,
  Chip
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface ConfigPathSelectorProps {
  configPath: string;
  configExists: boolean;
  onBrowse: () => void;
  onOpenLocation?: () => void;
}

const ConfigPathSelector: React.FC<ConfigPathSelectorProps> = ({
  configPath,
  configExists,
  onBrowse,
  onOpenLocation
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Claude Desktop Configuration
      </Typography>
      
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Config File Path"
            value={configPath}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
            sx={{ mr: 2 }}
          />
          <Button 
            variant="contained" 
            startIcon={<FolderOpenIcon />}
            onClick={onBrowse}
            sx={{ mr: 1 }}
          >
            Browse
          </Button>
          {onOpenLocation && (
            <Button 
              variant="contained" 
              color="success"
              startIcon={<OpenInNewIcon />}
              onClick={onOpenLocation}
              disabled={!configPath}
            >
              Open Location
            </Button>
          )}
        </Box>
        
        <Box>
          {configPath ? (
            <Chip
              icon={configExists ? <CheckCircleIcon /> : <ErrorIcon />}
              label={configExists ? "Configuration file found" : "Configuration file not found"}
              color={configExists ? "success" : "error"}
              variant="outlined"
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Please select the Claude Desktop configuration file:
              <ul>
                <li>macOS: ~/Library/Application Support/Claude/claude_desktop_config.json</li>
                <li>Windows: %APPDATA%\Claude\claude_desktop_config.json</li>
              </ul>
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default ConfigPathSelector; 