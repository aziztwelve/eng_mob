# Vocabulary Bank visual QA

## Comparison target

- Source visual truth: `/home/aziz/Pictures/Screenshots/Screenshot from 2026-09-29 06-14-24.png`
- Rendered implementation: `/tmp/eng_mob-vocabulary-bank-single-surface-final.png`
- Combined comparison: `/tmp/vocabulary-design-comparison-single-surface.png`
- Source dimensions: 342 × 408 px.
- Implementation dimensions: 720 × 1520 px (Android device capture).
- Normalization: source was enlarged to 640 × 763 px; the implementation was cropped to the 640 px-wide bank content region (`x=40`, `y=375`, `640 × 760`) and padded to 640 × 763 px. No device chrome was compared.
- State: A1 selected, a word at step 6/15, Russian UI. The implementation uses live learner data (`AIR`) while the visual source uses sample content (`ACTRESS`).

## Comparison history

1. The first implementation used a tall, three-line continuation item. This created a P1 density mismatch with the source.
   - Fix: rebuilt the items as explicit horizontal rows with word, meaning/translation, progress, status, and chevron on one axis.
2. The first compact pass made the hero and rows too small.
   - Fix: increased the hero typography, circle, footer controls, row height, and inter-row spacing.
3. The hero retained a second red backing surface after the visual adjustment.
   - Fix: removed the outer glow/backing layer and kept a single purple hero surface with a fine gold outline.
4. The continuation list still competed with the hero through visible progress controls.
   - Fix: initially replaced it with one shared glass block, but that lost the clear, individual-card structure requested for each word.
5. The latest direction calls for independently tappable horizontal cards while retaining learning status.
   - Fix: each word is now its own rounded glass card with a compact CEFR label, English meaning, Russian translation, a short gold progress bar and value, plus a navigation or completion icon.
6. The cards needed to read as complete, independent learning units rather than subtle list rows.
   - Fix: each continuation card now uses the same deep-purple glass background and fine gold boundary as the current-word hero. The progress column retains a hairline internal divider for scanability.

## Required fidelity surfaces

### Fonts and typography

The implementation uses the app’s existing rounded display face, with white heavy word labels, muted lavender definitions, and yellow accents. The hierarchy matches the source: hero word first, circular progress second, then compact continuation rows. The live `AIR` definition wraps because it is longer than the sample `ACTRESS` copy; this is expected live-content behavior.

### Spacing and layout rhythm

The hero remains the dominant object, followed by a clearly separated continuation section. The progress dots, next-review panel, and CTA sit in consistent horizontal bands. The continuation area uses separate 76 px horizontal cards with 9 px gaps, readable three-level word metadata, and generous touch targets.

### Colors and visual tokens

The deep-purple to burgundy page gradient, purple glass surfaces, gold/orange progress, and white/lavender type match the supplied visual language. The hero has one controlled purple surface and a subtle gold border rather than a competing second background. Continuation cards repeat that same purple glass background and gold boundary at a smaller scale, visually tying the two sections together.

### Image quality and asset fidelity

The source has no imagery inside the target content. Existing app icon components are used for sound, calendar, play, completion, and navigation; no placeholder or raster image was introduced.

### Copy and content

Russian labels now read `Текущее слово`, `Следующее повторение`, `Сегодня`, `Повторить`, and `Продолжить изучение`. Word, definition, translation, and CEFR level come from the vocabulary feed; the sample reference word is not hard-coded over the learner’s current word. Each continuation card keeps its compact progress value; completed words use a green completion state.

## Interaction check

- The Practice → Word Bank tab was opened on the physical Android device.
- Level filtering and search remain present above the redesigned blocks.
- The hero CTA and continuation rows retain their routes to the existing vocabulary lesson flow.

## Follow-up polish

- The reference uses a different sample word and a shorter definition; this is an intentional live-data difference.
- If the product wants exact visual parity for demos, a dedicated mock-data preview state can pin `ACTRESS` and its transcription.

final result: passed

## Glass pass: 15-step player + word preview (2026-09-30)

- Scope: `[externalId]/learn.tsx` (all 15 activity types + finish screen) and
  `[externalId].tsx` (preview) rebuilt on the bank-tab glass system:
  plum glass `rgba(65,11,71,0.84)` + gold hairline `rgba(255,224,104,0.38)`,
  inner deep glass `rgba(42,13,66,0.55)`, gold actions
  (`LinearGradient #FFDF5E→#FFB338` with warm glow, dark `#3D0A1A` label),
  gold-glass secondary/ghost buttons, mint/rose feedback states.
  Hardcoded `Reveal` and the sentence placeholder localized (ru/en/kk).
- Live checks on the physical device (screenshots in `/tmp/wordbank-glass-qa/`):
  preview hero/lesson card/timeline, player step 4 full recorder flow
  (record → recorded → result → continue advanced the checkpoint to step 5),
  step 5 option rows. No clipping, contrast, or overlap defects found.
- Metro note: eng_mob dev server runs on port **8082** (8081 is taken by another
  project on this machine). The phone's dev client fetches `localhost:8081`,
  so keep `adb reverse tcp:8081 tcp:8082` while developing on USB.

## 2026-10-17: cloud / mountain track paths

Selected board panels 3 and 7 implemented in the native mobile track catalog for every goal. Default: clouds. Both themes keep live progress and navigation. TypeScript/scoped ESLint passed; native Redmi 8A comparison, theme switching, track opening and Continue verified. Evidence, differences from mock state and limitations: `docs/qa/cloud-tracks/README.md`, `docs/qa/cloud-tracks/comparison.png`.

Final result: passed (requested theme scope; mountain trail coordinate binding remains unimplemented).

## 2026-10-17: track lesson tiles, selected option 9

Initial screen rejected by the user; reworked from the exact selected crop. Final same-state comparison saved in `docs/qa/lesson-tiles/comparison-final.png` with native evidence and limitations in that folder's README. Description centered per the user's final correction. TypeScript and scoped ESLint passed. Final result: passed for inspected native state; no full catalog traversal claimed.


## 2026-10-18: six-screen cloud onboarding and selected login 2

Scope: native React Native app, first cloud direction; only welcome → goal → age → level → reminder-time → signup. Login uses selected middle variant 2. Retired screen links redirect without rendering the removed UI.

### Evidence and normalization

- Source visual truth: `design-explorations/first-launch-onboarding-2026-10-18/selected-cloud-direction-original.png` (853 × 1844) and `login-three-variants.png` (1663 × 946).
- Implementation: same folder `verified/01-welcome.png` through `07-login.png`, physical Redmi 8A, 720 × 1520 pixels, density 2 (360 dp width).
- Full-view comparison: `verified/design-comparison.jpg`; focused login comparison: `verified/login-comparison.jpg`. Both were opened and visually inspected after fixes.
- Source panels and actual app content were cropped separately and proportionally resized to equal widths. Native crop: x=0, y=55, width=720, height=1370. Portrait content is approximately 360 × 685 dp. Different source aspect ratios are preserved; this is responsive adaptation, not a pixel-diff claim. OS status/navigation and Expo gear are development chrome, not product artwork.
- State: Russian, travel selected, age 25–34, level A1, evening reminder; signup/login empty. English level and Kazakh reminder smoke captures: 15 and 16. Keyboard evidence: 14-signup-keyboard-final.png; landscape login: 17 and 18. An earlier incorrectly timed orientation capture was replaced after checking the actual route and device rotation.

### Findings and fixes

- [Resolved P1] Signup password could be obscured by the native keyboard. `useKeyboardScroll` now measures the ScrollView origin and normalizes Android status-bar coordinates before revealing the focused field. Final native image 14 shows the whole password field above the IME; form controls remain scrollable.
- [Resolved P2] Login bear was too small and fields too rounded compared with selected variant 2. Hero increased to h-56/w-80; field corners changed to 14 dp. Post-fix evidence: 07-login.png and login-comparison.jpg.
- No remaining actionable P0/P1/P2 findings in the inspected flow.

### Required fidelity surfaces

- **Fonts/typography:** existing rounded Nunito display face, dark heavy headings, softer body labels, cyan actions; checked Cyrillic wrapping, English and Kazakh labels. Native readable text replaces AI-rendered sample lettering.
- **Spacing/layout:** centered welcome/login composition, consistent horizontal margins, white option cards, selected borders and fixed bottom next action. Long choice lists scroll rather than remove real choices. Portrait login fits its complete form/footer; landscape uses a centered, scrollable single column with every control reachable (18).
- **Colors/tokens:** pale sky #BFEAFD, white surfaces, cyan #12B4FB with #0798D7 button edge and muted blue-gray body text. Consistent selected/disabled/error states; no old purple onboarding surfaces remain.
- **Image quality:** separate generated transparent orange bear assets (welcome, laptop, peeking head/paws) were inspected for transparency, crop and sharpness. Existing app scenery/cloud assets preserve the current cloud/forest environment. Individual illustrations intentionally adapt the art direction rather than crop whole UI from the board.
- **Copy/content:** six-step numbering, actual existing goals/age/level choices preserved; no mini-test/minutes/paywall promises or removed-page content. Password minimum remains 8 characters, as required by actual auth validation. Real content takes precedence over generated board text.

### Checks and practical limits

- Native six-screen progression, disabled-until-choice state, back navigation and selection persistence passed. Retired paywall/test links redirect to retained pages.
- Signup/login required fields, invalid email/short password and password visibility passed without creating accounts. Keyboard focus/scroll and physical Back verified; EN/KK smoke passed, Russian and original rotation setting restored.
- TypeScript, scoped ESLint, diff whitespace check and four local storage/offline retry tests passed. Backend user/auth/gateway Go tests, rollback migration tests and live HTTP health/auth-validation smoke passed; see the adjacent README and saved logs.
- Real credential login, real registration, OAuth provider completion, iOS and other device sizes were not exercised. Password recovery retains the existing informational alert; it is not a new implemented recovery flow.
- Acceptable differences from the board: six pages instead of its obsolete longer sequence, responsive shorter Android viewport, retained actual choices, generated bear pose variation and current app forest scenery. Button diagonal shine is omitted in favor of the app's shared cyan action styling.

### Implementation checklist

- [x] Six retained screens and login 2 implemented in the native app.
- [x] Removed routes, cached answers and queued retired writes cleaned.
- [x] Server data cleared and legacy writes prevented without deleting profiles.
- [x] Combined and focused comparisons reviewed after fixes.
- [x] Native validation, keyboard, back and rotation checks completed.

final result: passed


## 2026-10-18: platform-specific social authentication

Native Android login and signup captures: `docs/qa/social-auth/android-login.png` and `android-signup.png`. Android displays only a full-width Google button; iOS retains the existing Google/Apple pair, verified by unit tests, with no physical iPhone claim. Existing cloud typography, white rounded controls, cyan pending state, raster bear/scenery and localized copy are retained. Signup scroll reaches provider/login/legal controls. Native Google module is present; unconfigured tap settles to an explanatory localized error and re-enables controls. Real external-provider authentication remains blocked by missing LingoIQ OAuth clients/capability, confirmed by the user. See `docs/social-sign-in-setup.md` for activation requirements and all practical limits. This pass covers platform visibility/layout and error handling, not a claim that production OAuth is active.

final result: passed


## 2026-10-18: Google account success routing correction

Live server evidence confirmed real Google login 200 and /auth/me 200; local token presence checked without outputting tokens. New users now enter goal selection instead of returning to welcome. At retained final step 6/6, an existing session displays the connected-account state without registration fields (`docs/qa/social-auth/google-connected-no-repeat-registration.png`, physical Android 720x1520). Existing cloud typography/colors/art and clear centered action retained; no clipping found. The user still chooses learning preferences. Nine mobile regression tests, TypeScript and scoped ESLint pass. Full learning preferences completion was not submitted for the user.

final result: passed

## 2026-11-04: AI topics, selected concept 1

- Source: `/home/aziz/.codex/generated_images/01a14f90-07d9-71a2-b59d-76533ac763db/exec-23cd2799-6766-42b7-9762-a15d8bd233e4.png`, first screen, 298 × 695 px crop.
- Android: `docs/qa/ai-topics/b1-final.png`, physical Redmi 8A screenshot 720 × 1520 px; comparison `docs/qa/ai-topics/b1-comparison.png`. Both images were resized to 430 × 908 for side-by-side comparison; source and device have different aspect ratios, so do not infer exact vertical pixel equality.
- State: AI tab, B1, first five work lessons, Russian UI. Focused comparison: header, level pills, five nodes and route in the side-by-side image. Card interaction: `docs/qa/ai-topics/lesson-card.png`.
- Earlier P1: large rectangular rows, short hidden route, clipped avatar and early second section (`b1-before.png`). Fixed with narrower alternating cards, protruding round icon badges, curved route, larger node spacing and an avatar aligned to the hero bottom. Later P2: blue-to-white page and uneven level pills; fixed page background and equal-width level pills. A further text-size iteration caused the fifth label to wrap; restored the smaller label after Android capture.
- Typography/copy: existing Nunito and current bilingual lesson copy retained, all first five labels visible. Spacing/layout: five separate nodes visible above the shared navigation; no clipped text in final capture. Colors: light blue background, white pills, pastel icons, blue route. Assets: existing user-selected robot and Lucide icons retained; their exact appearance differs from generated art. Existing floating navigation and native device chrome intentionally remain app-owned. Accessibility and other screen sizes were not separately tested.
- Checks: selected B1 and opened a lesson preview on Android; TypeScript and scoped ESLint passed. Full voice session and iOS were not retested for this visual change.
- Follow-up P3: route details, icon stroke shapes, shadows and selected robot differ from the generated reference; exact art would require approved production assets. Navigation shape is intentionally the existing shared component.

final result: passed

## 2026-11-05: AI home, retain selected option 10 only

### Findings and fixes

- [Resolved P1] The initial option 10 used an undersized conversation icon and card artwork, with excess space in the hero. Evidence: `docs/qa/home-variants/10-before.png` and `10-comparison-before.jpg`. The primary icon is now 37 dp, the two card illustrations use 146 × 92 dp slots, the hero is 204 dp high and the card corners explicitly use 20 dp rather than the project's larger `rounded-3xl` token. Revised full and focused comparisons below were opened and inspected.
- [Resolved P2] The user selected option 10 and requested deletion of options 4 and 6. Their rendering branches, selection state, AsyncStorage preference handling, selector, seven exclusive images and QA copies have been removed. A previously saved choice of 4 or 6 is no longer read. The retained home always renders option 10.
- [Resolved P1, linked page] Opening the track dictionary exposed white text on a light background. The dictionary now uses dark text, white bordered cards and readable search/error states. Native evidence: `dictionary-before.png` and `dictionary-after.png` in the same QA folder.
- No actionable P0/P1/P2 findings remain in the inspected Android states for this selection/removal scope. The screenshots demonstrate the retained design direction; they do not establish pixel equality to the generated mock.

### Evidence and normalization

- Visual source: `/home/aziz/.codex/generated_images/01a14f90-07d9-71a2-b59d-76533ac763db/exec-e3a27077-96a1-4cbe-812f-8f34daa19c54.png`, retained copy `docs/qa/home-variants/reference-10.png`, 852 × 1846 px.
- Final implementation: `docs/qa/home-variants/10-final-top.png` and `10-final-bottom.png`, physical Redmi 8A, 720 × 1520 px, 360 dp wide at density 2. Native captures include OS chrome and the existing floating app menu. The generated source does not; the menu is intentionally retained at the user's request, so the resource row remains reachable by scrolling.
- State: authenticated home, English UI, top and bottom scroll positions after removal of the selector. The source copy is Russian; localized wording and wrapping are intentional. Earlier Russian captures remain available as `10-top.png` and `10-bottom.png`.
- Full comparison: `docs/qa/home-variants/10-final-comparison.jpg`. Source is proportionally resized to 720 px width; both native captures remain 720 px wide. Different viewport heights and source/device chrome are explicitly accounted for rather than stretched.
- Focused comparisons: `10-final-actions-comparison.jpg` and `10-final-links-comparison.jpg`. Source regions (0,912)-(852,1394) and (0,1472)-(852,1712) are resized proportionally to 720 px width. Actual regions are top capture (0,826)-(720,1241) and bottom capture (0,1033)-(720,1240). These isolate actual UI controls from OS/menu chrome.

### Required fidelity surfaces

- Fonts/typography: rounded Nunito, heavy navy headings and action labels, softer body text; localized labels remain readable without clipping. The current English two-line Topics label differs intentionally from the Russian source.
- Spacing/layout: large hero, yellow pill action, paired white cards and four resource links retained. The final bottom capture shows every resource above the floating menu and Android navigation. A small resource-label baseline variation is P3 polish.
- Colors/tokens: sky-blue background, yellow action, dark navy text and white cards match the selected direction. The mock's softer gradient/shadows are P3 visual differences.
- Image quality: separate transparent robot, logo and conversation/level/resource artwork are sharp at the tested density. Generated pose, rendering and decorative details vary from the source. Standard interface arrows and the action icon use Lucide.
- Copy/content: existing localized app labels and working destinations are used; design-option controls no longer appear in the product.

### Verification and practical limits

- Free Talk CTA/card, topics, tracks, words, Word Bank and dictionary destinations were opened on Android during this pass. No real voice conversation or assessment submission is claimed by this visual check.
- TypeScript, scoped ESLint and `git diff --check` passed after removal. Recent React Native/Android error logs were empty. Metro remains on 8091; other projects' ports were not changed.
- iOS and other device sizes were not run; no native dependencies changed.

### Implementation checklist

- [x] Keep option 10 as the sole home layout.
- [x] Remove options 4/6, their assets and switcher.
- [x] Retain bottom navigation and safe-area spacing.
- [x] Inspect final full and focused native comparisons.
- [x] Complete type, lint and whitespace checks.

final result: passed
