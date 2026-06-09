const net = require('net');

const HOST = process.env.DB_HOST || 'localhost';
const PORT = parseInt(process.env.DB_PORT || '5432', 10);
const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 1000;

let retries = 0;

function tryConnect() {
  const socket = new net.Socket();

  socket.setTimeout(RETRY_INTERVAL_MS);

  socket.on('connect', () => {
    console.log(`PostgreSQL is ready on ${HOST}:${PORT}`);
    socket.destroy();
    process.exit(0);
  });

  socket.on('error', () => {
    socket.destroy();
    retry();
  });

  socket.on('timeout', () => {
    socket.destroy();
    retry();
  });

  socket.connect(PORT, HOST);
}

function retry() {
  retries++;
  if (retries >= MAX_RETRIES) {
    console.error(`Could not connect to PostgreSQL on ${HOST}:${PORT} after ${MAX_RETRIES} attempts`);
    process.exit(1);
  }
  console.log(`Waiting for PostgreSQL... (attempt ${retries}/${MAX_RETRIES})`);
  setTimeout(tryConnect, RETRY_INTERVAL_MS);
}

console.log(`Waiting for PostgreSQL on ${HOST}:${PORT}...`);
tryConnect();
