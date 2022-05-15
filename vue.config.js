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
    },
  },
};
