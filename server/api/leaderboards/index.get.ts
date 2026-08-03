import { defineHandler } from "nitro";
import { getLeaderboardSummaries } from "~/server/utils/challenge-data.ts";

export default defineHandler((event) => {
  const search = new URL(event.req.url).searchParams.get("search") ?? "";

  return getLeaderboardSummaries(search);
});
