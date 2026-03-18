#!/bin/bash
# scheduler.sh - Control script for the sync scheduler

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PID_FILE="$DIR/scheduler.pid"
LOG_FILE="$DIR/scheduler.log"
LOOP_SCRIPT="$DIR/loop.sh"

case "$1" in
    start)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p "$PID" > /dev/null; then
                echo "Scheduler is already running with PID $PID"
                exit 0
            else
                echo "Found stale PID file. Removing..."
                rm "$PID_FILE"
            fi
        fi
        
        echo "Starting scheduler..."
        nohup "$LOOP_SCRIPT" > "$LOG_FILE" 2>&1 &
        NEW_PID=$!
        echo "$NEW_PID" > "$PID_FILE"
        echo "Scheduler started with PID $NEW_PID"
        echo "Logs are being written to $LOG_FILE"
        ;;
        
    stop)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p "$PID" > /dev/null; then
                echo "Stopping scheduler (PID $PID)..."
                kill "$PID"
                rm "$PID_FILE"
                echo "Scheduler stopped."
            else
                echo "Scheduler process $PID not found. Removing stale PID file."
                rm "$PID_FILE"
            fi
        else
            echo "Scheduler is not running (no PID file found)."
        fi
        ;;
        
    status)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p "$PID" > /dev/null; then
                echo "Scheduler is running with PID $PID"
            else
                echo "Scheduler is NOT running (Stale PID file found)"
            fi
        else
            echo "Scheduler is NOT running"
        fi
        ;;
        
    *)
        echo "Usage: $0 {start|stop|status}"
        exit 1
        ;;
esac
