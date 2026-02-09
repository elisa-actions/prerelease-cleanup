import * as core from "@actions/core";
import semver from "semver";
import { getOctokit, context } from "@actions/github";

export async function run() {
  const token = core.getInput("github-token", { required: true });
  const deleteTags = core.getInput("delete-tags") === "true";
  const dryRun = core.getInput("dry-run") === "true";
  const octokit = getOctokit(token);
  const { owner, repo } = context.repo;
  const releases = await octokit.paginate(octokit.rest.repos.listReleases, {
    owner,
    repo,
  });
  const latestRelease = releases
    .filter((release) => !release.prerelease)
    .filter((release) => semver.valid(release.tag_name))
    .map((release) => release.tag_name)
    .sort(semver.rcompare)
    .shift();
  const outdatedPrereleases = releases
    .filter((release) => release.prerelease)
    .filter((release) => semver.valid(release.tag_name))
    .filter((release) =>
      semver.lt(release.tag_name, latestRelease, { includePrerelease: true })
    );
  console.log(`Latest release is ${latestRelease}`);
  console.log("Outdated prereleases are:");
  outdatedPrereleases.map((prerelease) => console.log(prerelease.tag_name));
  core.setOutput("prereleases", JSON.stringify(outdatedPrereleases));
  if (dryRun) {
    return;
  }
  await Promise.all(
    outdatedPrereleases.map(async (prerelease) => {
      await octokit.rest.repos.deleteRelease({
        owner,
        repo,
        release_id: prerelease.id,
      });
      if (deleteTags) {
        try {
          await octokit.rest.git.deleteRef({
            owner,
            repo,
            ref: `tags/${prerelease.tag_name}`,
          });
        } catch (err) {
          console.log(err);
        }
      }
    })
  );
}
