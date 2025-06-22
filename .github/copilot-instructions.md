<!-- Use this file to provide custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Project Instructions for Copilot

This is an Astro static web application with a beautiful chat interface that connects to Azure Foundry agent services.

## Directory Structure

- `/src/components` - React components including the chat interface
- `/src/layouts` - Astro layout components
- `/src/pages` - Astro pages
- `/src/services` - TypeScript services for authentication and API calls
- `/src/styles` - CSS styles including TailwindCSS configuration
- `/public` - Static assets

## Key Files

- `src/components/ChatInterface.tsx` - Main chat component with message handling
- `src/services/AzureService.ts` - Service for Azure authentication and API calls
- `.env` - Environment variables for Azure configuration

## Development Guidelines

1. Use TypeScript for all JavaScript files
2. Follow TailwindCSS patterns for styling
3. Keep React components focused on UI and delegate business logic to services
4. Use async/await for asynchronous operations
5. Document any changes to the Azure service integration
