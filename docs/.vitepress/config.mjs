import { defineConfig } from 'vitepress';

const defaultNav = [
  { text: 'Home', link: '/' },
  {
    text: 'Guide',
    items: [
      { text: 'Quick Start', link: '/guide/' },
      { text: 'Writing Music', link: '/guide/writing-music.html' },
      { text: 'Neume Keyboard', link: '/guide/keyboard.html' },
      { text: 'Advanced Workflows', link: '/guide/advanced.html' },
    ],
  },
  { text: 'Download', link: '/download/' },
  { text: 'Web App', link: '/web-app/' },
  {
    text: 'Changelog',
    link: 'https://github.com/neanes/neanes/releases',
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
    ['link', { rel: 'shortcut icon', href: '/neanes/favicon.ico' }],
    [
      'meta',
      {
        name: 'google-site-verification',
        content: 'XoQKpk3DKTcf2oug8OVhtP3rbAtGJv0OgiRYIOhHu50',
      },
    ],
  ],
  themeConfig: {
    logo: '/favicon.ico',
    footer: {
      message: 'GPL 3.0 Licensed',
      copyright: 'Copyright © 2020-present danielgarthur',
    },
    nav: defaultNav,
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Quick Start', link: '/guide/' },
            { text: 'Editor Basics', link: '/guide/editor-basics.html' },
            { text: 'Writing Music', link: '/guide/writing-music.html' },
            { text: 'Lyrics', link: '/guide/lyrics.html' },
            {
              text: 'Text, Images, and Paragraph Styles',
              link: '/guide/text-and-styles.html',
            },
            { text: 'Page Layout and Books', link: '/guide/page-layout.html' },
            { text: 'Playback', link: '/guide/playback.html' },
            {
              text: 'Saving, Importing, and Exporting',
              link: '/guide/saving-and-exporting.html',
            },
            { text: 'Advanced Workflows', link: '/guide/advanced.html' },
          ],
        },
        {
          text: 'Reference',
          items: [{ text: 'Neume Keyboard', link: '/guide/keyboard.html' }],
        },
      ],
      '/download/': defaultNav,
      '/web-app/': defaultNav,
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/neanes/neanes' }],
    docsDir: 'docs',
    editLink: {
      pattern: 'https://github.com/neanes/neanes/edit/master/docs/:path',
      text: 'Suggest changes to this page',
    },
  },
});
