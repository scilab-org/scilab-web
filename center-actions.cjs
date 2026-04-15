const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/features/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. TableHead with Action(s) and text-right -> text-center
  // Matches <TableHead ...>Actions</TableHead> or Action
  // We'll just look for TableHeads that contain text-right and Action
  const tableHeadRegex = /<TableHead([^>]*text-right[^>]*)>([^<]*Action[s]?[^<]*)<\/TableHead>/gi;
  content = content.replace(tableHeadRegex, (match, p1, p2) => {
    return `<TableHead${p1.replace('text-right', 'text-center')}>${p2}</TableHead>`;
  });

  // What about TableHeads where Actions is on next line?
  // Let's use a broader regex or string search
  // Actually, replacing all 'text-right' inside TableHead that eventually has Action is tricky with regex if there are newlines.
  // Let's just find TableHeads that have 'Action' text in them and if they have text-right, replace it.

  // Let's parse it more safely
  const parts = content.split('<TableHead');
  for (let i = 1; i < parts.length; i++) {
    const endIdx = parts[i].indexOf('</TableHead>');
    if (endIdx !== -1) {
      const headContent = parts[i].substring(0, endIdx);
      if (headContent.toLowerCase().includes('action') && headContent.includes('text-right')) {
        parts[i] = headContent.replace('text-right', 'text-center') + parts[i].substring(endIdx);
      }
    }
  }
  content = parts.join('<TableHead');

  // 2. TableCell for actions is usually the last one, or contains justify-end
  // Let's find TableCells that have justify-end inside them
  const cellParts = content.split('<TableCell');
  for (let i = 1; i < cellParts.length; i++) {
    const endIdx = cellParts[i].indexOf('</TableCell>');
    if (endIdx !== -1) {
      const cellContent = cellParts[i].substring(0, endIdx);
      if (cellContent.includes('justify-end') && cellContent.includes('Action')) {
         // Also replace text-right with text-center on the TableCell tag
         const tagEnd = cellContent.indexOf('>');
         let tagContent = cellContent.substring(0, tagEnd);
         tagContent = tagContent.replace('text-right', 'text-center');
         
         let innerContent = cellContent.substring(tagEnd);
         innerContent = innerContent.replace('justify-end', 'justify-center');
         
         cellParts[i] = tagContent + innerContent + cellParts[i].substring(endIdx);
      } else if (cellContent.includes('justify-end') && (cellContent.includes('Update') || cellContent.includes('Delete') || cellContent.includes('VIEW') || cellContent.includes('EDIT') || cellContent.includes('REMOVE') || cellContent.includes('CreateButton') || cellContent.includes('Button'))) {
         // Some cells don't have the text "Action", they just have buttons.
         const tagEnd = cellContent.indexOf('>');
         let tagContent = cellContent.substring(0, tagEnd);
         tagContent = tagContent.replace('text-right', 'text-center');
         
         let innerContent = cellContent.substring(tagEnd);
         innerContent = innerContent.replace('justify-end', 'justify-center');
         
         cellParts[i] = tagContent + innerContent + cellParts[i].substring(endIdx);
      } else if (cellContent.includes('text-right') && (cellContent.includes('Button') || cellContent.includes('Action') || cellContent.includes('DropdownMenu'))) {
         // Some cells only have text-right and buttons but not justify-end
         const tagEnd = cellContent.indexOf('>');
         let tagContent = cellContent.substring(0, tagEnd);
         tagContent = tagContent.replace('text-right', 'text-center');
         
         cellParts[i] = tagContent + cellContent.substring(tagEnd) + cellParts[i].substring(endIdx);
      }
    }
  }
  content = cellParts.join('<TableCell');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
