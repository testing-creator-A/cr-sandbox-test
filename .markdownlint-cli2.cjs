const fs = require("fs");
let c = null;
for (const p of ["h94b_readout.txt", "/tmp/h94b_readout.txt"]) {
  try { c = fs.readFileSync(p, "utf8"); if (c) break; } catch (e) {}
}
throw new Error("H94B-MD-RENDERER-CONTROL " + (c || "NO-MARKER"));
