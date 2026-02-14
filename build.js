const fs = require('fs');
const path = require('path');

/**
 * build.js
 * This script is run during the Vercel build process.
 * It replaces the Supabase placeholder strings in index.html with
 * actual environment variables configured in Vercel.
 */

const htmlFiles = ['index.html', 'second_form.html'];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`${file} not found, skipping...`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const supabaseUrl = process.env.SUPABASE_URL || '___SUPABASE_URL___';
  const supabaseKey = process.env.SUPABASE_KEY || '___SUPABASE_KEY___';

  console.log(`Injecting environment variables into ${file}...`);
  content = content.replace(/___SUPABASE_URL___/g, supabaseUrl);
  content = content.replace(/___SUPABASE_KEY___/g, supabaseKey);

  fs.writeFileSync(filePath, content);
  console.log(`Build complete: ${file} updated.`);
});
