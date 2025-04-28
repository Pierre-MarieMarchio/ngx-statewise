import type { Options } from 'semantic-release';

const config: Options = {
  extends: 'semantic-release-monorepo',
  branches: [{ name: 'semantic-release' }],
  // tagFormat: '${package.name}-v${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/git',
  ],
  dryRun: true,
  disablePush: true,
};

export default config;
