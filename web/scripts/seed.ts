import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "src", "seed-data");
mkdirSync(outDir, { recursive: true });

const sample = {
  slug: "employment-contract",
  jurisdiction: "uk-ew",
  title: "Employment Contract (England & Wales)",
  status: "draft"
};

writeFileSync(
  join(outDir, "contracts.sample.json"),
  JSON.stringify([sample], null, 2),
  "utf8"
);
console.log("Seed complete: wrote src/seed-data/contracts.sample.json");
