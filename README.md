# Team Scrambler

The **Team Scrambler** is a tool designed to distribute individuals into teams based on configurable parameters such as team size, number of teams, and
balancing criteria (e.g., gender, entity affiliation, and management committee membership). It supports flexible configurations and provides detailed metrics
for the resulting teams.

## Overview

- React with TypeScript on the frontend
- tailwindcss daisyui for styling
- Vite for the development server
- deno for typescript runtime

## Getting Started

### Install the dependencies

To install the dependencies, run the following command:

```sh
deno install
```

### Run the dev server with vite

The app uses a Vite dev server to run in development mode. To start the dev server, run the following command:

```sh
deno run dev
```

### Build the app

To build the app for production, run the following command:

```sh
deno run build
```

### Running Tests

To run the tests, use the following command:

```sh
deno test -A
```

## Features

## Backlog

### Core logic

- **Flexible Team Distribution**: Distribute individuals into teams based on size or count.
- **Balancing Options**: define your own criteria for balancing (for example age, department, gender, etc...)
- **Diversity Metrics**: Analyze the diversity of teams after distribution.
- **CSV Import**: Load individuals from a CSV file and automatically create criteria based on columns, Supports multiple name formats for parsing.

### UI

- CSV drag & drop or click to upload
- scrambler settings
- preview individuals data in table
  - edit, add, delete rows
- load with example data by default
- big engaging scramble button
- team cards display with team name, members, diversity metrics
- edit teams name, emoji, swap members for small adjustment
- export to csv
- export to png
- light and dark themes

### Look and feel

- theme inspired by scrambled eggs
- modern accessible layout

# React Template with Vite and Deno

This is a GitHub template project to set up a full-stack web app with [React](https://react.dev/) for front-end and [Hono](https://hono.dev) for backend with
TypeScript running on [Deno](https://deno.com). It uses [Vite](https://vite.dev) as the dev server.
