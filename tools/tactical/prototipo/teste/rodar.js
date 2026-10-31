// Junta o teste num arquivo e roda no Chromium (sem abrir janela).
const path = require("path");
const fs = require("fs");
const GS = path.join(__dirname, "..", "..", "..", "..", "agot-bg-game-server");
const webpack = require(path.join(GS, "node_modules", "webpack"));
const OUT = path.join(__dirname, ".build");
webpack(
  {
    mode: "development",
    devtool: false,
    target: "web",
    entry: { t: path.join(__dirname, "teste-luta.ts") },
    output: { path: OUT, filename: "[name].js" },
    resolve: { extensions: [".ts", ".js"] },
    resolveLoader: { modules: [path.join(GS, "node_modules")] },
    module: { rules: [{ test: /\.ts$/, loader: "ts-loader", options: { transpileOnly: true, configFile: path.join(GS, "tsconfig.json"), compilerOptions: { module: "es2015", target: "es2017" } } }] }
  },
  async (e, s) => {
    if (e || s.hasErrors()) {
      console.error(e || s.toString("errors-only"));
      process.exit(1);
    }
    const { chromium } = require("playwright");
    const b = await chromium.launch();
    const p = await b.newPage();
    p.on("pageerror", (x) => console.log("pageerror", x.message));
    await p.setContent("<html><body><script>" + fs.readFileSync(path.join(OUT, "t.js"), "utf8") + "</script></body></html>");
    await p.waitForFunction(() => window.__RESULT__, null, { timeout: 180000 });
    const r = await p.evaluate(() => window.__RESULT__);
    console.log(r);
    await b.close();
    process.exit(/: 0\n?/.test(r.split("\n")[0]) ? 0 : 1);
  }
);
