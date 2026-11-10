const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '..', 'src', 'data', 'words_base.json');
const outPath = path.join(__dirname, '..', 'src', 'data', 'mw_fetched.json');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

function decodeHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSentences(html, targetWord) {
  const candidates = [];
  // Look for standard Merriam-Webster example spans: <span class="ex-sent ...">...</span> or <div class="in-sentences">
  const exSentRegex = /<span[^>]*class="[^"]*\b(?:ex-sent|t)\b[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  let match;
  while ((match = exSentRegex.exec(html)) !== null) {
    const text = decodeHtml(match[1]);
    // Filter out author citations or tiny fragments
    if (
      text.length >= 20 &&
      text.length <= 180 &&
      !text.startsWith('—') &&
      !text.startsWith('--')
    ) {
      candidates.push(text);
    }
  }
  const baseLower = targetWord.toLowerCase();
  // Prefer a sentence that actually contains the exact word (case-insensitive) and starts with a capital letter or looks like a complete sentence
  const exactFull = candidates.find(
    (s) =>
      s.toLowerCase().includes(baseLower) &&
      /^[A-Z]/.test(s) &&
      /[.!?]$/.test(s)
  );
  if (exactFull) return exactFull;

  const exactAny = candidates.find((s) => s.toLowerCase().includes(baseLower));
  if (exactAny) {
    let formatted = exactAny.charAt(0).toUpperCase() + exactAny.slice(1);
    if (!/[.!?]$/.test(formatted)) formatted += '.';
    return formatted;
  }
  return null;
}

async function fetchForWord(entry) {
  const urlWord = encodeURIComponent(entry.word);
  const url = `https://www.merriam-webster.com/dictionary/${urlWord}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractSentences(html, entry.word);
  } catch (err) {
    return null;
  }
}

async function main() {
  const results = {};
  const concurrency = 15;
  let completed = 0;

  for (let i = 0; i < words.length; i += concurrency) {
    const batch = words.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (entry) => {
        const sentence = await fetchForWord(entry);
        if (sentence) {
          results[entry.id] = sentence;
        }
        completed++;
      })
    );
    process.stdout.write(`\rFetched ${completed}/${words.length} (found ${Object.keys(results).length})`);
  }
  console.log('\nDone fetching from Merriam-Webster!');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
}

main();
