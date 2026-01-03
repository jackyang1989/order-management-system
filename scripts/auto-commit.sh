#!/bin/bash

# Auto-commit script for order-management-system
# Runs every 15 minutes to automatically commit changes

REPO_DIR="/Users/jianouyang/.gemini/antigravity/scratch/order-management-system"
LOG_FILE="/Users/jianouyang/.gemini/antigravity/scratch/order-management-system/.git/auto-commit.log"

cd "$REPO_DIR" || exit 1

# Check if there are any changes
if [[ -n $(git status --porcelain) ]]; then
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    
    # Add all changes
    git add -A
    
    # Commit with timestamp
    git commit -m "auto: snapshot at $TIMESTAMP"
    
    echo "[$TIMESTAMP] Auto-committed changes" >> "$LOG_FILE"
else
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] No changes to commit" >> "$LOG_FILE"
fi
