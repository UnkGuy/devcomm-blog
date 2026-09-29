const fs = require('fs');
let file = fs.readFileSync('src/components/post/RichTextEditor.tsx', 'utf8');

// A. Fix duplicate Link extension
file = file.replace(/Link\.configure\(\{[^}]+\}\),/g, ''); // Remove the first Link config
file = file.replace(/Link2, Dices/g, 'Link as LinkIcon, Dices'); // Rename lucide Link
file = file.replace(/<Link2/g, '<LinkIcon'); // Update toolbar icon usage
file = file.replace(/import Link from '@tiptap\/extension-link';/g, "import TiptapLink from '@tiptap/extension-link';");
file = file.replace(/Youtube\.configure/g, "TiptapLink.configure({\n        openOnClick: false,\n        HTMLAttributes: { class: 'text-[#c8aa6e] underline hover:text-[#f3e5c8] transition-colors cursor-pointer' },\n      }),\n      Youtube.configure");

// B. Fix immediatelyRender warning
file = file.replace(/content,/g, "content,\n    immediatelyRender: false,");

fs.writeFileSync('src/components/post/RichTextEditor.tsx', file);
