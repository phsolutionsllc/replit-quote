#!/bin/bash

# Add all changes
git add .

# Commit
git commit -m "Fix FEX quotes display by filtering out zero price quotes and update gitignore"

# Push to GitHub
git push -u origin main || git push -u origin master

echo "Changes pushed to GitHub" 