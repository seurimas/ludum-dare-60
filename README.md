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
- [src/CircleEditor.jsx](src/CircleEditor.jsx): individual circle controls.
- [src/CircleSymbol.jsx](src/CircleSymbol.jsx): shared circle and vector icons.
- [src/CardSheet.jsx](src/CardSheet.jsx): printable cards and overflow detection.
- [src/cards.js](src/cards.js): defaults, copying, and backup validation.
- [src/styles.css](src/styles.css): screen layout and print styles.
- [src/main.jsx](src/main.jsx): React entry point.
- [src/EnergyPage.jsx](src/EnergyPage.jsx): standalone `/energy` screen and symbols.
- [src/energy.js](src/energy.js): deterministic energy-card distribution.

```powershell
npm test
npm run build
npm run preview -- --open
```

Tests use Node's built-in test runner. The build produces a static app in `dist`;
preview serves that build locally. There is no router or additional UI framework.

## Energy cards

Open `/energy` (for example http://127.0.0.1:5173/energy), or follow **Energy cards**
from the main screen. This separate page does not read or change saved card data.
It generates four US Letter sheets with nine cards each (3 columns x 3 rows).
Every card is exactly 2 inches wide by 3 inches tall, including its border:

- 24 singles: eight each of Yonar, Tiltch, and Naxatu. Each shows its icon and name.
- 12 splits: four each of Yonar/Tiltch, Yonar/Naxatu, and Tiltch/Naxatu.
  Each shows both icons and names stacked vertically, separated by a horizontal
  line. Singles and splits share a sheet where needed
  to fill all four sheets without empty slots.
- Yonar uses a peace symbol, Tiltch a simple wooden club, and Naxatu an interrobang.
- Small icons repeat in all four corners. Split-card corners show both icons
  with a slash between them; the main icons and names remain stacked vertically.
- Every card provides 1 energy; no numbers are printed. Attack and Heal cards
  are not included.

Use **Print all cards / Save PDF** for the complete 36-card set. Print at 100% / Actual
size, US Letter portrait, with headers and footers off. The print button hides
the app controls and sheet headings before opening the print dialog and restores
them after printing or cancelling. Browser printing (Ctrl+P) also hides them.
The 3 mm card gaps and
at least half-inch outer margins are preserved, with the grid centered in the
printable area. The original card editor and its card sizes remain unchanged at `/`.

## Make cards

This revision initializes five pages with six cards each once, ignoring previous
revision data. After that, saved edits are restored on reload:

| Page | Card title suffix | Tribe counts |
| --- | --- | --- |
| Blue | Replicators | 3 nomi, 2 runite, 1 nuke |
| Red | Assemblers | 4 runite, 2 nomi |
| Green | Reassemblers | 3 nuke, 2 nomi, 1 runite |
| Black | Pulsars | 4 nuke, 1 nomi, 1 runite |
| White | Adapters | 2 nomi, 2 runite, 2 nuke |

Titles begin with the capitalized tribe. Numbered circles use these configurations:

- **Early:** 5; 4 with eye and star. Used by the nomi and runite Pulsars
  and the first three nuke Pulsars.
- **Late:** 5; 3 with star; 2 with eye and star. Used by the nuke Replicator,
  the first nuke Reassembler, the first two nomi Replicators, both nomi
  Reassemblers, the first two runite Assemblers, and both runite Replicators.
- **Standard:** 5; 3 with star. Used by all remaining cards, except Adapters
  have no stars.

Every row ends with a separate 1 cm power symbol, including Late rows and rows
with no numbered circles. Power is no longer a circle choice or counted toward
the three-circle limit. Numbered circles remain 2 cm in diameter.

The circle editor has one-click buttons for all three configurations, which
replace the complete circle row. Individual circles remain editable.
Costs retain the default 1 white. The initializer is `createInitialPages()` in
[src/cards.js](src/cards.js). New pages created with **+** remain blank.

- The first tab above the preview always shows the current page. The second is an
  **Other pages** dropdown containing every page except the current one (disabled
  when there is only one page).
- Click the final **+** tab to open a dialog, enter a page name, and choose
  **Create page** to start a blank 6-card page. Cancel or Escape leaves pages unchanged.
- Edit the name directly in the first tab to rename the current page.
- In the **+** dialog, **Duplicate page** makes an independent copy of the current
  page using the name entered in the dialog. **Delete page** removes the selected page after
  confirmation; the last remaining page cannot be deleted.
- **Clear page** clears only the selected page's cards, keeping its name and other pages.
- Click a card in the preview, or use Previous / Next to select one of 6 cards.
- Edit its title, tribe, center keywords, and **Card color** (red, blue, green,
  white, or black). Color names repeat along all four edges and appear as a large
  grey 45-degree background watermark. Card colors are text only, with no color fills.
- Use **Add circle** to add up to three circles (one at a time). Each row has a
  number (2-6) selector, a star toggle for below the circle, an optional
  Eye icon selector for above it, and an X to remove it. All circles have the same
  printed diameter of 2 cm at 100% / Actual size; eye and star positions stay
  aligned. Editor thumbnails stay compact. Removing every numbered circle leaves
  just the fixed power symbol.
- Add 1-5 cost rectangles. Each shows a whole number from 1 to 999 and its color
  name in black text on white. A new card starts with one white cost of 1.
- Use **Copy to next card** for similar cards.
- Text that does not fit triggers a warning; shorten it before printing.

Edits are saved in browser storage when available and restored on startup.
Download a backup to keep a separate copy.
Use **Download all pages** to keep all page names and cards in one version 5 JSON
backup, and **Open backup** to restore them. Opening a backup replaces all current
pages after confirmation. A backup is data, not a standalone program; open it
from the editor.

This version starts fresh with a new autosave key. Older backups (versions 1-4)
are not supported. Old browser saves are left untouched.

## Print

Click **Print all pages / Save PDF** to print every page in order in one print
dialog, with one sheet per page. **Print page / Save PDF** prints only the selected
page. Both actions check for clipped text; printing all pages checks every page.
The page name
is for organization and does not print on the cards. Choose:

- US Letter (8.5 x 11 inches), portrait.
- 100% / Actual size, not Fit to page.
- Headers and footers off.
- Grayscale or black-and-white printing is fine; no card or cost uses color fills.
- One page per sheet; retain the page's half-inch margins.

The page contains 2 columns by 3 rows of cards separated by 3 mm gaps, within a
7.5 x 10 inch printable area. Each card is approximately 9.38 x 8.27 cm; the
circles remain 2 cm in diameter. Cut along the
dashed borders. The editor and selection outlines do not print. You can also
choose your browser's Save as PDF destination.

If a print preview shows more than one page, check paper size, scaling, and margins.
