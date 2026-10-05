# Annotate

Minimalist image annotation tool for quick markups, redactions and crops. Runs fully in the browser, nothing is uploaded anywhere.

Live version: https://anot.lukaulcar.com

## Features

- Upload via drag & drop, file picker, or paste (Ctrl+V)
- Tools: rectangle, arrow, circle, line, freehand pen, text, redact, crop, saturation
- Select, move, resize, duplicate (Ctrl+D) and delete annotations
- Undo / redo, clear all
- Custom colors, stroke width, fill toggle, font size
- Crop with presets and rule-of-thirds overlay
- Export as PNG or JPG at full resolution, or copy to clipboard
- Session auto-save in IndexedDB (survives refresh), with localStorage fallback
- Keyboard shortcuts (click the `?` icon in the top bar for the full list)

## Run it locally

Requirements: Node.js 18+ and npm.

```bash
git clone https://github.com/lukaulcar/Anot
cd Anot
npm install
npm run dev
```

Open http://localhost:5173.

Other commands:

```bash
npm run build    # production build into dist/
npm run preview  # preview the production build
npm run lint     # run oxlint
```

## Notes

- Images stay local. They are stored in your browser's IndexedDB only so a refresh doesn't lose work.
- Clipboard copy needs HTTPS or localhost and works best in Chrome / Edge.
- JPG export flattens transparency onto white. PNG keeps it.

## License

MIT. Made by [lukaulcar.com](https://lukaulcar.com).
