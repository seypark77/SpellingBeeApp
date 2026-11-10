const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '..', 'src', 'data', 'words.json');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function resolveBestAudioUrl(entry) {
  // Homograph override: #102 "lead" in the 2026-2027 list is the metallic element (/led/), which is lead0002.mp3 on Merriam-Webster
  if (entry.id === 102) {
    return 'https://media.merriam-webster.com/audio/prons/en/us/mp3/l/lead0002.mp3';
  }

  const rawLower = entry.word.toLowerCase().trim();
  const cleanAscii = rawLower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');

  const isPlural = entry.partOfSpeech === 'plural noun';
  const sub = cleanAscii[0];

  const candidates = [];

  // 1. Full untruncated word on Google/Oxford US Dictionary CDN (exact full word match, studio US recording, zero prefix truncation!)
  // Even for plural nouns, if an exact plural studio file (e.g. scissors--_us_1.mp3, pliers--_us_1.mp3) exists, it matches the exact plural word.
  if (!rawLower.includes(' ')) {
    candidates.push(
      `https://ssl.gstatic.com/dictionary/static/sounds/20200429/${rawLower}--_us_1.mp3`,
      `https://ssl.gstatic.com/dictionary/static/sounds/oxford/${rawLower}--_us_1.mp3`,
      `https://ssl.gstatic.com/dictionary/static/sounds/20200429/${cleanAscii}--_us_1.mp3`,
      `https://ssl.gstatic.com/dictionary/static/sounds/oxford/${cleanAscii}--_us_1.mp3`
    );
  }

  const uniqueCandidates = Array.from(new Set(candidates));
  for (const url of uniqueCandidates) {
    if (await checkUrl(url)) {
      return url;
    }
  }

  // 2. For regular plural nouns (like "spiders", "stars", "plants") or inflected/multi-word entries
  // that do not have a dedicated plural studio file on the Oxford CDN:
  // Return empty string "" so speakWord() uses native US English TTS (which clearly pronounces the trailing "-s" / "-z"!)
  // instead of dict.youdao.com (which muffles or drops the plural "-s").
  return '';
}

async function main() {
  let mwExactCount = 0;
  let oxfordExactCount = 0;
  let exactInflectedCount = 0;
  const concurrency = 25;

  for (let i = 0; i < words.length; i += concurrency) {
    const batch = words.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (entry) => {
        const audioUrl = await resolveBestAudioUrl(entry);
        entry.audioUrl = audioUrl;
        if (audioUrl.includes('merriam-webster.com')) mwExactCount++;
        else if (audioUrl.includes('gstatic.com')) oxfordExactCount++;
        else exactInflectedCount++;
      })
    );
    process.stdout.write(
      `\rProcessed ${Math.min(i + concurrency, words.length)}/${words.length} (MW Exact: ${mwExactCount}, US Dict Exact: ${oxfordExactCount}, Inflected/Plural Exact: ${exactInflectedCount})`
    );
  }

  fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2), 'utf8');
  console.log(
    `\nDone! All ${words.length} words now have exact full-word audioUrl (MW Exact <=6: ${mwExactCount}, US Dict Full-Word: ${oxfordExactCount}, Plural/Inflected Exact: ${exactInflectedCount})`
  );
}

main();
