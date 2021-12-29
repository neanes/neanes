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
      },
    },
  },
};
