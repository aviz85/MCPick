export const api = {
  browseConfigFile: () => window.api.browseConfigFile(),
  getAppStatus: () => window.api.getAppStatus(),
  openConfigLocation: () => window.api.openConfigLocation(),
  getServers: () => window.api.getServers(),
  saveServer: (name: string, cfg: any) => window.api.saveServer(name, cfg),
  toggleServer: (name: string, enabled: boolean) => window.api.toggleServer(name, enabled),
  deleteServer: (name: string) => window.api.deleteServer(name),
  getServerSets: () => window.api.getServerSets(),
  saveServerSet: (id: string, cfg: any) => window.api.saveServerSet(id, cfg),
  applyServerSet: (id: string) => window.api.applyServerSet(id),
  deleteServerSet: (id: string) => window.api.deleteServerSet(id),
  // Instructions API
  getInstructions: () => window.api.getInstructions(),
  saveInstruction: (id: string, cfg: any) => window.api.saveInstruction(id, cfg),
  toggleInstruction: (id: string, enabled: boolean) => window.api.toggleInstruction(id, enabled),
  deleteInstruction: (id: string) => window.api.deleteInstruction(id),
  testInstructionsServer: () => window.api.testInstructionsServer(),
};

// Add TypeScript declaration for window.api
declare global {
  interface Window {
    api: {
      browseConfigFile: () => Promise<{ canceled: boolean; configPath?: string; configExists?: boolean }>;
      getAppStatus: () => Promise<{ configPath?: string; configExists: boolean }>;
      openConfigLocation: () => Promise<{ success: boolean; reason?: string }>;
      getServers: () => Promise<Record<string, any>>;
      saveServer: (name: string, cfg: any) => Promise<boolean>;
      toggleServer: (name: string, enabled: boolean) => Promise<boolean>;
      deleteServer: (name: string) => Promise<boolean>;
      getServerSets: () => Promise<Record<string, any>>;
      saveServerSet: (id: string, cfg: any) => Promise<boolean>;
      applyServerSet: (id: string) => Promise<boolean>;
      deleteServerSet: (id: string) => Promise<boolean>;
      // Instructions API
      getInstructions: () => Promise<Record<string, any>>;
      saveInstruction: (id: string, cfg: any) => Promise<boolean>;
      toggleInstruction: (id: string, enabled: boolean) => Promise<boolean>;
      deleteInstruction: (id: string) => Promise<boolean>;
      testInstructionsServer: () => Promise<{ 
        success: boolean; 
        error?: string; 
        output: string;
        serverPath?: string;
        directoryPath?: string;
        runCommand?: string;
      }>;
    };
  }
} 