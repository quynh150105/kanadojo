export default {
  name: 'Hiragana Flashcards',
  slug: 'learn-japanese',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0a1020',
  android: {
    package: 'com.learnjapanese.flashcards',
  },
  web: {
    bundler: 'metro',
    output: 'single',
  },
  experiments: {
    baseUrl: process.env.EXPO_BASE_URL ?? '',
  },
};
