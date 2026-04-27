import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

export default defineManifest({
  manifest_version: 3,
  name: 'jtac-audio',
  short_name: 'jtac-audio',
  description: pkg.description,
  version: pkg.version,
  author: { email: 'mikolaj@mszp.pl' },
  homepage_url: 'https://github.com/mszak10/jtac-audio',
  minimum_chrome_version: '116',
  action: {
    default_popup: 'src/popup/popup.html',
    default_title: 'jtac-audio — route this tab to one ear',
    default_icon: {
      '16': 'icon-16.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png',
    },
  },
  icons: {
    '16': 'icon-16.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
  },
  background: {
    service_worker: 'src/background/background.ts',
    type: 'module',
  },
  permissions: ['tabCapture', 'offscreen', 'activeTab', 'tabs'],
  web_accessible_resources: [
    {
      resources: ['src/offscreen/offscreen.html'],
      matches: ['<all_urls>'],
    },
  ],
});
