# Frontend refresh from the Google Drive mockups

## What's in the folder

13 finished HTML mockups (landing, project detail with all tabs, submit wizard, my portfolio, bundling tool, public funding, ecosystem, for developers, for investors, how it works, sign-up, stage-6 action flows), plus `dhc-market-app.jsx` and `dhc-market-project.zip`.

The landing mockup carries a clear visual system: Space Grotesk headings + Inter body, deep navy surfaces (#081320 / #0b1b2e / #0f2740), blue accents (#2f80ed / #3ea0ff), light page background #f4f6f9, green for positive states, 1180px content width, 8px radius buttons, sticky translucent navy top bar, radial-gradient hero with a faint grid overlay, and a three-column stats band.

The app already has all these pages built and working. So this is a visual and layout alignment pass, not a rebuild — existing data, sign-in, access requests and submission logic stay untouched.

## Suggested prompt to use

> Update the frontend of this project to match the HTML mockups in my Google Drive folder (https://drive.google.com/drive/folders/1btg0bo4BAz8eK0UrybtOMfzRYFZ7qK31).
>
> Treat the mockups as the design source of truth for look, layout and copy. Keep all existing behaviour: routes, sign-in, database reads/writes, access-request and data-room flows, and the submission wizard logic.
>
> Start by aligning the shared design system (fonts, colours, buttons, cards, spacing, the top bar and footer) to the landing mockup, then work page by page in this order: landing, for developers, for investors, how it works, ecosystem, public funding, project detail, submit wizard, my portfolio, bundling tool, sign-up. Show me the landing page first and wait for my approval before continuing with the rest.

## Action plan

**Step 1 — Pull the files in**
Download all 15 files from the folder into a working folder for reference, and read the zip and `.jsx` to see whether they hold anything the HTML files don't.

**Step 2 — Shared design system**
Translate the mockup's colours, fonts, radii, shadows and content width into the project's global style tokens, so every page inherits the new look. Update the shared top bar, footer and button/card styling to match.

**Step 3 — Landing page**
Rebuild the landing sections to the mockup: hero with gradient and grid overlay, stats band, problem section, the rest of the sections in mockup order, and the closing call to action. Then pause for your review.

**Step 4 — Public pages**
For developers, for investors, how it works, ecosystem, public funding, sign-up — matched to their mockups, including headline and body copy.

**Step 5 — Signed-in workspace**
Project detail (all tabs), submit wizard, my portfolio, bundling tool, stage-6 action flows — layout and styling aligned while keeping every existing interaction working.

**Step 6 — Check and polish**
Walk every page at desktop and phone width, confirm nothing broke, and fix any spacing or contrast issues.

## Notes

- Any copy in the mockups that is placeholder or invented (numbers in the stats band, partner names) I'll flag rather than ship silently as fact.
- Where a mockup conflicts with something already working in the app, I'll follow the mockup's visuals and keep the app's behaviour, and tell you where the two disagreed.
- Reviewing after the landing page keeps the direction correctable before it's applied across 11 more pages; say the word if you'd rather I run straight through.
