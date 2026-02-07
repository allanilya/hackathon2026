# Spark - AI Slide Generator

Spark is a PowerPoint add-in that uses AI to generate, summarize, and enhance presentation slides through a conversational chat interface.

## Project Structure

```
hackathon2026/
├── AIslideGen/          # PowerPoint add-in (React + Office.js) + Express API server
│   ├── src/             # Add-in frontend (React, Fluent UI)
│   ├── server/          # Backend API server (Express + OpenAI)
│   └── manifest.xml     # Office add-in manifest
└── extension/           # Marketing/landing page (Next.js)
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Microsoft Office](https://www.office.com/) (PowerPoint desktop)
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Getting Started

### 1. PowerPoint Add-in (Frontend)

The add-in runs as a taskpane inside PowerPoint.

```bash
cd AIslideGen
npm install
```

To start the dev server and sideload into PowerPoint:

```bash
npm start
```

This runs the webpack dev server on `https://localhost:3000` and opens PowerPoint with the add-in loaded.

To run only the dev server (without opening PowerPoint):

```bash
npm run dev-server
```

### 2. Backend API Server

The Express server handles AI generation via the OpenAI API.

```bash
cd AIslideGen
```

Create a `.env` file from the template:

```bash
cp .env.template .env
```

Add your OpenAI API key to `.env`:

```
OPENAI_API_KEY=your-key-here
```

Start the server:

```bash
npm run server
```

The API server runs on `http://localhost:3001`.

**API Endpoints:**

| Method | Endpoint          | Description                              |
|--------|-------------------|------------------------------------------|
| POST   | `/api/generate`   | Generate slides from a prompt            |
| POST   | `/api/summarize`  | Summarize a slide or entire presentation |

### 3. Extension Website (Next.js)

A separate landing/marketing page.

```bash
cd extension
npm install
npm run dev
```

Runs on `http://localhost:3000`.

## Running Everything Together

You need **two terminals** for the core add-in experience:

| Terminal | Command                          | Description               |
|----------|----------------------------------|---------------------------|
| 1        | `cd AIslideGen && npm start`     | Add-in frontend + PowerPoint |
| 2        | `cd AIslideGen && npm run server`| Backend API server        |

The extension site is independent and can be started separately if needed.

## Tech Stack

- **Frontend:** React, Fluent UI v9, Office.js (PowerPoint API)
- **Backend:** Express, OpenAI GPT-4o
- **Extension:** Next.js, Tailwind CSS
