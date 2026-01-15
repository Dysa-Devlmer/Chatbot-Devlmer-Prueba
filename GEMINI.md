# PITHY Chatbot Project Overview

This document provides a comprehensive overview of the PITHY Chatbot project, its architecture, and key operational commands.

## Project Overview

PITHY Chatbot is an intelligent assistant for WhatsApp Business, designed to provide professional and accurate responses. It integrates with multiple AI providers, including the local Ollama and the cloud-based Perplexity, and features a web-based administration panel for managing conversations and system settings.

The project is built with a polyglot architecture:

-   **Frontend & Admin Panel:** A Next.js application provides the user interface for the admin panel and a simple control panel for sending test messages.
-   **Backend Logic:** The core business logic, including WhatsApp integration and database operations, is handled by the Next.js backend (API routes).
-   **AI & Embeddings Service:** A separate Python service, built with FastAPI, manages the continuous learning system (RAG). It uses Ollama to generate text embeddings and ChromaDB to store and retrieve them for semantic search.
-   **Database:** A SQLite database is used for data persistence, with Prisma ORM managing the schema and queries.

## Key Technologies

-   **Frontend:** Next.js, React, Tailwind CSS
-   **Backend:** Node.js, Next.js API Routes, TypeScript
-   **AI Service:** Python, FastAPI, Ollama, ChromaDB
-   **Database:** SQLite, Prisma
-   **Deployment:** The project includes scripts for running the services directly, as well as for setting them up as Windows services. It also seems to use ngrok for exposing the local server to the internet for WhatsApp webhooks.

## Building and Running the Project

### Prerequisites

-   Node.js 18+
-   Python 3.9+
-   Ollama installed
-   ngrok configured

### Installation

1.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

2.  **Install Python dependencies for the embeddings service:**
    ```bash
    pip install -r embeddings-service/requirements.txt
    ```

### Running the Application

The project can be run in several ways, as described in the `README.md`. The recommended way for development is to run each service in a separate terminal:

1.  **Start Ollama:**
    ```bash
    ollama serve
    ```

2.  **Start the Next.js development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:7847`.

3.  **Start the Python embeddings service:**
    ```bash
    uvicorn embeddings-service.main:app --reload --port 8001
    ```

4.  **Start ngrok to expose the Next.js server:**
    ```bash
    .\ngrok.exe http 7847
    ```

### Running Tests

The project does not have a dedicated test suite configured in `package.json`. However, there are numerous test scripts in the root directory, such as `test-ai-service.ts`, `test-ollama-chatbot.mjs`, and `test-whatsapp.js`. These can be run directly with `node` or `tsx`.

For example:
```bash
npx tsx test-ai-service.ts
```

## Development Conventions

-   **Coding Style:** The project uses ESLint for linting, with the `eslint-config-next` configuration. It's a TypeScript-first project.
-   **Database Migrations:** Database schema changes are managed with Prisma Migrate. To create a new migration, run:
    ```bash
    npx prisma migrate dev
    ```
-   **Environment Variables:** Application configuration is managed through environment variables. A `.env.example` file should be copied to `.env.local` and filled with the necessary credentials.
-   **API:** The backend exposes a RESTful API. Key endpoints are documented in the `README.md` and in the code.

## TODOs for GEMINI Assistant

-   **Add a root test script:** To make it easier to run all tests, a `test` script could be added to the `package.json` file.
-   **Integrate linters and formatters:** The `lint` script exists, but there is no formatting script. Adding Prettier and a `format` script would improve code consistency.
