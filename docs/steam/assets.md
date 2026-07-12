# Steam store assets

## Image requirements (Steamworks spec, verify against current docs before final upload since Valve updates these)

| Asset | Size | Format | Notes |
|---|---|---|---|
| Header capsule | 460 x 215 | PNG or JPG | Shown in store search results and category pages |
| Main capsule | 616 x 353 | PNG or JPG | Shown on the store front page and featured sections |
| Small capsule | 231 x 87 | PNG or JPG | Shown in some list views and the friends activity feed |
| Screenshots | 1920 x 1080 minimum | PNG or JPG | Steam recommends 16:9, at least 5, ideally 8 to 10 |
| Library capsule (vertical) | 600 x 900 | PNG or JPG | Shown in the user's Steam library grid view |
| Library hero | 3840 x 1240 | PNG or JPG | Shown as the background banner on the library game page |
| Library logo | Variable, transparent PNG | PNG with alpha | Overlaid on the library hero |

These numbers are current Steamworks requirements as of this writing.
Confirm against the Steamworks partner site before final submission, since
Valve has changed capsule sizes before.

## Screenshot checklist (must come from the real running game)

**No AI-generated images of real politicians, anywhere, for any purpose.**
Every screenshot and every piece of store art must be a capture of the
actual Electioneer client running a real or in-game campaign. Do not
generate, composite, or imply likenesses of real world political figures
in store assets. This applies to capsules, screenshots, and the library
hero alike.

Screens to capture from the live game, at 1920x1080 or higher:

- [ ] Setup screen: country/scenario picker and candidate selection, showing
      the range of countries and elections available.
- [ ] Map mid campaign: the regional map (US state map or UK regional map)
      with polling numbers visible, mid campaign.
- [ ] Debate scorecard: the post debate breakdown screen showing exchange
      by exchange scoring.
- [ ] Election night: results coming in region by region or state by state,
      with the results map populated.
- [ ] Timeline replay: the post game "why you won or lost" replay/timeline
      report.
- [ ] Campaign editor: the editor screen showing a custom scenario being
      built (candidates, regions, starting conditions).

Take these at a resolution at or above 1920x1080, in a clean UI state (no
dev tools, no debug overlays, no placeholder text). Prefer a completed or
near completed campaign for the election night and timeline shots so the
data on screen looks real rather than empty.
