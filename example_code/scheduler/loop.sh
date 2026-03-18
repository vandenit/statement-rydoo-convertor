#!/bin/bash
# loop.sh - Infinite loop to run the client every 5 minutes

# Determine the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$DIR/.."

echo "Starting scheduler loop..."

while true; do
    echo "[$(date)] Triggering sync..."
    
    # Run the client
    cd "$PROJECT_ROOT"
    npm start >> "$DIR/scheduler.log" 2>&1
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[$(date)] Sync successful"
    else
        echo "[$(date)] Sync failed (Exit code: $EXIT_CODE)"
    fi
    
    # Sleep for 2 minutes
    sleep 120
done
