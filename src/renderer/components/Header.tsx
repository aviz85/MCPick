import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { api } from '../api/ipc';

const Header: React.FC = () => {
  const { openConfigLocation, configPath } = useConfig();
  const [claudeInstalled, setClaudeInstalled] = useState<boolean>(false);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);

  // Check if Claude is installed
  useEffect(() => {
    const checkClaudeInstallation = async () => {
      try {
        const { installed } = await api.checkClaudeInstalled();
        setClaudeInstalled(installed);
      } catch (error) {
        console.error('Error checking Claude installation:', error);
        setClaudeInstalled(false);
      }
    };
    
    checkClaudeInstallation();
  }, []);

  // Function to start/restart Claude
  const startClaude = async () => {
    if (isRestarting) return;
    
    try {
      setIsRestarting(true);
      await api.restartClaude();
    } catch (error) {
      console.error('Error restarting Claude:', error);
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <header style={{
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '15px 0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{
          margin: 0,
          color: '#1976d2',
          fontSize: '28px'
        }}>
          MCPick
        </h1>
      </div>
      
      <p style={{
        margin: 0,
        color: '#666'
      }}>
        MCP Server Manager for Claude Desktop
      </p>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* Config location button */}
        <button
          onClick={() => openConfigLocation()}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '36px',
            height: '36px',
            padding: '0',
            background: '#f5f5f5',
            color: '#ff9800',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: configPath ? 1 : 0.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
          }}
          disabled={!configPath}
          title={configPath ? "Open config file location" : "No config file selected"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        </button>
        
        {/* Claude restart button - only show if Claude is installed */}
        {claudeInstalled && (
          <button
            onClick={startClaude}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '36px',
              height: '36px',
              padding: '0',
              background: '#f5f5f5',
              border: 'none',
              borderRadius: '4px',
              cursor: isRestarting ? 'wait' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              opacity: isRestarting ? 0.7 : 1
            }}
            disabled={isRestarting}
            title={isRestarting ? "Restarting Claude..." : "Restart Claude"}
          >
            <img 
              src="images/claude-ai-icon.png" 
              alt="Claude" 
              style={{ 
                width: '24px', 
                height: '24px',
                opacity: isRestarting ? 0.5 : 1
              }}
            />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header; 