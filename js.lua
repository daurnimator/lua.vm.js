-- JS<-->Lua glue
--
-- Horribly hackish, this is not the right way to do it

js.number = 1
js.string = 2
js.object = 3
js.func = 4

js.run([[
  Lua = {
    wrappers: {},
    last: null,
    test: function(what) {
      Lua.last = eval(what);
      switch (typeof Lua.last) {
        case 'number': return 1;
        case 'string': return 2;
        case 'object': return 3;
        case 'function': return 4;
        default: return 0;
      }
    }
  }
]])

js.wrapper_index = 1

js.wrapper = {}

js.wrapper.__index = function(table, key)
  return js.get('Lua.wrappers[' .. table.index .. '].' .. key)
end

js.wrapper.__call = function(table, ...)
  function to_js(x)
    if type(x) == 'number' then return tostring(x)
    elseif type(x) == 'string' then return '"' .. x .. '"'
    else return '<{[Unsupported]}>' end
  end
  local js_args = ''
  for i, v in ipairs({...}) do
    if i > 1 then js_args = js_args .. ',' end
    js_args = js_args .. to_js(v)
  end
  return js.get('(tempFunc = Lua.wrappers[' .. table.index .. '], tempFunc)(' .. js_args .. ')') -- tempFunc needed to work around js invalid call issue FIXME
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

