module.exports = {
  title: 'Neanes Byzantine Chant Scorewriter',
  description:
    'Neanes is a free and open source scorewriter for notating Byzantine chant in Byzantine notation.',
  base: '/neanes/',
  head: [['link', { rel: 'shortcut icon', href: '/favicon.ico' }]],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      {
        text: 'Download',
        link: '/download/',
      },
      {
        text: 'Changelog',
        link: 'https://github.com/danielgarthur/neanes/releases',
      },
    ],
    sidebar: {
      '/guide/': [''],
      '/download/': [''],
    },
    repo: 'danielgarthur/neanes',
    docsDir: 'docs',
    //editLinks: true,
    //editLinkText: 'Is something wrong or missing? Edit this page on github!',
  },
};
