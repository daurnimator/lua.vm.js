
var Module = {
  noInitialRun: true,
  printBuffer: '',
  print: function(x) {
    Module.printBuffer += x + '\n';
  }
};

importScripts('lua.vm.js'); // TODO: include compile time in time, but make sure no network time here

onmessage = function(event) {
  var msg = event.data;
  var start = Date.now();
  Module.callMain(msg.args);
  postMessage({
    benchmark: msg.benchmark,
    time: Date.now() - start,
    output: Module.printBuffer
  });
};

