-- JS<-->Lua glue
--
-- Horribly hackish, this is not the right way to do it

js.run('LuaWrappers = {}')

js.wrapper_index = 1

js.wrapper = {}

js.wrapper.__index = function(table, key)
  return js.get('LuaWrappers[' .. table.index .. '].' .. key)
end

js.wrapper.__call = function(table, ...)
  function to_lua(x)
    if type(x) == 'number' then return tostring(x)
    elseif type(x) == 'string' then return '"' .. x .. '"'
    else return '<{[Unsupported]}>' end
  end
  local js_args = ''
  for i, v in ipairs({...}) do
    if i > 1 then js_args = js_args .. ',' end
    js_args = js_args .. to_lua(v)
  end
  return js.get('(tempFunc = LuaWrappers[' .. table.index .. '], tempFunc)(' .. js_args .. ')') -- tempFunc needed to work around js invalid call issue FIXME
end

js.get = function(what)
  -- print('get! ' .. what)
  local ret = { index = js.wrapper_index }
  js.wrapper_index = js.wrapper_index + 1
  js.run('LuaWrappers[' .. ret.index .. '] = ' .. what)
  setmetatable(ret, js.wrapper)
  return ret
end

