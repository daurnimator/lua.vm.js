var Module = {
  noInitialRun: true,
  printBuffer: '',
  print: function(x) {
    Module.printBuffer += x + '\n';
  }
};

var pre = Date.now();

var Module = { print: function(x) { Module.printBuffer += x + '\n' }, printBuffer: '' };
var console = { log: function(){} };

var startup = Date.now();
importScripts('lua.vm.js');
startup = Date.now() - startup;

onmessage = function(event) {
  var msg = event.data;

  function doIt(code) {
    var start = Date.now();
    Lua.execute(code);
    postMessage({
      benchmark: msg.benchmark,
      startup: startup,
      runtime: Date.now() - start,
      output: Module.printBuffer
    });
  }

  if (!msg.args) {
    doIt('');
  } else {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', msg.benchmark + '.lua', true);
    xhr.onload = function() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        doIt(xhr.response);
      } else {
        throw 'failed to load benchmark';
      }
    };
    xhr.onerror = function() { throw 'failed to load benchmark' };
    xhr.send(null);
  }
};

