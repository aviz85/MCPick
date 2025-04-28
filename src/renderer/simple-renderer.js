// Very simple browser script that doesn't rely on any module system
// This will be included directly in the HTML page

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showError(event.error);
});

// Function to show a nice error message
function showError(error) {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `<div style="color: red; padding: 20px;">
      <h2>Application Error</h2>
      <pre>${error?.message || 'Unknown error'}</pre>
      <pre>${error?.stack || ''}</pre>
    </div>`;
  }
}

// Create a simple UI for config selection and server management
function renderSimpleUI() {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;
  
  rootElement.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
      <header style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <h1 style="margin: 0; color: #1976d2;">MCPick</h1>
        <p style="margin: 0; color: #666;">MCP Server Manager for Claude Desktop</p>
      </header>
      
      <div style="background: white; border-radius: 5px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #333;">Claude Configuration</h2>
        <p id="config-path-display">No configuration file selected</p>
        <div style="display: flex; gap: 10px;">
          <button id="browse-btn" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Browse...
          </button>
        </div>
      </div>
      
      <div id="servers-container" style="background: white; border-radius: 5px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h2 style="margin-top: 0; color: #333;">MCP Servers</h2>
          <button id="add-server-btn" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Add Server
          </button>
        </div>
        
        <div id="server-list">
          <p style="color: #666; text-align: center; padding: 20px;">No servers found</p>
        </div>
      </div>
    </div>
  `;

  // Set up event listeners
  document.getElementById('browse-btn').addEventListener('click', () => {
    // Send IPC message to browse for config file
    window.api.browseConfigFile().then(result => {
      if (!result.canceled && result.configPath) {
        updateConfigStatus(result.configPath, result.configExists);
        loadServers();
      }
    }).catch(err => {
      showError(err);
    });
  });

  document.getElementById('add-server-btn').addEventListener('click', () => {
    showAddServerDialog();
  });

  // Check if config exists on startup
  checkConfigStatus();
}

// Update the UI with config status
function updateConfigStatus(configPath, configExists) {
  const element = document.getElementById('config-path-display');
  if (element) {
    if (configExists) {
      element.innerHTML = `<span style="color: green;">✓</span> ${configPath}`;
      document.getElementById('servers-container').style.display = 'block';
    } else {
      element.innerHTML = `<span style="color: red;">✗</span> ${configPath} (File not found)`;
      document.getElementById('servers-container').style.display = 'none';
    }
  }
}

// Check config status
function checkConfigStatus() {
  window.api.getAppStatus().then(status => {
    if (status.configPath) {
      updateConfigStatus(status.configPath, status.configExists);
      if (status.configExists) {
        loadServers();
      }
    }
  }).catch(err => {
    showError(err);
  });
}

// Load servers
function loadServers() {
  window.api.getServers().then(servers => {
    renderServerList(servers);
  }).catch(err => {
    showError(err);
  });
}

// Render server list
function renderServerList(servers) {
  const serverList = document.getElementById('server-list');
  if (!serverList) return;
  
  if (Object.keys(servers).length === 0) {
    serverList.innerHTML = `<p style="color: #666; text-align: center; padding: 20px;">No servers found</p>`;
    return;
  }
  
  let html = '';
  Object.entries(servers).forEach(([serverName, server]) => {
    html += `
      <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: bold;">${serverName}</div>
          <div style="color: #666; font-size: 0.9em;">${server.command} ${server.args.join(' ')}</div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
            <input type="checkbox" data-server="${serverName}" ${server.enabled ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px; ${server.enabled ? 'background-color: #1976d2;' : ''}"></span>
          </label>
          <button data-action="edit" data-server="${serverName}" style="background: none; border: none; cursor: pointer; color: #1976d2;">Edit</button>
          <button data-action="delete" data-server="${serverName}" style="background: none; border: none; cursor: pointer; color: #dc004e;">Delete</button>
        </div>
      </div>
    `;
  });
  
  serverList.innerHTML = html;
  
  // Add event listeners
  serverList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const serverName = e.target.getAttribute('data-server');
      const enabled = e.target.checked;
      toggleServer(serverName, enabled);
    });
  });
  
  serverList.querySelectorAll('button[data-action="edit"]').forEach(button => {
    button.addEventListener('click', (e) => {
      const serverName = e.target.getAttribute('data-server');
      editServer(serverName, servers[serverName]);
    });
  });
  
  serverList.querySelectorAll('button[data-action="delete"]').forEach(button => {
    button.addEventListener('click', (e) => {
      const serverName = e.target.getAttribute('data-server');
      deleteServer(serverName);
    });
  });
}

// Toggle server enabled state
function toggleServer(serverName, enabled) {
  window.api.toggleServer(serverName, enabled).then(success => {
    if (!success) {
      alert(`Failed to ${enabled ? 'enable' : 'disable'} server "${serverName}"`);
      // Reload to reset UI
      loadServers();
    }
  }).catch(err => {
    showError(err);
  });
}

// Show add server dialog
function showAddServerDialog() {
  // Simple implementation - use prompt dialogs
  const serverName = prompt('Enter server name (letters, numbers, underscores only):');
  if (!serverName) return;
  
  if (!/^[a-zA-Z0-9_-]+$/.test(serverName)) {
    alert('Server name must contain only letters, numbers, underscores, and hyphens');
    return;
  }
  
  const command = prompt('Enter command (e.g., npx):', 'npx');
  if (!command) return;
  
  const argsString = prompt('Enter arguments (space separated):', '-y');
  const args = argsString ? argsString.split(' ').filter(arg => arg.trim()) : [];
  
  const enableServer = confirm('Enable this server?');
  
  const server = {
    command,
    args,
    enabled: enableServer
  };
  
  saveServer(serverName, server);
}

// Edit server
function editServer(serverName, serverData) {
  // Simple implementation - use prompt dialogs
  const command = prompt('Enter command:', serverData.command);
  if (!command) return;
  
  const argsString = prompt('Enter arguments (space separated):', serverData.args.join(' '));
  const args = argsString ? argsString.split(' ').filter(arg => arg.trim()) : [];
  
  const enableServer = confirm('Enable this server?');
  
  const server = {
    command,
    args,
    enabled: enableServer
  };
  
  saveServer(serverName, server);
}

// Save server
function saveServer(serverName, serverData) {
  window.api.saveServer(serverName, serverData).then(success => {
    if (success) {
      loadServers();
    } else {
      alert(`Failed to save server "${serverName}"`);
    }
  }).catch(err => {
    showError(err);
  });
}

// Delete server
function deleteServer(serverName) {
  if (!confirm(`Are you sure you want to delete server "${serverName}"?`)) {
    return;
  }
  
  window.api.deleteServer(serverName).then(success => {
    if (success) {
      loadServers();
    } else {
      alert(`Failed to delete server "${serverName}"`);
    }
  }).catch(err => {
    showError(err);
  });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    renderSimpleUI();
  } catch (error) {
    showError(error);
  }
}); 