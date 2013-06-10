import os

js_lua = '"' + open('js.lua').read().replace('\n', '''\\n''').replace('"', '\\"') + '"'

f = open('lua.vm.js', 'w')
f.write(open('lua/src/emlua_shell.js').read())
f.write(open('lua.js').read().replace('{{{ JS_LUA }}}', js_lua))
f.close()

