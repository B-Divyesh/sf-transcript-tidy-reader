import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Transcript Tidy',
    description: 'Turn captions you can already access into a calm, searchable reading view.',
    version: '1.0.1',
    permissions: ['activeTab', 'storage', 'tabs'],
    host_permissions: [
      'https://www.youtube.com/*',
      'https://youtube.com/*',
      'https://youtu.be/*',
      'https://www.ted.com/*',
      'https://ted.com/*',
      'https://*.googlevideo.com/*',
      'https://api.sociobot.in/*'
    ],
    action: {
      default_title: 'Open Transcript Tidy',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png'
      }
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png'
    },
    web_accessible_resources: [
      {
        resources: ['reader.html'],
        matches: ['<all_urls>']
      }
    ]
  },
  vite: () => ({
    build: {
      target: 'es2022'
    }
  })
});
