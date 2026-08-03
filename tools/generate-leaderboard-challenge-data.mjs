#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DEFAULTS = {
  leaderboards: 6,
  players: 100,
  tournaments: 30,
  output: "challenge-data",
  seed: 20260703,
};

const FORMATS = ["Beyblade X", "Burst Standard", "Metal Fight", "Plastic Generation", "HMS"];

const LEAGUES = ["Open", "Ranked", "Masters"];
const LOCATIONS = [
  { city: "Toronto", timezone: "America/Toronto" },
  { city: "Chicago", timezone: "America/Chicago" },
  { city: "Los Angeles", timezone: "America/Los_Angeles" },
  { city: "London", timezone: "Europe/London" },
  { city: "Tokyo", timezone: "Asia/Tokyo" },
  { city: "Berlin", timezone: "Europe/Berlin" },
  { city: "Melbourne", timezone: "Australia/Melbourne" },
  { city: "Seattle", timezone: "America/Los_Angeles" },
  { city: "Austin", timezone: "America/Chicago" },
  { city: "Vancouver", timezone: "America/Vancouver" },
];
const IMAGE_COLORS = ["#172033", "#155bb5", "#c82e47", "#18734c", "#7048a8"];
const REFERENCE_DATE = new Date("2026-07-03T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const QUARTER_HOUR_MS = 15 * 60 * 1000;
const FIRST_NAMES = [
  "Alex",
  "Blake",
  "Casey",
  "Devon",
  "Elliot",
  "Finley",
  "Gray",
  "Harper",
  "Indigo",
  "Jordan",
  "Kai",
  "Logan",
  "Morgan",
  "Noel",
  "Parker",
  "Quinn",
  "Riley",
  "Sage",
  "Taylor",
  "Vale",
];
const HANDLES = [
  "Storm",
  "Valkyrie",
  "Dran",
  "Pegasus",
  "Wyvern",
  "Phoenix",
  "Cerberus",
  "Leone",
  "Fafnir",
  "Spriggan",
  "Ragnaruk",
  "Bahamut",
  "Knight",
  "Shark",
  "Cobra",
  "Scythe",
  "Wizard",
  "Viper",
  "Aero",
  "Quake",
];

function parseArgs() {
  const args = { ...DEFAULTS };

  for (const arg of process.argv.slice(2)) {
    const [name, value] = arg.replace(/^--/, "").split("=");

    if (name === "help") {
      printHelp();
      process.exit(0);
    }

    if (!(name in args) || value === undefined) {
      throw new Error(`Unknown or invalid option: ${arg}`);
    }

    if (name === "output") {
      args.output = value;
    } else {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Option --${name} must be a positive integer.`);
      }
      args[name] = parsed;
    }
  }

  return args;
}

function printHelp() {
  console.log(`Generate fake leaderboard challenge JSON data.

Usage:
  node tools/generate-leaderboard-challenge-data.mjs [options]

Options:
  --leaderboards=6     Number of leaderboards
  --players=100        Number of players
  --tournaments=30     Number of tournaments
  --output=challenge-data
  --seed=20260703      Deterministic random seed
  --help`);
}

function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}

function integer(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function isoDaysAgo(random, minDays, maxDays) {
  const date = new Date(REFERENCE_DATE);
  date.setUTCDate(date.getUTCDate() - integer(random, minDays, maxDays));
  date.setUTCHours(integer(random, 10, 20), [0, 15, 30, 45][integer(random, 0, 3)], 0, 0);
  return date.toISOString();
}

function isoBetween(random, minimum, maximum) {
  const firstSlot = Math.ceil(minimum.getTime() / QUARTER_HOUR_MS);
  const lastSlot = Math.floor(maximum.getTime() / QUARTER_HOUR_MS);

  assert(firstSlot <= lastSlot, "Date range must contain at least one 15-minute interval");

  return new Date(integer(random, firstSlot, lastSlot) * QUARTER_HOUR_MS).toISOString();
}

function svgDataUrl(label, width, height, background) {
  const fontSize = height >= 300 ? 56 : 40;
  const escapedLabel = label
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${background}"/><text x="50%" y="50%" fill="#ffffff" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${escapedLabel}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makePlayers(random, count) {
  const usedNames = new Set();

  return Array.from({ length: count }, (_, index) => {
    let name = `${pick(random, FIRST_NAMES)} ${pick(random, HANDLES)}`;
    while (usedNames.has(name)) {
      name = `${pick(random, FIRST_NAMES)} ${pick(random, HANDLES)} ${integer(random, 2, 99)}`;
    }
    usedNames.add(name);

    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    return {
      id: index + 1,
      name,
      country: pick(random, ["US", "CA", "GB", "JP", "DE", "AU", "FR", "BR"]),
      avatarUrl: svgDataUrl(initials, 128, 128, IMAGE_COLORS[index % IMAGE_COLORS.length]),
    };
  });
}

function makeLeaderboards(random, count) {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const formatCount = integer(random, 1, 2);
    const formats = [...FORMATS].sort(() => random() - 0.5).slice(0, formatCount);
    const title = `${pick(random, ["World", "Regional", "City", "Summer", "Winter", "Circuit"])} ${pick(random, formats)} Rankings`;

    return {
      id,
      title,
      slug: `${slugify(title)}-${id}`,
      description: `Elo rankings for ${formats.join(" and ")} events across recent community tournaments.`,
      league: pick(random, LEAGUES),
      formats,
      isOfficial: random() > 0.35,
      isFeatured: random() > 0.5,
      bannerImageUrl: svgDataUrl(title, 1200, 400, IMAGE_COLORS[index % IMAGE_COLORS.length]),
      createdAt: isoDaysAgo(random, 120, 720),
      scoring: "elo",
    };
  });
}

function makeTournaments(random, count, leaderboards) {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const location = pick(random, LOCATIONS);
    const sourceLeaderboard = leaderboards[index];
    const format = sourceLeaderboard
      ? pick(random, sourceLeaderboard.formats)
      : pick(random, FORMATS);
    const league = sourceLeaderboard?.league ?? pick(random, LEAGUES);
    const eventTime = sourceLeaderboard
      ? isoBetween(
          random,
          new Date(
            Math.max(
              Date.parse(sourceLeaderboard.createdAt) + QUARTER_HOUR_MS,
              REFERENCE_DATE.getTime() - 365 * DAY_MS,
            ),
          ),
          new Date(REFERENCE_DATE.getTime() - DAY_MS),
        )
      : isoDaysAgo(random, 1, 365);
    const title = `${location.city} ${pick(random, ["Brawl", "Open", "Clash", "Cup", "Showdown", "Circuit"])} ${id}`;

    return {
      id,
      title,
      city: location.city,
      format,
      league,
      eventTime,
      eventTimezone: location.timezone,
      playerCount: integer(random, 12, 64),
    };
  });
}

function makeLeaderboardPlayers(random, leaderboards, players) {
  return leaderboards.flatMap((leaderboard) => {
    const sampleSize = Math.min(players.length, integer(random, 35, 70));
    const selected = [...players].sort(() => random() - 0.5).slice(0, sampleSize);
    const ranked = selected
      .map((player) => {
        const previousElo = integer(random, 900, 1900);
        const currentElo = previousElo + integer(random, -80, 140);
        const eventsPlayed = integer(random, 1, 12);
        const gamesPlayed = eventsPlayed + integer(random, 0, eventsPlayed * 4);
        const wins = integer(random, 0, gamesPlayed);
        const lastPlayedAt = isoBetween(
          random,
          new Date(
            Math.max(
              Date.parse(leaderboard.createdAt) + QUARTER_HOUR_MS,
              REFERENCE_DATE.getTime() - 180 * DAY_MS,
            ),
          ),
          new Date(REFERENCE_DATE.getTime() - QUARTER_HOUR_MS),
        );

        return {
          leaderboardId: leaderboard.id,
          playerId: player.id,
          playerName: player.name,
          currentElo,
          previousElo,
          ratingChange: currentElo - previousElo,
          wins,
          losses: gamesPlayed - wins,
          eventsPlayed,
          lastPlayedAt,
        };
      })
      .sort((a, b) => b.currentElo - a.currentElo || a.playerId - b.playerId);

    return ranked.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  });
}

function makeLeaderboardTournaments(random, leaderboards, tournaments) {
  return leaderboards.flatMap((leaderboard) => {
    const eligible = tournaments.filter(
      (tournament) =>
        tournament.league === leaderboard.league &&
        leaderboard.formats.includes(tournament.format) &&
        Date.parse(tournament.eventTime) > Date.parse(leaderboard.createdAt),
    );
    const sampleSize = Math.min(eligible.length, integer(random, 5, 12));

    return [...eligible]
      .sort(() => random() - 0.5)
      .slice(0, sampleSize)
      .map((tournament) => ({
        leaderboardId: leaderboard.id,
        tournamentId: tournament.id,
      }));
  });
}

function validateData({
  players,
  leaderboards,
  tournaments,
  leaderboardPlayers,
  leaderboardTournaments,
}) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const leaderboardById = new Map(leaderboards.map((leaderboard) => [leaderboard.id, leaderboard]));
  const tournamentById = new Map(tournaments.map((tournament) => [tournament.id, tournament]));
  const timezoneByCity = new Map(LOCATIONS.map((location) => [location.city, location.timezone]));

  assert.equal(playerById.size, players.length, "Player IDs must be unique");
  assert.equal(leaderboardById.size, leaderboards.length, "Leaderboard IDs must be unique");
  assert.equal(tournamentById.size, tournaments.length, "Tournament IDs must be unique");
  assert.equal(
    new Set(leaderboards.map((leaderboard) => leaderboard.slug)).size,
    leaderboards.length,
    "Leaderboard slugs must be unique",
  );

  for (const player of players) {
    assert(player.avatarUrl.startsWith("data:image/svg+xml"), "Avatars must be self-contained");
  }

  for (const leaderboard of leaderboards) {
    assert(!("createdBy" in leaderboard), "Leaderboards must not contain an unresolved creator");
    assert(LEAGUES.includes(leaderboard.league), "Leaderboard league must be supported");
    assert(leaderboard.formats.length > 0, "Leaderboards must include a format");
    assert(
      leaderboard.formats.every((format) => FORMATS.includes(format)),
      "Leaderboard formats must be supported",
    );
    assert.equal(
      new Set(leaderboard.formats).size,
      leaderboard.formats.length,
      "Leaderboard formats must be unique",
    );
    assert(
      leaderboard.bannerImageUrl.startsWith("data:image/svg+xml"),
      "Banners must be self-contained",
    );
    assert(Number.isFinite(Date.parse(leaderboard.createdAt)), "Creation dates must be valid");
  }

  for (const tournament of tournaments) {
    assert(!("url" in tournament), "Tournaments must not contain synthetic external URLs");
    assert.equal(
      tournament.eventTimezone,
      timezoneByCity.get(tournament.city),
      `Timezone must match ${tournament.city}`,
    );
    assert.doesNotThrow(
      () => new Intl.DateTimeFormat("en", { timeZone: tournament.eventTimezone }),
      `Timezone must be valid for ${tournament.city}`,
    );
    assert(FORMATS.includes(tournament.format), "Tournament format must be supported");
    assert(LEAGUES.includes(tournament.league), "Tournament league must be supported");
    assert(Number.isFinite(Date.parse(tournament.eventTime)), "Event dates must be valid");
    assert(
      Date.parse(tournament.eventTime) < REFERENCE_DATE.getTime(),
      "Events must occur before the reference date",
    );
  }

  assert.equal(
    new Set(leaderboardPlayers.map((entry) => `${entry.leaderboardId}:${entry.playerId}`)).size,
    leaderboardPlayers.length,
    "Leaderboard player relationships must be unique",
  );

  for (const entry of leaderboardPlayers) {
    const leaderboard = leaderboardById.get(entry.leaderboardId);
    const player = playerById.get(entry.playerId);

    assert(leaderboard, "Leaderboard player entries must reference a leaderboard");
    assert(player, "Leaderboard player entries must reference a player");
    assert.equal(entry.playerName, player.name, "Leaderboard player names must match players");
    assert.equal(
      entry.ratingChange,
      entry.currentElo - entry.previousElo,
      "Rating changes must match Elo values",
    );
    assert(entry.currentElo > 0 && entry.previousElo > 0, "Elo values must be positive");
    assert(
      entry.wins + entry.losses >= entry.eventsPlayed,
      "Players must have at least one game per event",
    );
    assert(
      Date.parse(entry.lastPlayedAt) > Date.parse(leaderboard.createdAt),
      "Player activity must occur after leaderboard creation",
    );
    assert(
      Date.parse(entry.lastPlayedAt) <= REFERENCE_DATE.getTime(),
      "Player activity must not exceed the reference date",
    );
  }

  assert.equal(
    new Set(leaderboardTournaments.map((entry) => `${entry.leaderboardId}:${entry.tournamentId}`))
      .size,
    leaderboardTournaments.length,
    "Leaderboard tournament relationships must be unique",
  );

  for (const entry of leaderboardTournaments) {
    const leaderboard = leaderboardById.get(entry.leaderboardId);
    const tournament = tournamentById.get(entry.tournamentId);

    assert(leaderboard, "Tournament relationships must reference a leaderboard");
    assert(tournament, "Tournament relationships must reference a tournament");
    assert.equal(tournament.league, leaderboard.league, "Related leagues must match");
    assert(
      leaderboard.formats.includes(tournament.format),
      "Related tournament formats must match",
    );
    assert(
      Date.parse(tournament.eventTime) > Date.parse(leaderboard.createdAt),
      "Related tournaments must occur after leaderboard creation",
    );
  }

  for (const leaderboard of leaderboards) {
    const rankings = leaderboardPlayers.filter((entry) => entry.leaderboardId === leaderboard.id);
    const relatedTournaments = leaderboardTournaments.filter(
      (entry) => entry.leaderboardId === leaderboard.id,
    );
    const sortedRankings = [...rankings].sort(
      (left, right) => right.currentElo - left.currentElo || left.playerId - right.playerId,
    );

    assert(rankings.length > 0, "Every leaderboard must include rankings");
    assert(relatedTournaments.length > 0, "Every leaderboard must include a tournament");

    rankings.forEach((entry, index) => {
      assert.equal(entry.rank, index + 1, "Leaderboard ranks must be contiguous");
      assert.equal(
        entry.playerId,
        sortedRankings[index].playerId,
        "Leaderboard ranks must use deterministic Elo order",
      );
    });
  }
}

async function writeJson(outputDir, fileName, data) {
  await writeFile(join(outputDir, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  const args = parseArgs();

  if (args.tournaments < args.leaderboards) {
    throw new Error("Option --tournaments must be at least --leaderboards.");
  }

  const random = createRandom(args.seed);
  const outputDir = join(process.cwd(), args.output);

  const players = makePlayers(random, args.players);
  const leaderboards = makeLeaderboards(random, args.leaderboards);
  const tournaments = makeTournaments(random, args.tournaments, leaderboards);
  const leaderboardPlayers = makeLeaderboardPlayers(random, leaderboards, players);
  const leaderboardTournaments = makeLeaderboardTournaments(random, leaderboards, tournaments);

  validateData({
    players,
    leaderboards,
    tournaments,
    leaderboardPlayers,
    leaderboardTournaments,
  });

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeJson(outputDir, "leaderboards.json", leaderboards),
    writeJson(outputDir, "players.json", players),
    writeJson(outputDir, "tournaments.json", tournaments),
    writeJson(outputDir, "leaderboardPlayers.json", leaderboardPlayers),
    writeJson(outputDir, "leaderboardTournaments.json", leaderboardTournaments),
  ]);

  console.log(`Generated challenge data in ${args.output}`);
  console.log(`- ${leaderboards.length} leaderboards`);
  console.log(`- ${players.length} players`);
  console.log(`- ${tournaments.length} tournaments`);
  console.log(`- ${leaderboardPlayers.length} leaderboard player rows`);
  console.log(`- ${leaderboardTournaments.length} leaderboard tournament rows`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
