/**
 * Black-and-white pencil-sketch SVG storyboard frames.
 * Each is a 1024x1024 SVG in monochrome hand-drawn style
 * with storyboard frame borders, scene labels, and shot titles.
 */

const sketchHeader = (title: string, label: string) =>
  [
    /* storyboard frame border */
    `<rect x="20" y="20" width="984" height="984" fill="none" stroke="#333" stroke-width="2.5" rx="4"/>`,
    `<rect x="28" y="28" width="968" height="968" fill="none" stroke="#aaa" stroke-width="0.8" stroke-dasharray="6 6"/>`,
    /* title bar */
    `<rect x="20" y="20" width="984" height="38" fill="#333" rx="4"/>`,
    `<rect x="20" y="54" width="984" height="4" fill="#333"/>`,
    `<text x="40" y="45" font-family="monospace" font-size="16" fill="#fafafa" font-weight="bold">${title}</text>`,
    /* scene label */
    `<text x="980" y="45" text-anchor="end" font-family="monospace" font-size="14" fill="#ccc">${label}</text>`,
    /* shot number badge bottom-right */
    `<rect x="840" y="960" width="140" height="26" fill="none" stroke="#999" stroke-width="1" rx="4"/>`,
    `<text x="910" y="978" text-anchor="middle" font-family="monospace" font-size="12" fill="#999" font-weight="bold">${title}</text>`,
  ].join('');

const svg = (title: string, label: string, body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><rect width="1024" height="1024" fill="#fafafa"/>${sketchHeader(title, label)}${body}</svg>`)}`;

export const SKETCHES: Record<string, string> = {
  /* ===== Scene 1: Dresser, woman at mirror ===== */
  'mock:first-frame-1': svg(
    '首帧 1',
    '梳妆台',
    [
      /* mirror - large oval */
      `<ellipse cx="420" cy="380" rx="200" ry="280" fill="none" stroke="#333" stroke-width="2.2"/>`,
      `<ellipse cx="420" cy="380" rx="190" ry="270" fill="none" stroke="#999" stroke-width="0.6" stroke-dasharray="4 4"/>`,
      /* mirror highlight */
      `<path d="M380 130 Q340 300 360 480" fill="none" stroke="#ddd" stroke-width="2"/>`,
      /* face in mirror */
      `<ellipse cx="420" cy="360" rx="80" ry="100" fill="none" stroke="#444" stroke-width="1.6"/>`,
      /* hair */
      `<path d="M340 300 Q360 240 400 260 Q460 240 500 300" fill="none" stroke="#555" stroke-width="1.2"/>`,
      /* eyes */
      `<ellipse cx="395" cy="340" rx="14" ry="8" fill="none" stroke="#333" stroke-width="1.4"/>`,
      `<ellipse cx="445" cy="340" rx="14" ry="8" fill="none" stroke="#333" stroke-width="1.4"/>`,
      `<circle cx="395" cy="340" r="4" fill="#333"/>`,
      `<circle cx="445" cy="340" r="4" fill="#333"/>`,
      /* nose */
      `<path d="M420 355 Q418 375 420 385" fill="none" stroke="#666" stroke-width="1"/>`,
      /* mouth - concerned */
      `<path d="M400 410 Q420 400 440 412" fill="none" stroke="#333" stroke-width="1.3"/>`,
      /* dry skin hatching on cheeks */
      `<line x1="350" y1="365" x2="358" y2="375" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="345" y1="378" x2="353" y2="388" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="338" y1="390" x2="346" y2="400" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="485" y1="362" x2="477" y2="372" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="490" y1="375" x2="482" y2="385" stroke="#bbb" stroke-width="0.5"/>`,
      /* annotation arrow pointing to cheek */
      `<path d="M600 350 Q550 360 500 370" fill="none" stroke="#999" stroke-width="0.8"/>`,
      `<text x="610" y="348" font-family="monospace" font-size="13" fill="#999">dry patch</text>`,
      /* dresser table */
      `<rect x="280" y="640" width="280" height="16" fill="none" stroke="#555" stroke-width="1.6" rx="3"/>`,
      `<line x1="300" y1="656" x2="300" y2="720" stroke="#555" stroke-width="1.2"/>`,
      `<line x1="540" y1="656" x2="540" y2="720" stroke="#555" stroke-width="1.2"/>`,
      /* woman body silhouette */
      `<ellipse cx="420" cy="540" rx="120" ry="100" fill="none" stroke="#666" stroke-width="1"/>`,
      /* arm reaching up */
      `<path d="M500 520 Q480 420 460 390" fill="none" stroke="#666" stroke-width="1.2"/>`,
      /* hand near face */
      `<ellipse cx="455" cy="385" rx="16" ry="12" fill="none" stroke="#666" stroke-width="1"/>`,
      /* window light source */
      `<rect x="720" y="100" width="160" height="200" fill="none" stroke="#bbb" stroke-width="1" stroke-dasharray="5 5"/>`,
      `<line x1="800" y1="100" x2="800" y2="300" stroke="#ccc" stroke-width="0.5"/>`,
      `<line x1="720" y1="200" x2="880" y2="200" stroke="#ccc" stroke-width="0.5"/>`,
      /* light rays */
      `<line x1="720" y1="150" x2="560" y2="360" stroke="#eee" stroke-width="0.6"/>`,
      `<line x1="740" y1="180" x2="570" y2="390" stroke="#eee" stroke-width="0.6"/>`,
    ].join('')
  ),

  /* ===== Scene 1: Close-up cheek ===== */
  'mock:last-frame-1': svg(
    '尾帧 1',
    '脸颊特写',
    [
      /* close-up frame indicator */
      `<rect x="100" y="80" width="824" height="824" fill="none" stroke="#333" stroke-width="2" rx="6"/>`,
      /* corner zoom lines */
      `<line x1="80" y1="100" x2="100" y2="80" stroke="#666" stroke-width="1.2"/>`,
      `<line x1="80" y1="80" x2="100" y2="100" stroke="#666" stroke-width="1.2"/>`,
      `<line x1="944" y1="100" x2="924" y2="80" stroke="#666" stroke-width="1.2"/>`,
      `<line x1="944" y1="80" x2="924" y2="100" stroke="#666" stroke-width="1.2"/>`,
      /* face outline - large cheek area */
      `<path d="M180 200 Q200 100 400 100 Q600 120 700 300 Q720 500 680 700 Q500 850 350 820 Q200 780 180 500 Z" fill="none" stroke="#555" stroke-width="1"/>`,
      /* visible eye */
      `<ellipse cx="450" cy="320" rx="40" ry="22" fill="none" stroke="#333" stroke-width="1.8"/>`,
      `<circle cx="450" cy="320" r="10" fill="#333"/>`,
      `<circle cx="447" cy="317" r="3.5" fill="#fafafa"/>`,
      /* eyebrow */
      `<path d="M405 290 Q450 278 495 292" fill="none" stroke="#333" stroke-width="1.5"/>`,
      /* cheek texture area - hatching */
      `<line x1="280" y1="420" x2="290" y2="440" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="295" y1="415" x2="305" y2="435" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="310" y1="412" x2="320" y2="432" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="325" y1="410" x2="335" y2="430" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="340" y1="410" x2="350" y2="430" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="270" y1="440" x2="280" y2="460" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="285" y1="435" x2="295" y2="455" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="300" y1="432" x2="310" y2="452" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="315" y1="430" x2="325" y2="450" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="330" y1="430" x2="340" y2="450" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="265" y1="460" x2="275" y2="480" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="280" y1="455" x2="290" y2="475" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="295" y1="452" x2="305" y2="472" stroke="#bbb" stroke-width="0.5"/>`,
      /* texture label */
      `<text x="210" y="400" font-family="monospace" font-size="14" fill="#999">texture</text>`,
      `<line x1="200" y1="405" x2="260" y2="425" stroke="#999" stroke-width="0.6"/>`,
      /* zoom in arrow */
      `<path d="M160 160 L140 140 M150 140 L130 130 M140 150 L120 140" fill="none" stroke="#888" stroke-width="1"/>`,
      `<text x="130" y="120" font-family="monospace" font-size="11" fill="#aaa">ZOOM</text>`,
    ].join('')
  ),

  /* ===== Scene 2: Product bottle ===== */
  'mock:first-frame-2': svg(
    '首帧 2',
    '产品瓶',
    [
      /* table surface */
      `<line x1="180" y1="700" x2="844" y2="700" stroke="#555" stroke-width="1.5"/>`,
      /* reflection */
      `<path d="M380 710 Q510 700 640 710" fill="none" stroke="#ddd" stroke-width="0.5"/>`,
      /* bottle body */
      `<rect x="410" y="320" width="204" height="340" rx="22" fill="none" stroke="#333" stroke-width="2.2"/>`,
      /* bottle neck */
      `<rect x="470" y="240" width="84" height="80" rx="8" fill="none" stroke="#333" stroke-width="2"/>`,
      /* cap */
      `<rect x="455" y="200" width="114" height="44" rx="10" fill="none" stroke="#333" stroke-width="2"/>`,
      /* dropper bulb */
      `<circle cx="512" cy="160" r="32" fill="none" stroke="#333" stroke-width="1.8"/>`,
      `<circle cx="512" cy="155" r="10" fill="none" stroke="#999" stroke-width="0.8"/>`,
      /* dropper stem */
      `<rect x="500" y="192" width="24" height="48" rx="3" fill="none" stroke="#333" stroke-width="1.4"/>`,
      /* liquid level line */
      `<path d="M420 480 Q512 455 604 480 L604 650 Q512 675 420 650 Z" fill="none" stroke="#aaa" stroke-width="0.7"/>`,
      `<text x="470" y="600" font-family="monospace" font-size="13" fill="#bbb">serum</text>`,
      /* glass reflections */
      `<path d="M425 340 Q430 450 425 570" fill="none" stroke="#ccc" stroke-width="2.5"/>`,
      `<path d="M440 360 L440 520" fill="none" stroke="#ddd" stroke-width="1.5"/>`,
      /* water droplets */
      `<circle cx="540" cy="280" r="10" fill="none" stroke="#999" stroke-width="0.8"/>`,
      `<circle cx="490" cy="310" r="7" fill="none" stroke="#999" stroke-width="0.7"/>`,
      `<circle cx="570" cy="350" r="6" fill="none" stroke="#999" stroke-width="0.7"/>`,
      `<circle cx="460" cy="380" r="5" fill="none" stroke="#999" stroke-width="0.7"/>`,
      /* droplet trail */
      `<path d="M540 290 Q535 310 540 330" fill="none" stroke="#ccc" stroke-width="0.5"/>`,
      /* label */
      `<rect x="430" y="400" width="164" height="70" rx="5" fill="none" stroke="#888" stroke-width="1"/>`,
      `<text x="512" y="430" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#555" font-weight="bold">AquaGlow</text>`,
      `<text x="512" y="452" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#999">水光精华</text>`,
      /* drip from dropper */
      `<ellipse cx="512" cy="245" rx="6" ry="8" fill="none" stroke="#999" stroke-width="0.8"/>`,
      `<line x1="512" y1="253" x2="512" y2="260" stroke="#aaa" stroke-width="0.6"/>`,
    ].join('')
  ),

  /* ===== Scene 2: Patting cheek ===== */
  'mock:last-frame-2': svg(
    '尾帧 2',
    '水润肌肤',
    [
      /* face profile */
      `<ellipse cx="420" cy="380" rx="200" ry="240" fill="none" stroke="#333" stroke-width="2"/>`,
      /* hair */
      `<path d="M240 300 Q260 160 380 140 Q480 120 540 180 Q600 250 600 380" fill="none" stroke="#555" stroke-width="1.2"/>`,
      /* eye */
      `<ellipse cx="460" cy="320" rx="22" ry="14" fill="none" stroke="#333" stroke-width="1.6"/>`,
      `<circle cx="460" cy="320" r="6" fill="#333"/>`,
      `<circle cx="458" cy="318" r="2.5" fill="#fafafa"/>`,
      /* eyebrow */
      `<path d="M435 296 Q460 288 488 295" fill="none" stroke="#333" stroke-width="1.3"/>`,
      /* nose */
      `<path d="M530 340 Q535 365 525 385" fill="none" stroke="#666" stroke-width="1.2"/>`,
      /* mouth - slight smile */
      `<path d="M440 430 Q475 450 510 430" fill="none" stroke="#333" stroke-width="1.4"/>`,
      /* hand patting cheek */
      `<path d="M320 400 Q300 350 340 310 Q360 280 390 290" fill="none" stroke="#666" stroke-width="1.5"/>`,
      `<ellipse cx="360" cy="330" rx="45" ry="30" fill="none" stroke="#666" stroke-width="1.2"/>`,
      /* fingers */
      `<line x1="335" y1="318" x2="340" y2="298" stroke="#666" stroke-width="1"/>`,
      `<line x1="355" y1="312" x2="358" y2="292" stroke="#666" stroke-width="1"/>`,
      `<line x1="375" y1="312" x2="380" y2="292" stroke="#666" stroke-width="1"/>`,
      `<line x1="390" y1="318" x2="398" y2="300" stroke="#666" stroke-width="1"/>`,
      /* glow/moisture lines on cheek */
      `<path d="M380 350 Q420 330 460 350" fill="none" stroke="#ddd" stroke-width="2"/>`,
      `<path d="M390 370 Q430 350 470 370" fill="none" stroke="#eee" stroke-width="1.5"/>`,
      `<path d="M400 390 Q440 370 480 390" fill="none" stroke="#eee" stroke-width="1"/>`,
      `<circle cx="420" cy="345" r="4" fill="none" stroke="#ddd" stroke-width="0.8"/>`,
      `<circle cx="450" cy="355" r="3" fill="none" stroke="#ddd" stroke-width="0.8"/>`,
      `<circle cx="430" cy="365" r="2.5" fill="none" stroke="#eee" stroke-width="0.7"/>`,
      /* small product in corner */
      `<rect x="70" y="780" width="80" height="120" rx="10" fill="none" stroke="#999" stroke-width="1"/>`,
      `<rect x="95" y="740" width="30" height="40" rx="4" fill="none" stroke="#999" stroke-width="0.8"/>`,
      `<text x="110" y="850" text-anchor="middle" font-size="9" fill="#bbb">AG</text>`,
      /* glow annotation */
      `<text x="580" y="330" font-family="monospace" font-size="13" fill="#bbb">glow</text>`,
      `<line x1="570" y1="335" x2="480" y2="350" stroke="#ccc" stroke-width="0.6"/>`,
    ].join('')
  ),

  /* ===== Scene 3: Woman smiling ===== */
  'mock:first-frame-3': svg(
    '首帧 3',
    '微笑成片',
    [
      /* face front */
      `<ellipse cx="512" cy="400" rx="200" ry="250" fill="none" stroke="#333" stroke-width="2.2"/>`,
      /* hair */
      `<path d="M312 300 Q330 140 450 120 Q570 130 640 160 Q720 200 712 330" fill="none" stroke="#555" stroke-width="1.3"/>`,
      `<path d="M312 300 Q300 320 350 380" fill="none" stroke="#555" stroke-width="1"/>`,
      `<path d="M712 330 Q728 360 680 430" fill="none" stroke="#555" stroke-width="1"/>`,
      /* eyes */
      `<ellipse cx="430" cy="340" rx="34" ry="18" fill="none" stroke="#333" stroke-width="2"/>`,
      `<circle cx="430" cy="340" r="9" fill="#333"/>`,
      `<circle cx="427" cy="337" r="3.5" fill="#fafafa"/>`,
      `<ellipse cx="594" cy="340" rx="34" ry="18" fill="none" stroke="#333" stroke-width="2"/>`,
      `<circle cx="594" cy="340" r="9" fill="#333"/>`,
      `<circle cx="591" cy="337" r="3.5" fill="#fafafa"/>`,
      /* eyebrows */
      `<path d="M395 308 Q430 294 468 306" fill="none" stroke="#333" stroke-width="1.4"/>`,
      `<path d="M556 306 Q594 294 629 308" fill="none" stroke="#333" stroke-width="1.4"/>`,
      /* nose */
      `<path d="M512 365 Q505 395 500 410 Q510 416 514 415" fill="none" stroke="#666" stroke-width="1.1"/>`,
      /* big smile */
      `<path d="M430 455 Q470 495 512 495 Q554 495 594 455" fill="none" stroke="#333" stroke-width="2"/>`,
      /* teeth hint */
      `<line x1="470" y1="470" x2="554" y2="470" stroke="#ccc" stroke-width="0.4"/>`,
      /* smooth skin annotation */
      `<text x="310" y="260" font-family="monospace" font-size="14" fill="#999">smooth</text>`,
      `<line x1="300" y1="266" x2="400" y2="266" stroke="#aaa" stroke-width="0.6"/>`,
      /* shoulders */
      `<path d="M360 640 Q280 680 230 760" fill="none" stroke="#666" stroke-width="1.2"/>`,
      `<path d="M664 640 Q744 680 794 760" fill="none" stroke="#666" stroke-width="1.2"/>`,
      /* neck */
      `<line x1="470" y1="630" x2="460" y2="680" stroke="#666" stroke-width="1"/>`,
      `<line x1="554" y1="630" x2="564" y2="680" stroke="#666" stroke-width="1"/>`,
      /* soft light ring around face */
      `<ellipse cx="512" cy="400" rx="220" ry="270" fill="none" stroke="#eee" stroke-width="1" stroke-dasharray="3 8"/>`,
      /* sparkle */
      `<text x="650" y="250" font-size="20" fill="#ddd">+</text>`,
      `<text x="350" y="230" font-size="16" fill="#eee">+</text>`,
    ].join('')
  ),

  /* ===== Scene 3: CTA end card ===== */
  'mock:last-frame-3': svg(
    '尾帧 3',
    'CTA 结尾卡',
    [
      /* product bottle */
      `<rect x="180" y="340" width="156" height="280" rx="18" fill="none" stroke="#333" stroke-width="2.2"/>`,
      `<rect x="224" y="270" width="68" height="70" rx="6" fill="none" stroke="#333" stroke-width="1.8"/>`,
      `<rect x="212" y="235" width="92" height="38" rx="8" fill="none" stroke="#333" stroke-width="1.8"/>`,
      `<rect x="238" y="190" width="40" height="45" rx="4" fill="none" stroke="#333" stroke-width="1.2"/>`,
      /* liquid fill */
      `<path d="M190 470 Q258 445 326 470 L326 610 Q258 635 190 610 Z" fill="none" stroke="#bbb" stroke-width="0.6"/>`,
      /* highlight */
      `<path d="M195 370 Q200 480 195 550" fill="none" stroke="#ddd" stroke-width="2"/>`,
      /* label */
      `<rect x="198" y="420" width="120" height="55" rx="4" fill="none" stroke="#888" stroke-width="0.8"/>`,
      `<text x="258" y="452" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#666" font-weight="bold">AquaGlow</text>`,
      /* ------ CTA text box ------ */
      `<rect x="420" y="340" width="420" height="110" rx="12" fill="none" stroke="#333" stroke-width="2.5" stroke-dasharray="8 4"/>`,
      `<text x="630" y="390" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#333" font-weight="bold">开启日常水光护理</text>`,
      `<text x="630" y="425" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#888">Start Your Daily Aqua Routine</text>`,
      /* CTA button */
      `<rect x="530" y="480" width="200" height="52" rx="26" fill="none" stroke="#333" stroke-width="2"/>`,
      `<text x="630" y="512" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#333" font-weight="bold">立即下单</text>`,
      /* footer divider */
      `<line x1="120" y1="840" x2="904" y2="840" stroke="#ddd" stroke-width="0.6"/>`,
      `<text x="512" y="870" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#bbb">www.aquaglow-skincare.com</text>`,
      /* corner crop marks */
      `<line x1="100" y1="180" x2="120" y2="180" stroke="#aaa" stroke-width="1"/>`,
      `<line x1="100" y1="180" x2="100" y2="200" stroke="#aaa" stroke-width="1"/>`,
      `<line x1="924" y1="180" x2="904" y2="180" stroke="#aaa" stroke-width="1"/>`,
      `<line x1="924" y1="180" x2="924" y2="200" stroke="#aaa" stroke-width="1"/>`,
      `<line x1="100" y1="800" x2="120" y2="800" stroke="#aaa" stroke-width="1"/>`,
      `<line x1="100" y1="800" x2="100" y2="780" stroke="#aaa" stroke-width="1"/>`,
      `<line x1="924" y1="800" x2="904" y2="800" stroke="#aaa" stroke-width="1"/>`,
      `<line x1="924" y1="800" x2="924" y2="780" stroke="#aaa" stroke-width="1"/>`,
    ].join('')
  ),
};

/** Resolve a mock image key to its pencil-sketch SVG data URI. */
export function getSketchUrl(key?: string): string {
  if (!key) return '';
  if (SKETCHES[key]) return SKETCHES[key];
  const match = key.match(/(first|last)-frame-(\d)/);
  if (match) {
    const suffix = `mock:${match[1]}-frame-${((Number(match[2]) - 1) % 3) + 1}`;
    return SKETCHES[suffix] || '';
  }
  return '';
}
