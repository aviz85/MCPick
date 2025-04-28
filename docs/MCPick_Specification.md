# MCPick - Specification Document

## Overview
MCPick is an Electron desktop application designed to manage Model Context Protocol (MCP) servers for Claude Desktop. The application provides a user-friendly interface to enable, disable, add, edit, and delete MCP server configurations. It directly manipulates the Claude Desktop configuration file while maintaining its own persistent store of server configurations.

## Core Functionality

### 1. Configuration Management
- **Read/Write Claude Config**: Ability to read from and write to the Claude Desktop configuration file
- **Persistent Storage**: Maintain a separate store of all configured servers regardless of enabled/disabled status
- **File Path Detection**: Automatically locate the Claude configuration file based on the user's operating system
- **Manual File Selection**: If the configuration file cannot be found automatically, allow the user to manually browse for it

### 2. Server Management
- **View Servers**: Display a list of all configured MCP servers with their enabled/disabled status
- **Enable/Disable**: Toggle servers on/off (adding/removing them from the Claude config)
- **Add Server**: Create new server configurations with a user-friendly form
- **Edit Server**: Modify existing server configurations (name, command, arguments, environment variables)
- **Delete Server**: Remove server configurations with confirmation dialog

## User Interface

### 1. Main Window
- Server list with status indicators
- Action buttons (Add, Edit, Delete)
- Toggle switches for each server
- Status indicator for Claude config file location

### 2. Add/Edit Server Dialog
- Form fields for:
  - Server name (key)
  - Command
  - Arguments (with array input support)
  - Environment variables (key-value pairs)
- Save/Cancel buttons

### 3. Settings/Preferences
- Claude config file path
- Button to manually browse for config file
- Theme selection (light/dark)
- Auto-start options

### 4. Notification Area
- Display success/error messages
- Show warnings when Claude config file is modified externally

## Technical Details

### 1. File Operations
- File system monitoring to detect external changes to Claude config
- Automatic backup creation before modifying Claude config
- Error handling for file operations

### 2. Claude Config File Locations
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### 3. Data Format
```json
{
  "mcpServers": {
    "serverName": {
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR1": "value1",
        "ENV_VAR2": "value2"
      }
    }
  }
}
```

### 4. Technologies
- Electron
- React
- TypeScript
- Electron Store (for persistent storage)
- Electron Builder (for distribution)

## User Experience Flow

1. **First Launch**:
   - App attempts to locate Claude config file
   - If not found, prompts user to browse for it
   - Initializes internal storage

2. **Normal Operation**:
   - Shows current servers and their status
   - Allows toggling, editing, adding, removing servers
   - Changes to enabled servers are immediately reflected in Claude's config

3. **Error Handling**:
   - If Claude config file becomes inaccessible, app notifies user
   - Options to retry or browse for new location

## Future Enhancements
- Server templates for common MCP configurations
- Import/export of server configurations
- Server logs viewing
- Auto-detection of installed MCP servers
- Testing servers connection/functionality 