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

- [src/App.jsx](src/App.jsx): page state, autosaving, backup actions, and printing.
- [src/PageSelector.jsx](src/PageSelector.jsx): page selection, names, and actions.
- [src/CardEditor.jsx](src/CardEditor.jsx): card fields and cost controls.
- [src/CardSheet.jsx](src/CardSheet.jsx): printable cards and overflow detection.
- [src/cards.js](src/cards.js): defaults, copying, and backup validation/migration.
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

- The first tab above the preview always shows the current page. The second is an
  **Other pages** dropdown containing every page except the current one (disabled
  when there is only one page).
- Click the final **+** tab to open a dialog, enter a page name, and choose
  **Create page** to start a blank 12-card page. Cancel or Escape leaves pages unchanged.
- Edit the name directly in the first tab to rename the current page.
- In the **+** dialog, **Duplicate page** makes an independent copy of the current
  page using the name entered in the dialog. **Delete page** removes the selected page after
  confirmation; the last remaining page cannot be deleted.
- **Clear page** clears only the selected page's cards, keeping its name and other pages.
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
Use **Download all pages** to keep all page names and cards in one version 2 JSON
backup, and **Open backup** to restore them. Opening a backup replaces all current
pages after confirmation. A backup is data, not a standalone program; open it
from the editor.

Existing single-sheet autosaves and version 1 JSON backups still work and become
one page named "Page 1". Before
switching from the old app, download a backup there and open it in this app:
the browser cannot transfer local-file storage to a localhost address automatically.

## Print

Click **Print page / Save PDF** to print only the selected page. The page name
is for organization and does not print on the cards. Choose:

- US Letter (8.5 x 11 inches), portrait.
- 100% / Actual size, not Fit to page.
- Headers and footers off.
- Background graphics on, and color printing for colored costs.
- One page per sheet; retain the page's half-inch margins.

The page contains 3 columns by 4 rows of 2.5-inch square cards. Cut along the
dashed borders. The editor and selection outlines do not print. You can also
choose your browser's Save as PDF destination.

If a print preview shows more than one page, check paper size, scaling, and margins.
