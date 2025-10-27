import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

let childProcess = null;
let restartTimer = null;
let pendingRestart = false;

const startServer = () => {
  childProcess = spawn(process.execPath, ['src/server.js'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  childProcess.on('exit', (code, signal) => {
    const restarted = pendingRestart;
    pendingRestart = false;
    childProcess = null;
    if (restarted) {
      startServer();
      return;
    }
    if (signal === 'SIGTERM' || signal === 'SIGINT') {
      return;
    }
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.log(`[dev] Server exited with ${reason}. Waiting for changes to restart...`);
  });
};

const requestRestart = () => {
  if (!childProcess) {
    startServer();
    return;
  }
  if (pendingRestart) {
    return;
  }
  pendingRestart = true;
  childProcess.kill();
};

const scheduleRestart = () => {
  if (restartTimer) {
    clearTimeout(restartTimer);
  }
  restartTimer = setTimeout(() => {
    console.log('[dev] Change detected. Restarting server...');
    requestRestart();
  }, 120);
};

let watcher;
try {
  watcher = fs.watch(
    srcDir,
    { recursive: true },
    (eventType, filename) => {
      if (!filename) return;
      scheduleRestart();
    }
  );
  watcher.on('error', (error) => {
    console.error('[dev] Watcher error:', error.message);
  });
} catch (error) {
  console.error('[dev] Failed to start file watcher:', error.message);
  console.error('[dev] You may need to restart the server manually on changes.');
}

const cleanup = () => {
  if (watcher) {
    watcher.close();
  }
  if (childProcess) {
    childProcess.kill();
  }
};

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('exit', cleanup);

startServer();
