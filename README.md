# Prerelease Cleanup Action

With this action you can easily get rid of old prereleases on your GitHub repository, leaving only the actual releases and any future version prereleases intact. The action compares semantic versions from your releases and sees which prereleases it can safely remove. Only releases that are tagged with the `pre-release` identifier on GitHub will be removed, so even if a release would semantically match the prerelease format it wouldn't be removed.

By default, the corresponding Git tags are also removed but you can disable that with the optional `delete-tags` input.

You can trigger the action from any GitHub event you want, typically you would trigger from release creation or from merge to the release branch as part of your automated release generation.


```yaml
name: Prerelease cleanup

on: push

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: ElisaOyj/gh-action-prerelease-cleanup@v0.2.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          delete-tags: true
```

## Inputs

| Name           | Required | Description                                                                                                                             |
| -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `github-token` | yes      | GitHub token                                                                                                                            |
| `delete-tags`  | no       | Delete corresponding Git tags, default: `true`                                                                                          |
| `dry-run`      | no       | Do not delete releases but only print to console and set output called `prereleases` with the list of prereleases that would be deleted |

## Outputs

| Name          | Description                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `prereleases` | JSON string that contains a list of releases in the format returned by the GitHub API (always returned) |
