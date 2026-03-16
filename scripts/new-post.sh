#!/bin/bash
# Generate a new blog post template for Gas Champion

SLUG="${1:-new-post}"
DATE=$(date +%Y-%m-%d)
FILE="src/content/blog/${SLUG}.md"

if [ -f "$FILE" ]; then
  echo "Error: $FILE already exists"
  exit 1
fi

cat > "$FILE" << EOF
---
title: "Your Post Title"
description: "A brief description for SEO and social sharing."
date: ${DATE}
tags: ["Tips"]
author: "Lee — Gas Champion"
draft: true
---

Write your content here.

---

*Need help with your heating? [Contact Gas Champion](/contact) or call **07828 943 186**. Gas Safe registered (636427).*
EOF

echo "Created: $FILE"
echo "Edit the file, then set draft: false when ready to publish."
