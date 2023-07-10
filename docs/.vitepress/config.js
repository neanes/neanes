import { defineConfig } from 'vitepress';

const defaultNav = [
  { text: 'Home', link: '/' },
  {
    text: 'Guide',
    items: [
      { text: 'Getting Started', link: '/guide/' },
      { text: 'Neume Keyboard', link: '/guide/keyboard.html' },
      { text: 'Advanced', link: '/guide/advanced.html' },
    ],
  },
  { text: 'Download', link: '/download/' },
  { text: 'Web App', link: '/web-app/' },
  {
    text: 'Changelog',
    link: 'https://github.com/danielgarthur/neanes/releases',
  },
];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Neanes',
  titleTemplate: 'A Byzantine Chant Scorewriter',
  description:
    'Neanes is a free and open source scorewriter for notating Byzantine chant in Byzantine notation.',
  base: '/neanes/',
  head: [
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
    [
      'meta',
      {
        name: 'google-site-verification',
        content: 'XoQKpk3DKTcf2oug8OVhtP3rbAtGJv0OgiRYIOhHu50',
      },
    ],
  ],
  themeConfig: {
    logo: '/favicon.svg',
    footer: {
      message: 'GPL 3.0 Licensed',
      copyright: 'Copyright © 2020-present danielgarthur',
    },
    nav: defaultNav,
    sidebar: {
      '/guide/': defaultNav,
      '/download/': defaultNav,
      '/web-app/': defaultNav,
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/danielgarthur/neanes' },
    ],
    docsDir: 'docs',
    editLink: {
      pattern: 'https://github.com/danielgarthur/neanes/tree/master/:path',
      text: 'Suggest changes to this page',
    },
  },
});
