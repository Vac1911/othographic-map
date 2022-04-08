const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: {
    leaflet: ["./src/leaflet/index.js", "./src/leaflet/styles.scss"],
    components: ["./src/components/index.ts"],
    d3: ["./src/d3/index.ts"],
    webgl: ["./src/webgl/index.ts"],
  },
  watch: true,
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "public/js"),
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      { test: /\.ts$/, use: "ts-loader" },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: "file-loader",
            options: { outputPath: "../css/", name: "[name].min.css" },
          },
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
    ],
  },
  plugins: [new webpack.SourceMapDevToolPlugin({})],
};
