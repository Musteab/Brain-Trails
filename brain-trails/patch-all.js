const fs = require('fs');
const path = require('path');

const DIRS = ['./app', './components', './lib', './stores', './hooks'];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('.next')) walk(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      patch(full);
    }
  }
}

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // First, completely un-cast anything we already casted to prevent nested ((... as any) as any)
  // We look for: (supabase.from("...") as any) or (supabase.from('...') as any)
  content = content.replace(/\(\s*supabase\s*\.\s*from\s*\(\s*(['"][^'"]+['"])\s*\)\s*as\s+any\s*\)/g, 'supabase.from($1)');

  // Now, cast EVERYTHING
  // supabase.from("table") -> (supabase.from("table") as any)
  content = content.replace(/supabase\s*\.\s*from\s*\(\s*(['"][^'"]+['"])\s*\)/g, '(supabase.from($1) as any)');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Patched universally: ' + file);
  }
}

DIRS.forEach(walk);
