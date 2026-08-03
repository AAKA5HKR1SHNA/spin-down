import leaderboardPlayersData from "~/challenge-data/leaderboardPlayers.json";
import leaderboardTournamentsData from "~/challenge-data/leaderboardTournaments.json";
import leaderboardsData from "~/challenge-data/leaderboards.json";
import playersData from "~/challenge-data/players.json";
import tournamentsData from "~/challenge-data/tournaments.json";

export interface Leaderboard {
  id: number;
  title: string;
  slug: string;
  description: string;
  league: string;
  formats: string[];
  isOfficial: boolean;
  isFeatured: boolean;
  bannerImageUrl: string;
  createdAt: string;
  scoring: string;
}

export interface LeaderboardPlayer {
  leaderboardId: number;
  playerId: number;
  playerName: string;
  currentElo: number;
  previousElo: number;
  ratingChange: number;
  wins: number;
  losses: number;
  eventsPlayed: number;
  lastPlayedAt: string;
  rank: number;
}

export interface Player {
  id: number;
  name: string;
  country: string;
  avatarUrl: string;
}

export interface Tournament {
  id: number;
  title: string;
  city: string;
  format: string;
  league: string;
  eventTime: string;
  eventTimezone: string;
  playerCount: number;
}

interface LeaderboardTournament {
  leaderboardId: number;
  tournamentId: number;
}

export interface LeaderboardSummary extends Leaderboard {
  playerCount: number;
  tournamentCount: number;
}

export interface Ranking extends LeaderboardPlayer {
  avatarUrl: string | null;
  country: string | null;
}

export interface LeaderboardDetail extends Leaderboard {
  rankings: Ranking[];
  tournaments: Tournament[];
}

const leaderboards: Leaderboard[] = leaderboardsData;
const leaderboardPlayers: LeaderboardPlayer[] = leaderboardPlayersData;
const leaderboardTournaments: LeaderboardTournament[] = leaderboardTournamentsData;
const players: Player[] = playersData;
const tournaments: Tournament[] = tournamentsData;

const playersById = new Map(players.map((player) => [player.id, player]));
const tournamentsById = new Map(tournaments.map((tournament) => [tournament.id, tournament]));

export function getLeaderboardSummaries(search = ""): LeaderboardSummary[] {
  const normalizedSearch = search.trim().toLocaleLowerCase();

  return leaderboards
    .filter((leaderboard) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        leaderboard.title,
        leaderboard.description,
        leaderboard.league,
        ...leaderboard.formats,
      ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
    })
    .map((leaderboard) => ({
      ...leaderboard,
      playerCount: leaderboardPlayers.filter((entry) => entry.leaderboardId === leaderboard.id)
        .length,
      tournamentCount: leaderboardTournaments.filter(
        (entry) => entry.leaderboardId === leaderboard.id,
      ).length,
    }));
}

export function getLeaderboardDetail(slug: string): LeaderboardDetail | undefined {
  const leaderboard = leaderboards.find((entry) => entry.slug === slug);

  if (!leaderboard) {
    return undefined;
  }

  const rankings = leaderboardPlayers
    .filter((entry) => entry.leaderboardId === leaderboard.id)
    .map((entry) => {
      const player = playersById.get(entry.playerId);

      return {
        ...entry,
        avatarUrl: player?.avatarUrl ?? null,
        country: player?.country ?? null,
      };
    })
    .sort((left, right) => left.rank - right.rank);

  const relatedTournamentIds = new Set(
    leaderboardTournaments
      .filter((entry) => entry.leaderboardId === leaderboard.id)
      .map((entry) => entry.tournamentId),
  );
  const relatedTournaments = [...relatedTournamentIds]
    .map((id) => tournamentsById.get(id))
    .filter((tournament): tournament is Tournament => tournament !== undefined)
    .sort((left, right) => right.eventTime.localeCompare(left.eventTime));

  return {
    ...leaderboard,
    rankings,
    tournaments: relatedTournaments,
  };
}
