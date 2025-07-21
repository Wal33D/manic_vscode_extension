import * as path from 'path';
import * as webpack from 'webpack';

const config: webpack.Configuration = {
  mode: 'development',
  optimization: {
    minimize: false,
  },
  entry: './browser.tsx',
  output: {
    // path: path.resolve(__dirname, 'dist'),
    path: path.resolve(__dirname),
    filename: 'browser.js'
  },
  // devServer: {
  //   contentBase: './',
  // },
  devtool: 'source-map',
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"],

    // node polyfills
    // assert: "assert",
    // buffer: "buffer",
    // console: "console-browserify",
    // constants: "constants-browserify",
    // crypto: "crypto-browserify",
    // domain: "domain-browser",
    // events: "events",
    // http: "stream-http",
    // https: "https-browserify",
    // os: "os-browserify/browser",
    // path: "path-browserify",
    // punycode: "punycode",
    // process: "process/browser",
    // querystring: "querystring-es3",
    // stream: "stream-browserify",
    // _stream_duplex: "readable-stream/duplex",
    // _stream_passthrough: "readable-stream/passthrough",
    // _stream_readable: "readable-stream/readable",
    // _stream_transform: "readable-stream/transform",
    // _stream_writable: "readable-stream/writable",
    // string_decoder: "string_decoder",
    // sys: "util",
    // timers: "timers-browserify",
    // tty: "tty-browserify",
    // url: "url",
    // util: "util",
    // vm: "vm-browserify",
    // zlib: "browserify-zlib"
    fallback: {
      util: path.dirname(require.resolve('util/package')),
      process: require.resolve("process/browser")
    }
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: require.resolve('ts-loader'),
            options: {
              transpileOnly: true,
              
            }
          }
        ]
      }
    ]
  },
  // polyfill node globals
  node: {
    __dirname: true,
    __filename: true,
    global: true
  },
  plugins: [
    new webpack.DefinePlugin({
      // "process": 'require("process")'
    }),
    new webpack.ProvidePlugin({
      process: 'process',
    }),
  ]
};

export default config;