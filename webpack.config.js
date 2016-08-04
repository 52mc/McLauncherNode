var path = require('path');
var webpack = require('webpack');

var plugins = [
  new webpack.DefinePlugin({
  }),
  new webpack.BannerPlugin('This file is created by eeve.'),
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    test: /(\.jsx|\.js)$/,
    compress: {
      warnings: false
    }
  }),
  new webpack.NoErrorsPlugin()
];

var config = {
  context: __dirname,
  cache: true,
  target: 'electron', // http://webpack.github.io/docs/configuration.html#target
  entry: {
    'launcher': ['babel-polyfill', './src/launcher.js']
  },
  output: {
    // 页面相对路径
    publicPath: "/",
    // 生成文件所在路径
    path: path.resolve(__dirname, "dist"),
    // 文件名
    filename: '[name].js',
    // Which format to export the library
    libraryTarget: 'umd'
  },
  plugins: plugins,
  devtool: '#source-map',
  module:{
    loaders:[
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'stage-0']
        }
      },
      { test: /\.json?$/, loader: 'json-loader' }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.json'],
    modulesDirectories: ["node_modules", "bower_components"]
  }
};

module.exports = config;
