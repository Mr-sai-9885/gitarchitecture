# repo-arch-visualizer

A TypeScript CLI that scans a local JavaScript/TypeScript repository, resolves relative module dependencies, and writes an architecture diagram as Mermaid, DOT, or JSON.

## Requirements

- Node.js 20 or newer

## Setup

```sh
npm install
```

## Usage

Run from the project directory:

```sh
npx tsx src/index.ts generate ./my-repository
```

## Web app

The Next.js App Router wrapper displays a rendered, directory-grouped SVG file-tree diagram for up to 30 files from a public GitHub repository's default branch. Run the web app in development with:

```sh
npm run dev
```

Then open `http://localhost:3000/<owner>/<repo>`, for example `http://localhost:3000/vercel/next.js`. The diagram is rendered in the page without requiring client-side Mermaid execution. GitHub API responses are cached for one hour. Private repositories are not supported by this wrapper.

```sh
npm run build
npm start
```

Options:

```text
--depth <number>          Maximum traversal depth (default: 3)
--exclude <patterns>      Comma-separated glob patterns to exclude
--format <format>         mermaid, dot, json, png, or svg (default: mermaid)
--output <filepath>       Output path (default: ./ARCHITECTURE.md, ./architecture.png, or ./architecture.svg)
--theme <theme>           Image theme: dark, default, forest, or neutral (default: dark)
--ai-prompt               Ask Gemini to create an image-generation prompt
--prompt-output <path>    Prompt path (default: ./architecture_image_prompt.txt)
```

Examples:

```sh
npx tsx src/index.ts generate . --format dot --output architecture.dot
npx tsx src/index.ts generate . --format json --output architecture.json
npx tsx src/index.ts generate . --format png --theme forest
npx tsx src/index.ts generate . --format svg --output architecture.svg
npx tsx src/index.ts generate . --ai-prompt
```

Mermaid output is a `graph TD` diagram. PNG/SVG rendering uses the local Mermaid CLI and its Chromium runtime. Import references are resolved against scanned source files; package imports and relative imports that do not resolve to a scanned file are omitted. The scanner honors `.gitignore` and the explicit `--exclude` patterns. Supported source extensions are `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, and `.cts`.

Set `GEMINI_API_KEY` in the environment before using `--ai-prompt`. It writes the generated prompt to `architecture_image_prompt.txt` by default; use `--prompt-output` to choose another path. Keep API keys out of source control.

## Development

```sh
npm test
npm run compile
```

The standard `dev`, `build`, and `start` scripts target the Next.js web app (including Vercel deployments). Use `npm run compile` to build the CLI into `dist/`, and `npm run start:cli -- generate <target-dir>` to run its source entry point.
