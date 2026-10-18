# Card Sheet Maker

## Run

Install Node.js 20.19+ or 22.12+ (a current LTS release is recommended).
In this folder, run:

```powershell
npm install
npm run dev -- --open
```

Installation is only needed the first time or after dependencies change.
Stop the server with Ctrl+C. No account, backend, or internet connection is
needed after installation. This is a React app, not a double-click HTML file.

```powershell
npm test
npm run build
npm run preview -- --open
```

Tests use Node's built-in test runner. The build produces a static app in `dist`;
preview serves that build locally. There is no router or additional UI framework.

## Non-energy cards

The editor at `/` generates a new 24-card spread once for this revision, ignoring
older saved data. Later reloads restore edits using the new version 6 autosave
key. Old saves are left untouched; backups from versions 1-5 are not supported.

Cards are exactly **2.4 inches wide by 3.4 inches tall**, including their border.
Six cards fit on a Letter sheet in three columns and two rows with 3 mm gaps.
The initial spread fills four sheets, mixing tribes where needed:

- Eight cards each for Yonar, Tiltch, and Naxatu, named "Yonar 1", etc.
- Each tribe has three 3-cost, two 4-cost, two 5-cost, and one 6-cost card.
- Cards start without rules text or optional circles.

The name is at the top-left, with a small uppercase tribe underneath. Cost is
a right-aligned row of 3-6 small circles containing that tribe's symbol, to the
right of the name. Yonar, Tiltch, and Naxatu use the same icons as energy cards.
The rest of the card holds editable text and optional numbered circles.
Old color edge labels, watermarks, cost rectangles, and automatic power symbols
are removed.

### Components and circles

Toggle **Component** in the editor to rotate the content 90 degrees within the
same portrait cut outline. The card reads in landscape, with a name and 3-6
numbered circles, but no tribe, cost, or rules text. Switching to Component
adds circles if needed to reach three. Hidden tribe, cost, and text values are
retained when switching back.

Numbered circles remain exactly 2 cm in diameter. Up to six can be edited, with
values 2-6, a star below, and an optional eye above. Components wrap three
circles per row; regular cards wrap two per row. Component decorations are
smaller to fit two rows without shrinking the circles. Components cannot have
fewer than three circles. Regular cards can have none.

Early, Late, and Standard circle presets remain available; only presets meeting
the component minimum are offered for components. Text and circles share the
remaining space on regular cards. Overflow warnings identify cards needing
shorter text or fewer circles before printing.

### Pages and backups

- Click a card, use Previous / Next, or select its number to edit it.
- The first tab is the editable current-page name; **Other pages** switches pages.
- **+** opens a naming dialog to create a blank page or duplicate the current one.
  Cancel or Escape leaves pages unchanged.
- **Delete page** removes the current page after confirmation; the last page
  cannot be deleted. **Clear page** resets its six cards.
- **Copy to next card** makes an independent copy after confirmation.
- **Download all pages** saves a version 6 JSON backup. **Open backup** replaces
  all pages after validation and confirmation. Backups are data, not standalone
  programs.

## Energy cards

Open `/energy` (for example http://127.0.0.1:5173/energy), or follow **Energy cards**
from the main screen. This separate page does not read or change saved card data.
It generates four US Letter sheets with nine cards each (3 columns x 3 rows).
Every energy card remains exactly **2 inches wide by 3 inches tall**:

- 24 singles: eight each of Yonar, Tiltch, and Naxatu, with icon and name.
- 12 splits: four each of Yonar/Tiltch, Yonar/Naxatu, and Tiltch/Naxatu, with
  icons and names stacked vertically, separated by a horizontal line.
- Yonar uses a peace symbol, Tiltch a tilted outlined wooden club with an oval
  texture detail, and Naxatu an interrobang.
- Small icons repeat in all four corners; split corners have both icons with
  a slash between them.
- Every card provides 1 energy; no numbers are printed. No Attack or Heal cards.

**Print all cards / Save PDF** prints the complete energy set. The button hides
controls and sheet headings before opening the dialog and restores them after
printing or cancelling. Ctrl+P also hides them.

## Printing

For non-energy cards, **Print all pages / Save PDF** prints all named pages;
**Print page / Save PDF** prints only the selected page. Both check for clipped
content. Page names and editor controls are not printed.

For either screen, choose:

- US Letter (8.5 x 11 inches), portrait.
- 100% / Actual size, not Fit to page.
- Headers and footers off; one page per sheet.
- Half-inch margins; grayscale or black-and-white is fine.

The grid is centered in a 7.5 x 10 inch printable area with 3 mm card gaps.
Cut along the dashed borders. Use the browser's Save as PDF destination if desired.

## Project structure

- [src/App.jsx](src/App.jsx): non-energy state, autosaving, backups, printing.
- [src/cards.js](src/cards.js): card defaults, initialization, copying, validation.
- [src/CardEditor.jsx](src/CardEditor.jsx): card fields and Component toggle.
- [src/CardSheet.jsx](src/CardSheet.jsx): printed cards and overflow detection.
- [src/PageSelector.jsx](src/PageSelector.jsx): page tabs and naming dialog.
- [src/CircleEditor.jsx](src/CircleEditor.jsx): numbered-circle editing and presets.
- [src/CircleSymbol.jsx](src/CircleSymbol.jsx): circles, stars, and eye decorations.
- [src/EnergyIcon.jsx](src/EnergyIcon.jsx): shared tribe and energy SVG icons.
- [src/EnergyPage.jsx](src/EnergyPage.jsx): standalone energy screen.
- [src/energy.js](src/energy.js): tribe symbols and energy distribution.
- [src/styles.css](src/styles.css): shared UI and non-energy print layout.
- [src/energy.css](src/energy.css): energy-card layout.
- [src/main.jsx](src/main.jsx): React entry point and screen selection.
