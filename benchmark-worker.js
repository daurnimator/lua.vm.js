
var Module = {
  noInitialRun: true,
  printBuffer: '',
  print: function(x) {
    Module.printBuffer += x + '\n';
  }
};

var pre = Date.now();

importScripts('benchmark.js');

onmessage = function(event) {
  var msg = event.data;
  var start = Date.now();
  Module.callMain(msg.args);
  postMessage({
    benchmark: msg.benchmark,
    startup: start - pre, // might include network access
    runtime: Date.now() - start,
    output: Module.printBuffer
  });
};

