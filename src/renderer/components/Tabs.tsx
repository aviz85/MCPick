import React, { useState, ReactNode } from 'react';

interface TabsProps {
  children: ReactNode[];
  tabNames: string[];
}

const Tabs: React.FC<TabsProps> = ({ children, tabNames }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{
      background: 'white',
      borderRadius: '5px',
      padding: '20px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        borderBottom: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex' }}>
          {tabNames.map((name, index) => (
            <button
              key={index}
              className={`tab-button ${activeTab === index ? 'active' : ''}`}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                color: activeTab === index ? '#1976d2' : '#666',
                fontWeight: activeTab === index ? 'bold' : 'normal'
              }}
              onClick={() => setActiveTab(index)}
            >
              {name}
              {activeTab === index && (
                <span style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  width: '100%',
                  height: '2px',
                  background: '#1976d2'
                }}></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {React.Children.toArray(children)[activeTab]}
    </div>
  );
};

export default Tabs; 