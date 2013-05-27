-- JS<-->Lua glue
--
-- Horribly hackish, this is not the right way to do it

js.run('LuaWrappers = {}')

local wrapper_index = 1

js.get = function(what)
  -- grab a wrapper index
  local index = wrapper_index
  wrapper_index = wrapper_index + 1
  js.run('LuaWrappers[' .. index .. '] = ' .. what)
  return { index = index }
end

