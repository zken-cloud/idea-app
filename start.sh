#!/bin/sh
set -e

# Provision database schema
echo "Provisioning database schema..."
npx prisma db push --skip-generate

# Start the Next.js application
echo "Starting application..."
node server.js
