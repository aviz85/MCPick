// Server configuration interface
export interface Server {
  enabled: boolean;
  command: string;
  args: string[];
  env?: {
    [key: string]: string;
  };
}

// Environment variable pair
export interface EnvVar {
  key: string;
  value: string;
} 