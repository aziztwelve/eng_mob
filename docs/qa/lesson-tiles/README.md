# Lesson tiles — selected option 9

Final result: passed for inspected native state after rework.

The original implementation was rejected for visible differences. Reworked tile geometry, dense cloud/pine scenery, smaller labels, hiker with blue backpack placed on the current platform, white CTA surround, and centered description. Removed extra progress label and track dictionary entry.

Source: selected-9.png. Native Redmi 8A capture: native-final.png. Combined comparison: comparison-final.png. The real track description and completion state differ from illustrative mock data; the existing native bottom tab bar and device aspect ratio are retained. Three lessons and Continue fit the inspected viewport.

TypeScript and scoped ESLint passed. Current lesson tile navigates to the existing lesson route; locked taps are guarded and completed lessons remain replayable. No answers submitted during review. Full traversal of all tracks and all completion states was not performed.

Artwork, connector and native touch targets share the same scaled coordinate system. New PNG assets are separate platform illustrations, not cropped screenshot buttons.
