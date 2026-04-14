const fs = require('fs');
const glob = require('glob');

const files = [
  'src/features/journal-management/components/journals-filter.tsx',
  'src/features/paper-management/components/papers-filter.tsx',
  'src/features/paper-template-management/components/paper-templates-filter.tsx',
  'src/features/project-management/components/projects/projects-filter.tsx',
  'src/features/tag-management/components/tags-filter.tsx',
  'src/features/user-management/components/users-filter.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the button and svg
  const regex = /className="text-muted-foreground hover:text-foreground hover:bg-muted\/40 flex h-10 items-center justify-center rounded-md px-4 transition-colors"[\s\S]*?<svg[\s\S]*?<\/svg>/;
  
  if (regex.test(content)) {
    content = content.replace(regex, 'className="text-muted-foreground hover:text-foreground hover:bg-muted/40 flex h-10 items-center justify-center rounded-md px-6 font-sans text-sm font-medium transition-colors"\n      >\n        Search');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Replaced in ' + file);
  } else {
    console.log('Not found in ' + file);
  }
});
