# Tracks: clouds and mountains — 2026-10-17

Native React Native implementation of panels 3 and 7 in the selected comparison board. Applied to all seven existing goal categories. Clouds open by default; the Clouds/Mountains switch changes presentation only. No Android build or backend changes.

## Verification

- TypeScript `tsc --noEmit`: passed.
- Scoped ESLint for track catalog and path component: passed, no warnings.
- Redmi 8A, Android 10, existing Metro: inspected Work & Career and Travel with live API data.
- Tapping a platform opened its existing track detail screen (`open-track.png`).
- Continue opened the first unfinished lesson, “Уточняем рабочие инструкции” (`continue-lesson.png`). No answers were submitted.
- Both theme buttons operated; level selector opened with A1–C1. Level filtering is wired to existing track API. Full traversal of every category/level was not performed.
- Real lesson dots remain the same across themes. Unstarted tracks remain browsable. No progress, locks or completed tracks are fabricated.
- Smaller platforms and 126-point rows address the requested compactness. Current row is 154 points to retain a 44-point CTA. Category key resets the path when category changes.

## Visual comparison

`comparison.png` places source panels and native captures together. Source uses illustrative track titles/progress, native uses actual account data, which has the current track first. The native app retains its existing bottom navigation; a theme switch was explicitly added by request. Screenshots exclude neither the Expo developer control nor system navigation; these are not product artwork. Density is normalized for review; this is a styled native adaptation, not a pixel-identical screenshot clone.

Earlier issues: clipped bear, excessive row spacing and long labels. Fixed by aligning the current row to the right, reducing node/platform/row dimensions, and allowing real titles to wrap. Final captures: `native-clouds-final.png`, `native-mountain-a1.png`, `travel-clouds.png`, `travel-mountain.png`.

Final result: passed for requested compact theme implementation and inspected states. No remaining P0/P1/P2 issue in inspected states. Mountain background is decorative and fixed; binding its trail to interactive coordinates is a separate discussed enhancement, not implemented here.
