
var Module = {
  noInitialRun: true,
  printBuffer: '',
  print: function(x) {
    Module.printBuffer += x;
  }
};

importScripts('lua.vm.js'); // TODO: include compile time in time, but make sure no network time here

onmessage = function(event) {
  var msg = event.data;
  var start = Date.now();
throw JSON.stringify(msg.args);
  Module.run(msg.args);
  postMessage({
    benchmark: msg.benchmark,
    time: Date.now() - start,
    output: Module.printBuffer
  });
};

