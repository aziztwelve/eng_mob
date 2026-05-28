/**
 * mascot-manifest — реестр поз mascot'а Lumi.
 *
 * Паттерн как у `lottie-manifest.ts` / `sound-manifest.ts`: ассеты
 * перечислены явно. Финальные PNG — Sprint 0 deliverable (см.
 * `assets/mascot/README.md`).
 *
 * Стратегия рендера в порядке приоритета:
 *   1. PNG (MASCOT_PNG[pose] != null) — финальный арт, отрисовываем через <Image>.
 *   2. SVG-плейсхолдер (MASCOT_SVG[pose]) — inline XML, отрисовываем
 *      через <SvgXml> из react-native-svg. ВСЕГДА доступен в Sprint 2+.
 *   3. Emoji — последний fallback (если SVG-парсинг упал).
 *
 * Если react-native-svg-transformer не подключён (а у нас и не подключён —
 * см. metro.config.js), импортировать .svg как React-компонент нельзя.
 * Поэтому держим XML инлайн строками.
 */

export type MascotPose = 'idle' | 'cheering' | 'thumbs_up' | 'wink';

/** PNG-source для финальных артов. Заменить null на require() когда будут готовы. */
export const MASCOT_PNG: Record<MascotPose, unknown | null> = {
  idle: null,
  cheering: null,
  thumbs_up: null,
  wink: null,
  // idle:      require('@/../assets/mascot/lumi-idle.png'),
  // cheering:  require('@/../assets/mascot/lumi-cheering.png'),
  // thumbs_up: require('@/../assets/mascot/lumi-thumbs_up.png'),
  // wink:      require('@/../assets/mascot/lumi-wink.png'),
};

/** Эмодзи-fallback (если ни PNG ни SVG не доступны). */
export const MASCOT_EMOJI: Record<MascotPose, string> = {
  idle: '🐱',
  cheering: '🙌',
  thumbs_up: '👍',
  wink: '😉',
};

export function hasMascotPng(pose: MascotPose): boolean {
  return MASCOT_PNG[pose] != null;
}

// ---------------------------------------------------------------------------
// SVG inline XML (placeholders) — копия assets/mascot/lumi-<pose>.svg.
// Если меняешь файлы там — синхронизируй и тут (или дождись финальных PNG).
// ---------------------------------------------------------------------------

const SVG_IDLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <ellipse cx="100" cy="155" rx="55" ry="32" fill="#58cc02"/>
  <circle cx="100" cy="95" r="55" fill="#7ed321"/>
  <polygon points="55,55 65,30 80,55" fill="#7ed321"/>
  <polygon points="145,55 135,30 120,55" fill="#7ed321"/>
  <polygon points="60,50 67,38 75,50" fill="#ffb3d9"/>
  <polygon points="140,50 133,38 125,50" fill="#ffb3d9"/>
  <circle cx="82" cy="92" r="9" fill="#1a1a2e"/>
  <circle cx="118" cy="92" r="9" fill="#1a1a2e"/>
  <circle cx="85" cy="89" r="3" fill="#ffffff"/>
  <circle cx="121" cy="89" r="3" fill="#ffffff"/>
  <polygon points="100,105 95,110 105,110" fill="#ffb3d9"/>
  <path d="M 92 118 Q 100 122 108 118" stroke="#1a1a2e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <line x1="65" y1="108" x2="80" y2="110" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="65" y1="115" x2="80" y2="115" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="135" y1="108" x2="120" y2="110" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="135" y1="115" x2="120" y2="115" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const SVG_CHEERING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <g fill="#ffd700">
    <polygon points="30,40 33,48 41,48 35,53 37,61 30,56 23,61 25,53 19,48 27,48"/>
    <polygon points="170,55 172,61 178,61 173,65 175,71 170,67 165,71 167,65 162,61 168,61"/>
    <polygon points="160,140 162,146 168,146 163,150 165,156 160,152 155,156 157,150 152,146 158,146"/>
  </g>
  <ellipse cx="55" cy="105" rx="12" ry="18" fill="#7ed321" transform="rotate(-30 55 105)"/>
  <ellipse cx="145" cy="105" rx="12" ry="18" fill="#7ed321" transform="rotate(30 145 105)"/>
  <circle cx="42" cy="80" r="9" fill="#58cc02"/>
  <circle cx="158" cy="80" r="9" fill="#58cc02"/>
  <ellipse cx="100" cy="155" rx="55" ry="32" fill="#58cc02"/>
  <circle cx="100" cy="95" r="55" fill="#7ed321"/>
  <polygon points="55,55 65,30 80,55" fill="#7ed321"/>
  <polygon points="145,55 135,30 120,55" fill="#7ed321"/>
  <polygon points="60,50 67,38 75,50" fill="#ffb3d9"/>
  <polygon points="140,50 133,38 125,50" fill="#ffb3d9"/>
  <path d="M 73 92 Q 82 84 91 92" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M 109 92 Q 118 84 127 92" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>
  <polygon points="100,105 95,110 105,110" fill="#ffb3d9"/>
  <path d="M 85 118 Q 100 135 115 118" stroke="#1a1a2e" stroke-width="3" fill="#ff6b9d" stroke-linecap="round"/>
  <ellipse cx="100" cy="128" rx="6" ry="4" fill="#ff4d8d"/>
</svg>`;

const SVG_THUMBS_UP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <ellipse cx="100" cy="155" rx="55" ry="32" fill="#58cc02"/>
  <ellipse cx="148" cy="120" rx="11" ry="20" fill="#7ed321" transform="rotate(20 148 120)"/>
  <circle cx="162" cy="100" r="14" fill="#7ed321"/>
  <rect x="158" y="78" width="8" height="18" rx="4" fill="#7ed321"/>
  <ellipse cx="55" cy="140" rx="10" ry="16" fill="#58cc02"/>
  <circle cx="100" cy="95" r="55" fill="#7ed321"/>
  <polygon points="55,55 65,30 80,55" fill="#7ed321"/>
  <polygon points="145,55 135,30 120,55" fill="#7ed321"/>
  <polygon points="60,50 67,38 75,50" fill="#ffb3d9"/>
  <polygon points="140,50 133,38 125,50" fill="#ffb3d9"/>
  <ellipse cx="82" cy="93" rx="8" ry="7" fill="#1a1a2e"/>
  <ellipse cx="118" cy="93" rx="8" ry="7" fill="#1a1a2e"/>
  <circle cx="85" cy="90" r="3" fill="#ffffff"/>
  <circle cx="121" cy="90" r="3" fill="#ffffff"/>
  <polygon points="100,105 95,110 105,110" fill="#ffb3d9"/>
  <path d="M 88 118 Q 100 128 112 118" stroke="#1a1a2e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <line x1="65" y1="110" x2="80" y2="112" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="135" y1="110" x2="120" y2="112" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const SVG_WINK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <g fill="#ff4d8d" transform="translate(155 50)">
    <path d="M 0 5 C 0 -2 -8 -2 -8 5 C -8 11 0 17 0 17 C 0 17 8 11 8 5 C 8 -2 0 -2 0 5 Z"/>
  </g>
  <ellipse cx="100" cy="155" rx="55" ry="32" fill="#58cc02"/>
  <circle cx="100" cy="95" r="55" fill="#7ed321"/>
  <polygon points="55,55 65,30 80,55" fill="#7ed321"/>
  <polygon points="145,55 135,30 120,55" fill="#7ed321"/>
  <polygon points="60,50 67,38 75,50" fill="#ffb3d9"/>
  <polygon points="140,50 133,38 125,50" fill="#ffb3d9"/>
  <circle cx="118" cy="92" r="9" fill="#1a1a2e"/>
  <circle cx="121" cy="89" r="3" fill="#ffffff"/>
  <path d="M 73 93 Q 82 87 91 93" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round"/>
  <polygon points="100,105 95,110 105,110" fill="#ffb3d9"/>
  <path d="M 90 118 Q 100 125 113 116" stroke="#1a1a2e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <line x1="65" y1="108" x2="80" y2="110" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="65" y1="115" x2="80" y2="115" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="135" y1="108" x2="120" y2="110" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="135" y1="115" x2="120" y2="115" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="72" cy="110" r="5" fill="#ffb3d9" opacity="0.6"/>
  <circle cx="128" cy="110" r="5" fill="#ffb3d9" opacity="0.6"/>
</svg>`;

export const MASCOT_SVG: Record<MascotPose, string> = {
  idle: SVG_IDLE,
  cheering: SVG_CHEERING,
  thumbs_up: SVG_THUMBS_UP,
  wink: SVG_WINK,
};
