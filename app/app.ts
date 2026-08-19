interface Leaderboard {
  id: string | number;
  slug?: string;
  title: string;
  playerCount: number;
  tournamentCount: number;
  league: string;
  isOfficial: boolean;
  isFeatured: boolean;
}

/**
 * Main setup function exported to be called by entry-client.ts
 */
export function setup(containerId: string = "app"): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found.`);
    return;
  }

  // Inject HTML markup
  container.innerHTML = `
    <div class="leaderboard-app" style="font-family: sans-serif; max-width: 900px; margin: 0 auto; padding: 1rem;">
      <!-- Header Bar -->
      <header style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid #ccc;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="../components/logo.png" alt="Logo" style="height: 40px; width: auto;" />
          <h1 id="main-header" style="margin: 0; font-size: 1.5rem; color: inherit;">Leaderboard Search</h1>
        </div>

        <!-- Day / Night Toggle Switch -->
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
          <span id="theme-label" style="font-weight: bold; font-size: 0.9rem;">Day</span>
          <input type="checkbox" id="theme-toggle" style="cursor: pointer; width: 18px; height: 18px;" />
        </label>
      </header>

      <!-- Controls Container -->
      <div id="controls-bar">
        <section style="display: flex; gap: 0.5rem; margin: 1.5rem 0;">
          <input 
            type="text" 
            id="search-input" 
            placeholder="Search leaderboards..." 
            style="flex: 1; padding: 0.5rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px;"
          />
          <button 
            id="search-btn" 
            style="padding: 0.5rem 1rem; font-size: 1rem; background-color: #0066cc; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
            Search
          </button>
          <button 
            id="Reset-btn" 
            title="Reset / Show All"
            style="padding: 0.5rem 1rem; font-size: 1rem; background-color: #6c757d; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
            ↻ Reset
          </button>
        </section>
      </div>

      <div id="status-message" style="margin-bottom: 1rem; color: #666;"></div>
      <main id="leaderboards-list"></main>
    </div>
  `;

  // Query child elements after innerHTML is injected
  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  const searchBtn = document.getElementById("search-btn") as HTMLButtonElement;
  const ResetBtn = document.getElementById("Reset-btn") as HTMLButtonElement;
  const controlsBar = document.getElementById("controls-bar") as HTMLElement;
  const listContainer = document.getElementById("leaderboards-list") as HTMLElement;
  const statusMsg = document.getElementById("status-message") as HTMLElement;
  const themeToggle = document.getElementById("theme-toggle") as HTMLInputElement;
  const themeLabel = document.getElementById("theme-label") as HTMLElement;
  const mainHeader = document.getElementById("main-header") as HTMLElement;

  let currentLeaderboards: any[] = [];

  // Dark Mode / Night Mode Toggle
  const setSolidTheme = (isNight: boolean) => {
    const bgColor = isNight ? "#1e1e1e" : "#ffffff";
    const textColor = isNight ? "#ffffff" : "#000000";

    [document.documentElement, document.body].forEach((el) => {
      el.style.setProperty("background", bgColor, "important");
      el.style.setProperty("background-image", "none", "important");
      el.style.color = textColor;
    });

    if (mainHeader) mainHeader.style.color = textColor;
  };

  // Define internal helper for API calls
  async function fetchLeaderboards(searchTerm: string = ""): Promise<void> {
    if (controlsBar) controlsBar.style.display = "block";
    statusMsg.textContent = "Loading leaderboards...";
    listContainer.innerHTML = "";

    try {
      const url = searchTerm.trim() 
        ? `/api/leaderboards?search=${encodeURIComponent(searchTerm.trim())}` 
        : `/api/leaderboards`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status ${response.status}`);

      // Assign to outer variable instead of creating a local shadowed variable
      currentLeaderboards = await response.json();
      statusMsg.textContent = "";
      renderLeaderboards(currentLeaderboards);
    } catch (err) {
      console.error("Failed to fetch leaderboards:", err);
      statusMsg.textContent = "Error loading leaderboards. Please try again.";
    }
  }

  // API Logic: Fetch Single Leaderboard by Slug
  async function fetchLeaderboardDetail(slug: string): Promise<void> {
    if (controlsBar) controlsBar.style.display = "none";
    statusMsg.textContent = `Loading details for "${slug}"...`;
    listContainer.innerHTML = "";

    try {
      const response = await fetch(`/api/leaderboards/${encodeURIComponent(slug)}`);
      if (!response.ok) throw new Error(`Status ${response.status}`);

      const leaderboardData = await response.json();
      statusMsg.textContent = "";
      renderLeaderboardDetail(slug, leaderboardData);
    } catch (err) {
      console.error(`Failed to fetch detail for slug: ${slug}`, err);
      statusMsg.textContent = `Error loading leaderboard "${slug}".`;
    }
  }

  // Render results into table
  function renderLeaderboards(leaderboards: any[]): void {
    if (!leaderboards || leaderboards.length === 0) {
      listContainer.innerHTML = `<p style="color: #888;">No leaderboards found.</p>`;
      return;
    }

    const isNight = themeToggle ? themeToggle.checked : false;
    const headerBg = isNight ? "#2d2d2d" : "#999999";
    const headerTextColor = isNight ? "#ffffff" : "#000000";
    const borderColor = isNight ? "#444444" : "#dddddd";

    listContainer.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid ${borderColor}; background-color: ${headerBg}; color: ${headerTextColor}">
            <th style="padding: 0.75rem;">Name</th>
            <th style="padding: 0.75rem;">League</th>
            <th style="padding: 0.75rem; text-align: center;">Players</th>
            <th style="padding: 0.75rem; text-align: center;">Tournaments</th>
            <th style="padding: 0.75rem; text-align: center;">Official</th>
            <th style="padding: 0.75rem; text-align: center;">Featured</th>
          </tr>
        </thead>
        <tbody>
          ${leaderboards.map((lb) => `
            <tr class="leaderboard-row" data-slug="${lb.slug || lb.id}" style="border-bottom: 1px solid ${borderColor}; cursor: pointer;">
              <td style="padding: 0.75rem; font-weight: bold; color: #0066cc;">${lb.title || lb.name}</td>
              <td style="padding: 0.75rem;">${lb.league || "-"}</td>
              <td style="padding: 0.75rem; text-align: center;">${lb.playerCount ?? 0}</td>
              <td style="padding: 0.75rem; text-align: center;">${lb.tournamentCount ?? 0}</td>
              <td style="padding: 0.75rem; text-align: center; color: #ff9900;">${lb.isOfficial ? "✓" : "-"}</td>
              <td style="padding: 0.75rem; text-align: center; color: #0099ff;">${lb.isFeatured ? "✓" : "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // Helper to format dates into Month, Day, Year
  function formatDate(dateString?: string): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Render Detail View ("New Page")
  function renderLeaderboardDetail(slug: string, data: any): void {
    const isNight = themeToggle ? themeToggle.checked : false;
    const headerBg = isNight ? "#2d2d2d" : "#999999";
    const headerTextColor = isNight ? "#ffffff" : "#000000";
    const borderColor = isNight ? "#444444" : "#dddddd";

    const rankings = Array.isArray(data.rankings) ? data.rankings : [];
    const tournaments = Array.isArray(data.tournaments) ? data.tournaments : [];

    listContainer.innerHTML = `
      <section style="margin-top: 1rem;">
        <!-- Navigation -->
        <button 
          id="back-btn" 
          style="padding: 0.5rem 1rem; font-size: 0.9rem; background-color: #6c757d; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 1rem;">
          ← Back to Leaderboards
        </button>

        <!-- Banner with Overlaid Title -->
        <div style="position: relative; width: 100%; max-height: 220px; overflow: hidden; border-radius: 8px; background-color: #333; margin-bottom: 0.75rem;">
          ${data.bannerImageUrl ? `
            <img src="${data.bannerImageUrl}" alt="Leaderboard Banner" style="width: 100%; height: 220px; object-fit: cover; display: block;" />
          ` : `
            <div style="height: 140px; background-color: #444;"></div>
          `}
          <!-- White text with black outline overlaid at bottom -->
          <h1 style="
            position: absolute; 
            bottom: 12px; 
            left: 16px; 
            right: 16px; 
            margin: 0; 
            font-size: 2rem; 
            color: #ffffff; 
            text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8);
          ">
            ${data.title || data.name || slug}
          </h1>
        </div>

        <!-- Metadata Bar (Created Date + Checkmarks) -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; margin-bottom: 2rem; border-bottom: 1px solid ${borderColor}; font-size: 0.95rem;">
          <div>
            <strong>Created:</strong> ${formatDate(data.createdAt)}
          </div>
          <div style="display: flex; gap: 1rem; align-items: center;">
            ${data.isOfficial ? '<span style="color: #ff9900; font-weight: bold;">Official ✓</span>' : ''}
            ${data.isFeatured ? '<span style="color: #0099ff; font-weight: bold;">Featured ✓</span>' : ''}
          </div>
        </div>

        <!-- Rankings Section -->
        <h2 style="margin-bottom: 0.75rem; color: inherit;">Rankings</h2>
        ${rankings.length === 0 ? '<p style="color: #888;">No rankings available for this leaderboard.</p>' : `
          <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 2.5rem;">
            <thead>
              <tr style="border-bottom: 2px solid ${borderColor}; background-color: ${headerBg}; color: ${headerTextColor};">
                <th style="padding: 0.75rem; text-align: center;">Rank</th>
                <th style="padding: 0.75rem; text-align: center;">Avatar</th>
                <th style="padding: 0.75rem;">Blader Name</th>
                <th style="padding: 0.75rem; text-align: center;">Current ELO</th>
                <th style="padding: 0.75rem; text-align: center;">W-L Ratio</th>
                <th style="padding: 0.75rem;">Country</th>
              </tr>
            </thead>
            <tbody>
              ${rankings.map((player: any, index: number) => `
                <tr style="border-bottom: 1px solid ${borderColor};">
                  <td style="padding: 0.75rem; text-align: center; font-weight: bold;">${index + 1}</td>
                  <td style="padding: 0.75rem; text-align: center;">
                    ${player.avatarUrl ? `
                      <img src="${player.avatarUrl}" alt="${player.playerName || 'Avatar'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; vertical-align: middle;" />
                    ` : '-'}
                  </td>
                  <td style="padding: 0.75rem; font-weight: bold;">${player.playerName || '-'}</td>
                  <td style="padding: 0.75rem; text-align: center;">${player.currentELO ?? '-'}</td>
                  <td style="padding: 0.75rem; text-align: center;">${player.wins ?? 0} - ${player.losses ?? 0}</td>
                  <td style="padding: 0.75rem;">${player.country || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}

        <!-- Tournaments Section -->
        <h2 style="margin-bottom: 0.75rem; color: inherit;">Tournaments</h2>
        ${tournaments.length === 0 ? '<p style="color: #888;">No tournaments recorded for this leaderboard.</p>' : `
          <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 2rem;">
            <thead>
              <tr style="border-bottom: 2px solid ${borderColor}; background-color: ${headerBg}; color: ${headerTextColor};">
                <th style="padding: 0.75rem;">Tournament Name</th>
                <th style="padding: 0.75rem;">Format</th>
                <th style="padding: 0.75rem; text-align: center;">Players</th>
                <th style="padding: 0.75rem;">City</th>
                <th style="padding: 0.75rem;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${tournaments.map((t: any) => `
                <tr style="border-bottom: 1px solid ${borderColor};">
                  <td style="padding: 0.75rem; font-weight: bold;">${t.title || '-'}</td>
                  <td style="padding: 0.75rem;">${t.format || '-'}</td>
                  <td style="padding: 0.75rem; text-align: center;">${t.playerCount ?? '-'}</td>
                  <td style="padding: 0.75rem;">${t.city || '-'}</td>
                  <td style="padding: 0.75rem;">${formatDate(t.eventTime)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </section>
    `;

    // Attach Back Button Handler
    const backBtn = document.getElementById("back-btn");
    backBtn?.addEventListener("click", () => {
      if (controlsBar) controlsBar.style.display = "block";
      renderLeaderboards(currentLeaderboards);
    });
  }

  // Attach event listeners
  searchBtn.addEventListener("click", () => fetchLeaderboards(searchInput.value));
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") fetchLeaderboards(searchInput.value);
  });
  ResetBtn.addEventListener("click", () => {
    searchInput.value = "";
    fetchLeaderboards();
  });

  // Delegated click listener for leaderboard table rows
  listContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const row = target.closest<HTMLTableRowElement>(".leaderboard-row");
    if (row && row.dataset.slug) {
      fetchLeaderboardDetail(row.dataset.slug);
    }
  });

  // Day / Night Switch Handler
  themeToggle.addEventListener("change", () => {
    const isNight = themeToggle.checked;
    themeLabel.textContent = isNight ? "Night" : "Day";
    setSolidTheme(isNight);
  });

  // Initial fetch on page load
  fetchLeaderboards();
}