// Voice command matching. Pure functions, no browser APIs, so it is unit-tested in Node.
// English phrases are accepted in every language because people often mix languages.

export const COMMANDS = {
  read: {
    en: ['read this', 'read it', 'read', 'reader', 'scan', 'camera'],
    ta: ['இதைப் படி', 'இதை படி', 'படி', 'படிக்கவும்', 'வாசி', 'கேமரா'],
    hi: ['इसे पढ़ो', 'इसे पढ़ें', 'पढ़ो', 'पढ़ें', 'पढ़कर सुनाओ', 'कैमरा', 'padho'],
  },
  form: {
    en: ['fill a form', 'fill form', 'fill the form', 'form'],
    ta: ['படிவம் நிரப்பு', 'படிவத்தை நிரப்பு', 'படிவம்', 'ஃபார்ம்'],
    hi: ['फ़ॉर्म भरो', 'फॉर्म भरो', 'फ़ॉर्म', 'फॉर्म', 'form bharo'],
  },
  places: {
    en: ['places near me', 'places nearby', 'near me', 'places', 'map', 'nearby'],
    ta: ['அருகில் உள்ள இடங்கள்', 'அருகில் இடங்கள்', 'இடங்கள்', 'வரைபடம்'],
    hi: ['आस पास की जगहें', 'आसपास की जगहें', 'आस पास', 'आसपास', 'जगहें', 'नक्शा'],
  },
  repeat: {
    en: ['repeat', 'say again', 'say that again', 'again', 'pardon'],
    ta: ['மீண்டும் சொல்', 'மீண்டும்', 'திரும்ப சொல்', 'திரும்ப'],
    hi: ['दोहराओ', 'दोहराएँ', 'फिर से बोलो', 'फिर से', 'दोबारा'],
  },
  stop: {
    en: ['stop', 'be quiet', 'quiet', 'shut up', 'pause', 'cancel'],
    ta: ['நிறுத்து', 'நிறுத்துங்கள்', 'போதும்', 'அமைதி'],
    hi: ['रुको', 'रुकिए', 'बंद करो', 'बस', 'चुप'],
  },
  slower: {
    en: ['slower', 'slow down', 'more slowly', 'slow'],
    ta: ['மெதுவாக', 'மெதுவா', 'வேகம் குறை'],
    hi: ['धीरे', 'धीरे बोलो', 'धीमे'],
  },
  faster: {
    en: ['faster', 'speed up', 'more quickly', 'quicker', 'fast'],
    ta: ['வேகமாக', 'வேகமா', 'வேகம் கூட்டு'],
    hi: ['तेज़', 'तेज', 'तेज़ बोलो', 'जल्दी बोलो'],
  },
  louder: {
    en: ['louder', 'volume up', 'speak up'],
    ta: ['சத்தம் கூட்டு', 'சத்தமாக', 'ஒலி கூட்டு'],
    hi: ['आवाज़ बढ़ाओ', 'आवाज बढ़ाओ', 'ज़ोर से', 'जोर से'],
  },
  quieter: {
    en: ['quieter', 'volume down', 'softer', 'lower volume'],
    ta: ['சத்தம் குறை', 'ஒலி குறை'],
    hi: ['आवाज़ कम करो', 'आवाज कम करो', 'आवाज़ कम', 'धीमी आवाज़'],
  },
  help: {
    en: ['help', 'commands', 'what can i say', 'options', 'menu'],
    ta: ['உதவி', 'கட்டளைகள்'],
    hi: ['मदद', 'सहायता', 'हेल्प', 'आदेश'],
  },
  language: {
    en: ['change language', 'language', 'switch language'],
    ta: ['மொழியை மாற்று', 'மொழி மாற்று', 'மொழி'],
    hi: ['भाषा बदलो', 'भाषा बदलें', 'भाषा'],
  },
  home: {
    en: ['go home', 'home', 'main menu', 'go back home', 'start again'],
    ta: ['முகப்பு', 'முகப்புக்கு போ', 'முதல் பக்கம்'],
    hi: ['होम', 'होम पर जाओ', 'घर जाओ', 'मुख्य मेनू'],
  },
  clear: {
    en: ['clear everything', 'clear all', 'delete everything', 'forget everything', 'erase everything'],
    ta: ['எல்லாம் அழி', 'அனைத்தையும் அழி', 'எல்லாவற்றையும் அழி'],
    hi: ['सब मिटाओ', 'सब कुछ मिटाओ', 'सब हटाओ', 'सब साफ़ करो'],
  },
  settings: {
    en: ['settings', 'open settings'],
    ta: ['அமைப்புகள்'],
    hi: ['सेटिंग', 'सेटिंग्स'],
  },
  yes: {
    en: ['yes', 'yeah', 'yep', 'confirm', 'okay', 'ok', 'correct', 'sure'],
    ta: ['ஆம்', 'ஆமாம்', 'சரி', 'ஆமா'],
    hi: ['हाँ', 'हां', 'हा', 'जी हाँ', 'ठीक है', 'सही'],
  },
  no: {
    en: ['no', 'nope', 'not now', 'dont', "don't", 'wrong'],
    ta: ['இல்லை', 'வேண்டாம்', 'இல்ல'],
    hi: ['नहीं', 'नही', 'मत करो', 'ना'],
  },
};

// Language names, used both for "change language" answers and for direct switches ("Tamil").
export const LANGUAGE_WORDS = {
  en: ['english', 'ஆங்கிலம்', 'इंग्लिश', 'अंग्रेज़ी', 'अंग्रेजी'],
  ta: ['tamil', 'தமிழ்', 'तमिल'],
  hi: ['hindi', 'இந்தி', 'ஹிந்தி', 'हिंदी', 'हिन्दी'],
};

export function normalize(text) {
  return String(text || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,!?;:"'()\[\]{}।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a, b) {
  const A = [...a], B = [...b];
  if (!A.length) return B.length;
  if (!B.length) return A.length;
  let prev = Array.from({ length: B.length + 1 }, (_, i) => i);
  for (let i = 1; i <= A.length; i++) {
    const cur = [i];
    for (let j = 1; j <= B.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[B.length];
}

function similarity(a, b) {
  const len = Math.max([...a].length, [...b].length) || 1;
  return 1 - levenshtein(a, b) / len;
}

// Does `phrase` appear in `text` as whole words? Scripts without spaces between
// syllables still use spaces between words, so a padded includes() is enough.
function containsPhrase(text, phrase) {
  return ` ${text} `.includes(` ${phrase} `);
}

/**
 * Match an utterance to a command.
 * @param {string} utterance raw recognised text
 * @param {string} lang 'en' | 'ta' | 'hi'
 * @param {string[]} [allowed] optional subset of command ids (e.g. ['yes','no'] while confirming)
 * @returns {{id: string, score: number, language?: string} | null}
 */
export function matchCommand(utterance, lang = 'en', allowed = null) {
  const text = normalize(utterance);
  if (!text) return null;

  const ids = allowed || Object.keys(COMMANDS);

  // A bare language name switches language directly.
  if (!allowed || allowed.includes('language')) {
    for (const [code, words] of Object.entries(LANGUAGE_WORDS)) {
      if (words.some((w) => containsPhrase(text, normalize(w)))) {
        return { id: 'language', score: 1, language: code };
      }
    }
  }

  const candidates = [];
  for (const id of ids) {
    const table = COMMANDS[id];
    if (!table) continue;
    // Current language first, then the others (people mix languages, and recognisers sometimes switch script).
    const phrases = [...(table[lang] || []), ...Object.entries(table).filter(([l]) => l !== lang).flatMap(([, v]) => v)];
    for (const p of phrases) candidates.push({ id, phrase: normalize(p) });
  }

  // 1. Exact or contained phrase. Longest phrase wins so "fill a form" beats "form"
  //    and "slow down" beats "down".
  const contained = candidates
    .filter((c) => text === c.phrase || containsPhrase(text, c.phrase))
    .sort((a, b) => b.phrase.length - a.phrase.length);
  if (contained.length) return { id: contained[0].id, score: text === contained[0].phrase ? 1 : 0.9 };

  // 2. Fuzzy match on the whole utterance, for small recognition errors ("reed this").
  let best = null;
  for (const c of candidates) {
    const s = similarity(text, c.phrase);
    if (!best || s > best.score) best = { id: c.id, score: s };
  }
  if (best && best.score >= 0.75) return best;
  return null;
}
