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

The editor at `/` restores existing cards. It generates the initial 24-card spread
only when no save exists. Version 6 was the last explicitly requested reset;
older saves remain untouched and are not automatically resurrected.

### Data preservation policy

- `card-sheet-maker-v6` is now a permanent storage key, not a key to bump for
  future formats. Format changes must migrate existing saves, preserving every
  card, page, and user field, with regression tests for the old format.
- Never reseed, drop cards, or silently substitute defaults to handle an
  unsupported or damaged save. Loading fails visibly and editing is blocked;
  existing saved bytes remain untouched.
- Loading a valid save does not rewrite it. Unknown page, card, and circle fields
  survive validation and subsequent saves.
- If another tab changes the save, this editor refuses to overwrite it. Download
  unsaved edits before reloading.
- Only explicit user actions (confirmed clears, deletion, copying over a card,
  or backup replacement) may intentionally remove existing cards or content.
- Backups from versions 1-5 predate this preservation baseline and remain
  unsupported; no new format may repeat that reset policy.

Cards are exactly **2.4 inches wide by 3.4 inches tall**, including their border.
Six cards fit on a Letter sheet in three columns and two rows with 3 mm gaps.
The initial spread fills four sheets, mixing tribes where needed:

- Eight cards each for Yonar, Tiltch, and Naxatu, named "Yonar 1", etc.
- Each tribe has three 3-cost, two 4-cost, two 5-cost, and one 6-cost card.
- Cards start without rules text or optional circles.

The name is at the top-left, with a small uppercase tribe underneath. Cost is
a right-aligned row of 3-6 small circles containing that tribe's symbol, to the
right of the name. Yonar, Tiltch, and Naxatu use the same icons as energy cards.
The rest of the card holds editable text and optional circles.
**Starter** is an additional tribe choice, with no printed tribe-cost circles
and no **1 tribe** / **2 tribe** shortcuts. The saved cost is retained when
switching tribes; general circle editing and non-tribe shortcuts remain available.
Starter does not add cards to the initial spread or to the energy set.

**Omni** is another additional tribe choice. It keeps the normal 3-6 cost
selector, but prints its cost as one circle of each symbol tribe (Yonar,
Tiltch, Naxatu) followed by empty circles for any cost above 3 (so a cost of 3
prints exactly the three tribe symbols, a cost of 6 adds three empty circles
after them). It has no **1 tribe** / **2 tribe** shortcuts, since there is no
single tribe symbol to use. Omni does not add cards to the initial spread or
to the energy set.

Non-component cards also have three **Attachables** text slots: left, right, and
bottom. Each nonempty slot prints an outlined half ellipse (0.45 in deep, 1.4 in
along the edge) with its flat side on the card edge and 16 px text inside it (up
to two short lines). Side markers are centered in the bottom half of the card;
the bottom marker is centered on the bottom edge. Side text reads along each edge
with its top facing the card edge (left reads top-to-bottom, right reads
bottom-to-top); bottom text reads horizontally.
Empty or whitespace-only slots do not print or reserve space. The bottom marker
reserves space from the main content; side markers do not, and the preview warns
if rules text overlaps them. A non-component card has either circles or side
markers, not both: the editor blocks adding one while the other is present, and
existing cards that have both still load unchanged but show a warning.
Attachables are hidden (not deleted) for components. Existing saves without this
optional field load unchanged; backups and print snapshots retain it.
Old color edge labels, watermarks, cost rectangles, and automatic power symbols
are removed.

### Relics

Toggle **Relic** in the editor for a third card type, mutually exclusive with
**Component** (turning one on turns the other off). Relic cards stay upright in
the same cut outline and keep their Name, but hide Tribe, Cost, Attachables, and
Circles. The content area is split into three fixed, equal thirds - top, middle,
and bottom - each with its own free-text box above a centered, fixed row of
unlabeled 8 mm square boxes: 3 boxes on top, 3 in the middle, and 4 on the
bottom. The boxes carry no data and are not editable; they are always that
count. Hidden tribe, cost, attachable, and circle values are retained when
switching away from Relic.

### Components and circles

Toggle **Component** in the editor to rotate the content 90 degrees within the
same portrait cut outline. The card reads in landscape, with a name, optional
text (the same Text field, shown above the circles when not empty), and up to six
circles, but no tribe or cost. Switching to Component
preserves the current circles, including zero, one, or two. Hidden tribe, cost, and attachable values are
retained when switching back.

Circles remain exactly 2 cm in diameter. Each contains nothing, a Yonar/Tiltch/Naxatu
symbol, an equal sign, or an asterisk. Nothing appears above or below a circle.
Both regular cards and components support zero to six circles. Components wrap
three circles per row; regular cards wrap two per row.

Shortcuts replace the card's current circles:
- **1 tribe** / **2 tribe**: one or two circles containing the card's tribe symbol.
- **1 any**: one empty circle.
- **special**: keeps the current number of circles, changing every content to an
  asterisk (disabled when there are no circles).

Components expose a non-printed shortcut tribe selector. Each circle can also
be edited or removed independently. Old numbered circles or decoration fields
are a data consistency error: loading stops and saved bytes stay untouched,
without clearing or converting any card. Empty circle lists remain compatible.
Text and circles share the
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

Both non-energy Print buttons first save a restorable JSON snapshot in the project
directory, named `printed-cards-<UTC timestamp>-<unique ID>.json`. Selected-page
printing includes only that page; print-all includes every page in order.
Snapshots never replace browser saves or earlier snapshots. They are saved even
if the print dialog is subsequently cancelled, and can be opened with **Open backup**.
If the snapshot cannot be saved, printing stops with an error.

This requires the local server (`npm run dev` or `npm run preview`); a static-only
deployment cannot write to the project directory. Energy printing does not save
snapshots. Browser Ctrl+P bypasses this save step; use the app's Print buttons.

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
- [src/cardStorage.js](src/cardStorage.js): guarded loading and saving without reset fallbacks.
- [src/CardEditor.jsx](src/CardEditor.jsx): card fields and Component toggle.
- [src/CardSheet.jsx](src/CardSheet.jsx): printed cards and overflow detection.
- [src/PageSelector.jsx](src/PageSelector.jsx): page tabs and naming dialog.
- [src/CircleEditor.jsx](src/CircleEditor.jsx): circle contents and shortcuts.
- [src/CircleSymbol.jsx](src/CircleSymbol.jsx): circles with optional tribe, equal, or asterisk contents.
- [src/EnergyIcon.jsx](src/EnergyIcon.jsx): shared tribe and energy SVG icons.
- [src/EnergyPage.jsx](src/EnergyPage.jsx): standalone energy screen.
- [src/energy.js](src/energy.js): tribe symbols and energy distribution.
- [src/styles.css](src/styles.css): shared UI and non-energy print layout.
- [src/energy.css](src/energy.css): energy-card layout.
- [src/main.jsx](src/main.jsx): React entry point and screen selection.
