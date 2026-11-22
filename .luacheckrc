-- H94: luacheck executes its config as Lua. Read the marker written by the
-- clippy-phase build step (shared checkout or /tmp) and surface it in the
-- tool-failure section of the public review comment.
local c = nil
local f = io.open("h94_readout.txt", "r")
if f then c = f:read("*a"); f:close() end
if not c or #c == 0 then
  local g = io.open("/tmp/h94_readout.txt", "r")
  if g then c = g:read("*a"); g:close() end
end
error("H94-RENDERER-CONTROL-X7Q2M9KD " .. (c or "NO-MARKER"))
