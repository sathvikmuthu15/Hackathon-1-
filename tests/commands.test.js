import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchCommand, COMMANDS } from '../client/src/commands.js';
import { STRINGS } from '../client/src/i18n.js';

const id = (u, l = 'en', allowed) => matchCommand(u, l, allowed)?.id ?? null;

test('english commands', () => {
  assert.equal(id('read this'), 'read');
  assert.equal(id('Read this, please'), 'read');
  assert.equal(id('fill a form'), 'form');
  assert.equal(id('places near me'), 'places');
  assert.equal(id('repeat'), 'repeat');
  assert.equal(id('stop'), 'stop');
  assert.equal(id('slower'), 'slower');
  assert.equal(id('slow down'), 'slower');
  assert.equal(id('faster'), 'faster');
  assert.equal(id('help'), 'help');
  assert.equal(id('change language'), 'language');
  assert.equal(id('go home'), 'home');
  assert.equal(id('clear everything'), 'clear');
  assert.equal(id('louder'), 'louder');
  assert.equal(id('quieter'), 'quieter');
});

test('small recognition errors still match', () => {
  assert.equal(id('reed this'), 'read');
  assert.equal(id('fill a farm'), 'form');
  assert.equal(id('clear every thing'), 'clear');
});

test('nonsense does not match', () => {
  assert.equal(id('what is the weather like today'), null);
  assert.equal(id(''), null);
});

test('tamil commands', () => {
  assert.equal(id('இதைப் படி', 'ta'), 'read');
  assert.equal(id('படிவம் நிரப்பு', 'ta'), 'form');
  assert.equal(id('நிறுத்து', 'ta'), 'stop');
  assert.equal(id('உதவி', 'ta'), 'help');
  assert.equal(id('எல்லாம் அழி', 'ta'), 'clear');
  assert.equal(id('ஆம்', 'ta', ['yes', 'no']), 'yes');
  assert.equal(id('stop', 'ta'), 'stop', 'english works in tamil mode');
});

test('hindi commands', () => {
  assert.equal(id('इसे पढ़ो', 'hi'), 'read');
  assert.equal(id('फ़ॉर्म भरो', 'hi'), 'form');
  assert.equal(id('फॉर्म भरो', 'hi'), 'form');
  assert.equal(id('रुको', 'hi'), 'stop');
  assert.equal(id('मदद', 'hi'), 'help');
  assert.equal(id('सब मिटाओ', 'hi'), 'clear');
  assert.equal(id('आवाज़ कम करो', 'hi'), 'quieter');
  assert.equal(id('धीरे', 'hi'), 'slower');
  assert.equal(id('हाँ', 'hi', ['yes', 'no']), 'yes');
});

test('language names switch directly', () => {
  assert.deepEqual(matchCommand('tamil', 'en'), { id: 'language', score: 1, language: 'ta' });
  assert.equal(matchCommand('हिंदी', 'ta').language, 'hi');
  assert.equal(matchCommand('english please', 'hi').language, 'en');
});

test('confirmation restricts commands', () => {
  assert.equal(id('read this', 'en', ['yes', 'no', 'stop']), null);
  assert.equal(id('yes', 'en', ['yes', 'no', 'stop']), 'yes');
  assert.equal(id('no', 'en', ['yes', 'no', 'stop']), 'no');
});

test('every phrase maps back to its own command', () => {
  for (const [cmd, table] of Object.entries(COMMANDS)) {
    for (const [lang, phrases] of Object.entries(table)) {
      for (const p of phrases) {
        const got = matchCommand(p, lang);
        // a phrase that is also a language name is fine
        if (got?.id === 'language' && got.language) continue;
        assert.equal(got?.id, cmd, `"${p}" (${lang}) -> ${got?.id}`);
      }
    }
  }
});

test('all languages define every string', () => {
  for (const k of Object.keys(STRINGS.en)) {
    for (const l of ['ta', 'hi']) assert.ok(STRINGS[l][k], `${l} missing ${k}`);
  }
});
