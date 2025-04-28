#!/bin/bash

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

case $CURRENT_BRANCH in
  next)
    echo "Creating prerelease versions on the next branch"
    # npx lerna version --conventional-commits --conventional-prerelease --preid beta --message "chore(update): next version" --yes
    ;;
  main)
    # On main: stable releases
    echo "Creating stable releases on the main branch"
    # npx lerna version --conventional-commits --message "chore(release): publish stable version" --yes
    ;;
  dev)
    # On dev: no automatic versioning
    echo "No automatic versioning on the dev branch"
    exit 0
    ;;
  *)
    echo "No automatic versioning on this branch"
    ;;
esac