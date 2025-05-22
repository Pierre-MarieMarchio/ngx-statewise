import { execSync } from "child_process";
import { writeFileSync, appendFileSync } from "fs";

try {
  const output = execSync("npx lerna changed --json", { encoding: "utf-8" });

  writeFileSync("changed-libs.json", output);

  const libs = JSON.parse(output).map((lib) => lib.name);

  console.log("Changed libraries:", libs.join(","));

  appendFileSync(
    process.env.GITHUB_ENV,
    `changed_libraries=${libs.join(",")}\n`
  );

  writeFileSync("changed-libs-output.txt", libs.join(","));
} catch (err) {
  const noChanges =
    err.status === 1 && err.stdout?.includes("No changed packages");

  if (noChanges) {
    console.log("No changed libraries.");
    appendFileSync(process.env.GITHUB_ENV, `changed_libraries=\n`);
    writeFileSync("changed-libs-output.txt", "");
    process.exit(0);
  } else {
    console.error("Error determining changed libraries:", err.message);
    process.exit(1);
  }
}
