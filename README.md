# React Template with Vite and Deno

This is a GitHub template project to set up a full-stack web app with [React](https://react.dev/) for front-end and [Hono](https://hono.dev) for backend with TypeScript running on [Deno](https://deno.com). It uses [Vite](https://vite.dev) as the dev server.

## Features

- React with TypeScript on the frontend
- Vite for the development server
- Deno for server-side JavaScript/TypeScript
- Hono framework for building web applications
- Shared code directory for common utilities between client and server

## Getting Started

## Install the dependencies

To install the dependencies for the frontend and backend, run the following
command:

```sh
deno install
```

## Run the dev server with vite

The app uses a Vite dev server to run in development mode. To start the dev
server, run the following command:

```sh
deno run dev
```

## Build the app

To build the app for production, run the following command:

```sh
deno run build
```

## Run the backend server

The backend server uses Deno and the Hono framework to serve the built React app.
To start the backend server, run the following command:

```sh
deno run serve
```

## Running Tests

To run the tests, use the following command:

```sh
deno test -A
```

## Project Structure

```sh
. 
├── client 
│   ├── dist 
│   ├── public 
│   └── src 
│       ├── App.css 
│       ├── App.tsx 
│       ├── index.css 
│       ├── main.tsx 
│       └── vite-env.d.ts 
├── server 
│   └── main.ts 
└── shared
```

- `client/`: The React frontend application
  - `src/App.tsx`: The main React component
  - `src/main.tsx`: The entry point for the React app
  - `dist/`: The output directory for the built React app
  - `public/`: The public directory for static assets
- `server/`: The Deno backend server
  - `main.ts`: The entry point for the Deno server
- `shared/`: Common code and utilities used by both client and server

## Points of note

The React app is contained in the `client` directory. This is also where Vite
will install its dependencies and build the app.

There is a `vite.config.ts` file in the root of the project that configures Vite
to build the app in the `client/dist` directory and serve the app on port 3000.

The `deno.json` file contains the tasks to run the dev server, build the app,
and serve the app, along with the dependencies and the compiler configuration
required to use JSX and React.

The Deno server is contained in the `server` directory. The server serves the
built React app from the `client/dist` directory and listens on port 8000. This
is what should be used in production.

The `shared` directory contains code that can be used by both the client and server,
such as type definitions, validation schemas, or utility functions.