# Spin Down Starter

This starter uses [Vite](https://vite.dev/) and [Nitro v3](https://nitro.build/) to support the Spin Down leaderboard challenge. It requires Node.js 24.16 or newer.

### A coding challenge from the World Beyblade Organization

## The Challenge

Build the user-facing side of a leaderboard viewing experience as a web application. Six leaderboards are included in [`challenge-data/leaderboards.json`](challenge-data/leaderboards.json), along with their tournaments and players in the other files in that directory.

A user should be able to search for leaderboards and view individual leaderboard stats. That is the core experience. How you structure the product and how far you take it is up to you.

## Core Requirements

- Browse and search the leaderboards
- Show a leaderboard detail view with its description, formats, player rankings, and banner image
- Provide a usable experience on desktop and mobile
- Include clear instructions in your README for running the project locally

## Getting Started

Install the base dependencies, then choose Vue or React for the frontend:

```bash
npm install
npm run setup:frontend -- vue
```

Replace `vue` with `react` to use React. The setup command installs the selected framework, its router, and Tailwind CSS; configures Vite and TypeScript; and creates minimal `/` and `/leaderboards/:slug` routes. Run it once, before editing the frontend.

Start the development server:

```bash
npm run dev
```

The generated project provides `npm run typecheck`, `npm run format`, and `npm run format:check`. `npm run build` runs the typecheck before creating the production build.

## Data API

The starter exposes the challenge data through read-only endpoints:

| Endpoint                             | Description                                                           |
| ------------------------------------ | --------------------------------------------------------------------- |
| `GET /api/leaderboards`              | All leaderboards, including player and tournament counts              |
| `GET /api/leaderboards?search=burst` | Search titles, descriptions, leagues, and formats                     |
| `GET /api/leaderboards/:slug`        | One leaderboard with enriched player rankings and related tournaments |

Use the unique `slug` returned by the collection endpoint for detail requests. Detail rankings include the supplied stats plus each player's avatar and country. Unknown slugs return `404`.

The API reduces setup and data-joining work. The JSON files in [`challenge-data/`](challenge-data/) remain available for direct imports.

## Assumptions You Can Make

- This is a prototype, not a production launch.
- Please spend no more than 3-4 hours. We do not expect a whole leaderboard platform.
- You may use the provided Vue or React setup, or choose another stack.
- You may use AI tools and coding assistants. Be ready to explain how you used them, the decisions you made, and what you would refine.
- Authentication and user accounts are not required.
- A frontend-only implementation that imports the JSON directly is acceptable.
- Make reasonable product decisions, document your assumptions, and optimize for clarity over surface area.

## Minimum Bar

- Leaderboard browsing and search
- A clear leaderboard detail experience
- A usable experience on desktop and mobile
- A repository we can clone and run by following its README

## Stretch Ideas

These are optional. Only do them if the basics are solid. We care more about judgment than any specific extra feature. If you go beyond the basics, focus on making leaderboard or player stats clearer rather than adding unrelated surface area.

## The Data

The synthetic dataset was generated with [`tools/generate-leaderboard-challenge-data.mjs`](tools/generate-leaderboard-challenge-data.mjs) and includes:

- [`leaderboards.json`](challenge-data/leaderboards.json): 6 leaderboard definitions
- [`players.json`](challenge-data/players.json): 100 player profiles
- [`tournaments.json`](challenge-data/tournaments.json): 30 tournament records
- [`leaderboardPlayers.json`](challenge-data/leaderboardPlayers.json): 300 ranked leaderboard entries
- [`leaderboardTournaments.json`](challenge-data/leaderboardTournaments.json): 24 leaderboard-to-tournament relationships

Generated avatars and banners are self-contained SVG data URLs, so the interface does not depend on an external image service. The generator validates references, ranking order, dates, locations, and tournament compatibility before writing data.

## What to Submit

1. Fork this repository to your own GitHub account.
2. Complete the challenge in your fork.
3. Include a README with setup instructions, notable decisions, and deliberate scope cuts.
4. Share the repository link with us.

The [`SUBMISSION.md`](SUBMISSION.md) template is available as a starting point. You have five days from receiving the challenge to submit it.

## How We Evaluate

| Area              | What we are looking at                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| Product thinking  | Does the experience make sense, and were the right things prioritized? |
| Craft             | Does the design and interaction feel intentional?                      |
| Technical quality | Is the code clean, well structured, and easy to follow?                |
| Judgment          | Was the work scoped appropriately for the timebox?                     |
| Workflow          | Can you explain how you built it and why?                              |

## Build and Preview

```bash
npm run build
npm run preview
```
