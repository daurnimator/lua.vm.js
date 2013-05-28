
#define emjs_c
#define LUA_LIB

#include "lua.h"
#include "lualib.h"
#include "lauxlib.h"

#if EMSCRIPTEN
#include <emscripten.h>
#endif

static int js_run(lua_State *L) {
  const char *s = luaL_optstring(L, 1, "-1");
  int ret;
#if EMSCRIPTEN
  ret = emscripten_run_script_int(s);
#else
  printf("js_run: %s\n", s);
  ret = 0;
#endif
  lua_pushnumber(L, ret);
  return 1;
}

static int js_run_string(lua_State *L) {
  const char *s = luaL_optstring(L, 1, "-1");
  char *ret = "UNSUPPORTED";
#if EMSCRIPTEN
  ret = emscripten_run_script_string(s);
#else
  printf("js_run: %s\n", s);
#endif
  lua_pushstring(L, ret);
  return 1;
}

static const luaL_Reg jslib[] = {
  { "run", js_run },
  { "run_string", js_run_string },
  { NULL, NULL }
};

LUAMOD_API int luaopen_js(lua_State *L) {
  luaL_newlib(L, jslib);
  return 1;
}

