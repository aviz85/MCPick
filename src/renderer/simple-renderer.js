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

// Mask sensitive data like API keys, IDs, or other long sequences
function maskSensitiveValue(value) {
  if (!value) return value;
  let result = value;
  
  try {
    // Skip processing for npm package names and file paths
    if (isNpmPackage(result) || isFilePath(result)) {
      return result;
    }
    
    // Find and mask long sequences of alphanumeric characters and hyphens (16+ chars)
    const longIdRegex = /([a-zA-Z0-9\-_]{16,})/g;
    let match;
    let lastIndex = 0;
    let maskedResult = '';
    
    // Reset regex state
    longIdRegex.lastIndex = 0;
    
    // Manually iterate through matches to avoid potential issues
    while ((match = longIdRegex.exec(result)) !== null) {
      const id = match[1];
      const startIndex = match.index;
      
      // Skip masking if the match contains a path separator or is part of a package name
      if (id.includes('/') || id.includes('\\') || id.startsWith('@')) {
        maskedResult += result.substring(lastIndex, startIndex + id.length);
      } else {
        // For very long strings, keep fewer visible characters
        const charsToShow = Math.min(4, Math.floor(id.length / 6));
        const maskedId = `${id.substring(0, charsToShow)}${'*'.repeat(Math.min(8, id.length - (charsToShow * 2)))}${id.substring(id.length - charsToShow)}`;
        
        // Add text before this match and the masked ID
        maskedResult += result.substring(lastIndex, startIndex) + maskedId;
      }
      
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
    
    // Special case for service names - don't mask commands and common packages
    const commonNames = ['make', 'node', 'npm', 'npx', 'yarn', 'bash', 'python', 'docker'];
    commonNames.forEach(name => {
      // For each common name, make sure we don't mask it
      const regex = new RegExp(`(${name})(\\*+)`, 'gi');
      result = result.replace(regex, `$1`);
    });
    
    // Look for common API key prefixes - be more selective
    const commonPrefixes = ['sk-', 'pk-', 'api-', 'key-', 'token-', 'secret-'];
    for (const prefix of commonPrefixes) {
      if (result.startsWith(prefix) && result.length > prefix.length + 10) { // Only mask if it's a longer key
        return `${prefix}${'*'.repeat(Math.min(8, result.length - prefix.length))}`;
      }
    }
  } catch (error) {
    // If any errors in masking, return original
    console.error('Error in masking function:', error);
  }
  
  return result;
}

// Function to check if a string is an npm package name
function isNpmPackage(str) {
  // Check for scoped packages (starting with @)
  if (str.startsWith('@')) {
    return true;
  }
  
  // Check for package paths format like package/subpackage
  if (/^[a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_]+/.test(str)) {
    return true;
  }
  
  // Known package prefixes
  const packagePrefixes = ['@model', '@openai', '@claude', '@anthropic', '@mcp', 
                         'server-', 'react-', 'vue-', 'angular-', 'node-'];
  
  for (const prefix of packagePrefixes) {
    if (str.includes(prefix)) {
      return true;
    }
  }
  
  return false;
}

// Function to check if a string is a file path
function isFilePath(str) {
  // Check for absolute and relative paths
  if (str.includes('/') || str.includes('\\')) {
    return true;
  }
  
  // Check for Windows-style drive letters
  if (/^[a-zA-Z]:\\/.test(str)) {
    return true;
  }
  
  // Check for URL paths
  if (/^https?:\/\//.test(str)) {
    return true;
  }
  
  return false;
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
    const maskedCommand = maskSensitiveValue(server.command);
    const maskedArgs = server.args.map(arg => maskSensitiveValue(arg)).join(' ');
    const isDataMasked = maskedCommand !== server.command || maskedArgs !== server.args.join(' ');
    
    html += `
      <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
        <div style="flex-grow: 1; margin-right: 10px;">
          <div style="font-weight: bold;">${serverName}</div>
          <div style="color: #666; font-size: 0.9em;" class="command-container" data-server="${serverName}">
            <span class="masked-text">${maskedCommand} ${maskedArgs}</span>
            <span class="original-text" style="display: none;">${server.command} ${server.args.join(' ')}</span>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          ${isDataMasked ? `
            <button data-action="toggle-mask" data-server="${serverName}" class="reveal-btn" style="background: none; border: none; cursor: pointer; color: #1976d2; font-size: 0.8em;">
              <span class="show-text">Show</span>
              <span class="hide-text" style="display: none;">Hide</span>
            </button>
          ` : ''}
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
  
  serverList.querySelectorAll('button[data-action="toggle-mask"]').forEach(button => {
    button.addEventListener('click', (e) => {
      // Get button element (might be the span inside the button that was clicked)
      const buttonElement = e.target.closest('button[data-action="toggle-mask"]');
      // Get server name from the button attribute
      const serverName = buttonElement.getAttribute('data-server');
      
      // Find container using the server name
      const container = document.querySelector(`.command-container[data-server="${serverName}"]`);
      if (!container) {
        console.error('Command container not found for server:', serverName);
        return;
      }
      
      const maskedEl = container.querySelector('.masked-text');
      const originalEl = container.querySelector('.original-text');
      if (!maskedEl || !originalEl) {
        console.error('Masked or original text elements not found');
        return;
      }
      
      const showText = buttonElement.querySelector('.show-text');
      const hideText = buttonElement.querySelector('.hide-text');
      if (!showText || !hideText) {
        console.error('Show/hide text elements not found');
        return;
      }
      
      // Toggle visibility
      const isShowing = maskedEl.style.display === 'none';
      maskedEl.style.display = isShowing ? 'inline' : 'none';
      originalEl.style.display = isShowing ? 'none' : 'inline';
      showText.style.display = isShowing ? 'inline' : 'none';
      hideText.style.display = isShowing ? 'none' : 'inline';
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
function showAddServerDialog(serverToEdit = null) {
  const isEdit = !!serverToEdit;
  const serverName = isEdit ? serverToEdit[0] : '';
  const serverData = isEdit ? serverToEdit[1] : { command: 'npx', args: ['-y'], enabled: false, env: {} };
  
  // Create a modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  // Create the form
  const formHtml = `
    <div style="background: white; border-radius: 8px; width: 600px; max-width: 90%; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <h2 style="margin-top: 0; color: #333;">${isEdit ? 'Edit Server' : 'Add New Server'}</h2>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Server Name:</label>
        <input id="server-name" type="text" value="${serverName}" ${isEdit ? 'disabled' : ''} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" placeholder="e.g., memory, filesystem, github">
        <small style="color: #666; display: block; margin-top: 5px;">Use letters, numbers, underscores, and hyphens only</small>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Command:</label>
        <input id="server-command" type="text" 
               value="${isEdit ? maskSensitiveValue(serverData.command) : serverData.command}" 
               data-original-value="${serverData.command}"
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" 
               placeholder="e.g., npx">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Arguments (space separated):</label>
        <input id="server-args" type="text" 
               value="${isEdit ? serverData.args.map(arg => maskSensitiveValue(arg)).join(' ') : serverData.args.join(' ')}" 
               data-original-value="${serverData.args.join(' ')}"
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" 
               placeholder="e.g., -y @modelcontextprotocol/server-memory">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Environment Variables (JSON):</label>
        <textarea id="server-env" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; min-height: 100px;" placeholder='{"KEY1": "value1", "KEY2": "value2"}'>${JSON.stringify(serverData.env || {}, null, 2)}</textarea>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input id="server-enabled" type="checkbox" ${serverData.enabled ? 'checked' : ''} style="margin-right: 8px;">
          <span>Enable Server</span>
        </label>
      </div>
      
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
        <button id="cancel-btn" style="padding: 8px 16px; background: #f5f5f5; color: #333; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        <button id="save-btn" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">Save</button>
      </div>
    </div>
  `;
  
  overlay.innerHTML = formHtml;
  document.body.appendChild(overlay);
  
  // Set up event listeners
  document.getElementById('cancel-btn').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // Add focus/blur events for sensitive fields
  const commandInput = document.getElementById('server-command');
  const argsInput = document.getElementById('server-args');
  
  // Show real value on focus
  commandInput.addEventListener('focus', () => {
    commandInput.value = commandInput.getAttribute('data-original-value');
  });
  
  argsInput.addEventListener('focus', () => {
    argsInput.value = argsInput.getAttribute('data-original-value');
  });
  
  // Re-mask on blur if not changed
  commandInput.addEventListener('blur', () => {
    const originalValue = commandInput.getAttribute('data-original-value');
    if (commandInput.value === originalValue) {
      commandInput.value = maskSensitiveValue(originalValue);
    } else {
      // Value changed, update the original
      commandInput.setAttribute('data-original-value', commandInput.value);
    }
  });
  
  argsInput.addEventListener('blur', () => {
    const originalValue = argsInput.getAttribute('data-original-value');
    if (argsInput.value === originalValue) {
      argsInput.value = originalValue.split(' ').map(arg => maskSensitiveValue(arg)).join(' ');
    } else {
      // Value changed, update the original
      argsInput.setAttribute('data-original-value', argsInput.value);
    }
  });
  
  document.getElementById('save-btn').addEventListener('click', () => {
    // Validate and save the form
    const newServerName = document.getElementById('server-name').value.trim();
    // Use original values stored in data attributes
    const command = commandInput.getAttribute('data-original-value').trim();
    const argsString = argsInput.getAttribute('data-original-value').trim();
    const envJson = document.getElementById('server-env').value.trim();
    const enabled = document.getElementById('server-enabled').checked;
    
    // Validate server name
    if (!newServerName) {
      alert('Server name is required');
      return;
    }
    
    if (!isEdit && !/^[a-zA-Z0-9_-]+$/.test(newServerName)) {
      alert('Server name must contain only letters, numbers, underscores, and hyphens');
      return;
    }
    
    // Validate command
    if (!command) {
      alert('Command is required');
      return;
    }
    
    // Parse arguments
    const args = argsString ? argsString.split(' ').filter(arg => arg.trim()) : [];
    
    // Parse environment variables
    let env = {};
    if (envJson) {
      try {
        env = JSON.parse(envJson);
        if (typeof env !== 'object' || env === null) {
          throw new Error('Environment variables must be a JSON object');
        }
      } catch (error) {
        alert(`Invalid environment variables JSON: ${error.message}`);
        return;
      }
    }
    
    // Create server config
    const newServerConfig = {
      command,
      args,
      enabled,
      ...(Object.keys(env).length > 0 ? { env } : {})
    };
    
    // Save the server
    saveServer(newServerName, newServerConfig);
    
    // Close the dialog
    document.body.removeChild(overlay);
  });
}

// Edit server
function editServer(serverName, serverData) {
  showAddServerDialog([serverName, serverData]);
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