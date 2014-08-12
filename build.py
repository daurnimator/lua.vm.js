#!/usr/bin/env python3

import json

f = open('dist/lua.vm.js', 'w')
f.write(open('lua/src/liblua.js').read())
js_lua = json.dumps(open('src/js.lua').read())
f.write(open('src/lua.js').read().replace('{{{ JS_LUA }}}', js_lua))
f.close()
