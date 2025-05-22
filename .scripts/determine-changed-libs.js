import { spawnSync } from "child_process";
import { writeFileSync, appendFileSync } from "fs";

const result = spawnSync("npx", ["lerna", "changed", "--json"], {
  encoding: "utf-8",
});

if (result.status === 0 && result.stdout) {
  const libs = JSON.parse(result.stdout).map((lib) => lib.name);
  console.log("Changed libraries:", libs.join(","));
  writeFileSync("changed-libs.json", result.stdout);
  if (process.env.GITHUB_ENV) {
    appendFileSync(
      process.env.GITHUB_ENV,
      `changed_libraries=${libs.join(",")}\n`
    );
  }
  writeFileSync("changed-libs-output.txt", libs.join(","));
} else if (
  result.status === 1 &&
  (result.stdout?.includes("No changed packages") ||
    result.stderr?.includes("No changed packages"))
) {
  console.log("No changed libraries found.");
  if (process.env.GITHUB_ENV) {
    appendFileSync(process.env.GITHUB_ENV, `changed_libraries=\n`);
  }
  writeFileSync("changed-libs-output.txt", "");
  process.exit(0);
} else {
  console.error("Error determining changed libraries:");
  console.error("Status:", result.status);
  console.error("Stdout:", result.stdout);
  console.error("Stderr:", result.stderr);
  console.error("Error:", result.error);
  process.exit(1);
}
