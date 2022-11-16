process.env.VUE_APP_VERSION = process.env.npm_package_version;

module.exports = {
  configureWebpack: {
    devtool: 'source-map',
  },
  pluginOptions: {
    electronBuilder: {
      preload: 'src/preload.js',
      builderOptions: {
        appId: 'com.danielgarthur.neanes',
        productName: 'Neanes',
        copyright: 'Copyright © 2021 danielgarthur',
        publish: ['github'],
        fileAssociations: [
          {
            ext: 'byz',
            name: 'Neanes File',
            role: 'Editor',
          },
          {
            ext: 'byzx',
            name: 'Uncompressed Neanes File',
          },
        ],
        snap: {
          publish: ['github'],
        },
      },
      chainWebpackRendererProcess(config) {
        config.plugins.delete('workbox');
        config.plugins.delete('pwa');
      },
      chainWebpackMainProcess(config) {
        config.module
          .rule('babel')
          .before('ts')
          .use('babel')
          .loader('babel-loader')
          .options({
            presets: [
              [
                '@babel/preset-env',
                { modules: false, targets: { electron: 16 } },
              ],
              '@babel/preset-typescript',
            ],
          });
      },
    },
  },
  pwa: {
    name: 'Neanes',
    themeColor: '#052F43',
    iconPaths: {
      favicon32: 'favicon-32.png',
      favicon16: 'favicon-16.png',
      appleTouchIcon: 'apple-touch-icon.png',
      msTileImage: 'msapplication-icon.png',
      maskIcon: 'safari-pinned-tab.svg',
    },
    manifestOptions: {
      name: 'Neanes',
      short_name: 'Neanes',
      icons: [
        {
          src: 'assets/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'maskable any',
        },
        {
          src: 'assets/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'maskable any',
        },
        {
          src: 'assets/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'maskable any',
        },
        {
          src: 'assets/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'maskable any',
        },
        {
          src: 'assets/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'maskable any',
        },
        {
          src: 'assets/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any',
        },
        {
          src: 'assets/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'maskable any',
        },
        {
          src: 'assets/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any',
        },
      ],
    },
  },
  publicPath:
    process.env.NODE_ENV === 'production' && !process.env.IS_ELECTRON
      ? '/neanes-web-app/'
      : '/',
};
