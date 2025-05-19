import React from 'react';

interface ServerTestModalProps {
  isOpen: boolean;
  isLoading: boolean;
  success?: boolean;
  serverPath?: string;
  directoryPath?: string;
  runCommand?: string;
  error?: string;
  output: string;
  onClose: () => void;
}

const ServerTestModal: React.FC<ServerTestModalProps> = ({
  isOpen,
  isLoading,
  success,
  serverPath,
  directoryPath,
  runCommand,
  error,
  output,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ marginTop: 0 }}>Instructions MCP Server Test</h2>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Testing MCP server...</p>
          </div>
        ) : (
          <>
            <div style={{ 
              padding: '10px', 
              marginBottom: '15px', 
              backgroundColor: success ? '#e8f5e9' : '#ffebee',
              borderRadius: '4px'
            }}>
              <h3 style={{ 
                margin: '0 0 10px 0', 
                color: success ? '#2e7d32' : '#c62828' 
              }}>
                {success ? 'Server Started Successfully' : 'Server Failed to Start'}
              </h3>
              
              {error && <p style={{ color: '#c62828', margin: '5px 0' }}>{error}</p>}
              
              {serverPath && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontWeight: 'bold', margin: '0' }}>Server File:</p>
                  <code style={{ 
                    display: 'block', 
                    padding: '8px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px',
                    overflowX: 'auto'
                  }}>
                    {serverPath}
                  </code>
                  
                  {directoryPath && (
                    <>
                      <p style={{ fontWeight: 'bold', margin: '10px 0 0 0' }}>Directory:</p>
                      <code style={{ 
                        display: 'block', 
                        padding: '8px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '4px',
                        overflowX: 'auto'
                      }}>
                        {directoryPath}
                      </code>
                    </>
                  )}
                  
                  {runCommand && (
                    <>
                      <p style={{ fontWeight: 'bold', margin: '10px 0 0 0' }}>Run Command:</p>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <code style={{ 
                          flexGrow: 1,
                          display: 'block', 
                          padding: '8px', 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: '4px',
                          overflowX: 'auto'
                        }}>
                          {runCommand}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(runCommand)
                              .then(() => alert('Command copied to clipboard!'))
                              .catch(err => console.error('Failed to copy command:', err));
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </>
                  )}
                  
                  <p style={{ fontSize: '0.8em', margin: '10px 0 5px 0' }}>
                    Run the server in a terminal to see it in action.
                  </p>
                </div>
              )}
            </div>

            <div style={{ flex: 1, minHeight: '200px', maxHeight: '400px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>Server Output:</p>
              <pre style={{ 
                margin: 0,
                padding: '10px', 
                backgroundColor: '#f5f5f5', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                height: '100%',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {output || 'No output captured.'}
              </pre>
            </div>
          </>
        )}

        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          justifyContent: 'flex-end' 
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#1976d2',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerTestModal; 