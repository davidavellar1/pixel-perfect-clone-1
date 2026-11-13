import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const failures = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else {
      const text = readFileSync(path, "utf8");
      if (/[\u2013\u2014]/.test(text)) failures.push(`${path}: prohibited dash`);
    }
  }
}
walk("src");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Source punctuation check passed.");