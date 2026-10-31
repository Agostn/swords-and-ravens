const path = require("path");
const fs = require("fs");
const GS = path.join(__dirname, "..", "..", "..", "..", "agot-bg-game-server");
const webpack = require(path.join(GS, "node_modules", "webpack"));
const OUT = path.join(__dirname, ".build");
const cena = process.argv[2] || "mar";
const times = (process.argv[3] || "2,4,5.5,7,9,12,14.5").split(",").map(Number);
const dest = process.argv[4] || "/tmp/q";
webpack(
  {
    mode: "development", devtool: false, target: "web",
    entry: { q: path.join(__dirname, "quadros.ts") },
    output: { path: OUT, filename: "[name].js" },
    resolve: { extensions: [".ts", ".js"] },
    resolveLoader: { modules: [path.join(GS, "node_modules")] },
    module: { rules: [{ test: /\.ts$/, loader: "ts-loader", options: { transpileOnly: true, configFile: path.join(GS, "tsconfig.json"), compilerOptions: { module: "es2015", target: "es2017" } } }] }
  },
  async (e, s) => {
    if (e || s.hasErrors()) { console.error(e || s.toString("errors-only")); process.exit(1); }
    const { chromium } = require("playwright");
    const b = await chromium.launch();
    const p = await b.newPage();
    p.on("pageerror", (x) => console.log("pageerror", x.message));
    await p.setContent("<html><body><script>" + fs.readFileSync(path.join(OUT, "q.js"), "utf8") + "</script></body></html>");
    const urls = await p.evaluate(([n, t]) => window.run(n, t), [cena, times]);
    fs.mkdirSync(dest, { recursive: true });
    urls.forEach((u, i) => fs.writeFileSync(path.join(dest, `${cena}-${times[i]}.png`), Buffer.from(u.split(",")[1], "base64")));
    console.log("ok", urls.length);
    await b.close();
  }
);
