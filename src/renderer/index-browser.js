// Simple script for the browser
try {
  // Import React components
  const React = require('react');
  const ReactDOM = require('react-dom/client');
  const { createTheme, ThemeProvider } = require('@mui/material/styles');
  const CssBaseline = require('@mui/material/CssBaseline').default;
  
  // Use the compiled JS files from dist
  const App = require('../../dist/renderer/components/App').default;

  // Create a theme
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  // Create root element if it doesn't exist
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
  }

  // Create React root and render app
  document.addEventListener('DOMContentLoaded', () => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(
          ThemeProvider,
          { theme },
          React.createElement(CssBaseline),
          React.createElement(App)
        )
      )
    );
  });
} catch (error) {
  console.error('Error in renderer:', error);
  // Show error in the UI
  document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('root') || document.body;
    rootElement.innerHTML = `<div style="color: red; padding: 20px;">
      <h2>Error Loading Application</h2>
      <pre>${error.message}\n${error.stack}</pre>
    </div>`;
  });
} 