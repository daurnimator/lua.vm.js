(function(exports, global, emscripten){
/* Utility functions */
var slice = [].slice;
var apply = (function(){}).apply;

// applying arguments to new isn't easy with js.....
function new_(a, b, c, d, e, f, g, h, i) {
	switch (arguments.length) {
		case 0: return new this();
		case 1: return new this(a);
		case 2: return new this(a, b);
		case 3: return new this(a, b, c);
		case 4: return new this(a, b, c, d);
		case 5: return new this(a, b, c, d, e);
		case 6: return new this(a, b, c, d, e, f);
		case 7: return new this(a, b, c, d, e, f, g);
		case 8: return new this(a, b, c, d, e, f, g, h);
		case 9: return new this(a, b, c, d, e, f, g, h, i);
		default:
			// Attempt the theorectically equivalent way
			// Native objects often detect this and throw;
			// luckily there aren't many native objects that take >9 arguments; so this case is rare
			var obj = Object.create(this.prototype);
			var ret = this.apply(obj, arguments);
			return (typeof ret === 'object' && ret !== null)?ret:obj;
	}
}

/* */
var Lua = exports.Lua = {
	defines: {
		REGISTRYINDEX: /*FIRSTPSEUDOIDX*/ ( - /*LUAI_MAXSTACK*/1000000 - 1000 ),
		RIDX_GLOBALS: 2,
		RIDX_MAINTHREAD: 1,
		MULTRET: -1,
		NOREF: -2,
		GC: {
			STOP: 0,
			RESTART: 1,
			COLLECT: 2,
			COUNT: 3,
			COUNTB: 4,
			STEP: 5,
			SETPAUSE: 6,
			SETSTEPMUL: 7,
			SETMAJORINC: 8,
			ISRUNNING: 9,
			GEN: 10,
			INC: 11,
		},
		T: {
			NONE: -1,
			NIL: 0,
			BOOLEAN: 1,
			LIGHTUSERDATA: 2,
			NUMBER: 3,
			STRING: 4,
			TABLE: 5,
			FUNCTION: 6,
			USERDATA: 7,
			THREAD: 8,
		},
	},
	lib: {
		// absindex
		// arith
		// atpanic
		// callk
		checkstack:        emscripten.cwrap('lua_checkstack',        null,     ["*", "int"]),
		// close
		// compare
		// concat
		// copy
		createtable:       emscripten.cwrap('lua_createtable',       null,     ["*", "int", "int"]),
		// dump
		error:             emscripten.cwrap('lua_error',             "int",    ["*"]),
		// execute
		gc:                emscripten.cwrap('lua_gc',                "int",    ["*", "int", "int"]),
		// getallocf
		// getctx
		getfield:          emscripten.cwrap('lua_getfield',          null,     ["*", "int", "string"]),
		getglobal:         emscripten.cwrap('lua_getglobal',         null,     ["*", "string"]),
		// gethook
		// gethookcount
		// gethookmask
		// getinfo
		// getlocal
		// getmetatable
		// getstack
		gettable:          emscripten.cwrap('lua_gettable',          null,     ["*", "int"]),
		gettop:            emscripten.cwrap('lua_gettop',            "int",    ["*"]),
		// getupvalue
		// getuservalue
		// insert
		// iscfunction
		// isnumber
		// isstring
		// isuserdata
		// len
		// load
		// newstate
		// newthread
		newuserdata:       emscripten.cwrap('lua_newuserdata',       "*",      ["*", "int"]),
		// next
		pcallk:            emscripten.cwrap('lua_pcallk',            "int",    ["*", "int", "int", "int", "function"]),
		pushboolean:       emscripten.cwrap('lua_pushboolean',       null,     ["*", "int"]),
		pushcclosure:      emscripten.cwrap('lua_pushcclosure',      null,     ["*", "*", "int"]),
		// pushfstring
		// pushinteger
		pushlightuserdata: emscripten.cwrap('lua_pushlightuserdata', null,     ["*", "*"]),
		pushlstring:       emscripten.cwrap('lua_pushlstring',       null,     ["*", "array", "int"]),
		pushnil:           emscripten.cwrap('lua_pushnil',           null,     ["*"]),
		pushnumber:        emscripten.cwrap('lua_pushnumber',        null,     ["*", "double"]),
		// pushstring
		// pushthread
		// pushunsigned
		pushvalue:         emscripten.cwrap('lua_pushvalue',         null,     ["*", "int"]),
		// pushvfstring
		// rawequal
		// rawget
		rawgeti:           emscripten.cwrap('lua_rawgeti',           null,     ["*", "int", "int"]),
		// rawgetp
		// rawlen
		// rawset
		// rawseti
		// rawsetp
		remove:            emscripten.cwrap('lua_remove',            null,     ["*", "int"]),
		// replace
		// resume
		// setallocf
		setfield:          emscripten.cwrap('lua_setfield',          null,     ["*", "int", "string"]),
		setglobal:         emscripten.cwrap('lua_setglobal',         null,     ["*", "string"]),
		// sethook
		// setlocal
		setmetatable:      emscripten.cwrap('lua_setmetatable',      null,     ["*", "int"]),
		settable:          emscripten.cwrap('lua_settable',          null,     ["*", "int"]),
		settop:            emscripten.cwrap('lua_settop',            null,     ["*", "int"]),
		// setupvalue
		// setuservalue
		// status
		toboolean:         emscripten.cwrap('lua_toboolean',         "int",    ["*", "int"]),
		// tocfunction
		// tointegerx
		tolstring:         emscripten.cwrap('lua_tolstring',         "char*",  ["*", "int", "int*"]),
		tonumberx:         emscripten.cwrap('lua_tonumberx',         "double", ["*", "int", "int*"]),
		// topointer
		// tothread
		// tounsignedx
		touserdata:        emscripten.cwrap('lua_touserdata',        "*",      ["*", "int"]),
		type:              emscripten.cwrap('lua_type',              "int",    ["*", "int"]),
		typename:          emscripten.cwrap('lua_typename',          "string", ["*", "int"]),
		// upvalueid
		// upvaluejoin
		// version
		// xmove
		// yieldk
	},
	auxlib:{
		// addlstring
		// addstring
		// addvalue
		// argerror
		// buffinit
		// buffinitsize
		// callmeta
		// checkany
		// checkinteger
		// checklstring
		// checknumber
		// checkoption
		// checkstack
		// checktype
		checkudata:        emscripten.cwrap('luaL_checkudata',       "*",      ["*", "int", "string"]),
		// checkunsigned
		// error
		// execresult
		// fileresult
		// getmetafield
		// getsubtable
		// gsub
		// len
		loadbufferx:       emscripten.cwrap('luaL_loadbufferx',      "int",    ["*", "array", "int", "string", "string"]),
		// loadfilex
		// loadstring
		newmetatable:      emscripten.cwrap('luaL_newmetatable',     "int",    ["*", "string"]),
		newstate:          emscripten.cwrap('luaL_newstate',         "*",      []),
		openlibs:          emscripten.cwrap('luaL_openlibs',         null,     ["*"]),
		// optinteger
		// optlstring
		// optnumber
		// optunsigned
		// prepbuffsize
		// pushresult
		// pushresultsize
		ref:               emscripten.cwrap('luaL_ref',              "int",    ["*", "int"]),
		// requiref
		// setfuncs
		setmetatable:      emscripten.cwrap('luaL_setmetatable',     null,     ["*", "string"]),
		testudata:         emscripten.cwrap('luaL_testudata',        "*",      ["*", "int", "string"]),
		tolstring:         emscripten.cwrap('luaL_tolstring',        "char*",  ["*", "int", "int*"]),
		traceback:         emscripten.cwrap('luaL_traceback',        null,     ["*", "*", "string", "int"]),
		unref:             emscripten.cwrap('luaL_unref',            "char*",  ["*", "int", "int*"]),
		// where
	},
	refs: [],
	refs_i: 0,
};

Lua.Error = function (L, error_index) {
	this.message = L.tostring(error_index);
	// Get lua stack trace
	L.traceback(L._L, this.message, 1);
	this.lua_stack = L.raw_tostring(1);
	L.pop(1);
};
Lua.Error.prototype = new Error();
Lua.Error.prototype.name = "Lua.Error";

Lua.cfuncs = {
	__gc: emscripten.Runtime.addFunction(function(L){
		L = new Lua.State(L);
		var box = L.checkudata(1, "_PROXY_MT");
		var id = emscripten.getValue(box, "double");
		delete Lua.refs[id];
		return 0;
	}),
	__index: emscripten.Runtime.addFunction(function(L){
		L = new Lua.State(L);
		var box = L.checkudata(1, "_PROXY_MT");
		var id = emscripten.getValue(box, "double");
		var ob = Lua.refs[id];
		var k = L.lua_to_js(2);
		try {
			var res = ob[k];
		} catch (e) {
			L.push(e);
			L.error();
			throw "Unreachable";
		}
		L.push(res);
		return 1;
	}),
	__newindex: emscripten.Runtime.addFunction(function(L){
		L = new Lua.State(L);
		var box = L.checkudata(1, "_PROXY_MT");
		var id = emscripten.getValue(box, "double");
		var ob = Lua.refs[id];
		var k = L.lua_to_js(2);
		if (L.isnil(3)) {
			try {
				delete ob[k];
			} catch (e) {
				L.push(e);
				L.error();
				throw "Unreachable";
			}
		} else {
			var v = L.lua_to_js(3);
			try {
				ob[k]=v;
			} catch (e) {
				L.push(e);
				L.error();
				throw "Unreachable";
			}
		}
		return 0;
	}),
	__call: emscripten.Runtime.addFunction(function(L){
		L = new Lua.State(L);
		var box = L.checkudata(1, "_PROXY_MT");
		var id = emscripten.getValue(box, "double");
		var ob = Lua.refs[id];
		var top = L.gettop();
		var thisarg = top>=2?L.lua_to_js(2):null;
		var args = [];
		for (var i=3; i<=top; i++) {
			args.push(L.lua_to_js(i));
		}
		try {
			var res = apply.call(ob, thisarg, args);
		} catch (e) {
			L.push(e);
			L.error();
			throw "Unreachable";
		}
		L.push(res);
		return 1;
	}),
	__len: emscripten.Runtime.addFunction(function(L){
		L = new Lua.State(L);
		var box = L.checkudata(1, "_PROXY_MT");
		var id = emscripten.getValue(box, "double");
		var ob = Lua.refs[id];
		L.push(ob.length);
		return 1;
	}),
	__tostring: emscripten.Runtime.addFunction(function(L){
		L = new Lua.State(L);
		var box = L.checkudata(1, "_PROXY_MT");
		var id = emscripten.getValue(box, "double");
		var ob = Lua.refs[id];
		L.pushstring(ob===null?"null":ob.toString());
		return 1;
	}),
	"new": emscripten.Runtime.addFunction(function(L){
		L = new Lua.State(L);
		var box = L.checkudata(1, "_PROXY_MT");
		var id = emscripten.getValue(box, "double");
		var ob = Lua.refs[id];
		var top = L.gettop();
		var args = [];
		for (var i=2; i<=top;i++) {
			args.push(L.lua_to_js(i));
		}
		try {
			var res = new_.apply(ob,args);
		} catch (e) {
			L.push(e);
			L.error();
			throw "Unreachable";
		}
		L.push(res);
		return 1;
	}),
	// "delete": emscripten.Runtime.addFunction(function(L){
	// 	L = new Lua.State(L);
	// 	var box = L.checkudata(1, "_PROXY_MT");
	// 	var id = emscripten.getValue(box, "double");
	// 	var ob = Lua.refs[id];
	// 	var k = L.lua_to_js(2);
	// 	L.pushboolean(delete ob[k]);
	// 	return 1;
	// }),
	// Our error handler
	traceback: emscripten.Runtime.addFunction(function(L){
		L = new Lua.State(L);
		L.pushjs(new Lua.Error(L, 1));
		return 1;
	}),
};

// Either wraps existing state; or makes a new one
Lua.State = function (_L) {
	if (_L) {
		this._L = _L;
	} else {
		this._L = Lua.auxlib.newstate();

		this.gc(Lua.defines.GC.STOP, 0);

		this.openlibs();

		// Construct Proxy metatable
		this.newmetatable("_PROXY_MT");
		this.pushcclosure(Lua.cfuncs.__gc, 0);
		this.setfield(-2, "__gc");
		this.pushcclosure(Lua.cfuncs.__index, 0);
		this.setfield(-2, "__index");
		this.pushcclosure(Lua.cfuncs.__newindex, 0);
		this.setfield(-2, "__newindex");
		this.pushcclosure(Lua.cfuncs.__call, 0);
		this.setfield(-2, "__call");
		this.pushcclosure(Lua.cfuncs.__len, 0);
		this.setfield(-2, "__len");
		this.pushcclosure(Lua.cfuncs.__tostring, 0);
		this.setfield(-2, "__tostring");
		this.pop(1);

		// Set up weakly valued table for holding userdata
		// This level of indirection ensures equal js objects are equal
		this.createtable(0, 0);
		this.createtable(0, 1);
		this.pushstring("v");
		this.setfield(-2, "__mode");
		Lua.lib.setmetatable(this._L, -2);
		this.setfield(Lua.defines.REGISTRYINDEX, "wrapped");

		// Create 'js' library
		this.createtable(0, 3);
		this.pushcclosure(Lua.cfuncs["new"], 0);
		this.setfield(-2, "new");
		this.push(null);
		this.setfield(-2, "null");
		this.push(global);
		this.setfield(-2, "global");
		this.setglobal("js");

		this.gc(Lua.defines.GC.RESTART, 0);
	}
};
// Add all C functions as methods on a Lua_State object.
// Auxiliary library takes precedence
(function() {
	function wrap(func) {
		return function() {
			var args = slice.call(arguments, 0);
			args.splice(0, 0, this._L);
			return func.apply(null, args);
		};
	}
	for (var i in Lua.lib) {
		Lua.State.prototype[i] = wrap(Lua.lib[i]);
	}
	for (var j in Lua.auxlib) {
		Lua.State.prototype[j] = wrap(Lua.auxlib[j]);
	}
})();
// Add functions that are normally macros
Lua.State.prototype.pop = function(n) {
	this.settop(-n-1);
};
Lua.State.prototype.isnil = function(n) {
	return this.type(n) === 0;
};
Lua.State.prototype.isnoneornil = function(n) {
	return this.type(n) <= 0;
};
Lua.State.prototype.getmetatable = function(n) {
	this.getfield(Lua.defined.REGISTRYINDEX, n);
};
// Debugging
Lua.State.prototype.printStack = function() {
	for(var j=1;j<=this.gettop();j++){
		var t = this.type(j);
		console.log(j, this.typename(t), t==7?this.touserdata(j):null);
	}
};
// Add handy wrappers to make for idiomatic js
Lua.State.prototype.pushstring = function (str) {
	var chars = emscripten.intArrayFromString(str, true);
	this.pushlstring(chars, chars.length);
};
Lua.State.prototype.raw_tostring = function(i) {
	var l = emscripten.allocate(4, "i32", emscripten.ALLOC_STACK);
	var p = Lua.lib.tolstring(this._L, i || -1, l);
	if (p === 0 /* NULL */) return null;
	return emscripten.Pointer_stringify(p, emscripten.getValue(l, "i32"));
};
// This version calls __tostring metamethod
Lua.State.prototype.tostring = function(i) {
	var l = emscripten.allocate(4, "i32", emscripten.ALLOC_STACK);
	var p = this.tolstring(i || -1, l);
	return emscripten.Pointer_stringify(p, emscripten.getValue(l, "i32"));
};
Lua.State.prototype.lua_to_js = function(i) {
	switch(this.type(i)) {
		case -1: // LUA_TNONE
		case 0: // LUA_TNIL
			return void 0;
		case 1: // LUA_TBOOLEAN
			return this.toboolean(i)!==0;
		case 2: // LUA_TLIGHTUSERDATA
			return this.touserdata(i);
		case 3: // LUA_TNUMBER
			return this.tonumberx(i);
		case 4: // LUA_TSTRING
			return this.raw_tostring(i);
		case 7: // LUA_TUSERDATA
			var box = L.testudata(i, "_PROXY_MT");
			if (box !== /* NULL */ 0) {
				var id = emscripten.getValue(box, "double");
				return Lua.refs[id];
			}
			/* fall through */
		default: // LUA_TTABLE, LUA_TFUNCTION, LUA_TTHREAD
			return new Lua.Proxy(this, i);
	}
};
Lua.State.prototype.pushjs = function(ob) {
	var i = Lua.refs.indexOf(ob);
	if (i === -1) {
		i = Lua.refs_i++;
		Lua.refs[i] = ob;
		var box = this.newuserdata(8);
		emscripten.setValue(box, i, "double");
		this.setmetatable("_PROXY_MT");
		// Save in lua table
		this.getfield(Lua.defines.REGISTRYINDEX, "wrapped");
		this.pushnumber(i);
		this.pushvalue(-3);
		this.settable(-3);
		this.pop(1); // pop "wrapped"
	} else {
		this.getfield(Lua.defines.REGISTRYINDEX, "wrapped");
		this.pushnumber(i);
		this.gettable(-2);
		this.remove(this.gettop()-2+1); // Remove "wrapped" from the stack; remove can't take a psuedo index
	}
};
Lua.State.prototype.push = function(ob) {
	switch (typeof ob) {
		case "boolean":
			return this.pushboolean(ob?1:0);
		case "number":
			return this.pushnumber(ob);
		case "string":
			return this.pushstring(ob);
		case "undefined":
			return this.pushnil();
		default:
			if (typeof ob === "function" && ob.L && ob.L._L === this._L) { // Is Lua.Proxy object for this state
				return ob.push();
			}
			return this.pushjs(ob);
	}
};
Lua.State.prototype.load = function(code, name, mode) {
	var chars = emscripten.intArrayFromString(code, true);
	if (this.loadbufferx(chars, chars.length, name, mode) !== 0) {
		throw new Lua.Error(this, -1);
	}
	var r = new Lua.Proxy(this, -1);
	this.pop(1);
	return r;
};
Lua.State.prototype.execute = function(code) {
	var proxy = this.load(code);
	var args = slice.call(arguments, 1);
	return proxy.invoke(args);
};

Lua.Proxy = function (L, i) {
	// We want the proxy to be callable as a normal JS function
	// This means we have to attach other methods to the function manually
	// and return only the first return result
	function self() {
		var args = slice.call(arguments, 0);
		args.splice(0, 0, this);
		return self.invoke(args, 1)[0];
	}
	self.L = L;
	L.pushvalue(i);
	self.ref = L.ref(Lua.defines.REGISTRYINDEX);
	// Add methods
	self.invoke   = Lua.Proxy.invoke;
	self.push     = Lua.Proxy.push;
	self.free     = Lua.Proxy.free;
	self.toString = Lua.Proxy.toString;
	self.get      = Lua.Proxy.get;
	self.set      = Lua.Proxy.set;

	return self;
};
Lua.Proxy.push = function() {
	this.L.rawgeti(Lua.defines.REGISTRYINDEX, this.ref);
};
Lua.Proxy.free = function() {
	this.L.unref(Lua.defines.REGISTRYINDEX, this.ref);
	this.ref = Lua.defines.NOREF;
};
Lua.Proxy.invoke = function(args, n_results) {
	if (this.L.checkstack(1+1+arguments.length)===0) throw "Out of stack space";
	if ((n_results === void 0) || (n_results === null)) {
		n_results = Lua.defines.MULTRET;
	}
	var pre = this.L.gettop();
	this.L.pushcclosure(Lua.cfuncs.traceback, 0);
	this.push();
	for (var i=0; i<args.length; i++) {
		this.L.push(args[i]);
	}
	if (this.L.pcallk(args.length, n_results, 0, null) !== 0) {
		var err = this.L.lua_to_js(-1);
		this.L.settop(pre);
		throw err;
	}
	var top = this.L.gettop();
	var results=[];
	for (var j=pre+2; j<=top; j++) {
		results.push(this.L.lua_to_js(j));
	}
	this.L.settop(pre);
	return results;
};
Lua.Proxy.toString = function() {
	this.push();
	var s = this.L.tostring(-1);
	this.L.pop(2);
	return s;
};
Lua.Proxy.get = function(key) {
	this.push();
	this.L.push(key);
	this.L.gettable(-2);
	var res = this.L.lua_to_js(-1);
	this.L.pop(2); // Pop table + result
	return res;
};
Lua.Proxy.set = function(key, value) {
	this.push();
	this.L.push(key);
	this.L.push(value);
	this.L.settable(-3);
	var res = this.L.lua_to_js(-1);
	this.L.pop(2); // Pop table + result
	return res;
};

Lua.init = function() {
	// Create arbitraily "primary" lua state
	var L = exports.L = new Lua.State();
	L.execute({{{ JS_LUA }}});
	if (typeof window === 'object') {
		// Run script tags on page
		var onload = window.onload;
		window.onload = function() {
			if (onload) onload();
			Lua.executeScripts(L);
		};
	}
};
Lua.executeScripts = function(L) {
	Array.prototype.forEach.call(document.querySelectorAll('script[type=\"text\/lua\"]'), function(tag) {
		L.execute(tag.innerHTML);
	});
};
if (!emscripten.noInitialRun) Lua.init();

return Lua;
})(this, this, Module);
