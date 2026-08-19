export function setupApp(element: HTMLElement) {
  element.className = "shell";

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Spin Down starter";

  const heading = document.createElement("h1");
  heading.textContent = "Choose your frontend and start building.";

  const introduction = document.createElement("p");
  introduction.className = "introduction";
  introduction.textContent =
    "The Nitro API is ready. Set up Vue or React with routing and Tailwind CSS before editing the frontend.";

  const commands = document.createElement("div");
  commands.className = "commands";

  for (const command of ["npm run setup:frontend -- vue", "npm run setup:frontend -- react"]) {
    const code = document.createElement("code");
    code.textContent = command;
    commands.appendChild(code);
  }

  const api = document.createElement("section");
  api.className = "api-card";

  const apiCopy = document.createElement("div");
  const apiLabel = document.createElement("p");
  apiLabel.className = "api-label";
  apiLabel.textContent = "Data API";

  const apiLink = document.createElement("a");
  apiLink.href = "/api/leaderboards";
  apiLink.textContent = "GET /api/leaderboards";

  const apiStatus = document.createElement("p");
  apiStatus.className = "api-status";
  apiStatus.setAttribute("role", "status");
  apiStatus.setAttribute("aria-live", "polite");
  apiStatus.textContent = "Checking the API...";

  apiCopy.append(apiLabel, apiLink);
  api.append(apiCopy, apiStatus);
  element.append(eyebrow, heading, introduction, commands, api);

  void fetch("/api/leaderboards")
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const leaderboards: unknown = await response.json();

      if (!Array.isArray(leaderboards)) {
        throw new Error("API response was not a list");
      }

      apiStatus.classList.add("is-ready");
      apiStatus.textContent = `API ready: ${leaderboards.length} leaderboards available`;
    })
    .catch(() => {
      apiStatus.classList.add("is-error");
      apiStatus.textContent = "API unavailable. Check the development server output.";
    });
}
