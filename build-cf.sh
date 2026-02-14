#!/bin/bash
# Cloudflare Pages build script
# Removes server-only dependencies before install to avoid native compilation timeouts

node --input-type=commonjs -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
['better-sqlite3', 'express', 'cors', 'bcryptjs', 'jsonwebtoken'].forEach(d => delete p.dependencies[d]);
['@types/better-sqlite3', '@types/cors', '@types/express', '@types/jsonwebtoken', '@types/bcryptjs', 'tsx'].forEach(d => delete p.devDependencies[d]);
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
console.log('Stripped server dependencies from package.json');
"

npm install
npx vite build
