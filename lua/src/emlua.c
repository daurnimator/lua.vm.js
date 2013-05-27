
#define emjs_c
#define LUA_LIB

#include "lua.h"
#include "lualib.h"
#include "lauxlib.h"


static int l_js(lua_State *L) {
  printf("hello world\n");

  return 1;
}

static const luaL_Reg jslib[] = {
  { "js", l_js },
  { NULL, NULL }
};

LUAMOD_API int luaopen_js(lua_State *L) {
  luaL_newlib(L, jslib);
  return 1;
}

