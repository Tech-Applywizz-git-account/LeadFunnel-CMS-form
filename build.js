const fs = require('fs');
const path = require('path');

/**
 * build.js
 * This script is run during the Vercel build process.
 * It replaces the Supabase placeholder strings in index.html with
 * actual environment variables configured in Vercel.
 */

const indexPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found!');
  process.exit(1);
}

let content = fs.readFileSync(indexPath, 'utf8');

// Replace Supabase URL
const supabaseUrl = process.env.SUPABASE_URL || '___SUPABASE_URL___';
const supabaseKey = process.env.SUPABASE_KEY || '___SUPABASE_KEY___';

console.log('Injecting environment variables...');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not Set');
console.log('SUPABASE_KEY:', supabaseKey ? 'Set' : 'Not Set');

content = content.replace(/___SUPABASE_URL___/g, supabaseUrl);
content = content.replace(/___SUPABASE_KEY___/g, supabaseKey);

// Write back to index.html
fs.writeFileSync(indexPath, content);
console.log('Build complete: index.html updated.');
