# Family Secret Santa

A festive, mobile-first pass-the-phone draw for the Haiths (four), the Ngaatas (four), and Nonnie. Plain HTML, CSS, SVG, and JavaScript modules; no dependencies, build step, account, or backend. All artwork is original. Names are rendered as text, and the app sends no participant data anywhere.

## Run locally

From this folder, run `python3 -m http.server 8000`, then open `http://localhost:8000`. Use an HTTP server rather than opening the HTML file directly, because the app uses JavaScript modules. Modern Safari, Chrome, Firefox, or Edge with Web Crypto and local storage is required.

Run automated checks with Node 20 or newer:

```sh
node --test tests/core.test.mjs
node --check app.js
```

## Publish on GitHub Pages

1. Commit this folder's files to a GitHub repository, with `index.html` at the repository root.
2. In repository Settings → Pages, choose “Deploy from a branch”, select your branch and `/ (root)`, and save.
3. Open the HTTPS Pages URL when deployment completes. All asset URLs are relative, so repository subpaths work.

No build command or secrets are needed. Test using the same browser and URL you will use for the event. Storage is specific to the origin, device, and browser; it does not transfer to another phone.

## Draw and privacy

The draw shuffles nine recipient indices with Fisher–Yates. Each bounded integer uses `crypto.getRandomValues` with rejection of the incomplete remainder of the 32-bit range, avoiding modulo bias. All 9! permutations have equal probability; rejecting every household-invalid permutation therefore leaves a uniform distribution over the valid permutations. The reveal order is a fresh independent shuffle. Batches of 250 attempts yield to the event loop, with a 100,000-attempt cap and a retry message. Constraints are never relaxed.

The versioned `family-secret-santa-v1` localStorage entry holds participants, household IDs, assignment, reveal order, turn, phase, and practice status. The completed-turn count is the turn index. Every transition is saved before it is shown. A failed write blocks the flow with a non-revealing recovery screen instead of advancing unsafely. Reload always returns an unfinished turn to handoff; only explicitly hiding completes that turn. Double taps on an old button cannot complete another person's turn. No flow steps add browser history entries.

Leaving the page masks an open assignment and pauses music. Returning allows the same unfinished person to reveal again. Completed assignments have no reopening controls. Reset is in the discreet footer settings, hidden during reveals, and requires two confirmations plus typing `RESET`. Unreadable or incompatible storage shows a recovery screen with reset available.

This is social privacy, not authentication or encryption: anyone using developer tools or reading browser storage can discover assignments. There is no master list in the UI. The browser cannot guarantee privacy in screenshots, screen readers' retained speech, app-switcher previews, or against someone looking over a shoulder. Clearing browser data destroys the draw; private browsing may discard it when closed. The app is intended for one active tab on one phone; do not run concurrent tabs of the same draw. “Finish / Close” leaves a safe finished screen because browsers generally cannot close a user-opened tab.

## Optional music

The player expects **`assets/christmas-instrumental.mp3`**. No recording is included. Supply a gentle instrumental holiday recording you created or have permission to redistribute; put the exact file at that path. A public-domain composition does not imply a recording is public domain. Add the recording's author, source, license, and any required attribution here before distribution.

Music defaults off. A tap starts playback at 22% volume and loops the local file. The preference is stored separately in `family-secret-santa-music`; reload never autoplays, instead offering “Tap to resume”. Hiding the tab pauses audio and requires another tap. Muting pauses immediately. Missing assets or blocked playback show “Music unavailable” and leave the draw fully usable. No third-party audio service is used.

## Validation and manual QA

The standalone test suite checks 5,000 draws for the 4+4+1 constraints and valid turn permutations, name validation, corrupt storage, sampler cap failure, and a complete nine-turn state flow with safe resumption and duplicate hide actions. Frequency coverage is a smoke check; uniformity follows from the algorithm above, rather than a statistical assertion.

Run this checklist on iPhone Safari and Android Chrome, including a narrow 320px viewport. Browser UI, real audio playback, and physical-device checks require manual verification:

- Welcome: clear title, artwork, sound off, and generous touch targets. No horizontal scrolling on narrow screens or with long names.
- Setup: all three groups and nine editable names; empty, whitespace-only, and case-insensitive duplicates show inline errors. Entering HTML-like names displays literal text.
- Practice: the same editable family names are kept when toggling practice mode, and the prominent practice banner persists through every game screen, reload, and finish. Reset and start a real draw; confirm names lock before starting.
- Play all nine turns: app-selected handoff, identity confirmation, separate reveal tap, only the active recipient visible, immediate hide, nine completed turns, no assignment list. Try rapid duplicate taps at every step.
- Refresh at handoff, ready, while revealed, immediately after hide, and after finish. An unfinished person can re-reveal; a completed person cannot. Close/reopen the browser and confirm safe recovery.
- While revealed, switch tabs/apps, lock the phone, and use Back/Forward including cached-page restoration. Return to a hidden screen; no old recipient should reopen automatically.
- Reset: settings unavailable while revealed; cancel each dialog; wrong confirmation text cannot erase; exact `RESET` allows a new draw. Try double taps on confirmation buttons.
- With disposable test data, corrupt the saved JSON or version in developer tools; verify a non-revealing recovery and deliberate reset. Block local storage; verify safe failure without a visible secret.
- Missing music: tap toggle and verify the subtle unavailable message. With a licensed MP3 installed, verify loop, volume, mute, tab-hide pause, and fresh tap to resume after reload. Check rejected playback remains usable.
- Keyboard: Tab, Enter, Space, visible focus, initial Cancel focus in confirmations, and Escape to cancel. Screen reader: descriptive controls, field errors, headings, and decorative artwork ignored.
- Enable reduced motion: no falling snow, twinkling, or animated reveal/finale; all information and buttons still work. Check normal-motion gift lid opening and short sparkles do not block hiding.
