
#define emjs_c
#define LUA_LIB

#include "lua.h"
#include "lualib.h"
#include "lauxlib.h"


static int js_run(lua_State *L) {
  const char *s = luaL_optstring(L, 1, "%c");
  printf("string is: %s\n", s);
  return 1;
}

static const luaL_Reg jslib[] = {
  { "run", js_run },
  { NULL, NULL }
};

LUAMOD_API int luaopen_js(lua_State *L) {
  luaL_newlib(L, jslib);
  return 1;
}

