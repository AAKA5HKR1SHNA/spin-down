#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const packagePath = new URL("../package.json", import.meta.url);
const framework = process.argv[2]?.toLowerCase();

if (framework === "--help" || framework === "-h") {
  printUsage();
  process.exit(0);
}

if (framework !== "vue" && framework !== "react") {
  printUsage();
  process.exit(1);
}

const initialPackageJson = JSON.parse(await readFile(packagePath, "utf8"));
const existingFramework = initialPackageJson.spinDown?.frontend;

if (existingFramework) {
  const message =
    existingFramework === framework
      ? `${capitalize(framework)} is already configured.`
      : `This project is already configured for ${capitalize(existingFramework)}. Restore a clean checkout before choosing another framework.`;

  console.error(message);
  process.exit(existingFramework === framework ? 0 : 1);
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const dependencies =
  framework === "vue"
    ? ["vue@3.5.40", "vue-router@5.2.0"]
    : ["react@19.2.7", "react-dom@19.2.7", "react-router@8.2.0"];
const devDependencies =
  framework === "vue"
    ? ["@vitejs/plugin-vue@6.0.8", "vue-tsc@3.3.7"]
    : ["@types/react@19.2.17", "@types/react-dom@19.2.3", "@vitejs/plugin-react@6.0.3"];

runNpm(["install", "--save-exact", ...dependencies]);
runNpm([
  "install",
  "--save-dev",
  "--save-exact",
  "@tailwindcss/vite@4.3.3",
  "tailwindcss@4.3.3",
  "typescript@6.0.3",
  ...devDependencies,
]);

const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
packageJson.scripts.typecheck = framework === "vue" ? "vue-tsc --noEmit" : "tsc --noEmit";
packageJson.scripts["build:only"] = "vite build";
packageJson.scripts.build = "npm run typecheck && npm run build:only";
packageJson.scripts.format = "prettier --write .";
packageJson.scripts["format:check"] = "prettier --check .";
packageJson.spinDown = { frontend: framework };

await Promise.all([
  mkdir(new URL("../app/router/", import.meta.url), { recursive: true }),
  mkdir(new URL("../app/views/", import.meta.url), { recursive: true }),
]);

await Promise.all([
  writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`),
  writeFile(new URL("../index.html", import.meta.url), indexHtml(framework)),
  writeFile(new URL("../vite.config.ts", import.meta.url), viteConfig(framework)),
  writeFile(new URL("../tsconfig.json", import.meta.url), tsConfig(framework)),
  writeFile(new URL("../env.d.ts", import.meta.url), '/// <reference types="vite/client" />\n'),
  writeFile(new URL("../app/assets/main.css", import.meta.url), '@import "tailwindcss";\n'),
  writeFile(
    new URL(framework === "vue" ? "../app/App.vue" : "../app/App.tsx", import.meta.url),
    framework === "vue" ? vueApp() : reactApp(),
  ),
  writeFile(
    new URL(
      framework === "vue" ? "../app/entry-client.ts" : "../app/entry-client.tsx",
      import.meta.url,
    ),
    framework === "vue" ? vueEntry() : reactEntry(),
  ),
  writeFile(
    new URL(
      framework === "vue" ? "../app/router/index.ts" : "../app/router/index.tsx",
      import.meta.url,
    ),
    framework === "vue" ? vueRouter() : reactRouter(),
  ),
  writeFile(
    new URL(
      framework === "vue" ? "../app/views/HomeView.vue" : "../app/views/HomeView.tsx",
      import.meta.url,
    ),
    framework === "vue" ? vueHomeView() : reactHomeView(),
  ),
  writeFile(
    new URL(
      framework === "vue" ? "../app/views/LeaderboardView.vue" : "../app/views/LeaderboardView.tsx",
      import.meta.url,
    ),
    framework === "vue" ? vueLeaderboardView() : reactLeaderboardView(),
  ),
]);

await Promise.all([
  rm(new URL("../app/app.ts", import.meta.url), { force: true }),
  rm(new URL(framework === "vue" ? "../app/App.tsx" : "../app/App.vue", import.meta.url), {
    force: true,
  }),
  rm(
    new URL(
      framework === "vue" ? "../app/entry-client.tsx" : "../app/entry-client.ts",
      import.meta.url,
    ),
    { force: true },
  ),
  rm(
    new URL(
      framework === "vue" ? "../app/router/index.tsx" : "../app/router/index.ts",
      import.meta.url,
    ),
    { force: true },
  ),
  rm(new URL("../app/assets/nitro.svg", import.meta.url), { force: true }),
  rm(new URL("../app/assets/vite.svg", import.meta.url), { force: true }),
]);

runNpm(["run", "format"]);

console.log(
  `\n${capitalize(framework)}, routing, and Tailwind CSS are ready. Run npm run dev to start.`,
);

function runNpm(args) {
  execFileSync(npm, args, { cwd: rootDir, stdio: "inherit" });
}

function printUsage() {
  console.log(`Usage: npm run setup:frontend -- <vue|react>

Sets up a client-rendered Vue or React application with routing and Tailwind CSS.
Run this command once, before editing the frontend.`);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function indexHtml(selectedFramework) {
  const extension = selectedFramework === "vue" ? "ts" : "tsx";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Spin Down</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/app/entry-client.${extension}"></script>
  </body>
</html>
`;
}

function viteConfig(selectedFramework) {
  const pluginPackage = selectedFramework === "vue" ? "@vitejs/plugin-vue" : "@vitejs/plugin-react";
  const pluginName = selectedFramework;

  return `import tailwindcss from "@tailwindcss/vite";
import ${pluginName} from "${pluginPackage}";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [nitro(), ${pluginName}(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
});
`;
}

function tsConfig(selectedFramework) {
  const jsxOptions =
    selectedFramework === "react"
      ? ',\n    "jsx": "react-jsx",\n    "jsxImportSource": "react"'
      : "";

  return `{
  "extends": ["nitro/tsconfig"],
  "compilerOptions": {
    "paths": {
      "~/*": ["./*"]
    }${jsxOptions}
  }
}
`;
}

function vueEntry() {
  return `import { createApp } from "vue";
import App from "./App.vue";
import "./assets/main.css";
import router from "./router/index.ts";

createApp(App).use(router).mount("#app");
`;
}

function reactEntry() {
  return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./assets/main.css";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("App root element was not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;
}

function vueApp() {
  return `<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView />
</template>
`;
}

function vueRouter() {
  return `import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LeaderboardView from "../views/LeaderboardView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomeView },
    {
      path: "/leaderboards/:slug",
      name: "leaderboard",
      component: LeaderboardView,
      props: true,
    },
  ],
});

export default router;
`;
}

function vueHomeView() {
  return `<template>
  <main class="mx-auto max-w-5xl px-6 py-16">
    <p class="text-sm font-semibold uppercase tracking-widest text-sky-700">Spin Down</p>
    <h1 class="mt-3 text-4xl font-bold text-slate-950">Build the leaderboard experience</h1>
    <p class="mt-4 text-lg text-slate-600">
      Vue and Tailwind CSS are ready. Start with
      <a class="font-semibold text-sky-700 underline" href="/api/leaderboards">
        GET /api/leaderboards
      </a>.
    </p>
  </main>
</template>
`;
}

function vueLeaderboardView() {
  return `<script setup lang="ts">
defineProps<{ slug: string }>();
</script>

<template>
  <main class="mx-auto max-w-5xl px-6 py-16">
    <p class="text-sm font-semibold uppercase tracking-widest text-sky-700">Leaderboard</p>
    <h1 class="mt-3 text-3xl font-bold text-slate-950">{{ slug }}</h1>
    <p class="mt-4 text-slate-600">
      Build this view with data from <code>/api/leaderboards/{{ slug }}</code>.
    </p>
  </main>
</template>
`;
}

function reactApp() {
  return `import { RouterProvider } from "react-router/dom";
import router from "./router/index.tsx";

export default function App() {
  return <RouterProvider router={router} />;
}
`;
}

function reactRouter() {
  return `import { createBrowserRouter } from "react-router";
import HomeView from "../views/HomeView.tsx";
import LeaderboardView from "../views/LeaderboardView.tsx";

const router = createBrowserRouter([
  { path: "/", Component: HomeView },
  { path: "/leaderboards/:slug", Component: LeaderboardView },
]);

export default router;
`;
}

function reactHomeView() {
  return `export default function HomeView() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">Spin Down</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-950">
        Build the leaderboard experience
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        React and Tailwind CSS are ready. Start with{" "}
        <a className="font-semibold text-sky-700 underline" href="/api/leaderboards">
          GET /api/leaderboards
        </a>
        .
      </p>
    </main>
  );
}
`;
}

function reactLeaderboardView() {
  return `import { useParams } from "react-router";

export default function LeaderboardView() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">
        Leaderboard
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-950">{slug}</h1>
      <p className="mt-4 text-slate-600">
        Build this view with data from <code>/api/leaderboards/{slug}</code>.
      </p>
    </main>
  );
}
`;
}
