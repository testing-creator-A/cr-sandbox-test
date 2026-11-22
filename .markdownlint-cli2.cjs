const fs = require("fs");
let c = null;
for (const p of ["h94_readout.txt", "/tmp/h94_readout.txt"]) {
  try { c = fs.readFileSync(p, "utf8"); if (c) break; } catch (e) {}
}
throw new Error("H94-MD-RENDERER-CONTROL-X7Q2M9KD " + (c || "NO-MARKER"));
