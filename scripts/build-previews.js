// Lightweight copies of the portfolio videos, for the grid tiles that play by
// themselves. The originals are 0.5–9MB each (51MB across the 17 clips in the
// grid), which is why a tile could sit grey for seconds before it moved. These
// are capped at 480px wide, silent (the tiles are muted anyway) and front-
// loaded so playback can start on the first chunk.
//
// The full-quality file is still what the quick-view player and the case
// studies use. Previews live beside the original as <name>.preview.mp4 and are
// only rebuilt when the original is newer.
//
//   node scripts/build-previews.js        (needs ffmpeg on PATH)
//
// Run it after scripts/build-work.js, which records the preview path in
// fx/portfolio-data.js.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SECONDS = 10; // how much of each clip the looping tile shows
const previewOf = (src) => src.replace(/\.mp4$/, '.preview.mp4');

function ffmpegOk() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Every clip the grid plays by itself.
function gridClips() {
  const f = path.join(ROOT, 'fx', 'portfolio-data.js');
  const s = fs.readFileSync(f, 'utf8');
  const data = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
  return [...data.videos, ...data.ugc].map((v) => v.src);
}

function build(src) {
  const from = path.join(ROOT, src.replace(/^\//, ''));
  const to = path.join(ROOT, previewOf(src).replace(/^\//, ''));
  if (!fs.existsSync(from)) return ['missing', src];
  if (fs.existsSync(to) && fs.statSync(to).mtimeMs >= fs.statSync(from).mtimeMs) return ['kept', src];
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', from,
    // The grid tile is a silent, looping taster; the originals run up to three
    // minutes, which is what made them heavy. The full clip is one click away.
    '-t', String(SECONDS),
    '-an',
    '-vf', "scale='min(400,iw)':-2,fps=24",
    '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
    '-crf', '32', '-preset', 'veryfast',
    '-movflags', '+faststart',
    to,
  ], { stdio: 'inherit' });
  return ['built', src];
}

if (require.main === module) {
  if (!ffmpegOk()) {
    console.log('build-previews: ffmpeg not found, skipping (tiles fall back to the full file)');
    process.exit(0);
  }
  const clips = gridClips();
  let built = 0;
  let before = 0;
  let after = 0;
  for (const src of clips) {
    const [what] = build(src);
    if (what === 'built') built++;
    if (what === 'missing') { console.log('  missing:', src); continue; }
    before += fs.statSync(path.join(ROOT, src.replace(/^\//, ''))).size;
    after += fs.statSync(path.join(ROOT, previewOf(src).replace(/^\//, ''))).size;
  }
  const mb = (n) => (n / 1048576).toFixed(1);
  console.log(`previews: ${clips.length} clips (${built} rebuilt), ${mb(before)}MB → ${mb(after)}MB`);
}

module.exports = { previewOf };
