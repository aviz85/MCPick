// Type declarations for local component modules
declare module './ServerList' {
  import { FC } from 'react';
  import { Server } from '../types';
  
  interface ServerListProps {
    servers: Record<string, Server>;
    actualServers?: Record<string, Server>;
    onToggle: (serverName: string, enabled: boolean) => Promise<boolean>;
    onSave: (serverName: string, serverConfig: Server) => Promise<boolean>;
    onDelete: (serverName: string) => Promise<boolean>;
  }
  
  const ServerList: FC<ServerListProps>;
  export default ServerList;
}

declare module './ConfigPathSelector' {
  import { FC } from 'react';
  
  interface ConfigPathSelectorProps {
    configPath: string;
    configExists: boolean;
    onBrowse: () => void;
  }
  
  const ConfigPathSelector: FC<ConfigPathSelectorProps>;
  export default ConfigPathSelector;
}

declare module '../types' {
  export interface Server {
    enabled: boolean;
    command: string;
    args: string[];
    env?: {
      [key: string]: string;
    };
  }
  
  export interface EnvVar {
    key: string;
    value: string;
  }
} 