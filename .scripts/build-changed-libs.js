import { execSync } from "child_process";

const changed = process.env.changed_libraries;

if (!changed) {
  console.log("No libraries to build.");
  process.exit(0);
}

for (const lib of changed.split(",")) {
  console.log(`Building ${lib}...`);
  execSync(`npx ng build ${lib}`, { stdio: "inherit" });
}
