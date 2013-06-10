
var Lua = {
  // public
  init: function() {
    Lua.execute({{{ JS_LUA }}});

    // Run script tags on page
    var onload = window.onload;
    window.onload = function() {
      if (onload) onload();
      Lua.executeScripts();
    };
  },
  execute: function(code) {
    Module.ccall('lua_execute', null, ['string'], [code]);
  },

  // internal
  executeScripts: function() {
    Array.prototype.forEach.call(document.querySelectorAll('script[type=\"text\/lua\"]'), function(tag) {
      Lua.execute(tag.innerHTML)
    });
  },

  // internal glue layer
  theGlobal: this,
  wrappers: {},
  reverseWrappers: {},
  last: null,
  test: function(what, idx) {
    Lua.last = eval(what);
    if (this.reverseWrappers[Lua.last]) {
      return -this.reverseWrappers[Lua.last];
    }
    this.reverseWrappers[Lua.last] = idx;
    switch (typeof Lua.last) {
      case 'number': return 1;
      case 'string': return 2;
      case 'object': return 3;
      case 'function': return 4;
      default: return 0;
    }
  },
  funcWrapper: function(i) {
    var realthis = this;
    return function() {
      if (realthis.reverseWrappers[this]) Lua.execute('js.lua_table[' + i + '](js.storeGet('+realthis.reverseWrappers[this]+'))');
      else Lua.execute('js.lua_table[' + i + ']()');
    };
  }
};

Lua.init();

