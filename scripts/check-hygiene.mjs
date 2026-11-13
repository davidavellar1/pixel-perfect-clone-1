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
if (failures.length) { console.error([...new Set(failures)].join("\n")); process.exit(1); }
console.log("Source punctuation and semantic token checks passed.");
