/**
 * Black-and-white pencil-sketch SVG storyboard frames.
 * Each is a 1024x1024 SVG data URI in monochrome sketch style.
 */

const svg = (id: string, body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><rect width="1024" height="1024" fill="#fafafa"/><rect x="8" y="8" width="1008" height="1008" fill="none" stroke="#222" stroke-width="2" stroke-dasharray="8 4" rx="4"/>${body}<text x="980" y="1008" text-anchor="end" font-family="monospace" font-size="16" fill="#999">${id}</text></svg>`)}`;

export const SKETCHES: Record<string, string> = {
  /* ── Scene 1: Morning bedroom, woman at mirror, dry skin ── */
  'mock:first-frame-1': svg(
    '首帧 1',
    [
      /* mirror frame */
      `<ellipse cx="380" cy="340" rx="200" ry="260" fill="none" stroke="#333" stroke-width="2.5"/>`,
      `<ellipse cx="380" cy="340" rx="190" ry="250" fill="none" stroke="#888" stroke-width="0.8" stroke-dasharray="3 6"/>`,
      /* mirror reflection - face */
      `<ellipse cx="380" cy="300" rx="72" ry="90" fill="none" stroke="#333" stroke-width="1.8"/>`,
      /* eyes */
      `<line x1="350" y1="285" x2="370" y2="285" stroke="#333" stroke-width="1.5"/>`,
      `<line x1="390" y1="285" x2="410" y2="285" stroke="#333" stroke-width="1.5"/>`,
      /* nose */
      `<path d="M380 295 Q378 305 380 310" fill="none" stroke="#555" stroke-width="1"/>`,
      /* mouth - slight frown */
      `<path d="M365 330 Q380 325 395 332" fill="none" stroke="#333" stroke-width="1.2"/>`,
      /* dry skin hatching on cheek */
      `<line x1="320" y1="310" x2="330" y2="315" stroke="#aaa" stroke-width="0.6"/>`,
      `<line x1="325" y1="320" x2="335" y2="325" stroke="#aaa" stroke-width="0.6"/>`,
      `<line x1="318" y1="318" x2="328" y2="323" stroke="#aaa" stroke-width="0.6"/>`,
      `<line x1="425" y1="308" x2="415" y2="313" stroke="#aaa" stroke-width="0.6"/>`,
      `<line x1="428" y1="318" x2="418" y2="323" stroke="#aaa" stroke-width="0.6"/>`,
      /* woman at mirror - body silhouette */
      `<ellipse cx="380" cy="480" rx="100" ry="140" fill="none" stroke="#555" stroke-width="1.2"/>`,
      /* shoulder lines */
      `<path d="M280 420 Q300 460 320 490" fill="none" stroke="#555" stroke-width="1"/>`,
      `<path d="M480 420 Q460 460 440 490" fill="none" stroke="#555" stroke-width="1"/>`,
      /* arm reaching toward face */
      `<path d="M480 400 Q460 350 430 320" fill="none" stroke="#555" stroke-width="1.5"/>`,
      /* hand near cheek */
      `<ellipse cx="428" cy="315" rx="18" ry="12" fill="none" stroke="#555" stroke-width="1.2"/>`,
      /* dresser / table */
      `<rect x="280" y="600" width="200" height="12" fill="none" stroke="#555" stroke-width="1.5" rx="2"/>`,
      `<line x1="300" y1="612" x2="300" y2="660" stroke="#555" stroke-width="1.2"/>`,
      `<line x1="460" y1="612" x2="460" y2="660" stroke="#555" stroke-width="1.2"/>`,
      /* window light source */
      `<rect x="720" y="100" width="180" height="220" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="4 4"/>`,
      `<line x1="810" y1="100" x2="810" y2="320" stroke="#999" stroke-width="0.8"/>`,
      `<line x1="720" y1="210" x2="900" y2="210" stroke="#999" stroke-width="0.8"/>`,
      /* light rays */
      `<line x1="720" y1="160" x2="500" y2="340" stroke="#ddd" stroke-width="0.5"/>`,
      `<line x1="780" y1="200" x2="520" y2="380" stroke="#ddd" stroke-width="0.5"/>`,
    ].join('')
  ),

  /* ── Scene 1: Close-up cheek texture ── */
  'mock:last-frame-1': svg(
    '尾帧 1',
    [
      /* zoom border indicator */
      `<rect x="120" y="80" width="784" height="784" fill="none" stroke="#333" stroke-width="2" rx="8"/>`,
      /* zoom arrows */
      `<path d="M80 120 L120 80 M80 80 L120 120" fill="none" stroke="#333" stroke-width="1.2"/>`,
      `<path d="M944 120 L904 80 M944 80 L904 120" fill="none" stroke="#333" stroke-width="1.2"/>`,
      /* face close-up */
      `<ellipse cx="512" cy="420" rx="340" ry="380" fill="none" stroke="#555" stroke-width="1.2"/>`,
      /* cheek area - more visible dry texture */
      `<path d="M300 350 Q350 330 400 340 Q430 360 420 400 Q380 420 340 400 Z" fill="none" stroke="#999" stroke-width="0.8"/>`,
      /* hatching for dry skin */
      `<line x1="310" y1="340" x2="318" y2="360" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="322" y1="335" x2="330" y2="355" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="334" y1="332" x2="342" y2="352" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="346" y1="332" x2="354" y2="352" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="358" y1="335" x2="366" y2="355" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="370" y1="340" x2="378" y2="360" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="382" y1="345" x2="390" y2="365" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="394" y1="348" x2="402" y2="368" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="315" y1="360" x2="323" y2="380" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="330" y1="355" x2="338" y2="375" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="348" y1="352" x2="356" y2="372" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="366" y1="355" x2="374" y2="375" stroke="#bbb" stroke-width="0.5"/>`,
      `<line x1="384" y1="360" x2="392" y2="380" stroke="#bbb" stroke-width="0.5"/>`,
      /* texture annotation */
      `<line x1="500" y1="320" x2="580" y2="320" stroke="#999" stroke-width="0.6"/>`,
      `<text x="590" y="323" font-family="monospace" font-size="13" fill="#999">dry texture</text>`,
      /* eye area */
      `<ellipse cx="450" cy="300" rx="35" ry="20" fill="none" stroke="#333" stroke-width="1.5"/>`,
      `<circle cx="450" cy="300" r="8" fill="#333"/>`,
      /* question mark near eye */
      `<text x="500" y="290" font-family="serif" font-size="28" fill="#777">?</text>`,
    ].join('')
  ),

  /* ── Scene 2: AquaGlow serum bottle product shot ── */
  'mock:first-frame-2': svg(
    '首帧 2',
    [
      /* table surface line */
      `<line x1="200" y1="720" x2="824" y2="720" stroke="#555" stroke-width="1.5"/>`,
      /* table reflection */
      `<line x1="350" y1="730" x2="650" y2="730" stroke="#ccc" stroke-width="0.6"/>`,
      /* bottle body */
      `<rect x="420" y="300" width="180" height="320" rx="20" fill="none" stroke="#333" stroke-width="2"/>`,
      /* bottle neck */
      `<rect x="470" y="230" width="80" height="70" rx="6" fill="none" stroke="#333" stroke-width="1.8"/>`,
      /* cap */
      `<rect x="455" y="195" width="110" height="40" rx="8" fill="none" stroke="#333" stroke-width="1.8"/>`,
      /* dropper */
      `<rect x="490" y="130" width="40" height="65" rx="4" fill="none" stroke="#333" stroke-width="1.5"/>`,
      `<circle cx="510" cy="120" r="15" fill="none" stroke="#333" stroke-width="1.2"/>`,
      /* liquid inside bottle */
      `<path d="M430 450 Q510 430 590 450 L590 610 Q510 630 430 610 Z" fill="none" stroke="#999" stroke-width="0.8" stroke-dasharray="2 4"/>`,
      `<text x="470" y="550" font-family="monospace" font-size="12" fill="#bbb">serum</text>`,
      /* surface reflections on glass */
      `<path d="M435 320 Q440 400 435 500" fill="none" stroke="#ddd" stroke-width="2"/>`,
      `<path d="M450 340 L450 480" fill="none" stroke="#eee" stroke-width="1.5"/>`,
      /* water droplets */
      `<circle cx="520" cy="280" r="8" fill="none" stroke="#999" stroke-width="0.8"/>`,
      `<circle cx="480" cy="310" r="6" fill="none" stroke="#999" stroke-width="0.8"/>`,
      `<circle cx="550" cy="340" r="5" fill="none" stroke="#999" stroke-width="0.8"/>`,
      /* drop lines */
      `<path d="M510 400 Q508 420 510 440" fill="none" stroke="#bbb" stroke-width="0.6"/>`,
      /* highlight on bottle */
      `<path d="M430 320 Q435 400 430 480" fill="none" stroke="#999" stroke-width="0.5"/>`,
      /* label area */
      `<rect x="440" y="380" width="140" height="60" rx="4" fill="none" stroke="#777" stroke-width="0.8"/>`,
      `<text x="510" y="415" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#555" font-weight="bold">AquaGlow</text>`,
    ].join('')
  ),

  /* ── Scene 2: Woman patting cheek, glowing skin ── */
  'mock:last-frame-2': svg(
    '尾帧 2',
    [
      /* woman face profile */
      `<ellipse cx="420" cy="360" rx="160" ry="200" fill="none" stroke="#333" stroke-width="1.8"/>`,
      /* hair outline */
      `<path d="M260 300 Q280 200 380 170 Q480 160 500 200 Q540 280 520 360" fill="none" stroke="#555" stroke-width="1"/>`,
      /* eye */
      `<ellipse cx="460" cy="310" rx="18" ry="12" fill="none" stroke="#333" stroke-width="1.5"/>`,
      `<circle cx="460" cy="310" r="5" fill="#333"/>`,
      /* eyebrow */
      `<path d="M440 290 Q460 283 480 288" fill="none" stroke="#333" stroke-width="1.2"/>`,
      /* nose profile */
      `<path d="M510 320 Q515 345 510 360" fill="none" stroke="#555" stroke-width="1"/>`,
      /* mouth - slight smile */
      `<path d="M440 410 Q470 425 500 410" fill="none" stroke="#333" stroke-width="1.3"/>`,
      /* hand patting cheek */
      `<path d="M340 380 Q320 340 350 300 Q370 270 400 280" fill="none" stroke="#555" stroke-width="1.5"/>`,
      `<ellipse cx="370" cy="310" rx="40" ry="25" fill="none" stroke="#555" stroke-width="1.2"/>`,
      /* fingers */
      `<line x1="350" y1="300" x2="355" y2="285" stroke="#555" stroke-width="1"/>`,
      `<line x1="365" y1="295" x2="368" y2="280" stroke="#555" stroke-width="1"/>`,
      `<line x1="380" y1="295" x2="385" y2="280" stroke="#555" stroke-width="1"/>`,
      /* glow / moisture lines on cheek */
      `<path d="M400 340 Q420 330 440 340" fill="none" stroke="#ccc" stroke-width="1.5"/>`,
      `<path d="M410 360 Q430 350 450 360" fill="none" stroke="#ddd" stroke-width="1"/>`,
      `<circle cx="420" cy="345" r="3" fill="none" stroke="#ccc" stroke-width="0.8"/>`,
      `<circle cx="445" cy="355" r="2" fill="none" stroke="#ccc" stroke-width="0.8"/>`,
      /* small product bottle in corner */
      `<rect x="700" y="600" width="60" height="100" rx="8" fill="none" stroke="#999" stroke-width="1"/>`,
      `<rect x="720" y="570" width="20" height="30" rx="3" fill="none" stroke="#999" stroke-width="0.8"/>`,
      `<text x="730" y="635" text-anchor="middle" font-size="7" fill="#bbb">AG</text>`,
    ].join('')
  ),

  /* ── Scene 3: Woman smiling at camera, smooth makeup ── */
  'mock:first-frame-3': svg(
    '首帧 3',
    [
      /* face front view */
      `<ellipse cx="512" cy="380" rx="180" ry="230" fill="none" stroke="#333" stroke-width="2"/>`,
      /* hair */
      `<path d="M332 280 Q350 170 450 150 Q550 140 600 160 Q680 190 692 300" fill="none" stroke="#555" stroke-width="1.2"/>`,
      `<path d="M332 280 Q320 300 340 350 Q350 380 360 400" fill="none" stroke="#555" stroke-width="1"/>`,
      `<path d="M692 300 Q700 320 680 380" fill="none" stroke="#555" stroke-width="1"/>`,
      /* eyes */
      `<ellipse cx="440" cy="320" rx="30" ry="16" fill="none" stroke="#333" stroke-width="1.8"/>`,
      `<circle cx="440" cy="320" r="8" fill="#333"/>`,
      `<circle cx="438" cy="318" r="3" fill="#fafafa"/>`,
      `<ellipse cx="584" cy="320" rx="30" ry="16" fill="none" stroke="#333" stroke-width="1.8"/>`,
      `<circle cx="584" cy="320" r="8" fill="#333"/>`,
      `<circle cx="582" cy="318" r="3" fill="#fafafa"/>`,
      /* eyebrows */
      `<path d="M410 290 Q440 278 470 288" fill="none" stroke="#333" stroke-width="1.3"/>`,
      `<path d="M554 288 Q584 278 614 290" fill="none" stroke="#333" stroke-width="1.3"/>`,
      /* nose */
      `<path d="M512 340 Q505 365 500 380 Q510 385 512 385" fill="none" stroke="#555" stroke-width="1"/>`,
      /* smile */
      `<path d="M440 420 Q470 450 512 450 Q554 450 584 420" fill="none" stroke="#333" stroke-width="1.8"/>`,
      /* smooth skin annotation */
      `<text x="330" y="250" font-family="monospace" font-size="13" fill="#999">smooth</text>`,
      `<line x1="330" y1="255" x2="410" y2="255" stroke="#999" stroke-width="0.5"/>`,
      /* shoulders */
      `<path d="M380 610 Q300 640 260 720" fill="none" stroke="#555" stroke-width="1.2"/>`,
      `<path d="M644 610 Q724 640 764 720" fill="none" stroke="#555" stroke-width="1.2"/>`,
      /* neck */
      `<line x1="470" y1="590" x2="465" y2="630" stroke="#555" stroke-width="1"/>`,
      `<line x1="554" y1="590" x2="559" y2="630" stroke="#555" stroke-width="1"/>`,
      /* confidence sparkle near face */
      `<text x="640" y="260" font-size="22" fill="#ddd">+</text>`,
      `<text x="620" y="230" font-size="16" fill="#eee">+</text>`,
    ].join('')
  ),

  /* ── Scene 3: Product bottle + CTA, ad closing card ── */
  'mock:last-frame-3': svg(
    '尾帧 3',
    [
      /* product bottle (smaller, centered left) */
      `<rect x="200" y="320" width="140" height="260" rx="16" fill="none" stroke="#333" stroke-width="2"/>`,
      `<rect x="240" y="260" width="60" height="60" rx="5" fill="none" stroke="#333" stroke-width="1.5"/>`,
      `<rect x="230" y="230" width="80" height="34" rx="6" fill="none" stroke="#333" stroke-width="1.5"/>`,
      `<rect x="250" y="190" width="40" height="40" rx="3" fill="none" stroke="#333" stroke-width="1"/>`,
      /* liquid level inside */
      `<path d="M210 440 Q270 420 330 440 L330 570 Q270 590 210 570 Z" fill="none" stroke="#aaa" stroke-width="0.6"/>`,
      /* surface highlight */
      `<path d="M215 350 Q220 430 215 500" fill="none" stroke="#ddd" stroke-width="1.8"/>`,
      /* label */
      `<rect x="215" y="380" width="110" height="50" rx="3" fill="none" stroke="#777" stroke-width="0.8"/>`,
      `<text x="270" y="410" text-anchor="middle" font-size="11" fill="#666">AquaGlow</text>`,
      /* ------ CTA text box ------ */
      `<rect x="440" y="340" width="380" height="100" rx="10" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="6 4"/>`,
      `<text x="630" y="390" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#333" font-weight="bold">开启日常水光护理</text>`,
      `<text x="630" y="420" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#777">Start Your Daily Aqua Routine</text>`,
      /* CTA button sketch */
      `<rect x="540" y="460" width="180" height="48" rx="24" fill="none" stroke="#333" stroke-width="1.8"/>`,
      `<text x="630" y="490" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#333">下单</text>`,
      /* footer divider */
      `<line x1="150" y1="820" x2="874" y2="820" stroke="#ccc" stroke-width="0.6"/>`,
      /* footer text */
      `<text x="512" y="850" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#999">www.aquaglow-skincare.com</text>`,
      /* corner marks */
      `<line x1="140" y1="180" x2="160" y2="180" stroke="#999" stroke-width="1"/>`,
      `<line x1="140" y1="180" x2="140" y2="200" stroke="#999" stroke-width="1"/>`,
      `<line x1="884" y1="180" x2="864" y2="180" stroke="#999" stroke-width="1"/>`,
      `<line x1="884" y1="180" x2="884" y2="200" stroke="#999" stroke-width="1"/>`,
      `<line x1="140" y1="780" x2="160" y2="780" stroke="#999" stroke-width="1"/>`,
      `<line x1="140" y1="780" x2="140" y2="760" stroke="#999" stroke-width="1"/>`,
      `<line x1="884" y1="780" x2="864" y2="780" stroke="#999" stroke-width="1"/>`,
      `<line x1="884" y1="780" x2="884" y2="760" stroke="#999" stroke-width="1"/>`,
    ].join('')
  ),
};

/** Resolve a mock image key to its pencil-sketch SVG data URI. */
export function getSketchUrl(key?: string): string {
  if (!key) return '';
  if (SKETCHES[key]) return SKETCHES[key];
  /* fallback: cycle through scenes 1-3 */
  const match = key.match(/(first|last)-frame-(\d)/);
  if (match) {
    const suffix = `mock:${match[1]}-frame-${((Number(match[2]) - 1) % 3) + 1}`;
    return SKETCHES[suffix] || '';
  }
  return '';
}
