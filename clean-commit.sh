#!/bin/bash

echo "=== Adding all changes including deleted files ==="
git add --all

echo "=== Committing changes ==="
git commit -m "Fix FEX quotes display and remove large unnecessary files"

echo "=== Pushing to GitHub ==="
git push origin main || git push origin master

echo "=== Done! ==="
echo "Your changes have been committed and pushed to GitHub."
echo "The large file has been removed from the repository." 