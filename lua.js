
var Lua = {
  // public
  init: function() {
    // Load Lua-side glue TODO: embed the file here, avoid the xhr
    var xhr = new XMLHttpRequest();
    xhr.open('get', 'js.lua', false);
    xhr.overrideMimeType('text/plain');
    xhr.send(null);
    var jsLua = xhr.response;
    Lua.execute(jsLua);

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

