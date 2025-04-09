#!/bin/bash

echo "=== Checking Git Status Before Commit ==="
git status

echo -e "\n=== Adding All Changes ==="
git add .
git status

echo -e "\n=== Committing Changes ==="
git commit -m "Fix FEX quotes display by filtering out zero price quotes and update gitignore"
git status

echo -e "\n=== Pushing to GitHub ==="
git push -u origin main || git push -u origin master

echo -e "\n=== Verifying Commit History ==="
git log --oneline -n 5

echo -e "\n=== DONE! ==="
echo "Your changes have been committed and pushed to GitHub."
echo "To verify, check your GitHub repository at: https://github.com/phsolutionsllc/replit-quote" 