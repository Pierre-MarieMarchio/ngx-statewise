#!/bin/bash

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

case $CURRENT_BRANCH in
  next)
    echo "Creating prerelease versions on the next branch"
    npx lerna version --conventional-commits --conventional-prerelease --preid beta --message "chore(release): publish next version" --yes
    ;;
  main)
    echo "Creating stable releases on the main branch"
    npx lerna version --conventional-commits --message "chore(release): publish stable version" --yes
    ;;
  *)
    echo "No automatic versioning on this branch"
    ;;
esac