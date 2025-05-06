import React from 'react';
import { useServers } from '../context/ServersContext';
import ServerItem from './ServerItem';

interface ServerListProps {
  onEdit: (name: string) => void;
  onDelete: (name: string) => void;
}

const ServerList: React.FC<ServerListProps> = ({ onEdit, onDelete }) => {
  const { servers, toggle, loading } = useServers();
  const serverEntries = Object.entries(servers);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading servers...</div>;
  }

  if (serverEntries.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No servers found</div>;
  }

  return (
    <div>
      {serverEntries.map(([name, server]) => (
        <ServerItem
          key={name}
          name={name}
          server={server}
          onToggle={toggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ServerList; 