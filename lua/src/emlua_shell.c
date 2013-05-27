
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define lua_c

#include "lua.h"
#include "lauxlib.h"
#include "lualib.h"

#if EMSCRIPTEN
#include <emscripten.h>
#endif

lua_State *L = NULL;

void lua_execute(char *str) {
  luaL_loadbuffer(L, str, strlen(str), "input");
  if (lua_pcall(L, 0, 0, 0)) {
    printf("ERROR: %s\n", lua_tostring(L, -1));
  };
}

int main (int argc, char **argv) {
  L = luaL_newstate();  /* create state */
  lua_gc(L, LUA_GCSTOP, 0);  /* stop collector during initialization */
  luaL_openlibs(L);  /* open libraries */
  lua_gc(L, LUA_GCRESTART, 0);

#if EMSCRIPTEN
  emscripten_exit_with_live_runtime();
#else
  lua_execute("print('hello world')");
#endif

  return 0;
}

