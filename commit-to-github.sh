#!/bin/bash

# Initialize Git repository if not already initialized
if [ ! -d .git ]; then
  echo "Initializing Git repository..."
  git init
fi

# Configure Git user (replace with your info if needed)
git config --global user.name "QuoteApp Developer"
git config --global user.email "developer@example.com"

# Add all files
echo "Adding files to Git..."
git add .

# Commit with message
echo "Committing changes..."
git commit -m "Fix FEX quotes display by filtering out zero price quotes"

# Ask for GitHub repository URL
echo "Please enter your GitHub repository URL (e.g., https://github.com/username/repo.git):"
read REPO_URL

# Add the remote repository
echo "Adding remote repository..."
git remote add origin $REPO_URL

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin master || git push -u origin main

echo "Done! Your code has been pushed to GitHub." 