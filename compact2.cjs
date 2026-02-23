const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components');

const replacements = [
  { from: /\bp-12\b/g, to: 'p-4' },
  { from: /\bp-10\b/g, to: 'p-4' },
  { from: /\bp-8\b/g, to: 'p-3' },
  { from: /\bp-6\b/g, to: 'p-3' },
  { from: /\bp-5\b/g, to: 'p-2' },
  { from: /\bp-4\b/g, to: 'p-2' },
  { from: /\bpy-12\b/g, to: 'py-4' },
  { from: /\bpy-10\b/g, to: 'py-4' },
  { from: /\bpy-8\b/g, to: 'py-3' },
  { from: /\bpy-6\b/g, to: 'py-3' },
  { from: /\bpy-5\b/g, to: 'py-2' },
  { from: /\bpy-4\b/g, to: 'py-2' },
  { from: /\bpx-12\b/g, to: 'px-4' },
  { from: /\bpx-10\b/g, to: 'px-4' },
  { from: /\bpx-8\b/g, to: 'px-3' },
  { from: /\bpx-6\b/g, to: 'px-3' },
  { from: /\bpx-5\b/g, to: 'px-2' },
  { from: /\bpx-4\b/g, to: 'px-2' },
  { from: /\bgap-12\b/g, to: 'gap-4' },
  { from: /\bgap-10\b/g, to: 'gap-4' },
  { from: /\bgap-8\b/g, to: 'gap-3' },
  { from: /\bgap-6\b/g, to: 'gap-2' },
  { from: /\bgap-5\b/g, to: 'gap-2' },
  { from: /\bgap-4\b/g, to: 'gap-1' },
  { from: /\bmb-12\b/g, to: 'mb-4' },
  { from: /\bmb-10\b/g, to: 'mb-4' },
  { from: /\bmb-8\b/g, to: 'mb-3' },
  { from: /\bmb-6\b/g, to: 'mb-2' },
  { from: /\bmb-5\b/g, to: 'mb-2' },
  { from: /\bmb-4\b/g, to: 'mb-1' },
  { from: /\bmt-12\b/g, to: 'mt-4' },
  { from: /\bmt-10\b/g, to: 'mt-4' },
  { from: /\bmt-8\b/g, to: 'mt-3' },
  { from: /\bmt-6\b/g, to: 'mt-2' },
  { from: /\bmt-5\b/g, to: 'mt-2' },
  { from: /\bmt-4\b/g, to: 'mt-1' },
  { from: /\bspace-y-12\b/g, to: 'space-y-4' },
  { from: /\bspace-y-10\b/g, to: 'space-y-4' },
  { from: /\bspace-y-8\b/g, to: 'space-y-3' },
  { from: /\bspace-y-6\b/g, to: 'space-y-2' },
  { from: /\bspace-y-5\b/g, to: 'space-y-2' },
  { from: /\bspace-y-4\b/g, to: 'space-y-1' },
  { from: /\brounded-\[2\.5rem\]\b/g, to: 'rounded-xl' },
  { from: /\brounded-\[2rem\]\b/g, to: 'rounded-lg' },
  { from: /\brounded-3xl\b/g, to: 'rounded-lg' },
  { from: /\brounded-2xl\b/g, to: 'rounded-md' },
  { from: /\brounded-xl\b/g, to: 'rounded-md' },
  { from: /\btext-6xl\b/g, to: 'text-3xl' },
  { from: /\btext-5xl\b/g, to: 'text-2xl' },
  { from: /\btext-4xl\b/g, to: 'text-xl' },
  { from: /\btext-3xl\b/g, to: 'text-lg' },
  { from: /\btext-2xl\b/g, to: 'text-base' },
  { from: /\btext-xl\b/g, to: 'text-sm' },
  { from: /\btext-lg\b/g, to: 'text-sm' },
  { from: /\bh-32\b/g, to: 'h-16' },
  { from: /\bw-32\b/g, to: 'w-16' },
  { from: /\bh-24\b/g, to: 'h-12' },
  { from: /\bw-24\b/g, to: 'w-12' },
  { from: /\bh-16\b/g, to: 'h-10' },
  { from: /\bw-16\b/g, to: 'w-10' },
  { from: /\bh-14\b/g, to: 'h-8' },
  { from: /\bw-14\b/g, to: 'w-8' },
  { from: /\bh-12\b/g, to: 'h-8' },
  { from: /\bw-12\b/g, to: 'w-8' },
  { from: /\bh-10\b/g, to: 'h-6' },
  { from: /\bw-10\b/g, to: 'w-6' },
  { from: /\bmin-h-screen\b/g, to: 'min-h-[100dvh]' }
];

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      for (const { from, to } of replacements) {
        content = content.replace(from, to);
      }
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(dir);
