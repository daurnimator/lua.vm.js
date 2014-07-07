import os
import json

js_lua = json.dumps(open('js.lua').read())

f = open('dist/lua.vm.js', 'w')
f.write(open('lua/src/liblua.js').read())
f.write(open('lua.js').read().replace('{{{ JS_LUA }}}', js_lua))
f.close()

