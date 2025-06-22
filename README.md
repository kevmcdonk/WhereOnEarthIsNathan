# Azure Foundry Agent Chat

A modern web application built with Astro that provides a beautiful chat interface to interact with Azure Foundry Agent services.

## 🚀 Features

- **Beautiful Chat Interface**: Responsive and user-friendly chat UI with typing indicators and markdown support
- **Azure Integration**: Connect seamlessly with Azure Foundry Agent services
- **Authentication**: Secure authentication using Azure Active Directory (MSAL)
- **Modern Tech Stack**: Built with Astro, React, and TailwindCSS

## 📋 Prerequisites

- Node.js 20+ and npm
- Azure account with access to Foundry Agent services
- Azure AD application registration for authentication

## � Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/azure-foundry-agent-chat.git
   cd azure-foundry-agent-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Azure credentials:
   ```
   PUBLIC_AZURE_CLIENT_ID="YOUR_AZURE_CLIENT_ID"
   PUBLIC_AZURE_TENANT_ID="YOUR_AZURE_TENANT_ID"
   PUBLIC_REDIRECT_URI="http://localhost:4321"
   PUBLIC_API_ENDPOINT="https://your-foundry-agent-endpoint.com/api"
   PUBLIC_API_SCOPES="https://your-foundry-agent.azure.com/.default"
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:4321`

## 🧞 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |

## 🌐 Deployment

This app is designed to be deployed as an Azure Static Web App. To deploy:

1. Create an Azure Static Web App in the Azure Portal
2. Connect your GitHub repository
3. Configure the build settings:
   - Build command: `npm run build`
   - Output directory: `dist`

## � Tech Stack

- [Astro](https://astro.build/) - Web framework
- [React](https://reactjs.org/) - UI components
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-js) - Authentication
- [Axios](https://axios-http.com/) - HTTP client
- [Marked](https://marked.js.org/) - Markdown rendering
