# MCPick

MCPick is a desktop application for managing MCP (Model Context Protocol) servers for Claude Desktop. It allows you to enable, disable, add, edit, and delete MCP server configurations with a user-friendly interface.

## Features

- View and manage all your MCP servers in one place
- Enable/disable servers with a single click
- Add, edit, and delete server configurations
- Automatically detect and load existing configurations
- Manual configuration file selection if needed

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mcpick.git
   cd mcpick
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Building for Production

To build the application for your platform:

```
npm run build
```

This will create platform-specific installers in the `release` directory.

## Usage

1. When you first start MCPick, it will try to automatically locate your Claude Desktop configuration file.
2. If it can't find the configuration file, you can manually select it using the "Browse" button.
3. Once connected to your config file, you'll see a list of your existing MCP servers.
4. Use the toggle switches to enable or disable servers.
5. Click "Add Server" to add a new server configuration.
6. Use the edit and delete buttons to modify or remove existing servers.

## MCP Server Configuration

Each MCP server requires the following information:

- **Server Name**: A unique identifier for the server
- **Command**: The executable to run (e.g., `npx`)
- **Arguments**: Command-line arguments (e.g., `-y`, `@modelcontextprotocol/server-memory`)
- **Environment Variables**: Optional environment variables for the server

## License

MIT 