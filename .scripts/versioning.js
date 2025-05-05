import { execSync } from "child_process";

try {
  const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf-8",
  }).trim();

  switch (currentBranch) {
    case "next":
      console.log("Creating prerelease versions on the next branch");
      execSync('npm run version:beta-release"', {
        stdio: "inherit",
      });
      break;

    case "main":
      console.log("Creating stable releases on the main branch");
      execSync("npm run version:stable-release", {
        stdio: "inherit",
      });
      break;
    default:
      console.log("No automatic versioning on this branch");
  }
} catch (error) {
  console.error("Error running versioning script:", error.message);
  process.exit(1);
}
