
lua.vm.js
=========

The Lua VM, on the Web

Online demo: http://kripken.github.io/lua.vm.js/lua.vm.js.html


Status
======

This began as an experiment to see how fast the Lua VM can run on the web.
That was successful (performance is quite good in both firefox and chrome).

Next step is to iterate on the Lua <=> JS interoperability.
Clever solutions to the lack of finalisers in Javascript are being searched for.
 

Building
========

To build, run `make emscripten` in the `lua` subdirectory


License
=======

This project is MIT/X11 licensed. Please see the COPYING file in the source package for more information.
Copyright (c) 2013 Alon Zakai (kripken)
Copyright (c) 2014 Daurnimator

Lua is licensed under MIT.
