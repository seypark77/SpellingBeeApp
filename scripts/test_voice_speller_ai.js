const fs = require('fs');
const path = require('path');

// Exact SPOKEN_LETTER_MAP and parseSpokenSpelling from spellingUtils.ts
const SPOKEN_LETTER_MAP = {
  a: 'a', ay: 'a', eh: 'a', hey: 'a', alpha: 'a',
  b: 'b', bee: 'b', be: 'b', bravo: 'b',
  c: 'c', see: 'c', sea: 'c', cee: 'c', si: 'c', charlie: 'c',
  d: 'd', dee: 'd', de: 'd', delta: 'd',
  e: 'e', ee: 'e', echo: 'e',
  f: 'f', ef: 'f', eff: 'f', foxtrot: 'f',
  g: 'g', gee: 'g', jee: 'g', ji: 'g', golf: 'g',
  h: 'h', aitch: 'h', haitch: 'h', ache: 'h', age: 'h', each: 'h', hotel: 'h',
  i: 'i', eye: 'i', aye: 'i', india: 'i',
  j: 'j', jay: 'j', jai: 'j', juliet: 'j',
  k: 'k', kay: 'k', okay: 'k', kilo: 'k',
  l: 'l', el: 'l', ell: 'l', al: 'l', lima: 'l',
  m: 'm', em: 'm', am: 'm', mike: 'm',
  n: 'n', en: 'n', an: 'n', in: 'n', november: 'n',
  o: 'o', oh: 'o', owe: 'o', oscar: 'o',
  p: 'p', pee: 'p', pea: 'p', pi: 'p', papa: 'p',
  q: 'q', cue: 'q', queue: 'q', kyu: 'q', quebec: 'q',
  r: 'r', ar: 'r', are: 'r', our: 'r', romeo: 'r',
  s: 's', es: 's', ess: 's', as: 's', sierra: 's',
  t: 't', tee: 't', tea: 't', ti: 't', tango: 't',
  u: 'u', you: 'u', yew: 'u', yu: 'u', uniform: 'u',
  v: 'v', vee: 'v', victor: 'v',
  w: 'w', doubleu: 'w', doubleyou: 'w', whiskey: 'w',
  x: 'x', ex: 'x', axe: 'x', xray: 'x',
  y: 'y', why: 'y', wye: 'y', yankee: 'y',
  z: 'z', zee: 'z', zed: 'z', zulu: 'z',
  space: ' ',
  hyphen: '-',
  dash: '-'
};

function parseSpokenSpelling(transcript) {
  if (!transcript || !transcript.trim()) return '';

  let cleaned = transcript
    .toLowerCase()
    .replace(/capital\s+/g, '')
    .replace(/double\s+u\b/g, 'w')
    .replace(/double\s+you\b/g, 'w')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawTokens = cleaned.split(' ');
  const outLetters = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    if (!token) continue;

    if (token === 'double' && i + 1 < rawTokens.length) {
      const nextToken = rawTokens[i + 1];
      const mapped = SPOKEN_LETTER_MAP[nextToken] || (nextToken.length === 1 ? nextToken : '');
      if (mapped) {
        outLetters.push(mapped, mapped);
        i++;
        continue;
      }
    }

    if (SPOKEN_LETTER_MAP[token] !== undefined) {
      outLetters.push(SPOKEN_LETTER_MAP[token]);
    } else if (token.length === 1 && /[a-z]/.test(token)) {
      outLetters.push(token);
    } else {
      for (const ch of token) {
        if (/[a-z]/.test(ch)) {
          outLetters.push(ch);
        }
      }
    }
  }

  return outLetters.join('');
}

// NATO Phonetic alphabet table
const NATO = {
  a: 'alpha', b: 'bravo', c: 'charlie', d: 'delta', e: 'echo',
  f: 'foxtrot', g: 'golf', h: 'hotel', i: 'india', j: 'juliet',
  k: 'kilo', l: 'lima', m: 'mike', n: 'november', o: 'oscar',
  p: 'papa', q: 'quebec', r: 'romeo', s: 'sierra', t: 'tango',
  u: 'uniform', v: 'victor', w: 'whiskey', x: 'xray', y: 'yankee', z: 'zulu'
};

// Conversational phonetic letter names
const PHONETIC_NAMES = {
  a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'ef', g: 'gee',
  h: 'aitch', i: 'eye', j: 'jay', k: 'kay', l: 'el', m: 'em', n: 'en',
  o: 'oh', p: 'pee', q: 'cue', r: 'ar', s: 'es', t: 'tee', u: 'you',
  v: 'vee', w: 'double you', x: 'ex', y: 'why', z: 'zee'
};

// Common homophones heard by STT engines for kids
const HOMOPHONE_STT = {
  a: 'eh', b: 'be', c: 'sea', d: 'de', e: 'ee', f: 'eff', g: 'jee',
  h: 'ache', i: 'aye', j: 'jay', k: 'okay', l: 'ell', m: 'am', n: 'an',
  o: 'owe', p: 'pea', q: 'queue', r: 'our', s: 'as', t: 'tea', u: 'you',
  v: 'vee', w: 'double u', x: 'axe', y: 'wye', z: 'zed'
};

// Clean normalizer
function cleanWord(str) {
  return str.toLowerCase().replace(/[^a-z]/g, '');
}

async function runVoiceSpellerTestSuite() {
  console.log('====================================================');
  console.log('🎙️ Voice Speller AI Speech Recognition Audit (Test 3)');
  console.log('====================================================\n');

  const words = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'words.json'), 'utf8'));

  // Select 50 representative test words across all levels
  const testWordIds = [
    1, 2, 3, 4, 10, 20, 22, 28, 46, 50, 75, 86, 91, 100, 102, 117, 131, 148, 150, // One Bee (incl. double letters, hyphens, irregulars)
    151, 160, 172, 181, 192, 205, 219, 221, 226, 230, 235, 247, 250, 267, 285, 300, // Two Bee (incl. piñata, Caesar, chimpanzees)
    301, 316, 328, 335, 347, 361, 376, 381, 396, 406, 417, 418, 425, 439, 450      // Three Bee (incl. complex, foreign, multi-word)
  ];

  const sampleWords = testWordIds.map((id) => words.find((w) => w.id === id));
  console.log(`Selected ${sampleWords.length} representative words for AI voice injection testing.\n`);

  let totalTests = 0;
  let passedTests = 0;

  // Category statistics
  const categories = {
    '1. Standard Spaced Letters ("B U N N Y")': { total: 0, pass: 0 },
    '2. Colloquial Letter Names ("bee you double n why")': { total: 0, pass: 0 },
    '3. Homophones & STT Variations ("our ay in")': { total: 0, pass: 0 },
    '4. NATO Phonetic Alphabet ("bravo uniform...")': { total: 0, pass: 0 },
    '5. Hyphenated & Double Letter Patterns': { total: 0, pass: 0 }
  };

  const failures = [];

  for (const entry of sampleWords) {
    const targetClean = cleanWord(entry.word);
    const chars = entry.word.toLowerCase().split('').filter((ch) => /[a-z]/.test(ch));

    // Pattern 1: Standard Spaced Letters
    {
      const transcript = chars.join(' ');
      const parsed = cleanWord(parseSpokenSpelling(transcript));
      const ok = parsed === targetClean;
      categories['1. Standard Spaced Letters ("B U N N Y")'].total++;
      totalTests++;
      if (ok) {
        categories['1. Standard Spaced Letters ("B U N N Y")'].pass++;
        passedTests++;
      } else {
        failures.push({ word: entry.word, pattern: 'Spaced', input: transcript, output: parsed });
      }
    }

    // Pattern 2: Colloquial Letter Names with "double" compression
    {
      const tokens = [];
      for (let i = 0; i < chars.length; i++) {
        if (i + 1 < chars.length && chars[i] === chars[i + 1]) {
          tokens.push(`double ${PHONETIC_NAMES[chars[i]] || chars[i]}`);
          i++; // skip next
        } else {
          tokens.push(PHONETIC_NAMES[chars[i]] || chars[i]);
        }
      }
      const transcript = tokens.join(' ');
      const parsed = cleanWord(parseSpokenSpelling(transcript));
      const ok = parsed === targetClean;
      categories['2. Colloquial Letter Names ("bee you double n why")'].total++;
      totalTests++;
      if (ok) {
        categories['2. Colloquial Letter Names ("bee you double n why")'].pass++;
        passedTests++;
      } else {
        failures.push({ word: entry.word, pattern: 'Colloquial', input: transcript, output: parsed });
      }
    }

    // Pattern 3: Homophones & Slang STT Variations
    {
      const tokens = chars.map((ch) => HOMOPHONE_STT[ch] || ch);
      const transcript = tokens.join(' ');
      const parsed = cleanWord(parseSpokenSpelling(transcript));
      const ok = parsed === targetClean;
      categories['3. Homophones & STT Variations ("our ay in")'].total++;
      totalTests++;
      if (ok) {
        categories['3. Homophones & STT Variations ("our ay in")'].pass++;
        passedTests++;
      } else {
        failures.push({ word: entry.word, pattern: 'Homophone', input: transcript, output: parsed });
      }
    }

    // Pattern 4: NATO Phonetic Alphabet
    {
      const tokens = chars.map((ch) => NATO[ch] || ch);
      const transcript = tokens.join(' ');
      const parsed = cleanWord(parseSpokenSpelling(transcript));
      const ok = parsed === targetClean;
      categories['4. NATO Phonetic Alphabet ("bravo uniform...")'].total++;
      totalTests++;
      if (ok) {
        categories['4. NATO Phonetic Alphabet ("bravo uniform...")'].pass++;
        passedTests++;
      } else {
        failures.push({ word: entry.word, pattern: 'NATO', input: transcript, output: parsed });
      }
    }

    // Pattern 5: Hyphenated Spoken Input (e.g. "b-u-n-n-y" or "self-sufficient")
    {
      const transcript = entry.word.toLowerCase().split('').join('-');
      const parsed = cleanWord(parseSpokenSpelling(transcript));
      const ok = parsed === targetClean;
      categories['5. Hyphenated & Double Letter Patterns'].total++;
      totalTests++;
      if (ok) {
        categories['5. Hyphenated & Double Letter Patterns'].pass++;
        passedTests++;
      } else {
        failures.push({ word: entry.word, pattern: 'Hyphenated', input: transcript, output: parsed });
      }
    }
  }

  // Print Results
  console.log('▶ [Test 3 Results by Speech Pattern Category]:');
  for (const [cat, stat] of Object.entries(categories)) {
    const rate = Math.round((stat.pass / stat.total) * 100);
    const badge = rate === 100 ? '✅' : rate >= 90 ? '⚠️' : '❌';
    console.log(`  ${badge} ${cat}: ${stat.pass}/${stat.total} (${rate}%)`);
  }

  const overallAccuracy = Math.round((passedTests / totalTests) * 100);
  console.log(`\n• Total Voice Injection Tests: ${totalTests} test cases`);
  console.log(`• Successfully Parsed: ${passedTests} cases (${overallAccuracy}%)`);

  if (failures.length > 0) {
    console.log(`\n⚠️ Detected ${failures.length} Edge Case Failures:`);
    failures.slice(0, 5).forEach((f) => {
      console.log(`  - Target: "${f.word}" (${f.pattern}) | Input: "${f.input}" -> Parsed: "${f.output}"`);
    });
  } else {
    console.log('\n  🌟 FLAWLESS! 0 failures detected across all 250 AI voice variations.');
  }

  console.log('\n====================================================');
  console.log('🏁 Voice Speller AI Speech Recognition Audit Completed!');
  console.log('====================================================');
}

runVoiceSpellerTestSuite();
