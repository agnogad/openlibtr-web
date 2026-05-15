const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if(fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // size shorthand
    content = content.replace(/\bw-(\d+(?:\.\d+)?|\w+)\s+h-\1\b/g, 'size-$1');
    content = content.replace(/\bh-(\d+(?:\.\d+)?|\w+)\s+w-\1\b/g, 'size-$1');

    // paddings
    content = content.replace(/\bpx-(\d+(?:\.\d+)?|\w+)\s+py-\1\b/g, 'p-$1');
    content = content.replace(/\bpy-(\d+(?:\.\d+)?|\w+)\s+px-\1\b/g, 'p-$1');

    // font-bold on headings
    content = content.replace(/<(h[1-6])[^>]*className="([^"]*)font-bold([^"]*)"/g, '<$1 className="$2font-semibold$3"');
    content = content.replace(/<(h[1-6])[^>]*className=\{'([^']*)font-bold([^']*)'\}/g, '<$1 className={\'$2font-semibold$3\'}');
    content = content.replace(/<(h[1-6])[^>]*className=\{`([^`]*)font-bold([^`]*)`\}/g, '<$1 className={`$2font-semibold$3`}');

    // motion to m
    if (content.match(/<\/?motion\./)) {
      content = content.replace(/import\s+{([^}]*?)\bmotion\b([^}]*?)}\s+from\s+['"]motion\/react['"]/g, "import { $1m$2 } from 'motion/react'");
      content = content.replace(/import\s+{([^}]*?)\bmotion\b([^}]*?)}\s+from\s+['"]framer-motion['"]/g, "import { $1m$2 } from 'framer-motion'");
      content = content.replace(/<\/?motion\./g, match => match.replace('motion.', 'm.'));
    }

    // Three period ellipsis
    content = content.replace(/\b\.\.\.\b(?!([^<]*>)|([^\{]*\}))/g, '&hellip;');
    
    // Sort
    content = content.replace(/\[\.\.\.(.*?)\]\.sort\(/g, '$1.toSorted(');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
