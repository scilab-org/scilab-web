const fs = require('fs');

const files = [
  'src/features/group-role-management/components/group-roles-view.tsx',
  'src/features/paper-management/components/paper-old-sections-manager.tsx',
  'src/features/paper-management/components/paper-sections-manager.tsx',
  'src/features/paper-management/components/paper-sections-readonly-dialog.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // For group-roles-view: <TableCell className="text-right"> ... <RemoveRolesFromGroup
  if (content.includes('<TableCell className="text-right">') && content.includes('RemoveRolesFromGroup')) {
    content = content.replace('<TableCell className="text-right">', '<TableCell className="text-center">');
  }

  // For paper-old-sections-manager.tsx:226: <TableCell className="text-right">
  if (f.includes('paper-old-sections-manager.tsx')) {
    content = content.replace('<TableCell className="text-right">', '<TableCell className="text-center">');
  }

  // For paper-sections-manager.tsx:675
  if (f.includes('paper-sections-manager.tsx')) {
    content = content.replace('<TableCell className="w-52 border-none py-3 text-right">', '<TableCell className="w-52 border-none py-3 text-center">');
  }

  // For paper-sections-readonly-dialog.tsx:199
  if (f.includes('paper-sections-readonly-dialog.tsx')) {
    content = content.replace('<TableCell className="text-right">', '<TableCell className="text-center">');
  }

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Fixed ${f}`);
  }
});
