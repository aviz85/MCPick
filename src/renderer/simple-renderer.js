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
      
      <div id="tabs-container" style="background: white; border-radius: 5px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); display: none;">
        <div style="border-bottom: 1px solid #ddd; margin-bottom: 20px;">
          <div style="display: flex;">
            <button id="servers-tab" class="tab-button active" style="padding: 10px 20px; background: none; border: none; cursor: pointer; position: relative; color: #1976d2; font-weight: bold;">
              Servers
              <span style="position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: #1976d2;"></span>
            </button>
            <button id="sets-tab" class="tab-button" style="padding: 10px 20px; background: none; border: none; cursor: pointer; position: relative; color: #666;">
              Sets
            </button>
          </div>
        </div>
        
        <div id="servers-content" class="tab-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin-top: 0; color: #333;">MCP Servers</h2>
            <div style="display: flex; gap: 10px;">
              <button id="parse-config-btn" style="padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Parse Config JSON
              </button>
              <button id="add-server-btn" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Add Server
              </button>
            </div>
          </div>
          
          <div id="server-list">
            <p style="color: #666; text-align: center; padding: 20px;">No servers found</p>
          </div>
        </div>
        
        <div id="sets-content" class="tab-content" style="display: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin-top: 0; color: #333;">Server Sets</h2>
            <div style="display: flex; gap: 10px;">
              <button id="add-set-btn" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Add Set
              </button>
            </div>
          </div>
          
          <div id="set-list">
            <p style="color: #666; text-align: center; padding: 20px;">No server sets found</p>
          </div>
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
        loadServerSets();
      }
    }).catch(err => {
      showError(err);
    });
  });

  document.getElementById('add-server-btn').addEventListener('click', () => {
    showAddServerDialog();
  });

  document.getElementById('parse-config-btn').addEventListener('click', () => {
    showParseConfigDialog();
  });
  
  document.getElementById('add-set-btn').addEventListener('click', () => {
    showAddSetDialog();
  });
  
  // Set up tab switching
  document.getElementById('servers-tab').addEventListener('click', () => {
    switchTab('servers');
  });
  
  document.getElementById('sets-tab').addEventListener('click', () => {
    switchTab('sets');
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
      document.getElementById('tabs-container').style.display = 'block';
    } else {
      element.innerHTML = `<span style="color: red;">✗</span> ${configPath} (File not found)`;
      document.getElementById('tabs-container').style.display = 'none';
    }
  }
}

// Switch between tabs
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(tab => {
    tab.classList.remove('active');
    tab.style.color = '#666';
    tab.innerHTML = tab.innerHTML.replace('<span style="position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: #1976d2;"></span>', '');
  });
  
  const activeTab = document.getElementById(`${tabName}-tab`);
  activeTab.classList.add('active');
  activeTab.style.color = '#1976d2';
  activeTab.style.fontWeight = 'bold';
  activeTab.innerHTML += '<span style="position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: #1976d2;"></span>';
  
  // Update content visibility
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });
  document.getElementById(`${tabName}-content`).style.display = 'block';
}

// Check config status
function checkConfigStatus() {
  window.api.getAppStatus().then(status => {
    if (status.configPath) {
      updateConfigStatus(status.configPath, status.configExists);
      if (status.configExists) {
        loadServers();
        loadServerSets();
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

// Load server sets
function loadServerSets() {
  window.api.getServerSets().then(sets => {
    renderSetList(sets);
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
            <span class="switch-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${server.enabled ? '#1976d2' : '#ccc'}; transition: .4s; border-radius: 20px;"></span>
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
      
      // Update the switch color immediately
      const switchSlider = e.target.nextElementSibling;
      if (switchSlider) {
        switchSlider.style.backgroundColor = enabled ? '#1976d2' : '#ccc';
      }
      
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

// Show parse config dialog
function showParseConfigDialog() {
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
      <h2 style="margin-top: 0; color: #333;">Parse Config JSON</h2>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Paste your server configuration JSON:</label>
        <textarea id="config-json" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; min-height: 200px; font-family: monospace;" 
          placeholder='{"mcpServers": {"google-contacts-server": {"command": "uv", "args": ["--directory", "/path/to/mcp-google-contacts-server", "run", "main.py"], "disabled": false, "autoApprove": []}}}'></textarea>
        <small style="color: #666; display: block; margin-top: 5px;">JSON must contain an "mcpServers" object with server configurations</small>
      </div>
      
      <div id="validation-message" style="margin-bottom: 20px; color: #d32f2f; display: none;"></div>
      
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
        <button id="cancel-parse-btn" style="padding: 8px 16px; background: #f5f5f5; color: #333; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        <button id="validate-btn" style="padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">Validate</button>
        <button id="parse-btn" style="padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; opacity: 0.5; cursor: not-allowed;" disabled>Parse & Add Servers</button>
      </div>
    </div>
  `;
  
  overlay.innerHTML = formHtml;
  document.body.appendChild(overlay);
  
  const validationMessage = document.getElementById('validation-message');
  const parseBtn = document.getElementById('parse-btn');
  
  // Add click handler for disabled parse button
  parseBtn.addEventListener('click', (e) => {
    if (parseBtn.disabled) {
      validationMessage.textContent = 'Please validate the JSON configuration first';
      validationMessage.style.color = '#ff9800';
      validationMessage.style.display = 'block';
    }
  });
  
  // Set up event listeners
  document.getElementById('cancel-parse-btn').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  document.getElementById('validate-btn').addEventListener('click', () => {
    const jsonText = document.getElementById('config-json').value.trim();
    validationMessage.style.display = 'block';
    
    if (!jsonText) {
      validationMessage.textContent = 'Error: JSON is empty';
      validationMessage.style.color = '#d32f2f';
      parseBtn.disabled = true;
      parseBtn.style.opacity = '0.5';
      parseBtn.style.cursor = 'not-allowed';
      return;
    }
    
    try {
      const parsedConfig = JSON.parse(jsonText);
      
      if (!parsedConfig.mcpServers || typeof parsedConfig.mcpServers !== 'object' || Array.isArray(parsedConfig.mcpServers)) {
        validationMessage.textContent = 'Error: JSON must contain an "mcpServers" object';
        validationMessage.style.color = '#d32f2f';
        parseBtn.disabled = true;
        parseBtn.style.opacity = '0.5';
        parseBtn.style.cursor = 'not-allowed';
        return;
      }
      
      const serverCount = Object.keys(parsedConfig.mcpServers).length;
      if (serverCount === 0) {
        validationMessage.textContent = 'Error: No servers found in the mcpServers object';
        validationMessage.style.color = '#d32f2f';
        parseBtn.disabled = true;
        parseBtn.style.opacity = '0.5';
        parseBtn.style.cursor = 'not-allowed';
        return;
      }
      
      validationMessage.textContent = `Valid JSON format. Found ${serverCount} server(s).`;
      validationMessage.style.color = '#4caf50';
      parseBtn.disabled = false;
      parseBtn.style.opacity = '1';
      parseBtn.style.cursor = 'pointer';
      
    } catch (error) {
      validationMessage.textContent = `Error: Invalid JSON - ${error.message}`;
      validationMessage.style.color = '#d32f2f';
      parseBtn.disabled = true;
      parseBtn.style.opacity = '0.5';
      parseBtn.style.cursor = 'not-allowed';
    }
  });
  
  document.getElementById('parse-btn').addEventListener('click', async () => {
    const parseBtn = document.getElementById('parse-btn');
    const validationMessage = document.getElementById('validation-message');
    const jsonText = document.getElementById('config-json').value.trim();
    
    // Disable button and show loading state
    parseBtn.disabled = true;
    parseBtn.textContent = 'Processing...';
    
    try {
      const parsedConfig = JSON.parse(jsonText);
      const servers = parsedConfig.mcpServers;
      
      if (!servers || typeof servers !== 'object') {
        throw new Error('Invalid mcpServers format');
      }
      
      // Process each server
      let serverCount = 0;
      const promises = [];
      
      for (const [serverName, serverConfig] of Object.entries(servers)) {
        if (!serverConfig.command) {
          throw new Error(`Server "${serverName}" is missing required command field`);
        }
        
        // Convert the Claude format to our app format
        const convertedConfig = {
          command: serverConfig.command,
          args: serverConfig.args || [],
          enabled: false, // Always disabled by default
          ...(serverConfig.env ? { env: serverConfig.env } : {})
        };
        
        // Add the server
        promises.push(
          window.api.saveServer(serverName, convertedConfig)
            .catch(err => {
              throw new Error(`Failed to save server "${serverName}": ${err.message}`);
            })
        );
        serverCount++;
      }
      
      // Wait for all servers to be added
      await Promise.all(promises);
      
      // Success - close dialog and refresh
      document.body.removeChild(overlay);
      alert(`Successfully added ${serverCount} server(s). All servers are disabled by default.`);
      loadServers(); // Refresh the server list
      
    } catch (error) {
      console.error('Error in parse-btn handler:', error);
      validationMessage.textContent = `Error: ${error.message}`;
      validationMessage.style.color = '#d32f2f';
      
      // Reset button state
      parseBtn.disabled = false;
      parseBtn.textContent = 'Parse & Add Servers';
    }
  });
}

// Render server sets list
function renderSetList(sets) {
  const setList = document.getElementById('set-list');
  if (!setList) return;
  
  // Validate input
  if (!sets || typeof sets !== 'object') {
    console.error('Invalid sets data:', sets);
    setList.innerHTML = `<p style="color: #dc004e; text-align: center; padding: 20px;">Error: Invalid set data</p>`;
    return;
  }
  
  if (Object.keys(sets).length === 0) {
    setList.innerHTML = `<p style="color: #666; text-align: center; padding: 20px;">No server sets found</p>`;
    return;
  }
  
  // Determine which set is active by checking which servers are enabled
  let activeSetId = null;
  
  // Get enabled servers
  window.api.getServers().then(servers => {
    const enabledServers = Object.entries(servers)
      .filter(([_, server]) => server.enabled)
      .map(([name, _]) => name);
    
    // If we have enabled servers, try to find a matching set
    if (enabledServers.length > 0) {
      Object.entries(sets).forEach(([setId, set]) => {
        // Check if this set's servers exactly match the enabled servers
        const setServers = new Set(set.servers);
        if (enabledServers.length === setServers.size && 
            enabledServers.every(server => setServers.has(server))) {
          activeSetId = setId;
        }
      });
    }
    
    // Now render the set list
    let html = '';
    Object.entries(sets).forEach(([setId, set]) => {
      const isActive = setId === activeSetId;
      
      // Ensure the set has valid data
      const safeSet = {
        name: set?.name || 'Unnamed Set',
        description: set?.description || '',
        prompt: set?.prompt || '',
        servers: Array.isArray(set?.servers) ? set.servers : []
      };
      
      html += `
        <div class="server-set-item" 
             data-set-id="${setId}" 
             style="border-bottom: 1px solid #eee; padding: 15px; 
                   background-color: ${isActive ? '#f0f7ff' : 'white'};
                   border-left: ${isActive ? '4px solid #1976d2' : '4px solid transparent'};
                   transition: all 0.2s ease;
                   cursor: pointer;
                   margin-bottom: 8px;
                   border-radius: 4px;
                   box-shadow: ${isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex-grow: 1;">
              <div style="font-weight: bold; display: flex; align-items: center;">
                ${isActive ? '<span style="color: #1976d2; margin-right: 8px;">●</span>' : ''}
                ${safeSet.name}
                ${isActive ? '<span style="font-size: 0.8em; background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; margin-left: 10px;">Active</span>' : ''}
              </div>
              <div style="color: #666; font-size: 0.9em; margin-top: 4px;">${safeSet.description || 'No description'}</div>
              <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px;">
                ${safeSet.servers.map(server => `
                  <span style="background: #e0e0e0; color: #333; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">${server}</span>
                `).join('')}
              </div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button data-action="edit-set" data-set="${setId}" style="background: none; border: none; cursor: pointer; color: #1976d2;">
                <span style="display: inline-block; width: 18px; height: 18px;">✎</span>
              </button>
              <button data-action="delete-set" data-set="${setId}" style="background: none; border: none; cursor: pointer; color: #dc004e;">
                <span style="display: inline-block; width: 18px; height: 18px;">✕</span>
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    setList.innerHTML = html;
    
    // Add event listeners for clicking the entire set item (for easier selection)
    setList.querySelectorAll('.server-set-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Only handle clicks on the main area, not on buttons
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
          const setId = item.getAttribute('data-set-id');
          applyServerSet(setId);
        }
      });
    });
    
    // Add event listeners for buttons
    setList.querySelectorAll('button[data-action="edit-set"]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the parent's click
        
        // Debug logs
        console.log('Edit button clicked', e.target);
        
        // Find the closest button if clicking on a child element
        const buttonElement = e.target.closest('button[data-action="edit-set"]');
        console.log('Button element:', buttonElement);
        
        if (!buttonElement) {
          console.error('Could not find button element');
          return;
        }
        
        const setId = buttonElement.getAttribute('data-set');
        console.log('SetId from attribute:', setId);
        
        if (!setId) {
          console.error('No set ID found on button');
          return;
        }
        
        // Get the set data explicitly from the original sets object
        if (sets && sets[setId]) {
          editServerSet(setId, sets[setId]);
        } else {
          console.error('Set not found in sets data:', setId, sets);
          alert(`Could not edit set "${setId}": Set data not found`);
        }
      });
    });
    
    setList.querySelectorAll('button[data-action="delete-set"]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the parent's click
        
        // Find the closest button if clicking on a child element
        const buttonElement = e.target.closest('button[data-action="delete-set"]');
        if (!buttonElement) {
          console.error('Could not find delete button element');
          return;
        }
        
        const setId = buttonElement.getAttribute('data-set');
        if (!setId) {
          console.error('No set ID found on delete button');
          return;
        }
        
        // Get the set name for confirmation
        const setName = sets[setId]?.name || setId;
        deleteServerSet(setId, setName);
      });
    });
  }).catch(err => {
    console.error('Error determining active set:', err);
    setList.innerHTML = `<p style="color: #dc004e; text-align: center; padding: 20px;">Error loading server sets</p>`;
  });
}

// Apply a server set
function applyServerSet(setId) {
  // Skip confirmation dialog as requested
  
  window.api.applyServerSet(setId).then(success => {
    if (success) {
      // Skip success message as requested
      loadServers(); // Refresh server list to show enabled/disabled state
      loadServerSets(); // Refresh set list to update active state
    } else {
      alert(`Failed to apply server set`);
    }
  }).catch(err => {
    showError(err);
  });
}

// Show add/edit server set dialog
function showAddSetDialog(setToEdit = null) {
  const isEdit = !!setToEdit;
  const setId = isEdit ? setToEdit[0] : '';
  // Make sure setData has a default structure with all required fields
  const setData = isEdit ? setToEdit[1] || {} : { name: '', description: '', prompt: '', servers: [] };
  
  // Ensure all fields have default values
  setData.name = setData.name || '';
  setData.description = setData.description || '';
  setData.prompt = setData.prompt || '';
  setData.servers = Array.isArray(setData.servers) ? setData.servers : [];
  
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
  
  // Get list of servers for selection
  window.api.getServers().then(servers => {
    const serverNames = Object.keys(servers);
    const selectedServers = setData.servers || [];
    
    // Create the form
    const formHtml = `
      <div style="background: white; border-radius: 8px; width: 600px; max-width: 90%; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <h2 style="margin-top: 0; color: #333;">${isEdit ? 'Edit Server Set' : 'Add New Server Set'}</h2>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Set ID:</label>
          <input id="set-id" type="text" value="${setId}" ${isEdit ? 'disabled' : ''} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" placeholder="e.g., personal-assistant, project-x">
          <small style="color: #666; display: block; margin-top: 5px;">Use letters, numbers, underscores, and hyphens only</small>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Name:</label>
          <input id="set-name" type="text" value="${setData.name}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" placeholder="e.g., Personal Assistant, Project X Tools">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
          <input id="set-description" type="text" value="${setData.description || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" placeholder="e.g., Tools for personal productivity">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Servers:</label>
          <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
            ${serverNames.map(serverName => `
              <div style="margin-bottom: 5px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="checkbox" name="server-checkbox" value="${serverName}" ${selectedServers.includes(serverName) ? 'checked' : ''} style="margin-right: 8px;">
                  <span>${serverName}</span>
                </label>
              </div>
            `).join('')}
          </div>
          <small style="color: #666; display: block; margin-top: 5px;">Select the servers that should be part of this set</small>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Prompt Template:</label>
          <textarea id="set-prompt" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; min-height: 100px; font-family: sans-serif;" placeholder="e.g., You are a personal assistant with access to tools. If the user asks about their schedule, use the calendar tool to check their upcoming events.">${setData.prompt || ''}</textarea>
          <small style="color: #666; display: block; margin-top: 5px;">Instructions for Claude on how to use this set of tools</small>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button id="cancel-set-btn" style="padding: 8px 16px; background: #f5f5f5; color: #333; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button id="save-set-btn" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">Save</button>
        </div>
      </div>
    `;
    
    overlay.innerHTML = formHtml;
    document.body.appendChild(overlay);
    
    // Set up event listeners
    document.getElementById('cancel-set-btn').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    document.getElementById('save-set-btn').addEventListener('click', () => {
      // Gather form data
      const newSetId = document.getElementById('set-id').value.trim();
      const name = document.getElementById('set-name').value.trim();
      const description = document.getElementById('set-description').value.trim();
      const prompt = document.getElementById('set-prompt').value.trim();
      
      // Get selected servers
      const selectedServers = Array.from(document.querySelectorAll('input[name="server-checkbox"]:checked'))
        .map(checkbox => checkbox.value);
      
      // Validate
      if (!newSetId) {
        alert('Set ID is required');
        return;
      }
      
      if (!isEdit && !/^[a-zA-Z0-9_-]+$/.test(newSetId)) {
        alert('Set ID must contain only letters, numbers, underscores, and hyphens');
        return;
      }
      
      if (!name) {
        alert('Name is required');
        return;
      }
      
      if (selectedServers.length === 0) {
        alert('At least one server must be selected');
        return;
      }
      
      // Create set config
      const setConfig = {
        name,
        description,
        prompt,
        servers: selectedServers
      };
      
      // Save the set
      saveServerSet(newSetId, setConfig);
      
      // Close the dialog
      document.body.removeChild(overlay);
    });
  }).catch(err => {
    showError(err);
    document.body.removeChild(overlay);
  });
}

// Edit server set
function editServerSet(setId, setData) {
  // Validate that we have the necessary data
  if (!setId) {
    console.error('Cannot edit set: Missing set ID');
    return;
  }
  
  // Make sure setData is valid
  if (!setData) {
    console.error(`Cannot edit set "${setId}": Missing set data`);
    
    // Fetch the set data directly from the API as a fallback
    window.api.getServerSets().then(sets => {
      if (sets && sets[setId]) {
        showAddSetDialog([setId, sets[setId]]);
      } else {
        alert(`Cannot edit set "${setId}": Set not found`);
      }
    }).catch(err => {
      showError(err);
    });
    
    return;
  }
  
  // If we have valid data, proceed with editing
  showAddSetDialog([setId, setData]);
}

// Save server set
function saveServerSet(setId, setData) {
  window.api.saveServerSet(setId, setData).then(success => {
    if (success) {
      loadServerSets();
    } else {
      alert(`Failed to save server set "${setId}"`);
    }
  }).catch(err => {
    showError(err);
  });
}

// Delete server set
function deleteServerSet(setId, setName) {
  if (!confirm(`Are you sure you want to delete the server set "${setName}"?`)) {
    return;
  }
  
  window.api.deleteServerSet(setId).then(success => {
    if (success) {
      loadServerSets();
    } else {
      alert(`Failed to delete server set "${setName}"`);
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