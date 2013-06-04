-- JS<-->Lua glue
--
-- Horribly hackish, this is not the right way to do it

js.number = 1
js.string = 2
js.object = 3
js.func = 4

js.lua_table = {}
js.lua_index = 1

js.convert_args = function(args)
  function to_js(x)
    if type(x) == 'number' then return tostring(x)
    elseif type(x) == 'string' then return '"' .. x .. '"'
    elseif type(x) == 'function' then
      local lua_index = js.lua_index
      js.lua_index = js.lua_index + 1
      js.lua_table[lua_index] = x
      return 'Lua.funcWrapper(' .. lua_index .. ')'
    --elseif type(x) == 'table' then return 'Lua.wrappers[
    else return '<{[Unsupported]}>' end
  end
  local js_args = ''
  for i, v in ipairs(args) do
    if i > 1 then js_args = js_args .. ',' end
    js_args = js_args .. to_js(v)
  end
  return js_args
end

js.wrapper_index = 1

js.wrapper = {}

js.wrapper.__index = function(table, key)
  if key == 'new' then
    local ret = { what = 'Lua.wrappers[' .. table.index .. ']' }
    setmetatable(ret, js.new.property)
    return ret
  end
  return js.get('Lua.wrappers[' .. table.index .. '].' .. key)
end

js.wrapper.__call = function(table, ...)
  return js.get('(tempFunc = Lua.wrappers[' .. table.index .. '], tempFunc)(' .. js.convert_args({...}) .. ')') -- tempFunc needed to work around js invalid call issue FIXME
end

js.get = function(what)
  local ret = { index = js.wrapper_index }
  js.wrapper_index = js.wrapper_index + 1
  local return_type = js.run("Lua.test('" .. what .. "')")
  if return_type == js.number then
    return js.run('Lua.last')
  elseif return_type == js.string then
    return js.run_string('Lua.last')
  elseif return_type == js.object or return_type == js.func then
    js.run('Lua.wrappers[' .. ret.index .. '] = Lua.last')
    setmetatable(ret, js.wrapper)
    return ret
  else
    return '!Unsupported!'
  end
end

js.global = js.get('Lua.theGlobal')

js.new = {}
setmetatable(js.new, js.new)
js.new.__index = function(table, key)
  local ret = { what = key }
  setmetatable(ret, js.new.property)
  return ret
end

js.new.property = {}
js.new.property.__call = function(table, ...)
  return js.get('new ' .. table.what .. '(' .. js.convert_args({...}) .. ')')
end

