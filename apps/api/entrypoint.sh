#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

echo "Running database seed..."
node dist/seed/seed.js

echo "Starting application..."
node dist/main
