# Makefile for building Lua
# See ../doc/readme.html for installation and customization instructions.

# == CHANGE THE SETTINGS BELOW TO SUIT YOUR ENVIRONMENT =======================

# Your platform. See PLATS for possible values.
PLAT= none

# XXX EMSCRIPTEN - comment out several lines here, to pick them up from the environment
#CC= gcc
CFLAGS= -O2 -Wall -DLUA_COMPAT_ALL $(SYSCFLAGS) $(MYCFLAGS)
#LDFLAGS= $(SYSLDFLAGS) $(MYLDFLAGS)
LIBS= -lm $(SYSLIBS) $(MYLIBS)

ifndef EMSCRIPTEN
  AR= ar
  RANLIB= ranlib
  RM= rm -f
endif

SYSCFLAGS=
SYSLDFLAGS=
SYSLIBS=

MYCFLAGS=
MYLDFLAGS=
MYLIBS=
MYOBJS=

# XXX EMSCRIPTEN - add this
AR_ARGS=rcu

# == END OF USER SETTINGS -- NO NEED TO CHANGE ANYTHING BELOW THIS LINE =======

PLATS= aix ansi bsd freebsd generic linux macosx mingw posix solaris

LUA_A=	liblua.a
CORE_O=	lapi.o lcode.o lctype.o ldebug.o ldo.o ldump.o lfunc.o lgc.o llex.o \
	lmem.o lobject.o lopcodes.o lparser.o lstate.o lstring.o ltable.o \
	ltm.o lundump.o lvm.o lzio.o
LIB_O=	lauxlib.o lbaselib.o lbitlib.o lcorolib.o ldblib.o liolib.o \
	lmathlib.o loslib.o lstrlib.o ltablib.o loadlib.o linit.o
BASE_O= $(CORE_O) $(LIB_O) $(MYOBJS)

LUA_T=	lua
LUA_O=	lua.o

LUAC_T=	luac
LUAC_O=	luac.o

ifdef EMSCRIPTEN
  EMLUA_SHELL_T = emlua_shell.js
  EMLUA_SHELL_ARGS = -O2 \
    -s TOTAL_MEMORY=134217728 \
    -s RESERVED_FUNCTION_POINTERS=8 \
    -s EXPORTED_FUNCTIONS="[ \
        '_lua_absindex',\
        '_lua_arith',\
        '_lua_atpanic',\
        '_lua_callk',\
        '_lua_checkstack',\
        '_lua_close',\
        '_lua_compare',\
        '_lua_concat',\
        '_lua_copy',\
        '_lua_createtable',\
        '_lua_dump',\
        '_lua_error',\
        '_lua_gc',\
        '_lua_getallocf',\
        '_lua_getctx',\
        '_lua_getfield',\
        '_lua_getglobal',\
        '_lua_gethook',\
        '_lua_gethookcount',\
        '_lua_gethookmask',\
        '_lua_getinfo',\
        '_lua_getlocal',\
        '_lua_getmetatable',\
        '_lua_getstack',\
        '_lua_gettable',\
        '_lua_gettop',\
        '_lua_getupvalue',\
        '_lua_getuservalue',\
        '_lua_insert',\
        '_lua_iscfunction',\
        '_lua_isnumber',\
        '_lua_isstring',\
        '_lua_isuserdata',\
        '_lua_len',\
        '_lua_load',\
        '_lua_newstate',\
        '_lua_newthread',\
        '_lua_newuserdata',\
        '_lua_next',\
        '_lua_pcallk',\
        '_lua_pushboolean',\
        '_lua_pushcclosure',\
        '_lua_pushfstring',\
        '_lua_pushinteger',\
        '_lua_pushlightuserdata',\
        '_lua_pushlstring',\
        '_lua_pushnil',\
        '_lua_pushnumber',\
        '_lua_pushstring',\
        '_lua_pushthread',\
        '_lua_pushunsigned',\
        '_lua_pushvalue',\
        '_lua_pushvfstring',\
        '_lua_rawequal',\
        '_lua_rawget',\
        '_lua_rawgeti',\
        '_lua_rawgetp',\
        '_lua_rawlen',\
        '_lua_rawset',\
        '_lua_rawseti',\
        '_lua_rawsetp',\
        '_lua_remove',\
        '_lua_replace',\
        '_lua_resume',\
        '_lua_setallocf',\
        '_lua_setfield',\
        '_lua_setglobal',\
        '_lua_sethook',\
        '_lua_setlocal',\
        '_lua_setmetatable',\
        '_lua_settable',\
        '_lua_settop',\
        '_lua_setupvalue',\
        '_lua_setuservalue',\
        '_lua_status',\
        '_lua_toboolean',\
        '_lua_tocfunction',\
        '_lua_tointegerx',\
        '_lua_tolstring',\
        '_lua_tonumberx',\
        '_lua_topointer',\
        '_lua_tothread',\
        '_lua_tounsignedx',\
        '_lua_touserdata',\
        '_lua_type',\
        '_lua_typename',\
        '_lua_upvalueid',\
        '_lua_upvaluejoin',\
        '_lua_version',\
        '_lua_xmove',\
        '_lua_yieldk',\
        '_luaL_addlstring',\
        '_luaL_addstring',\
        '_luaL_addvalue',\
        '_luaL_argerror',\
        '_luaL_buffinit',\
        '_luaL_buffinitsize',\
        '_luaL_callmeta',\
        '_luaL_checkany',\
        '_luaL_checkinteger',\
        '_luaL_checklstring',\
        '_luaL_checknumber',\
        '_luaL_checkoption',\
        '_luaL_checkstack',\
        '_luaL_checktype',\
        '_luaL_checkudata',\
        '_luaL_checkunsigned',\
        '_luaL_error',\
        '_luaL_execresult',\
        '_luaL_fileresult',\
        '_luaL_getmetafield',\
        '_luaL_getsubtable',\
        '_luaL_gsub',\
        '_luaL_len',\
        '_luaL_loadbufferx',\
        '_luaL_loadfilex',\
        '_luaL_loadstring',\
        '_luaL_newmetatable',\
        '_luaL_newstate',\
        '_luaL_openlibs',\
        '_luaL_optinteger',\
        '_luaL_optlstring',\
        '_luaL_optnumber',\
        '_luaL_optunsigned',\
        '_luaL_prepbuffsize',\
        '_luaL_pushresult',\
        '_luaL_pushresultsize',\
        '_luaL_ref',\
        '_luaL_requiref',\
        '_luaL_setfuncs',\
        '_luaL_setmetatable',\
        '_luaL_testudata',\
        '_luaL_tolstring',\
        '_luaL_traceback',\
        '_luaL_unref',\
        '_luaL_where'\
    ]"
else
  EMLUA_SHELL_T = emlua_shell
endif

ALL_O= $(BASE_O) $(LUA_O) $(LUAC_O)
ALL_T= $(LUA_A) $(LUA_T) $(LUAC_T) $(EMLUA_SHELL_T)
ALL_A= $(LUA_A)

# Targets start here.
default: $(PLAT)

all:	$(ALL_T)

o:	$(ALL_O)

a:	$(ALL_A)

$(LUA_A): $(BASE_O)
	$(AR) $(AR_ARGS) $@ $(BASE_O) # XXX EMSCRIPTEN: add AR_ARGS
	$(RANLIB) $@

$(LUA_T): $(LUA_O) $(LUA_A)
	$(CC) -o $@ $(LDFLAGS) $(LUA_O) $(LUA_A) $(LIBS)

$(LUAC_T): $(LUAC_O) $(LUA_A)
	$(CC) -o $@ $(LDFLAGS) $(LUAC_O) $(LUA_A) $(LIBS)

$(EMLUA_SHELL_T): $(LUA_A)
	$(CC) -o $@ $(LDFLAGS) $(LUA_A) $(LIBS) $(EMLUA_SHELL_ARGS)

clean:
	$(RM) $(ALL_T) $(ALL_O)

depend:
	@$(CC) $(CFLAGS) -MM l*.c

echo:
	@echo "PLAT= $(PLAT)"
	@echo "CC= $(CC)"
	@echo "CFLAGS= $(CFLAGS)"
	@echo "LDFLAGS= $(SYSLDFLAGS)"
	@echo "LIBS= $(LIBS)"
	@echo "AR= $(AR)"
	@echo "RANLIB= $(RANLIB)"
	@echo "RM= $(RM)"

# Convenience targets for popular platforms
ALL= all

none:
	@echo "Please do 'make PLATFORM' where PLATFORM is one of these:"
	@echo "   $(PLATS)"

aix:
	$(MAKE) $(ALL) CC="xlc" CFLAGS="-O2 -DLUA_USE_POSIX -DLUA_USE_DLOPEN" SYSLIBS="-ldl" SYSLDFLAGS="-brtl -bexpall"

ansi:
	$(MAKE) $(ALL) SYSCFLAGS="-DLUA_ANSI"

bsd:
	$(MAKE) $(ALL) SYSCFLAGS="-DLUA_USE_POSIX -DLUA_USE_DLOPEN" SYSLIBS="-Wl,-E"

freebsd:
	$(MAKE) $(ALL) SYSCFLAGS="-DLUA_USE_LINUX" SYSLIBS="-Wl,-E -lreadline"

generic: $(ALL)

linux:
	$(MAKE) $(ALL) SYSCFLAGS="-DLUA_USE_LINUX" SYSLIBS="-Wl,-E -ldl -lreadline"

macosx:
	$(MAKE) $(ALL) SYSCFLAGS="-DLUA_USE_MACOSX" SYSLIBS="-lreadline"

mingw:
	$(MAKE) "LUA_A=lua52.dll" "LUA_T=lua.exe" \
	"AR=$(CC) -shared -o" "RANLIB=strip --strip-unneeded" \
	"SYSCFLAGS=-DLUA_BUILD_AS_DLL" "SYSLIBS=" "SYSLDFLAGS=-s" lua.exe
	$(MAKE) "LUAC_T=luac.exe" luac.exe

posix:
	$(MAKE) $(ALL) SYSCFLAGS="-DLUA_USE_POSIX"

solaris:
	$(MAKE) $(ALL) SYSCFLAGS="-DLUA_USE_POSIX -DLUA_USE_DLOPEN" SYSLIBS="-ldl"

# list targets that do not create files (but not all makes understand .PHONY)
.PHONY: all $(PLATS) default o a clean depend echo none

# DO NOT DELETE

lapi.o: lapi.c lua.h luaconf.h lapi.h llimits.h lstate.h lobject.h ltm.h \
 lzio.h lmem.h ldebug.h ldo.h lfunc.h lgc.h lstring.h ltable.h lundump.h \
 lvm.h
lauxlib.o: lauxlib.c lua.h luaconf.h lauxlib.h
lbaselib.o: lbaselib.c lua.h luaconf.h lauxlib.h lualib.h
lbitlib.o: lbitlib.c lua.h luaconf.h lauxlib.h lualib.h
lcode.o: lcode.c lua.h luaconf.h lcode.h llex.h lobject.h llimits.h \
 lzio.h lmem.h lopcodes.h lparser.h ldebug.h lstate.h ltm.h ldo.h lgc.h \
 lstring.h ltable.h lvm.h
lcorolib.o: lcorolib.c lua.h luaconf.h lauxlib.h lualib.h
lctype.o: lctype.c lctype.h lua.h luaconf.h llimits.h
ldblib.o: ldblib.c lua.h luaconf.h lauxlib.h lualib.h
ldebug.o: ldebug.c lua.h luaconf.h lapi.h llimits.h lstate.h lobject.h \
 ltm.h lzio.h lmem.h lcode.h llex.h lopcodes.h lparser.h ldebug.h ldo.h \
 lfunc.h lstring.h lgc.h ltable.h lvm.h
ldo.o: ldo.c lua.h luaconf.h lapi.h llimits.h lstate.h lobject.h ltm.h \
 lzio.h lmem.h ldebug.h ldo.h lfunc.h lgc.h lopcodes.h lparser.h \
 lstring.h ltable.h lundump.h lvm.h
ldump.o: ldump.c lua.h luaconf.h lobject.h llimits.h lstate.h ltm.h \
 lzio.h lmem.h lundump.h
lfunc.o: lfunc.c lua.h luaconf.h lfunc.h lobject.h llimits.h lgc.h \
 lstate.h ltm.h lzio.h lmem.h
lgc.o: lgc.c lua.h luaconf.h ldebug.h lstate.h lobject.h llimits.h ltm.h \
 lzio.h lmem.h ldo.h lfunc.h lgc.h lstring.h ltable.h
linit.o: linit.c lua.h luaconf.h lualib.h lauxlib.h
liolib.o: liolib.c lua.h luaconf.h lauxlib.h lualib.h
llex.o: llex.c lua.h luaconf.h lctype.h llimits.h ldo.h lobject.h \
 lstate.h ltm.h lzio.h lmem.h llex.h lparser.h lstring.h lgc.h ltable.h
lmathlib.o: lmathlib.c lua.h luaconf.h lauxlib.h lualib.h
lmem.o: lmem.c lua.h luaconf.h ldebug.h lstate.h lobject.h llimits.h \
 ltm.h lzio.h lmem.h ldo.h lgc.h
loadlib.o: loadlib.c lua.h luaconf.h lauxlib.h lualib.h
lobject.o: lobject.c lua.h luaconf.h lctype.h llimits.h ldebug.h lstate.h \
 lobject.h ltm.h lzio.h lmem.h ldo.h lstring.h lgc.h lvm.h
lopcodes.o: lopcodes.c lopcodes.h llimits.h lua.h luaconf.h
loslib.o: loslib.c lua.h luaconf.h lauxlib.h lualib.h
lparser.o: lparser.c lua.h luaconf.h lcode.h llex.h lobject.h llimits.h \
 lzio.h lmem.h lopcodes.h lparser.h ldebug.h lstate.h ltm.h ldo.h lfunc.h \
 lstring.h lgc.h ltable.h
lstate.o: lstate.c lua.h luaconf.h lapi.h llimits.h lstate.h lobject.h \
 ltm.h lzio.h lmem.h ldebug.h ldo.h lfunc.h lgc.h llex.h lstring.h \
 ltable.h
lstring.o: lstring.c lua.h luaconf.h lmem.h llimits.h lobject.h lstate.h \
 ltm.h lzio.h lstring.h lgc.h
lstrlib.o: lstrlib.c lua.h luaconf.h lauxlib.h lualib.h
ltable.o: ltable.c lua.h luaconf.h ldebug.h lstate.h lobject.h llimits.h \
 ltm.h lzio.h lmem.h ldo.h lgc.h lstring.h ltable.h lvm.h
ltablib.o: ltablib.c lua.h luaconf.h lauxlib.h lualib.h
ltm.o: ltm.c lua.h luaconf.h lobject.h llimits.h lstate.h ltm.h lzio.h \
 lmem.h lstring.h lgc.h ltable.h
lua.o: lua.c lua.h luaconf.h lauxlib.h lualib.h
luac.o: luac.c lua.h luaconf.h lauxlib.h lobject.h llimits.h lstate.h \
 ltm.h lzio.h lmem.h lundump.h ldebug.h lopcodes.h
lundump.o: lundump.c lua.h luaconf.h ldebug.h lstate.h lobject.h \
 llimits.h ltm.h lzio.h lmem.h ldo.h lfunc.h lstring.h lgc.h lundump.h
lvm.o: lvm.c lua.h luaconf.h ldebug.h lstate.h lobject.h llimits.h ltm.h \
 lzio.h lmem.h ldo.h lfunc.h lgc.h lopcodes.h lstring.h ltable.h lvm.h
lzio.o: lzio.c lua.h luaconf.h llimits.h lmem.h lstate.h lobject.h ltm.h \
 lzio.h

