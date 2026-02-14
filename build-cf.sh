#!/bin/bash
# Cloudflare Pages build script
# Removes server-only dependencies before install to avoid native compilation timeouts

node -e "
const p = require('./package.json');
const serverDeps = ['better-sqlite3', 'express', 'cors', 'bcryptjs', 'jsonwebtoken'];
serverDeps.forEach(d => delete p.dependencies[d]);
const serverDevDeps = ['@types/better-sqlite3', '@types/cors', '@types/express', '@types/jsonwebtoken', '@types/bcryptjs', 'tsx'];
serverDevDeps.forEach(d => delete p.devDependencies[d]);
require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2));
"

npm install
npx vite build
