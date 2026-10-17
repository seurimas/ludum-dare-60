# Card Sheet Maker

## Run

Install Node.js 20.19+ or 22.12+ (a current LTS release is recommended).
In this folder, run:

```powershell
npm install
npm run dev -- --open
```

Installation is only needed the first time or after dependencies change.
The second command starts the app and opens it in your browser. Stop it with
Ctrl+C. No account, backend, or internet connection is needed after installation.
The source HTML is now a React entry point, not a double-click standalone app.

## Project structure

- [src/App.jsx](src/App.jsx): sheet state, autosaving, backup actions, and printing.
- [src/CardEditor.jsx](src/CardEditor.jsx): card fields and cost controls.
- [src/CardSheet.jsx](src/CardSheet.jsx): printable cards and overflow detection.
- [src/cards.js](src/cards.js): defaults, copying, and version 1 backup validation.
- [src/styles.css](src/styles.css): screen layout and print styles.
- [src/main.jsx](src/main.jsx): React entry point.

```powershell
npm test
npm run build
npm run preview -- --open
```

Tests use Node's built-in test runner. The build produces a static app in `dist`;
preview serves that build locally. There is no router or additional UI framework.

## Make cards

- Click a card in the preview, or use Previous / Next to select one of 12 cards.
- Edit its title, tribe, and center keywords.
- Choose no circles or a row of 2-5 equal-size, empty circles.
- Add 1-5 cost rectangles. Each has a red, blue, green, white, or black background
  and a whole number from 1 to 999. A new card starts with one white cost of 1.
- Use **Copy to next card** for similar cards.
- Text that does not fit triggers a warning; shorten it before printing.

Changes are saved automatically in this browser when browser storage is available.
Saves are tied to the browser and site address (including the port). Changing
browsers, private browsing, or clearing browser data may lose access to that save.
Use **Download backup** to keep your cards as a JSON file, and **Open backup** to
restore them. A backup is data, not a standalone program; open it from the editor.

Existing version 1 JSON backups from the original HTML app still work. Before
switching from the old app, download a backup there and open it in this app:
the browser cannot transfer local-file storage to a localhost address automatically.

## Print

Click **Print / Save PDF**. Choose:

- US Letter (8.5 x 11 inches), portrait.
- 100% / Actual size, not Fit to page.
- Headers and footers off.
- Background graphics on, and color printing for colored costs.
- One page per sheet; retain the page's half-inch margins.

The page contains 3 columns by 4 rows of 2.5-inch square cards. Cut along the
dashed borders. The editor and selection outlines do not print. You can also
choose your browser's Save as PDF destination.

If a print preview shows more than one page, check paper size, scaling, and margins.
