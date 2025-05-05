import { execSync } from "child_process";
import { writeFileSync, appendFileSync } from "fs";

try {
  const output = execSync("npx lerna changed --json", { encoding: "utf-8" });
  writeFileSync("changed-libs.json", output);

  const libs = JSON.parse(output).map((lib) => lib.name);
  console.log("Changed libraries:", libs.join(","));

  appendFileSync(process.env.GITHUB_ENV, `changed_libraries=${libs.join(",")}\n`);
} catch (err) {
  if (err.status === 1 && err.stdout?.includes("No changed packages")) {
    console.log("No changed libraries.");
    appendFileSync(process.env.GITHUB_ENV, `changed_libraries=\n`);
  } else {
    console.error("Error determining changed libraries:", err.message);
    process.exit(1);
  }
}