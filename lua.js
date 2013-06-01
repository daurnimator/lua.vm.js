
var Lua = {
  // public
  init: function() {
    // Load Lua-side glue TODO: embed the file here, avoid the xhr
    var xhr = new XMLHttpRequest();
    xhr.open('get', 'js.lua', false);
    xhr.overrideMimeType('text/plain');
    xhr.send(null);
    var jsLua = xhr.response;
    executeLua(jsLua);
  },
  execute: function(code) {
    Module.ccall('lua_execute', null, ['string'], [code]);
  },

  // internal
  theGlobal: this,
  wrappers: {},
  last: null,
  test: function(what) {
    Lua.last = eval(what);
    switch (typeof Lua.last) {
      case 'number': return 1;
      case 'string': return 2;
      case 'object': return 3;
      case 'function': return 4;
      default: return 0;
    }
  },
  funcWrapper: function(i) {
    return function() {
      executeLua('js.lua_table[' + i + ']()'); 
    };
  }
};

Lua.init();

