import { PublicClientApplication } from '@azure/msal-browser';
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential, InteractiveBrowserCredential  } from '@azure/identity';

interface AzureServiceConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  apiEndpoint: string;
  scopes: string[];
  orchestratorAgentId: string;
}

class AzureService {
  private msalInstance: PublicClientApplication;
  private config: AzureServiceConfig;
  private project!: AIProjectClient; // Using definite assignment assertion
  private agent: any;
  private thread: any;
  private run: any;
  private initialized: boolean = false;
  constructor(config: AzureServiceConfig) {
    this.config = config;
    
    // Configure MSAL
    this.msalInstance = new PublicClientApplication({
      auth: {
        clientId: config.clientId,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
        redirectUri: config.redirectUri,
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
      }
    });    // Create credential that will handle token acquisition
    const credential = new InteractiveBrowserCredential({
      clientId: config.clientId,
      tenantId: config.tenantId,
      redirectUri: config.redirectUri,
      // Using popup login style for better user experience
      loginStyle: 'popup',
      // Add caching to reduce authentication prompts
      //tokenCachePersistenceOptions: {
      //  enabled: true
      //}
    });
    
    // Initialize AIProjectClient with the credential
    try {
      this.project = new AIProjectClient(
        this.config.apiEndpoint,
        credential
      );
    } catch (error) {
      console.error("Failed to initialize AIProjectClient:", error);
      // We'll try again after login
    }
  }
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    try {
      // Initialize MSAL
      await this.msalInstance.initialize();
      
      // Handle redirect promise to capture any response from redirect flow
      await this.msalInstance.handleRedirectPromise();
      
      this.initialized = true;
      console.log("MSAL initialized successfully");
      
      // Re-initialize the AIProjectClient if it hasn't been yet
      if (!this.project) {
        const credential = new InteractiveBrowserCredential({
          clientId: this.config.clientId,
          tenantId: this.config.tenantId,
          redirectUri: this.config.redirectUri,
          loginStyle: 'popup',
          tokenCachePersistenceOptions: {
            enabled: true
          }
        });
        
        this.project = new AIProjectClient(
          this.config.apiEndpoint,
          credential
        );
      }
      
      // Check if user is already logged in
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        // User is already logged in, try to get the agent
        try {
          this.agent = await this.project.agents.getAgent(this.config.orchestratorAgentId);
          console.log(`Retrieved agent: ${this.agent.name}`);
        } catch (error) {
          console.warn("Could not retrieve agent:", error);
          // We'll try again during actual API calls
        }
      }
    } catch (error) {
      console.error("Failed to initialize MSAL:", error);
      throw error;
    }
  }async login() {
    try {
      // Make sure MSAL is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Try to authenticate with the fixed scope format
      let response;
      try {
        response = await this.msalInstance.loginPopup({
          scopes: this.config.scopes,
          prompt: 'select_account',
        });
      } catch (loginError) {
        console.error('Initial login attempt failed:', loginError);
        console.log('Trying with alternative scope format...');
          // Try with an alternative scope format if specified scope fails
        const alternativeScopes = ['https://ai.azure.com/.default'];
        response = await this.msalInstance.loginPopup({
          scopes: alternativeScopes,
          prompt: 'select_account',
        });
      }
      
      console.log('Authentication successful');
      
      // Try to get the agent after successful login
      try {
        this.agent = await this.project.agents.getAgent(this.config.orchestratorAgentId);
        console.log(`Retrieved agent: ${this.agent.name}`);
      } catch (agentError) {
        console.error('Error retrieving agent:', agentError);
        // Continue despite agent error - authentication might still work
      }
      
      return response;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }
  async logout() {
    try {
      // Make sure MSAL is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      await this.msalInstance.logoutPopup();
      this.thread = null;
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }  async getAccessToken() {
    try {
      // Make sure MSAL is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      const account = this.msalInstance.getAllAccounts()[0];
      if (!account) {
        throw new Error('No active account! Sign in first.');
      }

      // Try with the configured scopes first
      try {
        const silentRequest = {
          account,
          scopes: this.config.scopes,
        };

        const response = await this.msalInstance.acquireTokenSilent(silentRequest);
        return response.accessToken;
      } catch (silentError) {
        // If silent token acquisition fails, try with the default Azure AI scope
        console.log('Silent token acquisition failed with configured scopes, trying with default AI scope', silentError);
        
        const fallbackRequest = {
          account,
          scopes: ['https://ai.azure.com/.default'],
        };
        
        // Try with fallback scope
        try {
          const fallbackResponse = await this.msalInstance.acquireTokenSilent(fallbackRequest);
          return fallbackResponse.accessToken;
        } catch (fallbackError) {
          // If that fails too, try interactive as a last resort
          console.log('Silent token acquisition failed with fallback scope, trying interactive', fallbackError);
          const interactiveResponse = await this.msalInstance.acquireTokenPopup(fallbackRequest);
          return interactiveResponse.accessToken;
        }
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }
  async startNewThread() {
    try {
      // Make sure MSAL is initialized and user is logged in
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if we have an agent
      if (!this.agent) {
        try {
          this.agent = await this.project.agents.getAgent(this.config.orchestratorAgentId);
          console.log(`Retrieved agent: ${this.agent.name}`);
        } catch (error) {
          console.error('Error retrieving agent:', error);
          throw new Error('Could not retrieve agent to start new thread');
        }
      }
        this.thread = await this.project.agents.threads.create();
      console.log(`Created new thread with ID: ${this.thread.id}`);
    } catch(error) {
      console.error('Error starting new thread:', error);
      throw error;
    }
  }
  async callFoundryAgent(messageText: string) {
    try {
      // Make sure MSAL is initialized and user is logged in
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if we have a thread, if not create one
      if (!this.thread) {
        await this.startNewThread();
      }
      
      // Check if we have an agent
      if (!this.agent) {
        throw new Error('No agent available. Please log in first.');
      }
      
      const message = await this.project.agents.messages.create(this.thread.id, "user", messageText);
      console.log(`Created message, message ID: ${message.id}`);

      // Create run
      let run = await this.project.agents.runs.create(this.thread.id, this.agent.id);

      // Poll until the run reaches a terminal status
      while (run.status === "queued" || run.status === "in_progress") {
        // Wait for a second
        await new Promise((resolve) => setTimeout(resolve, 1000));
        run = await this.project.agents.runs.get(this.thread.id, run.id);
      }

      if (run.status === "failed") {
        console.error(`Run failed: `, run.lastError);
        throw new Error('The run failed: ' + (run.lastError?.message || 'Unknown error'));
      }

      console.log(`Run completed with status: ${run.status}`);

      // Retrieve messages
      const messages = await this.project.agents.messages.list(this.thread.id, { order: "asc" });

      // Get the last assistant message
      let lastAssistantMessage = null;
      for await (const m of messages) {
        if (m.role === 'assistant') {
          const content = m.content.find((c) => c.type === "text" && "text" in c);
          if (content) {
            lastAssistantMessage = content.text.value;
          }
        }
      }
      
      return {
        message: lastAssistantMessage || 'No response received from the agent.'
      };
    } catch (error) {
      console.error('Error calling Foundry Agent:', error);
      throw error;
    }
  }
  async isAuthenticated() {
    // Make sure MSAL is initialized
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        console.error("Failed to initialize while checking authentication:", error);
        return false;
      }
    }
    
    return this.msalInstance.getAllAccounts().length > 0;
  }
}

// Default config - override these values in your application
const defaultConfig: AzureServiceConfig = {
  clientId: import.meta.env.PUBLIC_AZURE_CLIENT_ID || '',
  tenantId: import.meta.env.PUBLIC_AZURE_TENANT_ID || '',
  redirectUri: import.meta.env.PUBLIC_REDIRECT_URI || window.location.origin,
  apiEndpoint: import.meta.env.PUBLIC_API_ENDPOINT || '',
  scopes: (import.meta.env.PUBLIC_API_SCOPES || '').split(','),
  orchestratorAgentId: import.meta.env.PUBLIC_ORCHESTRATOR_AGENT_ID || '',
};

// Create a singleton instance
const azureServiceInstance = new AzureService(defaultConfig);

// Initialize immediately
(async () => {
  try {
    await azureServiceInstance.initialize();
  } catch (error) {
    console.error("Failed to initialize Azure service:", error);
  }
})();

// Export the initialized singleton instance
export default azureServiceInstance;
