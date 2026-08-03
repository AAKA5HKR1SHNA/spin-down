import { defineHandler, HTTPError } from "nitro";
import { getLeaderboardDetail } from "~/server/utils/challenge-data.ts";

export default defineHandler((event) => {
  const slug = event.context.params?.slug;

  if (!slug) {
    throw new HTTPError({
      status: 400,
      message: "A leaderboard slug is required",
    });
  }

  const leaderboard = getLeaderboardDetail(slug);

  if (!leaderboard) {
    throw new HTTPError({
      status: 404,
      message: `Leaderboard "${slug}" was not found`,
    });
  }

  return leaderboard;
});
