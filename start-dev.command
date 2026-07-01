#!/bin/bash
# Double-click this file in Finder to start the KamboGuide dev server.
# It opens in Terminal and stays running until you close the window.
cd "$(dirname "$0")"
echo "Starting KamboGuide dev server…"
echo "When you see  ➜  Local:  http://localhost:5173/  open that in your browser."
echo ""
npm run dev
