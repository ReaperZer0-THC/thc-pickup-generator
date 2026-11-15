# THC Pickup Generator — Modular Migration

## Deploy
Upload the CONTENTS of this folder to the ROOT of the existing `thc-pickup-generator` GitHub repository (not the folder itself). Keep the existing `images/` directory and its Astreos photos. Commit all files together.

The new `index.html` is ~5 KB. The former embedded artwork is now under `assets/defaults/`. Subsequent code and configuration changes generally require updating only the relevant small file.

## Structure
- `index.html`: UI and script/style references
- `css/style.css`: appearance
- `config/defaults.js`: default image paths and Astreos asset paths
- `js/app.js`: profiles, IndexedDB, pickup selection and application state
- `js/renderer.js`: canvas drawing, actions, initialization
- `assets/defaults/`: original embedded artwork extracted byte-for-byte

## Compatibility
The database remains `THC_DINO_PICKUP_BUILDER_V3`, store `profiles`. Saved profiles remain in each user's browser at the same origin. The site is local-first and doesn't send customer data to GitHub. Existing stored data URLs still load.

## Pre-deployment checklist
1. Export a backup of saved profiles from the old app if available.
2. Upload all new files and folders while retaining the repo's existing `images/` folder.
3. Test the Center and Astreos profiles and their images, then standard and Drakeling pickup types.
4. Test the standard, fridge+dedi and cryo+dedi clusters, plus card rendering and PIN generation.
5. Confirm existing saved profiles still load before considering the migration complete.

Do not open `index.html` directly as a file if you want to test browser storage; use GitHub Pages or a local HTTP server.
