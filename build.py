import os
import json

js_lua = json.dumps(open('js.lua').read())

f = open('lua.vm.js', 'w')
f.write(open('lua/src/emlua_shell.js').read())
f.write(open('lua.js').read().replace('{{{ JS_LUA }}}', js_lua))
f.close()

