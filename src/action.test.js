import { jest } from '@jest/globals';

// Mocks must be defined before imports in ESM
jest.unstable_mockModule('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
}));

jest.unstable_mockModule('@actions/github', () => ({
  getOctokit: jest.fn(),
  context: {
    repo: {},
  },
}));

jest.unstable_mockModule('semver', () => ({
  default: {
    valid: jest.fn(),
    rcompare: jest.fn(),
    lt: jest.fn(),
  },
  valid: jest.fn(),
  rcompare: jest.fn(),
  lt: jest.fn(),
}));

const { run } = await import('./action.js');
const core = await import('@actions/core');
const github = await import('@actions/github');
const semver = (await import('semver')).default;

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should set the latest prerelease correctly', async () => {
    const mockReleases = [
      { tag_name: 'v1.0.0', prerelease: false },
      { tag_name: 'v1.1.0', prerelease: false },
      { tag_name: 'v2.0.0', prerelease: false },
      { tag_name: 'v2.1.0-beta', prerelease: true },
      { tag_name: 'v1.1.1-beta', prerelease: true },
      { tag_name: 'v1.1.0-beta', prerelease: true },
    ];

    github.context.repo = { owner: 'owner', repo: 'repo' };
    github.getOctokit.mockReturnValue({
      paginate: jest.fn().mockResolvedValue(mockReleases),
      rest: {
        repos: {
          listReleases: jest.fn(),
          deleteRelease: jest.fn(),
        },
        git: {
          deleteRef: jest.fn(),
        },
      },
    });

    semver.valid.mockImplementation((version) => version);
    semver.rcompare.mockImplementation((a, b) => (a > b ? -1 : 1));
    semver.lt.mockImplementation((a, b) => a < b);

    core.getInput.mockImplementation((name) => {
      if (name === 'github-token') return 'token';
      if (name === 'delete-tags') return 'false';
      if (name === 'dry-run') return 'false';
    });

    await run();

    expect(core.setOutput).toHaveBeenCalledWith(
      'prereleases',
      JSON.stringify([{ tag_name: 'v1.1.1-beta', prerelease: true },{ tag_name: 'v1.1.0-beta', prerelease: true }])
    );
  });

  test('should handle dry run correctly', async () => {
    const mockReleases = [
      { tag_name: 'v1.0.0', prerelease: false },
      { tag_name: 'v1.1.0', prerelease: false },
      { tag_name: 'v2.0.0', prerelease: false },
      { tag_name: 'v2.1.0-beta', prerelease: true },
    ];

    github.context.repo = { owner: 'owner', repo: 'repo' };
    github.getOctokit.mockReturnValue({
      paginate: jest.fn().mockResolvedValue(mockReleases),
      rest: {
        repos: {
          listReleases: jest.fn(),
          deleteRelease: jest.fn(),
        },
        git: {
          deleteRef: jest.fn(),
        },
      },
    });

    semver.valid.mockImplementation((version) => version);
    semver.rcompare.mockImplementation((a, b) => (a > b ? -1 : 1));
    semver.lt.mockImplementation((a, b) => a < b);

    core.getInput.mockImplementation((name) => {
      if (name === 'github-token') return 'token';
      if (name === 'delete-tags') return 'false';
      if (name === 'dry-run') return 'true';
    });

    await run();

    expect(github.getOctokit().rest.repos.deleteRelease).not.toHaveBeenCalled();
    expect(github.getOctokit().rest.git.deleteRef).not.toHaveBeenCalled();
  });

  test('should delete outdated prereleases and tags when deleteTags is true', async () => {
    const mockReleases = [
      { tag_name: 'v1.0.0', prerelease: false },
      { tag_name: 'v1.1.0', prerelease: false },
      { tag_name: 'v2.0.0', prerelease: false },
      { tag_name: 'v1.0.0-beta', prerelease: true, id: 1 },
      { tag_name: 'v1.1.0-beta', prerelease: true, id: 2 },
    ];

    github.context.repo = { owner: 'owner', repo: 'repo' };
    github.getOctokit.mockReturnValue({
      paginate: jest.fn().mockResolvedValue(mockReleases),
      rest: {
        repos: {
          listReleases: jest.fn(),
          deleteRelease: jest.fn(),
        },
        git: {
          deleteRef: jest.fn(),
        },
      },
    });

    semver.valid.mockImplementation((version) => version);
    semver.rcompare.mockImplementation((a, b) => (a > b ? -1 : 1));
    semver.lt.mockImplementation((a, b) => a < b);

    core.getInput.mockImplementation((name) => {
      if (name === 'github-token') return 'token';
      if (name === 'delete-tags') return 'true';
      if (name === 'dry-run') return 'false';
    });

    await run();

    expect(github.getOctokit().rest.repos.deleteRelease).toHaveBeenCalledTimes(2);
    expect(github.getOctokit().rest.repos.deleteRelease).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      release_id: 1,
    });
    expect(github.getOctokit().rest.repos.deleteRelease).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      release_id: 2,
    });
    expect(github.getOctokit().rest.git.deleteRef).toHaveBeenCalledTimes(2);
    expect(github.getOctokit().rest.git.deleteRef).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: 'tags/v1.0.0-beta',
    });
    expect(github.getOctokit().rest.git.deleteRef).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: 'tags/v1.1.0-beta',
    });
  });
});
