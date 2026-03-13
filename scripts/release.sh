#!/bin/bash

# Exit on error
set -e

# Default to 'minor' as requested, but allow override (patch, minor, major)
VERSION_TYPE=${1:-minor}

# Check if git workspace is clean
if [[ -n $(git status -s) ]]; then
  echo "⚠️  Git workspace is not clean. Please commit or stash your changes first."
  exit 1
fi

echo "🚀 Starting release process ($VERSION_TYPE)..."

# Run validation checks before anything else
echo "🔍 Running pre-release checks (types & tests)..."
npm run check
echo "✅ Checks passed!"

# Verify that the binary can be built and actually works
echo "🏗️  Running binary smoke test (E2E PDF parsing)..."
npm run test:binary
echo "✅ Binary verified!"

# Use npm version to update package.json and package-lock.json
# --no-git-tag-version lets us handle the commit and tag ourselves for better control
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)

echo "✅ Updated version to $NEW_VERSION"

# Add changes and commit
git add package.json package-lock.json
git commit -m "chore: release $NEW_VERSION"

# Create a tag
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"

echo "📤 Pushing to GitHub..."
git push origin main
git push origin "$NEW_VERSION"

echo "✨ Successfully released $NEW_VERSION!"
echo "GitHub Actions will now start building the binaries. Check: https://github.com/vandenit/statement-convertor/actions"
