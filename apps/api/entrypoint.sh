#!/bin/sh
set -e

echo "Running database migrations..."
node /app/node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma

echo "Running database seed..."
node dist/seed/seed.js

echo "Starting application..."
node dist/main
