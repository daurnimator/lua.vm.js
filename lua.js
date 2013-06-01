
var Lua = {
  // public
  execute: function(code) {
    Module.ccall('lua_execute', null, ['string'], [code]);
  },

  // internal
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

