// Server configuration interface
export interface Server {
  enabled: boolean;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

// Servers record type
export type ServersRecord = Record<string, Server>;

// Server set configuration
export interface ServerSet {
  name: string;
  description: string;
  prompt: string;
  servers: string[];
}

// Server sets record type
export type ServerSetsRecord = Record<string, ServerSet>;

// App status from main process
export interface AppStatus {
  configPath?: string;
  configExists: boolean;
}

// Environment variable pair
export interface EnvVar {
  key: string;
  value: string;
} 