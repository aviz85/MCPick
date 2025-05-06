import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={{
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '15px 0'
    }}>
      <h1 style={{
        margin: 0,
        color: '#1976d2',
        fontSize: '28px'
      }}>
        MCPick
      </h1>
      <p style={{
        margin: 0,
        color: '#666'
      }}>
        MCP Server Manager for Claude Desktop
      </p>
    </header>
  );
};

export default Header; 