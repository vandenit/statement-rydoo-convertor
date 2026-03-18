# Scheduler Documentation

This directory contains the scripts to run the `poc-client` on a scheduled interval (every 5 minutes).

## Mechanism

The scheduler consists of two main scripts:
1.  **`scheduler.sh`**: The control script. It handles starting, stopping, and checking the status of the background process. It manages the `scheduler.pid` file.
2.  **`loop.sh`**: The worker script. It runs in an infinite loop, executing `npm start` (from the project root) every 5 minutes and logging the output to `scheduler.log`.

## Usage

You can control the scheduler using NPM scripts defined in `package.json` or by calling the shell script directly.

### Start the Scheduler
Run the scheduler in the background:
```bash
npm run scheduler:start
# OR
bash scheduler/scheduler.sh start
```

### Stop the Scheduler
Stop the running background process:
```bash
npm run scheduler:stop
# OR
bash scheduler/scheduler.sh stop
```

### Check Status
Check if the scheduler is running:
```bash
bash scheduler/scheduler.sh status
```

## Logs

Output from the scheduler and the `npm start` execution is redirected to:
`scheduler/scheduler.log`

To watch the logs live:
```bash
tail -f scheduler/scheduler.log
```
