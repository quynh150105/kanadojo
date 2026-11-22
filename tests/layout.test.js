import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('card faces fill their parent using the native StyleSheet API', () => {
  const source = fs.readFileSync(new URL('../src/styles.js', import.meta.url), 'utf8')
    .replace(/^import \{ StyleSheet \} from 'react-native';\r?\n/, '')
    .replace('export const colors', 'const colors')
    .replace('export default StyleSheet.create(', 'globalThis.styles = StyleSheet.create(');
  const context = vm.createContext({
    StyleSheet: {
      create: (styles) => styles,
      absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
    },
  });
  vm.runInContext(source, context);
  assert.equal(context.styles.cardFace.position, 'absolute');
  for (const edge of ['top', 'right', 'bottom', 'left']) {
    assert.equal(context.styles.cardFace[edge], 0);
  }
});
