import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync("src/styles.css", "utf8");
const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
const colours = new Set([...css.matchAll(/--color-([\w-]+)\s*:/g)].map((match) => match[1]));
const dynamicChartTokens = new Set(["--color-bg", "--color-border", "--color-icon"]);
const builtins = /^(?:transparent|current|inherit|none|auto|px|\d+(?:\.\d+)?|xs|sm|base|lg|xl|\d+xl|left|right|center|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty|solid|dashed|dotted|double|hidden|collapse|separate)$/;
const images = new Set([...css.matchAll(/--background-image-([\w-]+)\s*:/g)].map((match) => match[1]));
const failures = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else {
      const text = readFileSync(path, "utf8");
      if (/[\u2013\u2014]/.test(text)) failures.push(`${path}: prohibited dash`);
      if (!/\.[cm]?[jt]sx?$/.test(path)) continue;
      const local = new Set([...text.matchAll(/["'`](--[\w-]+)["'`]\s*:/g)].map((match) => match[1]));
      for (const [, token] of text.matchAll(/var\((--[\w-]+)/g)) {
        if (!defined.has(token) && !local.has(token) && !/^--(?:radix-|recharts-)/.test(token) && !(path.endsWith("/ui/chart.tsx") && dynamicChartTokens.has(token))) failures.push(`${path}: undefined token ${token}`);
      }
      for (const [, role] of text.matchAll(/\b(?:bg|text|border)-(?:[trblxyse]-)?([a-z][a-z0-9-]*)(?=[/\s"'`\]}])/g)) {
        if (!builtins.test(role) && !/^(?:[trblxyse]|[trblxyse]-[0-9]+)$/.test(role) && !colours.has(role) && !images.has(role) && !role.startsWith("gradient-") && !role.startsWith("opacity-")) failures.push(`${path}: undefined semantic colour ${role}`);
      }
      for (const utility of ["max-w-workspace", "workspace-container"]) {
        if (text.includes(utility) && !css.includes(`@utility ${utility}`)) failures.push(`${path}: undefined ${utility}`);
      }
    }
  }
}
for (const [, token] of css.matchAll(/var\((--[\w-]+)/g)) {
  if (!defined.has(token) && !token.startsWith("--radix-")) failures.push(`src/styles.css: undefined token ${token}`);
}
walk("src");
// Migrations: one file per number, and every file registered in the journal.
const migrationDir = "drizzle/migrations";
const journal = JSON.parse(readFileSync(join(migrationDir, "meta/_journal.json"), "utf8"));
const journalTags = new Set(journal.entries.map((entry) => entry.tag));
const prefixes = new Map();
for (const file of readdirSync(migrationDir).filter((name) => name.endsWith(".sql"))) {
  const prefix = file.match(/^(\d+)_/)?.[1];
  if (!prefix) { failures.push(`${migrationDir}/${file}: no numeric prefix`); continue; }
  if (prefixes.has(prefix)) failures.push(`${migrationDir}/${file}: number ${prefix} also used by ${prefixes.get(prefix)}`);
  else prefixes.set(prefix, file);
  if (!journalTags.has(file.replace(/\.sql$/, ""))) failures.push(`${migrationDir}/${file}: missing from meta/_journal.json`);
}
for (const tag of journalTags) if (!readdirSync(migrationDir).includes(`${tag}.sql`)) failures.push(`${migrationDir}/meta/_journal.json: ${tag} has no .sql file`);
if (failures.length) { console.error([...new Set(failures)].join("\n")); process.exit(1); }
console.log("Source punctuation and semantic token checks passed.");
