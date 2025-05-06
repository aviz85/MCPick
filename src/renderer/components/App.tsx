import React from 'react';
import Header from './Header';
import Tabs from './Tabs';
import ConfigSelector from './ConfigSelector';
import ServersPage from '../pages/ServersPage';
import SetsPage from '../pages/SetsPage';
import { useConfig } from '../context/ConfigContext';
import { ServersProvider } from '../context/ServersContext';
import { SetsProvider } from '../context/SetsContext';

const App: React.FC = () => {
  const { configExists } = useConfig();

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <Header />
      
      {!configExists ? (
        <ConfigSelector />
      ) : (
        <ServersProvider>
          <SetsProvider>
            <Tabs tabNames={['Servers', 'Sets']}>
              <ServersPage />
              <SetsPage />
            </Tabs>
          </SetsProvider>
        </ServersProvider>
      )}
      
      <div id="modal-root" /> {/* Container for modals */}
    </div>
  );
};

export default App; 