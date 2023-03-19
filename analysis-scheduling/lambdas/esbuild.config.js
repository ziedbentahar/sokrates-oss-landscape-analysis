require("esbuild")
  .build({
    entryPoints: ["./*.ts"],
    entryNames: "[name]",
    outbase: ".",
    bundle: true,
    minify: true,
    sourcemap: false,
    outdir: "../build",
    platform: "node",
    write: true,
  })
  .catch(() => process.exit());
