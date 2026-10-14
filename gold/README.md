# Gold Mine Genie

Live at **https://aigeniedatabase.com/gold/**.

A browser-based relationship workspace for Dreams Business Resources. This folder is the complete website: HTML, CSS, JavaScript, images, narrated tutorials, captions, and locally hosted dependencies. No build step or API keys are required.

## Features

- Navy, turquoise, and gold interface with a rotating 3D gold diamond, motion controls, and a static fallback.
- Six memory categories with matching illustrations: family and friends, old coworkers, school friends, clients, strategic alliances, and community.
- Guided contact imports, previews, conservative duplicate matching, and manual review.
- Relationship organization, reconnect drafts, conversation logging, follow-up dates, and do-not-contact preferences.
- Excel, CSV, CRM mapping, and restorable JSON exports.
- Ten illustrated Learning Center cards with 13 independent YouTube tutorials, checklists, and official help links. iPhone, Android, and Instagram include a second video option.
- Original narrated overviews with captions remain available as an optional section inside each guide.

## Run locally

From the repository root, run `python -m http.server 8781 --bind 127.0.0.1` and open `http://127.0.0.1:8781/gold/`.

## Publish updates

Edit the files in this folder and commit to `main`. The repository's existing GitHub Pages deployment publishes `/gold/`. Keep `CNAME` and the root homepage intact. All application assets use relative paths so the site works in this subdirectory.

## Data and scope

Contact files are processed in the browser. Contacts are session-only by default, with an optional, clearly labeled unencrypted local-storage setting. The website does not contain any user's contact database. Browser data belongs to the current browser and website origin; it does not automatically transfer from another hosted copy. Use a JSON backup and restore to transfer a workspace.

The app does not sign into social accounts, scan email, scrape social networks, call an AI service, send messages, synchronize a CRM, or run background reminders. Drafts and priorities use local rules; contact matches require human judgment. Sample mode is fictional and opt-in.

## Attribution

Three.js and JSZip are self-hosted with their licenses in `vendor/`. Category artwork was supplied by Mike. Tutorial illustrations, the gold fallback artwork, and the animated scene were created for Gold Mine Genie.

Learning Center artwork was supplied by Mike. YouTube tutorials remain on their creators’ channels and open only when a visitor chooses a link; videos are not copied or embedded. Credits and selections live in `learning-videos.js`. Tutorials were sampled and their available transcripts reviewed on October 14, 2026, rather than watched continuously in full. Export format notes explain where a tutorial’s defaults differ from Gold Mine’s supported files.
