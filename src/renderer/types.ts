// Server configuration interface
export interface Server {
  enabled: boolean;
  command: string;
  args: string[];
  env?: {
    [key: string]: string;
  };
}

// Server set configuration
export interface ServerSet {
  name: string;
  description: string;
  prompt: string;
  servers: string[];
}

// Environment variable pair
export interface EnvVar {
  key: string;
  value: string;
} 