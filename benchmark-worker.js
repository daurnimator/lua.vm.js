var startup = Date.now();
importScripts('lua.vm.js');
startup = Date.now() - startup;

emscripten.print = function(x) { this.printBuffer += x + '\n' };
emscripten.printBuffer = '';

onmessage = function(event) {
  var msg = event.data;

  function doIt(code) {
    emscripten.printBuffer = '';
    var start = Date.now();
    L.execute(code);
    postMessage({
      benchmark: msg.benchmark,
      startup: startup,
      runtime: Date.now() - start,
      output: emscripten.printBuffer
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

