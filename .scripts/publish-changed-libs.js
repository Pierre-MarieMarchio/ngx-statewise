import { execSync } from "child_process";
const { env } = process;

const changed = env.changed_libraries;
if (!changed) {
  console.log("No libraries to publish.");
  process.exit(0);
}

let npmTag = "latest";
if (env.GITHUB_REF === "refs/heads/next") npmTag = "beta";

for (const lib of changed.split(",")) {
  console.log(`Publishing ${lib} with tag ${npmTag}...`);
  try {
    execSync(`cd dist/${lib} && npm publish --tag ${npmTag}`, {
      stdio: "inherit",
      shell: "/bin/bash",
    });
  } catch (e) {
    console.error(`Failed to publish ${lib}:`, e.message);
  }
}
