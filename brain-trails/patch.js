const fs = require('fs');
const path = require('path');

const TABLES = ['daily_quests', 'support_tickets'];
const DIRS = ['./app', './components', './lib', './stores', './hooks'];

function walk(dir) {
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

  for (const table of TABLES) {
    const regex1 = new RegExp(`supabase\\.from\\("${table}"\\)`, 'g');
    const regex2 = new RegExp(`supabase\\.from\\('${table}'\\)`, 'g');
    const regex3 = new RegExp(`supabase\\s*\\.\\s*from\\("${table}"\\)`, 'g');
    const regex4 = new RegExp(`supabase\\s*\\.\\s*from\\('${table}'\\)`, 'g');
    
    content = content.replace(regex1, `(supabase.from("${table}") as any)`);
    content = content.replace(regex2, `(supabase.from('${table}') as any)`);
    content = content.replace(regex3, `(supabase.from("${table}") as any)`);
    content = content.replace(regex4, `(supabase.from('${table}') as any)`);
  }

  content = content.replace(/\(\(supabase\.from/g, '(supabase.from');
  content = content.replace(/as any\) as any\)/g, 'as any)');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Patched: ' + file);
  }
}

DIRS.forEach(walk);
