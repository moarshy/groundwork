# Groundwork: AI Workflow Automation

Groundwork is an AI-powered application designed to connect your various applications and execute pre-built AI workflows. It focuses on providing intelligence, seamless connectivity, and operational efficiency through a modern and intuitive interface.

## Getting Started

To get the Groundwork application and its background worker running, you'll need to set up the environment and then start the two main processes.

**Prerequisites:**

*   Node.js and npm (or yarn/pnpm/bun) installed.
*   Docker installed and running (for Redis).

**Environment Setup:**

1.  **Create your local environment file:**
    Copy the example environment file `.env.example` to a new file named `.env.local`:
    ```bash
    cp .env.example .env.local
    ```
    Then, open `.env.local` and fill in your actual secret values and configurations. The `.env.example` file serves as a template for all required variables.
    **Important:** `.env.local` is ignored by Git and should never be committed to the repository.

2.  **Configure Google OAuth for Sign-in (NextAuth.js):**
    This application uses NextAuth.js with Google as an OAuth provider for user authentication.
    *   **Create Google Cloud Project & Credentials:**
        1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
        2.  Create a new project or select an existing one.
        3.  Navigate to "APIs & Services" > "Credentials".
        4.  Click "Create Credentials" > "OAuth client ID".
        5.  If prompted, configure the "OAuth consent screen" first. For "User Type", choose "External" if your app is public, or "Internal" if restricted to your GSuite organization. Fill in the required app information.
        6.  When creating the OAuth client ID, select "Web application" as the application type.
        7.  Under "Authorized JavaScript origins", add your application's base URL (e.g., `http://localhost:3000` for development).
        8.  Under "Authorized redirect URIs", add your application's NextAuth.js callback URL. For development, this is typically `http://localhost:3000/api/auth/callback/google`.
        9.  Click "Create". You will be provided with a **Client ID** and a **Client Secret**.
    *   **Set Environment Variables:**
        Add the obtained `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your `.env.local` file:
        ```
        GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
        GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
        ```
        Ensure these are also listed in your `.env.example` file as placeholders.

3.  **Configure Pipedream for Managed App Connections:**
    Groundwork uses Pipedream to manage OAuth connections and proxy API calls to third-party applications (e.g., Google Sheets, Slack).
    *   **Pipedream Account & Project Setup:**
        1.  Ensure you have a Pipedream account and a Project created where you intend to manage these connections.
        2.  You will need to obtain your Pipedream Project ID.
        3.  For the Pipedream SDK to authenticate and make calls on behalf of your application (Groundwork), you'll typically configure an SDK integration or service app within Pipedream. This process provides you with a Client ID and Client Secret specific to your Pipedream project and Groundwork integration.
        4.  Refer to the Pipedream SDK documentation for specifics on setting up a backend client or service app for your project if you haven't already.
    *   **Set Environment Variables:**
        Add your Pipedream project details and SDK credentials to your `.env.local` file:
        ```
        PIPEDREAM_ENVIRONMENT=development # or production
        PIPEDREAM_PROJECT_ID=YOUR_PIPEDREAM_PROJECT_ID
        PIPEDREAM_CLIENT_ID=YOUR_PIPEDREAM_CLIENT_ID
        PIPEDREAM_CLIENT_SECRET=YOUR_PIPEDREAM_CLIENT_SECRET
        ```
        These variables allow the Groundwork backend (specifically the worker and server actions) to interact with the Pipedream SDK. Ensure these are also listed in your `.env.example` file as placeholders.

4.  **Database Setup (Prisma & SQLite):**
    The application uses Prisma as an ORM with a SQLite database.
    *   **Define Database URL:**
        In your `.env.local` file, set the `DATABASE_URL`. For SQLite, this points to a file path. For example:
        ```
        DATABASE_URL="file:./dev.db"
        ```
        Or, if you prefer to keep the database file within the `prisma` directory:
        ```
        DATABASE_URL="file:../prisma/dev.db"
        ```
        Ensure this variable is also present (with a placeholder or example path) in your `.env.example`.
    *   **Run Migrations:**
        To create the database schema and initialize the database, run the Prisma migrate command:
        ```bash
        npx prisma migrate dev
        ```
        This command will:
        1.  Create the SQLite database file if it doesn't exist at the path specified by `DATABASE_URL`.
        2.  Apply any pending migrations found in the `prisma/migrations` directory.
        3.  If no migrations exist (e.g., for a brand new project), it will prompt you to create an initial migration based on your `prisma/schema.prisma` file.
        4.  Generate/update the Prisma Client based on your schema.

**Infrastructure Setup (One-time):**

1.  **Run Redis using Docker:**
    The background worker uses Redis (via BullMQ) for managing job queues. Start a Redis container if you don't have an instance running:
    ```bash
    docker run -d --name groundwork-redis -p 6379:6379 redis
    ```
    This command will:
    *   Download the latest Redis image if you don't have it.
    *   Start a Redis container in detached mode (`-d`).
    *   Name the container `groundwork-redis` for easier management.
    *   Map port `6379` on your host to port `6379` in the container.
    *   If you stop your machine, you can restart this container with `docker start groundwork-redis`.

**Installation (One-time per environment):**

First, install the project dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 1. Running the Next.js Web Application (Frontend & API)

This is the main user interface and API layer, built with Next.js. It provides:
*   A dashboard for users to manage their workflows, connections to external applications (via Pipedream), and view execution history.
*   An interface to configure and trigger AI agents and automated sequences.
*   Handles user authentication (including Google OAuth) and provides the API endpoints that the frontend interacts with.

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

For production:

```bash
npm run build
npm run start
```

### 2. Running the Background Worker

**Important:** Ensure Redis (from Infrastructure Setup) and the Database (from Environment Setup) are correctly configured and accessible before starting the worker.

The worker is a separate Node.js process responsible for handling time-consuming or asynchronous tasks. This includes:
*   Executing the core logic of AI workflows and agents.
*   Interacting with external APIs based on workflow configurations, often proxied through Pipedream.
*   Managing job queues (e.g., using BullMQ with Redis) to process tasks reliably.

This separation ensures the main web application remains responsive while complex operations are performed in the background.

To run the worker in development mode (with auto-reloading on changes):

```bash
npm run worker:dev
# or
yarn worker:dev
# or
pnpm worker:dev
# or
bun worker:dev 
```

To run the worker for production:

```bash
npm run worker:start
# or
yarn worker:start
# or
pnpm worker:start
# or
bun worker:start
```

Both the Next.js application and the worker need to be running concurrently for full application functionality.

## Extending the Application: Adding New Agents

New agents can be added to Groundwork to perform custom tasks. This involves defining the agent's metadata for the frontend and implementing its execution logic in the background worker.

### 1. Implement Agent Logic in the Worker

Agent logic is executed within the `groundwork/worker.ts` file, typically inside the `executeJsAgent` async function. For more complex agents, it's recommended to encapsulate their logic in separate modules/files within the `groundwork/worker/` directory (e.g., `groundwork/worker/yourNewAgentName/agent.js`), similar to how `deepResearchMarketingAgent` is structured.

*   **Create Agent Module (Recommended for complex agents):**
    1.  Create a new directory for your agent under `groundwork/worker/`, for example: `groundwork/worker/myCustomAgent/`.
    2.  Inside this directory, create your agent logic file (e.g., `agent.js` or `agent.ts`). This file should export a function or class that takes `agentInput` and performs the agent's tasks.
        ```javascript
        // Example: groundwork/worker/myCustomAgent/agent.js
        class MyCustomAgent {
          constructor(apiKey) {
            // this.apiKey = apiKey; // If your agent needs config/keys
          }
          async run(agentInput) {
            console.log("[MyCustomAgent] Running with input:", agentInput);
            // ... your agent's core logic ...
            const output = `Processed: ${agentInput.someData}`;
            return { result: output };
          }
        }
        module.exports = { MyCustomAgent };
        ```

*   **Integrate into `worker.ts`:**
    1.  Open `groundwork/worker.ts`.
    2.  If you created a separate module, import it at the top:
        ```typescript
        // At the top of groundwork/worker.ts
        const { MyCustomAgent } = require('./worker/myCustomAgent/agent.js'); // Adjust path as needed
        ```
    3.  Locate the `executeJsAgent` async function.
    4.  Add a new `else if` block to handle your new agent, using a unique `agentId`. Instantiate and call your agent logic here:
        ```typescript
        // Inside executeJsAgent function in groundwork/worker.ts
        // ... existing agent logic ...
        else if (agentId === "my-custom-agent-id") {
            console.log(`[Worker] Preparing to execute MyCustomAgent.`);
            if (!agentInput) throw new Error('Agent input is missing for my-custom-agent-id');
            const agent = new MyCustomAgent(/* pass any required constructor args */);
            return await agent.run(agentInput);
        }
        // ... (for simpler agents, logic can be directly here) ...
        else if (agentId === "another-simple-agent-id") {
            console.log(`[Worker] Executing simple agent: ${agentId} with input:`, agentInput);
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
            return { message: `Output from ${agentId}`, detail: agentInput.info };
        }
        // ... ensure there's a final else or throw for unhandled agents
        ```

    **Note:** The `agentId` string must exactly match the `id` you will define in `lib/agents.ts`.

### 2. Define Agent Metadata for Frontend

*   Open the agent definitions file: `groundwork/lib/agents.ts`.
*   Add a new object to the `availableAgents` array for your new agent. Use the `Agent` interface as a template:

    ```typescript
    // In groundwork/lib/agents.ts, inside the availableAgents array:
    {
      id: "my-custom-agent-id", // Must match the agentId in worker.ts
      name: "My New Custom Agent",
      iconName: "Bot", // Choose an icon from agentIconMap or add a new one
      description: "A short, catchy description of what this agent does.",
      longDescription: "A more detailed explanation of the agent's capabilities, how it works, and potential use cases.",
      inputsExpected: ["someData (string, required): Description of this input."],
      outputsProvided: ["result (string): The processed output."],
      category: "Custom Tools", 
    },
    ```

*   **Icon:** Choose an `iconName` from the `agentIconMap` at the top of `lib/agents.ts`, or add a new Lucide icon to the map if needed.
*   **Inputs/Outputs:** Clearly define what inputs the agent expects (and their structure in `agentInput`) and what outputs it will provide. This information is displayed to the user in the UI.

### 3. Restart Services

After adding the backend logic and frontend definition:

*   Restart the Next.js development server (e.g., `npm run dev`).
*   Restart the worker process (e.g., `npm run worker:dev`).

Your new agent should now be available for selection in the Groundwork UI and executable by the worker.