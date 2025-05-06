import React from 'react';

interface ErrorBoxProps {
  error: Error | null;
}

const ErrorBox: React.FC<ErrorBoxProps> = ({ error }) => {
  return (
    <div style={{
      color: 'red',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#fff',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      marginTop: '20px'
    }}>
      <h2>Application Error</h2>
      <pre style={{ 
        whiteSpace: 'pre-wrap',
        overflow: 'auto',
        maxHeight: '300px',
        backgroundColor: '#f5f5f5',
        padding: '10px',
        borderRadius: '4px'
      }}>
        {error?.message || 'Unknown error'}
      </pre>
      {error?.stack && (
        <pre style={{ 
          whiteSpace: 'pre-wrap',
          overflow: 'auto',
          maxHeight: '500px',
          fontSize: '0.9em',
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {error.stack}
        </pre>
      )}
    </div>
  );
};

export default ErrorBox; 