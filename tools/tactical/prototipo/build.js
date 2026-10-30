// Gera a página do protótipo (um arquivo HTML só, com o código dentro).
// Uso: node tools/tactical/prototipo/build.js [saida.html]
const path = require("path");
const fs = require("fs");
const GS = path.join(__dirname, "..", "..", "..", "agot-bg-game-server");
const webpack = require(path.join(GS, "node_modules", "webpack"));

const out = process.argv[2] || path.join(__dirname, "combate-tatico.html");

webpack(
  {
    mode: "production",
    target: "web",
    entry: path.join(__dirname, "app.ts"),
    output: { path: path.join(__dirname, ".build"), filename: "app.js" },
    resolve: { extensions: [".ts", ".js"] },
    resolveLoader: { modules: [path.join(GS, "node_modules")] },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: "ts-loader",
          options: { transpileOnly: true, configFile: path.join(GS, "tsconfig.json"), compilerOptions: { module: "es2015", target: "es2017" } }
        }
      ]
    },
    performance: { hints: false }
  },
  (err, stats) => {
    if (err || stats.hasErrors()) {
      console.error(err || stats.toString("errors-only"));
      process.exit(1);
    }
    const js = fs.readFileSync(path.join(__dirname, ".build", "app.js"), "utf8");
    const html = fs.readFileSync(path.join(__dirname, "template.html"), "utf8").replace("/*__APP__*/", () => js.replace(/<\/script/gi, "<\\/script"));
    fs.writeFileSync(out, html);
    console.log("ok", out, Math.round(html.length / 1024) + " KB");
  }
);
