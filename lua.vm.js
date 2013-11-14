// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 134217728;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 12648;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([117,115,101,114,100,97,116,97,0,0,0,0,0,0,0,0,112,41,0,0,6,1,0,0,240,32,0,0,234,0,0,0,152,25,0,0,94,0,0,0,160,19,0,0,30,0,0,0,232,17,0,0,80,0,0,0,216,15,0,0,178,0,0,0,168,14,0,0,64,1,0,0,0,0,0,0,0,0,0,0,232,26,0,0,46,0,0,0,48,43,0,0,68,0,0,0,120,34,0,0,202,0,0,0,112,26,0,0,60,1,0,0,128,20,0,0,24,1,0,0,40,16,0,0,238,0,0,0,224,14,0,0,64,0,0,0,0,13,0,0,4,1,0,0,192,11,0,0,218,0,0,0,128,10,0,0,58,0,0,0,248,46,0,0,124,0,0,0,0,0,0,0,0,0,0,0,152,33,0,0,216,0,0,0,32,26,0,0,56,0,0,0,240,19,0,0,100,0,0,0,232,15,0,0,66,0,0,0,184,14,0,0,134,0,0,0,216,12,0,0,114,0,0,0,128,11,0,0,140,0,0,0,104,10,0,0,254,0,0,0,200,46,0,0,208,0,0,0,40,45,0,0,74,0,0,0,48,44,0,0,122,0,0,0,0,43,0,0,54,0,0,0,248,41,0,0,248,0,0,0,16,41,0,0,96,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,7,7,7,7,7,7,10,9,5,4,3,3,3,3,3,3,3,3,3,3,3,3,2,2,1,1,0,0,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,120,19,0,0,76,0,0,0,248,18,0,0,206,0,0,0,88,18,0,0,40,1,0,0,0,0,0,0,0,0,0,0,200,36,0,0,224,35,0,0,48,35,0,0,104,34,0,0,104,33,0,0,128,10,0,0,0,0,0,0,0,0,0,0,6,0,0,0,3,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,2,0,0,0,112,35,0,0,34,0,0,0,216,27,0,0,38,0,0,0,192,21,0,0,120,0,0,0,248,16,0,0,154,0,0,0,0,15,0,0,18,0,0,0,168,13,0,0,182,0,0,0,224,11,0,0,56,1,0,0,168,10,0,0,188,0,0,0,16,47,0,0,70,0,0,0,208,45,0,0,92,0,0,0,112,44,0,0,88,0,0,0,64,43,0,0,228,0,0,0,48,42,0,0,180,0,0,0,80,41,0,0,232,0,0,0,128,40,0,0,28,0,0,0,144,39,0,0,244,0,0,0,168,38,0,0,214,0,0,0,0,38,0,0,210,0,0,0,248,36,0,0,112,0,0,0,32,36,0,0,160,0,0,0,64,35,0,0,78,0,0,0,144,34,0,0,144,0,0,0,160,33,0,0,220,0,0,0,208,32,0,0,32,0,0,0,216,31,0,0,16,1,0,0,248,30,0,0,54,1,0,0,48,30,0,0,190,0,0,0,152,29,0,0,170,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,22,22,22,22,22,22,22,22,22,22,4,4,4,4,4,4,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,5,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,127,64,104,35,0,0,200,34,0,0,192,33,0,0,248,32,0,0,56,32,0,0,48,31,0,0,128,30,0,0,184,29,0,0,32,29,0,0,128,28,0,0,208,27,0,0,240,26,0,0,56,26,0,0,160,25,0,0,240,24,0,0,80,24,0,0,0,24,0,0,136,23,0,0,232,22,0,0,112,22,0,0,184,21,0,0,0,21,0,0,56,20,0,0,168,19,0,0,56,19,0,0,152,18,0,0,40,18,0,0,200,17,0,0,144,17,0,0,56,17,0,0,232,16,0,0,96,16,0,0,0,16,0,0,0,0,0,0,104,17,0,0,96,41,0,0,224,32,0,0,8,0,0,0,136,25,0,0,128,19,0,0,200,15,0,0,152,14,0,0,8,0,0,0,208,12,0,0,80,11,0,0,72,10,0,0,160,46,0,0,16,45,0,0,0,44,0,0,192,42,0,0,240,41,0,0,0,41,0,0,8,40,0,0,40,39,0,0,88,38,0,0,96,37,0,0,136,36,0,0,152,35,0,0,240,34,0,0,24,34,0,0,32,33,0,0,88,32,0,0,136,31,0,0,0,0,0,0,96,113,65,84,80,80,92,108,60,16,60,84,108,124,124,124,124,124,124,96,96,96,104,34,188,188,188,132,228,84,84,16,98,98,4,98,20,81,80,23,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,0,0,0,0,192,19,0,0,80,19,0,0,208,18,0,0,56,18,0,0,224,17,0,0,152,17,0,0,80,17,0,0,8,17,0,0,176,16,0,0,80,16,0,0,240,15,0,0,0,0,0,0,160,38,0,0,80,1,0,0,248,37,0,0,136,0,0,0,0,0,0,0,0,0,0,0,64,15,0,0,102,0,0,0,184,40,0,0,118,0,0,0,0,0,0,0,0,0,0,0,232,11,0,0,138,0,0,0,176,10,0,0,74,1,0,0,128,25,0,0,28,1,0,0,24,47,0,0,98,0,0,0,216,24,0,0,242,0,0,0,64,24,0,0,192,0,0,0,232,23,0,0,174,0,0,0,216,45,0,0,230,0,0,0,96,23,0,0,62,0,0,0,192,22,0,0,14,1,0,0,56,42,0,0,12,0,0,0,0,0,0,0,0,0,0,0,120,35,0,0,208,34,0,0,200,33,0,0,0,33,0,0,64,32,0,0,0,0,0,0,232,11,0,0,138,0,0,0,176,10,0,0,224,0,0,0,24,47,0,0,44,0,0,0,216,45,0,0,148,0,0,0,128,44,0,0,2,0,0,0,104,43,0,0,78,1,0,0,56,42,0,0,50,0,0,0,88,41,0,0,62,1,0,0,136,40,0,0,10,0,0,0,0,0,0,0,0,0,0,0,40,36,0,0,80,35,0,0,152,34,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,176,33,0,0,216,32,0,0,224,31,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,12,0,0,0,1,0,0,24,39,0,0,76,1,0,0,160,30,0,0,36,0,0,0,24,24,0,0,68,1,0,0,64,18,0,0,48,0,0,0,96,15,0,0,30,1,0,0,224,13,0,0,16,0,0,0,32,12,0,0,126,0,0,0,208,10,0,0,128,0,0,0,200,9,0,0,40,0,0,0,64,46,0,0,22,1,0,0,224,44,0,0,200,0,0,0,168,43,0,0,250,0,0,0,96,42,0,0,104,0,0,0,152,41,0,0,60,0,0,0,232,40,0,0,70,1,0,0,0,0,0,0,0,0,0,0,240,12,0,0,132,0,0,0,120,39,0,0,252,0,0,0,224,30,0,0,152,0,0,0,40,24,0,0,246,0,0,0,80,18,0,0,150,0,0,0,112,15,0,0,198,0,0,0,0,0,0,0,0,0,0,0,176,14,0,0,66,1,0,0,16,40,0,0,20,0,0,0,144,31,0,0,52,1,0,0,112,24,0,0,14,0,0,0,216,18,0,0,106,0,0,0,120,15,0,0,32,1,0,0,16,14,0,0,166,0,0,0,80,12,0,0,194,0,0,0,24,11,0,0,20,1,0,0,24,10,0,0,108,0,0,0,128,46,0,0,36,1,0,0,248,44,0,0,164,0,0,0,0,0,0,0,0,0,0,0,232,24,0,0,84,0,0,0,40,19,0,0,38,1,0,0,136,15,0,0,212,0,0,0,72,14,0,0,204,0,0,0,136,12,0,0,226,0,0,0,32,11,0,0,8,1,0,0,32,10,0,0,236,0,0,0,136,46,0,0,46,1,0,0,0,45,0,0,46,1,0,0,232,43,0,0,24,0,0,0,184,42,0,0,4,0,0,0,232,41,0,0,186,0,0,0,248,40,0,0,240,0,0,0,248,39,0,0,222,0,0,0,16,39,0,0,196,0,0,0,80,38,0,0,58,1,0,0,88,37,0,0,34,1,0,0,128,36,0,0,26,1,0,0,136,35,0,0,2,1,0,0,224,34,0,0,130,0,0,0,8,34,0,0,86,0,0,0,24,33,0,0,8,0,0,0,80,32,0,0,146,0,0,0,0,0,0,0,0,0,0,0,43,45,0,0,0,0,0,0,117,112,118,97,108,117,101,105,100,0,0,0,0,0,0,0,99,111,114,111,117,116,105,110,101,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,110,111,110,45,115,117,115,112,101,110,100,101,100,32,99,111,114,111,117,116,105,110,101,0,0,0,114,101,112,108,97,99,101,0,108,111,97,100,102,105,108,101,0,0,0,0,0,0,0,0,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,32,105,110,0,0,0,0,0,117,112,118,97,108,0,0,0,112,111,115,105,116,105,111,110,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,108,101,110,0,0,0,0,0,115,101,108,102,0,0,0,0,103,108,111,98,97,108,0,0,116,105,109,101,0,0,0,0,76,85,65,95,67,80,65,84,72,95,53,95,50,0,0,0,110,111,32,109,101,115,115,97,103,101,0,0,0,0,0,0,99,111,115,0,0,0,0,0,102,108,117,115,104,0,0,0,109,97,116,104,0,0,0,0,110,0,0,0,0,0,0,0,80,112,0,0,0,0,0,0,117,112,118,97,108,117,101,106,111,105,110,0,0,0,0,0,116,111,111,32,109,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,114,101,115,117,109,101,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,101,114,114,111,114,32,104,97,110,100,108,105,110,103,0,108,115,104,105,102,116,0,0,105,112,97,105,114,115,0,0,39,102,111,114,39,32,115,116,101,112,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,0,110,111,116,32,97,0,0,0,112,114,111,116,111,0,0,0,105,110,118,97,108,105,100,32,111,114,100,101,114,32,102,117,110,99,116,105,111,110,32,102,111,114,32,115,111,114,116,105,110,103,0,0,0,0,0,0,103,115,117,98,0,0,0,0,99,97,110,110,111,116,32,117,115,101,32,39,46,46,46,39,32,111,117,116,115,105,100,101,32,97,32,118,97,114,97,114,103,32,102,117,110,99,116,105,111,110,0,0,0,0,0,0,95,69,78,86,0,0,0,0,115,101,116,108,111,99,97,108,101,0,0,0,0,0,0,0,34,93,0,0,0,0,0,0,99,112,97,116,104,0,0,0,99,111,115,104,0,0,0,0,99,108,111,115,101,0,0,0,98,105,116,51,50,0,0,0,39,37,99,39,0,0,0,0,98,97,100,32,97,114,103,117,109,101,110,116,32,35,37,100,32,40,37,115,41,0,0,0,88,120,0,0,0,0,0,0,103,101,116,117,112,118,97,108,117,101,0,0,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,100,101,97,100,32,99,111,114,111,117,116,105,110,101,0,0,0,0,108,114,111,116,97,116,101,0,97,116,116,101,109,112,116,32,116,111,32,108,111,97,100,32,97,32,37,115,32,99,104,117,110,107,32,40,109,111,100,101,32,105,115,32,39,37,115,39,41,0,0,0,0,0,0,0,103,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,39,102,111,114,39,32,108,105,109,105,116,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,99,111,114,114,117,112,116,101,100,0,0,0,0,0,0,0,100,101,98,117,103,0,0,0,116,104,114,101,97,100,0,0,103,109,97,116,99,104,0,0,67,32,108,101,118,101,108,115,0,0,0,0,0,0,0,0,99,114,101,97,116,101,0,0,108,111,99,97,108,0,0,0,114,101,110,97,109,101,0,0,91,115,116,114,105,110,103,32,34,0,0,0,0,0,0,0,47,117,115,114,47,108,111,99,97,108,47,115,104,97,114,101,47,108,117,97,47,53,46,50,47,63,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,115,104,97,114,101,47,108,117,97,47,53,46,50,47,63,47,105,110,105,116,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,47,105,110,105,116,46,108,117,97,59,46,47,63,46,108,117,97,0,0,0,0,0,0,0,99,101,105,108,0,0,0,0,95,95,105,110,100,101,120,0,115,116,114,105,110,103,0,0,10,9,40,46,46,46,116,97,105,108,32,99,97,108,108,115,46,46,46,41,0,0,0,0,69,101,0,0,0,0,0,0,103,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,116,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,32,116,111,32,114,101,115,117,109,101,0,0,0,0,101,120,116,114,97,99,116,0,102,117,110,99,116,105,111,110,32,111,114,32,101,120,112,114,101,115,115,105,111,110,32,116,111,111,32,99,111,109,112,108,101,120,0,0,0,0,0,0,116,101,120,116,0,0,0,0,101,114,114,111,114,0,0,0,39,102,111,114,39,32,105,110,105,116,105,97,108,32,118,97,108,117,101,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,37,115,58,32,37,115,32,112,114,101,99,111,109,112,105,108,101,100,32,99,104,117,110,107,0,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,115,111,114,116,0,0,0,0,97,114,115,104,105,102,116,0,102,111,114,109,97,116,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,37,115,58,37,100,58,32,37,115,0,0,0,0,0,0,0,114,101,109,111,118,101,0,0,46,46,46,0,0,0,0,0,76,85,65,95,80,65,84,72,0,0,0,0,0,0,0,0,97,116,97,110,0,0,0,0,99,97,110,110,111,116,32,99,108,111,115,101,32,115,116,97,110,100,97,114,100,32,102,105,108,101,0,0,0,0,0,0,111,115,0,0,0,0,0,0,32,105,110,32,0,0,0,0,95,71,0,0,0,0,0,0,114,117,110,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,46,0,0,0,0,0,0,0,103,101,116,114,101,103,105,115,116,114,121,0,0,0,0,0,121,105,101,108,100,0,0,0,98,116,101,115,116,0,0,0,98,105,110,97,114,121,0,0,100,111,102,105,108,101,0,0,97,115,115,101,114,116,105,111,110,32,102,97,105,108,101,100,33,0,0,0,0,0,0,0,103,101,116,32,108,101,110,103,116,104,32,111,102,0,0,0,116,114,117,110,99,97,116,101,100,0,0,0,0,0,0,0,116,97,98,108,101,0,0,0,37,115,0,0,0,0,0,0,114,101,109,111,118,101,0,0,37,46,49,52,103,0,0,0,102,105,110,100,0,0,0,0,105,110,99,114,101,109,101,110,116,97,108,0,0,0,0,0,60,115,116,114,105,110,103,62,0,0,0,0,0,0,0,0,37,115,10,0,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,0,0,0,0,0,103,101,116,101,110,118,0,0,97,116,116,101,109,112,116,32,116,111,32,99,111,109,112,97,114,101,32,37,115,32,119,105,116,104,32,37,115,0,0,0,103,101,110,101,114,97,116,105,111,110,97,108,0,0,0,0,60,110,97,109,101,62,0,0,61,40,100,101,98,117,103,32,99,111,109,109,97,110,100,41,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,37,37,99,39,32,116,111,32,39,108,117,97,95,112,117,115,104,102,115,116,114,105,110,103,39,0,0,0,0,0,0,105,115,114,117,110,110,105,110,103,0,0,0,0,0,0,0,76,85,65,95,80,65,84,72,95,53,95,50,0,0,0,0,102,117,110,99,116,105,111,110,32,60,37,115,58,37,100,62,0,0,0,0,0,0,0,0,60,110,117,109,98,101,114,62,0,0,0,0,0,0,0,0,97,116,97,110,50,0,0,0,99,111,110,116,10,0,0,0,115,101,116,109,97,106,111,114,105,110,99,0,0,0,0,0,70,73,76,69,42,0,0,0,105,111,0,0,0,0,0,0,109,97,105,110,32,99,104,117,110,107,0,0,0,0,0,0,60,101,111,102,62,0,0,0,108,117,97,95,100,101,98,117,103,62,32,0,0,0,0,0,115,101,116,115,116,101,112,109,117,108,0,0,0,0,0,0,105,110,105,116,0,0,0,0,110,111,32,118,97,108,117,101,0,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,39,37,115,39,0,0,0,37,100,58,0,0,0,0,0,58,58,0,0,0,0,0,0,115,101,116,112,97,117,115,101,0,0,0,0,0,0,0,0,97,98,115,101,110,116,0,0,105,110,118,97,108,105,100,32,109,111,100,101,0,0,0,0,46,0,0,0,0,0,0,0,126,61,0,0,0,0,0,0,101,120,116,101,114,110,97,108,32,104,111,111,107,0,0,0,115,116,101,112,0,0,0,0,117,110,112,97,99,107,0,0,95,95,105,110,100,101,120,0,114,119,97,0,0,0,0,0,105,110,118,97,108,105,100,32,108,111,110,103,32,115,116,114,105,110,103,32,100,101,108,105,109,105,116,101,114,0,0,0,102,0,0,0,0,0,0,0,60,61,0,0,0,0,0,0,102,117,110,99,0,0,0,0,99,111,117,110,116,0,0,0,103,101,116,108,111,99,97,108,0,0,0,0,0,0,0,0,119,114,97,112,0,0,0,0,115,101,101,97,108,108,0,0,99,97,110,110,111,116,32,111,112,101,110,32,102,105,108,101,32,39,37,115,39,32,40,37,115,41,0,0,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,44,32,103,111,116,32,37,115,0,0,0,0,0,62,61,0,0,0,0,0,0,97,99,116,105,118,101,108,105,110,101,115,0,0,0,0,0,99,111,110,116,114,111,108,32,115,116,114,117,99,116,117,114,101,32,116,111,111,32,108,111,110,103,0,0,0,0,0,0,99,111,108,108,101,99,116,0,98,120,111,114,0,0,0,0,116,97,98,108,101,32,105,110,100,101,120,32,105,115,32,110,105,108,0,0,0,0,0,0,115,101,97,114,99,104,112,97,116,104,0,0,0,0,0,0,119,0,0,0,0,0,0,0,99,97,110,110,111,116,32,37,115,32,37,115,58,32,37,115,0,0,0,0,0,0,0,0,99,111,108,108,101,99,116,103,97,114,98,97,103,101,0,0,61,61,0,0,0,0,0,0,105,115,116,97,105,108,99,97,108,108,0,0,0,0,0,0,114,101,115,116,97,114,116,0,115,116,114,105,110,103,32,108,101,110,103,116,104,32,111,118,101,114,102,108,111,119,0,0,25,147,13,10,26,10,0,0,108,111,97,100,108,105,98,0,115,116,114,105,110,103,0,0,39,112,111,112,101,110,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,112,97,99,107,0,0,0,0,46,46,46,0,0,0,0,0,110,97,109,101,119,104,97,116,0,0,0,0,0,0,0,0,115,116,111,112,0,0,0,0,10,9,110,111,32,102,105,101,108,100,32,112,97,99,107,97,103,101,46,112,114,101,108,111,97,100,91,39,37,115,39,93,0,0,0,0,0,0,0,0,100,117,109,112,0,0,0,0,114,0,0,0,0,0,0,0,80,65,78,73,67,58,32,117,110,112,114,111,116,101,99,116,101,100,32,101,114,114,111,114,32,105,110,32,99,97,108,108,32,116,111,32,76,117,97,32,65,80,73,32,40,37,115,41,10,0,0,0,0,0,0,0,46,46,0,0,0,0,0,0,110,97,109,101,0,0,0,0,108,97,98,101,108,115,47,103,111,116,111,115,0,0,0,0,95,95,105,112,97,105,114,115,0,0,0,0,0,0,0,0,115,116,114,105,110,103,32,115,108,105,99,101,32,116,111,111,32,108,111,110,103,0,0,0,101,120,105,116,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,99,111,109,112,97,114,101,32,116,119,111,32,37,115,32,118,97,108,117,101,115,0,0,0,0,0,0,0,0,102,105,108,101,0,0,0,0,98,97,100,32,99,111,110,118,101,114,115,105,111,110,32,110,117,109,98,101,114,45,62,105,110,116,59,32,109,117,115,116,32,114,101,99,111,109,112,105,108,101,32,76,117,97,32,119,105,116,104,32,112,114,111,112,101,114,32,115,101,116,116,105,110,103,115,0,0,0,0,0,119,104,105,108,101,0,0,0,105,115,118,97,114,97,114,103,0,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,114,101,97,100,101,114,32,102,117,110,99,116,105,111,110,32,109,117,115,116,32,114,101,116,117,114,110,32,97,32,115,116,114,105,110,103,0,0,0,0,118,97,108,117,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,114,0,0,0,0,0,0,0,112,97,116,104,0,0,0,0,99,108,111,115,101,100,32,102,105,108,101,0,0,0,0,0,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,58,32,97,112,112,46,32,110,101,101,100,115,32,37,102,44,32,76,117,97,32,99,111,114,101,32,112,114,111,118,105,100,101,115,32,37,102,0,0,0,117,110,116,105,108,0,0,0,97,115,105,110,0,0,0,0,110,112,97,114,97,109,115,0,116,111,111,32,109,97,110,121,32,110,101,115,116,101,100,32,102,117,110,99,116,105,111,110,115,0,0,0,0,0,0,0,117,110,97,98,108,101,32,116,111,32,100,117,109,112,32,103,105,118,101,110,32,102,117,110,99,116,105,111,110,0,0,0,115,116,100,101,114,114,0,0,10,9,110,111,32,102,105,108,101,32,39,37,115,39,0,0,115,116,97,110,100,97,114,100,32,37,115,32,102,105,108,101,32,105,115,32,99,108,111,115,101,100,0,0,0,0,0,0,116,97,98,108,101,0,0,0,109,117,108,116,105,112,108,101,32,76,117,97,32,86,77,115,32,100,101,116,101,99,116,101,100,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,110,117,112,115,0,0,0,0,61,40,108,111,97,100,41,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,32,40,119,105,100,116,104,32,111,114,32,112,114,101,99,105,115,105,111,110,32,116,111,111,32,108,111,110,103,41,0,0,0,0,63,0,0,0,0,0,0,0,116,121,112,101,0,0,0,0,116,111,111,32,109,97,110,121,32,117,112,118,97,108,117,101,115,0,0,0,0,0,0,0,10,9,37,115,58,0,0,0,116,104,101,110,0,0,0,0,99,117,114,114,101,110,116,108,105,110,101,0,0,0,0,0,98,116,0,0,0,0,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,32,40,114,101,112,101,97,116,101,100,32,102,108,97,103,115,41,0,110,111,116,32,101,110,111,117,103,104,32,109,101,109,111,114,121,0,0,0,0,0,0,0,39,112,97,99,107,97,103,101,46,37,115,39,32,109,117,115,116,32,98,101,32,97,32,115,116,114,105,110,103,0,0,0,116,109,112,102,105,108,101,0,110,97,109,101,32,99,111,110,102,108,105,99,116,32,102,111,114,32,109,111,100,117,108,101,32,39,37,115,39,0,0,0,114,101,116,117,114,110,0,0,119,104,97,116,0,0,0,0,95,95,112,97,105,114,115,0,45,43,32,35,48,0,0,0,100,121,110,97,109,105,99,32,108,105,98,114,97,114,105,101,115,32,110,111,116,32,101,110,97,98,108,101,100,59,32,99,104,101,99,107,32,121,111,117,114,32,76,117,97,32,105,110,115,116,97,108,108,97,116,105,111,110,0,0,0,0,0,0,112,111,112,101,110,0,0,0,95,69,78,86,0,0,0,0,95,76,79,65,68,69,68,0,114,101,112,101,97,116,0,0,108,97,115,116,108,105,110,101,100,101,102,105,110,101,100,0,103,101,116,105,110,102,111,0,92,37,48,51,100,0,0,0,115,116,97,116,117,115,0,0,108,117,97,111,112,101,110,95,37,115,0,0,0,0,0,0,111,117,116,112,117,116,0,0,37,115,58,32,37,112,0,0,111,114,0,0,0,0,0,0,108,105,110,101,100,101,102,105,110,101,100,0,0,0,0,0,111,112,99,111,100,101,115,0,98,111,114,0,0,0,0,0,92,37,100,0,0,0,0,0,60,37,115,62,32,97,116,32,108,105,110,101,32,37,100,32,110,111,116,32,105,110,115,105,100,101,32,97,32,108,111,111,112,0,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,121,105,101,108,100,32,102,114,111,109,32,111,117,116,115,105,100,101,32,97,32,99,111,114,111,117,116,105,110,101,0,0,0,0,0,0,0,111,112,101,110,0,0,0,0,110,105,108,0,0,0,0,0,97,115,115,101,114,116,0,0,110,111,116,0,0,0,0,0,115,104,111,114,116,95,115,114,99,0,0,0,0,0,0,0,39,116,111,115,116,114,105,110,103,39,32,109,117,115,116,32,114,101,116,117,114,110,32,97,32,115,116,114,105,110,103,32,116,111,32,39,112,114,105,110,116,39,0,0,0,0,0,0,108,111,111,112,32,105,110,32,115,101,116,116,97,98,108,101,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,37,37,99,39,32,116,111,32,39,102,111,114,109,97,116,39,0,0,0,0,0,0,0,95,0,0,0,0,0,0,0,105,110,112,117,116,0,0,0,110,117,109,98,101,114,0,0,102,97,108,115,101,0,0,0,105,110,115,101,114,116,0,0,110,105,108,0,0,0,0,0,115,111,117,114,99,101,0,0,105,110,118,97,108,105,100,32,107,101,121,32,116,111,32,39,110,101,120,116,39,0,0,0,116,97,98,108,101,32,111,114,32,115,116,114,105,110,103,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,0,0,110,111,116,32,97,32,110,111,110,45,110,101,103,97,116,105,118,101,32,110,117,109,98,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,0,0,0,0,0,46,0,0,0,0,0,0,0,99,104,97,114,0,0,0,0,37,115,0,0,0,0,0,0,116,114,117,101,0,0,0,0,108,111,99,97,108,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,0,0,98,114,101,97,107,0,0,0,105,110,100,101,120,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,101,120,101,99,117,116,101,0,101,114,114,111,114,32,108,111,97,100,105,110,103,32,109,111,100,117,108,101,32,39,37,115,39,32,102,114,111,109,32,102,105,108,101,32,39,37,115,39,58,10,9,37,115,0,0,0,102,105,108,101,32,105,115,32,97,108,114,101,97,100,121,32,99,108,111,115,101,100,0,0,112,101,114,102,111,114,109,32,97,114,105,116,104,109,101,116,105,99,32,111,110,0,0,0,95,95,116,111,115,116,114,105,110,103,0,0,0,0,0,0,99,108,111,99,107,0,0,0,105,110,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,111,114,32,108,101,118,101,108,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,37,112,0,0,0,0,0,0,99,97,110,110,111,116,32,99,104,97,110,103,101,32,97,32,112,114,111,116,101,99,116,101,100,32,109,101,116,97,116,97,98,108,101,0,0,0,0,0,110,111,116,32,97,32,110,117,109,98,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,0,0,10,9,110,111,32,109,111,100,117,108,101,32,39,37,115,39,32,105,110,32,102,105,108,101,32,39,37,115,39,0,0,0,115,101,97,114,99,104,101,114,115,0,0,0,0,0,0,0,116,111,111,32,109,97,110,121,32,111,112,116,105,111,110,115,0,0,0,0,0,0,0,0,111,98,106,101,99,116,32,108,101,110,103,116,104,32,105,115,32,110,111,116,32,97,32,110,117,109,98,101,114,0,0,0,105,102,0,0,0,0,0,0,97,99,111,115,0,0,0,0,62,37,115,0,0,0,0,0,95,95,109,101,116,97,116,97,98,108,101,0,0,0,0,0,110,111,32,118,97,108,117,101,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,99,111,110,118,101,114,115,105,111,110,32,115,112,101,99,105,102,105,101,114,32,39,37,37,37,115,39,0,0,0,0,0,115,116,100,111,117,116,0,0,47,0,0,0,0,0,0,0,119,114,111,110,103,32,110,117,109,98,101,114,32,111,102,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,0,37,108,102,0,0,0,0,0,99,111,114,111,117,116,105,110,101,0,0,0,0,0,0,0,114,101,97,100,0,0,0,0,103,111,116,111,0,0,0,0,102,108,110,83,116,117,0,0,110,105,108,32,111,114,32,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,0,105,110,118,97,108,105,100,32,117,115,101,32,111,102,32,39,37,99,39,32,105,110,32,114,101,112,108,97,99,101,109,101,110,116,32,115,116,114,105,110,103,0,0,0,0,0,0,0,76,85,65,95,78,79,69,78,86,0,0,0,0,0,0,0,105,110,116,101,114,118,97,108,32,105,115,32,101,109,112,116,121,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,0,0,114,101,111,112,101,110,0,0,83,108,110,116,0,0,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,76,117,97,32,102,117,110,99,116,105,111,110,32,101,120,112,101,99,116,101,100,0,0,0,32,12,10,13,9,11,0,0,105,110,118,97,108,105,100,32,114,101,112,108,97,99,101,109,101,110,116,32,118,97,108,117,101,32,40,97,32,37,115,41,0,0,0,0,0,0,0,0,97,65,98,66,99,100,72,73,106,109,77,112,83,85,119,87,120,88,121,89,122,37,0,0,1,0,0,0,0,0,0,0,116,97,110,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,0,0,114,98,0,0,0,0,0,0,102,111,114,0,0,0,0,0,105,110,118,97,108,105,100,32,117,112,118,97,108,117,101,32,105,110,100,101,120,0,0,0,98,97,115,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,0,115,116,114,105,110,103,47,102,117,110,99,116,105,111,110,47,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,117,112,118,97,108,117,101,115,0,0,0,0,0,0,0,0,121,100,97,121,0,0,0,0,59,1,59,0,0,0,0,0,116,97,110,104,0,0,0,0,116,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,39,37,115,39,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,37,115,32,37,115,32,39,37,115,39,32,40,97,32,37,115,32,118,97,108,117,101,41,0,0,0,0,0,0,102,97,108,115,101,0,0,0,62,117,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,103,101,116,104,111,111,107,0,94,36,42,43,63,46,40,91,37,45,0,0,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,32,40,116,111,32,99,108,111,115,101,32,37,115,32,97,116,32,108,105,110,101,32,37,100,41,0,0,0,0,114,117,110,110,105,110,103,0,119,100,97,121,0,0,0,0,59,59,0,0,0,0,0,0,115,113,114,116,0,0,0,0,110,111,116,32,97,110,32,105,110,116,101,103,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,110,78,0,0,0,0,0,0,111,112,101,110,0,0,0,0,101,110,100,0,0,0,0,0,102,117,108,108,32,117,115,101,114,100,97,116,97,32,101,120,112,101,99,116,101,100,44,32,103,111,116,32,108,105,103,104,116,32,117,115,101,114,100,97,116,97,0,0,0,0,0,0,99,111,110,115,116,97,110,116,115,0,0,0,0,0,0,0,118,97,108,117,101,32,101,120,112,101,99,116,101,100,0,0,95,95,99,97,108,108,0,0,98,110,111,116,0,0,0,0,105,110,118,97,108,105,100,32,112,97,116,116,101,114,110,32,99,97,112,116,117,114,101,0,40,102,111,114,32,115,116,101,112,41,0,0,0,0,0,0,42,116,0,0,0,0,0,0,95,80,65,67,75,65,71,69,0,0,0,0,0,0,0,0,115,105,110,0,0,0,0,0,101,110,100,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,121,105,101,108,100,32,97,99,114,111,115,115,32,97,32,67,45,99,97,108,108,32,98,111,117,110,100,97,114,121,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,95,86,69,82,83,73,79,78,0,0,0,0,0,0,0,0,45,49,0,0,0,0,0,0,101,108,115,101,105,102,0,0,116,97,105,108,32,99,97,108,108,0,0,0,0,0,0,0,120,112,99,97,108,108,0,0,95,95,99,111,110,99,97,116,0,0,0,0,0,0,0,0,108,111,111,112,32,105,110,32,103,101,116,116,97,98,108,101,0,0,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,109,105,115,115,105,110,103,32,97,114,103,117,109,101,110,116,115,32,116,111,32,39,37,37,98,39,41,0,0,40,102,111,114,32,108,105,109,105,116,41,0,0,0,0,0,37,99,0,0,0,0,0,0,95,77,0,0,0,0,0,0,115,105,110,104,0,0,0,0,99,117,114,0,0,0,0,0,98,111,111,108,101,97,110,0,64,37,115,0,0,0,0,0,109,97,120,110,0,0,0,0,101,108,115,101,0,0,0,0,99,111,117,110,116,0,0,0,116,97,98,108,101,32,111,118,101,114,102,108,111,119,0,0,116,121,112,101,0,0,0,0,95,95,108,101,0,0,0,0,40,42,118,97,114,97,114,103,41,0,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,109,105,115,115,105,110,103,32,39,93,39,41,0,40,102,111,114,32,105,110,100,101,120,41,0,0,0,0,0,110,117,109,101,114,105,99,0,39,109,111,100,117,108,101,39,32,110,111,116,32,99,97,108,108,101,100,32,102,114,111,109,32,97,32,76,117,97,32,102,117,110,99,116,105,111,110,0,98,121,116,101,0,0,0,0,114,97,110,100,111,109,115,101,101,100,0,0,0,0,0,0,115,101,116,0,0,0,0,0,61,115,116,100,105,110,0,0,100,111,0,0,0,0,0,0,108,105,110,101,0,0,0,0,60,103,111,116,111,32,37,115,62,32,97,116,32,108,105,110,101,32,37,100,32,106,117,109,112,115,32,105,110,116,111,32,116,104,101,32,115,99,111,112,101,32,111,102,32,108,111,99,97,108,32,39,37,115,39,0,116,111,115,116,114,105,110,103,0,0,0,0,0,0,0,0,95,95,108,116,0,0,0,0,40,42,116,101,109,112,111,114,97,114,121,41,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,101,110,100,115,32,119,105,116,104,32,39,37,37,39,41,0,0,0,0,0,0,40,102,111,114,32,99,111,110,116,114,111,108,41,0,0,0,109,111,110,101,116,97,114,121,0,0,0,0,0,0,0,0,100,105,102,102,116,105,109,101,0,0,0,0,0,0,0,0,102,0,0,0,0,0,0,0,114,97,110,100,111,109,0,0,108,105,110,101,0,0,0,0,99,111,110,99,97,116,101,110,97,116,101,0,0,0,0,0,98,117,102,102,101,114,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,0,0,98,114,101,97,107,0,0,0,114,101,116,117,114,110,0,0,40,110,117,108,108,41,0,0,116,111,110,117,109,98,101,114,0,0,0,0,0,0,0,0,95,95,117,110,109,0,0,0,76,117,97,0,0,0,0,0,105,110,118,97,108,105,100,32,99,97,112,116,117,114,101,32,105,110,100,101,120,32,37,37,37,100,0,0,0,0,0,0,40,102,111,114,32,115,116,97,116,101,41,0,0,0,0,0,99,116,121,112,101,0,0,0,95,78,65,77,69,0,0,0,114,97,100,0,0,0,0,0,108,111,97,100,101,114,115,0,102,117,108,108,0,0,0,0,118,97,108,117,101,32,101,120,112,101,99,116,101,100,0,0,97,110,100,0,0,0,0,0,97,98,115,0,0,0,0,0,99,97,108,108,0,0,0,0,95,67,76,73,66,83,0,0,115,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,95,95,112,111,119,0,0,0,109,97,105,110,0,0,0,0,109,105,115,115,105,110,103,32,39,91,39,32,97,102,116,101,114,32,39,37,37,102,39,32,105,110,32,112,97,116,116,101,114,110,0,0,0,0,0,0,40,102,111,114,32,103,101,110,101,114,97,116,111,114,41,0,99,111,108,108,97,116,101,0,95,73,79,95,111,117,116,112,117,116,0,0,0,0,0,0,109,111,100,117,108,101,32,39,37,115,39,32,110,111,116,32,102,111,117,110,100,58,37,115,0,0,0,0,0,0,0,0,10,9,46,46,46,0,0,0,112,111,119,0,0,0,0,0,110,111,0,0,0,0,0,0,112,97,99,107,97,103,101,0,116,111,111,32,109,97,110,121,32,37,115,32,40,108,105,109,105,116,32,105,115,32,37,100,41,0,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,37,115,32,110,101,97,114,32,37,115,0,0,0,0,0,0,95,95,109,111,100,101,0,0,115,101,108,101,99,116,0,0,95,95,109,111,100,0,0,0,61,63,0,0,0,0,0,0,112,97,116,116,101,114,110,32,116,111,111,32,99,111,109,112,108,101,120,0,0,0,0,0,39,61,39,32,111,114,32,39,105,110,39,32,101,120,112,101,99,116,101,100,0,0,0,0,97,108,108,0,0,0,0,0,39,112,97,99,107,97,103,101,46,115,101,97,114,99,104,101,114,115,39,32,109,117,115,116,32,98,101,32,97,32,116,97,98,108,101,0,0,0,0,0,109,111,100,102,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,117,115,101,32,97,32,99,108,111,115,101,100,32,102,105,108,101,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,32,40,37,115,41,0,0,0,0,0,63,0,0,0,0,0,0,0,37,115,58,37,100,58,32,37,115,0,0,0,0,0,0,0,107,0,0,0,0,0,0,0,114,97,119,115,101,116,0,0,95,95,100,105,118,0,0,0,67,0,0,0,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,99,97,112,116,117,114,101,0,0,0,0,0,0,108,97,98,101,108,32,39,37,115,39,32,97,108,114,101,97,100,121,32,100,101,102,105,110,101,100,32,111,110,32,108,105,110,101,32,37,100,0,0,0,102,105,101,108,100,32,39,37,115,39,32,109,105,115,115,105,110,103,32,105,110,32,100,97,116,101,32,116,97,98,108,101,0,0,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,95,95,103,99,32,109,101,116,97,109,101,116,104,111,100,32,40,37,115,41,0,0,0,114,101,113,117,105,114,101,0,109,105,110,0,0,0,0,0,37,46,49,52,103,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,115,39,0,0,0,0,0,99,104,117,110,107,32,104,97,115,32,116,111,111,32,109,97,110,121,32,108,105,110,101,115,0,0,0,0,0,0,0,0,95,72,75,69,89,0,0,0,114,97,119,103,101,116,0,0,95,95,109,117,108,0,0,0,61,91,67,93,0,0,0,0,105,110,118,97,108,105,100,32,99,97,112,116,117,114,101,32,105,110,100,101,120,0,0,0,117,110,101,120,112,101,99,116,101,100,32,115,121,109,98,111,108,0,0,0,0,0,0,0,105,115,100,115,116,0,0,0,109,111,100,117,108,101,0,0,109,97,120,0,0,0,0,0,102,105,108,101,32,40,37,112,41,0,0,0,0,0,0,0,99,104,97,114,40,37,100,41,0,0,0,0,0,0,0,0,101,120,105,116,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,108,111,110,103,32,99,111,109,109,101,110,116,0,108,101,118,101,108,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,112,105,0,0,0,0,0,0,114,97,119,108,101,110,0,0,103,101,116,117,115,101,114,118,97,108,117,101,0,0,0,0,95,95,115,117,98,0,0,0,109,101,116,97,109,101,116,104,111,100,0,0,0,0,0,0,116,111,111,32,109,97,110,121,32,99,97,112,116,117,114,101,115,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,97,114,103,117,109,101,110,116,115,32,101,120,112,101,99,116,101,100,0,0,0,0,0,114,101,115,117,109,101,0,0,121,101,97,114,0,0,0,0,112,114,101,108,111,97,100,0,108,111,103,0,0,0,0,0,102,105,108,101,32,40,99,108,111,115,101,100,41,0,0,0,37,115,58,32,37,115,0,0,117,110,102,105,110,105,115,104,101,100,32,108,111,110,103,32,115,116,114,105,110,103,0,0,110,105,108,32,111,114,32,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,0,99,111,110,115,116,114,117,99,116,111,114,32,116,111,111,32,108,111,110,103,0,0,0,0,114,97,119,101,113,117,97,108,0,0,0,0,0,0,0,0].concat([95,95,97,100,100,0,0,0,98,97,110,100,0,0,0,0,102,111,114,32,105,116,101,114,97,116,111,114,0,0,0,0,114,101,115,117,108,116,105,110,103,32,115,116,114,105,110,103,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,116,111,111,32,109,97,110,121,32,37,115,32,40,108,105,109,105,116,32,105,115,32,37,100,41,32,105,110,32,37,115,0,109,111,110,116,104,0,0,0,95,80,82,69,76,79,65,68,0,0,0,0,0,0,0,0,108,111,103,49,48,0,0,0,95,95,116,111,115,116,114,105,110,103,0,0,0,0,0,0,67,32,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,0,0,0,0,0,0,76,117,97,32,53,46,50,0,114,117,110,95,115,116,114,105,110,103,0,0,0,0,0,0,104,101,120,97,100,101,99,105,109,97,108,32,100,105,103,105,116,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,116,114,97,99,101,98,97,99,107,0,0,0,0,0,0,0,112,114,105,110,116,0,0,0,95,95,101,113,0,0,0,0,105,110,100,101,120,0,0,0,117,112,112,101,114,0,0,0,102,117,110,99,116,105,111,110,32,97,116,32,108,105,110,101,32,37,100,0,0,0,0,0,98,105,110,97,114,121,32,115,116,114,105,110,103,0,0,0,100,97,121,0,0,0,0,0,108,111,97,100,101,100,0,0,108,100,101,120,112,0,0,0,95,95,103,99,0,0,0,0,110,105,108,0,0,0,0,0,37,115,58,37,100,58,32,0,99,111,110,99,97,116,0,0,100,101,99,105,109,97,108,32,101,115,99,97,112,101,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,0,0,115,101,116,117,112,118,97,108,117,101,0,0,0,0,0,0,116,114,121,105,110,103,32,116,111,32,97,99,99,101,115,115,32,110,111,110,45,101,120,105,115,116,101,110,116,32,98,105,116,115,0,0,0,0,0,0,116,97,98,108,101,32,105,110,100,101,120,32,105,115,32,78,97,78,0,0,0,0,0,0,112,99,97,108,108,0,0,0,95,95,108,101,110,0,0,0,115,117,98,0,0,0,0,0,63,0,0,0,0,0,0,0,109,97,105,110,32,102,117,110,99,116,105,111,110,0,0,0,104,111,117,114,0,0,0,0,95,76,79,65,68,69,68,0,95,95,105,110,100,101,120,0,102,114,101,120,112,0,0,0,119,114,105,116,101,0,0,0,83,108,0,0,0,0,0,0,105,110,118,97,108,105,100,32,101,115,99,97,112,101,32,115,101,113,117,101,110,99,101,0,115,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,119,105,100,116,104,32,109,117,115,116,32,98,101,32,112,111,115,105,116,105,118,101,0,0,110,111,32,118,105,115,105,98,108,101,32,108,97,98,101,108,32,39,37,115,39,32,102,111,114,32,60,103,111,116,111,62,32,97,116,32,108,105,110,101,32,37,100,0,0,0,0,0,112,97,105,114,115,0,0,0,95,95,109,111,100,101,0,0,105,110,118,97,108,105,100,32,118,97,108,117,101,32,40,37,115,41,32,97,116,32,105,110,100,101,120,32,37,100,32,105,110,32,116,97,98,108,101,32,102,111,114,32,39,99,111,110,99,97,116,39,0,0,0,0,114,101,118,101,114,115,101,0,109,101,116,104,111,100,0,0,105,116,101,109,115,32,105,110,32,97,32,99,111,110,115,116,114,117,99,116,111,114,0,0,109,105,110,0,0,0,0,0,100,97,116,101,0,0,0,0,99,111,110,102,105,103,0,0,102,109,111,100,0,0,0,0,98,97,100,32,97,114,103,117,109,101,110,116,32,35,37,100,32,116,111,32,39,37,115,39,32,40,37,115,41,0,0,0,115,101,116,118,98,117,102,0,97,116,116,101,109,112,116,32,116,111,32,37,115,32,97,32,37,115,32,118,97,108,117,101,0,0,0,0,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,115,116,114,105,110,103,0,0,0,0,0,0,0,115,101,116,108,111,99,97,108,0,0,0,0,0,0,0,0,100,101,97,100,0,0,0,0,120,88,0,0,0,0,0,0,102,105,101,108,100,32,99,97,110,110,111,116,32,98,101,32,110,101,103,97,116,105,118,101,0,0,0,0,0,0,0,0,110,101,120,116,0,0,0,0,95,73,79,95,105,110,112,117,116,0,0,0,0,0,0,0,95,95,103,99,0,0,0,0,119,114,111,110,103,32,110,117,109,98,101,114,32,111,102,32,97,114,103,117,109,101,110,116,115,32,116,111,32,39,105,110,115,101,114,116,39,0,0,0,114,101,112,0,0,0,0,0,99,111,110,115,116,97,110,116,0,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,115,0,0,0,0,0,0,0,115,101,99,0,0,0,0,0,47,10,59,10,63,10,33,10,45,10,0,0,0,0,0,0,102,108,111,111,114,0,0,0,95,95,103,99,0,0,0,0,115,101,101,107,0,0,0,0,109,101,109,111,114,121,32,97,108,108,111,99,97,116,105,111,110,32,101,114,114,111,114,58,32,98,108,111,99,107,32,116,111,111,32,98,105,103,0,0,63,0,0,0,0,0,0,0,108,101,120,105,99,97,108,32,101,108,101,109,101,110,116,32,116,111,111,32,108,111,110,103,0,0,0,0,0,0,0,0,104,117,103,101,0,0,0,0,115,101,116,104,111,111,107,0,110,111,114,109,97,108,0,0,99,97,108,108,0,0,0,0,114,115,104,105,102,116,0,0,108,111,97,100,115,116,114,105,110,103,0,0,0,0,0,0,95,95,110,101,119,105,110,100,101,120,0,0,0,0,0,0,110,0,0,0,0,0,0,0,109,97,116,99,104,0,0,0,117,112,118,97,108,117,101,0,108,111,99,97,108,32,118,97,114,105,97,98,108,101,115,0,117,110,97,98,108,101,32,116,111,32,103,101,110,101,114,97,116,101,32,97,32,117,110,105,113,117,101,32,102,105,108,101,110,97,109,101,0,0,0,0,115,116,100,105,110,0,0,0,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,46,115,111,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,108,111,97,100,97,108,108,46,115,111,59,46,47,63,46,115,111,0,0,0,0,95,80,82,69,76,79,65,68,0,0,0,0,0,0,0,0,101,120,112,0,0,0,0,0,114,101,97,100,0,0,0,0,95,71,0,0,0,0,0,0,106,115,0,0,0,0,0,0,115,116,97,99,107,32,116,114,97,99,101,98,97,99,107,58,0,0,0,0,0,0,0,0,99,97,108,108,105,110,103,32,39,37,115,39,32,111,110,32,98,97,100,32,115,101,108,102,32,40,37,115,41,0,0,0,109,97,108,102,111,114,109,101,100,32,110,117,109,98,101,114,0,0,0,0,0,0,0,0,115,101,116,117,115,101,114,118,97,108,117,101,0,0,0,0,115,117,115,112,101,110,100,101,100,0,0,0,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,100,101,97,100,32,99,111,114,111,117,116,105,110,101,0,0,0,0,114,114,111,116,97,116,101,0,108,111,97,100,0,0,0,0,105,110,99,111,109,112,97,116,105,98,108,101,0,0,0,0,95,95,105,110,100,101,120,0,116,111,111,32,109,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,117,110,112,97,99,107,0,0,0,0,0,0,108,111,119,101,114,0,0,0,102,105,101,108,100,0,0,0,60,110,97,109,101,62,32,111,114,32,39,46,46,46,39,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,0,0,116,109,112,110,97,109,101,0,76,85,65,95,67,80,65,84,72,0,0,0,0,0,0,0,100,101,103,0,0,0,0,0,108,105,110,101,115,0,0,0,109,101,116,104,111,100,0,0,100,101,98,117,103,0,0,0,37,115,10,0,0,0,0,0,69,82,82,79,82,58,32,37,115,10,0,0,0,0,0,0,105,110,112,117,116,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  Module["_strlen"] = _strlen;
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _emscripten_exit_with_live_runtime() {
      Module['noExitRuntime'] = true;
      throw 'SimulateInfiniteLoop';
    }
  var _llvm_va_start=undefined;
  function _llvm_va_end() {}
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }function _freopen(filename, mode, stream) {
      // FILE *freopen(const char *restrict filename, const char *restrict mode, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/freopen.html
      if (!filename) {
        var streamObj = FS.getStream(stream);
        if (!streamObj) {
          ___setErrNo(ERRNO_CODES.EBADF);
          return 0;
        }
        if (_freopen.buffer) _free(_freopen.buffer);
        filename = intArrayFromString(streamObj.path);
        filename = allocate(filename, 'i8', ALLOC_NORMAL);
      }
      _fclose(stream);
      return _fopen(filename, mode);
    }
  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      stream = FS.getStream(stream);
      return Number(stream && stream.error);
    }
  function _strstr(ptr1, ptr2) {
      var check = 0, start;
      do {
        if (!check) {
          start = ptr1;
          check = ptr2;
        }
        var curr1 = HEAP8[((ptr1++)|0)];
        var curr2 = HEAP8[((check++)|0)];
        if (curr2 == 0) return start;
        if (curr2 != curr1) {
          // rewind to one character after start, to find ez in eeez
          ptr1 = start + 1;
          check = 0;
        }
      } while (curr1);
      return 0;
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      stream = FS.getStream(stream);
      return Number(stream && stream.eof);
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }
  function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    } 
  Module["_saveSetjmp"] = _saveSetjmp;
  Module["_testSetjmp"] = _testSetjmp;function _longjmp(env, value) {
      asm['setThrew'](env, value || 1);
      throw 'longjmp';
    }
  function _abort() {
      Module['abort']();
    }
  var _setjmp=undefined;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i64=_memset;
  function _setvbuf(stream, buf, type, size) {
      // int setvbuf(FILE *restrict stream, char *restrict buf, int type, size_t size);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/setvbuf.html
      // TODO: Implement custom buffering.
      return 0;
    }
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStream(stream);
      stream.eof = false;
      return 0;
    }
  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStream(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }
  function _clearerr(stream) {
      // void clearerr(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/clearerr.html
      stream = FS.getStream(stream);
      if (!stream) {
        return;
      }
      stream.eof = false;
      stream.error = false;
    }
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }function _fscanf(stream, format, varargs) {
      // int fscanf(FILE *restrict stream, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        return -1;
      }
      var buffer = [];
      function get() {
        var c = _fgetc(stream);
        buffer.push(c);
        return c;
      };
      function unget() {
        _ungetc(buffer.pop(), stream);
      };
      return __scanString(format, get, unget, varargs);
    }
  function _fgets(s, n, stream) {
      // char *fgets(char *restrict s, int n, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgets.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return 0;
      if (streamObj.error || streamObj.eof) return 0;
      var byte_;
      for (var i = 0; i < n - 1 && byte_ != 10; i++) {
        byte_ = _fgetc(stream);
        if (byte_ == -1) {
          if (streamObj.error || (streamObj.eof && i == 0)) return 0;
          else if (streamObj.eof) break;
        }
        HEAP8[(((s)+(i))|0)]=byte_
      }
      HEAP8[(((s)+(i))|0)]=0
      return s;
    }
  function _tmpnam(s, dir, prefix) {
      // char *tmpnam(char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpnam.html
      // NOTE: The dir and prefix arguments are for internal use only.
      var folder = FS.findObject(dir || '/tmp');
      if (!folder || !folder.isFolder) {
        dir = '/tmp';
        folder = FS.findObject(dir);
        if (!folder || !folder.isFolder) return 0;
      }
      var name = prefix || 'file';
      do {
        name += String.fromCharCode(65 + Math.floor(Math.random() * 25));
      } while (name in folder.contents);
      var result = dir + '/' + name;
      if (!_tmpnam.buffer) _tmpnam.buffer = _malloc(256);
      if (!s) s = _tmpnam.buffer;
      writeAsciiToMemory(result, s);
      return s;
    }function _tmpfile() {
      // FILE *tmpfile(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpfile.html
      // TODO: Delete the created file on closing.
      if (_tmpfile.mode) {
        _tmpfile.mode = allocate(intArrayFromString('w+'), 'i8', ALLOC_NORMAL);
      }
      return _fopen(_tmpnam(0), _tmpfile.mode);
    }
  function _memchr(ptr, chr, num) {
      chr = unSign(chr);
      for (var i = 0; i < num; i++) {
        if (HEAP8[(ptr)] == chr) return ptr;
        ptr++;
      }
      return 0;
    }
  var _tan=Math_tan;
  function _sinh(x) {
      var p = Math.pow(Math.E, x);
      return (p - (1 / p)) / 2;
    }
  function _cosh(x) {
      var p = Math.pow(Math.E, x);
      return (p + (1 / p)) / 2;
    }function _tanh(x) {
      return _sinh(x) / _cosh(x);
    }
  var _sqrt=Math_sqrt;
  var _sin=Math_sin;
  function _srand(seed) {}
  function _rand() {
      return Math.floor(Math.random()*0x80000000);
    }
  var _floor=Math_floor;
  var _llvm_pow_f64=Math_pow;
  function _modf(x, intpart) {
      HEAPF64[((intpart)>>3)]=Math.floor(x)
      return x - HEAPF64[((intpart)>>3)];
    }
  var _log=Math_log;
  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }
  function _ldexp(x, exp_) {
      return x * Math.pow(2, exp_);
    }
  function _frexp(x, exp_addr) {
      var sig = 0, exp_ = 0;
      if (x !== 0) {
        var sign = 1;
        if (x < 0) {
          x = -x;
          sign = -1;
        }
        var raw_exp = Math.log(x)/Math.log(2);
        exp_ = Math.ceil(raw_exp);
        if (exp_ === raw_exp) exp_ += 1;
        sig = sign*x/Math.pow(2, exp_);
      }
      HEAP32[((exp_addr)>>2)]=exp_
      return sig;
    }
  function _fmod(x, y) {
      return x % y;
    }
  var _exp=Math_exp;
  var _cos=Math_cos;
  var _ceil=Math_ceil;
  var _atan=Math_atan;
  var _atan2=Math_atan2;
  var _asin=Math_asin;
  var _acos=Math_acos;
  var _fabs=Math_abs;
  function _strrchr(ptr, chr) {
      var ptr2 = ptr + _strlen(ptr);
      do {
        if (HEAP8[(ptr2)] == chr) return ptr2;
        ptr2--;
      } while (ptr2 >= ptr);
      return 0;
    }
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }
  function _strpbrk(ptr1, ptr2) {
      var curr;
      var searchSet = {};
      while (1) {
        var curr = HEAP8[((ptr2++)|0)];
        if (!curr) break;
        searchSet[curr] = 1;
      }
      while (1) {
        curr = HEAP8[(ptr1)];
        if (!curr) break;
        if (curr in searchSet) return ptr1;
        ptr1++;
      }
      return 0;
    }
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  var _tzname=allocate(8, "i32*", ALLOC_STATIC);
  var _daylight=allocate(1, "i32*", ALLOC_STATIC);
  var _timezone=allocate(1, "i32*", ALLOC_STATIC);function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
      HEAP32[((_timezone)>>2)]=-(new Date()).getTimezoneOffset() * 60
      var winter = new Date(2000, 0, 1);
      var summer = new Date(2000, 6, 1);
      HEAP32[((_daylight)>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset())
      var winterName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | winter.toString().match(/\(([A-Z]+)\)/)[1];
      var summerName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | summer.toString().match(/\(([A-Z]+)\)/)[1];
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      HEAP32[((_tzname)>>2)]=winterNamePtr
      HEAP32[(((_tzname)+(4))>>2)]=summerNamePtr
    }function _mktime(tmPtr) {
      _tzset();
      var year = HEAP32[(((tmPtr)+(20))>>2)];
      var timestamp = new Date(year >= 1900 ? year : year + 1900,
                               HEAP32[(((tmPtr)+(16))>>2)],
                               HEAP32[(((tmPtr)+(12))>>2)],
                               HEAP32[(((tmPtr)+(8))>>2)],
                               HEAP32[(((tmPtr)+(4))>>2)],
                               HEAP32[((tmPtr)>>2)],
                               0).getTime() / 1000;
      HEAP32[(((tmPtr)+(24))>>2)]=new Date(timestamp).getDay()
      var yday = Math.round((timestamp - (new Date(year, 0, 1)).getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday
      return timestamp;
    }
  function _setlocale(category, locale) {
      if (!_setlocale.ret) _setlocale.ret = allocate([0], 'i8', ALLOC_NORMAL);
      return _setlocale.ret;
    }
  function _rename(old_path, new_path) {
      // int rename(const char *old, const char *new);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rename.html
      old_path = Pointer_stringify(old_path);
      new_path = Pointer_stringify(new_path);
      try {
        FS.rename(old_path, new_path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = Pointer_stringify(path);
      try {
        FS.unlink(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _rmdir(path) {
      // int rmdir(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rmdir.html
      path = Pointer_stringify(path);
      try {
        FS.rmdir(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _remove(path) {
      // int remove(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/remove.html
      var ret = _unlink(path);
      if (ret == -1) ret = _rmdir(path);
      return ret;
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }
  function _system(command) {
      // int system(const char *command);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/system.html
      // Can't call external programs.
      ___setErrNo(ERRNO_CODES.EAGAIN);
      return -1;
    }
  function _difftime(time1, time0) {
      return time1 - time0;
    }
  var ___tm_current=allocate(44, "i8", ALLOC_STATIC);
  var ___tm_timezone=allocate(intArrayFromString("GMT"), "i8", ALLOC_STATIC);function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getUTCSeconds()
      HEAP32[(((tmPtr)+(4))>>2)]=date.getUTCMinutes()
      HEAP32[(((tmPtr)+(8))>>2)]=date.getUTCHours()
      HEAP32[(((tmPtr)+(12))>>2)]=date.getUTCDate()
      HEAP32[(((tmPtr)+(16))>>2)]=date.getUTCMonth()
      HEAP32[(((tmPtr)+(20))>>2)]=date.getUTCFullYear()-1900
      HEAP32[(((tmPtr)+(24))>>2)]=date.getUTCDay()
      HEAP32[(((tmPtr)+(36))>>2)]=0
      HEAP32[(((tmPtr)+(32))>>2)]=0
      var start = new Date(date); // define date using UTC, start from Jan 01 00:00:00 UTC
      start.setUTCDate(1);
      start.setUTCMonth(0);
      start.setUTCHours(0);
      start.setUTCMinutes(0);
      start.setUTCSeconds(0);
      start.setUTCMilliseconds(0);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone
      return tmPtr;
    }function _gmtime(time) {
      return _gmtime_r(time, ___tm_current);
    }
  function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getSeconds()
      HEAP32[(((tmPtr)+(4))>>2)]=date.getMinutes()
      HEAP32[(((tmPtr)+(8))>>2)]=date.getHours()
      HEAP32[(((tmPtr)+(12))>>2)]=date.getDate()
      HEAP32[(((tmPtr)+(16))>>2)]=date.getMonth()
      HEAP32[(((tmPtr)+(20))>>2)]=date.getFullYear()-1900
      HEAP32[(((tmPtr)+(24))>>2)]=date.getDay()
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday
      HEAP32[(((tmPtr)+(36))>>2)]=start.getTimezoneOffset() * 60
      var dst = Number(start.getTimezoneOffset() != date.getTimezoneOffset());
      HEAP32[(((tmPtr)+(32))>>2)]=dst
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone
      return tmPtr;
    }function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
      var pattern = Pointer_stringify(format);
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }
  function _clock() {
      if (_clock.start === undefined) _clock.start = Date.now();
      return Math.floor((Date.now() - _clock.start) * (1000000/1000));
    }
  var _llvm_memset_p0i8_i32=_memset;
  Module["_memcmp"] = _memcmp;
  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }
  Module["_tolower"] = _tolower;
  function _isalpha(chr) {
      return (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }
  function _iscntrl(chr) {
      return (0 <= chr && chr <= 0x1F) || chr === 0x7F;
    }
  function _isgraph(chr) {
      return 0x20 < chr && chr < 0x7F;
    }
  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }
  function _ispunct(chr) {
      return (chr >= 33 && chr <= 47) ||
             (chr >= 58 && chr <= 64) ||
             (chr >= 91 && chr <= 96) ||
             (chr >= 123 && chr <= 126);
    }
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function _isupper(chr) {
      return chr >= 65 && chr <= 90;
    }
  function _isalnum(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }
  function _llvm_uadd_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return ((asm["setTempRet0"](x+y > 4294967295),(x+y)>>>0)|0);
    }
  var _strcoll=_strcmp;
  function _emscripten_run_script_string(ptr) {
      var s = eval(Pointer_stringify(ptr)) + '';
      var me = _emscripten_run_script_string;
      if (!me.bufferSize || me.bufferSize < s.length+1) {
        if (me.bufferSize) _free(me.buffer);
        me.bufferSize = s.length+1;
        me.buffer = _malloc(me.bufferSize);
      }
      writeStringToMemory(s, me.buffer);
      return me.buffer;
    }
  function _emscripten_run_script_int(ptr) {
      return eval(Pointer_stringify(ptr))|0;
    }
  function _strspn(pstr, pset) {
      var str = pstr, set, strcurr, setcurr;
      while (1) {
        strcurr = HEAP8[(str)];
        if (!strcurr) return str - pstr;
        set = pset;
        while (1) {
          setcurr = HEAP8[(set)];
          if (!setcurr || setcurr == strcurr) break;
          set++;
        }
        if (!setcurr) return str - pstr;
        str++;
      }
    }
  function _localeconv() {
      // %struct.timeval = type { char* decimal point, other stuff... }
      // var indexes = Runtime.calculateStructAlignment({ fields: ['i32', 'i32'] });
      var me = _localeconv;
      if (!me.ret) {
        me.ret = allocate([allocate(intArrayFromString('.'), 'i8', ALLOC_NORMAL)], 'i8*', ALLOC_NORMAL); // just decimal point, for now
      }
      return me.ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            ctx = canvas.getContext('experimental-webgl', contextAttributes);
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
___buildEnvironment(ENV);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env._stdin|0;var n=env._stderr|0;var o=env._stdout|0;var p=+env.NaN;var q=+env.Infinity;var r=0;var s=0;var t=0;var u=0;var v=0,w=0,x=0,y=0,z=0.0,A=0,B=0,C=0,D=0.0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=global.Math.floor;var P=global.Math.abs;var Q=global.Math.sqrt;var R=global.Math.pow;var S=global.Math.cos;var T=global.Math.sin;var U=global.Math.tan;var V=global.Math.acos;var W=global.Math.asin;var X=global.Math.atan;var Y=global.Math.atan2;var Z=global.Math.exp;var _=global.Math.log;var $=global.Math.ceil;var aa=global.Math.imul;var ab=env.abort;var ac=env.assert;var ad=env.asmPrintInt;var ae=env.asmPrintFloat;var af=env.min;var ag=env.invoke_ii;var ah=env.invoke_vi;var ai=env.invoke_vii;var aj=env.invoke_iiiii;var ak=env.invoke_iiii;var al=env.invoke_v;var am=env.invoke_iii;var an=env._llvm_lifetime_end;var ao=env._lseek;var ap=env._rand;var aq=env.__scanString;var ar=env._fclose;var as=env._freopen;var at=env._emscripten_run_script_string;var au=env._fflush;var av=env._fputc;var aw=env._fwrite;var ax=env._send;var ay=env._mktime;var az=env._tmpnam;var aA=env._isspace;var aB=env._localtime;var aC=env._read;var aD=env._ceil;var aE=env._strstr;var aF=env._fsync;var aG=env._fscanf;var aH=env._remove;var aI=env._modf;var aJ=env._strcmp;var aK=env._memchr;var aL=env._llvm_va_end;var aM=env._tmpfile;var aN=env._snprintf;var aO=env._fgetc;var aP=env._cosh;var aQ=env.__getFloat;var aR=env._fgets;var aS=env._close;var aT=env._strchr;var aU=env._asin;var aV=env._clock;var aW=env.___setErrNo;var aX=env._emscripten_exit_with_live_runtime;var aY=env._isxdigit;var aZ=env._ftell;var a_=env._exit;var a$=env._sprintf;var a0=env._strrchr;var a1=env._fmod;var a2=env.__isLeapYear;var a3=env._ferror;var a4=env._llvm_uadd_with_overflow_i32;var a5=env._gmtime;var a6=env._localtime_r;var a7=env._sinh;var a8=env._recv;var a9=env._cos;var ba=env._putchar;var bb=env._islower;var bc=env._acos;var bd=env._isupper;var be=env._strftime;var bf=env._strncmp;var bg=env._tzset;var bh=env._setlocale;var bi=env._ldexp;var bj=env._toupper;var bk=env._printf;var bl=env._pread;var bm=env._fopen;var bn=env._open;var bo=env._frexp;var bp=env.__arraySum;var bq=env._log;var br=env._isalnum;var bs=env._system;var bt=env._isalpha;var bu=env._rmdir;var bv=env._log10;var bw=env._srand;var bx=env.__formatString;var by=env._getenv;var bz=env._llvm_pow_f64;var bA=env._sbrk;var bB=env._tanh;var bC=env._localeconv;var bD=env.___errno_location;var bE=env._strerror;var bF=env._llvm_lifetime_start;var bG=env._strspn;var bH=env._ungetc;var bI=env._rename;var bJ=env._sysconf;var bK=env._fread;var bL=env._abort;var bM=env._fprintf;var bN=env._tan;var bO=env.___buildEnvironment;var bP=env._feof;var bQ=env.__addDays;var bR=env._gmtime_r;var bS=env._ispunct;var bT=env._clearerr;var bU=env._fabs;var bV=env._floor;var bW=env.__reallyNegative;var bX=env._fseek;var bY=env._sqrt;var bZ=env._write;var b_=env._sin;var b$=env._longjmp;var b0=env._atan;var b1=env._strpbrk;var b2=env._isgraph;var b3=env._unlink;var b4=env.__exit;var b5=env._pwrite;var b6=env._strerror_r;var b7=env._emscripten_run_script_int;var b8=env._difftime;var b9=env._iscntrl;var ca=env._atan2;var cb=env._exp;var cc=env._time;var cd=env._setvbuf;var ce=0.0;
// EMSCRIPTEN_START_FUNCS
function cm(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function cn(){return i|0}function co(a){a=a|0;i=a}function cp(a,b){a=a|0;b=b|0;if((r|0)==0){r=a;s=b}}function cq(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function cr(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function cs(a){a=a|0;E=a}function ct(a){a=a|0;F=a}function cu(a){a=a|0;G=a}function cv(a){a=a|0;H=a}function cw(a){a=a|0;I=a}function cx(a){a=a|0;J=a}function cy(a){a=a|0;K=a}function cz(a){a=a|0;L=a}function cA(a){a=a|0;M=a}function cB(a){a=a|0;N=a}function cC(){}function cD(a){a=a|0;var b=0,d=0;b=i;d=c[3162]|0;ek(d,a,kU(a|0)|0,12104,0)|0;if((dA(c[3162]|0,0,0,0,0,0)|0)==0){i=b;return}a=c1(c[3162]|0,-1,0)|0;bk(12088,(d=i,i=i+8|0,c[d>>2]=a,d)|0)|0;i=d;i=b;return}function cE(a,b){a=a|0;b=b|0;b=ex()|0;c[3162]=b;dF(b,0,0)|0;fC(c[3162]|0);dF(c[3162]|0,1,0)|0;aX();return 0}function cF(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+8|0;e=d|0;c[e>>2]=b;f=c[a+16>>2]|0;g=a+8|0;h=c[g>>2]|0;j=h;do{if(((c[a+24>>2]|0)-j>>4|0)>(b|0)){k=1;l=h;m=b}else{if(((j-(c[a+28>>2]|0)>>4)+5|0)>(1e6-b|0)){n=0;i=d;return n|0}o=(eS(a,14,e)|0)==0;if(o){k=o&1;l=c[g>>2]|0;m=c[e>>2]|0;break}else{n=0;i=d;return n|0}}}while(0);e=f+4|0;f=l+(m<<4)|0;if((c[e>>2]|0)>>>0>=f>>>0){n=k;i=d;return n|0}c[e>>2]=f;n=k;i=d;return n|0}function cG(a,b){a=a|0;b=b|0;eU(a,c[b>>2]|0);return}function cH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;if((a|0)==(b|0)){return}e=a+8|0;a=(c[e>>2]|0)+(-d<<4)|0;c[e>>2]=a;if((d|0)<=0){return}f=b+8|0;b=0;g=a;while(1){a=c[f>>2]|0;c[f>>2]=a+16;h=g+(b<<4)|0;i=a;j=c[h+4>>2]|0;c[i>>2]=c[h>>2];c[i+4>>2]=j;c[a+8>>2]=c[g+(b<<4)+8>>2];a=b+1|0;if((a|0)>=(d|0)){break}b=a;g=c[e>>2]|0}return}function cI(a,b){a=a|0;b=b|0;var d=0;d=(c[a+12>>2]|0)+168|0;a=c[d>>2]|0;c[d>>2]=b;return a|0}function cJ(a){a=a|0;var b=0;if((a|0)==0){b=992;return b|0}b=c[(c[a+12>>2]|0)+176>>2]|0;return b|0}function cK(a,b){a=a|0;b=b|0;var d=0;if((b+1000999|0)>>>0>1000999){d=b;return d|0}d=((c[a+8>>2]|0)-(c[c[a+16>>2]>>2]|0)>>4)+b|0;return d|0}function cL(a){a=a|0;return(c[a+8>>2]|0)-((c[c[a+16>>2]>>2]|0)+16)>>4|0}function cM(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;if((b|0)<=-1){d=a+8|0;c[d>>2]=(c[d>>2]|0)+(b+1<<4);return}d=a+8|0;e=c[d>>2]|0;f=(c[c[a+16>>2]>>2]|0)+(b+1<<4)|0;if(e>>>0<f>>>0){b=e;do{c[d>>2]=b+16;c[b+8>>2]=0;b=c[d>>2]|0;}while(b>>>0<f>>>0)}c[d>>2]=f;return}function cN(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=g+16|0;b=a+8|0;a=c[b>>2]|0;if(e>>>0<a>>>0){j=g;k=e}else{l=a;m=l-16|0;c[b>>2]=m;return}while(1){a=k;e=j;g=c[a+4>>2]|0;c[e>>2]=c[a>>2];c[e+4>>2]=g;c[j+8>>2]=c[j+24>>2];g=k+16|0;e=c[b>>2]|0;if(g>>>0<e>>>0){j=k;k=g}else{l=e;break}}m=l-16|0;c[b>>2]=m;return}function cO(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;a=c[e>>2]|0;if(a>>>0>g>>>0){b=a;while(1){f=b-16|0;i=f;h=b;j=c[i+4>>2]|0;c[h>>2]=c[i>>2];c[h+4>>2]=j;c[b+8>>2]=c[b-16+8>>2];if(f>>>0>g>>>0){b=f}else{break}}k=c[e>>2]|0}else{k=a}a=k;e=g;b=c[a+4>>2]|0;c[e>>2]=c[a>>2];c[e+4>>2]=b;c[g+8>>2]=c[k+8>>2];return}function cP(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b+8|0;g=c[f>>2]|0;h=g-16|0;i=b+16|0;j=c[i>>2]|0;do{if((e|0)>0){k=(c[j>>2]|0)+(e<<4)|0;l=k>>>0<g>>>0?k:1296}else{if((e|0)>=-1000999){l=g+(e<<4)|0;break}if((e|0)==-1001e3){l=(c[b+12>>2]|0)+40|0;break}k=-1001e3-e|0;m=c[j>>2]|0;if((c[m+8>>2]|0)==22){l=1296;break}n=c[m>>2]|0;if((k|0)>(d[n+6|0]|0|0)){l=1296;break}l=n+16+(k-1<<4)|0}}while(0);j=h;k=l;n=c[j+4>>2]|0;c[k>>2]=c[j>>2];c[k+4>>2]=n;n=g-16+8|0;c[l+8>>2]=c[n>>2];do{if((e|0)<-1001e3){if((c[n>>2]&64|0)==0){break}l=c[h>>2]|0;if((a[l+5|0]&3)==0){break}g=c[c[c[i>>2]>>2]>>2]|0;if((a[g+5|0]&4)==0){break}fh(b,g,l)}}while(0);c[f>>2]=(c[f>>2]|0)-16;return}function cQ(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=b+16|0;h=c[g>>2]|0;do{if((e|0)>0){i=(c[h>>2]|0)+(e<<4)|0;j=i>>>0<(c[b+8>>2]|0)>>>0?i:1296}else{if((e|0)>=-1000999){j=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){j=(c[b+12>>2]|0)+40|0;break}i=-1001e3-e|0;k=c[h>>2]|0;if((c[k+8>>2]|0)==22){j=1296;break}l=c[k>>2]|0;if((i|0)>(d[l+6|0]|0|0)){j=1296;break}j=l+16+(i-1<<4)|0}}while(0);do{if((f|0)>0){e=(c[h>>2]|0)+(f<<4)|0;m=e>>>0<(c[b+8>>2]|0)>>>0?e:1296}else{if((f|0)>=-1000999){m=(c[b+8>>2]|0)+(f<<4)|0;break}if((f|0)==-1001e3){m=(c[b+12>>2]|0)+40|0;break}e=-1001e3-f|0;i=c[h>>2]|0;if((c[i+8>>2]|0)==22){m=1296;break}l=c[i>>2]|0;if((e|0)>(d[l+6|0]|0|0)){m=1296;break}m=l+16+(e-1<<4)|0}}while(0);h=j;e=m;l=c[h+4>>2]|0;c[e>>2]=c[h>>2];c[e+4>>2]=l;l=j+8|0;c[m+8>>2]=c[l>>2];if((f|0)>=-1001e3){return}if((c[l>>2]&64|0)==0){return}l=c[j>>2]|0;if((a[l+5|0]&3)==0){return}j=c[c[c[g>>2]>>2]>>2]|0;if((a[j+5|0]&4)==0){return}fh(b,j,l);return}function cR(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;a=c[e>>2]|0;b=g;f=a;i=c[b+4>>2]|0;c[f>>2]=c[b>>2];c[f+4>>2]=i;c[a+8>>2]=c[g+8>>2];c[e>>2]=(c[e>>2]|0)+16;return}function cS(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){i=-1;return i|0}j=c[h>>2]|0;if((f|0)>(d[j+6|0]|0|0)){i=-1;return i|0}else{g=j+16+(f-1<<4)|0;break}}}while(0);if((g|0)==1296){i=-1;return i|0}i=c[g+8>>2]&15;return i|0}function cT(a,b){a=a|0;b=b|0;return c[1136+(b+1<<2)>>2]|0}function cU(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]|0;if((e|0)==22){j=1;return j|0}j=(e|0)==102|0;return j|0}function cV(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+16|0;f=e|0;g=c[a+16>>2]|0;do{if((b|0)>0){h=(c[g>>2]|0)+(b<<4)|0;j=h>>>0<(c[a+8>>2]|0)>>>0?h:1296}else{if((b|0)>=-1000999){j=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){j=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)==22){j=1296;break}l=c[k>>2]|0;if((h|0)>(d[l+6|0]|0|0)){j=1296;break}j=l+16+(h-1<<4)|0}}while(0);if((c[j+8>>2]|0)==3){m=1;i=e;return m|0}m=(iA(j,f)|0)!=0|0;i=e;return m|0}function cW(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296;h=183}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;h=183;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;h=183;break}f=-1001e3-b|0;i=c[e>>2]|0;if((c[i+8>>2]|0)==22){j=-1;break}k=c[i>>2]|0;if((f|0)>(d[k+6|0]|0|0)){j=-1;break}g=k+16+(f-1<<4)|0;h=183}}while(0);do{if((h|0)==183){if((g|0)==1296){j=-1;break}e=c[g+8>>2]&15;if((e|0)==4){l=1}else{j=e;break}return l|0}}while(0);l=(j|0)==3|0;return l|0}function cX(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1296}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1296;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1296;break}h=j+16+(g-1<<4)|0}}while(0);do{if((e|0)>0){b=(c[f>>2]|0)+(e<<4)|0;k=b>>>0<(c[a+8>>2]|0)>>>0?b:1296}else{if((e|0)>=-1000999){k=(c[a+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){k=(c[a+12>>2]|0)+40|0;break}b=-1001e3-e|0;g=c[f>>2]|0;if((c[g+8>>2]|0)==22){l=0;return l|0}j=c[g>>2]|0;if((b|0)>(d[j+6|0]|0|0)){l=0;return l|0}else{k=j+16+(b-1<<4)|0;break}}}while(0);if((h|0)==1296|(k|0)==1296){l=0;return l|0}if((c[h+8>>2]|0)!=(c[k+8>>2]|0)){l=0;return l|0}l=(iG(0,h,k)|0)!=0|0;return l|0}function cY(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[a+16>>2]|0;do{if((b|0)>0){h=(c[g>>2]|0)+(b<<4)|0;i=h>>>0<(c[a+8>>2]|0)>>>0?h:1296}else{if((b|0)>=-1000999){i=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){i=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[g>>2]|0;if((c[j+8>>2]|0)==22){i=1296;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1296;break}i=k+16+(h-1<<4)|0}}while(0);do{if((e|0)>0){b=(c[g>>2]|0)+(e<<4)|0;l=b>>>0<(c[a+8>>2]|0)>>>0?b:1296}else{if((e|0)>=-1000999){l=(c[a+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}b=-1001e3-e|0;h=c[g>>2]|0;if((c[h+8>>2]|0)==22){m=0;return m|0}k=c[h>>2]|0;if((b|0)>(d[k+6|0]|0|0)){m=0;return m|0}else{l=k+16+(b-1<<4)|0;break}}}while(0);if((i|0)==1296|(l|0)==1296){m=0;return m|0}if((f|0)==1){m=iE(a,i,l)|0;return m|0}else if((f|0)==2){m=iF(a,i,l)|0;return m|0}else if((f|0)==0){if((c[i+8>>2]|0)!=(c[l+8>>2]|0)){m=0;return m|0}m=(iG(a,i,l)|0)!=0|0;return m|0}else{m=0;return m|0}return 0}function cZ(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0.0;f=i;i=i+16|0;g=f|0;j=c[a+16>>2]|0;do{if((b|0)>0){k=(c[j>>2]|0)+(b<<4)|0;l=k>>>0<(c[a+8>>2]|0)>>>0?k:1296}else{if((b|0)>=-1000999){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}k=-1001e3-b|0;m=c[j>>2]|0;if((c[m+8>>2]|0)==22){l=1296;break}n=c[m>>2]|0;if((k|0)>(d[n+6|0]|0|0)){l=1296;break}l=n+16+(k-1<<4)|0}}while(0);do{if((c[l+8>>2]|0)==3){o=l}else{j=iA(l,g)|0;if((j|0)!=0){o=j;break}if((e|0)==0){p=0.0;i=f;return+p}c[e>>2]=0;p=0.0;i=f;return+p}}while(0);if((e|0)!=0){c[e>>2]=1}p=+h[o>>3];i=f;return+p}function c_(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+16|0;g=f|0;j=c[a+16>>2]|0;do{if((b|0)>0){k=(c[j>>2]|0)+(b<<4)|0;l=k>>>0<(c[a+8>>2]|0)>>>0?k:1296}else{if((b|0)>=-1000999){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}k=-1001e3-b|0;m=c[j>>2]|0;if((c[m+8>>2]|0)==22){l=1296;break}n=c[m>>2]|0;if((k|0)>(d[n+6|0]|0|0)){l=1296;break}l=n+16+(k-1<<4)|0}}while(0);do{if((c[l+8>>2]|0)==3){o=l}else{j=iA(l,g)|0;if((j|0)!=0){o=j;break}if((e|0)==0){p=0;i=f;return p|0}c[e>>2]=0;p=0;i=f;return p|0}}while(0);g=~~+h[o>>3];if((e|0)==0){p=g;i=f;return p|0}c[e>>2]=1;p=g;i=f;return p|0}function c$(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+24|0;g=f|0;j=f+16|0;k=c[a+16>>2]|0;do{if((b|0)>0){l=(c[k>>2]|0)+(b<<4)|0;m=l>>>0<(c[a+8>>2]|0)>>>0?l:1296}else{if((b|0)>=-1000999){m=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){m=(c[a+12>>2]|0)+40|0;break}l=-1001e3-b|0;n=c[k>>2]|0;if((c[n+8>>2]|0)==22){m=1296;break}o=c[n>>2]|0;if((l|0)>(d[o+6|0]|0|0)){m=1296;break}m=o+16+(l-1<<4)|0}}while(0);do{if((c[m+8>>2]|0)==3){p=m}else{k=iA(m,g)|0;if((k|0)!=0){p=k;break}if((e|0)==0){q=0;i=f;return q|0}c[e>>2]=0;q=0;i=f;return q|0}}while(0);h[j>>3]=+h[p>>3]+6755399441055744.0;p=c[j>>2]|0;if((e|0)==0){q=p;i=f;return q|0}c[e>>2]=1;q=p;i=f;return q|0}function c0(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]|0;if((e|0)==0){j=0;return j|0}if((e|0)!=1){j=1;return j|0}j=(c[g>>2]|0)!=0|0;return j|0}function c1(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=a+16|0;g=c[f>>2]|0;h=(b|0)>0;do{if(h){i=(c[g>>2]|0)+(b<<4)|0;j=i>>>0<(c[a+8>>2]|0)>>>0?i:1296}else{if((b|0)>=-1000999){j=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){j=(c[a+12>>2]|0)+40|0;break}i=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)==22){j=1296;break}l=c[k>>2]|0;if((i|0)>(d[l+6|0]|0|0)){j=1296;break}j=l+16+(i-1<<4)|0}}while(0);do{if((c[j+8>>2]&15|0)==4){m=j}else{if((iB(a,j)|0)==0){if((e|0)==0){n=0;return n|0}c[e>>2]=0;n=0;return n|0}g=a+12|0;if((c[(c[g>>2]|0)+12>>2]|0)>0){fv(a)}i=c[f>>2]|0;if(h){l=(c[i>>2]|0)+(b<<4)|0;m=l>>>0<(c[a+8>>2]|0)>>>0?l:1296;break}if((b|0)>=-1000999){m=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){m=(c[g>>2]|0)+40|0;break}g=-1001e3-b|0;l=c[i>>2]|0;if((c[l+8>>2]|0)==22){m=1296;break}i=c[l>>2]|0;if((g|0)>(d[i+6|0]|0|0)){m=1296;break}m=i+16+(g-1<<4)|0}}while(0);b=m;if((e|0)!=0){c[e>>2]=c[(c[b>>2]|0)+12>>2]}n=(c[b>>2]|0)+16|0;return n|0}function c2(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]&15;if((e|0)==4){j=c[(c[g>>2]|0)+12>>2]|0;return j|0}else if((e|0)==7){j=c[(c[g>>2]|0)+16>>2]|0;return j|0}else if((e|0)==5){j=ih(c[g>>2]|0)|0;return j|0}else{j=0;return j|0}return 0}function c3(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]&15;if((e|0)==7){j=(c[g>>2]|0)+24|0;return j|0}else if((e|0)==2){j=c[g>>2]|0;return j|0}else{j=0;return j|0}return 0}function c4(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);if((c[g+8>>2]|0)!=72){j=0;return j|0}j=c[g>>2]|0;return j|0}function c5(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=c[a+16>>2]|0;f=(b|0)>0;do{if(f){g=(c[e>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1296}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[e>>2]|0;if((c[i+8>>2]|0)==22){h=1296;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1296;break}h=j+16+(g-1<<4)|0}}while(0);switch(c[h+8>>2]&63|0){case 5:{k=c[h>>2]|0;return k|0};case 6:{k=c[h>>2]|0;return k|0};case 38:{k=c[h>>2]|0;return k|0};case 22:{k=c[h>>2]|0;return k|0};case 8:{k=c[h>>2]|0;return k|0};case 7:case 2:{do{if(f){h=(c[e>>2]|0)+(b<<4)|0;l=h>>>0<(c[a+8>>2]|0)>>>0?h:1296}else{if((b|0)>=-1000999){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;g=c[e>>2]|0;if((c[g+8>>2]|0)==22){l=1296;break}j=c[g>>2]|0;if((h|0)>(d[j+6|0]|0|0)){l=1296;break}l=j+16+(h-1<<4)|0}}while(0);e=c[l+8>>2]&15;if((e|0)==7){k=(c[l>>2]|0)+24|0;return k|0}else if((e|0)==2){k=c[l>>2]|0;return k|0}else{k=0;return k|0}break};default:{k=0;return k|0}}return 0}function c6(a){a=a|0;var b=0;b=a+8|0;c[(c[b>>2]|0)+8>>2]=0;c[b>>2]=(c[b>>2]|0)+16;return}function c7(a,b){a=a|0;b=+b;var d=0;d=a+8|0;a=c[d>>2]|0;h[a>>3]=b;c[a+8>>2]=3;c[d>>2]=(c[d>>2]|0)+16;return}function c8(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;h[a>>3]=+(b|0);c[a+8>>2]=3;c[d>>2]=(c[d>>2]|0)+16;return}function c9(a,b){a=a|0;b=b|0;var d=0.0;if((b|0)>-1){d=+(b|0)}else{d=+(b>>>0>>>0)}b=a+8|0;a=c[b>>2]|0;h[a>>3]=d;c[a+8>>2]=3;c[b>>2]=(c[b>>2]|0)+16;return}function da(a,b,e){a=a|0;b=b|0;e=e|0;var f=0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){fv(a)}f=hH(a,b,e)|0;e=a+8|0;a=c[e>>2]|0;c[a>>2]=f;c[a+8>>2]=d[f+4|0]|0|64;c[e>>2]=(c[e>>2]|0)+16;return f+16|0}function db(a,b){a=a|0;b=b|0;var e=0,f=0;if((b|0)==0){e=a+8|0;c[(c[e>>2]|0)+8>>2]=0;c[e>>2]=(c[e>>2]|0)+16;f=0;return f|0}if((c[(c[a+12>>2]|0)+12>>2]|0)>0){fv(a)}e=hI(a,b)|0;b=a+8|0;a=c[b>>2]|0;c[a>>2]=e;c[a+8>>2]=d[e+4|0]|0|64;c[b>>2]=(c[b>>2]|0)+16;f=e+16|0;return f|0}function dc(a,b,d){a=a|0;b=b|0;d=d|0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){fv(a)}return gV(a,b,d)|0}function dd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){fv(a)}g=f;c[g>>2]=d;c[g+4>>2]=0;g=gV(a,b,f|0)|0;i=e;return g|0}function de(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((d|0)==0){e=c[a+8>>2]|0;c[e>>2]=b;c[e+8>>2]=22;f=a+8|0;g=c[f>>2]|0;h=g+16|0;c[f>>2]=h;return}if((c[(c[a+12>>2]|0)+12>>2]|0)>0){fv(a)}e=e8(a,d)|0;c[e+12>>2]=b;b=a+8|0;i=(c[b>>2]|0)+(-d<<4)|0;c[b>>2]=i;j=d;d=i;do{j=j-1|0;i=d+(j<<4)|0;k=e+16+(j<<4)|0;l=c[i+4>>2]|0;c[k>>2]=c[i>>2];c[k+4>>2]=l;c[e+16+(j<<4)+8>>2]=c[d+(j<<4)+8>>2];d=c[b>>2]|0}while((j|0)!=0);c[d>>2]=e;c[d+8>>2]=102;f=a+8|0;g=c[f>>2]|0;h=g+16|0;c[f>>2]=h;return}function df(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;c[a>>2]=(b|0)!=0;c[a+8>>2]=1;c[d>>2]=(c[d>>2]|0)+16;return}function dg(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;c[a>>2]=b;c[a+8>>2]=2;c[d>>2]=(c[d>>2]|0)+16;return}function dh(a){a=a|0;var b=0,d=0;b=a+8|0;d=c[b>>2]|0;c[d>>2]=a;c[d+8>>2]=72;c[b>>2]=(c[b>>2]|0)+16;return(c[(c[a+12>>2]|0)+172>>2]|0)==(a|0)|0}function di(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=id(c[(c[a+12>>2]|0)+40>>2]|0,2)|0;f=a+8|0;g=c[f>>2]|0;c[f>>2]=g+16;h=hI(a,b)|0;c[g>>2]=h;c[g+8>>2]=d[h+4|0]|0|64;h=(c[f>>2]|0)-16|0;iC(a,e,h,h);return}function dj(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=(c[a+8>>2]|0)-16|0;iC(a,g,e,e);return}function dk(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1296}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1296;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1296;break}h=j+16+(g-1<<4)|0}}while(0);f=a+8|0;b=c[f>>2]|0;g=hI(a,e)|0;c[b>>2]=g;c[b+8>>2]=d[g+4|0]|0|64;g=c[f>>2]|0;c[f>>2]=g+16;iC(a,h,g,g);return}function dl(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;a=ig(c[g>>2]|0,(c[e>>2]|0)-16|0)|0;g=c[e>>2]|0;e=a;b=g-16|0;f=c[e+4>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=f;c[g-16+8>>2]=c[a+8>>2];return}function dm(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1296}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1296;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1296;break}h=j+16+(g-1<<4)|0}}while(0);f=id(c[h>>2]|0,e)|0;e=a+8|0;a=c[e>>2]|0;h=f;b=a;g=c[h+4>>2]|0;c[b>>2]=c[h>>2];c[b+4>>2]=g;c[a+8>>2]=c[f+8>>2];c[e>>2]=(c[e>>2]|0)+16;return}function dn(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){fv(a)}e=h9(a)|0;f=a+8|0;g=c[f>>2]|0;c[g>>2]=e;c[g+8>>2]=69;c[f>>2]=(c[f>>2]|0)+16;if(!((b|0)>0|(d|0)>0)){return}h4(a,e,b,d);return}function dp(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]&15;if((e|0)==7){j=c[(c[g>>2]|0)+8>>2]|0}else if((e|0)==5){j=c[(c[g>>2]|0)+8>>2]|0}else{j=c[(c[a+12>>2]|0)+252+(e<<2)>>2]|0}if((j|0)==0){k=0;return k|0}e=a+8|0;a=c[e>>2]|0;c[a>>2]=j;c[a+8>>2]=69;c[e>>2]=(c[e>>2]|0)+16;k=1;return k|0}function dq(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=c[(c[g>>2]|0)+12>>2]|0;g=a+8|0;a=c[g>>2]|0;if((e|0)==0){c[a+8>>2]=0;j=c[g>>2]|0;k=j+16|0;c[g>>2]=k;return}else{c[a>>2]=e;c[a+8>>2]=69;j=c[g>>2]|0;k=j+16|0;c[g>>2]=k;return}}function dr(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=id(c[(c[a+12>>2]|0)+40>>2]|0,2)|0;f=a+8|0;g=c[f>>2]|0;c[f>>2]=g+16;h=hI(a,b)|0;c[g>>2]=h;c[g+8>>2]=d[h+4|0]|0|64;h=c[f>>2]|0;iD(a,e,h-16|0,h-32|0);c[f>>2]=(c[f>>2]|0)-32;return}function ds(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;b=c[e>>2]|0;iD(a,g,b-32|0,b-16|0);c[e>>2]=(c[e>>2]|0)-32;return}function dt(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1296}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1296;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1296;break}h=j+16+(g-1<<4)|0}}while(0);f=a+8|0;b=c[f>>2]|0;c[f>>2]=b+16;g=hI(a,e)|0;c[b>>2]=g;c[b+8>>2]=d[g+4|0]|0|64;g=c[f>>2]|0;iD(a,h,g-16|0,g-32|0);c[f>>2]=(c[f>>2]|0)-32;return}function du(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[b+16>>2]|0;do{if((e|0)>0){g=(c[f>>2]|0)+(e<<4)|0;h=g>>>0<(c[b+8>>2]|0)>>>0?g:1296}else{if((e|0)>=-1000999){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}g=-1001e3-e|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1296;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1296;break}h=j+16+(g-1<<4)|0}}while(0);f=b+8|0;e=c[f>>2]|0;g=h;h=h7(b,c[g>>2]|0,e-32|0)|0;j=e-16|0;i=h;k=c[j+4>>2]|0;c[i>>2]=c[j>>2];c[i+4>>2]=k;c[h+8>>2]=c[e-16+8>>2];a[(c[g>>2]|0)+6|0]=0;e=c[f>>2]|0;if((c[e-16+8>>2]&64|0)==0){l=e;m=l-32|0;c[f>>2]=m;return}if((a[(c[e-16>>2]|0)+5|0]&3)==0){l=e;m=l-32|0;c[f>>2]=m;return}h=c[g>>2]|0;if((a[h+5|0]&4)==0){l=e;m=l-32|0;c[f>>2]=m;return}fj(b,h);l=c[f>>2]|0;m=l-32|0;c[f>>2]=m;return}function dv(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[b+16>>2]|0;do{if((e|0)>0){h=(c[g>>2]|0)+(e<<4)|0;i=h>>>0<(c[b+8>>2]|0)>>>0?h:1296}else{if((e|0)>=-1000999){i=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){i=(c[b+12>>2]|0)+40|0;break}h=-1001e3-e|0;j=c[g>>2]|0;if((c[j+8>>2]|0)==22){i=1296;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1296;break}i=k+16+(h-1<<4)|0}}while(0);g=i;i=b+8|0;h6(b,c[g>>2]|0,f,(c[i>>2]|0)-16|0);f=c[i>>2]|0;if((c[f-16+8>>2]&64|0)==0){l=f;m=l-16|0;c[i>>2]=m;return}if((a[(c[f-16>>2]|0)+5|0]&3)==0){l=f;m=l-16|0;c[i>>2]=m;return}e=c[g>>2]|0;if((a[e+5|0]&4)==0){l=f;m=l-16|0;c[i>>2]=m;return}fj(b,e);l=c[i>>2]|0;m=l-16|0;c[i>>2]=m;return}function dw(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[b+16>>2]|0;do{if((e|0)>0){g=(c[f>>2]|0)+(e<<4)|0;h=g>>>0<(c[b+8>>2]|0)>>>0?g:1296}else{if((e|0)>=-1000999){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}g=-1001e3-e|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1296;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1296;break}h=j+16+(g-1<<4)|0}}while(0);f=b+8|0;e=c[f>>2]|0;if((c[e-16+8>>2]|0)==0){k=0}else{k=c[e-16>>2]|0}e=c[h+8>>2]&15;if((e|0)==5){g=h;c[(c[g>>2]|0)+8>>2]=k;if((k|0)==0){l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}do{if((a[k+5|0]&3)!=0){j=c[g>>2]|0;if((a[j+5|0]&4)==0){break}fj(b,j)}}while(0);fn(b,c[g>>2]|0,k);l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}else if((e|0)==7){g=h;h=k;c[(c[g>>2]|0)+8>>2]=h;if((k|0)==0){l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}do{if((a[k+5|0]&3)!=0){j=c[g>>2]|0;if((a[j+5|0]&4)==0){break}fh(b,j,h)}}while(0);fn(b,c[g>>2]|0,k);l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}else{c[(c[b+12>>2]|0)+252+(e<<2)>>2]=k;l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}return 0}function dx(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=c[b+16>>2]|0;do{if((e|0)>0){g=(c[f>>2]|0)+(e<<4)|0;h=g>>>0<(c[b+8>>2]|0)>>>0?g:1296}else{if((e|0)>=-1000999){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}g=-1001e3-e|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1296;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1296;break}h=j+16+(g-1<<4)|0}}while(0);f=b+8|0;e=c[f>>2]|0;if((c[e-16+8>>2]|0)==0){c[(c[h>>2]|0)+12>>2]=0;k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}g=h;c[(c[g>>2]|0)+12>>2]=c[e-16>>2];e=c[(c[f>>2]|0)-16>>2]|0;if((a[e+5|0]&3)==0){k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}h=c[g>>2]|0;if((a[h+5|0]&4)==0){k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}fh(b,h,e);k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}function dy(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=b+16|0;b=c[f>>2]|0;if((a[b+18|0]&8)==0){g=0;return g|0}if((e|0)==0){h=b}else{c[e>>2]=c[b+24>>2];h=c[f>>2]|0}g=d[h+37|0]|0;return g|0}function dz(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=a+8|0;i=(c[h>>2]|0)+(~d<<4)|0;do{if((g|0)==0){j=674}else{if((b[a+36>>1]|0)!=0){j=674;break}d=a+16|0;c[(c[d>>2]|0)+28>>2]=g;c[(c[d>>2]|0)+24>>2]=f;eZ(a,i,e,1)}}while(0);if((j|0)==674){eZ(a,i,e,0)}if((e|0)!=-1){return}e=(c[a+16>>2]|0)+4|0;a=c[h>>2]|0;if((c[e>>2]|0)>>>0>=a>>>0){return}c[e>>2]=a;return}function dA(e,f,g,h,j,k){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;l=i;i=i+8|0;m=l|0;if((h|0)==0){n=0}else{o=c[e+16>>2]|0;do{if((h|0)>0){p=(c[o>>2]|0)+(h<<4)|0;q=p>>>0<(c[e+8>>2]|0)>>>0?p:1296}else{if((h|0)>=-1000999){q=(c[e+8>>2]|0)+(h<<4)|0;break}if((h|0)==-1001e3){q=(c[e+12>>2]|0)+40|0;break}p=-1001e3-h|0;r=c[o>>2]|0;if((c[r+8>>2]|0)==22){q=1296;break}s=c[r>>2]|0;if((p|0)>(d[s+6|0]|0)){q=1296;break}q=s+16+(p-1<<4)|0}}while(0);n=q-(c[e+28>>2]|0)|0}q=e+8|0;o=(c[q>>2]|0)+(~f<<4)|0;f=m|0;c[f>>2]=o;do{if((k|0)==0){t=695}else{if((b[e+36>>1]|0)!=0){t=695;break}h=c[e+16>>2]|0;c[h+28>>2]=k;c[h+24>>2]=j;c[h+20>>2]=(c[f>>2]|0)-(c[e+28>>2]|0);a[h+36|0]=a[e+41|0]|0;p=e+68|0;s=h+32|0;c[s>>2]=c[p>>2];c[p>>2]=n;r=h+18|0;a[r]=a[r]|16;eZ(e,c[f>>2]|0,g,1);a[r]=a[r]&-17;c[p>>2]=c[s>>2];u=0}}while(0);if((t|0)==695){c[m+4>>2]=g;u=e2(e,4,m,o-(c[e+28>>2]|0)|0,n)|0}if((g|0)!=-1){i=l;return u|0}g=(c[e+16>>2]|0)+4|0;e=c[q>>2]|0;if((c[g>>2]|0)>>>0>=e>>>0){i=l;return u|0}c[g>>2]=e;i=l;return u|0}function dB(a,b){a=a|0;b=b|0;eZ(a,c[b>>2]|0,c[b+4>>2]|0,0);return}function dC(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;i=i+24|0;j=h|0;iO(b,j,d,e);e=e3(b,j,(f|0)==0?9528:f,g)|0;if((e|0)!=0){i=h;return e|0}g=c[(c[b+8>>2]|0)-16>>2]|0;if((a[g+6|0]|0)!=1){i=h;return e|0}f=id(c[(c[b+12>>2]|0)+40>>2]|0,2)|0;j=g+16|0;g=c[(c[j>>2]|0)+8>>2]|0;d=f;k=g;l=c[d+4>>2]|0;c[k>>2]=c[d>>2];c[k+4>>2]=l;l=f+8|0;c[g+8>>2]=c[l>>2];if((c[l>>2]&64|0)==0){i=h;return e|0}l=c[f>>2]|0;if((a[l+5|0]&3)==0){i=h;return e|0}f=c[j>>2]|0;if((a[f+5|0]&4)==0){i=h;return e|0}fh(b,f,l);i=h;return e|0}function dD(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[a+8>>2]|0;if((c[e-16+8>>2]|0)!=70){f=1;return f|0}f=e6(a,c[(c[e-16>>2]|0)+12>>2]|0,b,d,0)|0;return f|0}function dE(a){a=a|0;return d[a+6|0]|0|0}function dF(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;g=c[b+12>>2]|0;L905:do{switch(e|0){case 0:{a[g+63|0]=0;h=0;break};case 4:{h=(c[g+12>>2]|0)+(c[g+8>>2]|0)&1023;break};case 5:{if((a[g+62|0]|0)==2){i=(c[g+20>>2]|0)==0|0;ft(b);h=i;break L905}i=(f<<10)-1600|0;if((a[g+63|0]|0)==0){j=i;hu(g,j);ft(b);k=g+61|0;l=a[k]|0;m=l<<24>>24==5;n=m&1;return n|0}j=(c[g+12>>2]|0)+i|0;hu(g,j);ft(b);k=g+61|0;l=a[k]|0;m=l<<24>>24==5;n=m&1;return n|0};case 9:{h=d[g+63|0]|0;break};case 1:{hu(g,0);a[g+63|0]=1;h=0;break};case 8:{i=g+160|0;o=c[i>>2]|0;c[i>>2]=f;h=o;break};case 2:{fw(b,0);h=0;break};case 6:{o=g+156|0;i=c[o>>2]|0;c[o>>2]=f;h=i;break};case 3:{h=((c[g+12>>2]|0)+(c[g+8>>2]|0)|0)>>>10;break};case 10:{fo(b,2);h=0;break};case 11:{fo(b,0);h=0;break};case 7:{i=g+164|0;o=c[i>>2]|0;c[i>>2]=f;h=o;break};default:{h=-1}}}while(0);return h|0}function dG(a){a=a|0;eQ(a);return 0}function dH(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;b=h3(a,c[g>>2]|0,(c[e>>2]|0)-16|0)|0;g=c[e>>2]|0;c[e>>2]=(b|0)==0?g-16|0:g+16|0;return b|0}function dI(a,b){a=a|0;b=b|0;var e=0,f=0;if((b|0)>1){if((c[(c[a+12>>2]|0)+12>>2]|0)>0){fv(a)}iI(a,b);return}else{if((b|0)!=0){return}b=a+8|0;e=c[b>>2]|0;f=hH(a,12168,0)|0;c[e>>2]=f;c[e+8>>2]=d[f+4|0]|0|64;c[b>>2]=(c[b>>2]|0)+16;return}}function dJ(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1296}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1296;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1296;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;iJ(a,c[e>>2]|0,g);c[e>>2]=(c[e>>2]|0)+16;return}function dK(a,b){a=a|0;b=b|0;var d=0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){fv(a)}d=hJ(a,b,0)|0;b=a+8|0;a=c[b>>2]|0;c[a>>2]=d;c[a+8>>2]=71;c[b>>2]=(c[b>>2]|0)+16;return d+24|0}function dL(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1296}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1296;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1296;break}h=j+16+(g-1<<4)|0}}while(0);f=c[h+8>>2]&63;do{if((f|0)==38){b=c[h>>2]|0;if((e|0)<=0){k=0;return k|0}if((d[b+6|0]|0|0)<(e|0)){k=0;return k|0}else{l=b+16+(e-1<<4)|0;m=12168;break}}else if((f|0)==6){b=c[h>>2]|0;g=c[b+12>>2]|0;if((e|0)<=0){k=0;return k|0}if((c[g+40>>2]|0)<(e|0)){k=0;return k|0}j=e-1|0;i=c[(c[b+16+(j<<2)>>2]|0)+8>>2]|0;b=c[(c[g+28>>2]|0)+(j<<3)>>2]|0;if((b|0)==0){l=i;m=12168;break}j=b+16|0;if((j|0)==0){k=0;return k|0}else{l=i;m=j;break}}else{k=0;return k|0}}while(0);e=a+8|0;a=c[e>>2]|0;h=l;f=a;j=c[h+4>>2]|0;c[f>>2]=c[h>>2];c[f+4>>2]=j;c[a+8>>2]=c[l+8>>2];c[e>>2]=(c[e>>2]|0)+16;k=m;return k|0}function dM(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=c[b+16>>2]|0;do{if((e|0)>0){h=(c[g>>2]|0)+(e<<4)|0;i=h>>>0<(c[b+8>>2]|0)>>>0?h:1296}else{if((e|0)>=-1000999){i=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){i=(c[b+12>>2]|0)+40|0;break}h=-1001e3-e|0;j=c[g>>2]|0;if((c[j+8>>2]|0)==22){i=1296;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1296;break}i=k+16+(h-1<<4)|0}}while(0);g=c[i+8>>2]&63;do{if((g|0)==6){e=c[i>>2]|0;h=c[e+12>>2]|0;if((f|0)<=0){l=0;return l|0}if((c[h+40>>2]|0)<(f|0)){l=0;return l|0}k=f-1|0;j=c[e+16+(k<<2)>>2]|0;e=c[j+8>>2]|0;m=j;j=c[(c[h+28>>2]|0)+(k<<3)>>2]|0;if((j|0)==0){n=e;o=m;p=12168;break}k=j+16|0;if((k|0)==0){l=0;return l|0}else{n=e;o=m;p=k;break}}else if((g|0)==38){k=c[i>>2]|0;if((f|0)<=0){l=0;return l|0}if((d[k+6|0]|0|0)<(f|0)){l=0;return l|0}else{n=k+16+(f-1<<4)|0;o=k;p=12168;break}}else{l=0;return l|0}}while(0);f=b+8|0;i=c[f>>2]|0;g=i-16|0;c[f>>2]=g;k=g;g=n;m=c[k+4>>2]|0;c[g>>2]=c[k>>2];c[g+4>>2]=m;c[n+8>>2]=c[i-16+8>>2];i=c[f>>2]|0;if((c[i+8>>2]&64|0)==0){l=p;return l|0}f=c[i>>2]|0;if((a[f+5|0]&3)==0){l=p;return l|0}if((a[o+5|0]&4)==0){l=p;return l|0}fh(b,o,f);l=p;return l|0}function dN(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[a+16>>2]|0;g=(b|0)>0;do{if(g){h=(c[f>>2]|0)+(b<<4)|0;i=h>>>0<(c[a+8>>2]|0)>>>0?h:1296}else{if((b|0)>=-1000999){i=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){i=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)==22){i=1296;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1296;break}i=k+16+(h-1<<4)|0}}while(0);h=c[i+8>>2]&63;if((h|0)==38){l=(c[i>>2]|0)+16+(e-1<<4)|0;return l|0}else if((h|0)==6){do{if(g){h=(c[f>>2]|0)+(b<<4)|0;m=h>>>0<(c[a+8>>2]|0)>>>0?h:1296}else{if((b|0)>=-1000999){m=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){m=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){m=1296;break}k=c[i>>2]|0;if((h|0)>(d[k+6|0]|0|0)){m=1296;break}m=k+16+(h-1<<4)|0}}while(0);l=c[(c[m>>2]|0)+16+(e-1<<2)>>2]|0;return l|0}else{l=0;return l|0}return 0}function dO(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0;i=c[b+16>>2]|0;do{if((e|0)>0){j=(c[i>>2]|0)+(e<<4)|0;k=j>>>0<(c[b+8>>2]|0)>>>0?j:1296}else{if((e|0)>=-1000999){k=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){k=(c[b+12>>2]|0)+40|0;break}j=-1001e3-e|0;l=c[i>>2]|0;if((c[l+8>>2]|0)==22){k=1296;break}m=c[l>>2]|0;if((j|0)>(d[m+6|0]|0|0)){k=1296;break}k=m+16+(j-1<<4)|0}}while(0);e=c[k>>2]|0;k=e+16+(f-1<<2)|0;do{if((g|0)>0){f=(c[i>>2]|0)+(g<<4)|0;n=f>>>0<(c[b+8>>2]|0)>>>0?f:1296}else{if((g|0)>=-1000999){n=(c[b+8>>2]|0)+(g<<4)|0;break}if((g|0)==-1001e3){n=(c[b+12>>2]|0)+40|0;break}f=-1001e3-g|0;j=c[i>>2]|0;if((c[j+8>>2]|0)==22){n=1296;break}m=c[j>>2]|0;if((f|0)>(d[m+6|0]|0|0)){n=1296;break}n=m+16+(f-1<<4)|0}}while(0);i=(c[n>>2]|0)+16+(h-1<<2)|0;c[k>>2]=c[i>>2];k=c[i>>2]|0;if((a[k+5|0]&3)==0){return}if((a[e+5|0]&4)==0){return}fh(b,e,k);return}function dP(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+208|0;h=g|0;j=g+104|0;k=cL(b)|0;l=1;m=1;while(1){if((eF(d,m,h)|0)==0){break}else{l=m;m=m<<1}}if((l|0)<(m|0)){n=m;o=l;while(1){l=(n+o|0)/2|0;p=(eF(d,l,h)|0)==0;q=p?l:n;r=p?o:l+1|0;if((r|0)<(q|0)){n=q;o=r}else{s=q;break}}}else{s=m}m=(s-1|0)>22?12:0;if((e|0)!=0){dd(b,12080,(t=i,i=i+8|0,c[t>>2]=e,t)|0)|0;i=t}da(b,11760,16)|0;if((eF(d,f,j)|0)==0){u=cL(b)|0;v=u-k|0;dI(b,v);i=g;return}e=s-11|0;s=j+36|0;o=j+20|0;n=j+8|0;h=j+12|0;q=j+24|0;r=j+35|0;l=j+4|0;p=f;while(1){f=p+1|0;if((f|0)==(m|0)){da(b,9240,5)|0;w=e}else{eJ(d,7448,j)|0;dd(b,5856,(t=i,i=i+8|0,c[t>>2]=s,t)|0)|0;i=t;x=c[o>>2]|0;if((x|0)>0){dd(b,4488,(t=i,i=i+8|0,c[t>>2]=x,t)|0)|0;i=t}da(b,3888,4)|0;do{if((a[c[n>>2]|0]|0)==0){x=a[c[h>>2]|0]|0;if((x<<24>>24|0)==67){if((dS(b,j)|0)==0){da(b,11440,1)|0;break}else{y=c1(b,-1,0)|0;dd(b,4472,(t=i,i=i+8|0,c[t>>2]=y,t)|0)|0;i=t;cN(b,-2);break}}else if((x<<24>>24|0)==109){da(b,4392,10)|0;break}else{x=c[q>>2]|0;dd(b,4304,(t=i,i=i+16|0,c[t>>2]=s,c[t+8>>2]=x,t)|0)|0;i=t;break}}else{x=c[l>>2]|0;dd(b,4472,(t=i,i=i+8|0,c[t>>2]=x,t)|0)|0;i=t}}while(0);if((a[r]|0)!=0){da(b,3520,20)|0}dI(b,(cL(b)|0)-k|0);w=f}if((eF(d,w,j)|0)==0){break}else{p=w}}u=cL(b)|0;v=u-k|0;dI(b,v);i=g;return}function dQ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+104|0;f=e|0;if((eF(a,0,f)|0)==0){g=dR(a,3072,(h=i,i=i+16|0,c[h>>2]=b,c[h+8>>2]=d,h)|0)|0;i=h;j=g;i=e;return j|0}eJ(a,2752,f)|0;do{if((aJ(c[f+8>>2]|0,12064)|0)==0){g=b-1|0;if((g|0)!=0){k=g;break}g=dR(a,11784,(h=i,i=i+16|0,c[h>>2]=c[f+4>>2],c[h+8>>2]=d,h)|0)|0;i=h;j=g;i=e;return j|0}else{k=b}}while(0);b=f+4|0;g=c[b>>2]|0;if((g|0)==0){if((dS(a,f)|0)==0){l=11440}else{l=c1(a,-1,0)|0}c[b>>2]=l;m=l}else{m=g}g=dR(a,11080,(h=i,i=i+24|0,c[h>>2]=k,c[h+8>>2]=m,c[h+16>>2]=d,h)|0)|0;i=h;j=g;i=e;return j|0}function dR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+120|0;f=e|0;g=e+104|0;h=g|0;j=g;c[j>>2]=d;c[j+4>>2]=0;do{if((eF(a,1,f)|0)!=0){eJ(a,10816,f)|0;j=c[f+20>>2]|0;if((j|0)<=0){break}d=f+36|0;dd(a,10600,(g=i,i=i+16|0,c[g>>2]=d,c[g+8>>2]=j,g)|0)|0;i=g;k=dc(a,b,h)|0;dI(a,2);l=dG(a)|0;i=e;return l|0}}while(0);da(a,12152,0)|0;k=dc(a,b,h)|0;dI(a,2);l=dG(a)|0;i=e;return l|0}function dS(a,b){a=a|0;b=b|0;var c=0,d=0;c=cL(a)|0;eJ(a,4640,b)|0;dm(a,-1001e3,2);b=c+1|0;if((eA(a,b,2)|0)==0){cM(a,c);d=0;return d|0}else{cQ(a,-1,b);cM(a,-3);d=1;return d|0}return 0}function dT(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+104|0;e=d|0;do{if((eF(a,b,e)|0)!=0){eJ(a,10816,e)|0;f=c[e+20>>2]|0;if((f|0)<=0){break}g=e+36|0;dd(a,10600,(h=i,i=i+16|0,c[h>>2]=g,c[h+8>>2]=f,h)|0)|0;i=h;i=d;return}}while(0);da(a,12152,0)|0;i=d;return}function dU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;f=c[(bD()|0)>>2]|0;if((b|0)!=0){df(a,1);g=1;i=e;return g|0}c6(a);b=bE(f|0)|0;if((d|0)==0){db(a,b)|0}else{dd(a,10152,(h=i,i=i+16|0,c[h>>2]=d,c[h+8>>2]=b,h)|0)|0;i=h}c8(a,f);g=3;i=e;return g|0}function dV(a,b){a=a|0;b=b|0;var d=0,e=0;if((b|0)==(-1|0)){d=c[(bD()|0)>>2]|0;c6(a);e=bE(d|0)|0;db(a,e)|0;c8(a,d);return 3}else if((b|0)==0){df(a,1)}else{c6(a)}db(a,9936)|0;c8(a,b);return 3}function dW(a,b){a=a|0;b=b|0;var c=0;dk(a,-1001e3,b);if((cS(a,-1)|0)!=0){c=0;return c|0}cM(a,-2);dn(a,0,0);cR(a,-1);dt(a,-1001e3,b);c=1;return c|0}function dX(a,b){a=a|0;b=b|0;dk(a,-1001e3,b);dw(a,-2)|0;return}function dY(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=c3(a,b)|0;if((d|0)==0){e=0;return e|0}if((dp(a,b)|0)==0){e=0;return e|0}dk(a,-1001e3,c);c=(cX(a,-1,-2)|0)==0;cM(a,-3);e=c?0:d;return e|0}function dZ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=c3(a,b)|0;do{if((f|0)!=0){if((dp(a,b)|0)==0){break}dk(a,-1001e3,d);g=(cX(a,-1,-2)|0)==0;h=g?0:f;cM(a,-3);if((h|0)==0){break}else{j=h}i=e;return j|0}}while(0);f=cT(a,cS(a,b)|0)|0;h=dd(a,4736,(g=i,i=i+16|0,c[g>>2]=d,c[g+8>>2]=f,g)|0)|0;i=g;dQ(a,b,h)|0;j=0;i=e;return j|0}function d_(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;do{if((d|0)==0){g=c1(a,b,0)|0;if((g|0)!=0){h=g;break}g=cT(a,4)|0;j=cT(a,cS(a,b)|0)|0;k=dd(a,4736,(l=i,i=i+16|0,c[l>>2]=g,c[l+8>>2]=j,l)|0)|0;i=l;dQ(a,b,k)|0;h=0}else{h=d$(a,b,d,0)|0}}while(0);d=0;while(1){k=c[e+(d<<2)>>2]|0;if((k|0)==0){break}if((aJ(k|0,h|0)|0)==0){m=d;n=996;break}else{d=d+1|0}}if((n|0)==996){i=f;return m|0}n=dd(a,9744,(l=i,i=i+8|0,c[l>>2]=h,l)|0)|0;i=l;m=dQ(a,b,n)|0;i=f;return m|0}function d$(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;if((cS(a,b)|0)>=1){g=c1(a,b,e)|0;if((g|0)!=0){h=g;i=f;return h|0}g=cT(a,4)|0;j=cT(a,cS(a,b)|0)|0;k=dd(a,4736,(l=i,i=i+16|0,c[l>>2]=g,c[l+8>>2]=j,l)|0)|0;i=l;dQ(a,b,k)|0;h=0;i=f;return h|0}if((e|0)==0){h=d;i=f;return h|0}if((d|0)==0){m=0}else{m=kU(d|0)|0}c[e>>2]=m;h=d;i=f;return h|0}function d0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=c1(a,b,d)|0;if((f|0)!=0){i=e;return f|0}d=cT(a,4)|0;g=cT(a,cS(a,b)|0)|0;h=dd(a,4736,(j=i,i=i+16|0,c[j>>2]=d,c[j+8>>2]=g,j)|0)|0;i=j;dQ(a,b,h)|0;i=e;return f|0}function d1(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if((cF(a,b+20|0)|0)!=0){i=e;return}if((d|0)==0){dR(a,9304,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f;i=e;return}else{dR(a,9504,(f=i,i=i+8|0,c[f>>2]=d,f)|0)|0;i=f;i=e;return}}function d2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;if((cS(a,b)|0)==(d|0)){i=e;return}f=cT(a,d)|0;d=cT(a,cS(a,b)|0)|0;g=dd(a,4736,(h=i,i=i+16|0,c[h>>2]=f,c[h+8>>2]=d,h)|0)|0;i=h;dQ(a,b,g)|0;i=e;return}function d3(a,b){a=a|0;b=b|0;if((cS(a,b)|0)!=-1){return}dQ(a,b,9048)|0;return}function d4(a,b){a=a|0;b=b|0;var d=0,e=0,f=0.0,g=0,h=0,j=0;d=i;i=i+8|0;e=d|0;f=+cZ(a,b,e);if((c[e>>2]|0)!=0){i=d;return+f}e=cT(a,3)|0;g=cT(a,cS(a,b)|0)|0;h=dd(a,4736,(j=i,i=i+16|0,c[j>>2]=e,c[j+8>>2]=g,j)|0)|0;i=j;dQ(a,b,h)|0;i=d;return+f}function d5(a,b,c){a=a|0;b=b|0;c=+c;var d=0.0;if((cS(a,b)|0)<1){d=c;return+d}d=+d4(a,b);return+d}function d6(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+8|0;e=d|0;f=c_(a,b,e)|0;if((c[e>>2]|0)!=0){i=d;return f|0}e=cT(a,3)|0;g=cT(a,cS(a,b)|0)|0;h=dd(a,4736,(j=i,i=i+16|0,c[j>>2]=e,c[j+8>>2]=g,j)|0)|0;i=j;dQ(a,b,h)|0;i=d;return f|0}function d7(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+8|0;e=d|0;f=c$(a,b,e)|0;if((c[e>>2]|0)!=0){i=d;return f|0}e=cT(a,3)|0;g=cT(a,cS(a,b)|0)|0;h=dd(a,4736,(j=i,i=i+16|0,c[j>>2]=e,c[j+8>>2]=g,j)|0)|0;i=j;dQ(a,b,h)|0;i=d;return f|0}function d8(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((cS(a,b)|0)<1){d=c;return d|0}d=d6(a,b)|0;return d|0}function d9(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;e=c[a+12>>2]|0;f=a+4|0;g=c[f>>2]|0;h=a+8|0;j=c[h>>2]|0;if((g-j|0)>>>0>=b>>>0){k=j;l=c[a>>2]|0;m=l+k|0;i=d;return m|0}n=g<<1;g=(n-j|0)>>>0<b>>>0?j+b|0:n;if(g>>>0<j>>>0|(g-j|0)>>>0<b>>>0){dR(e,8880,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b}b=dK(e,g)|0;j=a|0;n=c[j>>2]|0;o=c[h>>2]|0;kV(b|0,n|0,o)|0;if((c[j>>2]|0)!=(a+16|0)){cN(e,-2)}c[j>>2]=b;c[f>>2]=g;k=c[h>>2]|0;l=b;m=l+k|0;i=d;return m|0}function ea(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;f=c[a+12>>2]|0;g=a+4|0;h=c[g>>2]|0;j=a+8|0;k=c[j>>2]|0;if((h-k|0)>>>0>=d>>>0){l=k;m=c[a>>2]|0;n=m+l|0;kV(n|0,b|0,d)|0;o=c[j>>2]|0;p=o+d|0;c[j>>2]=p;i=e;return}q=h<<1;h=(q-k|0)>>>0<d>>>0?k+d|0:q;if(h>>>0<k>>>0|(h-k|0)>>>0<d>>>0){dR(f,8880,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}k=dK(f,h)|0;q=a|0;r=c[q>>2]|0;s=c[j>>2]|0;kV(k|0,r|0,s)|0;if((c[q>>2]|0)!=(a+16|0)){cN(f,-2)}c[q>>2]=k;c[g>>2]=h;l=c[j>>2]|0;m=k;n=m+l|0;kV(n|0,b|0,d)|0;o=c[j>>2]|0;p=o+d|0;c[j>>2]=p;i=e;return}function eb(a,b){a=a|0;b=b|0;ea(a,b,kU(b|0)|0);return}function ec(a){a=a|0;var b=0,d=0;b=c[a+12>>2]|0;d=a|0;da(b,c[d>>2]|0,c[a+8>>2]|0)|0;if((c[d>>2]|0)==(a+16|0)){return}cN(b,-2);return}function ed(a,b){a=a|0;b=b|0;var d=0,e=0;d=a+8|0;e=(c[d>>2]|0)+b|0;c[d>>2]=e;d=c[a+12>>2]|0;b=a|0;da(d,c[b>>2]|0,e)|0;if((c[b>>2]|0)==(a+16|0)){return}cN(d,-2);return}function ee(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+8|0;d=b|0;e=c[a+12>>2]|0;f=c1(e,-1,d)|0;g=a|0;h=a+16|0;if((c[g>>2]|0)!=(h|0)){cO(e,-2)}ea(a,f,c[d>>2]|0);cN(e,(c[g>>2]|0)!=(h|0)?-2:-1);i=b;return}function ef(a,b){a=a|0;b=b|0;c[b+12>>2]=a;c[b>>2]=b+16;c[b+8>>2]=0;c[b+4>>2]=1024;return}function eg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;c[b+12>>2]=a;e=b+16|0;f=b|0;c[f>>2]=e;g=b+8|0;c[g>>2]=0;h=b+4|0;c[h>>2]=1024;if(d>>>0<=1024){i=0;j=e;k=j+i|0;return k|0}b=d>>>0>2048?d:2048;d=dK(a,b)|0;l=c[f>>2]|0;m=c[g>>2]|0;kV(d|0,l|0,m)|0;if((c[f>>2]|0)!=(e|0)){cN(a,-2)}c[f>>2]=d;c[h>>2]=b;i=c[g>>2]|0;j=d;k=j+i|0;return k|0}function eh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+1040|0;g=f|0;h=f+1032|0;j=(cL(b)|0)+1|0;k=(d|0)==0;do{if(k){da(b,8632,6)|0;c[g+4>>2]=c[m>>2]}else{dd(b,8424,(l=i,i=i+8|0,c[l>>2]=d,l)|0)|0;i=l;n=bm(d|0,8216)|0;c[g+4>>2]=n;if((n|0)!=0){break}n=bE(c[(bD()|0)>>2]|0)|0;o=(c1(b,j,0)|0)+1|0;dd(b,4880,(l=i,i=i+24|0,c[l>>2]=7976,c[l+8>>2]=o,c[l+16>>2]=n,l)|0)|0;i=l;cN(b,j);p=7;i=f;return p|0}}while(0);if((ei(g,h)|0)!=0){n=g|0;o=c[n>>2]|0;c[n>>2]=o+1;a[g+8+o|0]=10}o=c[h>>2]|0;do{if((o|0)!=27|k){q=o}else{n=g+4|0;r=as(d|0,7600,c[n>>2]|0)|0;c[n>>2]=r;if((r|0)!=0){ei(g,h)|0;q=c[h>>2]|0;break}r=bE(c[(bD()|0)>>2]|0)|0;n=(c1(b,j,0)|0)+1|0;dd(b,4880,(l=i,i=i+24|0,c[l>>2]=7440,c[l+8>>2]=n,c[l+16>>2]=r,l)|0)|0;i=l;cN(b,j);p=7;i=f;return p|0}}while(0);if((q|0)!=-1){h=g|0;d=c[h>>2]|0;c[h>>2]=d+1;a[g+8+d|0]=q&255}q=dC(b,2,g,c1(b,-1,0)|0,e)|0;e=c[g+4>>2]|0;g=a3(e|0)|0;if(!k){ar(e|0)|0}if((g|0)==0){cN(b,j);p=q;i=f;return p|0}else{cM(b,j);q=bE(c[(bD()|0)>>2]|0)|0;g=(c1(b,j,0)|0)+1|0;dd(b,4880,(l=i,i=i+24|0,c[l>>2]=7288,c[l+8>>2]=g,c[l+16>>2]=q,l)|0)|0;i=l;cN(b,j);p=7;i=f;return p|0}return 0}function ei(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=b|0;c[e>>2]=0;f=b+4|0;g=aO(c[f>>2]|0)|0;do{if((g|0)==239){h=c[e>>2]|0;c[e>>2]=h+1;a[b+8+h|0]=-17;h=aO(c[f>>2]|0)|0;if((h|0)==(-1|0)){i=1125;break}else if((h|0)!=187){j=h;break}h=c[e>>2]|0;c[e>>2]=h+1;a[b+8+h|0]=-69;h=aO(c[f>>2]|0)|0;if((h|0)==(-1|0)){i=1125;break}else if((h|0)!=191){j=h;break}a[(c[e>>2]|0)+(b+8)|0]=-65;c[e>>2]=0;j=aO(c[f>>2]|0)|0}else if((g|0)==(-1|0)){i=1125}else{j=g}}while(0);if((i|0)==1125){c[d>>2]=-1;k=0;return k|0}c[d>>2]=j;if((j|0)!=35){k=0;return k|0}do{j=aO(c[f>>2]|0)|0}while(!((j|0)==(-1|0)|(j|0)==10));c[d>>2]=aO(c[f>>2]|0)|0;k=1;return k|0}function ej(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;a=b;e=c[a>>2]|0;if((e|0)>0){c[d>>2]=e;c[a>>2]=0;f=b+8|0;return f|0}a=b+4|0;if((bP(c[a>>2]|0)|0)!=0){f=0;return f|0}e=b+8|0;c[d>>2]=bK(e|0,1,1024,c[a>>2]|0)|0;f=e;return f|0}function ek(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;c[h+4>>2]=d;d=dC(a,4,h,e,f)|0;i=g;return d|0}function el(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;a=b+4|0;e=c[a>>2]|0;if((e|0)==0){f=0;return f|0}c[d>>2]=e;c[a>>2]=0;f=c[b>>2]|0;return f|0}function em(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((dp(a,b)|0)==0){d=0;return d|0}db(a,c)|0;dl(a,-2);if((cS(a,-1)|0)==0){cM(a,-3);d=0;return d|0}else{cN(a,-2);d=1;return d|0}return 0}function en(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=cK(a,b)|0;if((dp(a,d)|0)==0){e=0;return e|0}db(a,c)|0;dl(a,-2);if((cS(a,-1)|0)==0){cM(a,-3);e=0;return e|0}else{cN(a,-2);cR(a,d);dz(a,1,1,0,0);e=1;return e|0}return 0}function eo(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+8|0;e=d|0;dJ(a,b);b=c_(a,-1,e)|0;if((c[e>>2]|0)!=0){cM(a,-2);i=d;return b|0}dR(a,7088,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e;cM(a,-2);i=d;return b|0}function ep(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;do{if((en(a,b,6872)|0)==0){f=cS(a,b)|0;if((f|0)==1){g=(c0(a,b)|0)!=0;h=g?6704:6544;db(a,h)|0;break}else if((f|0)==0){da(a,6368,3)|0;break}else if((f|0)==3|(f|0)==4){cR(a,b);break}else{f=cT(a,cS(a,b)|0)|0;h=c5(a,b)|0;dd(a,6216,(g=i,i=i+16|0,c[g>>2]=f,c[g+8>>2]=h,g)|0)|0;i=g;break}}}while(0);b=c1(a,-1,d)|0;i=e;return b|0}function eq(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;er(a,-1001e3,6136,1)|0;dk(a,-1,b);if((cS(a,-1)|0)==5){cN(a,-2);i=e;return}cM(a,-2);dm(a,-1001e3,2);if((er(a,0,b,d)|0)!=0){dR(a,5992,(d=i,i=i+8|0,c[d>>2]=b,d)|0)|0;i=d}cR(a,-1);dt(a,-3,b);cN(a,-2);i=e;return}function er(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;if((c|0)==0){f=d}else{cR(b,c);f=d}while(1){d=aT(f|0,46)|0;if((d|0)==0){g=f+(kU(f|0)|0)|0}else{g=d}d=g-f|0;da(b,f,d)|0;dl(b,-2);if((cS(b,-1)|0)==0){cM(b,-2);dn(b,0,(a[g]|0)==46?1:e);da(b,f,d)|0;cR(b,-2);ds(b,-4)}else{if((cS(b,-1)|0)!=5){break}}cN(b,-2);if((a[g]|0)==46){f=g+1|0}else{h=0;i=1192;break}}if((i|0)==1192){return h|0}cM(b,-3);h=f;return h|0}function es(a,b){a=a|0;b=+b;var d=0,e=0,f=0.0,g=0;d=i;e=cJ(a)|0;do{if((e|0)==(cJ(0)|0)){f=+h[e>>3];if(f==b){break}dR(a,5504,(g=i,i=i+16|0,h[g>>3]=b,h[g+8>>3]=f,g)|0)|0;i=g}else{dR(a,5712,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}}while(0);c7(a,-4660.0);do{if((c_(a,-1,0)|0)==-4660){if((c$(a,-1,0)|0)!=-4660){break}cM(a,-2);i=d;return}}while(0);dR(a,5304,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;cM(a,-2);i=d;return}function et(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;es(a,502.0);if((cF(a,d+20|0)|0)==0){dR(a,9504,(f=i,i=i+8|0,c[f>>2]=5832,f)|0)|0;i=f}f=b|0;if((c[f>>2]|0)==0){g=~d;cM(a,g);i=e;return}b=-2-d|0;h=-d|0;if((d|0)>0){j=f}else{k=f;do{de(a,c[k+4>>2]|0,d);dt(a,b,c[k>>2]|0);k=k+8|0;}while((c[k>>2]|0)!=0);g=~d;cM(a,g);i=e;return}do{k=0;do{cR(a,h);k=k+1|0;}while((k|0)<(d|0));de(a,c[j+4>>2]|0,d);dt(a,b,c[j>>2]|0);j=j+8|0;}while((c[j>>2]|0)!=0);g=~d;cM(a,g);i=e;return}function eu(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;dk(a,b,c);if((cS(a,-1)|0)==5){d=1;return d|0}cM(a,-2);e=cK(a,b)|0;dn(a,0,0);cR(a,-1);dt(a,e,c);d=0;return d|0}function ev(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;de(a,c,0);db(a,b)|0;dz(a,1,1,0,0);eu(a,-1001e3,6136)|0;cR(a,-2);dt(a,-2,b);cM(a,-2);if((d|0)==0){return}cR(a,-1);dr(a,b);return}function ew(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;f=i;i=i+1040|0;g=f|0;h=kU(d|0)|0;j=g+12|0;c[j>>2]=a;k=g+16|0;l=g|0;c[l>>2]=k;m=g+8|0;c[m>>2]=0;n=g+4|0;c[n>>2]=1024;g=aE(b|0,d|0)|0;if((g|0)==0){o=b;p=a;q=1024;r=0}else{s=b;b=g;g=0;t=a;u=1024;while(1){v=b-s|0;if((u-g|0)>>>0<v>>>0){w=u<<1;x=(w-g|0)>>>0<v>>>0?g+v|0:w;if(x>>>0<g>>>0|(x-g|0)>>>0<v>>>0){dR(t,8880,(y=i,i=i+1|0,i=i+7&-8,c[y>>2]=0,y)|0)|0;i=y}w=dK(t,x)|0;z=c[l>>2]|0;A=c[m>>2]|0;kV(w|0,z|0,A)|0;if((c[l>>2]|0)!=(k|0)){cN(t,-2)}c[l>>2]=w;c[n>>2]=x;B=c[m>>2]|0;C=w}else{B=g;C=c[l>>2]|0}w=C+B|0;kV(w|0,s|0,v)|0;w=(c[m>>2]|0)+v|0;c[m>>2]=w;v=kU(e|0)|0;x=c[j>>2]|0;A=c[n>>2]|0;if((A-w|0)>>>0<v>>>0){z=A<<1;A=(z-w|0)>>>0<v>>>0?w+v|0:z;if(A>>>0<w>>>0|(A-w|0)>>>0<v>>>0){dR(x,8880,(y=i,i=i+1|0,i=i+7&-8,c[y>>2]=0,y)|0)|0;i=y}z=dK(x,A)|0;D=c[l>>2]|0;E=c[m>>2]|0;kV(z|0,D|0,E)|0;if((c[l>>2]|0)!=(k|0)){cN(x,-2)}c[l>>2]=z;c[n>>2]=A;F=c[m>>2]|0;G=z}else{F=w;G=c[l>>2]|0}w=G+F|0;kV(w|0,e|0,v)|0;w=(c[m>>2]|0)+v|0;c[m>>2]=w;v=b+h|0;z=aE(v|0,d|0)|0;A=c[j>>2]|0;x=c[n>>2]|0;if((z|0)==0){o=v;p=A;q=x;r=w;break}else{s=v;b=z;g=w;t=A;u=x}}}u=kU(o|0)|0;if((q-r|0)>>>0<u>>>0){t=q<<1;q=(t-r|0)>>>0<u>>>0?r+u|0:t;if(q>>>0<r>>>0|(q-r|0)>>>0<u>>>0){dR(p,8880,(y=i,i=i+1|0,i=i+7&-8,c[y>>2]=0,y)|0)|0;i=y}y=dK(p,q)|0;t=c[l>>2]|0;g=c[m>>2]|0;kV(y|0,t|0,g)|0;if((c[l>>2]|0)!=(k|0)){cN(p,-2)}c[l>>2]=y;c[n>>2]=q;H=c[m>>2]|0;I=y}else{H=r;I=c[l>>2]|0}r=I+H|0;kV(r|0,o|0,u)|0;o=(c[m>>2]|0)+u|0;c[m>>2]=o;m=c[j>>2]|0;da(m,c[l>>2]|0,o)|0;if((c[l>>2]|0)==(k|0)){J=c1(a,-1,0)|0;i=f;return J|0}cN(m,-2);J=c1(a,-1,0)|0;i=f;return J|0}function ex(){var a=0;a=hz(4,0)|0;if((a|0)==0){return a|0}cI(a,90)|0;return a|0}function ey(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;if((d|0)==0){kP(b);e=0}else{e=kQ(b,d)|0}return e|0}function ez(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[n>>2]|0;e=c1(a,-1,0)|0;bM(d|0,5120,(a=i,i=i+8|0,c[a>>2]=e,a)|0)|0;i=a;au(d|0)|0;i=b;return 0}function eA(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;if((c|0)==0){d=0;return d|0}if((cS(a,-1)|0)!=5){d=0;return d|0}c6(a);if((dH(a,-2)|0)==0){d=0;return d|0}e=c-1|0;while(1){if((cS(a,-2)|0)==4){if((cX(a,b,-1)|0)!=0){f=1270;break}if((eA(a,b,e)|0)!=0){f=1272;break}}cM(a,-2);if((dH(a,-2)|0)==0){d=0;f=1278;break}}if((f|0)==1272){cN(a,-2);da(a,4544,1)|0;cO(a,-2);dI(a,3);d=1;return d|0}else if((f|0)==1270){cM(a,-2);d=1;return d|0}else if((f|0)==1278){return d|0}return 0}function eB(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((d|0)==0){g=1283}else{if((e|0)==0){g=1283}else{h=d;i=e&255}}if((g|0)==1283){h=0;i=0}g=c[b+16>>2]|0;if((a[g+18|0]&1)!=0){c[b+20>>2]=c[g+28>>2]}c[b+52>>2]=h;c[b+44>>2]=f;c[b+48>>2]=f;a[b+40|0]=i;return 1}function eC(a){a=a|0;return c[a+52>>2]|0}function eD(a){a=a|0;return d[a+40|0]|0|0}function eE(a){a=a|0;return c[a+44>>2]|0}function eF(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;L1587:do{if((b|0)<0){e=0}else{f=c[a+16>>2]|0;if((b|0)>0){g=a+72|0;h=b;i=f;do{if((i|0)==(g|0)){e=0;break L1587}h=h-1|0;i=c[i+8>>2]|0;}while((h|0)>0);if((h|0)==0){j=i}else{e=0;break}}else{j=f}if((j|0)==(a+72|0)){e=0;break}c[d+96>>2]=j;e=1}}while(0);return e|0}function eG(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+8|0;f=e|0;if((b|0)==0){g=c[a+8>>2]|0;if((c[g-16+8>>2]|0)!=70){h=0;i=e;return h|0}h=fg(c[(c[g-16>>2]|0)+12>>2]|0,d,0)|0;i=e;return h|0}else{c[f>>2]=0;g=eH(a,c[b+96>>2]|0,d,f)|0;if((g|0)==0){h=0;i=e;return h|0}d=c[f>>2]|0;f=a+8|0;a=c[f>>2]|0;b=d;j=a;k=c[b+4>>2]|0;c[j>>2]=c[b>>2];c[j+4>>2]=k;c[a+8>>2]=c[d+8>>2];c[f>>2]=(c[f>>2]|0)+16;h=g;i=e;return h|0}return 0}function eH(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;do{if((a[e+18|0]&1)==0){h=(c[e>>2]|0)+16|0;i=1315}else{if((f|0)>=0){j=c[e+24>>2]|0;k=c[(c[c[e>>2]>>2]|0)+12>>2]|0;l=fg(k,f,((c[e+28>>2]|0)-(c[k+12>>2]|0)>>2)-1|0)|0;if((l|0)==0){h=j;i=1315;break}else{m=l;n=j;break}}j=c[e>>2]|0;l=d[(c[(c[j>>2]|0)+12>>2]|0)+76|0]|0;if((((c[e+24>>2]|0)-j>>4)-l|0)<=(-f|0)){o=0;return o|0}c[g>>2]=j+(l-f<<4);o=8488;return o|0}}while(0);do{if((i|0)==1315){if((c[b+16>>2]|0)==(e|0)){p=b+8|0}else{p=c[e+12>>2]|0}if(((c[p>>2]|0)-h>>4|0)>=(f|0)&(f|0)>0){m=8736;n=h;break}else{o=0}return o|0}}while(0);c[g>>2]=n+(f-1<<4);o=m;return o|0}function eI(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+8|0;f=e|0;c[f>>2]=0;g=eH(a,c[b+96>>2]|0,d,f)|0;d=a+8|0;if((g|0)==0){h=c[d>>2]|0;j=h-16|0;c[d>>2]=j;i=e;return g|0}a=c[d>>2]|0;b=c[f>>2]|0;f=a-16|0;k=b;l=c[f+4>>2]|0;c[k>>2]=c[f>>2];c[k+4>>2]=l;c[b+8>>2]=c[a-16+8>>2];h=c[d>>2]|0;j=h-16|0;c[d>>2]=j;i=e;return g|0}function eJ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;f=i;i=i+16|0;g=f|0;if((a[d]|0)==62){h=b+8|0;j=(c[h>>2]|0)-16|0;c[h>>2]=j;k=d+1|0;l=0;m=j}else{j=c[e+96>>2]|0;k=d;l=j;m=c[j>>2]|0}j=m+8|0;if((c[j>>2]&31|0)==6){n=c[m>>2]|0}else{n=0}d=a[k]|0;L1643:do{if(d<<24>>24==0){o=1}else{h=(n|0)==0;p=e+16|0;q=e+24|0;r=e+28|0;s=e+12|0;t=e+36|0;u=n+4|0;v=n+12|0;w=(l|0)==0;x=e+20|0;y=l+18|0;z=l|0;A=l+28|0;B=e+32|0;C=e+34|0;D=e+33|0;E=n+6|0;F=e+35|0;G=e+8|0;H=e+4|0;I=l+8|0;J=b+12|0;K=k;L=1;M=d;while(1){L1647:do{switch(M<<24>>24|0){case 83:{do{if(h){N=1340}else{if((a[u]|0)==38){N=1340;break}O=c[v>>2]|0;P=c[O+36>>2]|0;if((P|0)==0){Q=9360}else{Q=P+16|0}c[p>>2]=Q;P=c[O+64>>2]|0;c[q>>2]=P;c[r>>2]=c[O+68>>2];R=Q;S=(P|0)==0?9120:8952}}while(0);if((N|0)==1340){N=0;c[p>>2]=9824;c[q>>2]=-1;c[r>>2]=-1;R=9824;S=9576}c[s>>2]=S;gX(t,R,60);T=L;break};case 108:{do{if(w){U=-1}else{if((a[y]&1)==0){U=-1;break}P=c[(c[c[z>>2]>>2]|0)+12>>2]|0;O=c[P+20>>2]|0;if((O|0)==0){U=0;break}U=c[O+(((c[A>>2]|0)-(c[P+12>>2]|0)>>2)-1<<2)>>2]|0}}while(0);c[x>>2]=U;T=L;break};case 117:{do{if(h){a[B]=0}else{a[B]=a[E]|0;if((a[u]|0)==38){break}a[C]=a[(c[v>>2]|0)+77|0]|0;a[D]=a[(c[v>>2]|0)+76|0]|0;T=L;break L1647}}while(0);a[C]=1;a[D]=0;T=L;break};case 116:{if(w){V=0}else{V=a[y]&64}a[F]=V;T=L;break};case 110:{L1675:do{if(w){N=1376}else{if((a[y]&64)!=0){N=1376;break}P=c[I>>2]|0;if((a[P+18|0]&1)==0){N=1376;break}O=c[(c[c[P>>2]>>2]|0)+12>>2]|0;W=c[O+12>>2]|0;X=((c[P+28>>2]|0)-W>>2)-1|0;P=c[W+(X<<2)>>2]|0;switch(P&63|0){case 8:case 10:{Y=1;N=1375;break};case 24:{Y=5;N=1375;break};case 13:{Y=6;N=1375;break};case 14:{Y=7;N=1375;break};case 15:{Y=8;N=1375;break};case 16:{Y=9;N=1375;break};case 17:{Y=10;N=1375;break};case 18:{Y=11;N=1375;break};case 19:{Y=12;N=1375;break};case 21:{Y=4;N=1375;break};case 25:{Y=13;N=1375;break};case 26:{Y=14;N=1375;break};case 22:{Y=15;N=1375;break};case 12:case 6:case 7:{Y=0;N=1375;break};case 34:{Z=10264;_=10264;break};case 29:case 30:{W=eL(O,X,P>>>6&255,H)|0;c[G>>2]=W;if((W|0)==0){break L1675}else{T=L;break L1647}break};default:{N=1376;break L1675}}if((N|0)==1375){N=0;Z=10032;_=(c[(c[J>>2]|0)+184+(Y<<2)>>2]|0)+16|0}c[H>>2]=_;c[G>>2]=Z;T=L;break L1647}}while(0);if((N|0)==1376){N=0;c[G>>2]=0}c[G>>2]=12160;c[H>>2]=0;T=L;break};case 76:case 102:{T=L;break};default:{T=0}}}while(0);W=K+1|0;P=a[W]|0;if(P<<24>>24==0){o=T;break L1643}else{K=W;L=T;M=P}}}}while(0);if((aT(k|0,102)|0)!=0){T=b+8|0;N=c[T>>2]|0;Z=m;m=N;_=c[Z+4>>2]|0;c[m>>2]=c[Z>>2];c[m+4>>2]=_;c[N+8>>2]=c[j>>2];c[T>>2]=(c[T>>2]|0)+16}if((aT(k|0,76)|0)==0){i=f;return o|0}do{if((n|0)!=0){if((a[n+4|0]|0)==38){break}k=n+12|0;T=c[(c[k>>2]|0)+20>>2]|0;j=h9(b)|0;N=b+8|0;_=c[N>>2]|0;c[_>>2]=j;c[_+8>>2]=69;c[N>>2]=(c[N>>2]|0)+16;c[g>>2]=1;c[g+8>>2]=1;if((c[(c[k>>2]|0)+52>>2]|0)>0){$=0}else{i=f;return o|0}do{h6(b,j,c[T+($<<2)>>2]|0,g);$=$+1|0;}while(($|0)<(c[(c[k>>2]|0)+52>>2]|0));i=f;return o|0}}while(0);$=b+8|0;c[(c[$>>2]|0)+8>>2]=0;c[$>>2]=(c[$>>2]|0)+16;i=f;return o|0}function eK(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;i=i+8|0;h=g|0;g=c[b+16>>2]|0;c[h>>2]=0;j=c[1136+((c[e+8>>2]&15)+1<<2)>>2]|0;if((a[g+18|0]&1)==0){eM(b,11120,(k=i,i=i+16|0,c[k>>2]=f,c[k+8>>2]=j,k)|0);i=k}l=c[c[g>>2]>>2]|0;m=d[l+6|0]|0;n=l+16|0;o=0;while(1){if((o|0)>=(m|0)){break}if((c[(c[n+(o<<2)>>2]|0)+8>>2]|0)==(e|0)){p=1399;break}else{o=o+1|0}}if((p|0)==1399){n=c[(c[(c[l+12>>2]|0)+28>>2]|0)+(o<<3)>>2]|0;if((n|0)==0){q=10752}else{q=n+16|0}c[h>>2]=q;r=11568;s=q;eM(b,7768,(k=i,i=i+32|0,c[k>>2]=f,c[k+8>>2]=r,c[k+16>>2]=s,c[k+24>>2]=j,k)|0);i=k}q=c[g+24>>2]|0;n=c[g+4>>2]|0;o=q;while(1){if(o>>>0>=n>>>0){p=1411;break}if((o|0)==(e|0)){break}else{o=o+16|0}}if((p|0)==1411){eM(b,11120,(k=i,i=i+16|0,c[k>>2]=f,c[k+8>>2]=j,k)|0);i=k}p=c[l+12>>2]|0;l=eL(p,((c[g+28>>2]|0)-(c[p+12>>2]|0)>>2)-1|0,e-q>>4,h)|0;if((l|0)==0){eM(b,11120,(k=i,i=i+16|0,c[k>>2]=f,c[k+8>>2]=j,k)|0);i=k}r=l;s=c[h>>2]|0;eM(b,7768,(k=i,i=i+32|0,c[k>>2]=f,c[k+8>>2]=r,c[k+16>>2]=s,c[k+24>>2]=j,k)|0);i=k}function eL(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=b+12|0;h=e;e=d;L1744:while(1){d=fg(b,h+1|0,e)|0;c[f>>2]=d;if((d|0)!=0){i=3320;j=1456;break}if((e|0)<=0){i=0;j=1457;break}k=c[g>>2]|0;d=-1;l=0;while(1){m=c[k+(l<<2)>>2]|0;n=m&63;o=m>>>6&255;L1750:do{switch(n|0){case 4:{if((o|0)>(h|0)){p=l;q=d;break L1750}p=l;q=(o+(m>>>23)|0)<(h|0)?d:l;break};case 34:{p=l;q=(o+2|0)>(h|0)?d:l;break};case 27:{p=l;q=(o|0)==(h|0)?l:d;break};case 23:{r=(m>>>14)-131071|0;s=l+1+r|0;p=((l|0)>=(s|0)|(s|0)>(e|0)?0:r)+l|0;q=d;break};case 29:case 30:{p=l;q=(o|0)>(h|0)?d:l;break};default:{p=l;q=(a[1256+n|0]&64)!=0&(o|0)==(h|0)?l:d}}}while(0);o=p+1|0;if((o|0)<(e|0)){d=q;l=o}else{break}}if((q|0)==-1){i=0;j=1458;break}t=c[k+(q<<2)>>2]|0;u=t&63;switch(u|0){case 0:{break};case 6:case 7:{j=1430;break L1744;break};case 5:{j=1442;break L1744;break};case 1:{j=1445;break L1744;break};case 2:{j=1446;break L1744;break};case 12:{j=1449;break L1744;break};default:{i=0;j=1459;break L1744}}l=t>>>23;if(l>>>0<(t>>>6&255)>>>0){h=l;e=q}else{i=0;j=1460;break}}if((j|0)==1456){return i|0}else if((j|0)==1457){return i|0}else if((j|0)==1458){return i|0}else if((j|0)==1459){return i|0}else if((j|0)==1460){return i|0}else if((j|0)==1430){e=t>>>14;h=e&511;p=t>>>23;do{if((u|0)==7){v=fg(b,p+1|0,q)|0}else{g=c[(c[b+28>>2]|0)+(p<<3)>>2]|0;if((g|0)==0){v=10752;break}v=g+16|0}}while(0);do{if((e&256|0)==0){p=eL(b,q,h,f)|0;if((p|0)==0){j=1439;break}if((a[p]|0)!=99){j=1439}}else{p=e&255;u=c[b+8>>2]|0;if((c[u+(p<<4)+8>>2]&15|0)!=4){j=1439;break}c[f>>2]=(c[u+(p<<4)>>2]|0)+16}}while(0);if((j|0)==1439){c[f>>2]=10752}if((v|0)==0){i=11984;return i|0}e=(aJ(v|0,3e3)|0)==0;i=e?2680:11984;return i|0}else if((j|0)==1442){e=c[(c[b+28>>2]|0)+(t>>>23<<3)>>2]|0;if((e|0)==0){w=10752}else{w=e+16|0}c[f>>2]=w;i=11568;return i|0}else if((j|0)==1445){x=t>>>14}else if((j|0)==1446){x=(c[k+(q+1<<2)>>2]|0)>>>6}else if((j|0)==1449){j=t>>>14;do{if((j&256|0)==0){t=eL(b,q,j&511,f)|0;if((t|0)==0){break}if((a[t]|0)==99){i=11016}else{break}return i|0}else{t=j&255;k=c[b+8>>2]|0;if((c[k+(t<<4)+8>>2]&15|0)!=4){break}c[f>>2]=(c[k+(t<<4)>>2]|0)+16;i=11016;return i|0}}while(0);c[f>>2]=10752;i=11016;return i|0}j=c[b+8>>2]|0;if((c[j+(x<<4)+8>>2]&15|0)!=4){i=0;return i|0}c[f>>2]=(c[j+(x<<4)>>2]|0)+16;i=11320;return i|0}function eM(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+80|0;g=f|0;h=f+64|0;f=h;c[f>>2]=e;c[f+4>>2]=0;f=gV(b,d,h|0)|0;h=g|0;d=c[b+16>>2]|0;if((a[d+18|0]&1)==0){eQ(b)}e=c[(c[c[d>>2]>>2]|0)+12>>2]|0;j=c[e+20>>2]|0;if((j|0)==0){k=0}else{k=c[j+(((c[d+28>>2]|0)-(c[e+12>>2]|0)>>2)-1<<2)>>2]|0}d=c[e+36>>2]|0;if((d|0)==0){a[h]=63;a[g+1|0]=0}else{gX(h,d+16|0,60)}gW(b,3792,(d=i,i=i+24|0,c[d>>2]=h,c[d+8>>2]=k,c[d+16>>2]=f,d)|0)|0;i=d;eQ(b)}function eN(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=c[b+8>>2]|0;eK(a,(e&15|0)==4|(e|0)==3?d:b,8864)}function eO(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;i=i+16|0;e=(iA(b,d|0)|0)==0;eK(a,e?b:c,6848)}function eP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[1136+((c[b+8>>2]&15)+1<<2)>>2]|0;b=c[1136+((c[d+8>>2]&15)+1<<2)>>2]|0;if((e|0)==(b|0)){eM(a,5256,(f=i,i=i+8|0,c[f>>2]=e,f)|0);i=f}else{eM(a,4144,(f=i,i=i+16|0,c[f>>2]=e,c[f+8>>2]=b,f)|0);i=f}}function eQ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;b=c[a+68>>2]|0;if((b|0)==0){eR(a,2)}d=c[a+28>>2]|0;e=d+(b+8)|0;if((c[e>>2]&15|0)!=6){eR(a,6)}f=a+8|0;g=c[f>>2]|0;h=g-16|0;i=g;j=c[h+4>>2]|0;c[i>>2]=c[h>>2];c[i+4>>2]=j;c[g+8>>2]=c[g-16+8>>2];g=c[f>>2]|0;j=d+b|0;b=g-16|0;d=c[j+4>>2]|0;c[b>>2]=c[j>>2];c[b+4>>2]=d;c[g-16+8>>2]=c[e>>2];e=c[f>>2]|0;c[f>>2]=e+16;eZ(a,e-16|0,1,0);eR(a,2)}function eR(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=b+64|0;f=c[e>>2]|0;if((f|0)!=0){c[f+160>>2]=d;b$((c[e>>2]|0)+4|0,1)}a[b+6|0]=d&255;e=b+12|0;f=c[e>>2]|0;g=c[f+172>>2]|0;if((c[g+64>>2]|0)!=0){h=c[b+8>>2]|0;i=g+8|0;g=c[i>>2]|0;c[i>>2]=g+16;i=h-16|0;j=g;k=c[i+4>>2]|0;c[j>>2]=c[i>>2];c[j+4>>2]=k;c[g+8>>2]=c[h-16+8>>2];eR(c[(c[e>>2]|0)+172>>2]|0,d)}d=c[f+168>>2]|0;if((d|0)==0){bL()}cf[d&511](b)|0;bL()}function eS(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+168|0;g=1;h=0;j=i;i=i+168|0;c[j>>2]=0;while(1)switch(g|0){case 1:k=f|0;l=a+38|0;m=b[l>>1]|0;n=k+160|0;c[n>>2]=0;o=a+64|0;p=k|0;c[p>>2]=c[o>>2];c[o>>2]=k;q=kW(k+4|0,g,j)|0;g=4;break;case 4:if((q|0)==0){g=2;break}else{g=3;break};case 2:ai(d|0,a|0,e|0);if((r|0)!=0&(s|0)!=0){h=kX(c[r>>2]|0,j)|0;if((h|0)>0){g=-1;break}else return 0}r=s=0;g=3;break;case 3:c[o>>2]=c[p>>2];b[l>>1]=m;i=f;return c[n>>2]|0;case-1:if((h|0)==1){q=s;g=4}r=s=0;break}return 0}function eT(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=b+28|0;f=c[e>>2]|0;g=b+32|0;h=c[g>>2]|0;if((d+1|0)>>>0>268435455){gy(b)}i=gz(b,f,h<<4,d<<4)|0;c[e>>2]=i;if((h|0)<(d|0)){j=h;h=i;while(1){c[h+(j<<4)+8>>2]=0;k=j+1|0;l=c[e>>2]|0;if((k|0)<(d|0)){j=k;h=l}else{m=l;break}}}else{m=i}c[g>>2]=d;c[b+24>>2]=m+(d-5<<4);d=b+8|0;g=f;c[d>>2]=m+((c[d>>2]|0)-g>>4<<4);d=c[b+56>>2]|0;do{if((d|0)!=0){f=d+8|0;c[f>>2]=m+((c[f>>2]|0)-g>>4<<4);f=c[d>>2]|0;if((f|0)==0){break}else{n=f}do{f=n+8|0;c[f>>2]=(c[e>>2]|0)+((c[f>>2]|0)-g>>4<<4);n=c[n>>2]|0;}while((n|0)!=0)}}while(0);n=c[b+16>>2]|0;if((n|0)==0){return}else{o=n}do{n=o+4|0;c[n>>2]=(c[e>>2]|0)+((c[n>>2]|0)-g>>4<<4);n=o|0;c[n>>2]=(c[e>>2]|0)+((c[n>>2]|0)-g>>4<<4);if((a[o+18|0]&1)!=0){n=o+24|0;c[n>>2]=(c[e>>2]|0)+((c[n>>2]|0)-g>>4<<4)}o=c[o+8>>2]|0;}while((o|0)!=0);return}function eU(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=c[a+32>>2]|0;if((e|0)>1e6){eR(a,6)}f=b+5+((c[a+8>>2]|0)-(c[a+28>>2]|0)>>4)|0;b=e<<1;e=(b|0)>1e6?1e6:b;b=(e|0)<(f|0)?f:e;if((b|0)>1e6){eT(a,1000200);eM(a,3912,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e}else{eT(a,b);i=d;return}}function eV(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=c[a+8>>2]|0;d=c[a+16>>2]|0;if((d|0)==0){e=b}else{f=b;b=d;while(1){d=c[b+4>>2]|0;g=f>>>0<d>>>0?d:f;d=c[b+8>>2]|0;if((d|0)==0){e=g;break}else{f=g;b=d}}}b=(e-(c[a+28>>2]|0)>>4)+1|0;e=((b|0)/8|0)+10+b|0;f=(e|0)>1e6?1e6:e;if((b|0)>1e6){return}if((f|0)>=(c[a+32>>2]|0)){return}eT(a,f);return}function eW(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+104|0;g=f|0;h=c[b+52>>2]|0;if((h|0)==0){i=f;return}j=b+41|0;if((a[j]|0)==0){i=f;return}k=c[b+16>>2]|0;l=b+8|0;m=c[l>>2]|0;n=b+28|0;o=m;p=c[n>>2]|0;q=o-p|0;r=k+4|0;s=(c[r>>2]|0)-p|0;c[g>>2]=d;c[g+20>>2]=e;c[g+96>>2]=k;do{if(((c[b+24>>2]|0)-o|0)<336){e=c[b+32>>2]|0;if((e|0)>1e6){eR(b,6)}d=(q>>4)+25|0;p=e<<1;e=(p|0)>1e6?1e6:p;p=(e|0)<(d|0)?d:e;if((p|0)>1e6){eT(b,1000200);eM(b,3912,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e}else{eT(b,p);t=c[l>>2]|0;break}}else{t=m}}while(0);c[r>>2]=t+320;a[j]=0;t=k+18|0;a[t]=a[t]|2;ch[h&31](b,g);a[j]=1;c[r>>2]=(c[n>>2]|0)+s;c[l>>2]=(c[n>>2]|0)+q;a[t]=a[t]&-3;i=f;return}function eX(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;h=i;j=e+28|0;k=e+8|0;l=e+24|0;m=e+32|0;n=f;while(1){o=c[j>>2]|0;f=n;p=o;q=f-p|0;r=c[n+8>>2]&63;if((r|0)==38){s=1544;break}else if((r|0)==22){s=1543;break}else if((r|0)==6){s=1558;break}r=iv(e,n,16)|0;t=f-(c[j>>2]|0)|0;f=r+8|0;if((c[f>>2]&15|0)!=6){s=1582;break}u=c[k>>2]|0;if(u>>>0>n>>>0){v=u;while(1){w=v-16|0;x=w;y=v;z=c[x+4>>2]|0;c[y>>2]=c[x>>2];c[y+4>>2]=z;c[v+8>>2]=c[v-16+8>>2];if(w>>>0>n>>>0){v=w}else{break}}A=c[k>>2]|0}else{A=u}v=A+16|0;c[k>>2]=v;w=v;if(((c[l>>2]|0)-w|0)<16){v=c[m>>2]|0;if((v|0)>1e6){s=1588;break}z=(w-(c[j>>2]|0)>>4)+5|0;w=v<<1;v=(w|0)>1e6?1e6:w;w=(v|0)<(z|0)?z:v;if((w|0)>1e6){s=1590;break}eT(e,w)}w=c[j>>2]|0;v=w+t|0;z=r;y=v;x=c[z+4>>2]|0;c[y>>2]=c[z>>2];c[y+4>>2]=x;c[w+(t+8)>>2]=c[f>>2];n=v}if((s|0)==1544){B=(c[n>>2]|0)+12|0}else if((s|0)==1582){eK(e,n,11504);return 0}else if((s|0)==1588){eR(e,6);return 0}else if((s|0)==1590){eT(e,1000200);eM(e,3912,(C=i,i=i+1|0,i=i+7&-8,c[C>>2]=0,C)|0);i=C;return 0}else if((s|0)==1543){B=n}else if((s|0)==1558){s=c[(c[n>>2]|0)+12>>2]|0;n=c[k>>2]|0;A=n;v=s+78|0;w=d[v]|0;do{if(((c[l>>2]|0)-A>>4|0)>(w|0)){D=o;E=n}else{x=c[m>>2]|0;if((x|0)>1e6){eR(e,6);return 0}y=w+5+(A-p>>4)|0;z=x<<1;x=(z|0)>1e6?1e6:z;z=(x|0)<(y|0)?y:x;if((z|0)>1e6){eT(e,1000200);eM(e,3912,(C=i,i=i+1|0,i=i+7&-8,c[C>>2]=0,C)|0);i=C;return 0}else{eT(e,z);D=c[j>>2]|0;E=c[k>>2]|0;break}}}while(0);A=D;D=A+q|0;w=D;n=(E-D>>4)-1|0;D=s+76|0;o=a[D]|0;L1933:do{if((n|0)<(o&255|0)){z=n;x=E;while(1){c[k>>2]=x+16;c[x+8>>2]=0;y=z+1|0;F=a[D]|0;if((y|0)>=(F&255|0)){G=y;H=F;break L1933}z=y;x=c[k>>2]|0}}else{G=n;H=o}}while(0);do{if((a[s+77|0]|0)==0){I=A+(q+16)|0}else{o=H&255;n=c[k>>2]|0;if(H<<24>>24==0){I=n;break}D=-G|0;c[k>>2]=n+16;E=n+(D<<4)|0;x=n;z=c[E+4>>2]|0;c[x>>2]=c[E>>2];c[x+4>>2]=z;z=n+(D<<4)+8|0;c[n+8>>2]=c[z>>2];c[z>>2]=0;if((H&255)>1){J=1}else{I=n;break}while(1){z=c[k>>2]|0;D=J-G|0;c[k>>2]=z+16;x=n+(D<<4)|0;E=z;f=c[x+4>>2]|0;c[E>>2]=c[x>>2];c[E+4>>2]=f;f=n+(D<<4)+8|0;c[z+8>>2]=c[f>>2];c[f>>2]=0;f=J+1|0;if((f|0)<(o|0)){J=f}else{I=n;break}}}}while(0);J=e+16|0;G=c[(c[J>>2]|0)+12>>2]|0;if((G|0)==0){K=hv(e)|0}else{K=G}c[J>>2]=K;b[K+16>>1]=g&65535;c[K>>2]=w;c[K+24>>2]=I;w=I+(d[v]<<4)|0;c[K+4>>2]=w;v=K+28|0;c[v>>2]=c[s+12>>2];s=K+18|0;a[s]=1;c[k>>2]=w;if((c[(c[e+12>>2]|0)+12>>2]|0)>0){fv(e)}if((a[e+40|0]&1)==0){L=0;i=h;return L|0}c[v>>2]=(c[v>>2]|0)+4;w=c[K+8>>2]|0;do{if((a[w+18|0]&1)==0){M=0}else{if((c[(c[w+28>>2]|0)-4>>2]&63|0)!=30){M=0;break}a[s]=a[s]|64;M=4}}while(0);eW(e,M,-1);c[v>>2]=(c[v>>2]|0)-4;L=0;i=h;return L|0}v=c[B>>2]|0;B=c[k>>2]|0;do{if(((c[l>>2]|0)-B|0)<336){M=c[m>>2]|0;if((M|0)>1e6){eR(e,6);return 0}s=(B-p>>4)+25|0;w=M<<1;M=(w|0)>1e6?1e6:w;w=(M|0)<(s|0)?s:M;if((w|0)>1e6){eT(e,1000200);eM(e,3912,(C=i,i=i+1|0,i=i+7&-8,c[C>>2]=0,C)|0);i=C;return 0}else{eT(e,w);break}}}while(0);C=e+16|0;p=c[(c[C>>2]|0)+12>>2]|0;if((p|0)==0){N=hv(e)|0}else{N=p}c[C>>2]=N;b[N+16>>1]=g&65535;c[N>>2]=(c[j>>2]|0)+q;c[N+4>>2]=(c[k>>2]|0)+320;a[N+18|0]=0;if((c[(c[e+12>>2]|0)+12>>2]|0)>0){fv(e)}if((a[e+40|0]&1)!=0){eW(e,0,-1)}N=cf[v&511](e)|0;eY(e,(c[k>>2]|0)+(-N<<4)|0)|0;L=1;i=h;return L|0}function eY(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=a+16|0;g=c[f>>2]|0;h=d[a+40|0]|0;if((h&6|0)==0){i=e;j=g+8|0}else{if((h&2|0)==0){k=e}else{h=a+28|0;l=e-(c[h>>2]|0)|0;eW(a,1,-1);k=(c[h>>2]|0)+l|0}l=g+8|0;c[a+20>>2]=c[(c[l>>2]|0)+28>>2];i=k;j=l}l=c[g>>2]|0;k=b[g+16>>1]|0;g=k<<16>>16;c[f>>2]=c[j>>2];j=a+8|0;if(k<<16>>16==0){m=l;c[j>>2]=m;n=g+1|0;return n|0}else{o=g;p=l;q=i}while(1){if(q>>>0>=(c[j>>2]|0)>>>0){break}i=p+16|0;l=q;k=p;a=c[l+4>>2]|0;c[k>>2]=c[l>>2];c[k+4>>2]=a;c[p+8>>2]=c[q+8>>2];a=o-1|0;if((a|0)==0){m=i;r=1610;break}else{o=a;p=i;q=q+16|0}}if((r|0)==1610){c[j>>2]=m;n=g+1|0;return n|0}if((o|0)>0){s=o;t=p}else{m=p;c[j>>2]=m;n=g+1|0;return n|0}while(1){r=s-1|0;c[t+8>>2]=0;if((r|0)>0){s=r;t=t+16|0}else{break}}m=p+(o<<4)|0;c[j>>2]=m;n=g+1|0;return n|0}function eZ(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=a+38|0;j=(b[h>>1]|0)+1&65535;b[h>>1]=j;do{if((j&65535)>199){if(j<<16>>16==200){eM(a,10392,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k}if((j&65535)<=224){break}eR(a,6)}}while(0);j=(f|0)!=0;if(!j){f=a+36|0;b[f>>1]=(b[f>>1]|0)+1&65535}if((eX(a,d,e)|0)==0){iM(a)}if(j){l=b[h>>1]|0;m=l-1&65535;b[h>>1]=m;i=g;return}j=a+36|0;b[j>>1]=(b[j>>1]|0)-1&65535;l=b[h>>1]|0;m=l-1&65535;b[h>>1]=m;i=g;return}function e_(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;if((f|0)==0){h=1}else{h=(b[f+38>>1]|0)+1&65535}f=e+38|0;b[f>>1]=h;h=e+36|0;b[h>>1]=0;i=e+8|0;j=eS(e,10,(c[i>>2]|0)+(-g<<4)|0)|0;if((j|0)==-1){k=2;b[h>>1]=1;l=b[f>>1]|0;m=l-1&65535;b[f>>1]=m;return k|0}if(j>>>0<=1){k=j;b[h>>1]=1;l=b[f>>1]|0;m=l-1&65535;b[f>>1]=m;return k|0}g=e+16|0;n=e+28|0;o=e+41|0;p=e+68|0;q=e+32|0;r=e+12|0;s=j;L2029:while(1){j=g;while(1){t=c[j>>2]|0;if((t|0)==0){break L2029}u=t+18|0;if((a[u]&16)==0){j=t+8|0}else{break}}j=c[n>>2]|0;v=c[t+20>>2]|0;w=j+v|0;fd(e,w);if((s|0)==4){x=c[(c[r>>2]|0)+180>>2]|0;c[w>>2]=x;c[j+(v+8)>>2]=d[x+4|0]|0|64}else if((s|0)==6){x=hH(e,2816,23)|0;c[w>>2]=x;c[j+(v+8)>>2]=d[x+4|0]|0|64}else{x=c[i>>2]|0;y=x-16|0;z=w;w=c[y+4>>2]|0;c[z>>2]=c[y>>2];c[z+4>>2]=w;c[j+(v+8)>>2]=c[x-16+8>>2]}x=j+(v+16)|0;c[i>>2]=x;c[g>>2]=t;a[o]=a[t+36|0]|0;b[h>>1]=0;v=x;x=t;do{j=c[x+4>>2]|0;v=v>>>0<j>>>0?j:v;x=c[x+8>>2]|0;}while((x|0)!=0);x=(v-(c[n>>2]|0)>>4)+1|0;j=((x|0)/8|0)+10+x|0;w=(j|0)>1e6?1e6:j;do{if((x|0)<=1e6){if((w|0)>=(c[q>>2]|0)){break}eT(e,w)}}while(0);c[p>>2]=c[t+32>>2];a[u]=a[u]|32;a[t+37|0]=s&255;w=eS(e,16,0)|0;if(w>>>0>1){s=w}else{k=w;A=1653;break}}if((A|0)==1653){b[h>>1]=1;l=b[f>>1]|0;m=l-1&65535;b[f>>1]=m;return k|0}a[e+6|0]=s&255;A=c[i>>2]|0;if((s|0)==4){t=c[(c[r>>2]|0)+180>>2]|0;c[A>>2]=t;c[A+8>>2]=d[t+4|0]|0|64}else if((s|0)==6){t=hH(e,2816,23)|0;c[A>>2]=t;c[A+8>>2]=d[t+4|0]|0|64}else{t=A-16|0;e=A;r=c[t+4>>2]|0;c[e>>2]=c[t>>2];c[e+4>>2]=r;c[A+8>>2]=c[A-16+8>>2]}r=A+16|0;c[i>>2]=r;c[(c[g>>2]|0)+4>>2]=r;k=s;b[h>>1]=1;l=b[f>>1]|0;m=l-1&65535;b[f>>1]=m;return k|0}function e$(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=d;g=c[b+16>>2]|0;if((e[b+38>>1]|0)>199){e5(b,10392,f)}h=b+6|0;i=a[h]|0;if((i<<24>>24|0)==1){a[h]=0;c[g>>2]=(c[b+28>>2]|0)+(c[g+20>>2]|0);h=g+18|0;j=a[h]|0;if((j&1)==0){k=c[g+28>>2]|0;if((k|0)==0){l=f}else{a[g+37|0]=1;a[h]=j|8;j=cf[k&511](b)|0;l=(c[b+8>>2]|0)+(-j<<4)|0}eY(b,l)|0}else{iM(b)}e0(b,0);return}else if((i<<24>>24|0)==0){if((g|0)!=(b+72|0)){e5(b,2544,f)}if((eX(b,d-16|0,-1)|0)!=0){return}iM(b);return}else{e5(b,11872,f)}}function e0(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=d+16|0;f=c[e>>2]|0;g=d+72|0;if((f|0)==(g|0)){return}h=d+8|0;i=d+68|0;j=f;do{f=j+18|0;k=a[f]|0;if((k&1)==0){if((k&16)!=0){a[f]=k&-17;c[i>>2]=c[j+32>>2]}do{if((b[j+16>>1]|0)==-1){k=(c[e>>2]|0)+4|0;l=c[h>>2]|0;if((c[k>>2]|0)>>>0>=l>>>0){break}c[k>>2]=l}}while(0);l=a[f]|0;if((l&32)==0){a[j+37|0]=1}a[f]=l&-57|8;l=cf[c[j+28>>2]&511](d)|0;k=(c[h>>2]|0)+(-l<<4)|0;eY(d,k)|0}else{iL(d);iM(d)}j=c[e>>2]|0;}while((j|0)!=(g|0));return}function e1(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;j=c[d+16>>2]|0;if((b[d+36>>1]|0)!=0){if((c[(c[d+12>>2]|0)+172>>2]|0)==(d|0)){eM(d,6312,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;return 0}else{eM(d,8168,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;return 0}}a[d+6|0]=1;k=j|0;c[j+20>>2]=(c[k>>2]|0)-(c[d+28>>2]|0);if((a[j+18|0]&1)!=0){i=h;return 0}c[j+28>>2]=g;if((g|0)==0){l=d+8|0;m=c[l>>2]|0;n=~e;o=m+(n<<4)|0;c[k>>2]=o;eR(d,1);return 0}c[j+24>>2]=f;l=d+8|0;m=c[l>>2]|0;n=~e;o=m+(n<<4)|0;c[k>>2]=o;eR(d,1);return 0}function e2(e,f,g,h,i){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;j=e+16|0;k=c[j>>2]|0;l=e+41|0;m=a[l]|0;n=e+36|0;o=b[n>>1]|0;p=e+68|0;q=c[p>>2]|0;c[p>>2]=i;i=eS(e,f,g)|0;if((i|0)==0){c[p>>2]=q;return i|0}g=e+28|0;f=c[g>>2]|0;r=f+h|0;fd(e,r);if((i|0)==6){s=hH(e,2816,23)|0;c[r>>2]=s;c[f+(h+8)>>2]=d[s+4|0]|0|64}else if((i|0)==4){s=c[(c[e+12>>2]|0)+180>>2]|0;c[r>>2]=s;c[f+(h+8)>>2]=d[s+4|0]|0|64}else{s=c[e+8>>2]|0;t=s-16|0;u=r;r=c[t+4>>2]|0;c[u>>2]=c[t>>2];c[u+4>>2]=r;c[f+(h+8)>>2]=c[s-16+8>>2]}s=f+(h+16)|0;c[e+8>>2]=s;c[j>>2]=k;a[l]=m;b[n>>1]=o;if((k|0)==0){v=s}else{o=s;s=k;while(1){k=c[s+4>>2]|0;n=o>>>0<k>>>0?k:o;k=c[s+8>>2]|0;if((k|0)==0){v=n;break}else{o=n;s=k}}}s=(v-(c[g>>2]|0)>>4)+1|0;g=((s|0)/8|0)+10+s|0;v=(g|0)>1e6?1e6:g;if((s|0)>1e6){c[p>>2]=q;return i|0}if((v|0)>=(c[e+32>>2]|0)){c[p>>2]=q;return i|0}eT(e,v);c[p>>2]=q;return i|0}function e3(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+64|0;h=g|0;j=a+36|0;b[j>>1]=(b[j>>1]|0)+1&65535;c[h>>2]=d;c[h+56>>2]=e;c[h+52>>2]=f;f=h+16|0;c[f>>2]=0;e=h+24|0;c[e>>2]=0;d=h+28|0;c[d>>2]=0;k=h+36|0;c[k>>2]=0;l=h+40|0;c[l>>2]=0;m=h+48|0;c[m>>2]=0;n=h+4|0;c[n>>2]=0;o=h+12|0;c[o>>2]=0;p=e2(a,8,h,(c[a+8>>2]|0)-(c[a+28>>2]|0)|0,c[a+68>>2]|0)|0;c[n>>2]=gz(a,c[n>>2]|0,c[o>>2]|0,0)|0;c[o>>2]=0;gz(a,c[f>>2]|0,c[e>>2]<<1,0)|0;gz(a,c[d>>2]|0,c[k>>2]<<4,0)|0;gz(a,c[l>>2]|0,c[m>>2]<<4,0)|0;b[j>>1]=(b[j>>1]|0)-1&65535;i=g;return p|0}function e4(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;g=e;h=c[g>>2]|0;j=c[h>>2]|0;c[h>>2]=j-1;h=c[g>>2]|0;if((j|0)==0){k=iN(h)|0}else{j=h+4|0;h=c[j>>2]|0;c[j>>2]=h+1;k=d[h]|0}h=c[e+52>>2]|0;j=(h|0)==0;if((k|0)==27){do{if(!j){if((aT(h|0,98)|0)!=0){break}gW(b,3160,(l=i,i=i+16|0,c[l>>2]=3968,c[l+8>>2]=h,l)|0)|0;i=l;eR(b,3)}}while(0);m=iw(b,c[g>>2]|0,e+4|0,c[e+56>>2]|0)|0}else{do{if(!j){if((aT(h|0,116)|0)!=0){break}gW(b,3160,(l=i,i=i+16|0,c[l>>2]=3648,c[l+8>>2]=h,l)|0)|0;i=l;eR(b,3)}}while(0);m=g8(b,c[g>>2]|0,e+4|0,e+16|0,c[e+56>>2]|0,k)|0}k=m+6|0;if((a[k]|0)==0){i=f;return}e=m+16|0;g=m+5|0;l=m;m=0;do{h=fa(b)|0;c[e+(m<<2)>>2]=h;j=h;do{if((a[h+5|0]&3)!=0){if((a[g]&4)==0){break}fh(b,l,j)}}while(0);m=m+1|0;}while((m|0)<(d[k]|0));i=f;return}function e5(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=a+8|0;c[f>>2]=e;g=hI(a,b)|0;c[e>>2]=g;c[e+8>>2]=d[g+4|0]|0|64;c[f>>2]=(c[f>>2]|0)+16;eR(a,-1)}function e6(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+48|0;h=g+24|0;c[h>>2]=a;c[h+4>>2]=d;c[h+8>>2]=e;c[h+12>>2]=f;f=h+16|0;j=g|0;iy(j);c[f>>2]=ci[d&7](a,j,18,e)|0;e7(b,h);i=g;return c[f>>2]|0}function e7(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0;e=i;i=i+216|0;f=e|0;g=e+8|0;j=e+16|0;k=e+24|0;l=e+32|0;m=e+40|0;n=e+48|0;o=e+56|0;p=e+64|0;q=e+72|0;r=e+80|0;s=e+88|0;t=e+96|0;u=e+104|0;v=e+112|0;w=e+120|0;x=e+128|0;y=e+136|0;z=e+144|0;A=e+152|0;B=e+160|0;C=e+168|0;D=e+176|0;E=e+184|0;F=e+192|0;G=e+200|0;H=e+208|0;c[w>>2]=c[b+64>>2];I=d+16|0;J=c[I>>2]|0;if((J|0)==0){K=ci[c[d+4>>2]&7](c[d>>2]|0,w,4,c[d+8>>2]|0)|0;c[I>>2]=K;L=K}else{L=J}c[v>>2]=c[b+68>>2];if((L|0)==0){J=ci[c[d+4>>2]&7](c[d>>2]|0,v,4,c[d+8>>2]|0)|0;c[I>>2]=J;M=J}else{M=L}a[u]=a[b+76|0]|0;if((M|0)==0){L=ci[c[d+4>>2]&7](c[d>>2]|0,u,1,c[d+8>>2]|0)|0;c[I>>2]=L;N=L}else{N=M}a[t]=a[b+77|0]|0;if((N|0)==0){M=ci[c[d+4>>2]&7](c[d>>2]|0,t,1,c[d+8>>2]|0)|0;c[I>>2]=M;O=M}else{O=N}a[s]=a[b+78|0]|0;if((O|0)==0){N=ci[c[d+4>>2]&7](c[d>>2]|0,s,1,c[d+8>>2]|0)|0;c[I>>2]=N;P=N}else{P=O}O=c[b+12>>2]|0;N=c[b+48>>2]|0;c[r>>2]=N;do{if((P|0)==0){s=d+4|0;M=d|0;t=d+8|0;L=ci[c[s>>2]&7](c[M>>2]|0,r,4,c[t>>2]|0)|0;c[I>>2]=L;if((L|0)!=0){Q=L;R=1751;break}L=ci[c[s>>2]&7](c[M>>2]|0,O,N<<2,c[t>>2]|0)|0;c[I>>2]=L;t=c[b+44>>2]|0;c[n>>2]=t;if((L|0)!=0){S=L;T=t;break}L=ci[c[d+4>>2]&7](c[d>>2]|0,n,4,c[d+8>>2]|0)|0;c[I>>2]=L;S=L;T=t}else{Q=P;R=1751}}while(0);if((R|0)==1751){P=c[b+44>>2]|0;c[n>>2]=P;S=Q;T=P}if((T|0)>0){P=b+8|0;Q=d+4|0;n=d|0;N=d+8|0;O=g;r=j;t=k;L=0;M=S;while(1){s=c[P>>2]|0;u=s+(L<<4)|0;J=s+(L<<4)+8|0;s=c[J>>2]|0;a[m]=s&15;if((M|0)==0){v=ci[c[Q>>2]&7](c[n>>2]|0,m,1,c[N>>2]|0)|0;c[I>>2]=v;U=v;V=c[J>>2]|0}else{U=M;V=s}s=V&15;do{if((s|0)==1){a[l]=c[u>>2]&255;if((U|0)!=0){W=U;break}J=ci[c[Q>>2]&7](c[n>>2]|0,l,1,c[N>>2]|0)|0;c[I>>2]=J;W=J}else if((s|0)==4){J=c[u>>2]|0;if((J|0)==0){c[g>>2]=0;if((U|0)!=0){W=U;break}v=ci[c[Q>>2]&7](c[n>>2]|0,O,4,c[N>>2]|0)|0;c[I>>2]=v;W=v;break}c[j>>2]=(c[J+12>>2]|0)+1;if((U|0)!=0){W=U;break}v=ci[c[Q>>2]&7](c[n>>2]|0,r,4,c[N>>2]|0)|0;c[I>>2]=v;if((v|0)!=0){W=v;break}v=ci[c[Q>>2]&7](c[n>>2]|0,J+16|0,c[j>>2]|0,c[N>>2]|0)|0;c[I>>2]=v;W=v}else if((s|0)==3){h[k>>3]=+h[u>>3];if((U|0)!=0){W=U;break}v=ci[c[Q>>2]&7](c[n>>2]|0,t,8,c[N>>2]|0)|0;c[I>>2]=v;W=v}else{W=U}}while(0);u=L+1|0;if((u|0)<(T|0)){L=u;M=W}else{X=W;break}}}else{X=S}S=c[b+56>>2]|0;c[f>>2]=S;if((X|0)==0){W=ci[c[d+4>>2]&7](c[d>>2]|0,f,4,c[d+8>>2]|0)|0;c[I>>2]=W;Y=W}else{Y=X}if((S|0)>0){X=b+16|0;W=0;do{e7(c[(c[X>>2]|0)+(W<<2)>>2]|0,d);W=W+1|0;}while((W|0)<(S|0));Z=c[I>>2]|0}else{Z=Y}Y=b+40|0;S=c[Y>>2]|0;c[q>>2]=S;if((Z|0)==0){W=ci[c[d+4>>2]&7](c[d>>2]|0,q,4,c[d+8>>2]|0)|0;c[I>>2]=W;_=W}else{_=Z}if((S|0)>0){Z=b+28|0;W=d+4|0;q=d|0;X=d+8|0;f=0;M=_;while(1){L=c[Z>>2]|0;a[p]=a[L+(f<<3)+4|0]|0;if((M|0)==0){T=ci[c[W>>2]&7](c[q>>2]|0,p,1,c[X>>2]|0)|0;c[I>>2]=T;$=c[Z>>2]|0;aa=T}else{$=L;aa=M}a[o]=a[$+(f<<3)+5|0]|0;if((aa|0)==0){L=ci[c[W>>2]&7](c[q>>2]|0,o,1,c[X>>2]|0)|0;c[I>>2]=L;ab=L}else{ab=aa}L=f+1|0;if((L|0)<(S|0)){f=L;M=ab}else{ac=ab;break}}}else{ac=_}_=d+12|0;do{if((c[_>>2]|0)==0){ab=c[b+36>>2]|0;M=G;f=H;if((ab|0)==0){ad=M;ae=f;R=1788;break}c[H>>2]=(c[ab+12>>2]|0)+1;if((ac|0)!=0){af=M;ag=f;break}S=d+4|0;aa=d|0;X=d+8|0;o=ci[c[S>>2]&7](c[aa>>2]|0,f,4,c[X>>2]|0)|0;c[I>>2]=o;if((o|0)!=0){af=M;ag=f;break}c[I>>2]=ci[c[S>>2]&7](c[aa>>2]|0,ab+16|0,c[H>>2]|0,c[X>>2]|0)|0;af=M;ag=f}else{ad=G;ae=H;R=1788}}while(0);do{if((R|0)==1788){c[G>>2]=0;if((ac|0)!=0){af=ad;ag=ae;break}c[I>>2]=ci[c[d+4>>2]&7](c[d>>2]|0,ad,4,c[d+8>>2]|0)|0;af=ad;ag=ae}}while(0);if((c[_>>2]|0)==0){ah=c[b+52>>2]|0}else{ah=0}ae=c[b+20>>2]|0;c[F>>2]=ah;ag=c[I>>2]|0;do{if((ag|0)==0){ad=d+4|0;af=d|0;ac=d+8|0;G=ci[c[ad>>2]&7](c[af>>2]|0,F,4,c[ac>>2]|0)|0;c[I>>2]=G;if((G|0)!=0){ai=G;break}G=ci[c[ad>>2]&7](c[af>>2]|0,ae,ah<<2,c[ac>>2]|0)|0;c[I>>2]=G;ai=G}else{ai=ag}}while(0);if((c[_>>2]|0)==0){aj=c[b+60>>2]|0}else{aj=0}c[E>>2]=aj;if((ai|0)==0){ag=ci[c[d+4>>2]&7](c[d>>2]|0,E,4,c[d+8>>2]|0)|0;c[I>>2]=ag;ak=ag}else{ak=ai}if((aj|0)>0){ai=b+24|0;ag=C;E=D;ah=d+4|0;ae=d|0;F=d+8|0;G=B;ac=A;af=0;ad=ak;while(1){R=c[(c[ai>>2]|0)+(af*12|0)>>2]|0;do{if((R|0)==0){c[C>>2]=0;if((ad|0)!=0){al=ad;break}H=ci[c[ah>>2]&7](c[ae>>2]|0,ag,4,c[F>>2]|0)|0;c[I>>2]=H;al=H}else{c[D>>2]=(c[R+12>>2]|0)+1;if((ad|0)!=0){al=ad;break}H=ci[c[ah>>2]&7](c[ae>>2]|0,E,4,c[F>>2]|0)|0;c[I>>2]=H;if((H|0)!=0){al=H;break}H=ci[c[ah>>2]&7](c[ae>>2]|0,R+16|0,c[D>>2]|0,c[F>>2]|0)|0;c[I>>2]=H;al=H}}while(0);R=c[ai>>2]|0;c[B>>2]=c[R+(af*12|0)+4>>2];if((al|0)==0){H=ci[c[ah>>2]&7](c[ae>>2]|0,G,4,c[F>>2]|0)|0;c[I>>2]=H;am=c[ai>>2]|0;an=H}else{am=R;an=al}c[A>>2]=c[am+(af*12|0)+8>>2];if((an|0)==0){R=ci[c[ah>>2]&7](c[ae>>2]|0,ac,4,c[F>>2]|0)|0;c[I>>2]=R;ao=R}else{ao=an}R=af+1|0;if((R|0)<(aj|0)){af=R;ad=ao}else{ap=ao;break}}}else{ap=ak}if((c[_>>2]|0)==0){aq=c[Y>>2]|0}else{aq=0}c[z>>2]=aq;if((ap|0)==0){Y=ci[c[d+4>>2]&7](c[d>>2]|0,z,4,c[d+8>>2]|0)|0;c[I>>2]=Y;ar=Y}else{ar=ap}if((aq|0)<=0){i=e;return}ap=b+28|0;b=x;Y=y;z=d+4|0;_=d|0;ak=d+8|0;d=0;ao=ar;while(1){ar=c[(c[ap>>2]|0)+(d<<3)>>2]|0;do{if((ar|0)==0){c[x>>2]=0;if((ao|0)!=0){as=ao;break}ad=ci[c[z>>2]&7](c[_>>2]|0,b,4,c[ak>>2]|0)|0;c[I>>2]=ad;as=ad}else{c[y>>2]=(c[ar+12>>2]|0)+1;if((ao|0)!=0){as=ao;break}ad=ci[c[z>>2]&7](c[_>>2]|0,Y,4,c[ak>>2]|0)|0;c[I>>2]=ad;if((ad|0)!=0){as=ad;break}ad=ci[c[z>>2]&7](c[_>>2]|0,ar+16|0,c[y>>2]|0,c[ak>>2]|0)|0;c[I>>2]=ad;as=ad}}while(0);ar=d+1|0;if((ar|0)<(aq|0)){d=ar;ao=as}else{break}}i=e;return}function e8(b,c){b=b|0;c=c|0;var d=0;d=fm(b,38,(c<<4)+16|0,0,0)|0;a[d+6|0]=c&255;return d|0}function e9(b,d){b=b|0;d=d|0;var e=0,f=0;e=fm(b,6,(d<<2)+16|0,0,0)|0;b=e|0;c[e+12>>2]=0;a[e+6|0]=d&255;if((d|0)==0){return b|0}f=e+16|0;e=d;do{e=e-1|0;c[f+(e<<2)>>2]=0;}while((e|0)!=0);return b|0}function fa(a){a=a|0;var b=0;b=fm(a,10,32,0,0)|0;c[b+8>>2]=b+16;c[b+24>>2]=0;return b|0}function fb(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=c[b+12>>2]|0;g=b+56|0;while(1){h=c[g>>2]|0;if((h|0)==0){i=1845;break}j=c[h+8>>2]|0;if(j>>>0<e>>>0){i=1845;break}k=h;if((j|0)==(e|0)){break}else{g=h|0}}if((i|0)==1845){i=fm(b,10,32,g,0)|0;g=i;c[i+8>>2]=e;e=i+16|0;c[e>>2]=f+112;i=f+132|0;b=c[i>>2]|0;c[e+4>>2]=b;c[b+16>>2]=g;c[i>>2]=g;l=g;return l|0}g=h+5|0;h=(d[g]|0)^3;if((((d[f+60|0]|0)^3)&h|0)!=0){l=k;return l|0}a[g]=h&255;l=k;return l|0}function fc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;if((c[b+8>>2]|0)==(b+16|0)){d=b;e=gz(a,d,32,0)|0;return}f=b+16|0;g=f;h=f+4|0;c[(c[h>>2]|0)+16>>2]=c[g>>2];c[(c[g>>2]|0)+20>>2]=c[h>>2];d=b;e=gz(a,d,32,0)|0;return}function fd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=c[a+12>>2]|0;f=a+56|0;g=c[f>>2]|0;if((g|0)==0){return}h=e+60|0;i=e+68|0;j=g;while(1){g=j;k=j+8|0;if((c[k>>2]|0)>>>0<b>>>0){l=1865;break}m=j|0;c[f>>2]=c[m>>2];if((((d[h]|0)^3)&((d[j+5|0]|0)^3)|0)==0){if((c[k>>2]|0)!=(j+16|0)){n=j+16|0;o=n;p=n+4|0;c[(c[p>>2]|0)+16>>2]=c[o>>2];c[(c[o>>2]|0)+20>>2]=c[p>>2]}p=j;gz(a,p,32,0)|0}else{p=j+16|0;o=p;n=p+4|0;c[(c[n>>2]|0)+16>>2]=c[o>>2];c[(c[o>>2]|0)+20>>2]=c[n>>2];n=c[k>>2]|0;o=j+16|0;p=n;q=o;r=c[p+4>>2]|0;c[q>>2]=c[p>>2];c[q+4>>2]=r;c[j+24>>2]=c[n+8>>2];c[k>>2]=o;c[m>>2]=c[i>>2];c[i>>2]=j;fl(e,g)}g=c[f>>2]|0;if((g|0)==0){l=1867;break}else{j=g}}if((l|0)==1867){return}else if((l|0)==1865){return}}function fe(b){b=b|0;var d=0;d=fm(b,9,80,0,0)|0;b=d;c[d+8>>2]=0;c[d+44>>2]=0;c[d+16>>2]=0;c[d+56>>2]=0;c[d+12>>2]=0;c[d+32>>2]=0;c[d+48>>2]=0;c[b+20>>2]=0;c[d+52>>2]=0;c[b+28>>2]=0;c[d+40>>2]=0;a[d+76|0]=0;a[d+77|0]=0;a[d+78|0]=0;c[d+24>>2]=0;c[d+60>>2]=0;c[d+64>>2]=0;c[d+68>>2]=0;c[d+36>>2]=0;return b|0}function ff(a,b){a=a|0;b=b|0;gz(a,c[b+12>>2]|0,c[b+48>>2]<<2,0)|0;gz(a,c[b+16>>2]|0,c[b+56>>2]<<2,0)|0;gz(a,c[b+8>>2]|0,c[b+44>>2]<<4,0)|0;gz(a,c[b+20>>2]|0,c[b+52>>2]<<2,0)|0;gz(a,c[b+24>>2]|0,(c[b+60>>2]|0)*12|0,0)|0;gz(a,c[b+28>>2]|0,c[b+40>>2]<<3,0)|0;gz(a,b,80,0)|0;return}function fg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+60>>2]|0;if((e|0)<=0){f=0;return f|0}g=c[a+24>>2]|0;a=b;b=0;while(1){if((c[g+(b*12|0)+4>>2]|0)>(d|0)){f=0;h=1880;break}if((c[g+(b*12|0)+8>>2]|0)>(d|0)){i=a-1|0;if((i|0)==0){h=1875;break}else{j=i}}else{j=a}i=b+1|0;if((i|0)<(e|0)){a=j;b=i}else{f=0;h=1878;break}}if((h|0)==1875){f=(c[g+(b*12|0)>>2]|0)+16|0;return f|0}else if((h|0)==1878){return f|0}else if((h|0)==1880){return f|0}return 0}function fh(b,e,f){b=b|0;e=e|0;f=f|0;var g=0;g=c[b+12>>2]|0;if((d[g+61|0]|0)<2){fi(g,f);return}else{f=e+5|0;a[f]=a[g+60|0]&3|a[f]&-72;return}}function fi(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=e+5|0;a[f]=a[f]&-4;L2359:do{switch(d[e+4|0]|0|0){case 4:case 20:{g=(c[e+12>>2]|0)+17|0;break};case 7:{h=c[e+8>>2]|0;do{if((h|0)!=0){if((a[h+5|0]&3)==0){break}fi(b,h)}}while(0);h=c[e+12>>2]|0;do{if((h|0)!=0){if((a[h+5|0]&3)==0){break}fi(b,h)}}while(0);g=(c[e+16>>2]|0)+24|0;break};case 10:{h=e+8|0;i=c[h>>2]|0;do{if((c[i+8>>2]&64|0)==0){j=i}else{k=c[i>>2]|0;if((a[k+5|0]&3)==0){j=i;break}fi(b,k);j=c[h>>2]|0}}while(0);if((j|0)==(e+16|0)){g=32;break L2359}return};case 6:{h=b+84|0;c[e+8>>2]=c[h>>2];c[h>>2]=e;return};case 5:{h=b+84|0;c[e+24>>2]=c[h>>2];c[h>>2]=e;return};case 38:{h=b+84|0;c[e+8>>2]=c[h>>2];c[h>>2]=e;return};case 8:{h=b+84|0;c[e+60>>2]=c[h>>2];c[h>>2]=e;return};case 9:{h=b+84|0;c[e+72>>2]=c[h>>2];c[h>>2]=e;return};default:{return}}}while(0);a[f]=a[f]|4;f=b+16|0;c[f>>2]=(c[f>>2]|0)+g;return}function fj(b,d){b=b|0;d=d|0;var e=0;e=c[b+12>>2]|0;b=d+5|0;a[b]=a[b]&-5;b=e+88|0;c[d+24>>2]=c[b>>2];c[b>>2]=d;return}function fk(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;if((c[e+32>>2]|0)!=0){g=c[b+12>>2]|0;h=e+5|0;a[h]=a[h]&-5;h=g+88|0;c[e+72>>2]=c[h>>2];c[h>>2]=e;return}if((a[f+5|0]&3)==0){return}h=e+5|0;e=a[h]|0;if((e&4)==0){return}g=c[b+12>>2]|0;if((d[g+61|0]|0)<2){fi(g,f);return}else{a[h]=a[g+60|0]&3|e&-72;return}}function fl(b,e){b=b|0;e=e|0;var f=0,g=0;f=e+5|0;g=a[f]|0;if((g&7)!=0){return}do{if((a[b+62|0]|0)!=2){if((d[b+61|0]|0)<2){break}a[f]=a[b+60|0]&3|g&-72;return}}while(0);a[f]=g&-69|4;g=c[e+8>>2]|0;if((c[g+8>>2]&64|0)==0){return}e=c[g>>2]|0;if((a[e+5|0]&3)==0){return}fi(b,e);return}function fm(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=c[b+12>>2]|0;i=gz(b,0,d&15,e)|0;e=i+g|0;b=e;j=(f|0)==0?h+68|0:f;a[i+(g+5)|0]=a[h+60|0]&3;a[i+(g+4)|0]=d&255;c[e>>2]=c[j>>2];c[j>>2]=b;return b|0}function fn(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=c[b+12>>2]|0;h=e+5|0;if((a[h]&24)!=0|(f|0)==0){return}if((a[f+6|0]&4)!=0){return}if((iu(f,2,c[g+192>>2]|0)|0)==0){return}f=g+76|0;i=c[f>>2]|0;j=e|0;if((i|0)==(j|0)){do{k=fr(b,i,1)|0;}while((k|0)==(i|0));c[f>>2]=k}k=g+68|0;while(1){f=c[k>>2]|0;if((f|0)==(e|0)){break}else{k=f|0}}c[k>>2]=c[j>>2];k=g+72|0;c[j>>2]=c[k>>2];c[k>>2]=e;e=a[h]|16;a[h]=e;if((d[g+61|0]|0)<2){a[h]=e&-65;return}else{a[h]=a[g+60|0]&3|e&-72;return}}function fo(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=b+12|0;g=c[f>>2]|0;h=g+62|0;if((d[h]|0)==(e|0)){return}if((e|0)==2){e=g+61|0;if((a[e]|0)!=0){do{fs(b)|0;}while((a[e]|0)!=0)}c[g+20>>2]=(c[g+12>>2]|0)+(c[g+8>>2]|0);a[h]=2;return}a[h]=0;h=c[f>>2]|0;a[h+61|0]=2;c[h+64>>2]=0;g=h+72|0;do{i=fr(b,g,1)|0;}while((i|0)==(g|0));c[h+80>>2]=i;i=h+68|0;do{j=fr(b,i,1)|0;}while((j|0)==(i|0));c[h+76>>2]=j;j=(c[f>>2]|0)+61|0;if((1<<d[j]&-29|0)!=0){return}do{fs(b)|0;}while((1<<d[j]&-29|0)==0);return}function fp(a,b){a=a|0;b=b|0;var e=0;e=(c[a+12>>2]|0)+61|0;if((1<<(d[e]|0)&b|0)!=0){return}do{fs(a)|0;}while((1<<(d[e]|0)&b|0)==0);return}function fq(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=b+12|0;e=c[d>>2]|0;f=e+104|0;while(1){g=c[f>>2]|0;if((g|0)==0){break}else{f=g|0}}g=e+72|0;h=c[g>>2]|0;if((h|0)==0){i=e}else{j=f;f=h;while(1){h=f+5|0;a[h]=a[h]|8;h=f|0;c[g>>2]=c[h>>2];c[h>>2]=c[j>>2];c[j>>2]=f;k=c[g>>2]|0;if((k|0)==0){break}else{j=h;f=k}}i=c[d>>2]|0}d=i+104|0;i=c[d>>2]|0;if((i|0)!=0){f=i;do{i=f+5|0;a[i]=a[i]&-65;fu(b,0);f=c[d>>2]|0;}while((f|0)!=0)}a[e+60|0]=3;a[e+62|0]=0;fr(b,g,-3)|0;fr(b,e+68|0,-3)|0;g=e+32|0;if((c[g>>2]|0)<=0){return}f=e+24|0;e=0;do{fr(b,(c[f>>2]|0)+(e<<2)|0,-3)|0;e=e+1|0;}while((e|0)<(c[g>>2]|0));return}function fr(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=b+12|0;h=c[g>>2]|0;i=a[h+60|0]|0;j=i&255^3;k=(a[h+62|0]|0)==2;h=k?-1:-72;l=k?64:i&3;i=k?64:0;k=c[e>>2]|0;L2495:do{if((k|0)==0){m=0;n=e}else{o=f;p=e;q=k;L2496:while(1){r=o-1|0;if((o|0)==0){m=q;n=p;break L2495}s=q+5|0;t=a[s]|0;u=t&255;L2499:do{if(((u^3)&j|0)==0){c[p>>2]=c[q>>2];switch(d[q+4|0]|0){case 20:{break};case 5:{ia(b,q);v=p;break L2499;break};case 6:{gz(b,q,(d[q+6|0]<<2)+16|0,0)|0;v=p;break L2499;break};case 38:{gz(b,q,(d[q+6|0]<<4)+16|0,0)|0;v=p;break L2499;break};case 7:{gz(b,q,(c[q+16>>2]|0)+24|0,0)|0;v=p;break L2499;break};case 4:{w=(c[g>>2]|0)+28|0;c[w>>2]=(c[w>>2]|0)-1;break};case 8:{hy(b,q);v=p;break L2499;break};case 9:{ff(b,q);v=p;break L2499;break};case 10:{fc(b,q);v=p;break L2499;break};default:{v=p;break L2499}}w=q;x=(c[q+12>>2]|0)+17|0;gz(b,w,x,0)|0;v=p}else{if((u&i|0)!=0){y=0;break L2496}do{if((a[q+4|0]|0)==8){x=q;if((c[x+28>>2]|0)==0){break}w=q+56|0;fr(b,w,-3)|0;hw(x);if((a[(c[g>>2]|0)+62|0]|0)==1){break}eV(x)}}while(0);a[s]=t&h|l;v=q|0}}while(0);t=c[v>>2]|0;if((t|0)==0){m=0;n=v;break L2495}else{o=r;p=v;q=t}}return y|0}}while(0);y=(m|0)==0?0:n;return y|0}function fs(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;e=i;i=i+8|0;f=e|0;g=b+12|0;h=c[g>>2]|0;j=h+61|0;switch(d[j]|0){case 2:{k=h+64|0;l=h+32|0;m=h+24|0;n=0;while(1){o=c[k>>2]|0;p=o+n|0;q=c[l>>2]|0;if((p|0)>=(q|0)){r=n;s=o;t=q;break}fr(b,(c[m>>2]|0)+(p<<2)|0,-3)|0;u=n+1|0;if((u|0)<80){n=u}else{v=2114;break}}if((v|0)==2114){r=u;s=c[k>>2]|0;t=c[l>>2]|0}l=s+r|0;c[k>>2]=l;if((l|0)>=(t|0)){a[j]=3}w=r*5|0;i=e;return w|0};case 5:{r=h+16|0;c[r>>2]=c[h+32>>2]<<2;kY(h+84|0,0,20);t=c[h+172>>2]|0;do{if((t|0)!=0){if((a[t+5|0]&3)==0){break}fi(h,t)}}while(0);do{if((c[h+48>>2]&64|0)!=0){t=c[h+40>>2]|0;if((a[t+5|0]&3)==0){break}fi(h,t)}}while(0);fz(h);t=c[h+104>>2]|0;if((t|0)!=0){l=h+60|0;k=t;do{t=k+5|0;a[t]=a[l]&3|a[t]&-72;fi(h,k);k=c[k>>2]|0;}while((k|0)!=0)}a[j]=0;w=c[r>>2]|0;i=e;return w|0};case 0:{if((c[h+84>>2]|0)!=0){r=h+16|0;k=c[r>>2]|0;fy(h);w=(c[r>>2]|0)-k|0;i=e;return w|0}a[j]=1;k=h+20|0;c[k>>2]=c[h+16>>2];r=c[g>>2]|0;l=r+16|0;t=c[l>>2]|0;do{if((b|0)!=0){if((a[b+5|0]&3)==0){break}fi(r,b)}}while(0);do{if((c[r+48>>2]&64|0)!=0){s=c[r+40>>2]|0;if((a[s+5|0]&3)==0){break}fi(r,s)}}while(0);fz(r);s=r+112|0;u=c[r+132>>2]|0;if((u|0)!=(s|0)){v=u;do{do{if((a[v+5|0]&7)==0){u=c[v+8>>2]|0;if((c[u+8>>2]&64|0)==0){break}n=c[u>>2]|0;if((a[n+5|0]&3)==0){break}fi(r,n)}}while(0);v=c[v+20>>2]|0;}while((v|0)!=(s|0))}s=r+84|0;if((c[s>>2]|0)!=0){do{fy(r);}while((c[s>>2]|0)!=0)}v=(c[l>>2]|0)-t|0;t=r+92|0;n=c[t>>2]|0;u=r+88|0;m=c[u>>2]|0;p=r+96|0;q=c[p>>2]|0;c[p>>2]=0;c[u>>2]=0;c[t>>2]=0;c[s>>2]=m;if((m|0)!=0){do{fy(r);}while((c[s>>2]|0)!=0)}c[s>>2]=n;if((n|0)!=0){do{fy(r);}while((c[s>>2]|0)!=0)}c[s>>2]=q;if((q|0)!=0){do{fy(r);}while((c[s>>2]|0)!=0)}q=c[l>>2]|0;while(1){n=c[p>>2]|0;c[p>>2]=0;m=n;n=0;L2590:while(1){u=m;while(1){if((u|0)==0){break L2590}x=c[u+24>>2]|0;if((fB(r,u)|0)==0){u=x}else{break}}if((c[s>>2]|0)==0){m=x;n=1;continue}while(1){fy(r);if((c[s>>2]|0)==0){m=x;n=1;continue L2590}}}if((n|0)==0){break}}fA(r,c[t>>2]|0,0);x=r+100|0;fA(r,c[x>>2]|0,0);m=c[t>>2]|0;u=c[x>>2]|0;o=c[l>>2]|0;y=c[g>>2]|0;z=y+104|0;while(1){A=c[z>>2]|0;if((A|0)==0){break}else{z=A|0}}A=v-q+o|0;o=y+72|0;y=c[o>>2]|0;L2603:do{if((y|0)!=0){q=o;v=z;B=y;while(1){C=v;D=B;while(1){E=D+5|0;F=a[E]|0;if((F&3)==0){break}a[E]=F|8;F=D|0;c[q>>2]=c[F>>2];c[F>>2]=c[C>>2];c[C>>2]=D;E=c[q>>2]|0;if((E|0)==0){break L2603}else{C=F;D=E}}E=D|0;F=c[E>>2]|0;if((F|0)==0){break}else{q=E;v=C;B=F}}}}while(0);y=c[r+104>>2]|0;if((y|0)!=0){z=r+60|0;o=y;do{y=o+5|0;a[y]=a[z]&3|a[y]&-72;fi(r,o);o=c[o>>2]|0;}while((o|0)!=0)}if((c[s>>2]|0)!=0){do{fy(r);}while((c[s>>2]|0)!=0)}o=c[l>>2]|0;while(1){z=c[p>>2]|0;c[p>>2]=0;y=z;z=0;L2622:while(1){B=y;while(1){if((B|0)==0){break L2622}G=c[B+24>>2]|0;if((fB(r,B)|0)==0){B=G}else{break}}if((c[s>>2]|0)==0){y=G;z=1;continue}while(1){fy(r);if((c[s>>2]|0)==0){y=G;z=1;continue L2622}}}if((z|0)==0){break}}G=A-o|0;o=c[p>>2]|0;if((o|0)!=0){p=o;do{o=1<<d[p+7|0];A=c[p+16>>2]|0;s=A+(o<<5)|0;if((o|0)>0){o=A;do{A=o+8|0;do{if((c[A>>2]|0)!=0){y=o+24|0;B=c[y>>2]|0;if((B&64|0)==0){break}C=c[o+16>>2]|0;if((B&15|0)==4){if((C|0)==0){break}if((a[C+5|0]&3)==0){break}fi(r,C);break}else{B=C+5|0;if((a[B]&3)==0){break}c[A>>2]=0;if((a[B]&3)==0){break}c[y>>2]=11;break}}}while(0);o=o+32|0;}while(o>>>0<s>>>0)}p=c[p+24>>2]|0;}while((p|0)!=0)}p=c[x>>2]|0;if((p|0)!=0){s=p;do{p=1<<d[s+7|0];o=c[s+16>>2]|0;z=o+(p<<5)|0;if((p|0)>0){p=o;do{o=p+8|0;do{if((c[o>>2]|0)!=0){A=p+24|0;y=c[A>>2]|0;if((y&64|0)==0){break}B=c[p+16>>2]|0;if((y&15|0)==4){if((B|0)==0){break}if((a[B+5|0]&3)==0){break}fi(r,B);break}else{y=B+5|0;if((a[y]&3)==0){break}c[o>>2]=0;if((a[y]&3)==0){break}c[A>>2]=11;break}}}while(0);p=p+32|0;}while(p>>>0<z>>>0)}s=c[s+24>>2]|0;}while((s|0)!=0)}fA(r,c[t>>2]|0,m);fA(r,c[x>>2]|0,u);u=r+60|0;a[u]=a[u]^3;u=G+(c[l>>2]|0)|0;c[k>>2]=(c[k>>2]|0)+u;k=c[g>>2]|0;a[k+61|0]=2;c[k+64>>2]=0;l=k+72|0;G=0;do{G=G+1|0;H=fr(b,l,1)|0;}while((H|0)==(l|0));c[k+80>>2]=H;H=k+68|0;l=0;do{l=l+1|0;I=fr(b,H,1)|0;}while((I|0)==(H|0));c[k+76>>2]=I;w=((l+G|0)*5|0)+u|0;i=e;return w|0};case 3:{u=h+80|0;G=c[u>>2]|0;if((G|0)==0){a[j]=4;w=0;i=e;return w|0}else{c[u>>2]=fr(b,G,80)|0;w=400;i=e;return w|0}break};case 4:{G=h+76|0;u=c[G>>2]|0;if((u|0)!=0){c[G>>2]=fr(b,u,80)|0;w=400;i=e;return w|0}c[f>>2]=c[h+172>>2];fr(b,f,1)|0;f=c[g>>2]|0;if((a[f+62|0]|0)!=1){g=(c[f+32>>2]|0)/2|0;if((c[f+28>>2]|0)>>>0<g>>>0){hG(b,g)}g=f+144|0;h=f+152|0;c[g>>2]=gz(b,c[g>>2]|0,c[h>>2]|0,0)|0;c[h>>2]=0}a[j]=5;w=5;i=e;return w|0};default:{w=0;i=e;return w|0}}return 0}function ft(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=c[b+12>>2]|0;L2697:do{if((a[d+62|0]|0)==2){e=d+20|0;f=c[e>>2]|0;do{if((f|0)==0){fw(b,0);g=c[d+8>>2]|0;h=c[d+12>>2]|0;c[e>>2]=h+g;i=g;j=h}else{h=d+61|0;if((a[h]|0)!=5){do{fs(b)|0;}while((a[h]|0)!=5)}a[h]=0;g=c[d+8>>2]|0;k=c[d+12>>2]|0;if((k+g|0)>>>0>(aa(c[d+160>>2]|0,(f>>>0)/100|0)|0)>>>0){c[e>>2]=0;i=g;j=k;break}else{c[e>>2]=f;i=g;j=k;break}}}while(0);f=i+j|0;e=(f|0)/100|0;k=c[d+156>>2]|0;if((k|0)<(2147483644/(e|0)|0|0)){l=aa(k,e)|0}else{l=2147483644}hu(d,f-l|0);m=d+61|0}else{f=d+12|0;e=c[d+164>>2]|0;k=(e|0)<40?40:e;e=((c[f>>2]|0)/200|0)+1|0;if((e|0)<(2147483644/(k|0)|0|0)){n=aa(e,k)|0}else{n=2147483644}e=d+61|0;g=n;do{g=g-(fs(b)|0)|0;o=(a[e]|0)==5;if((g|0)<=-1600){p=2154;break}}while(!o);do{if((p|0)==2154){if(o){break}hu(d,((g|0)/(k|0)|0)*200|0);m=e;break L2697}}while(0);k=(c[d+20>>2]|0)/100|0;g=c[d+156>>2]|0;if((g|0)<(2147483644/(k|0)|0|0)){q=aa(g,k)|0}else{q=2147483644}hu(d,(c[d+8>>2]|0)-q+(c[f>>2]|0)|0);m=e}}while(0);q=d+104|0;if((c[q>>2]|0)==0){return}else{r=0}while(1){if((r|0)>=4){if((a[m]|0)!=5){p=2164;break}}fu(b,1);if((c[q>>2]|0)==0){p=2165;break}else{r=r+1|0}}if((p|0)==2164){return}else if((p|0)==2165){return}}function fu(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+16|0;g=f|0;h=c[b+12>>2]|0;j=h+104|0;k=c[j>>2]|0;l=k|0;c[j>>2]=c[l>>2];j=h+68|0;c[l>>2]=c[j>>2];c[j>>2]=k;j=k+5|0;l=a[j]|0;a[j]=l&-17;if((d[h+61|0]|0)>=2){a[j]=a[h+60|0]&3|l&-88}c[g>>2]=k;l=g+8|0;c[l>>2]=d[k+4|0]|0|64;k=iv(b,g,2)|0;if((k|0)==0){i=f;return}j=k+8|0;if((c[j>>2]&15|0)!=6){i=f;return}m=b+41|0;n=a[m]|0;o=h+63|0;h=a[o]|0;a[m]=0;a[o]=0;p=b+8|0;q=c[p>>2]|0;r=k;k=q;s=c[r+4>>2]|0;c[k>>2]=c[r>>2];c[k+4>>2]=s;c[q+8>>2]=c[j>>2];j=c[p>>2]|0;q=g;g=j+16|0;s=c[q+4>>2]|0;c[g>>2]=c[q>>2];c[g+4>>2]=s;c[j+24>>2]=c[l>>2];l=c[p>>2]|0;c[p>>2]=l+32;j=e2(b,2,0,l-(c[b+28>>2]|0)|0,0)|0;a[m]=n;a[o]=h;if((j|0)==0|(e|0)==0){i=f;return}if((j|0)!=2){t=j;eR(b,t)}j=c[p>>2]|0;if((c[j-16+8>>2]&15|0)==4){u=(c[j-16>>2]|0)+16|0}else{u=2712}gW(b,9688,(j=i,i=i+8|0,c[j>>2]=u,j)|0)|0;i=j;t=5;eR(b,t)}function fv(b){b=b|0;var d=0;d=c[b+12>>2]|0;if((a[d+63|0]|0)==0){hu(d,-1600);return}else{ft(b);return}}function fw(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=b+12|0;g=c[f>>2]|0;h=g+62|0;i=a[h]|0;j=(e|0)!=0;do{if(j){a[h]=1;k=2194}else{a[h]=0;e=(c[f>>2]|0)+104|0;l=c[e>>2]|0;if((l|0)==0){k=2194;break}else{m=l}do{l=m+5|0;a[l]=a[l]&-65;fu(b,1);m=c[e>>2]|0;}while((m|0)!=0);if((a[h]|0)==2){k=2195}else{k=2194}}}while(0);if((k|0)==2194){if((d[g+61|0]|0)<2){k=2195}}if((k|0)==2195){k=c[f>>2]|0;a[k+61|0]=2;c[k+64>>2]=0;m=k+72|0;do{n=fr(b,m,1)|0;}while((n|0)==(m|0));c[k+80>>2]=n;n=k+68|0;do{o=fr(b,n,1)|0;}while((o|0)==(n|0));c[k+76>>2]=o}o=c[f>>2]|0;k=o+61|0;if((a[k]|0)==5){p=o;q=5}else{do{fs(b)|0;}while((a[k]|0)!=5);k=c[f>>2]|0;p=k;q=a[k+61|0]|0}k=p+61|0;if((1<<(q&255)&-33|0)==0){do{fs(b)|0;}while((1<<d[k]&-33|0)==0);k=c[f>>2]|0;r=k;s=a[k+61|0]|0}else{r=p;s=q}q=r+61|0;if(s<<24>>24!=5){do{fs(b)|0;}while((a[q]|0)!=5)}do{if(i<<24>>24==2){q=(c[f>>2]|0)+61|0;if((a[q]|0)==0){break}do{fs(b)|0;}while((a[q]|0)!=0)}}while(0);a[h]=i;i=c[g+8>>2]|0;h=c[g+12>>2]|0;q=(h+i|0)/100|0;s=c[g+156>>2]|0;if((s|0)<(2147483644/(q|0)|0|0)){t=aa(s,q)|0}else{t=2147483644}hu(g,i-t+h|0);if(j){return}j=(c[f>>2]|0)+104|0;f=c[j>>2]|0;if((f|0)==0){return}else{u=f}do{f=u+5|0;a[f]=a[f]&-65;fu(b,1);u=c[j>>2]|0;}while((u|0)!=0);return}function fx(a,b){a=a|0;b=b|0;eZ(a,(c[a+8>>2]|0)-32|0,0,0);return}function fy(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=b+84|0;f=c[e>>2]|0;g=f+5|0;a[g]=a[g]|4;L2814:do{switch(d[f+4|0]|0){case 5:{h=f;i=f+24|0;c[e>>2]=c[i>>2];j=f+8|0;k=c[j>>2]|0;l=k;do{if((k|0)==0){m=2253}else{if((a[k+6|0]&8)==0){n=iu(l,3,c[b+196>>2]|0)|0;o=c[j>>2]|0;if((o|0)==0){p=n}else{q=o;r=n;m=2225}}else{q=l;r=0;m=2225}do{if((m|0)==2225){if((a[q+5|0]&3)==0){p=r;break}fi(b,q);p=r}}while(0);if((p|0)==0){m=2253;break}if((c[p+8>>2]&15|0)!=4){m=2253;break}n=(c[p>>2]|0)+16|0;o=aT(n|0,107)|0;s=(o|0)!=0;o=(aT(n|0,118)|0)==0;if(o&(s^1)){m=2253;break}a[g]=a[g]&-5;if(s){if(o){fB(b,h)|0;break}else{o=b+100|0;c[i>>2]=c[o>>2];c[o>>2]=f;break}}o=1<<d[h+7|0];s=c[f+16>>2]|0;n=s+(o<<5)|0;t=(c[h+28>>2]|0)>0|0;if((o|0)>0){o=s;s=t;while(1){u=o+8|0;v=o+24|0;w=(c[v>>2]&64|0)==0;do{if((c[u>>2]|0)==0){if(w){x=s;break}if((a[(c[o+16>>2]|0)+5|0]&3)==0){x=s;break}c[v>>2]=11;x=s}else{do{if(!w){y=c[o+16>>2]|0;if((a[y+5|0]&3)==0){break}fi(b,y)}}while(0);if((s|0)!=0){x=s;break}y=c[u>>2]|0;if((y&64|0)==0){x=0;break}z=c[o>>2]|0;if((y&15|0)!=4){x=(a[z+5|0]&3)!=0|0;break}if((z|0)==0){x=0;break}if((a[z+5|0]&3)==0){x=0;break}fi(b,z);x=0}}while(0);u=o+32|0;if(u>>>0<n>>>0){o=u;s=x}else{A=x;break}}}else{A=t}if((A|0)==0){s=b+88|0;c[i>>2]=c[s>>2];c[s>>2]=f;break}else{s=b+92|0;c[i>>2]=c[s>>2];c[s>>2]=f;break}}}while(0);do{if((m|0)==2253){i=f+16|0;l=c[i>>2]|0;j=l+(1<<d[h+7|0]<<5)|0;k=h+28|0;s=c[k>>2]|0;if((s|0)>0){o=f+12|0;n=0;u=s;while(1){s=c[o>>2]|0;do{if((c[s+(n<<4)+8>>2]&64|0)==0){B=u}else{w=c[s+(n<<4)>>2]|0;if((a[w+5|0]&3)==0){B=u;break}fi(b,w);B=c[k>>2]|0}}while(0);s=n+1|0;if((s|0)<(B|0)){n=s;u=B}else{break}}C=c[i>>2]|0}else{C=l}if(C>>>0<j>>>0){D=C}else{break}do{u=D+8|0;n=c[u>>2]|0;k=D+24|0;o=(c[k>>2]&64|0)==0;do{if((n|0)==0){if(o){break}if((a[(c[D+16>>2]|0)+5|0]&3)==0){break}c[k>>2]=11}else{do{if(o){E=n}else{t=c[D+16>>2]|0;if((a[t+5|0]&3)==0){E=n;break}fi(b,t);E=c[u>>2]|0}}while(0);if((E&64|0)==0){break}t=c[D>>2]|0;if((a[t+5|0]&3)==0){break}fi(b,t)}}while(0);D=D+32|0;}while(D>>>0<j>>>0)}}while(0);F=(c[h+28>>2]<<4)+32+(32<<d[h+7|0])|0;break};case 38:{c[e>>2]=c[f+8>>2];j=f+6|0;l=a[j]|0;if(l<<24>>24==0){G=l&255}else{i=0;u=l;while(1){do{if((c[f+16+(i<<4)+8>>2]&64|0)==0){H=u}else{l=c[f+16+(i<<4)>>2]|0;if((a[l+5|0]&3)==0){H=u;break}fi(b,l);H=a[j]|0}}while(0);l=i+1|0;n=H&255;if((l|0)<(n|0)){i=l;u=H}else{G=n;break}}}F=(G<<4)+16|0;break};case 9:{u=f;c[e>>2]=c[f+72>>2];i=f+32|0;j=c[i>>2]|0;do{if((j|0)!=0){if((a[j+5|0]&3)==0){break}c[i>>2]=0}}while(0);i=c[f+36>>2]|0;do{if((i|0)!=0){if((a[i+5|0]&3)==0){break}fi(b,i)}}while(0);i=f+44|0;j=c[i>>2]|0;if((j|0)>0){h=f+8|0;n=0;l=j;while(1){j=c[h>>2]|0;do{if((c[j+(n<<4)+8>>2]&64|0)==0){I=l}else{o=c[j+(n<<4)>>2]|0;if((a[o+5|0]&3)==0){I=l;break}fi(b,o);I=c[i>>2]|0}}while(0);j=n+1|0;if((j|0)<(I|0)){n=j;l=I}else{break}}}l=f+40|0;n=c[l>>2]|0;if((n|0)>0){h=u+28|0;j=0;o=n;while(1){n=c[(c[h>>2]|0)+(j<<3)>>2]|0;do{if((n|0)==0){J=o}else{if((a[n+5|0]&3)==0){J=o;break}fi(b,n);J=c[l>>2]|0}}while(0);n=j+1|0;if((n|0)<(J|0)){j=n;o=J}else{break}}}o=f+56|0;j=c[o>>2]|0;if((j|0)>0){h=f+16|0;u=0;n=j;while(1){k=c[(c[h>>2]|0)+(u<<2)>>2]|0;do{if((k|0)==0){K=n}else{if((a[k+5|0]&3)==0){K=n;break}fi(b,k);K=c[o>>2]|0}}while(0);k=u+1|0;if((k|0)<(K|0)){u=k;n=K}else{L=K;break}}}else{L=j}n=f+60|0;u=c[n>>2]|0;if((u|0)>0){h=f+24|0;k=0;t=u;while(1){s=c[(c[h>>2]|0)+(k*12|0)>>2]|0;do{if((s|0)==0){M=t}else{if((a[s+5|0]&3)==0){M=t;break}fi(b,s);M=c[n>>2]|0}}while(0);s=k+1|0;if((s|0)<(M|0)){k=s;t=M}else{break}}N=M;O=c[o>>2]|0}else{N=u;O=L}F=(N*12|0)+80+(c[i>>2]<<4)+(c[l>>2]<<3)+((c[f+48>>2]|0)+O+(c[f+52>>2]|0)<<2)|0;break};case 8:{t=f+60|0;c[e>>2]=c[t>>2];k=b+88|0;c[t>>2]=c[k>>2];c[k>>2]=f;a[g]=a[g]&-5;k=f+28|0;t=c[k>>2]|0;if((t|0)==0){F=1;break L2814}n=f+8|0;h=c[n>>2]|0;if(t>>>0<h>>>0){j=t;s=h;while(1){do{if((c[j+8>>2]&64|0)==0){P=s}else{h=c[j>>2]|0;if((a[h+5|0]&3)==0){P=s;break}fi(b,h);P=c[n>>2]|0}}while(0);h=j+16|0;if(h>>>0<P>>>0){j=h;s=P}else{Q=h;break}}}else{Q=t}do{if((a[b+61|0]|0)==1){s=f+32|0;j=(c[k>>2]|0)+(c[s>>2]<<4)|0;if(Q>>>0<j>>>0){R=Q}else{S=s;break}while(1){c[R+8>>2]=0;n=R+16|0;if(n>>>0<j>>>0){R=n}else{S=s;break}}}else{S=f+32|0}}while(0);F=(c[S>>2]<<4)+112|0;break};case 6:{k=f;c[e>>2]=c[f+8>>2];t=c[f+12>>2]|0;do{if((t|0)!=0){if((a[t+5|0]&3)==0){break}fi(b,t)}}while(0);t=f+6|0;s=a[t]|0;if(s<<24>>24==0){T=s&255}else{j=0;n=s;while(1){s=c[k+16+(j<<2)>>2]|0;do{if((s|0)==0){U=n}else{if((a[s+5|0]&3)==0){U=n;break}fi(b,s);U=a[t]|0}}while(0);s=j+1|0;l=U&255;if((s|0)<(l|0)){j=s;n=U}else{T=l;break}}}F=(T<<2)+16|0;break};default:{return}}}while(0);T=b+16|0;c[T>>2]=(c[T>>2]|0)+F;return}function fz(b){b=b|0;var d=0;d=c[b+252>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fi(b,d)}}while(0);d=c[b+256>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fi(b,d)}}while(0);d=c[b+260>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fi(b,d)}}while(0);d=c[b+264>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fi(b,d)}}while(0);d=c[b+268>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fi(b,d)}}while(0);d=c[b+272>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fi(b,d)}}while(0);d=c[b+276>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fi(b,d)}}while(0);d=c[b+280>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}fi(b,d)}}while(0);d=c[b+284>>2]|0;if((d|0)==0){return}if((a[d+5|0]&3)==0){return}fi(b,d);return}function fA(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((e|0)==(f|0)){return}else{g=e}do{e=g;h=g+16|0;i=c[h>>2]|0;j=i+(1<<(d[e+7|0]|0)<<5)|0;k=e+28|0;if((c[k>>2]|0)>0){e=g+12|0;l=0;do{m=c[e>>2]|0;n=m+(l<<4)+8|0;o=c[n>>2]|0;do{if((o&64|0)!=0){p=c[m+(l<<4)>>2]|0;if((o&15|0)!=4){if((a[p+5|0]&3)==0){break}c[n>>2]=0;break}if((p|0)==0){break}if((a[p+5|0]&3)==0){break}fi(b,p)}}while(0);l=l+1|0;}while((l|0)<(c[k>>2]|0));q=c[h>>2]|0}else{q=i}if(q>>>0<j>>>0){k=q;do{l=k+8|0;e=c[l>>2]|0;do{if(!((e|0)==0|(e&64|0)==0)){n=c[k>>2]|0;if((e&15|0)==4){if((n|0)==0){break}if((a[n+5|0]&3)==0){break}fi(b,n);break}if((a[n+5|0]&3)==0){break}c[l>>2]=0;n=k+24|0;if((c[n>>2]&64|0)==0){break}if((a[(c[k+16>>2]|0)+5|0]&3)==0){break}c[n>>2]=11}}while(0);k=k+32|0;}while(k>>>0<j>>>0)}g=c[g+24>>2]|0;}while((g|0)!=(f|0));return}function fB(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=e+16|0;g=c[f>>2]|0;h=g+(1<<(d[e+7|0]|0)<<5)|0;i=e+28|0;j=c[i>>2]|0;if((j|0)>0){k=e+12|0;l=0;m=0;n=j;while(1){j=c[k>>2]|0;do{if((c[j+(m<<4)+8>>2]&64|0)==0){o=l;p=n}else{q=c[j+(m<<4)>>2]|0;if((a[q+5|0]&3)==0){o=l;p=n;break}fi(b,q);o=1;p=c[i>>2]|0}}while(0);j=m+1|0;if((j|0)<(p|0)){l=o;m=j;n=p}else{break}}r=o;s=c[f>>2]|0}else{r=0;s=g}do{if(s>>>0<h>>>0){g=0;f=0;o=s;p=r;while(1){n=o+8|0;m=c[n>>2]|0;l=o+24|0;i=c[l>>2]|0;k=(i&64|0)==0;L3061:do{if((m|0)==0){if(k){t=p;u=f;v=g;break}if((a[(c[o+16>>2]|0)+5|0]&3)==0){t=p;u=f;v=g;break}c[l>>2]=11;t=p;u=f;v=g}else{do{if(k){w=m;x=2410}else{j=c[o+16>>2]|0;if((i&15|0)==4){if((j|0)==0){w=m;x=2410;break}if((a[j+5|0]&3)==0){w=m;x=2410;break}fi(b,j);w=c[n>>2]|0;x=2410;break}q=(m&64|0)==0;if((a[j+5|0]&3)==0){if(q){t=p;u=f;v=g;break L3061}else{break}}if(q){t=p;u=f;v=1;break L3061}t=p;u=(a[(c[o>>2]|0)+5|0]&3)==0?f:1;v=1;break L3061}}while(0);if((x|0)==2410){x=0;if((w&64|0)==0){t=p;u=f;v=g;break}}q=c[o>>2]|0;if((a[q+5|0]&3)==0){t=p;u=f;v=g;break}fi(b,q);t=1;u=f;v=g}}while(0);m=o+32|0;if(m>>>0<h>>>0){g=v;f=u;o=m;p=t}else{break}}if((u|0)!=0){p=b+96|0;c[e+24>>2]=c[p>>2];c[p>>2]=e;y=t;return y|0}if((v|0)==0){z=t;break}p=b+100|0;c[e+24>>2]=c[p>>2];c[p>>2]=e;y=t;return y|0}else{z=r}}while(0);r=b+88|0;c[e+24>>2]=c[r>>2];c[r>>2]=e;y=z;return y|0}function fC(a){a=a|0;ev(a,11744,266,1);cM(a,-2);ev(a,9264,158,1);cM(a,-2);ev(a,7272,304,1);cM(a,-2);ev(a,5704,300,1);cM(a,-2);ev(a,4384,42,1);cM(a,-2);ev(a,3880,116,1);cM(a,-2);ev(a,3512,82,1);cM(a,-2);ev(a,3056,274,1);cM(a,-2);ev(a,2744,52,1);cM(a,-2);ev(a,12072,176,1);cM(a,-2);ev(a,11752,328,1);cM(a,-2);eu(a,-1001e3,11712)|0;cM(a,-2);return}function fD(a){a=a|0;var b=0,d=0,e=0;dn(a,0,11);et(a,1712,0);dW(a,4376)|0;cR(a,-1);dt(a,-2,3504);et(a,1832,0);cM(a,-2);b=c[m>>2]|0;d=dK(a,8)|0;e=d+4|0;c[e>>2]=0;dX(a,4376);c[d>>2]=b;c[e>>2]=162;cR(a,-1);dt(a,-1001e3,11248);dt(a,-2,11632);e=c[o>>2]|0;b=dK(a,8)|0;d=b+4|0;c[d>>2]=0;dX(a,4376);c[b>>2]=e;c[d>>2]=162;cR(a,-1);dt(a,-1001e3,9192);dt(a,-2,7216);d=c[n>>2]|0;e=dK(a,8)|0;b=e+4|0;c[b>>2]=0;dX(a,4376);c[e>>2]=d;c[b>>2]=162;dt(a,-2,5648);return 1}function fE(a){a=a|0;c[(dZ(a,1,4376)|0)+4>>2]=162;c6(a);da(a,3848,26)|0;return 2}function fF(a){a=a|0;var b=0,d=0,e=0;b=i;if((cS(a,1)|0)==-1){dk(a,-1001e3,9192)}if((c[(dZ(a,1,4376)|0)+4>>2]|0)==0){dR(a,9472,(d=i,i=i+1|0,i=i+7&-8,c[d>>2]=0,d)|0)|0;i=d}d=(dZ(a,1,4376)|0)+4|0;e=c[d>>2]|0;c[d>>2]=0;d=cf[e&511](a)|0;i=b;return d|0}function fG(a){a=a|0;var b=0,d=0,e=0;b=i;d=dZ(a,1,4376)|0;if((c[d+4>>2]|0)==0){dR(a,9472,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=dU(a,(au(c[d>>2]|0)|0)==0|0,0)|0;i=b;return e|0}function fH(a){a=a|0;var b=0,d=0;b=i;if((c[(dZ(a,1,4376)|0)+4>>2]|0)!=0){fR(a,0);i=b;return 1}dR(a,9472,(d=i,i=i+1|0,i=i+7&-8,c[d>>2]=0,d)|0)|0;i=d;fR(a,0);i=b;return 1}function fI(a){a=a|0;var b=0,d=0,e=0;b=i;d=dZ(a,1,4376)|0;if((c[d+4>>2]|0)==0){dR(a,9472,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=fP(a,c[d>>2]|0,2)|0;i=b;return e|0}function fJ(a){a=a|0;var b=0,d=0,e=0,f=0.0,g=0,h=0;b=i;d=dZ(a,1,4376)|0;if((c[d+4>>2]|0)==0){dR(a,9472,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=c[d>>2]|0;d=d_(a,2,8408,1944)|0;f=+d5(a,3,0.0);g=~~f;if(+(g|0)!=f){dQ(a,3,7936)|0}if((bX(e|0,g|0,c[1960+(d<<2)>>2]|0)|0)==0){c7(a,+(aZ(e|0)|0));h=1;i=b;return h|0}else{h=dU(a,0,0)|0;i=b;return h|0}return 0}function fK(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=dZ(a,1,4376)|0;if((c[d+4>>2]|0)==0){dR(a,9472,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=c[d>>2]|0;d=d_(a,2,0,1912)|0;f=d8(a,3,1024)|0;g=dU(a,(cd(e|0,0,c[1928+(d<<2)>>2]|0,f|0)|0)==0|0,0)|0;i=b;return g|0}function fL(a){a=a|0;var b=0,d=0,e=0;b=i;d=dZ(a,1,4376)|0;if((c[d+4>>2]|0)==0){dR(a,9472,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=c[d>>2]|0;cR(a,1);d=fO(a,e,2)|0;i=b;return d|0}function fM(a){a=a|0;var b=0,d=0;b=dZ(a,1,4376)|0;if((c[b+4>>2]|0)==0){return 0}if((c[b>>2]|0)==0){return 0}b=(dZ(a,1,4376)|0)+4|0;d=c[b>>2]|0;c[b>>2]=0;cf[d&511](a)|0;return 0}function fN(a){a=a|0;var b=0,d=0,e=0;b=i;d=dZ(a,1,4376)|0;if((c[d+4>>2]|0)==0){da(a,10136,13)|0;i=b;return 1}else{e=c[d>>2]|0;dd(a,9904,(a=i,i=i+8|0,c[a>>2]=e,a)|0)|0;i=a;i=b;return 1}return 0}function fO(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0;e=i;i=i+8|0;f=e|0;g=cL(a)|0;if((g|0)==(d|0)){j=1;i=e;return j|0}k=d;l=1;m=g-d|0;while(1){d=m-1|0;do{if((cS(a,k)|0)==3){if((l|0)==0){n=0;break}o=+cZ(a,k,0);g=bM(b|0,9736,(p=i,i=i+8|0,h[p>>3]=o,p)|0)|0;i=p;n=(g|0)>0|0}else{g=d0(a,k,f)|0;if((l|0)==0){n=0;break}p=aw(g|0,1,c[f>>2]|0,b|0)|0;n=(p|0)==(c[f>>2]|0)|0}}while(0);if((d|0)==0){break}else{k=k+1|0;l=n;m=d}}if((n|0)!=0){j=1;i=e;return j|0}j=dU(a,0,0)|0;i=e;return j|0}function fP(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+2088|0;g=f|0;j=f+1040|0;k=f+1048|0;l=cL(b)|0;bT(d|0);L3166:do{if((l|0)==1){m=e+1|0;n=fQ(b,d,1)|0}else{d1(b,l+19|0,7736);o=k+8|0;p=g+8|0;q=e;r=l-2|0;L3169:while(1){do{if((cS(b,q)|0)==3){s=c_(b,q,0)|0;if((s|0)==0){t=aO(d|0)|0;bH(t|0,d|0)|0;da(b,0,0)|0;u=(t|0)!=-1|0;break}else{ef(b,k);t=bK(d9(k,s)|0,1,s|0,d|0)|0;c[o>>2]=(c[o>>2]|0)+t;ec(k);u=(t|0)!=0|0;break}}else{t=c1(b,q,0)|0;if((t|0)==0){v=2498}else{if((a[t]|0)!=42){v=2498}}if((v|0)==2498){v=0;dQ(b,q,7584)|0}s=a[t+1|0]|0;if((s|0)==97){ef(b,g);t=bK(d9(g,1024)|0,1,1024,d|0)|0;c[p>>2]=(c[p>>2]|0)+t;if(t>>>0>=1024){t=1024;do{t=t<<(t>>>0<1073741824);w=bK(d9(g,t)|0,1,t|0,d|0)|0;c[p>>2]=(c[p>>2]|0)+w;}while(w>>>0>=t>>>0)}ec(g);u=1;break}else if((s|0)==76){u=fQ(b,d,0)|0;break}else if((s|0)==108){u=fQ(b,d,1)|0;break}else if((s|0)==110){t=aG(d|0,7264,(w=i,i=i+8|0,c[w>>2]=j,w)|0)|0;i=w;if((t|0)!=1){v=2502;break L3169}c7(b,+h[j>>3]);u=1;break}else{break L3169}}}while(0);t=q+1|0;if((r|0)==0|(u|0)==0){m=t;n=u;break L3166}else{q=t;r=r-1|0}}if((v|0)==2502){c6(b);m=q+1|0;n=0;break}x=dQ(b,q,7424)|0;i=f;return x|0}}while(0);if((a3(d|0)|0)!=0){x=dU(b,0,0)|0;i=f;return x|0}if((n|0)==0){cM(b,-2);c6(b)}x=m-e|0;i=f;return x|0}function fQ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+1040|0;g=f|0;ef(b,g);h=d9(g,1024)|0;L3207:do{if((aR(h|0,1024,d|0)|0)!=0){j=g+8|0;k=h;while(1){l=kU(k|0)|0;if((l|0)!=0){if((a[k+(l-1)|0]|0)==10){break}}c[j>>2]=(c[j>>2]|0)+l;k=d9(g,1024)|0;if((aR(k|0,1024,d|0)|0)==0){break L3207}}c[j>>2]=l-e+(c[j>>2]|0);ec(g);m=1;i=f;return m|0}}while(0);ec(g);m=(c2(b,-1)|0)!=0|0;i=f;return m|0}function fR(a,b){a=a|0;b=b|0;var c=0,d=0;c=cL(a)|0;d=c-1|0;if((d|0)>=18){dQ(a,17,7064)|0}cR(a,1);c8(a,d);df(a,b);if((d|0)>=1){b=1;do{b=b+1|0;cR(a,b);}while((b|0)<=(d|0))}de(a,156,c+2|0);return}function fS(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=c3(a,-1001001)|0;e=c_(a,-1001002,0)|0;if((c[d+4>>2]|0)==0){f=dR(a,6824,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;h=f;i=b;return h|0}cM(a,1);if((e|0)>=1){f=1;do{cR(a,-1001003-f|0);f=f+1|0;}while((f|0)<=(e|0))}e=fP(a,c[d>>2]|0,2)|0;if((cS(a,-e|0)|0)!=0){h=e;i=b;return h|0}if((e|0)>1){d=c1(a,1-e|0,0)|0;e=dR(a,6696,(g=i,i=i+8|0,c[g>>2]=d,g)|0)|0;i=g;h=e;i=b;return h|0}if((c0(a,-1001003)|0)==0){h=0;i=b;return h|0}cM(a,0);cR(a,-1001001);e=(dZ(a,1,4376)|0)+4|0;g=c[e>>2]|0;c[e>>2]=0;cf[g&511](a)|0;h=0;i=b;return h|0}function fT(a){a=a|0;var b=0,d=0,e=0;b=i;dk(a,-1001e3,9192);d=c3(a,-1)|0;if((c[d+4>>2]|0)==0){dR(a,5672,(e=i,i=i+8|0,c[e>>2]=9196,e)|0)|0;i=e}e=dU(a,(au(c[d>>2]|0)|0)==0|0,0)|0;i=b;return e|0}function fU(a){a=a|0;f3(a,11248,5112);return 1}function fV(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;if((cS(a,1)|0)==-1){c6(a)}if((cS(a,1)|0)==0){dk(a,-1001e3,11248);cP(a,1);if((c[(dZ(a,1,4376)|0)+4>>2]|0)!=0){d=0;fR(a,d);i=b;return 1}dR(a,9472,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e;d=0;fR(a,d);i=b;return 1}else{f=d0(a,1,0)|0;g=dK(a,8)|0;h=g+4|0;c[h>>2]=0;dX(a,4376);j=g;c[j>>2]=0;c[h>>2]=268;h=bm(f|0,5112)|0;c[j>>2]=h;if((h|0)==0){h=bE(c[(bD()|0)>>2]|0)|0;dR(a,4704,(e=i,i=i+16|0,c[e>>2]=f,c[e+8>>2]=h,e)|0)|0;i=e}cP(a,1);d=1;fR(a,d);i=b;return 1}return 0}function fW(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=d0(b,1,0)|0;e=d$(b,2,5112,0)|0;f=dK(b,8)|0;g=f+4|0;c[g>>2]=0;dX(b,4376);h=f;c[h>>2]=0;c[g>>2]=268;g=a[e]|0;do{if(g<<24>>24==0){i=2574}else{f=e+1|0;if((aK(4600,g<<24>>24|0,4)|0)==0){i=2574;break}j=a[f]|0;if(j<<24>>24==43){k=e+2|0;if((k|0)==0){i=2574;break}l=k;m=a[k]|0}else{l=f;m=j}if(m<<24>>24==98){j=l+1|0;if((j|0)==0){i=2574;break}n=a[j]|0}else{n=m}if(n<<24>>24!=0){i=2574}}}while(0);if((i|0)==2574){dQ(b,2,4528)|0}i=bm(d|0,e|0)|0;c[h>>2]=i;if((i|0)!=0){o=1;return o|0}o=dU(b,0,d)|0;return o|0}function fX(a){a=a|0;f3(a,9192,4872);return 1}function fY(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=d0(a,1,0)|0;d$(a,2,5112,0)|0;e=dK(a,8)|0;f=e+4|0;c[f>>2]=0;dX(a,4376);dR(a,5e3,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;c[e>>2]=0;c[f>>2]=306;f=dU(a,0,d)|0;i=b;return f|0}function fZ(a){a=a|0;var b=0,d=0,e=0;b=i;dk(a,-1001e3,11248);d=c3(a,-1)|0;if((c[d+4>>2]|0)==0){dR(a,5672,(e=i,i=i+8|0,c[e>>2]=11252,e)|0)|0;i=e}e=fP(a,c[d>>2]|0,1)|0;i=b;return e|0}function f_(a){a=a|0;var b=0,d=0,e=0,f=0;b=dK(a,8)|0;d=b+4|0;c[d>>2]=0;dX(a,4376);e=b;c[e>>2]=0;c[d>>2]=268;d=aM()|0;c[e>>2]=d;if((d|0)!=0){f=1;return f|0}f=dU(a,0,0)|0;return f|0}function f$(a){a=a|0;var b=0;d3(a,1);b=dY(a,1,4376)|0;if((b|0)==0){c6(a);return 1}if((c[b+4>>2]|0)==0){da(a,5488,11)|0;return 1}else{da(a,5296,4)|0;return 1}return 0}function f0(a){a=a|0;var b=0,d=0,e=0;b=i;dk(a,-1001e3,9192);d=c3(a,-1)|0;if((c[d+4>>2]|0)==0){dR(a,5672,(e=i,i=i+8|0,c[e>>2]=9196,e)|0)|0;i=e}e=fO(a,c[d>>2]|0,1)|0;i=b;return e|0}function f1(a){a=a|0;return dU(a,(ar(c[(dZ(a,1,4376)|0)>>2]|0)|0)==0|0,0)|0}function f2(a){a=a|0;dZ(a,1,4376)|0;return dV(a,-1)|0}function f3(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;if((cS(a,1)|0)<1){dk(a,-1001e3,b);i=e;return}f=c1(a,1,0)|0;do{if((f|0)==0){if((c[(dZ(a,1,4376)|0)+4>>2]|0)==0){dR(a,9472,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}cR(a,1)}else{h=dK(a,8)|0;j=h+4|0;c[j>>2]=0;dX(a,4376);k=h;c[k>>2]=0;c[j>>2]=268;j=bm(f|0,d|0)|0;c[k>>2]=j;if((j|0)!=0){break}j=bE(c[(bD()|0)>>2]|0)|0;dR(a,4704,(g=i,i=i+16|0,c[g>>2]=f,c[g+8>>2]=j,g)|0)|0;i=g}}while(0);dt(a,-1001e3,b);dk(a,-1001e3,b);i=e;return}function f4(a){a=a|0;dn(a,0,28);et(a,496,0);c7(a,3.141592653589793);dt(a,-2,9992);c7(a,q);dt(a,-2,11480);return 1}function f5(a){a=a|0;c7(a,+P(+(+d4(a,1))));return 1}function f6(a){a=a|0;c7(a,+V(+d4(a,1)));return 1}function f7(a){a=a|0;c7(a,+W(+d4(a,1)));return 1}function f8(a){a=a|0;var b=0.0;b=+d4(a,1);c7(a,+Y(+b,+(+d4(a,2))));return 1}function f9(a){a=a|0;c7(a,+X(+d4(a,1)));return 1}function ga(a){a=a|0;c7(a,+$(+d4(a,1)));return 1}function gb(a){a=a|0;c7(a,+aP(+(+d4(a,1))));return 1}function gc(a){a=a|0;c7(a,+S(+d4(a,1)));return 1}function gd(a){a=a|0;c7(a,+d4(a,1)/.017453292519943295);return 1}function ge(a){a=a|0;c7(a,+Z(+d4(a,1)));return 1}function gf(a){a=a|0;c7(a,+O(+d4(a,1)));return 1}function gg(a){a=a|0;var b=0.0;b=+d4(a,1);c7(a,+a1(+b,+(+d4(a,2))));return 1}function gh(a){a=a|0;var b=0,d=0;b=i;i=i+8|0;d=b|0;c7(a,+bo(+(+d4(a,1)),d|0));c8(a,c[d>>2]|0);i=b;return 2}function gi(a){a=a|0;var b=0.0;b=+d4(a,1);c7(a,+bi(+b,d6(a,2)|0));return 1}function gj(a){a=a|0;c7(a,+bv(+(+d4(a,1))));return 1}function gk(a){a=a|0;var b=0.0,c=0.0,d=0.0;b=+d4(a,1);do{if((cS(a,2)|0)<1){c=+_(b)}else{d=+d4(a,2);if(d==10.0){c=+bv(+b);break}else{c=+_(b)/+_(d);break}}}while(0);c7(a,c);return 1}function gl(a){a=a|0;var b=0,c=0.0,d=0.0,e=0,f=0.0,g=0.0,h=0;b=cL(a)|0;c=+d4(a,1);if((b|0)<2){d=c}else{e=2;f=c;while(1){c=+d4(a,e);g=c>f?c:f;h=e+1|0;if((h|0)>(b|0)){d=g;break}else{e=h;f=g}}}c7(a,d);return 1}function gm(a){a=a|0;var b=0,c=0.0,d=0.0,e=0,f=0.0,g=0.0,h=0;b=cL(a)|0;c=+d4(a,1);if((b|0)<2){d=c}else{e=2;f=c;while(1){c=+d4(a,e);g=c<f?c:f;h=e+1|0;if((h|0)>(b|0)){d=g;break}else{e=h;f=g}}}c7(a,d);return 1}function gn(a){a=a|0;var b=0,c=0,d=0.0;b=i;i=i+8|0;c=b|0;d=+aI(+(+d4(a,1)),c|0);c7(a,+h[c>>3]);c7(a,d);i=b;return 2}function go(a){a=a|0;var b=0.0;b=+d4(a,1);c7(a,+R(+b,+(+d4(a,2))));return 1}function gp(a){a=a|0;c7(a,+d4(a,1)*.017453292519943295);return 1}function gq(a){a=a|0;var b=0,d=0.0,e=0,f=0,g=0.0,h=0.0;b=i;d=+((ap()|0)%2147483647|0|0)/2147483647.0;e=cL(a)|0;if((e|0)==0){c7(a,d);f=1;i=b;return f|0}else if((e|0)==1){g=+d4(a,1);if(g<1.0){dQ(a,1,7400)|0}c7(a,+O(d*g)+1.0);f=1;i=b;return f|0}else if((e|0)==2){g=+d4(a,1);h=+d4(a,2);if(g>h){dQ(a,2,7400)|0}c7(a,g+ +O(d*(h-g+1.0)));f=1;i=b;return f|0}else{e=dR(a,7232,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;f=e;i=b;return f|0}return 0}function gr(a){a=a|0;bw(d7(a,1)|0);ap()|0;return 0}function gs(a){a=a|0;c7(a,+a7(+(+d4(a,1))));return 1}function gt(a){a=a|0;c7(a,+T(+d4(a,1)));return 1}function gu(a){a=a|0;c7(a,+Q(+d4(a,1)));return 1}function gv(a){a=a|0;c7(a,+bB(+(+d4(a,1))));return 1}function gw(a){a=a|0;c7(a,+U(+d4(a,1)));return 1}function gx(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;j=i;k=c[e>>2]|0;do{if((k|0)<((g|0)/2|0|0)){l=k<<1;m=(l|0)<4?4:l}else{if((k|0)<(g|0)){m=g;break}eM(b,9272,(l=i,i=i+16|0,c[l>>2]=h,c[l+8>>2]=g,l)|0);i=l;return 0}}while(0);if((m+1|0)>>>0>(4294967293/(f>>>0)|0)>>>0){gy(b);return 0}g=aa(k,f)|0;k=aa(m,f)|0;f=c[b+12>>2]|0;h=(d|0)!=0;l=f|0;n=f+4|0;o=ci[c[l>>2]&7](c[n>>2]|0,d,g,k)|0;if((o|0)!=0|(k|0)==0){p=o;q=f+12|0;r=c[q>>2]|0;s=-g|0;t=h?s:0;u=t+k|0;v=u+r|0;c[q>>2]=v;c[e>>2]=m;i=j;return p|0}if((a[f+63|0]|0)==0){eR(b,4);return 0}fw(b,1);o=ci[c[l>>2]&7](c[n>>2]|0,d,g,k)|0;if((o|0)==0){eR(b,4);return 0}else{p=o;q=f+12|0;r=c[q>>2]|0;s=-g|0;t=h?s:0;u=t+k|0;v=u+r|0;c[q>>2]=v;c[e>>2]=m;i=j;return p|0}return 0}function gy(a){a=a|0;eM(a,11400,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0);i=a}function gz(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[b+12>>2]|0;h=(d|0)!=0;i=g|0;j=g+4|0;k=ci[c[i>>2]&7](c[j>>2]|0,d,e,f)|0;do{if((k|0)!=0|(f|0)==0){l=k}else{if((a[g+63|0]|0)==0){eR(b,4);return 0}fw(b,1);m=ci[c[i>>2]&7](c[j>>2]|0,d,e,f)|0;if((m|0)!=0){l=m;break}eR(b,4);return 0}}while(0);b=g+12|0;c[b>>2]=(h?-e|0:0)+f+(c[b>>2]|0);return l|0}function gA(a){a=a|0;eu(a,-1001e3,9088)|0;dn(a,0,1);de(a,142,0);dt(a,-2,11384);dw(a,-2)|0;dn(a,0,3);et(a,408,0);dn(a,4,0);cR(a,-2);de(a,110,1);dv(a,-2,1);cR(a,-2);de(a,26,1);dv(a,-2,2);cR(a,-2);de(a,298,1);dv(a,-2,3);cR(a,-2);de(a,6,1);dv(a,-2,4);cR(a,-1);dt(a,-3,9032);dt(a,-2,7048);gC(a,5480,4288,3824,3352);gC(a,3032,2696,12032,11640);da(a,11360,10)|0;dt(a,-2,11064);eu(a,-1001e3,10784)|0;dt(a,-2,10568);eu(a,-1001e3,10352)|0;dt(a,-2,10120);dm(a,-1001e3,2);cR(a,-2);et(a,1664,1);cM(a,-2);return 1}function gB(a){a=a|0;var b=0,c=0;b=eo(a,1)|0;if((b|0)>0){c=b}else{return 0}do{dm(a,1,c);c3(a,-1)|0;cM(a,-2);c=c-1|0;}while((c|0)>0);return 0}function gC(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=by(c|0)|0;if((f|0)==0){c=by(d|0)|0;if((c|0)!=0){g=c;h=2697}}else{g=f;h=2697}do{if((h|0)==2697){dk(a,-1001e3,7384);f=c0(a,-1)|0;cM(a,-2);if((f|0)!=0){break}f=ew(a,g,7920,7720)|0;ew(a,f,7568,e)|0;cN(a,-2);dt(a,-2,b);return}}while(0);db(a,e)|0;dt(a,-2,b);return}function gD(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;i=i+104|0;d=b|0;e=d0(a,1,0)|0;f=cL(a)|0;eq(a,e,1);dk(a,-1,9016);g=(cS(a,-1)|0)==0;cM(a,-2);if(g){cR(a,-1);dt(a,-2,8392);db(a,e)|0;dt(a,-2,9016);g=a0(e|0,46)|0;h=((g|0)==0?e:g+1|0)-e|0;da(a,e,h)|0;dt(a,-2,8136)}cR(a,-1);do{if((eF(a,1,d)|0)==0){j=2708}else{if((eJ(a,8840,d)|0)==0){j=2708;break}if((cU(a,-1)|0)!=0){j=2708}}}while(0);if((j|0)==2708){dR(a,8560,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j}cR(a,-2);dM(a,-2,1)|0;cM(a,-2);if((f|0)<2){i=b;return 1}else{k=2}do{if((cS(a,k)|0)==6){cR(a,k);cR(a,-2);dz(a,1,0,0,0)}k=k+1|0;}while((k|0)<=(f|0));i=b;return 1}function gE(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+1040|0;d=b|0;e=d0(a,1,0)|0;cM(a,1);dk(a,-1001e3,10784);dk(a,2,e);if((c0(a,-1)|0)!=0){i=b;return 1}cM(a,-2);ef(a,d);dk(a,-1001001,7048);if((cS(a,3)|0)==5){f=1}else{dR(a,9424,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;f=1}while(1){dm(a,3,f);if((cS(a,-1)|0)==0){cM(a,-2);ec(d);h=c1(a,-1,0)|0;dR(a,9208,(g=i,i=i+16|0,c[g>>2]=e,c[g+8>>2]=h,g)|0)|0;i=g}db(a,e)|0;dz(a,1,2,0,0);if((cS(a,-2)|0)==6){break}if((cW(a,-2)|0)==0){cM(a,-3)}else{cM(a,-2);ee(d)}f=f+1|0}db(a,e)|0;cO(a,-2);dz(a,2,1,0,0);if((cS(a,-1)|0)!=0){dt(a,2,e)}dk(a,2,e);if((cS(a,-1)|0)!=0){i=b;return 1}df(a,1);cR(a,-1);dt(a,2,e);i=b;return 1}function gF(a){a=a|0;var b=0,d=0;b=i;d=d0(a,1,0)|0;dk(a,-1001e3,10352);dk(a,-1,d);if((cS(a,-1)|0)!=0){i=b;return 1}dd(a,5064,(a=i,i=i+8|0,c[a>>2]=d,a)|0)|0;i=a;i=b;return 1}function gG(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=d0(a,1,0)|0;dk(a,-1001001,5480);e=c1(a,-1,0)|0;if((e|0)==0){dR(a,5952,(f=i,i=i+8|0,c[f>>2]=5480,f)|0)|0;i=f}g=gL(a,d,e,6680,7224)|0;if((g|0)==0){h=1;i=b;return h|0}if((eh(a,g,0)|0)==0){db(a,g)|0;h=2;i=b;return h|0}else{e=c1(a,1,0)|0;d=c1(a,-1,0)|0;j=dR(a,6776,(f=i,i=i+24|0,c[f>>2]=e,c[f+8>>2]=g,c[f+16>>2]=d,f)|0)|0;i=f;h=j;i=b;return h|0}return 0}function gH(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=d0(a,1,0)|0;dk(a,-1001001,3032);e=c1(a,-1,0)|0;if((e|0)==0){dR(a,5952,(f=i,i=i+8|0,c[f>>2]=3032,f)|0)|0;i=f}g=gL(a,d,e,6680,7224)|0;if((g|0)==0){h=1;i=b;return h|0}if((gJ(a,g,d)|0)==0){db(a,g)|0;h=2;i=b;return h|0}else{d=c1(a,1,0)|0;e=c1(a,-1,0)|0;j=dR(a,6776,(f=i,i=i+24|0,c[f>>2]=d,c[f+8>>2]=g,c[f+16>>2]=e,f)|0)|0;i=f;h=j;i=b;return h|0}return 0}function gI(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=d0(a,1,0)|0;e=aT(d|0,46)|0;if((e|0)==0){f=0;i=b;return f|0}da(a,d,e-d|0)|0;e=c1(a,-1,0)|0;dk(a,-1001001,3032);g=c1(a,-1,0)|0;if((g|0)==0){dR(a,5952,(h=i,i=i+8|0,c[h>>2]=3032,h)|0)|0;i=h}j=gL(a,e,g,6680,7224)|0;if((j|0)==0){f=1;i=b;return f|0}g=gJ(a,j,d)|0;if((g|0)==0){db(a,j)|0;f=2;i=b;return f|0}else if((g|0)==2){dd(a,7016,(h=i,i=i+16|0,c[h>>2]=d,c[h+8>>2]=j,h)|0)|0;i=h;f=1;i=b;return f|0}else{d=c1(a,1,0)|0;g=c1(a,-1,0)|0;e=dR(a,6776,(h=i,i=i+24|0,c[h>>2]=d,c[h+8>>2]=j,c[h+16>>2]=g,h)|0)|0;i=h;f=e;i=b;return f|0}return 0}function gJ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=ew(a,d,6680,6520)|0;d=aT(f|0,45)|0;do{if((d|0)==0){g=f}else{h=da(a,f,d-f|0)|0;j=dd(a,6192,(k=i,i=i+8|0,c[k>>2]=h,k)|0)|0;i=k;h=gK(a,b,j)|0;if((h|0)==2){g=d+1|0;break}else{l=h;i=e;return l|0}}}while(0);d=dd(a,6192,(k=i,i=i+8|0,c[k>>2]=g,k)|0)|0;i=k;l=gK(a,b,d)|0;i=e;return l|0}function gK(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;dk(b,-1001e3,9088);dk(b,-1,c);c=c3(b,-1)|0;cM(b,-3);if((c|0)==0){da(b,6056,58)|0;e=1;return e|0}if((a[d]|0)==42){df(b,1);e=0;return e|0}else{da(b,6056,58)|0;e=2;return e|0}return 0}function gL(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+1040|0;j=h|0;ef(b,j);if((a[f]|0)==0){k=d}else{k=ew(b,d,f,g)|0}g=e;while(1){e=a[g]|0;if((e<<24>>24|0)==59){g=g+1|0;continue}else if((e<<24>>24|0)==0){l=2800;break}e=aT(g|0,59)|0;if((e|0)==0){m=g+(kU(g|0)|0)|0}else{m=e}da(b,g,m-g|0)|0;if((m|0)==0){l=2800;break}n=ew(b,c1(b,-1,0)|0,5816,k)|0;cN(b,-2);o=bm(n|0,5472)|0;if((o|0)!=0){l=2798;break}dd(b,5656,(e=i,i=i+8|0,c[e>>2]=n,e)|0)|0;i=e;cN(b,-2);ee(j);g=m}if((l|0)==2798){ar(o|0)|0;p=n;i=h;return p|0}else if((l|0)==2800){ec(j);p=0;i=h;return p|0}return 0}function gM(a){a=a|0;var b=0,c=0,d=0;b=d0(a,1,0)|0;c=gK(a,b,d0(a,2,0)|0)|0;if((c|0)==0){d=1;return d|0}c6(a);cO(a,-2);db(a,(c|0)==1?4520:4448)|0;d=3;return d|0}function gN(a){a=a|0;var b=0,c=0,d=0,e=0;b=d0(a,1,0)|0;c=d0(a,2,0)|0;d=d$(a,3,6680,0)|0;if((gL(a,b,c,d,d$(a,4,7224,0)|0)|0)!=0){e=1;return e|0}c6(a);cO(a,-2);e=2;return e|0}function gO(a){a=a|0;d2(a,1,5);if((dp(a,1)|0)==0){dn(a,0,1);cR(a,-1);dw(a,1)|0}dm(a,-1001e3,2);dt(a,-2,4592);return 0}function gP(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;if(a>>>0<8){b=a;return b|0}if(a>>>0>15){c=a;d=1;do{e=c+1|0;c=e>>>1;d=d+1|0;}while(e>>>0>31);f=c;g=d<<3}else{f=a;g=8}b=g|f-8;return b|0}function gQ(a){a=a|0;var b=0,c=0;b=a>>>3&31;if((b|0)==0){c=a;return c|0}c=(a&7|8)<<b-1;return c|0}function gR(a){a=a|0;var b=0,c=0,e=0,f=0,g=0,h=0;b=a-1|0;if(b>>>0>255){a=b;c=0;while(1){e=c+8|0;f=a>>>8;if(a>>>0>65535){a=f;c=e}else{g=f;h=e;break}}}else{g=b;h=0}return(d[1312+g|0]|0)+h|0}function gS(a,b,c){a=a|0;b=+b;c=+c;var d=0.0;switch(a|0){case 0:{d=b+c;break};case 6:{d=-0.0-b;break};case 5:{d=+R(+b,+c);break};case 4:{d=b- +O(b/c)*c;break};case 3:{d=b/c;break};case 1:{d=b-c;break};case 2:{d=b*c;break};default:{d=0.0}}return+d}function gT(b){b=b|0;var c=0;if((a[b+729|0]&2)==0){c=(b|32)-87|0;return c|0}else{c=b-48|0;return c|0}return 0}function gU(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0,z=0,A=0,B=0,C=0,D=0.0,E=0,F=0,G=0,H=0,I=0.0,J=0,K=0,L=0.0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0.0,aa=0;g=i;i=i+8|0;j=g|0;if((b1(b|0,7968)|0)!=0){k=0;i=g;return k|0}L3606:do{if((b1(b|0,11200)|0)==0){l=+kT(b,j);m=l;n=c[j>>2]|0}else{c[j>>2]=b;o=b;while(1){p=a[o]|0;q=o+1|0;if((a[(p&255)+729|0]&8)==0){break}else{o=q}}if((p<<24>>24|0)==43){r=0;s=q}else if((p<<24>>24|0)==45){r=1;s=q}else{r=0;s=o}do{if((a[s]|0)==48){t=a[s+1|0]|0;if(!((t<<24>>24|0)==120|(t<<24>>24|0)==88)){break}t=s+2|0;u=a[t]|0;v=u&255;w=a[v+729|0]|0;if((w&16)==0){x=0.0;y=0;z=t;A=u}else{l=0.0;u=v;v=w;w=0;B=t;while(1){if((v&2)==0){C=(u|32)-87|0}else{C=u-48|0}D=l*16.0+ +(C|0);t=w+1|0;E=B+1|0;F=a[E]|0;G=F&255;H=a[G+729|0]|0;if((H&16)==0){x=D;y=t;z=E;A=F;break}else{l=D;u=G;v=H;w=t;B=E}}}do{if(A<<24>>24==46){B=z+1|0;w=d[B]|0;v=a[w+729|0]|0;if((v&16)==0){I=x;J=0;K=B;break}else{L=x;M=w;N=v;O=0;P=B}while(1){if((N&2)==0){Q=(M|32)-87|0}else{Q=M-48|0}l=L*16.0+ +(Q|0);B=O+1|0;v=P+1|0;w=d[v]|0;u=a[w+729|0]|0;if((u&16)==0){I=l;J=B;K=v;break}else{L=l;M=w;N=u;O=B;P=v}}}else{I=x;J=0;K=z}}while(0);if((J|y|0)==0){break}v=J*-4|0;c[j>>2]=K;B=a[K]|0;do{if((B<<24>>24|0)==112|(B<<24>>24|0)==80){u=K+1|0;w=a[u]|0;if((w<<24>>24|0)==43){R=0;S=K+2|0}else if((w<<24>>24|0)==45){R=1;S=K+2|0}else{R=0;S=u}u=a[S]|0;if((a[(u&255)+729|0]&2)==0){T=v;U=K;break}else{V=S;W=0;X=u}do{V=V+1|0;W=(X<<24>>24)-48+(W*10|0)|0;X=a[V]|0;}while((a[(X&255)+729|0]&2)!=0);Y=((R|0)==0?W:-W|0)+v|0;Z=V;_=2876}else{Y=v;Z=K;_=2876}}while(0);if((_|0)==2876){c[j>>2]=Z;T=Y;U=Z}if((r|0)==0){$=I}else{$=-0.0-I}m=+bi(+$,T|0);n=U;break L3606}}while(0);h[f>>3]=0.0;k=0;i=g;return k|0}}while(0);h[f>>3]=m;if((n|0)==(b|0)){k=0;i=g;return k|0}if((a[(d[n]|0)+729|0]&8)==0){aa=n}else{f=n;do{f=f+1|0;}while((a[(d[f]|0)+729|0]&8)!=0);c[j>>2]=f;aa=f}k=(aa|0)==(b+e|0)|0;i=g;return k|0}function gV(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;g=i;i=i+32|0;j=g|0;k=aT(e|0,37)|0;l=b+24|0;m=b+8|0;n=c[m>>2]|0;o=(c[l>>2]|0)-n|0;L3665:do{if((k|0)==0){p=0;q=e;r=o;s=n}else{t=g+8|0;u=0;w=e;x=k;y=o;z=n;L3667:while(1){if((y|0)<48){eU(b,2);A=c[m>>2]|0}else{A=z}c[m>>2]=A+16;B=hH(b,w,x-w|0)|0;c[A>>2]=B;c[A+8>>2]=d[B+4|0]|64;C=a[x+1|0]|0;switch(C|0){case 112:{B=(v=c[f+4>>2]|0,c[f+4>>2]=v+8,c[(c[f>>2]|0)+v>>2]|0);D=a$(t|0,6936,(E=i,i=i+8|0,c[E>>2]=B,E)|0)|0;i=E;B=c[m>>2]|0;c[m>>2]=B+16;F=hH(b,t,D)|0;c[B>>2]=F;c[B+8>>2]=d[F+4|0]|64;break};case 99:{a[j]=(v=c[f+4>>2]|0,c[f+4>>2]=v+8,c[(c[f>>2]|0)+v>>2]|0)&255;F=c[m>>2]|0;c[m>>2]=F+16;B=hH(b,j,1)|0;c[F>>2]=B;c[F+8>>2]=d[B+4|0]|64;break};case 115:{B=(v=c[f+4>>2]|0,c[f+4>>2]=v+8,c[(c[f>>2]|0)+v>>2]|0);F=(B|0)==0?8920:B;B=kU(F|0)|0;D=c[m>>2]|0;c[m>>2]=D+16;G=hH(b,F,B)|0;c[D>>2]=G;c[D+8>>2]=d[G+4|0]|64;break};case 100:{G=c[m>>2]|0;c[m>>2]=G+16;h[G>>3]=+((v=c[f+4>>2]|0,c[f+4>>2]=v+8,c[(c[f>>2]|0)+v>>2]|0)|0);c[G+8>>2]=3;break};case 102:{G=c[m>>2]|0;c[m>>2]=G+16;h[G>>3]=(v=c[f+4>>2]|0,c[f+4>>2]=v+8,+h[(c[f>>2]|0)+v>>3]);c[G+8>>2]=3;break};case 37:{G=c[m>>2]|0;c[m>>2]=G+16;D=hH(b,5400,1)|0;c[G>>2]=D;c[G+8>>2]=d[D+4|0]|64;break};default:{break L3667}}D=u+2|0;G=x+2|0;B=aT(G|0,37)|0;F=c[m>>2]|0;H=(c[l>>2]|0)-F|0;if((B|0)==0){p=D;q=G;r=H;s=F;break L3665}else{u=D;w=G;x=B;y=H;z=F}}eM(b,4224,(E=i,i=i+8|0,c[E>>2]=C,E)|0);i=E;return 0}}while(0);if((r|0)<32){eU(b,1);I=c[m>>2]|0}else{I=s}s=kU(q|0)|0;c[m>>2]=I+16;r=hH(b,q,s)|0;c[I>>2]=r;c[I+8>>2]=d[r+4|0]|64;if((p|0)<=0){J=c[m>>2]|0;K=J-16|0;L=K;M=c[L>>2]|0;N=M+16|0;O=N;i=g;return O|0}iI(b,p|1);J=c[m>>2]|0;K=J-16|0;L=K;M=c[L>>2]|0;N=M+16|0;O=N;i=g;return O|0}function gW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;g=f;c[g>>2]=d;c[g+4>>2]=0;g=gV(a,b,f|0)|0;i=e;return g|0}function gX(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=kU(c|0)|0;f=a[c]|0;if((f<<24>>24|0)==61){g=c+1|0;if(e>>>0>d>>>0){h=d-1|0;kV(b|0,g|0,h)|0;a[b+h|0]=0;return}else{kV(b|0,g|0,e)|0;return}}else if((f<<24>>24|0)==64){if(e>>>0>d>>>0){a[b]=a[3816]|0;a[b+1|0]=a[3817]|0;a[b+2|0]=a[3818]|0;f=b+3|0;g=d-3|0;h=c+(4-d+e)|0;kV(f|0,h|0,g)|0;return}else{g=c+1|0;kV(b|0,g|0,e)|0;return}}else{g=aT(c|0,10)|0;kV(b|0,3336,9)|0;h=b+9|0;f=d-15|0;d=(g|0)==0;if(e>>>0<f>>>0&d){kV(h|0,c|0,e)|0;i=e+9|0}else{if(d){j=e}else{j=g-c|0}g=j>>>0>f>>>0?f:j;kV(h|0,c|0,g)|0;c=b+(g+9)|0;a[c]=a[3816]|0;a[c+1|0]=a[3817]|0;a[c+2|0]=a[3818]|0;i=g+12|0}g=b+i|0;a[g]=a[3024]|0;a[g+1|0]=a[3025]|0;a[g+2|0]=a[3026]|0;return}}function gY(a){a=a|0;dn(a,0,11);et(a,88,0);return 1}function gZ(a){a=a|0;c7(a,+(aV()|0)/1.0e6);return 1}function g_(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+1256|0;e=d|0;f=d+8|0;g=d+16|0;h=d+1056|0;j=d$(b,1,8384,0)|0;if((cS(b,2)|0)<1){k=cc(0)|0}else{k=~~+d4(b,2)}c[e>>2]=k;if((a[j]|0)==33){l=j+1|0;m=a5(e|0)|0}else{l=j;m=aB(e|0)|0}if((m|0)==0){c6(b);i=d;return 1}if((aJ(l|0,8128)|0)==0){dn(b,0,9);c8(b,c[m>>2]|0);dt(b,-2,11352);c8(b,c[m+4>>2]|0);dt(b,-2,11048);c8(b,c[m+8>>2]|0);dt(b,-2,10776);c8(b,c[m+12>>2]|0);dt(b,-2,10560);c8(b,(c[m+16>>2]|0)+1|0);dt(b,-2,10344);c8(b,(c[m+20>>2]|0)+1900|0);dt(b,-2,10112);c8(b,(c[m+24>>2]|0)+1|0);dt(b,-2,7912);c8(b,(c[m+28>>2]|0)+1|0);dt(b,-2,7712);e=c[m+32>>2]|0;if((e|0)<0){i=d;return 1}df(b,e);dt(b,-2,9880);i=d;return 1}e=f|0;a[e]=37;ef(b,g);j=g+8|0;k=g+4|0;n=g|0;o=f+1|0;p=h|0;h=f+2|0;f=l;while(1){l=a[f]|0;if((l<<24>>24|0)==0){break}else if((l<<24>>24|0)!=37){q=c[j>>2]|0;if(q>>>0<(c[k>>2]|0)>>>0){r=l;s=q}else{d9(g,1)|0;r=a[f]|0;s=c[j>>2]|0}c[j>>2]=s+1;a[(c[n>>2]|0)+s|0]=r;f=f+1|0;continue}q=f+1|0;l=f+2|0;t=a[q]|0;do{if(t<<24>>24==0){u=2953}else{if((aK(7544,t<<24>>24|0,23)|0)==0){u=2953;break}a[o]=t;a[h]=0;v=l}}while(0);if((u|0)==2953){u=0;l=dd(b,7176,(t=i,i=i+8|0,c[t>>2]=q,t)|0)|0;i=t;dQ(b,1,l)|0;v=q}ea(g,p,be(p|0,200,e|0,m|0)|0);f=v}ec(g);i=d;return 1}function g$(a){a=a|0;var b=0;b=~~+d4(a,1);c7(a,+b8(b|0,~~+d5(a,2,0.0)|0));return 1}function g0(a){a=a|0;var b=0,c=0,d=0;b=d$(a,1,0,0)|0;c=bs(b|0)|0;if((b|0)==0){df(a,c);d=1;return d|0}else{d=dV(a,c)|0;return d|0}return 0}function g1(a){a=a|0;var b=0;if((cS(a,1)|0)==1){b=(c0(a,1)|0)==0|0}else{b=d8(a,1,0)|0}if((c0(a,2)|0)!=0){hC(a)}if((a|0)==0){return 0}else{a_(b|0);return 0}return 0}function g2(a){a=a|0;db(a,by(d0(a,1,0)|0)|0)|0;return 1}function g3(a){a=a|0;var b=0;b=d0(a,1,0)|0;return dU(a,(aH(b|0)|0)==0|0,b)|0}function g4(a){a=a|0;var b=0;b=d0(a,1,0)|0;return dU(a,(bI(b|0,d0(a,2,0)|0)|0)==0|0,0)|0}function g5(a){a=a|0;var b=0;b=d$(a,1,0,0)|0;db(a,bh(c[472+((d_(a,2,9416,440)|0)<<2)>>2]|0,b|0)|0)|0;return 1}function g6(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+96|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;h=b+32|0;j=b+40|0;k=b+48|0;if((cS(a,1)|0)<1){l=cc(0)|0}else{d2(a,1,5);cM(a,1);dk(a,-1,11352);m=c_(a,-1,j)|0;n=(c[j>>2]|0)==0?0:m;cM(a,-2);c[k>>2]=n;dk(a,-1,11048);n=c_(a,-1,h)|0;m=(c[h>>2]|0)==0?0:n;cM(a,-2);c[k+4>>2]=m;dk(a,-1,10776);m=c_(a,-1,g)|0;n=(c[g>>2]|0)==0?12:m;cM(a,-2);c[k+8>>2]=n;dk(a,-1,10560);n=c_(a,-1,f)|0;if((c[f>>2]|0)==0){f=dR(a,9648,(o=i,i=i+8|0,c[o>>2]=10560,o)|0)|0;i=o;p=f}else{cM(a,-2);p=n}c[k+12>>2]=p;dk(a,-1,10344);p=c_(a,-1,e)|0;if((c[e>>2]|0)==0){e=dR(a,9648,(o=i,i=i+8|0,c[o>>2]=10344,o)|0)|0;i=o;q=e}else{cM(a,-2);q=p}c[k+16>>2]=q-1;dk(a,-1,10112);q=c_(a,-1,d)|0;if((c[d>>2]|0)==0){d=dR(a,9648,(o=i,i=i+8|0,c[o>>2]=10112,o)|0)|0;i=o;r=d}else{cM(a,-2);r=q}c[k+20>>2]=r-1900;dk(a,-1,9880);if((cS(a,-1)|0)==0){s=-1}else{s=c0(a,-1)|0}cM(a,-2);c[k+32>>2]=s;l=ay(k|0)|0}if((l|0)==-1){c6(a);i=b;return 1}else{c7(a,+(l|0));i=b;return 1}return 0}function g7(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+24|0;d=b|0;if((az(d|0)|0)==0){e=dR(a,11592,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f;g=e;i=b;return g|0}else{db(a,d)|0;g=1;i=b;return g|0}return 0}function g8(d,e,f,g,h,j){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;k=i;i=i+176|0;l=k|0;m=k+16|0;n=k+40|0;o=k+120|0;p=e9(d,1)|0;q=d+8|0;r=c[q>>2]|0;c[r>>2]=p;c[r+8>>2]=70;r=(c[q>>2]|0)+16|0;c[q>>2]=r;if(((c[d+24>>2]|0)-r|0)<16){eU(d,0)}r=fe(d)|0;c[p+12>>2]=r;q=o|0;c[q>>2]=r;c[r+36>>2]=hI(d,h)|0;c[n+60>>2]=f;f=n+64|0;c[f>>2]=g;c[g+28>>2]=0;c[g+16>>2]=0;c[g+4>>2]=0;g=c[q>>2]|0;h=g+36|0;kF(d,n,e,c[h>>2]|0,j);j=c[n+52>>2]|0;e=n+48|0;c[o+8>>2]=c[e>>2];d=o+12|0;c[d>>2]=n;c[e>>2]=o;c[o+20>>2]=0;c[o+24>>2]=0;c[o+28>>2]=-1;c[o+32>>2]=0;c[o+36>>2]=0;kY(o+44|0,0,5);c[o+40>>2]=c[(c[f>>2]|0)+4>>2];f=o+16|0;c[f>>2]=0;c[h>>2]=c[n+68>>2];a[g+78|0]=2;g=h9(j)|0;c[o+4>>2]=g;h=j+8|0;e=c[h>>2]|0;c[e>>2]=g;c[e+8>>2]=69;e=(c[h>>2]|0)+16|0;c[h>>2]=e;if(((c[j+24>>2]|0)-e|0)<16){eU(j,0)}a[l+10|0]=0;a[l+8|0]=a[o+46|0]|0;j=(c[d>>2]|0)+64|0;b[l+4>>1]=c[(c[j>>2]|0)+28>>2]&65535;b[l+6>>1]=c[(c[j>>2]|0)+16>>2]&65535;a[l+9|0]=0;c[l>>2]=c[f>>2];c[f>>2]=l;a[(c[q>>2]|0)+77|0]=1;c[m+16>>2]=-1;c[m+20>>2]=-1;c[m>>2]=7;c[m+8>>2]=0;g9(o,c[n+72>>2]|0,m)|0;kG(n);m=n+16|0;L3811:while(1){o=c[m>>2]|0;switch(o|0){case 260:case 261:case 262:case 286:case 277:{s=o;break L3811;break};default:{}}hg(n);if((o|0)==274){t=3013;break}}if((t|0)==3013){s=c[m>>2]|0}if((s|0)==286){ha(n);i=k;return p|0}else{hf(n,286);return 0}return 0}function g9(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;h=c[b>>2]|0;j=h+40|0;k=c[j>>2]|0;l=b+47|0;m=(d[l]|0)+1|0;if(m>>>0>255){n=b+12|0;o=c[(c[n>>2]|0)+52>>2]|0;p=c[h+64>>2]|0;if((p|0)==0){q=10760;r=gW(o,10312,(s=i,i=i+24|0,c[s>>2]=7696,c[s+8>>2]=255,c[s+16>>2]=q,s)|0)|0;i=s;t=c[n>>2]|0;kC(t,r);return 0}u=gW(o,10520,(s=i,i=i+8|0,c[s>>2]=p,s)|0)|0;i=s;q=u;r=gW(o,10312,(s=i,i=i+24|0,c[s>>2]=7696,c[s+8>>2]=255,c[s+16>>2]=q,s)|0)|0;i=s;t=c[n>>2]|0;kC(t,r);return 0}if((m|0)>(k|0)){m=h+28|0;c[m>>2]=gx(c[(c[b+12>>2]|0)+52>>2]|0,c[m>>2]|0,j,8,255,7696)|0;v=c[j>>2]|0}else{v=k}m=h+28|0;if((k|0)<(v|0)){v=k;while(1){k=v+1|0;c[(c[m>>2]|0)+(v<<3)>>2]=0;if((k|0)<(c[j>>2]|0)){v=k}else{break}}}a[(c[m>>2]|0)+((d[l]|0)<<3)+4|0]=(c[f>>2]|0)==7|0;a[(c[m>>2]|0)+((d[l]|0)<<3)+5|0]=c[f+8>>2]&255;c[(c[m>>2]|0)+((d[l]|0)<<3)>>2]=e;if((a[e+5|0]&3)==0){w=a[l]|0;x=w+1&255;a[l]=x;y=w&255;i=g;return y|0}if((a[h+5|0]&4)==0){w=a[l]|0;x=w+1&255;a[l]=x;y=w&255;i=g;return y|0}fh(c[(c[b+12>>2]|0)+52>>2]|0,h,e);w=a[l]|0;x=w+1&255;a[l]=x;y=w&255;i=g;return y|0}function ha(a){a=a|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=c[a+52>>2]|0;f=a+48|0;g=c[f>>2]|0;h=c[g>>2]|0;jD(g,0,0);hb(g);i=g+20|0;j=c[i>>2]|0;if((j+1|0)>>>0>1073741823){gy(e)}k=h+12|0;l=h+48|0;c[k>>2]=gz(e,c[k>>2]|0,c[l>>2]<<2,j<<2)|0;c[l>>2]=c[i>>2];l=c[i>>2]|0;if((l+1|0)>>>0>1073741823){gy(e)}j=h+20|0;k=h+52|0;c[j>>2]=gz(e,c[j>>2]|0,c[k>>2]<<2,l<<2)|0;c[k>>2]=c[i>>2];i=g+32|0;k=c[i>>2]|0;if((k+1|0)>>>0>268435455){gy(e)}l=h+8|0;j=h+44|0;c[l>>2]=gz(e,c[l>>2]|0,c[j>>2]<<4,k<<4)|0;c[j>>2]=c[i>>2];i=g+36|0;j=c[i>>2]|0;if((j+1|0)>>>0>1073741823){gy(e)}k=h+16|0;l=h+56|0;c[k>>2]=gz(e,c[k>>2]|0,c[l>>2]<<2,j<<2)|0;c[l>>2]=c[i>>2];i=g+44|0;l=b[i>>1]|0;if((l+1|0)>>>0>357913941){gy(e)}j=h+24|0;k=h+60|0;c[j>>2]=gz(e,c[j>>2]|0,(c[k>>2]|0)*12|0,l*12|0)|0;c[k>>2]=b[i>>1]|0;i=g+47|0;k=h+28|0;l=h+40|0;c[k>>2]=gz(e,c[k>>2]|0,c[l>>2]<<3,d[i]<<3)|0;c[l>>2]=d[i]|0;c[f>>2]=c[g+8>>2];if(((c[a+16>>2]|0)-288|0)>>>0<2){g=c[a+24>>2]|0;f=g+16|0;i=c[g+12>>2]|0;kE(a,f,i)|0}i=e+8|0;c[i>>2]=(c[i>>2]|0)-16;if((c[(c[e+12>>2]|0)+12>>2]|0)<=0){return}fv(e);return}function hb(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;g=e+16|0;h=c[g>>2]|0;j=e+12|0;k=c[j>>2]|0;l=h|0;do{if((c[l>>2]|0)!=0){if((a[h+9|0]|0)==0){break}m=jA(e)|0;jH(e,m,d[h+8|0]|0);jG(e,m)}}while(0);L3870:do{if((a[h+10|0]|0)!=0){m=k+52|0;n=hI(c[m>>2]|0,6736)|0;o=k+64|0;p=c[o>>2]|0;q=p+24|0;r=k+48|0;s=c[(c[r>>2]|0)+20>>2]|0;t=p+28|0;u=c[t>>2]|0;v=p+32|0;if((u+1|0)>(c[v>>2]|0)){p=q|0;w=gx(c[m>>2]|0,c[p>>2]|0,v,16,32767,5192)|0;c[p>>2]=w;x=w}else{x=c[q>>2]|0}w=q|0;c[x+(u<<4)>>2]=n;c[(c[w>>2]|0)+(u<<4)+8>>2]=0;a[(c[w>>2]|0)+(u<<4)+12|0]=a[(c[r>>2]|0)+46|0]|0;c[(c[w>>2]|0)+(u<<4)+4>>2]=s;c[t>>2]=(c[t>>2]|0)+1;t=c[o>>2]|0;o=(c[t+24>>2]|0)+(u<<4)|0;u=b[(c[(c[r>>2]|0)+16>>2]|0)+6>>1]|0;r=t+16|0;if((u|0)>=(c[r>>2]|0)){break}s=t+12|0;t=o|0;w=u;do{while(1){if((hE(c[(c[s>>2]|0)+(w<<4)>>2]|0,c[t>>2]|0)|0)==0){break}he(k,w,o);if((w|0)>=(c[r>>2]|0)){break L3870}}w=w+1|0;}while((w|0)<(c[r>>2]|0))}}while(0);c[g>>2]=c[l>>2];g=h+8|0;x=a[g]|0;r=e+46|0;w=(c[(c[j>>2]|0)+64>>2]|0)+4|0;c[w>>2]=(x&255)-(d[r]|0)+(c[w>>2]|0);w=a[r]|0;if((w&255)>(x&255)){o=e+20|0;t=e|0;s=e+40|0;u=w;while(1){n=c[o>>2]|0;q=u-1&255;a[r]=q;c[(c[(c[t>>2]|0)+24>>2]|0)+((b[(c[c[(c[j>>2]|0)+64>>2]>>2]|0)+((c[s>>2]|0)+(q&255)<<1)>>1]|0)*12|0)+8>>2]=n;n=a[r]|0;if((n&255)>(x&255)){u=n}else{y=n;break}}}else{y=w}a[e+48|0]=y;y=k+64|0;c[(c[y>>2]|0)+28>>2]=b[h+4>>1]|0;w=b[h+6>>1]|0;if((c[l>>2]|0)==0){l=c[y>>2]|0;if((w|0)>=(c[l+16>>2]|0)){i=f;return}y=c[l+12>>2]|0;l=c[y+(w<<4)>>2]|0;u=l;if((a[u+4|0]|0)!=4){z=10888;A=k+52|0;B=c[A>>2]|0;C=l+16|0;D=y+(w<<4)+8|0;E=c[D>>2]|0;F=gW(B,z,(G=i,i=i+16|0,c[G>>2]=C,c[G+8>>2]=E,G)|0)|0;i=G;hc(k,F)}z=(a[u+6|0]|0)!=0?6272:10888;A=k+52|0;B=c[A>>2]|0;C=l+16|0;D=y+(w<<4)+8|0;E=c[D>>2]|0;F=gW(B,z,(G=i,i=i+16|0,c[G>>2]=C,c[G+8>>2]=E,G)|0)|0;i=G;hc(k,F)}F=c[(c[j>>2]|0)+64>>2]|0;k=F+16|0;if((w|0)>=(c[k>>2]|0)){i=f;return}G=F+12|0;F=h+9|0;h=w;do{w=c[G>>2]|0;E=w+(h<<4)+12|0;C=a[g]|0;z=C&255;if((d[E]|0)>(C&255)){if((a[F]|0)==0){H=C}else{jH(e,c[w+(h<<4)+4>>2]|0,z);H=a[g]|0}a[E]=H}h=((hd(c[j>>2]|0,h)|0)==0)+h|0;}while((h|0)<(c[k>>2]|0));i=f;return}function hc(a,b){a=a|0;b=b|0;c[a+16>>2]=0;kC(a,b)}function hd(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=e+48|0;h=c[(c[g>>2]|0)+16>>2]|0;i=c[e+64>>2]|0;j=c[i+12>>2]|0;k=h+4|0;l=i+28|0;m=i+24|0;i=j+(f<<4)|0;n=b[k>>1]|0;while(1){if((n|0)>=(c[l>>2]|0)){o=0;p=3095;break}q=c[m>>2]|0;r=q+(n<<4)|0;if((hE(c[r>>2]|0,c[i>>2]|0)|0)==0){n=n+1|0}else{break}}if((p|0)==3095){return o|0}p=a[q+(n<<4)+12|0]|0;do{if((d[j+(f<<4)+12|0]|0)>(p&255)){if((a[h+9|0]|0)==0){if((c[l>>2]|0)<=(b[k>>1]|0)){break}}jH(c[g>>2]|0,c[j+(f<<4)+4>>2]|0,p&255)}}while(0);he(e,f,r);o=1;return o|0}function he(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;j=c[e+48>>2]|0;k=c[e+64>>2]|0;l=k+12|0;m=c[l>>2]|0;n=a[m+(f<<4)+12|0]|0;if((n&255)<(d[g+12|0]|0)){o=c[m+(f<<4)+8>>2]|0;p=(c[(c[(c[j>>2]|0)+24>>2]|0)+((b[(c[c[(c[j+12>>2]|0)+64>>2]>>2]|0)+((c[j+40>>2]|0)+(n&255)<<1)>>1]|0)*12|0)>>2]|0)+16|0;n=gW(c[e+52>>2]|0,8656,(q=i,i=i+24|0,c[q>>2]=(c[m+(f<<4)>>2]|0)+16,c[q+8>>2]=o,c[q+16>>2]=p,q)|0)|0;i=q;hc(e,n)}jF(j,c[m+(f<<4)+4>>2]|0,c[g+4>>2]|0);g=k+16|0;k=(c[g>>2]|0)-1|0;if((k|0)>(f|0)){r=f}else{s=k;c[g>>2]=s;i=h;return}while(1){k=c[l>>2]|0;f=r+1|0;m=k+(r<<4)|0;j=k+(f<<4)|0;c[m>>2]=c[j>>2];c[m+4>>2]=c[j+4>>2];c[m+8>>2]=c[j+8>>2];c[m+12>>2]=c[j+12>>2];j=(c[g>>2]|0)-1|0;if((f|0)<(j|0)){r=f}else{s=j;break}}c[g>>2]=s;i=h;return}function hf(a,b){a=a|0;b=b|0;var d=0,e=0;d=c[a+52>>2]|0;e=kB(a,b)|0;b=gW(d,4120,(d=i,i=i+8|0,c[d>>2]=e,d)|0)|0;i=d;kC(a,b)}function hg(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0;f=i;i=i+440|0;g=f|0;h=f+24|0;j=f+48|0;k=f+72|0;l=f+104|0;m=f+128|0;n=f+152|0;o=f+176|0;p=f+200|0;q=f+224|0;r=f+248|0;s=f+272|0;t=f+288|0;u=f+304|0;v=f+328|0;w=f+344|0;x=f+360|0;y=f+384|0;z=f+400|0;A=f+416|0;B=f+432|0;C=e+4|0;D=c[C>>2]|0;E=e+52|0;F=(c[E>>2]|0)+38|0;G=(b[F>>1]|0)+1&65535;b[F>>1]=G;F=e+48|0;H=c[F>>2]|0;if((G&65535)>200){G=H+12|0;I=c[(c[G>>2]|0)+52>>2]|0;J=c[(c[H>>2]|0)+64>>2]|0;if((J|0)==0){K=10760;L=gW(I,10312,(M=i,i=i+24|0,c[M>>2]=3296,c[M+8>>2]=200,c[M+16>>2]=K,M)|0)|0;i=M;N=c[G>>2]|0;kC(N,L)}O=gW(I,10520,(M=i,i=i+8|0,c[M>>2]=J,M)|0)|0;i=M;K=O;L=gW(I,10312,(M=i,i=i+24|0,c[M>>2]=3296,c[M+8>>2]=200,c[M+16>>2]=K,M)|0)|0;i=M;N=c[G>>2]|0;kC(N,L)}L=e+16|0;switch(c[L>>2]|0){case 267:{c[B>>2]=-1;ht(e,B);while(1){N=c[L>>2]|0;if((N|0)==260){P=3114;break}else if((N|0)!=261){break}ht(e,B)}if((P|0)==3114){kG(e);N=c[F>>2]|0;a[A+10|0]=0;a[A+8|0]=a[N+46|0]|0;G=N+12|0;b[A+4>>1]=c[(c[(c[G>>2]|0)+64>>2]|0)+28>>2]&65535;b[A+6>>1]=c[(c[(c[G>>2]|0)+64>>2]|0)+16>>2]&65535;a[A+9|0]=0;G=N+16|0;c[A>>2]=c[G>>2];c[G>>2]=A;L3951:do{A=c[L>>2]|0;switch(A|0){case 260:case 261:case 262:case 286:case 277:{break L3951;break};default:{}}hg(e)}while((A|0)!=274);hb(N)}hh(e,262,267,D);jG(H,c[B>>2]|0);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 59:{kG(e);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 269:{kG(e);B=c[L>>2]|0;if((B|0)==265){kG(e);N=c[F>>2]|0;if((c[L>>2]|0)!=288){hf(e,288)}A=c[e+24>>2]|0;kG(e);hn(e,A);A=c[F>>2]|0;G=A+46|0;K=(a[G]|0)+1&255;a[G]=K;c[(c[(c[A>>2]|0)+24>>2]|0)+((b[(c[c[(c[A+12>>2]|0)+64>>2]>>2]|0)+((K&255)-1+(c[A+40>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[A+20>>2];hm(e,n,0,c[C>>2]|0);c[(c[(c[N>>2]|0)+24>>2]|0)+((b[(c[c[(c[N+12>>2]|0)+64>>2]>>2]|0)+((c[N+40>>2]|0)+(c[n+8>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[N+20>>2];Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}if((B|0)!=288){hf(e,288)}B=e+24|0;N=1;while(1){n=c[B>>2]|0;kG(e);hn(e,n);n=c[L>>2]|0;if((n|0)==61){P=3185;break}else if((n|0)!=44){P=3187;break}kG(e);if((c[L>>2]|0)==288){N=N+1|0}else{P=3249;break}}do{if((P|0)==3185){kG(e);hk(e,m,0)|0;if((c[L>>2]|0)==44){B=1;while(1){kG(e);jS(c[F>>2]|0,m);hk(e,m,0)|0;n=B+1|0;if((c[L>>2]|0)==44){B=n}else{Y=n;break}}}else{Y=1}B=c[m>>2]|0;n=c[F>>2]|0;A=N-Y|0;if((B|0)==0){Z=n;_=A;P=3192;break}else if(!((B|0)==12|(B|0)==13)){jS(n,m);Z=n;_=A;P=3192;break}B=A+1|0;A=(B|0)<0?0:B;jP(n,m,A);if((A|0)<=1){break}jL(n,A-1|0)}else if((P|0)==3187){c[m>>2]=0;Z=c[F>>2]|0;_=N;P=3192}else if((P|0)==3249){hf(e,288)}}while(0);do{if((P|0)==3192){if((_|0)<=0){break}m=d[Z+48|0]|0;jL(Z,_);jy(Z,m,_)}}while(0);_=c[F>>2]|0;Z=_+46|0;m=(d[Z]|0)+N&255;a[Z]=m;if((N|0)==0){Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}Y=_+20|0;A=_|0;n=_+12|0;B=_+40|0;_=N;N=m;while(1){c[(c[(c[A>>2]|0)+24>>2]|0)+((b[(c[c[(c[n>>2]|0)+64>>2]>>2]|0)+((N&255)-_+(c[B>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[Y>>2];m=_-1|0;if((m|0)==0){break}_=m;N=a[Z]|0}Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 265:{kG(e);if((c[L>>2]|0)!=288){hf(e,288)}Z=c[e+24>>2]|0;kG(e);N=c[F>>2]|0;if((hr(N,Z,p,1)|0)==0){_=c[e+72>>2]|0;hr(N,_,p,1)|0;_=jM(c[F>>2]|0,Z)|0;c[o+16>>2]=-1;c[o+20>>2]=-1;c[o>>2]=4;c[o+8>>2]=_;j0(N,p,o)}while(1){o=c[L>>2]|0;if((o|0)==58){P=3174;break}else if((o|0)!=46){$=0;break}hp(e,p)}if((P|0)==3174){hp(e,p);$=1}hm(e,q,$,D);jY(c[F>>2]|0,p,q);j5(c[F>>2]|0,D);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 264:{a[v+10|0]=1;a[v+8|0]=a[H+46|0]|0;q=H+12|0;b[v+4>>1]=c[(c[(c[q>>2]|0)+64>>2]|0)+28>>2]&65535;b[v+6>>1]=c[(c[(c[q>>2]|0)+64>>2]|0)+16>>2]&65535;a[v+9|0]=0;q=H+16|0;c[v>>2]=c[q>>2];c[q>>2]=v;kG(e);if((c[L>>2]|0)!=288){hf(e,288)}v=e+24|0;q=c[v>>2]|0;kG(e);p=c[L>>2]|0;if((p|0)==44|(p|0)==268){$=c[F>>2]|0;o=d[$+48|0]|0;hn(e,kE(e,9168,15)|0);hn(e,kE(e,8992,11)|0);hn(e,kE(e,8792,13)|0);hn(e,q);N=c[L>>2]|0;do{if((N|0)==44){_=4;while(1){kG(e);if((c[L>>2]|0)!=288){P=3144;break}Z=c[v>>2]|0;kG(e);hn(e,Z);aa=c[L>>2]|0;if((aa|0)==44){_=_+1|0}else{P=3146;break}}if((P|0)==3146){ab=_-2|0;ac=aa;break}else if((P|0)==3144){hf(e,288)}}else{ab=1;ac=N}}while(0);if((ac|0)!=268){hf(e,268)}kG(e);ac=c[C>>2]|0;hk(e,u,0)|0;if((c[L>>2]|0)==44){N=1;while(1){kG(e);jS(c[F>>2]|0,u);hk(e,u,0)|0;aa=N+1|0;if((c[L>>2]|0)==44){N=aa}else{ad=aa;break}}}else{ad=1}N=c[F>>2]|0;aa=3-ad|0;ad=c[u>>2]|0;do{if((ad|0)==0){P=3155}else if((ad|0)==12|(ad|0)==13){v=aa+1|0;Z=(v|0)<0?0:v;jP(N,u,Z);if((Z|0)<=1){break}jL(N,Z-1|0)}else{jS(N,u);P=3155}}while(0);do{if((P|0)==3155){if((aa|0)<=0){break}u=d[N+48|0]|0;jL(N,aa);jy(N,u,aa)}}while(0);jK($,3);hs(e,o,ac,ab,0)}else if((p|0)==61){p=c[F>>2]|0;ab=p+48|0;ac=d[ab]|0;hn(e,kE(e,8536,11)|0);hn(e,kE(e,8368,11)|0);hn(e,kE(e,8112,10)|0);hn(e,q);if((c[L>>2]|0)!=61){hf(e,61)}kG(e);hk(e,j,0)|0;jS(c[F>>2]|0,j);if((c[L>>2]|0)!=44){hf(e,44)}kG(e);hk(e,h,0)|0;jS(c[F>>2]|0,h);if((c[L>>2]|0)==44){kG(e);hk(e,g,0)|0;jS(c[F>>2]|0,g)}else{g=d[ab]|0;ab=jO(p,1.0)|0;jJ(p,g,ab)|0;jL(p,1)}hs(e,ac,D,1,1)}else{kC(e,9392)}hh(e,262,264,D);hb(H);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 278:{kG(e);ac=jE(H)|0;hk(e,x,0)|0;p=x|0;if((c[p>>2]|0)==1){c[p>>2]=3}j_(c[F>>2]|0,x);p=c[x+20>>2]|0;a[z+10|0]=1;a[z+8|0]=a[H+46|0]|0;x=H+12|0;b[z+4>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+28>>2]&65535;b[z+6>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+16>>2]&65535;a[z+9|0]=0;x=H+16|0;c[z>>2]=c[x>>2];c[x>>2]=z;if((c[L>>2]|0)!=259){hf(e,259)}kG(e);z=c[F>>2]|0;a[y+10|0]=0;a[y+8|0]=a[z+46|0]|0;x=z+12|0;b[y+4>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+28>>2]&65535;b[y+6>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+16>>2]&65535;a[y+9|0]=0;x=z+16|0;c[y>>2]=c[x>>2];c[x>>2]=y;L4059:do{y=c[L>>2]|0;switch(y|0){case 260:case 261:case 262:case 286:case 277:{break L4059;break};default:{}}hg(e)}while((y|0)!=274);hb(z);jF(H,jA(H)|0,ac);hh(e,262,278,D);hb(H);jG(H,p);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 259:{kG(e);p=c[F>>2]|0;a[w+10|0]=0;a[w+8|0]=a[p+46|0]|0;ac=p+12|0;b[w+4>>1]=c[(c[(c[ac>>2]|0)+64>>2]|0)+28>>2]&65535;b[w+6>>1]=c[(c[(c[ac>>2]|0)+64>>2]|0)+16>>2]&65535;a[w+9|0]=0;ac=p+16|0;c[w>>2]=c[ac>>2];c[ac>>2]=w;L4065:do{w=c[L>>2]|0;switch(w|0){case 260:case 261:case 262:case 286:case 277:{break L4065;break};default:{}}hg(e)}while((w|0)!=274);hb(p);hh(e,262,259,D);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 285:{kG(e);if((c[L>>2]|0)!=288){hf(e,288)}p=c[e+24>>2]|0;kG(e);w=c[F>>2]|0;ac=e+64|0;z=c[ac>>2]|0;y=w+16|0;x=z+28|0;ab=z+24|0;g=b[(c[y>>2]|0)+4>>1]|0;while(1){if((g|0)>=(c[x>>2]|0)){break}if((hE(p,c[(c[ab>>2]|0)+(g<<4)>>2]|0)|0)==0){g=g+1|0}else{P=3203;break}}if((P|0)==3203){h=w+12|0;j=c[(c[ab>>2]|0)+(g<<4)+8>>2]|0;g=gW(c[(c[h>>2]|0)+52>>2]|0,9608,(M=i,i=i+16|0,c[M>>2]=p+16,c[M+8>>2]=j,M)|0)|0;i=M;hc(c[h>>2]|0,g)}if((c[L>>2]|0)!=285){hf(e,285)}kG(e);g=c[w+20>>2]|0;w=c[x>>2]|0;h=z+32|0;if((w+1|0)>(c[h>>2]|0)){z=gx(c[E>>2]|0,c[ab>>2]|0,h,16,32767,5192)|0;c[ab>>2]=z;ae=z}else{ae=c[ab>>2]|0}c[ae+(w<<4)>>2]=p;c[(c[ab>>2]|0)+(w<<4)+8>>2]=D;a[(c[ab>>2]|0)+(w<<4)+12|0]=a[(c[F>>2]|0)+46|0]|0;c[(c[ab>>2]|0)+(w<<4)+4>>2]=g;c[x>>2]=(c[x>>2]|0)+1;L4087:while(1){switch(c[L>>2]|0){case 59:case 285:{break};case 260:case 261:case 262:case 286:{P=3212;break L4087;break};default:{break L4087}}hg(e)}if((P|0)==3212){a[(c[ab>>2]|0)+(w<<4)+12|0]=a[(c[y>>2]|0)+8|0]|0}y=(c[ab>>2]|0)+(w<<4)|0;w=c[ac>>2]|0;ac=b[(c[(c[F>>2]|0)+16>>2]|0)+6>>1]|0;ab=w+16|0;if((ac|0)>=(c[ab>>2]|0)){Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}x=w+12|0;w=y|0;g=ac;L4096:while(1){while(1){if((hE(c[(c[x>>2]|0)+(g<<4)>>2]|0,c[w>>2]|0)|0)==0){break}he(e,g,y);if((g|0)>=(c[ab>>2]|0)){P=3261;break L4096}}_=g+1|0;if((_|0)<(c[ab>>2]|0)){g=_}else{P=3262;break}}if((P|0)==3261){Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}else if((P|0)==3262){Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}break};case 273:{P=jE(H)|0;a[s+10|0]=1;g=H+46|0;a[s+8|0]=a[g]|0;ab=H+12|0;b[s+4>>1]=c[(c[(c[ab>>2]|0)+64>>2]|0)+28>>2]&65535;b[s+6>>1]=c[(c[(c[ab>>2]|0)+64>>2]|0)+16>>2]&65535;a[s+9|0]=0;y=H+16|0;c[s>>2]=c[y>>2];c[y>>2]=s;a[t+10|0]=0;s=t+8|0;a[s]=a[g]|0;b[t+4>>1]=c[(c[(c[ab>>2]|0)+64>>2]|0)+28>>2]&65535;b[t+6>>1]=c[(c[(c[ab>>2]|0)+64>>2]|0)+16>>2]&65535;ab=t+9|0;a[ab]=0;c[t>>2]=c[y>>2];c[y>>2]=t;kG(e);L4106:do{t=c[L>>2]|0;switch(t|0){case 260:case 261:case 262:case 286:case 277:{break L4106;break};default:{}}hg(e)}while((t|0)!=274);hh(e,277,273,D);hk(e,r,0)|0;D=r|0;if((c[D>>2]|0)==1){c[D>>2]=3}j_(c[F>>2]|0,r);D=c[r+20>>2]|0;if((a[ab]|0)!=0){jH(H,D,d[s]|0)}hb(H);jF(H,D,P);hb(H);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 274:{kG(e);P=c[F>>2]|0;L4118:do{switch(c[L>>2]|0){case 260:case 261:case 262:case 286:case 277:case 59:{af=0;ag=0;break};default:{hk(e,l,0)|0;if((c[L>>2]|0)==44){D=1;while(1){kG(e);jS(c[F>>2]|0,l);hk(e,l,0)|0;s=D+1|0;if((c[L>>2]|0)==44){D=s}else{ah=s;break}}}else{ah=1}D=l|0;if(((c[D>>2]|0)-12|0)>>>0<2){jP(P,l,-1);if((c[D>>2]|0)==12&(ah|0)==1){D=(c[(c[P>>2]|0)+12>>2]|0)+(c[l+8>>2]<<2)|0;c[D>>2]=c[D>>2]&-64|30}af=-1;ag=d[P+46|0]|0;break L4118}else{if((ah|0)==1){af=1;ag=jU(P,l)|0;break L4118}else{jS(P,l);af=ah;ag=d[P+46|0]|0;break L4118}}}}}while(0);jD(P,ag,af);if((c[L>>2]|0)!=59){Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}kG(e);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};case 258:case 266:{af=jA(H)|0;ag=c[C>>2]|0;C=(c[L>>2]|0)==266;kG(e);do{if(C){if((c[L>>2]|0)==288){P=c[e+24>>2]|0;kG(e);ai=P;break}else{hf(e,288)}}else{ai=hI(c[E>>2]|0,6736)|0}}while(0);C=c[e+64>>2]|0;P=C+12|0;ah=C+16|0;l=c[ah>>2]|0;D=C+20|0;if((l+1|0)>(c[D>>2]|0)){C=P|0;s=gx(c[E>>2]|0,c[C>>2]|0,D,16,32767,5192)|0;c[C>>2]=s;aj=s}else{aj=c[P>>2]|0}s=P|0;c[aj+(l<<4)>>2]=ai;c[(c[s>>2]|0)+(l<<4)+8>>2]=ag;a[(c[s>>2]|0)+(l<<4)+12|0]=a[(c[F>>2]|0)+46|0]|0;c[(c[s>>2]|0)+(l<<4)+4>>2]=af;c[ah>>2]=(c[ah>>2]|0)+1;hd(e,l)|0;Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return};default:{l=k+8|0;hi(e,l);ah=c[L>>2]|0;if((ah|0)==61|(ah|0)==44){c[k>>2]=0;hj(e,k,1);Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}if((c[l>>2]|0)!=12){kC(e,3776)}e=(c[(c[H>>2]|0)+12>>2]|0)+(c[k+16>>2]<<2)|0;c[e>>2]=c[e>>2]&-8372225|16384;Q=c[F>>2]|0;R=Q+46|0;S=a[R]|0;T=Q+48|0;a[T]=S;U=c[E>>2]|0;V=U+38|0;W=b[V>>1]|0;X=W-1&65535;b[V>>1]=X;i=f;return}}}function hh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;if((c[a+16>>2]|0)==(b|0)){kG(a);i=f;return}if((c[a+4>>2]|0)==(e|0)){hf(a,b)}else{f=c[a+52>>2]|0;g=kB(a,b)|0;b=kB(a,d)|0;d=gW(f,7864,(f=i,i=i+24|0,c[f>>2]=g,c[f+8>>2]=b,c[f+16>>2]=e,f)|0)|0;i=f;kC(a,d)}}function hi(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;d=i;i=i+72|0;e=d|0;f=d+24|0;g=d+48|0;h=a+48|0;j=c[h>>2]|0;k=c[a+4>>2]|0;l=a+16|0;m=c[l>>2]|0;do{if((m|0)==40){kG(a);hk(a,b,0)|0;hh(a,41,40,k);jR(c[h>>2]|0,b);n=a+24|0}else if((m|0)==288){o=a+24|0;p=c[o>>2]|0;kG(a);q=c[h>>2]|0;if((hr(q,p,b,1)|0)!=0){n=o;break}hr(q,c[a+72>>2]|0,b,1)|0;r=jM(c[h>>2]|0,p)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=4;c[e+8>>2]=r;j0(q,b,e);n=o}else{kC(a,9856)}}while(0);e=g+16|0;m=g+20|0;o=g|0;q=g+8|0;L4174:while(1){switch(c[l>>2]|0){case 91:{jV(j,b);kG(a);hk(a,f,0)|0;jW(c[h>>2]|0,f);if((c[l>>2]|0)!=93){s=3282;break L4174}kG(a);j0(j,b,f);continue L4174;break};case 46:{hp(a,b);continue L4174;break};case 58:{kG(a);if((c[l>>2]|0)!=288){s=3285;break L4174}r=c[n>>2]|0;kG(a);p=jM(c[h>>2]|0,r)|0;c[e>>2]=-1;c[m>>2]=-1;c[o>>2]=4;c[q>>2]=p;jZ(j,b,g);hq(a,b,k);continue L4174;break};case 40:case 289:case 123:{jS(j,b);hq(a,b,k);continue L4174;break};default:{s=3288;break L4174}}}if((s|0)==3282){hf(a,93)}else if((s|0)==3285){hf(a,288)}else if((s|0)==3288){i=d;return}}function hj(f,g,h){f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;j=i;i=i+56|0;k=j|0;l=j+24|0;m=g+8|0;if(((c[m>>2]|0)-7|0)>>>0>=3){kC(f,3776)}n=f+16|0;o=c[n>>2]|0;do{if((o|0)==61){kG(f);hk(f,k,0)|0;p=f+48|0;if((c[n>>2]|0)==44){q=1;while(1){kG(f);jS(c[p>>2]|0,k);hk(f,k,0)|0;r=q+1|0;if((c[n>>2]|0)==44){q=r}else{s=r;break}}}else{s=1}q=c[p>>2]|0;if((s|0)==(h|0)){jQ(q,k);jY(c[p>>2]|0,m,k);i=j;return}r=h-s|0;t=k|0;u=c[t>>2]|0;do{if((u|0)==0){v=3318}else if((u|0)==12|(u|0)==13){w=r+1|0;x=(w|0)<0?0:w;jP(q,k,x);if((x|0)<=1){break}jL(q,x-1|0)}else{jS(q,k);v=3318}}while(0);do{if((v|0)==3318){if((r|0)<=0){break}u=d[q+48|0]|0;jL(q,r);jy(q,u,r)}}while(0);if((s|0)<=(h|0)){y=t;break}q=(c[p>>2]|0)+48|0;a[q]=r+(d[q]|0)&255;y=t}else if((o|0)==44){kG(f);c[l>>2]=g;q=l+8|0;hi(f,q);u=q|0;q=f+48|0;do{if((c[u>>2]|0)!=9){x=c[q>>2]|0;w=a[x+48|0]|0;z=w&255;if((g|0)==0){break}A=l+16|0;B=w&255;C=0;D=g;while(1){do{if((c[D+8>>2]|0)==9){E=D+16|0;F=E;G=F+3|0;H=d[G]|0;I=c[u>>2]|0;do{if((H|0)==(I|0)){J=F+2|0;if((d[J]|0)!=(c[A>>2]|0)){K=C;L=H;break}a[G]=7;a[J]=w;K=1;L=c[u>>2]|0}else{K=C;L=I}}while(0);if((L|0)!=7){M=K;break}I=E;if((b[I>>1]|0)!=(c[A>>2]|0)){M=K;break}b[I>>1]=B;M=1}else{M=C}}while(0);I=c[D>>2]|0;if((I|0)==0){break}else{C=M;D=I}}if((M|0)==0){break}jz(x,(c[u>>2]|0)==7?0:5,z,c[A>>2]|0,0)|0;jL(x,1)}}while(0);u=c[q>>2]|0;if(((e[(c[f+52>>2]|0)+38>>1]|0)+h|0)<=200){hj(f,l,h+1|0);y=k|0;break}t=u+12|0;r=c[(c[t>>2]|0)+52>>2]|0;p=c[(c[u>>2]|0)+64>>2]|0;if((p|0)==0){N=10760;O=gW(r,10312,(P=i,i=i+24|0,c[P>>2]=3296,c[P+8>>2]=200,c[P+16>>2]=N,P)|0)|0;i=P;Q=c[t>>2]|0;kC(Q,O)}u=gW(r,10520,(P=i,i=i+8|0,c[P>>2]=p,P)|0)|0;i=P;N=u;O=gW(r,10312,(P=i,i=i+24|0,c[P>>2]=3296,c[P+8>>2]=200,c[P+16>>2]=N,P)|0)|0;i=P;Q=c[t>>2]|0;kC(Q,O)}else{hf(f,61)}}while(0);O=c[f+48>>2]|0;f=(d[O+48|0]|0)-1|0;c[k+16>>2]=-1;c[k+20>>2]=-1;c[y>>2]=6;c[k+8>>2]=f;jY(O,m,k);i=j;return}function hk(e,f,g){e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;j=i;i=i+24|0;k=j|0;l=e+52|0;m=(c[l>>2]|0)+38|0;n=(b[m>>1]|0)+1&65535;b[m>>1]=n;m=e+48|0;o=c[m>>2]|0;if((n&65535)>200){n=o+12|0;p=c[(c[n>>2]|0)+52>>2]|0;q=c[(c[o>>2]|0)+64>>2]|0;if((q|0)==0){r=10760;s=gW(p,10312,(t=i,i=i+24|0,c[t>>2]=3296,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;kC(u,s);return 0}v=gW(p,10520,(t=i,i=i+8|0,c[t>>2]=q,t)|0)|0;i=t;r=v;s=gW(p,10312,(t=i,i=i+24|0,c[t>>2]=3296,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;kC(u,s);return 0}s=e+16|0;L4246:do{switch(c[s>>2]|0){case 289:{u=jM(o,c[e+24>>2]|0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=4;c[f+8>>2]=u;w=3348;break};case 35:{x=2;w=3336;break};case 45:{x=0;w=3336;break};case 270:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=1;c[f+8>>2]=0;w=3348;break};case 287:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=5;c[f+8>>2]=0;h[f+8>>3]=+h[e+24>>3];w=3348;break};case 123:{hl(e,f);break};case 280:{if((a[(c[o>>2]|0)+77|0]|0)==0){kC(e,2952);return 0}else{u=jz(o,38,0,1,0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=13;c[f+8>>2]=u;w=3348;break L4246}break};case 271:{x=1;w=3336;break};case 276:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=2;c[f+8>>2]=0;w=3348;break};case 263:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=3;c[f+8>>2]=0;w=3348;break};case 265:{kG(e);hm(e,f,0,c[e+4>>2]|0);break};default:{hi(e,f)}}}while(0);if((w|0)==3348){kG(e)}else if((w|0)==3336){o=c[e+4>>2]|0;kG(e);hk(e,f,8)|0;j1(c[m>>2]|0,x,f,o)}switch(c[s>>2]|0){case 284:{y=10;break};case 281:{y=7;break};case 257:{y=13;break};case 272:{y=14;break};case 47:{y=3;break};case 37:{y=4;break};case 45:{y=1;break};case 42:{y=2;break};case 60:{y=8;break};case 283:{y=9;break};case 62:{y=11;break};case 282:{y=12;break};case 43:{y=0;break};case 94:{y=5;break};case 279:{y=6;break};default:{z=15;A=c[l>>2]|0;B=A+38|0;C=b[B>>1]|0;D=C-1&65535;b[B>>1]=D;i=j;return z|0}}s=e+4|0;o=y;while(1){if((d[304+(o<<1)|0]|0)<=(g|0)){z=o;w=3370;break}y=c[s>>2]|0;kG(e);j3(c[m>>2]|0,o,f);x=hk(e,k,d[305+(o<<1)|0]|0)|0;j4(c[m>>2]|0,o,f,k,y);if((x|0)==15){z=15;w=3369;break}else{o=x}}if((w|0)==3370){A=c[l>>2]|0;B=A+38|0;C=b[B>>1]|0;D=C-1&65535;b[B>>1]=D;i=j;return z|0}else if((w|0)==3369){A=c[l>>2]|0;B=A+38|0;C=b[B>>1]|0;D=C-1&65535;b[B>>1]=D;i=j;return z|0}return 0}function hl(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+40|0;e=d|0;f=a+48|0;g=c[f>>2]|0;h=c[a+4>>2]|0;j=jz(g,11,0,0,0)|0;k=e+36|0;c[k>>2]=0;l=e+28|0;c[l>>2]=0;m=e+32|0;c[m>>2]=0;n=e+24|0;c[n>>2]=b;c[b+16>>2]=-1;c[b+20>>2]=-1;c[b>>2]=11;c[b+8>>2]=j;o=e|0;c[e+16>>2]=-1;c[e+20>>2]=-1;p=e|0;c[p>>2]=0;c[e+8>>2]=0;jS(c[f>>2]|0,b);b=a+16|0;if((c[b>>2]|0)!=123){hf(a,123)}kG(a);L4:do{if((c[b>>2]|0)!=125){L5:while(1){q=c[b>>2]|0;do{if((q|0)==288){if((kI(a)|0)==61){ho(a,e);break}hk(a,o,0)|0;r=c[f>>2]|0;s=c[m>>2]|0;if((s|0)>2147483645){t=9;break L5}c[m>>2]=s+1;c[k>>2]=(c[k>>2]|0)+1}else if((q|0)==91){ho(a,e)}else{hk(a,o,0)|0;u=c[f>>2]|0;s=c[m>>2]|0;if((s|0)>2147483645){t=16;break L5}c[m>>2]=s+1;c[k>>2]=(c[k>>2]|0)+1}}while(0);q=c[b>>2]|0;if((q|0)==44){kG(a)}else if((q|0)==59){kG(a)}else{break L4}if((c[b>>2]|0)==125){break L4}if((c[p>>2]|0)==0){continue}jS(g,o);c[p>>2]=0;if((c[k>>2]|0)!=50){continue}j6(g,c[(c[n>>2]|0)+8>>2]|0,c[m>>2]|0,50);c[k>>2]=0}if((t|0)==9){q=r+12|0;s=c[(c[q>>2]|0)+52>>2]|0;v=c[(c[r>>2]|0)+64>>2]|0;if((v|0)==0){w=10760;x=gW(s,10312,(y=i,i=i+24|0,c[y>>2]=11024,c[y+8>>2]=2147483645,c[y+16>>2]=w,y)|0)|0;i=y;z=c[q>>2]|0;kC(z,x)}A=gW(s,10520,(y=i,i=i+8|0,c[y>>2]=v,y)|0)|0;i=y;w=A;x=gW(s,10312,(y=i,i=i+24|0,c[y>>2]=11024,c[y+8>>2]=2147483645,c[y+16>>2]=w,y)|0)|0;i=y;z=c[q>>2]|0;kC(z,x)}else if((t|0)==16){q=u+12|0;s=c[(c[q>>2]|0)+52>>2]|0;A=c[(c[u>>2]|0)+64>>2]|0;if((A|0)==0){B=10760;C=gW(s,10312,(y=i,i=i+24|0,c[y>>2]=11024,c[y+8>>2]=2147483645,c[y+16>>2]=B,y)|0)|0;i=y;D=c[q>>2]|0;kC(D,C)}v=gW(s,10520,(y=i,i=i+8|0,c[y>>2]=A,y)|0)|0;i=y;B=v;C=gW(s,10312,(y=i,i=i+24|0,c[y>>2]=11024,c[y+8>>2]=2147483645,c[y+16>>2]=B,y)|0)|0;i=y;D=c[q>>2]|0;kC(D,C)}}}while(0);hh(a,125,123,h);h=c[k>>2]|0;do{if((h|0)!=0){a=c[p>>2]|0;if((a|0)==12|(a|0)==13){jP(g,o,-1);j6(g,c[(c[n>>2]|0)+8>>2]|0,c[m>>2]|0,-1);c[m>>2]=(c[m>>2]|0)-1;break}else if((a|0)==0){E=h}else{jS(g,o);E=c[k>>2]|0}j6(g,c[(c[n>>2]|0)+8>>2]|0,c[m>>2]|0,E)}}while(0);E=g|0;g=c[(c[(c[E>>2]|0)+12>>2]|0)+(j<<2)>>2]&8388607;n=(gP(c[m>>2]|0)|0)<<23|g;c[(c[(c[E>>2]|0)+12>>2]|0)+(j<<2)>>2]=n;n=c[(c[(c[E>>2]|0)+12>>2]|0)+(j<<2)>>2]&-8372225;g=(gP(c[l>>2]|0)|0)<<14&8372224|n;c[(c[(c[E>>2]|0)+12>>2]|0)+(j<<2)>>2]=g;i=d;return}function hm(e,f,g,h){e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;j=i;i=i+72|0;k=j|0;l=j+56|0;m=e+48|0;n=c[m>>2]|0;o=e+52|0;p=c[o>>2]|0;q=c[n>>2]|0;r=n+36|0;n=c[r>>2]|0;s=q+56|0;t=c[s>>2]|0;do{if((n|0)>=(t|0)){if((n+1|0)>(t|0)){u=q+16|0;c[u>>2]=gx(p,c[u>>2]|0,s,4,262143,11336)|0;v=c[s>>2]|0}else{v=t}if((t|0)>=(v|0)){break}u=q+16|0;w=t;while(1){x=w+1|0;c[(c[u>>2]|0)+(w<<2)>>2]=0;if((x|0)<(c[s>>2]|0)){w=x}else{break}}}}while(0);s=fe(p)|0;t=c[r>>2]|0;c[r>>2]=t+1;c[(c[q+16>>2]|0)+(t<<2)>>2]=s;t=s;do{if((a[s+5|0]&3)!=0){if((a[q+5|0]&4)==0){break}fh(p,q,t)}}while(0);t=k|0;c[t>>2]=s;c[s+64>>2]=h;s=c[o>>2]|0;c[k+8>>2]=c[m>>2];o=k+12|0;c[o>>2]=e;c[m>>2]=k;c[k+20>>2]=0;c[k+24>>2]=0;c[k+28>>2]=-1;c[k+32>>2]=0;c[k+36>>2]=0;kY(k+44|0,0,5);c[k+40>>2]=c[(c[e+64>>2]|0)+4>>2];q=k+16|0;c[q>>2]=0;p=c[t>>2]|0;c[p+36>>2]=c[e+68>>2];a[p+78|0]=2;p=h9(s)|0;c[k+4>>2]=p;r=s+8|0;v=c[r>>2]|0;c[v>>2]=p;c[v+8>>2]=69;v=(c[r>>2]|0)+16|0;c[r>>2]=v;if(((c[s+24>>2]|0)-v|0)<16){eU(s,0)}a[l+10|0]=0;a[l+8|0]=a[k+46|0]|0;k=(c[o>>2]|0)+64|0;b[l+4>>1]=c[(c[k>>2]|0)+28>>2]&65535;b[l+6>>1]=c[(c[k>>2]|0)+16>>2]&65535;a[l+9|0]=0;c[l>>2]=c[q>>2];c[q>>2]=l;l=e+16|0;if((c[l>>2]|0)!=40){hf(e,40)}kG(e);if((g|0)!=0){hn(e,kE(e,2672,4)|0);g=c[m>>2]|0;q=g+46|0;k=(a[q]|0)+1&255;a[q]=k;c[(c[(c[g>>2]|0)+24>>2]|0)+((b[(c[c[(c[g+12>>2]|0)+64>>2]>>2]|0)+((k&255)-1+(c[g+40>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[g+20>>2]}g=c[m>>2]|0;k=c[g>>2]|0;q=k+77|0;a[q]=0;o=c[l>>2]|0;L66:do{if((o|0)==41){y=0}else{s=e+24|0;v=0;r=o;while(1){if((r|0)==280){z=54;break}else if((r|0)!=288){z=55;break}p=c[s>>2]|0;kG(e);hn(e,p);p=v+1|0;if((a[q]|0)!=0){y=p;break L66}if((c[l>>2]|0)!=44){y=p;break L66}kG(e);v=p;r=c[l>>2]|0}if((z|0)==54){kG(e);a[q]=1;y=v;break}else if((z|0)==55){kC(e,11992)}}}while(0);q=c[m>>2]|0;o=q+46|0;r=(d[o]|0)+y&255;a[o]=r;L77:do{if((y|0)!=0){s=q+20|0;p=q|0;n=q+12|0;w=q+40|0;u=y;x=r;while(1){c[(c[(c[p>>2]|0)+24>>2]|0)+((b[(c[c[(c[n>>2]|0)+64>>2]>>2]|0)+((x&255)-u+(c[w>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[s>>2];A=u-1|0;if((A|0)==0){break L77}u=A;x=a[o]|0}}}while(0);o=g+46|0;a[k+76|0]=a[o]|0;jL(g,d[o]|0);if((c[l>>2]|0)!=41){hf(e,41)}kG(e);L86:while(1){o=c[l>>2]|0;switch(o|0){case 260:case 261:case 262:case 286:case 277:{z=68;break L86;break};default:{}}hg(e);if((o|0)==274){z=69;break}}if((z|0)==68){B=e+4|0;C=c[B>>2]|0;D=c[t>>2]|0;E=D+68|0;c[E>>2]=C;hh(e,262,265,h);F=c[m>>2]|0;G=F+8|0;H=c[G>>2]|0;I=H+36|0;J=c[I>>2]|0;K=J-1|0;L=jB(H,37,0,K)|0;M=f+16|0;c[M>>2]=-1;N=f+20|0;c[N>>2]=-1;O=f|0;c[O>>2]=11;P=f+8|0;Q=P;c[Q>>2]=L;jS(H,f);ha(e);i=j;return}else if((z|0)==69){B=e+4|0;C=c[B>>2]|0;D=c[t>>2]|0;E=D+68|0;c[E>>2]=C;hh(e,262,265,h);F=c[m>>2]|0;G=F+8|0;H=c[G>>2]|0;I=H+36|0;J=c[I>>2]|0;K=J-1|0;L=jB(H,37,0,K)|0;M=f+16|0;c[M>>2]=-1;N=f+20|0;c[N>>2]=-1;O=f|0;c[O>>2]=11;P=f+8|0;Q=P;c[Q>>2]=L;jS(H,f);ha(e);i=j;return}}function hn(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;g=c[d+48>>2]|0;h=c[d+64>>2]|0;j=g|0;k=c[j>>2]|0;l=k+60|0;m=c[l>>2]|0;n=g+44|0;if(((b[n>>1]|0)+1|0)>(m|0)){o=k+24|0;c[o>>2]=gx(c[d+52>>2]|0,c[o>>2]|0,l,12,32767,11576)|0;p=c[l>>2]|0;q=o}else{p=m;q=k+24|0}if((m|0)<(p|0)){p=m;while(1){m=p+1|0;c[(c[q>>2]|0)+(p*12|0)>>2]=0;if((m|0)<(c[l>>2]|0)){p=m}else{break}}}c[(c[q>>2]|0)+((b[n>>1]|0)*12|0)>>2]=e;q=e;do{if((a[e+5|0]&3)!=0){if((a[k+5|0]&4)==0){break}fh(c[d+52>>2]|0,k,q)}}while(0);q=b[n>>1]|0;b[n>>1]=q+1&65535;n=h+4|0;k=c[n>>2]|0;if((k+1-(c[g+40>>2]|0)|0)>200){e=g+12|0;g=c[(c[e>>2]|0)+52>>2]|0;p=c[(c[j>>2]|0)+64>>2]|0;if((p|0)==0){r=10760;s=gW(g,10312,(t=i,i=i+24|0,c[t>>2]=11576,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[e>>2]|0;kC(u,s)}j=gW(g,10520,(t=i,i=i+8|0,c[t>>2]=p,t)|0)|0;i=t;r=j;s=gW(g,10312,(t=i,i=i+24|0,c[t>>2]=11576,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[e>>2]|0;kC(u,s)}s=h+8|0;if((k+2|0)>(c[s>>2]|0)){u=h|0;e=gx(c[d+52>>2]|0,c[u>>2]|0,s,2,2147483645,11576)|0;c[u>>2]=e;v=c[n>>2]|0;w=e;x=v+1|0;c[n>>2]=x;y=w+(v<<1)|0;b[y>>1]=q;i=f;return}else{v=k;w=c[h>>2]|0;x=v+1|0;c[n>>2]=x;y=w+(v<<1)|0;b[y>>1]=q;i=f;return}}function ho(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+48|0;f=e|0;g=e+24|0;h=b+48|0;j=c[h>>2]|0;k=j+48|0;l=a[k]|0;m=b+16|0;do{if((c[m>>2]|0)==288){n=d+28|0;if((c[n>>2]|0)<=2147483645){o=c[b+24>>2]|0;kG(b);p=jM(c[h>>2]|0,o)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=4;c[f+8>>2]=p;q=n;break}n=j+12|0;p=c[(c[n>>2]|0)+52>>2]|0;o=c[(c[j>>2]|0)+64>>2]|0;if((o|0)==0){r=10760;s=gW(p,10312,(t=i,i=i+24|0,c[t>>2]=11024,c[t+8>>2]=2147483645,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;kC(u,s)}v=gW(p,10520,(t=i,i=i+8|0,c[t>>2]=o,t)|0)|0;i=t;r=v;s=gW(p,10312,(t=i,i=i+24|0,c[t>>2]=11024,c[t+8>>2]=2147483645,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;kC(u,s)}else{kG(b);hk(b,f,0)|0;jW(c[h>>2]|0,f);if((c[m>>2]|0)==93){kG(b);q=d+28|0;break}else{hf(b,93)}}}while(0);c[q>>2]=(c[q>>2]|0)+1;if((c[m>>2]|0)==61){kG(b);m=jX(j,f)|0;hk(b,g,0)|0;f=c[(c[d+24>>2]|0)+8>>2]|0;d=jX(j,g)|0;jz(j,10,f,m,d)|0;a[k]=l;i=e;return}else{hf(b,61)}}function hp(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+24|0;e=d|0;f=a+48|0;g=c[f>>2]|0;jV(g,b);kG(a);if((c[a+16>>2]|0)==288){h=c[a+24>>2]|0;kG(a);j=jM(c[f>>2]|0,h)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=4;c[e+8>>2]=j;j0(g,b,e);i=d;return}else{hf(a,288)}}function hq(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+24|0;h=g|0;j=b+48|0;k=c[j>>2]|0;l=b+16|0;m=c[l>>2]|0;if((m|0)==40){kG(b);if((c[l>>2]|0)==41){c[h>>2]=0}else{hk(b,h,0)|0;if((c[l>>2]|0)==44){do{kG(b);jS(c[j>>2]|0,h);hk(b,h,0)|0;}while((c[l>>2]|0)==44)}jP(k,h,-1)}hh(b,41,40,f)}else if((m|0)==123){hl(b,h)}else if((m|0)==289){m=jM(k,c[b+24>>2]|0)|0;c[h+16>>2]=-1;c[h+20>>2]=-1;c[h>>2]=4;c[h+8>>2]=m;kG(b)}else{kC(b,10072)}b=e+8|0;m=c[b>>2]|0;l=c[h>>2]|0;if((l|0)==0){n=119}else if((l|0)==12|(l|0)==13){o=0}else{jS(k,h);n=119}if((n|0)==119){o=(d[k+48|0]|0)-m|0}n=jz(k,29,m,o,2)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=12;c[b>>2]=n;j5(k,f);a[k+48|0]=m+1&255;i=g;return}function hr(e,f,g,h){e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if((e|0)==0){i=0;return i|0}j=e|0;k=e+12|0;l=e+40|0;m=d[e+46|0]|0;while(1){n=m-1|0;o=c[j>>2]|0;if((m|0)<=0){break}if((hE(f,c[(c[o+24>>2]|0)+((b[(c[c[(c[k>>2]|0)+64>>2]>>2]|0)+((c[l>>2]|0)+n<<1)>>1]|0)*12|0)>>2]|0)|0)==0){m=n}else{p=125;break}}if((p|0)==125){c[g+16>>2]=-1;c[g+20>>2]=-1;c[g>>2]=7;c[g+8>>2]=n;if((h|0)!=0){i=7;return i|0}h=e+16|0;while(1){q=c[h>>2]|0;if((d[q+8|0]|0)>(n|0)){h=q|0}else{break}}a[q+9|0]=1;i=7;return i|0}q=c[o+28>>2]|0;o=e+47|0;h=0;while(1){if((h|0)>=(d[o]|0)){p=133;break}if((hE(c[q+(h<<3)>>2]|0,f)|0)==0){h=h+1|0}else{p=132;break}}if((p|0)==132){if((h|0)<0){p=133}else{r=h}}do{if((p|0)==133){if((hr(c[e+8>>2]|0,f,g,0)|0)==0){i=0;return i|0}else{r=g9(e,f,g)|0;break}}}while(0);c[g+16>>2]=-1;c[g+20>>2]=-1;c[g>>2]=8;c[g+8>>2]=r;i=8;return i|0}function hs(e,f,g,h,j){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;k=i;i=i+32|0;l=k|0;m=k+16|0;n=e+48|0;o=c[n>>2]|0;p=o+46|0;q=(a[p]|0)+3&255;a[p]=q;r=o+20|0;s=o|0;t=o+12|0;u=o+40|0;v=3;w=q;while(1){c[(c[(c[s>>2]|0)+24>>2]|0)+((b[(c[c[(c[t>>2]|0)+64>>2]>>2]|0)+((w&255)-v+(c[u>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[r>>2];q=v-1|0;if((q|0)==0){break}v=q;w=a[p]|0}w=e+16|0;if((c[w>>2]|0)!=259){hf(e,259)}kG(e);v=(j|0)!=0;if(v){x=jB(o,33,f,131070)|0}else{x=jA(o)|0}a[m+10|0]=0;a[m+8|0]=a[p]|0;b[m+4>>1]=c[(c[(c[t>>2]|0)+64>>2]|0)+28>>2]&65535;b[m+6>>1]=c[(c[(c[t>>2]|0)+64>>2]|0)+16>>2]&65535;a[m+9|0]=0;t=o+16|0;c[m>>2]=c[t>>2];c[t>>2]=m;m=c[n>>2]|0;t=m+46|0;p=(d[t]|0)+h&255;a[t]=p;L200:do{if((h|0)!=0){j=m+20|0;r=m|0;u=m+12|0;s=m+40|0;q=h;y=p;while(1){c[(c[(c[r>>2]|0)+24>>2]|0)+((b[(c[c[(c[u>>2]|0)+64>>2]>>2]|0)+((y&255)-q+(c[s>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[j>>2];z=q-1|0;if((z|0)==0){break L200}q=z;y=a[t]|0}}}while(0);jL(o,h);t=c[n>>2]|0;a[l+10|0]=0;a[l+8|0]=a[t+46|0]|0;n=t+12|0;b[l+4>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+28>>2]&65535;b[l+6>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+16>>2]&65535;a[l+9|0]=0;n=t+16|0;c[l>>2]=c[n>>2];c[n>>2]=l;L206:do{l=c[w>>2]|0;switch(l|0){case 260:case 261:case 262:case 286:case 277:{break L206;break};default:{}}hg(e)}while((l|0)!=274);hb(t);hb(o);jG(o,x);if(v){A=jB(o,32,f,131070)|0;B=x+1|0;jF(o,A,B);j5(o,g);i=k;return}else{jz(o,34,f,0,h)|0;j5(o,g);A=jB(o,35,f+2|0,131070)|0;B=x+1|0;jF(o,A,B);j5(o,g);i=k;return}}function ht(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+40|0;g=f|0;h=f+16|0;j=d+48|0;k=c[j>>2]|0;kG(d);hk(d,h,0)|0;l=d+16|0;if((c[l>>2]|0)!=275){hf(d,275)}kG(d);m=c[l>>2]|0;do{if((m|0)==266|(m|0)==258){j$(c[j>>2]|0,h);a[g+10|0]=0;a[g+8|0]=a[k+46|0]|0;n=k+12|0;b[g+4>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+28>>2]&65535;b[g+6>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+16>>2]&65535;a[g+9|0]=0;n=k+16|0;c[g>>2]=c[n>>2];c[n>>2]=g;n=c[h+16>>2]|0;o=c[d+4>>2]|0;p=(c[l>>2]|0)==266;kG(d);do{if(p){if((c[l>>2]|0)==288){q=c[d+24>>2]|0;kG(d);r=q;break}else{hf(d,288)}}else{r=hI(c[d+52>>2]|0,6736)|0}}while(0);p=c[d+64>>2]|0;q=p+12|0;s=p+16|0;t=c[s>>2]|0;u=p+20|0;if((t+1|0)>(c[u>>2]|0)){p=q|0;v=gx(c[d+52>>2]|0,c[p>>2]|0,u,16,32767,5192)|0;c[p>>2]=v;w=v}else{w=c[q>>2]|0}v=q|0;c[w+(t<<4)>>2]=r;c[(c[v>>2]|0)+(t<<4)+8>>2]=o;a[(c[v>>2]|0)+(t<<4)+12|0]=a[(c[j>>2]|0)+46|0]|0;c[(c[v>>2]|0)+(t<<4)+4>>2]=n;c[s>>2]=(c[s>>2]|0)+1;hd(d,t)|0;L232:while(1){switch(c[l>>2]|0){case 59:case 285:{break};case 260:case 261:case 262:case 286:{break L232;break};default:{x=178;break L232}}hg(d)}if((x|0)==178){y=jA(k)|0;break}hb(k);i=f;return}else{j_(c[j>>2]|0,h);a[g+10|0]=0;a[g+8|0]=a[k+46|0]|0;n=k+12|0;b[g+4>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+28>>2]&65535;b[g+6>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+16>>2]&65535;a[g+9|0]=0;n=k+16|0;c[g>>2]=c[n>>2];c[n>>2]=g;y=c[h+20>>2]|0}}while(0);L241:do{h=c[l>>2]|0;switch(h|0){case 260:case 261:case 262:case 286:case 277:{break L241;break};default:{}}hg(d)}while((h|0)!=274);hb(k);if(((c[l>>2]|0)-260|0)>>>0<2){jC(k,e,jA(k)|0)}jG(k,y);i=f;return}function hu(a,b){a=a|0;b=b|0;var d=0,e=0;d=a+12|0;e=a+8|0;c[e>>2]=(c[d>>2]|0)-b+(c[e>>2]|0);c[d>>2]=b;return}function hv(a){a=a|0;var b=0,d=0,e=0;b=gz(a,0,0,40)|0;d=b;e=a+16|0;c[(c[e>>2]|0)+12>>2]=d;c[b+8>>2]=c[e>>2];c[b+12>>2]=0;return d|0}function hw(a){a=a|0;var b=0,d=0,e=0;b=(c[a+16>>2]|0)+12|0;d=c[b>>2]|0;c[b>>2]=0;if((d|0)==0){return}else{e=d}while(1){d=c[e+12>>2]|0;gz(a,e,40,0)|0;if((d|0)==0){break}else{e=d}}return}function hx(d){d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=d+12|0;if((c[(c[e>>2]|0)+12>>2]|0)>0){fv(d)}f=fm(d,8,112,0,0)|0;g=f;h=d+8|0;i=c[h>>2]|0;c[i>>2]=f;c[i+8>>2]=72;c[h>>2]=(c[h>>2]|0)+16;c[f+12>>2]=c[e>>2];e=g+28|0;c[e>>2]=0;h=f+16|0;c[h>>2]=0;i=f+32|0;c[i>>2]=0;c[f+64>>2]=0;b[f+38>>1]=0;j=f+52|0;c[j>>2]=0;k=f+40|0;a[k]=0;l=f+44|0;c[l>>2]=0;a[f+41|0]=1;m=f+48|0;c[m>>2]=0;c[f+56>>2]=0;b[f+36>>1]=1;a[f+6|0]=0;c[f+68>>2]=0;a[k]=a[d+40|0]|0;k=c[d+44>>2]|0;c[l>>2]=k;c[j>>2]=c[d+52>>2];c[m>>2]=k;k=gz(d,0,0,640)|0;c[e>>2]=k;c[i>>2]=40;d=0;m=k;do{c[m+(d<<4)+8>>2]=0;d=d+1|0;m=c[e>>2]|0}while((d|0)<40);d=f+8|0;c[f+24>>2]=m+((c[i>>2]|0)-5<<4);i=f+72|0;c[f+80>>2]=0;c[f+84>>2]=0;a[f+90|0]=0;c[i>>2]=m;c[d>>2]=m+16;c[m+8>>2]=0;c[f+76>>2]=(c[d>>2]|0)+320;c[h>>2]=i;return g|0}function hy(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=b+28|0;fd(b,c[d>>2]|0);e=c[d>>2]|0;if((e|0)==0){f=b;g=gz(a,f,112,0)|0;return}c[b+16>>2]=b+72;h=b+84|0;i=c[h>>2]|0;c[h>>2]=0;if((i|0)==0){j=e}else{e=i;while(1){i=c[e+12>>2]|0;gz(b,e,40,0)|0;if((i|0)==0){break}else{e=i}}j=c[d>>2]|0}gz(b,j,c[b+32>>2]<<4,0)|0;f=b;g=gz(a,f,112,0)|0;return}function hz(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+24|0;g=f|0;h=f+16|0;j=ci[d&7](e,0,8,400)|0;if((j|0)==0){k=0;i=f;return k|0}l=j;m=j+112|0;c[j>>2]=0;a[j+4|0]=8;a[j+172|0]=33;a[j+5|0]=1;a[j+174|0]=0;c[j+12>>2]=m;c[j+28>>2]=0;c[j+16>>2]=0;c[j+32>>2]=0;c[j+64>>2]=0;b[j+38>>1]=0;c[j+52>>2]=0;a[j+40|0]=0;c[j+44>>2]=0;a[j+41|0]=1;c[j+48>>2]=0;c[j+56>>2]=0;b[j+36>>1]=1;a[j+6|0]=0;c[j+68>>2]=0;c[m>>2]=d;c[j+116>>2]=e;c[j+284>>2]=l;e=cc(0)|0;c[h>>2]=e;c[g>>2]=j;c[g+4>>2]=h;c[g+8>>2]=1296;c[g+12>>2]=2;c[j+168>>2]=hF(g,16,e)|0;e=j+224|0;c[j+240>>2]=e;c[j+244>>2]=e;a[j+175|0]=0;c[j+160>>2]=0;c[j+256>>2]=0;c[j+264>>2]=0;c[j+280>>2]=0;kY(j+132|0,0,16);c[j+288>>2]=cJ(0)|0;a[j+173|0]=5;kY(j+180|0,0,40);c[j+120>>2]=400;c[j+124>>2]=0;c[j+268>>2]=200;c[j+272>>2]=200;c[j+276>>2]=200;kY(j+364|0,0,36);if((eS(l,6,0)|0)==0){k=l;i=f;return k|0}hB(l);k=0;i=f;return k|0}function hA(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+16|0;e=d|0;f=c[b+12>>2]|0;g=gz(b,0,0,640)|0;h=b+28|0;c[h>>2]=g;j=b+32|0;c[j>>2]=40;k=0;l=g;do{c[l+(k<<4)+8>>2]=0;k=k+1|0;l=c[h>>2]|0}while((k|0)<40);k=b+8|0;c[b+24>>2]=l+((c[j>>2]|0)-5<<4);j=b+72|0;c[b+80>>2]=0;c[b+84>>2]=0;a[b+90|0]=0;c[j>>2]=l;c[k>>2]=l+16;c[l+8>>2]=0;c[b+76>>2]=(c[k>>2]|0)+320;c[b+16>>2]=j;j=h9(b)|0;c[f+40>>2]=j;c[f+48>>2]=69;h4(b,j,2,0);k=e;c[k>>2]=b;l=e+8|0;c[l>>2]=72;h6(b,j,1,e);c[k>>2]=h9(b)|0;c[l>>2]=69;h6(b,j,2,e);hG(b,32);it(b);kA(b);e=hH(b,5928,17)|0;c[f+180>>2]=e;b=e+5|0;a[b]=a[b]|32;a[f+63|0]=1;i=d;return}function hB(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;b=a+12|0;d=c[b>>2]|0;e=a+28|0;fd(a,c[e>>2]|0);fq(a);f=c[b>>2]|0;gz(a,c[f+24>>2]|0,c[f+32>>2]<<2,0)|0;f=d+144|0;b=d+152|0;c[f>>2]=gz(a,c[f>>2]|0,c[b>>2]|0,0)|0;c[b>>2]=0;b=c[e>>2]|0;if((b|0)==0){g=d|0;h=c[g>>2]|0;i=d+4|0;j=c[i>>2]|0;k=a;l=ci[h&7](j,k,400,0)|0;return}c[a+16>>2]=a+72;f=a+84|0;m=c[f>>2]|0;c[f>>2]=0;if((m|0)==0){n=b}else{b=m;while(1){m=c[b+12>>2]|0;gz(a,b,40,0)|0;if((m|0)==0){break}else{b=m}}n=c[e>>2]|0}gz(a,n,c[a+32>>2]<<4,0)|0;g=d|0;h=c[g>>2]|0;i=d+4|0;j=c[i>>2]|0;k=a;l=ci[h&7](j,k,400,0)|0;return}function hC(a){a=a|0;hB(c[(c[a+12>>2]|0)+172>>2]|0);return}function hD(a,b){a=a|0;b=b|0;var d=0,e=0;d=c[a+12>>2]|0;if((a|0)==(b|0)){e=1;return e|0}if((d|0)!=(c[b+12>>2]|0)){e=0;return e|0}e=(kZ(a+16|0,b+16|0,d|0)|0)==0|0;return e|0}function hE(b,d){b=b|0;d=d|0;var e=0,f=0;e=a[b+4|0]|0;if(e<<24>>24!=(a[d+4|0]|0)){f=0;return f|0}if(e<<24>>24==4){f=(b|0)==(d|0)|0;return f|0}e=c[b+12>>2]|0;if((b|0)==(d|0)){f=1;return f|0}if((e|0)!=(c[d+12>>2]|0)){f=0;return f|0}f=(kZ(b+16|0,d+16|0,e|0)|0)==0|0;return f|0}function hF(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0,h=0;e=c^b;c=(b>>>5)+1|0;if(c>>>0>b>>>0){f=e;return f|0}else{g=b;h=e}while(1){e=(h<<5)+(h>>>2)+(d[a+(g-1)|0]|0)^h;b=g-c|0;if(b>>>0<c>>>0){f=e;break}else{g=b;h=e}}return f|0}function hG(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=c[b+12>>2]|0;f=e+24|0;fp(b,-5);g=e+32|0;e=c[g>>2]|0;do{if((e|0)<(d|0)){if((d+1|0)>>>0>1073741823){gy(b)}h=f|0;i=gz(b,c[h>>2]|0,e<<2,d<<2)|0;c[h>>2]=i;j=c[g>>2]|0;if((j|0)<(d|0)){k=j;l=i}else{m=j;break}while(1){c[l+(k<<2)>>2]=0;j=k+1|0;if((j|0)>=(d|0)){break}k=j;l=c[h>>2]|0}m=c[g>>2]|0}else{m=e}}while(0);if((m|0)>0){e=f|0;l=d-1|0;k=0;while(1){h=(c[e>>2]|0)+(k<<2)|0;j=c[h>>2]|0;c[h>>2]=0;if((j|0)!=0){h=j;while(1){j=h|0;i=c[j>>2]|0;n=c[h+8>>2]&l;c[j>>2]=c[(c[e>>2]|0)+(n<<2)>>2];c[(c[e>>2]|0)+(n<<2)>>2]=h;n=h+5|0;a[n]=a[n]&-65;if((i|0)==0){break}else{h=i}}}h=k+1|0;i=c[g>>2]|0;if((h|0)<(i|0)){k=h}else{o=i;break}}}else{o=m}if((o|0)<=(d|0)){c[g>>2]=d;return}if((d+1|0)>>>0>1073741823){gy(b)}m=f|0;c[m>>2]=gz(b,c[m>>2]|0,o<<2,d<<2)|0;c[g>>2]=d;return}function hH(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;if(f>>>0>=41){if((f+1|0)>>>0>4294967277){gy(b);return 0}g=c[(c[b+12>>2]|0)+56>>2]|0;h=fm(b,20,f+17|0,0,0)|0;i=h;c[h+12>>2]=f;c[h+8>>2]=g;a[h+6|0]=0;g=h+16|0;kV(g|0,e|0,f)|0;a[g+f|0]=0;j=i;return j|0}i=c[b+12>>2]|0;g=c[i+56>>2]^f;h=(f>>>5)+1|0;if(h>>>0>f>>>0){k=g}else{l=f;m=g;while(1){g=(m<<5)+(m>>>2)+(d[e+(l-1)|0]|0)^m;n=l-h|0;if(n>>>0<h>>>0){k=g;break}else{l=n;m=g}}}m=i+32|0;l=c[m>>2]|0;h=i+24|0;g=c[h>>2]|0;n=c[g+((l-1&k)<<2)>>2]|0;L365:do{if((n|0)!=0){o=n;L366:while(1){p=o;do{if((k|0)==(c[o+8>>2]|0)){if((c[o+12>>2]|0)!=(f|0)){break}if((kZ(e|0,o+16|0,f|0)|0)==0){break L366}}}while(0);q=c[o>>2]|0;if((q|0)==0){break L365}else{o=q}}q=o+5|0;r=(d[q]|0)^3;if((((d[i+60|0]|0)^3)&r|0)!=0){j=p;return j|0}a[q]=r&255;j=p;return j|0}}while(0);p=i+28|0;if((c[p>>2]|0)>>>0>=l>>>0&(l|0)<1073741823){hG(b,l<<1);s=c[m>>2]|0;t=c[h>>2]|0}else{s=l;t=g}g=fm(b,4,f+17|0,t+((s-1&k)<<2)|0,0)|0;s=g;c[g+12>>2]=f;c[g+8>>2]=k;a[g+6|0]=0;k=g+16|0;kV(k|0,e|0,f)|0;a[k+f|0]=0;c[p>>2]=(c[p>>2]|0)+1;j=s;return j|0}function hI(a,b){a=a|0;b=b|0;return hH(a,b,kU(b|0)|0)|0}function hJ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if(b>>>0>4294967269){gy(a);return 0}else{e=fm(a,7,b+24|0,0,0)|0;c[e+16>>2]=b;c[e+8>>2]=0;c[e+12>>2]=d;return e|0}return 0}function hK(a){a=a|0;dn(a,0,14);et(a,184,0);dn(a,0,1);da(a,12144,0)|0;cR(a,-2);dw(a,-2)|0;cM(a,-2);cR(a,-2);dt(a,-2,10792);cM(a,-2);return 1}function hL(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+8|0;e=b|0;f=d0(a,1,e)|0;g=d8(a,2,1)|0;h=c[e>>2]|0;do{if((g|0)>-1){j=g}else{if(h>>>0<(-g|0)>>>0){j=0;break}j=g+1+h|0}}while(0);h=d8(a,3,j)|0;g=c[e>>2]|0;do{if((h|0)>-1){k=h}else{if(g>>>0<(-h|0)>>>0){k=0;break}k=h+1+g|0}}while(0);h=(j|0)==0?1:j;j=k>>>0>g>>>0?g:k;if(h>>>0>j>>>0){l=0;i=b;return l|0}k=j-h+1|0;if((j|0)==-1){j=dR(a,5224,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;l=j;i=b;return l|0}d1(a,k,5224);if((k|0)<=0){l=k;i=b;return l|0}j=h-1|0;h=0;while(1){c8(a,d[f+(j+h)|0]|0);g=h+1|0;if((g|0)<(k|0)){h=g}else{l=k;break}}i=b;return l|0}function hM(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;c=i;i=i+1040|0;d=c|0;e=cL(b)|0;f=eg(b,d,e)|0;if((e|0)<1){ed(d,e);i=c;return 1}else{g=1}do{h=d6(b,g)|0;if((h&255|0)!=(h|0)){dQ(b,g,5448)|0}a[f+(g-1)|0]=h&255;g=g+1|0;}while((g|0)<=(e|0));ed(d,e);i=c;return 1}function hN(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+1040|0;d=b|0;d2(a,1,6);cM(a,1);ef(a,d);if((dD(a,2,d)|0)==0){ec(d);e=1;i=b;return e|0}else{d=dR(a,5616,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;e=d;i=b;return e|0}return 0}function hO(a){a=a|0;return hZ(a,1)|0}function hP(b){b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0.0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0.0,$=0,aa=0;e=i;i=i+1104|0;f=e|0;g=e+24|0;j=e+32|0;k=e+1072|0;l=e+1096|0;m=cL(b)|0;n=d0(b,1,g)|0;o=c[g>>2]|0;g=n+o|0;ef(b,j);L427:do{if((o|0)>0){p=j+8|0;q=j+4|0;r=j|0;s=k|0;t=k+1|0;u=e+8|0;v=n;x=1;L429:while(1){y=v;while(1){z=a[y]|0;if(z<<24>>24==37){A=y+1|0;if((a[A]|0)!=37){break}B=c[p>>2]|0;if(B>>>0<(c[q>>2]|0)>>>0){C=37;D=B}else{d9(j,1)|0;C=a[A]|0;D=c[p>>2]|0}c[p>>2]=D+1;a[(c[r>>2]|0)+D|0]=C;E=y+2|0}else{B=c[p>>2]|0;if(B>>>0<(c[q>>2]|0)>>>0){F=z;G=B}else{d9(j,1)|0;F=a[y]|0;G=c[p>>2]|0}c[p>>2]=G+1;a[(c[r>>2]|0)+G|0]=F;E=y+1|0}if(E>>>0<g>>>0){y=E}else{break L427}}y=d9(j,512)|0;x=x+1|0;if((x|0)>(m|0)){dQ(b,x,7160)|0;H=A}else{H=A}while(1){B=a[H]|0;if(B<<24>>24==0){I=0;break}if((aK(6048,B<<24>>24|0,6)|0)==0){I=B;break}else{H=H+1|0}}B=A;if((H-B|0)>>>0>5){dR(b,5896,(J=i,i=i+1|0,i=i+7&-8,c[J>>2]=0,J)|0)|0;i=J;K=a[H]|0}else{K=I}z=((K&255)-48|0)>>>0<10?H+1|0:H;L=((d[z]|0)-48|0)>>>0<10?z+1|0:z;z=a[L]|0;do{if(z<<24>>24==46){M=L+1|0;N=((d[M]|0)-48|0)>>>0<10?L+2|0:M;M=a[N]|0;if(((M&255)-48|0)>>>0>=10){O=N;P=M;break}M=N+1|0;O=M;P=a[M]|0}else{O=L;P=z}}while(0);if(((P&255)-48|0)>>>0<10){dR(b,5768,(J=i,i=i+1|0,i=i+7&-8,c[J>>2]=0,J)|0)|0;i=J}a[s]=37;z=O-B|0;L=z+1|0;kV(t|0,A|0,L)|0;a[k+(z+2)|0]=0;v=O+1|0;Q=a[O]|0;L461:do{switch(Q|0){case 99:{z=d6(b,x)|0;L=a$(y|0,s|0,(J=i,i=i+8|0,c[J>>2]=z,J)|0)|0;i=J;R=L;break};case 101:case 69:case 102:case 103:case 71:{a[k+(kU(s|0)|0)|0]=0;S=+d4(b,x);L=a$(y|0,s|0,(J=i,i=i+8|0,h[J>>3]=S,J)|0)|0;i=J;R=L;break};case 113:{L=d0(b,x,f)|0;z=c[p>>2]|0;if(z>>>0<(c[q>>2]|0)>>>0){T=z}else{d9(j,1)|0;T=c[p>>2]|0}c[p>>2]=T+1;a[(c[r>>2]|0)+T|0]=34;z=c[f>>2]|0;c[f>>2]=z-1;if((z|0)!=0){z=L;while(1){L=a[z]|0;do{if((L<<24>>24|0)==34|(L<<24>>24|0)==92|(L<<24>>24|0)==10){M=c[p>>2]|0;if(M>>>0<(c[q>>2]|0)>>>0){U=M}else{d9(j,1)|0;U=c[p>>2]|0}c[p>>2]=U+1;a[(c[r>>2]|0)+U|0]=92;M=c[p>>2]|0;if(M>>>0<(c[q>>2]|0)>>>0){V=M}else{d9(j,1)|0;V=c[p>>2]|0}M=a[z]|0;c[p>>2]=V+1;a[(c[r>>2]|0)+V|0]=M}else if((L<<24>>24|0)==0){W=0;X=371}else{if((b9(L&255|0)|0)!=0){W=d[z]|0;X=371;break}M=c[p>>2]|0;if(M>>>0<(c[q>>2]|0)>>>0){Y=M}else{d9(j,1)|0;Y=c[p>>2]|0}M=a[z]|0;c[p>>2]=Y+1;a[(c[r>>2]|0)+Y|0]=M}}while(0);if((X|0)==371){X=0;if(((d[z+1|0]|0)-48|0)>>>0<10){a$(u|0,6176,(J=i,i=i+8|0,c[J>>2]=W,J)|0)|0;i=J}else{a$(u|0,6264,(J=i,i=i+8|0,c[J>>2]=W,J)|0)|0;i=J}eb(j,u)}L=c[f>>2]|0;c[f>>2]=L-1;if((L|0)==0){break}else{z=z+1|0}}}z=c[p>>2]|0;if(z>>>0<(c[q>>2]|0)>>>0){Z=z}else{d9(j,1)|0;Z=c[p>>2]|0}c[p>>2]=Z+1;a[(c[r>>2]|0)+Z|0]=34;R=0;break};case 100:case 105:{S=+d4(b,x);z=~~S;_=S- +(z|0);if(!(_>-1.0&_<1.0)){dQ(b,x,6984)|0}L=kU(s|0)|0;M=k+(L-1)|0;N=a[M]|0;$=M;w=108;a[$]=w&255;w=w>>8;a[$+1|0]=w&255;a[k+L|0]=N;a[k+(L+1)|0]=0;L=a$(y|0,s|0,(J=i,i=i+8|0,c[J>>2]=z,J)|0)|0;i=J;R=L;break};case 111:case 117:case 120:case 88:{_=+d4(b,x);L=~~_;S=_- +(L>>>0>>>0);if(!(S>-1.0&S<1.0)){dQ(b,x,6632)|0}z=kU(s|0)|0;N=k+(z-1)|0;$=a[N]|0;M=N;w=108;a[M]=w&255;w=w>>8;a[M+1|0]=w&255;a[k+z|0]=$;a[k+(z+1)|0]=0;z=a$(y|0,s|0,(J=i,i=i+8|0,c[J>>2]=L,J)|0)|0;i=J;R=z;break};case 115:{z=ep(b,x,l)|0;do{if((aT(s|0,46)|0)==0){if((c[l>>2]|0)>>>0<=99){break}ee(j);R=0;break L461}}while(0);L=a$(y|0,s|0,(J=i,i=i+8|0,c[J>>2]=z,J)|0)|0;i=J;cM(b,-2);R=L;break};default:{break L429}}}while(0);c[p>>2]=(c[p>>2]|0)+R;if(v>>>0>=g>>>0){break L427}}v=dR(b,6480,(J=i,i=i+8|0,c[J>>2]=Q,J)|0)|0;i=J;aa=v;i=e;return aa|0}}while(0);ec(j);aa=1;i=e;return aa|0}function hQ(a){a=a|0;d0(a,1,0)|0;d0(a,2,0)|0;cM(a,2);c8(a,0);de(a,172,3);return 1}function hR(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;d=i;i=i+1344|0;e=d|0;f=d+8|0;g=d+16|0;h=d+24|0;j=d+304|0;k=d0(b,1,f)|0;l=d0(b,2,g)|0;m=cS(b,3)|0;n=d8(b,4,(c[f>>2]|0)+1|0)|0;o=(a[l]|0)==94;if(!((m-3|0)>>>0<2|(m|0)==6|(m|0)==5)){dQ(b,3,7664)|0}ef(b,j);if(o){p=(c[g>>2]|0)-1|0;c[g>>2]=p;q=l+1|0;r=p}else{q=l;r=c[g>>2]|0}g=h+16|0;c[g>>2]=b;c[h>>2]=200;l=h+4|0;c[l>>2]=k;p=h+8|0;c[p>>2]=k+(c[f>>2]|0);c[h+12>>2]=q+r;r=h+20|0;f=j+8|0;s=j+4|0;t=j|0;u=h+28|0;v=h+24|0;w=k;k=0;while(1){if(k>>>0>=n>>>0){x=w;y=k;z=443;break}c[r>>2]=0;A=h_(h,w,q)|0;if((A|0)==0){B=k;z=435}else{C=k+1|0;D=c[g>>2]|0;do{if((m|0)==6){cR(D,3);E=c[r>>2]|0;F=(E|0)!=0|(w|0)==0?E:1;d1(c[g>>2]|0,F,10048);if((F|0)>0){E=0;do{h$(h,E,w,A);E=E+1|0;}while((E|0)<(F|0))}dz(D,F,1,0,0);z=429}else if((m|0)==5){L559:do{if((c[r>>2]|0)>0){E=c[u>>2]|0;do{if((E|0)==-1){dR(D,9584,(G=i,i=i+1|0,i=i+7&-8,c[G>>2]=0,G)|0)|0;i=G;H=c[g>>2]|0;I=c[v>>2]|0}else{J=c[v>>2]|0;if((E|0)!=-2){H=D;I=J;break}c8(D,J+1-(c[l>>2]|0)|0);break L559}}while(0);da(H,I,E)|0}else{J=A-w|0;da(D,w,J)|0}}while(0);dj(D,3);z=429}else{F=c1(D,3,e)|0;if((c[e>>2]|0)==0){break}J=A-w|0;K=0;do{L=F+K|0;M=a[L]|0;do{if(M<<24>>24==37){N=K+1|0;O=F+N|0;P=a[O]|0;Q=P<<24>>24;if(((P&255)-48|0)>>>0<10){if(P<<24>>24==48){ea(j,w,J);R=N;break}else{h$(h,Q-49|0,w,A);ee(j);R=N;break}}if(P<<24>>24!=37){P=c[g>>2]|0;dR(P,7336,(G=i,i=i+8|0,c[G>>2]=37,G)|0)|0;i=G}P=c[f>>2]|0;if(P>>>0<(c[s>>2]|0)>>>0){S=P}else{d9(j,1)|0;S=c[f>>2]|0}P=a[O]|0;c[f>>2]=S+1;a[(c[t>>2]|0)+S|0]=P;R=N}else{N=c[f>>2]|0;if(N>>>0<(c[s>>2]|0)>>>0){T=M;U=N}else{d9(j,1)|0;T=a[L]|0;U=c[f>>2]|0}c[f>>2]=U+1;a[(c[t>>2]|0)+U|0]=T;R=K}}while(0);K=R+1|0;}while(K>>>0<(c[e>>2]|0)>>>0)}}while(0);if((z|0)==429){z=0;do{if((c0(D,-1)|0)==0){cM(D,-2);K=A-w|0;da(D,w,K)|0}else{if((cW(D,-1)|0)!=0){break}K=cT(D,cS(D,-1)|0)|0;dR(D,7504,(G=i,i=i+8|0,c[G>>2]=K,G)|0)|0;i=G}}while(0);ee(j)}if(A>>>0>w>>>0){V=A;W=C}else{B=C;z=435}}if((z|0)==435){z=0;if(w>>>0>=(c[p>>2]|0)>>>0){x=w;y=B;z=441;break}D=c[f>>2]|0;if(D>>>0<(c[s>>2]|0)>>>0){X=D}else{d9(j,1)|0;X=c[f>>2]|0}D=a[w]|0;c[f>>2]=X+1;a[(c[t>>2]|0)+X|0]=D;V=w+1|0;W=B}if(o){x=V;y=W;z=442;break}else{w=V;k=W}}if((z|0)==441){Y=c[p>>2]|0;Z=Y;_=x;$=Z-_|0;ea(j,x,$);ec(j);c8(b,y);i=d;return 2}else if((z|0)==442){Y=c[p>>2]|0;Z=Y;_=x;$=Z-_|0;ea(j,x,$);ec(j);c8(b,y);i=d;return 2}else if((z|0)==443){Y=c[p>>2]|0;Z=Y;_=x;$=Z-_|0;ea(j,x,$);ec(j);c8(b,y);i=d;return 2}return 0}function hS(a){a=a|0;var b=0,d=0;b=i;i=i+8|0;d=b|0;d0(a,1,d)|0;c8(a,c[d>>2]|0);i=b;return 1}function hT(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+1048|0;f=e|0;g=e+8|0;h=d0(b,1,f)|0;j=eg(b,g,c[f>>2]|0)|0;if((c[f>>2]|0)==0){k=0;ed(g,k);i=e;return 1}else{l=0}while(1){a[j+l|0]=(k_(d[h+l|0]|0|0)|0)&255;b=l+1|0;m=c[f>>2]|0;if(b>>>0<m>>>0){l=b}else{k=m;break}}ed(g,k);i=e;return 1}function hU(a){a=a|0;return hZ(a,0)|0}function hV(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;b=i;i=i+1056|0;d=b|0;e=b+8|0;f=b+16|0;g=d0(a,1,d)|0;h=d6(a,2)|0;j=d$(a,3,12144,e)|0;if((h|0)<1){da(a,12144,0)|0;k=1;i=b;return k|0}l=c[d>>2]|0;m=c[e>>2]|0;n=a4(l|0,m|0)|0;do{if(!E){if(n>>>0>=(2147483647/(h>>>0)|0)>>>0){break}o=(aa(m,h-1|0)|0)+(aa(l,h)|0)|0;p=eg(a,f,o)|0;q=(h|0)>1;r=c[d>>2]|0;kV(p|0,g|0,r)|0;if(q){q=p;p=h;while(1){r=p-1|0;s=c[d>>2]|0;t=q+s|0;u=c[e>>2]|0;if((u|0)==0){v=t;w=s}else{kV(t|0,j|0,u)|0;v=q+((c[e>>2]|0)+s)|0;w=c[d>>2]|0}s=(r|0)>1;kV(v|0,g|0,w)|0;if(s){q=v;p=r}else{break}}}ed(f,o);k=1;i=b;return k|0}}while(0);f=dR(a,10280,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;k=f;i=b;return k|0}function hW(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+1048|0;e=d|0;f=d+8|0;g=d0(b,1,e)|0;h=eg(b,f,c[e>>2]|0)|0;b=c[e>>2]|0;if((b|0)==0){j=0;ed(f,j);i=d;return 1}else{k=0;l=b}while(1){a[h+k|0]=a[g+(l+~k)|0]|0;b=k+1|0;m=c[e>>2]|0;if(b>>>0<m>>>0){k=b;l=m}else{j=m;break}}ed(f,j);i=d;return 1}function hX(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+8|0;d=b|0;e=d0(a,1,d)|0;f=d6(a,2)|0;g=c[d>>2]|0;do{if((f|0)>-1){h=f}else{if(g>>>0<(-f|0)>>>0){h=0;break}h=f+1+g|0}}while(0);g=d8(a,3,-1)|0;f=c[d>>2]|0;do{if((g|0)>-1){j=g}else{if(f>>>0<(-g|0)>>>0){j=0;break}j=g+1+f|0}}while(0);g=(h|0)==0?1:h;h=j>>>0>f>>>0?f:j;if(g>>>0>h>>>0){da(a,12144,0)|0;i=b;return 1}else{j=e+(g-1)|0;e=1-g+h|0;da(a,j,e)|0;i=b;return 1}return 0}function hY(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+1048|0;f=e|0;g=e+8|0;h=d0(b,1,f)|0;j=eg(b,g,c[f>>2]|0)|0;if((c[f>>2]|0)==0){k=0;ed(g,k);i=e;return 1}else{l=0}while(1){a[j+l|0]=(bj(d[h+l|0]|0|0)|0)&255;b=l+1|0;m=c[f>>2]|0;if(b>>>0<m>>>0){l=b}else{k=m;break}}ed(g,k);i=e;return 1}function hZ(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=i;i=i+296|0;f=e|0;g=e+8|0;h=e+16|0;j=d0(b,1,f)|0;k=d0(b,2,g)|0;l=d8(b,3,1)|0;m=c[f>>2]|0;do{if((l|0)>-1){n=l;o=490}else{if(m>>>0<(-l|0)>>>0){p=1;break}n=l+1+m|0;o=490}}while(0);do{if((o|0)==490){if((n|0)==0){p=1;break}if(n>>>0<=(m+1|0)>>>0){p=n;break}c6(b);q=1;i=e;return q|0}}while(0);n=(d|0)!=0;L649:do{if(n){d=(c0(b,4)|0)==0;m=c[g>>2]|0;if(d){d=0;do{l=k+d|0;if((b1(l|0,7848)|0)!=0){o=506;break L649}d=d+1+(kU(l|0)|0)|0;}while(d>>>0<=m>>>0)}d=j+(p-1)|0;l=(c[f>>2]|0)-p+1|0;L656:do{if((m|0)==0){if((d|0)==0){break L649}else{r=d}}else{if(m>>>0>l>>>0){break L649}s=m-1|0;if((s|0)==(l|0)){break L649}t=a[k]|0;u=k+1|0;v=d;w=l-s|0;while(1){x=aK(v|0,t|0,w|0)|0;if((x|0)==0){break L649}y=x+1|0;if((kZ(y|0,u|0,s|0)|0)==0){r=x;break L656}x=y;z=v+w|0;if((z|0)==(x|0)){break L649}else{v=y;w=z-x|0}}}}while(0);l=r-j|0;c8(b,l+1|0);c8(b,l+(c[g>>2]|0)|0);q=2;i=e;return q|0}else{o=506}}while(0);L667:do{if((o|0)==506){r=j+(p-1)|0;l=(a[k]|0)==94;if(l){d=(c[g>>2]|0)-1|0;c[g>>2]=d;A=k+1|0;B=d}else{A=k;B=c[g>>2]|0}d=h+16|0;c[d>>2]=b;c[h>>2]=200;c[h+4>>2]=j;m=h+8|0;c[m>>2]=j+(c[f>>2]|0);c[h+12>>2]=A+B;w=h+20|0;L673:do{if(l){c[w>>2]=0;v=h_(h,r,A)|0;if((v|0)==0){break L667}else{C=r;D=v}}else{v=r;while(1){c[w>>2]=0;s=h_(h,v,A)|0;if((s|0)!=0){C=v;D=s;break L673}if(v>>>0>=(c[m>>2]|0)>>>0){break L667}v=v+1|0}}}while(0);if(n){m=j;c8(b,1-m+C|0);c8(b,D-m|0);m=c[w>>2]|0;d1(c[d>>2]|0,m,10048);if((m|0)>0){r=0;do{h$(h,r,0,0);r=r+1|0;}while((r|0)<(m|0))}q=m+2|0;i=e;return q|0}else{r=c[w>>2]|0;l=(r|0)!=0|(C|0)==0?r:1;d1(c[d>>2]|0,l,10048);if((l|0)>0){E=0}else{q=l;i=e;return q|0}while(1){h$(h,E,C,D);r=E+1|0;if((r|0)<(l|0)){E=r}else{q=l;break}}i=e;return q|0}}}while(0);c6(b);q=1;i=e;return q|0}function h_(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0;g=i;h=b|0;j=c[h>>2]|0;c[h>>2]=j-1;if((j|0)==0){j=c[b+16>>2]|0;dR(j,9368,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}j=b+12|0;l=c[j>>2]|0;L699:do{if((l|0)==(f|0)){m=e}else{n=b+8|0;o=b+16|0;p=b+4|0;q=b+20|0;r=f;s=e;t=l;L701:while(1){u=s+1|0;v=s-1|0;w=r;x=t;L703:while(1){y=a[w]|0;z=y<<24>>24;L705:do{if((z|0)==36){A=w+1|0;if((A|0)==(x|0)){B=550;break L701}else{C=A;D=A;B=617}}else if((z|0)==40){B=534;break L701}else if((z|0)==41){B=543;break L701}else if((z|0)==37){A=w+1|0;E=a[A]|0;switch(E<<24>>24|0){case 98:{B=552;break L703;break};case 102:{break};case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:{B=597;break L703;break};default:{if((A|0)==(x|0)){F=c[o>>2]|0;dR(F,8752,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}C=w+2|0;D=A;B=617;break L705}}A=w+2|0;do{if((a[A]|0)==91){G=w+3|0;B=568}else{F=c[o>>2]|0;dR(F,9128,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k;F=a[A]|0;H=w+3|0;if((F|0)==91){G=H;B=568;break}else if((F|0)!=37){I=H;J=H;break}if((H|0)==(c[j>>2]|0)){F=c[o>>2]|0;dR(F,8752,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}I=w+4|0;J=H}}while(0);if((B|0)==568){B=0;H=(a[G]|0)==94?w+4|0:G;while(1){if((H|0)==(c[j>>2]|0)){F=c[o>>2]|0;dR(F,8504,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}F=H+1|0;if((a[H]|0)==37){K=F>>>0<(c[j>>2]|0)>>>0?H+2|0:F}else{K=F}if((a[K]|0)==93){break}else{H=K}}I=K+1|0;J=G}if((s|0)==(c[p>>2]|0)){L=0}else{L=d[v]|0}H=I-1|0;F=(a[J]|0)==94;M=F?J:A;N=F&1;F=N^1;O=M+1|0;L736:do{if(O>>>0<H>>>0){P=M;Q=O;while(1){R=a[Q]|0;S=P+2|0;T=a[S]|0;L739:do{if(R<<24>>24==37){if((h0(L,T&255)|0)==0){U=S}else{V=F;break L736}}else{do{if(T<<24>>24==45){W=P+3|0;if(W>>>0>=H>>>0){break}if((R&255)>>>0>L>>>0){U=W;break L739}if((d[W]|0)>>>0<L>>>0){U=W;break L739}else{V=F;break L736}}}while(0);if((R&255|0)==(L|0)){V=F;break L736}else{U=Q}}}while(0);R=U+1|0;if(R>>>0<H>>>0){P=U;Q=R}else{V=N;break}}}else{V=N}}while(0);if((V|0)!=0){m=0;break L699}N=a[s]|0;F=N&255;O=(a[J]|0)==94;M=O?J:A;Q=O&1;O=Q^1;P=M+1|0;L750:do{if(P>>>0<H>>>0){R=M;T=P;while(1){S=a[T]|0;W=R+2|0;X=a[W]|0;L753:do{if(S<<24>>24==37){if((h0(F,X&255)|0)==0){Y=W}else{Z=O;break L750}}else{do{if(X<<24>>24==45){_=R+3|0;if(_>>>0>=H>>>0){break}if((S&255)>(N&255)){Y=_;break L753}if((d[_]|0)<(N&255)){Y=_;break L753}else{Z=O;break L750}}}while(0);if(S<<24>>24==N<<24>>24){Z=O;break L750}else{Y=T}}}while(0);S=Y+1|0;if(S>>>0<H>>>0){R=Y;T=S}else{Z=Q;break}}}else{Z=Q}}while(0);if((Z|0)==0){m=0;break L699}else{$=I}}else{Q=w+1|0;if(y<<24>>24!=91){C=Q;D=Q;B=617;break}H=(a[Q]|0)==94?w+2|0:Q;O=x;while(1){if((H|0)==(O|0)){N=c[o>>2]|0;dR(N,8504,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}N=H+1|0;if((a[H]|0)==37){aa=N>>>0<(c[j>>2]|0)>>>0?H+2|0:N}else{aa=N}if((a[aa]|0)==93){break}H=aa;O=c[j>>2]|0}C=aa+1|0;D=Q;B=617}}while(0);L775:do{if((B|0)==617){B=0;do{if((c[n>>2]|0)>>>0>s>>>0){y=a[s]|0;z=y&255;O=a[w]|0;H=O<<24>>24;L780:do{if((H|0)==46){ab=a[C]|0}else if((H|0)==37){ac=h0(z,d[D]|0)|0;B=632}else if((H|0)==91){N=C-1|0;F=(a[D]|0)==94;P=F?D:w;M=F&1;F=M^1;A=P+1|0;if(A>>>0<N>>>0){ad=P;ae=A}else{ac=M;B=632;break}while(1){A=a[ae]|0;P=ad+2|0;T=a[P]|0;L786:do{if(A<<24>>24==37){if((h0(z,T&255)|0)==0){af=P}else{ac=F;B=632;break L780}}else{do{if(T<<24>>24==45){R=ad+3|0;if(R>>>0>=N>>>0){break}if((A&255)>(y&255)){af=R;break L786}if((d[R]|0)<(y&255)){af=R;break L786}else{ac=F;B=632;break L780}}}while(0);if(A<<24>>24==y<<24>>24){ac=F;B=632;break L780}else{af=ae}}}while(0);A=af+1|0;if(A>>>0<N>>>0){ad=af;ae=A}else{ac=M;B=632;break}}}else{ac=O<<24>>24==y<<24>>24|0;B=632}}while(0);if((B|0)==632){B=0;y=a[C]|0;if((ac|0)==0){ag=y;break}else{ab=y}}y=ab<<24>>24;if((y|0)==45){B=637;break L701}else if((y|0)==42){B=640;break L701}else if((y|0)==43){ah=u;break L701}else if((y|0)!=63){ai=u;aj=C;break L703}y=C+1|0;O=h_(b,u,y)|0;if((O|0)==0){$=y;break L775}else{m=O;break L699}}else{ag=a[C]|0}}while(0);if(!((ag<<24>>24|0)==42|(ag<<24>>24|0)==63|(ag<<24>>24|0)==45)){m=0;break L699}$=C+1|0}}while(0);Q=c[j>>2]|0;if(($|0)==(Q|0)){m=s;break L699}else{w=$;x=Q}}if((B|0)==552){B=0;v=w+2|0;if((x-1|0)>>>0<=v>>>0){Q=c[o>>2]|0;dR(Q,8320,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}Q=a[s]|0;if(Q<<24>>24!=(a[v]|0)){m=0;break L699}v=a[w+3|0]|0;O=c[n>>2]|0;if(u>>>0<O>>>0){ak=s;al=1;am=u}else{m=0;break L699}while(1){y=a[am]|0;if(y<<24>>24==v<<24>>24){z=al-1|0;if((z|0)==0){break}else{an=z}}else{an=(y<<24>>24==Q<<24>>24)+al|0}y=am+1|0;if(y>>>0<O>>>0){ak=am;al=an;am=y}else{m=0;break L699}}O=ak+2|0;if((O|0)==0){m=0;break L699}ai=O;aj=w+4|0}else if((B|0)==597){B=0;O=E&255;Q=O-49|0;do{if((Q|0)<0){B=600}else{if((Q|0)>=(c[q>>2]|0)){B=600;break}v=c[b+24+(Q<<3)+4>>2]|0;if((v|0)==-1){B=600}else{ao=Q;ap=v}}}while(0);if((B|0)==600){B=0;Q=dR(c[o>>2]|0,8960,(k=i,i=i+8|0,c[k>>2]=O-48,k)|0)|0;i=k;ao=Q;ap=c[b+24+(Q<<3)+4>>2]|0}if(((c[n>>2]|0)-s|0)>>>0<ap>>>0){m=0;break L699}if((kZ(c[b+24+(ao<<3)>>2]|0,s|0,ap|0)|0)!=0){m=0;break L699}Q=s+ap|0;if((Q|0)==0){m=0;break L699}ai=Q;aj=w+2|0}Q=c[j>>2]|0;if((aj|0)==(Q|0)){m=ai;break L699}else{r=aj;s=ai;t=Q}}if((B|0)==534){t=w+1|0;if((a[t]|0)==41){r=c[q>>2]|0;if((r|0)>31){p=c[o>>2]|0;dR(p,10048,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}c[b+24+(r<<3)>>2]=s;c[b+24+(r<<3)+4>>2]=-2;c[q>>2]=r+1;r=h_(b,s,w+2|0)|0;if((r|0)!=0){m=r;break}c[q>>2]=(c[q>>2]|0)-1;m=0;break}else{r=c[q>>2]|0;if((r|0)>31){p=c[o>>2]|0;dR(p,10048,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}c[b+24+(r<<3)>>2]=s;c[b+24+(r<<3)+4>>2]=-1;c[q>>2]=r+1;r=h_(b,s,t)|0;if((r|0)!=0){m=r;break}c[q>>2]=(c[q>>2]|0)-1;m=0;break}}else if((B|0)==543){r=w+1|0;t=c[q>>2]|0;while(1){p=t-1|0;if((t|0)<=0){B=546;break}if((c[b+24+(p<<3)+4>>2]|0)==-1){aq=p;break}else{t=p}}if((B|0)==546){t=dR(c[o>>2]|0,8088,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k;aq=t}t=b+24+(aq<<3)+4|0;c[t>>2]=s-(c[b+24+(aq<<3)>>2]|0);q=h_(b,s,r)|0;if((q|0)!=0){m=q;break}c[t>>2]=-1;m=0;break}else if((B|0)==550){m=(s|0)==(c[n>>2]|0)?s:0;break}else if((B|0)==637){t=C+1|0;q=h_(b,s,t)|0;if((q|0)!=0){m=q;break}q=C-1|0;p=s;while(1){if((c[n>>2]|0)>>>0<=p>>>0){m=0;break L699}Q=a[p]|0;v=Q&255;u=a[w]|0;x=u<<24>>24;L855:do{if((x|0)==37){ar=h0(v,d[D]|0)|0;B=674}else if((x|0)==91){y=(a[D]|0)==94;z=y?D:w;H=y&1;y=H^1;M=z+1|0;if(M>>>0<q>>>0){as=z;at=M}else{ar=H;B=674;break}while(1){M=a[at]|0;z=as+2|0;N=a[z]|0;L860:do{if(M<<24>>24==37){if((h0(v,N&255)|0)==0){au=z}else{ar=y;B=674;break L855}}else{do{if(N<<24>>24==45){F=as+3|0;if(F>>>0>=q>>>0){break}if((M&255)>(Q&255)){au=F;break L860}if((d[F]|0)<(Q&255)){au=F;break L860}else{ar=y;B=674;break L855}}}while(0);if(M<<24>>24==Q<<24>>24){ar=y;B=674;break L855}else{au=at}}}while(0);M=au+1|0;if(M>>>0<q>>>0){as=au;at=M}else{ar=H;B=674;break}}}else if((x|0)!=46){ar=u<<24>>24==Q<<24>>24|0;B=674}}while(0);if((B|0)==674){B=0;if((ar|0)==0){m=0;break L699}}Q=p+1|0;u=h_(b,Q,t)|0;if((u|0)==0){p=Q}else{m=u;break L699}}}else if((B|0)==640){ah=s}p=c[n>>2]|0;L875:do{if(p>>>0>ah>>>0){t=C-1|0;q=0;r=ah;o=p;while(1){u=a[r]|0;Q=u&255;x=a[w]|0;v=x<<24>>24;L879:do{if((v|0)==37){av=h0(Q,d[D]|0)|0;B=656}else if((v|0)==91){O=(a[D]|0)==94;H=O?D:w;y=O&1;O=y^1;M=H+1|0;if(M>>>0<t>>>0){aw=H;ax=M}else{av=y;B=656;break}while(1){M=a[ax]|0;H=aw+2|0;N=a[H]|0;L884:do{if(M<<24>>24==37){if((h0(Q,N&255)|0)==0){ay=H}else{av=O;B=656;break L879}}else{do{if(N<<24>>24==45){z=aw+3|0;if(z>>>0>=t>>>0){break}if((M&255)>(u&255)){ay=z;break L884}if((d[z]|0)<(u&255)){ay=z;break L884}else{av=O;B=656;break L879}}}while(0);if(M<<24>>24==u<<24>>24){av=O;B=656;break L879}else{ay=ax}}}while(0);M=ay+1|0;if(M>>>0<t>>>0){aw=ay;ax=M}else{av=y;B=656;break}}}else if((v|0)==46){az=o}else{av=x<<24>>24==u<<24>>24|0;B=656}}while(0);if((B|0)==656){B=0;if((av|0)==0){aA=q;break L875}az=c[n>>2]|0}u=q+1|0;x=ah+u|0;if(az>>>0>x>>>0){q=u;r=x;o=az}else{aA=u;break}}}else{aA=0}}while(0);n=C+1|0;p=aA;while(1){if((p|0)<=-1){m=0;break L699}s=h_(b,ah+p|0,n)|0;if((s|0)==0){p=p-1|0}else{m=s;break}}}}while(0);c[h>>2]=(c[h>>2]|0)+1;i=g;return m|0}function h$(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;if((c[a+20>>2]|0)<=(b|0)){g=c[a+16>>2]|0;if((b|0)==0){h=e-d|0;da(g,d,h)|0;i=f;return}else{dR(g,9832,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j;i=f;return}}g=c[a+24+(b<<3)+4>>2]|0;do{if((g|0)==-1){h=a+16|0;d=c[h>>2]|0;dR(d,9584,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j;k=c[h>>2]|0;l=c[a+24+(b<<3)>>2]|0}else{h=c[a+16>>2]|0;d=c[a+24+(b<<3)>>2]|0;if((g|0)!=-2){k=h;l=d;break}c8(h,d+1-(c[a+4>>2]|0)|0);i=f;return}}while(0);da(k,l,g)|0;i=f;return}function h0(a,b){a=a|0;b=b|0;var c=0,d=0;switch(k_(b|0)|0){case 108:{c=bb(a|0)|0;break};case 122:{c=(a|0)==0|0;break};case 120:{c=aY(a|0)|0;break};case 112:{c=bS(a|0)|0;break};case 117:{c=bd(a|0)|0;break};case 100:{c=(a-48|0)>>>0<10|0;break};case 115:{c=aA(a|0)|0;break};case 119:{c=br(a|0)|0;break};case 103:{c=b2(a|0)|0;break};case 97:{c=bt(a|0)|0;break};case 99:{c=b9(a|0)|0;break};default:{d=(b|0)==(a|0)|0;return d|0}}if((bb(b|0)|0)!=0){d=c;return d|0}d=(c|0)==0|0;return d|0}function h1(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;b=i;i=i+296|0;d=b|0;e=b+280|0;f=b+288|0;g=c1(a,-1001001,e)|0;h=c1(a,-1001002,f)|0;j=d+16|0;c[j>>2]=a;c[d>>2]=200;c[d+4>>2]=g;k=g+(c[e>>2]|0)|0;e=d+8|0;c[e>>2]=k;c[d+12>>2]=h+(c[f>>2]|0);f=d+20|0;l=g+(c_(a,-1001003,0)|0)|0;m=k;while(1){if(l>>>0>m>>>0){n=0;o=720;break}c[f>>2]=0;p=h_(d,l,h)|0;if((p|0)!=0){break}l=l+1|0;m=c[e>>2]|0}if((o|0)==720){i=b;return n|0}c8(a,p-g+((p|0)==(l|0))|0);cP(a,-1001003);a=c[f>>2]|0;f=(a|0)!=0|(l|0)==0?a:1;d1(c[j>>2]|0,f,10048);if((f|0)>0){q=0}else{n=f;i=b;return n|0}while(1){h$(d,q,l,p);j=q+1|0;if((j|0)<(f|0)){q=j}else{n=f;break}}i=b;return n|0}function h2(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ea(d,b,c);return 0}function h3(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+8|0;g=f|0;j=e+8|0;k=c[j>>2]|0;L954:do{if((k|0)==0){l=-1;m=c[b+28>>2]|0}else{do{if((k|0)==3){n=+h[e>>3];h[g>>3]=n+6755399441055744.0;o=c[g>>2]|0;if(+(o|0)!=n){break}if((o|0)<=0){break}p=c[b+28>>2]|0;if((o|0)>(p|0)){break}l=o-1|0;m=p;break L954}}while(0);p=e;o=ic(b,e)|0;L963:while(1){q=o+16|0;r=o+24|0;s=c[r>>2]|0;if((s|0)==(c[j>>2]|0)){if((iG(0,q,e)|0)!=0){t=736;break}u=c[r>>2]|0}else{u=s}do{if((u|0)==11){if((c[j>>2]&64|0)==0){break}if((c[q>>2]|0)==(c[p>>2]|0)){t=736;break L963}}}while(0);q=c[o+28>>2]|0;if((q|0)==0){t=739;break}else{o=q}}if((t|0)==739){eM(a,6576,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0);i=p;return 0}else if((t|0)==736){p=c[b+28>>2]|0;l=(o-(c[b+16>>2]|0)>>5)+p|0;m=p;break}}}while(0);a=b+12|0;u=l;while(1){v=u+1|0;if((v|0)>=(m|0)){break}if((c[(c[a>>2]|0)+(v<<4)+8>>2]|0)==0){u=v}else{t=742;break}}if((t|0)==742){h[e>>3]=+(u+2|0);c[j>>2]=3;u=c[a>>2]|0;a=u+(v<<4)|0;l=e+16|0;g=c[a+4>>2]|0;c[l>>2]=c[a>>2];c[l+4>>2]=g;c[e+24>>2]=c[u+(v<<4)+8>>2];w=1;i=f;return w|0}u=1<<(d[b+7|0]|0);g=b+16|0;b=v-m|0;while(1){if((b|0)>=(u|0)){w=0;t=749;break}x=c[g>>2]|0;if((c[x+(b<<5)+8>>2]|0)==0){b=b+1|0}else{break}}if((t|0)==749){i=f;return w|0}t=x+(b<<5)+16|0;u=e;m=c[t+4>>2]|0;c[u>>2]=c[t>>2];c[u+4>>2]=m;c[j>>2]=c[x+(b<<5)+24>>2];x=c[g>>2]|0;g=x+(b<<5)|0;j=e+16|0;m=c[g+4>>2]|0;c[j>>2]=c[g>>2];c[j+4>>2]=m;c[e+24>>2]=c[x+(b<<5)+8>>2];w=1;i=f;return w|0}function h4(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=b+28|0;h=c[g>>2]|0;i=d[b+7|0]|0;j=c[b+16>>2]|0;if((h|0)<(e|0)){if((e+1|0)>>>0>268435455){gy(a)}k=b+12|0;l=gz(a,c[k>>2]|0,h<<4,e<<4)|0;c[k>>2]=l;m=c[g>>2]|0;do{if((m|0)<(e|0)){c[l+(m<<4)+8>>2]=0;n=m+1|0;if((n|0)<(e|0)){o=n}else{break}do{c[(c[k>>2]|0)+(o<<4)+8>>2]=0;o=o+1|0;}while((o|0)<(e|0))}}while(0);c[g>>2]=e}h5(a,b,f);do{if((h|0)>(e|0)){c[g>>2]=e;f=b+12|0;o=e;while(1){k=c[f>>2]|0;if((c[k+(o<<4)+8>>2]|0)==0){p=o+1|0}else{m=o+1|0;h6(a,b,m,k+(o<<4)|0);p=m}if((p|0)<(h|0)){o=p}else{break}}if((e+1|0)>>>0>268435455){gy(a)}else{o=b+12|0;c[o>>2]=gz(a,c[o>>2]|0,h<<4,e<<4)|0;break}}}while(0);e=1<<i;if((e|0)>0){i=e;do{i=i-1|0;h=j+(i<<5)+8|0;if((c[h>>2]|0)!=0){p=j+(i<<5)+16|0;g=ig(b,p)|0;if((g|0)==1296){q=ib(a,b,p)|0}else{q=g}g=j+(i<<5)|0;p=q;o=c[g+4>>2]|0;c[p>>2]=c[g>>2];c[p+4>>2]=o;c[q+8>>2]=c[h>>2]}}while((i|0)>0)}if((j|0)==1976){return}gz(a,j,e<<5,0)|0;return}function h5(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;do{if((e|0)==0){c[d+16>>2]=1976;g=0;h=0;j=1976}else{k=gR(e)|0;if((k|0)>30){eM(b,8456,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0);i=l}l=1<<k;if((l+1|0)>>>0>134217727){gy(b)}m=gz(b,0,0,l<<5)|0;n=d+16|0;c[n>>2]=m;o=k&255;if((l|0)>0){p=0;q=m}else{g=l;h=o;j=m;break}while(1){c[q+(p<<5)+28>>2]=0;c[q+(p<<5)+24>>2]=0;c[q+(p<<5)+8>>2]=0;m=p+1|0;k=c[n>>2]|0;if((m|0)<(l|0)){p=m;q=k}else{g=l;h=o;j=k;break}}}}while(0);a[d+7|0]=h;c[d+20>>2]=j+(g<<5);i=f;return}function h6(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0,q=0,r=0,s=0.0,t=0;g=i;i=i+24|0;j=g|0;k=g+8|0;l=e-1|0;L1044:do{if(l>>>0<(c[b+28>>2]|0)>>>0){m=(c[b+12>>2]|0)+(l<<4)|0;n=796}else{o=+(e|0);h[j>>3]=o+1.0;p=(c[j+4>>2]|0)+(c[j>>2]|0)|0;if((p|0)<0){q=-p|0;r=(p|0)==(q|0)?0:q}else{r=p}p=(c[b+16>>2]|0)+(((r|0)%((1<<(d[b+7|0]|0))-1|1|0)|0)<<5)|0;while(1){if((c[p+24>>2]|0)==3){if(+h[p+16>>3]==o){break}}q=c[p+28>>2]|0;if((q|0)==0){s=o;n=798;break L1044}else{p=q}}m=p|0;n=796}}while(0);do{if((n|0)==796){if((m|0)!=1296){t=m;break}s=+(e|0);n=798}}while(0);if((n|0)==798){h[k>>3]=s;c[k+8>>2]=3;t=ib(a,b,k)|0}k=f;b=t;a=c[k+4>>2]|0;c[b>>2]=c[k>>2];c[b+4>>2]=a;c[t+8>>2]=c[f+8>>2];i=g;return}function h7(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=ig(b,c)|0;if((d|0)!=1296){e=d;return e|0}e=ib(a,b,c)|0;return e|0}function h8(a,b,e){a=a|0;b=b|0;e=e|0;var f=0;if((c[b+16>>2]|0)==1976){f=0}else{f=1<<(d[b+7|0]|0)}h4(a,b,e,f);return}function h9(b){b=b|0;var d=0;d=fm(b,5,32,0,0)|0;b=d;c[d+8>>2]=0;a[d+6|0]=-1;c[d+12>>2]=0;c[b+28>>2]=0;c[d+16>>2]=1976;a[b+7|0]=0;c[b+20>>2]=1976;return b|0}function ia(a,b){a=a|0;b=b|0;var e=0,f=0;e=c[b+16>>2]|0;if((e|0)!=1976){f=e;e=32<<(d[b+7|0]|0);gz(a,f,e,0)|0}gz(a,c[b+12>>2]|0,c[b+28>>2]<<4,0)|0;gz(a,b,32,0)|0;return}function ib(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;g=i;i=i+144|0;j=g|0;k=g+8|0;l=g+16|0;m=l;n=f+8|0;o=c[n>>2]|0;if((o|0)==0){eM(b,4832,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0);i=p;return 0}else if((o|0)==3){q=814}do{if((q|0)==814){r=+h[f>>3];if(r==r&!(D=0.0,D!=D)){break}eM(b,10704,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0);i=p;return 0}}while(0);p=ic(e,f)|0;o=p+8|0;L1083:do{if((c[o>>2]|0)!=0|(p|0)==1976){s=e+20|0;t=e+16|0;u=c[t>>2]|0;v=c[s>>2]|0;while(1){if(v>>>0<=u>>>0){break}w=v-32|0;c[s>>2]=w;if((c[v-32+24>>2]|0)==0){q=820;break}else{v=w}}do{if((q|0)==820){if((w|0)==0){break}s=ic(e,p+16|0)|0;if((s|0)==(p|0)){u=p+28|0;c[v-32+28>>2]=c[u>>2];c[u>>2]=w;x=w;break L1083}else{y=s}do{z=y+28|0;y=c[z>>2]|0;}while((y|0)!=(p|0));c[z>>2]=w;s=w;u=p;c[s>>2]=c[u>>2];c[s+4>>2]=c[u+4>>2];c[s+8>>2]=c[u+8>>2];c[s+12>>2]=c[u+12>>2];c[s+16>>2]=c[u+16>>2];c[s+20>>2]=c[u+20>>2];c[s+24>>2]=c[u+24>>2];c[s+28>>2]=c[u+28>>2];c[p+28>>2]=0;c[o>>2]=0;x=p;break L1083}}while(0);kY(m|0,0,124);v=e+12|0;u=c[e+28>>2]|0;s=0;A=1;B=0;C=1;while(1){if((A|0)>(u|0)){if((C|0)>(u|0)){E=B;break}else{F=u}}else{F=A}if((C|0)>(F|0)){G=C;H=0}else{I=c[v>>2]|0;J=C;K=0;while(1){L=((c[I+(J-1<<4)+8>>2]|0)!=0)+K|0;M=J+1|0;if((M|0)>(F|0)){G=M;H=L;break}else{J=M;K=L}}}K=l+(s<<2)|0;c[K>>2]=(c[K>>2]|0)+H;K=H+B|0;J=s+1|0;if((J|0)<31){s=J;A=A<<1;B=K;C=G}else{E=K;break}}C=k;B=0;A=1<<(d[e+7|0]|0);s=0;L1108:while(1){v=A;while(1){N=v-1|0;if((v|0)==0){break L1108}O=c[t>>2]|0;if((c[O+(N<<5)+8>>2]|0)==0){v=N}else{break}}do{if((c[O+(N<<5)+24>>2]|0)==3){r=+h[O+(N<<5)+16>>3];h[k>>3]=r+6755399441055744.0;v=c[C>>2]|0;if(+(v|0)!=r){P=0;break}if((v-1|0)>>>0>=1073741824){P=0;break}u=l+((gR(v)|0)<<2)|0;c[u>>2]=(c[u>>2]|0)+1;P=1}else{P=0}}while(0);B=B+1|0;A=N;s=P+s|0}A=s+E|0;do{if((c[n>>2]|0)==3){r=+h[f>>3];h[j>>3]=r+6755399441055744.0;C=c[j>>2]|0;if(+(C|0)!=r){Q=0;break}if((C-1|0)>>>0>=1073741824){Q=0;break}t=l+((gR(C)|0)<<2)|0;c[t>>2]=(c[t>>2]|0)+1;Q=1}else{Q=0}}while(0);s=A+Q|0;L1125:do{if((s|0)>0){t=0;C=1;u=0;v=0;K=0;J=0;while(1){I=c[l+(t<<2)>>2]|0;if((I|0)>0){L=I+u|0;I=(L|0)>(J|0);R=I?C:K;S=I?L:v;T=L}else{R=K;S=v;T=u}if((T|0)==(s|0)){U=R;V=S;break L1125}L=C<<1;I=(L|0)/2|0;if((I|0)<(s|0)){t=t+1|0;C=L;u=T;v=S;K=R;J=I}else{U=R;V=S;break}}}else{U=0;V=0}}while(0);h4(b,e,U,E+1+B-V|0);s=ig(e,f)|0;if((s|0)!=1296){W=s;i=g;return W|0}W=ib(b,e,f)|0;i=g;return W|0}else{x=p}}while(0);p=f;V=x+16|0;E=c[p+4>>2]|0;c[V>>2]=c[p>>2];c[V+4>>2]=E;c[x+24>>2]=c[n>>2];do{if((c[n>>2]&64|0)!=0){if((a[(c[f>>2]|0)+5|0]&3)==0){break}if((a[e+5|0]&4)==0){break}fj(b,e)}}while(0);W=x|0;i=g;return W|0}function ic(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+8|0;g=f|0;switch(c[e+8>>2]&63|0){case 22:{j=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])-1|1)>>>0)|0)<<5)|0;i=f;return j|0};case 1:{j=(c[b+16>>2]|0)+(((1<<d[b+7|0])-1&c[e>>2])<<5)|0;i=f;return j|0};case 2:{j=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])-1|1)>>>0)|0)<<5)|0;i=f;return j|0};case 20:{k=e;l=c[k>>2]|0;m=l+6|0;if((a[m]|0)==0){n=l+8|0;c[n>>2]=hF(l+16|0,c[l+12>>2]|0,c[n>>2]|0)|0;a[m]=1;o=c[k>>2]|0}else{o=l}j=(c[b+16>>2]|0)+(((1<<d[b+7|0])-1&c[o+8>>2])<<5)|0;i=f;return j|0};case 4:{j=(c[b+16>>2]|0)+(((1<<d[b+7|0])-1&c[(c[e>>2]|0)+8>>2])<<5)|0;i=f;return j|0};case 3:{h[g>>3]=+h[e>>3]+1.0;o=(c[g+4>>2]|0)+(c[g>>2]|0)|0;if((o|0)<0){g=-o|0;p=(o|0)==(g|0)?0:g}else{p=o}j=(c[b+16>>2]|0)+(((p|0)%((1<<d[b+7|0])-1|1|0)|0)<<5)|0;i=f;return j|0};default:{j=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])-1|1)>>>0)|0)<<5)|0;i=f;return j|0}}return 0}function id(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0.0,l=0,m=0;e=i;i=i+8|0;f=e|0;g=b-1|0;if(g>>>0<(c[a+28>>2]|0)>>>0){j=(c[a+12>>2]|0)+(g<<4)|0;i=e;return j|0}k=+(b|0);h[f>>3]=k+1.0;b=(c[f+4>>2]|0)+(c[f>>2]|0)|0;if((b|0)<0){f=-b|0;l=(b|0)==(f|0)?0:f}else{l=b}b=(c[a+16>>2]|0)+(((l|0)%((1<<(d[a+7|0]|0))-1|1|0)|0)<<5)|0;while(1){if((c[b+24>>2]|0)==3){if(+h[b+16>>3]==k){break}}a=c[b+28>>2]|0;if((a|0)==0){j=1296;m=892;break}else{b=a}}if((m|0)==892){i=e;return j|0}j=b|0;i=e;return j|0}function ie(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;e=(c[a+16>>2]|0)+(((1<<(d[a+7|0]|0))-1&c[b+8>>2])<<5)|0;while(1){if((c[e+24>>2]|0)==68){if((c[e+16>>2]|0)==(b|0)){break}}a=c[e+28>>2]|0;if((a|0)==0){f=1296;g=900;break}else{e=a}}if((g|0)==900){return f|0}f=e|0;return f|0}function ig(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0.0,m=0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0;e=i;i=i+16|0;f=e|0;g=e+8|0;j=b+8|0;k=c[j>>2]&63;do{if((k|0)==3){l=+h[b>>3];h[g>>3]=l+6755399441055744.0;m=c[g>>2]|0;n=+(m|0);if(n!=l){break}o=m-1|0;if(o>>>0<(c[a+28>>2]|0)>>>0){p=(c[a+12>>2]|0)+(o<<4)|0;i=e;return p|0}h[f>>3]=n+1.0;o=(c[f+4>>2]|0)+(c[f>>2]|0)|0;if((o|0)<0){m=-o|0;q=(o|0)==(m|0)?0:m}else{q=o}o=(c[a+16>>2]|0)+(((q|0)%((1<<(d[a+7|0]|0))-1|1|0)|0)<<5)|0;while(1){if((c[o+24>>2]|0)==3){if(+h[o+16>>3]==n){break}}m=c[o+28>>2]|0;if((m|0)==0){p=1296;r=925;break}else{o=m}}if((r|0)==925){i=e;return p|0}p=o|0;i=e;return p|0}else if((k|0)==0){p=1296;i=e;return p|0}else if((k|0)==4){m=c[b>>2]|0;s=(c[a+16>>2]|0)+(((1<<(d[a+7|0]|0))-1&c[m+8>>2])<<5)|0;while(1){if((c[s+24>>2]|0)==68){if((c[s+16>>2]|0)==(m|0)){break}}t=c[s+28>>2]|0;if((t|0)==0){p=1296;r=927;break}else{s=t}}if((r|0)==927){i=e;return p|0}p=s|0;i=e;return p|0}}while(0);k=ic(a,b)|0;while(1){if((c[k+24>>2]|0)==(c[j>>2]|0)){if((iG(0,k+16|0,b)|0)!=0){break}}a=c[k+28>>2]|0;if((a|0)==0){p=1296;r=928;break}else{k=a}}if((r|0)==928){i=e;return p|0}p=k|0;i=e;return p|0}function ih(a){a=a|0;var b=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=i;i=i+24|0;e=b|0;f=b+8|0;g=b+16|0;j=a+28|0;k=c[j>>2]|0;do{if((k|0)!=0){l=c[a+12>>2]|0;if((c[l+(k-1<<4)+8>>2]|0)!=0){break}if(k>>>0>1){m=k;n=0}else{o=0;i=b;return o|0}while(1){p=(n+m|0)>>>1;q=(c[l+(p-1<<4)+8>>2]|0)==0;r=q?p:m;s=q?n:p;if((r-s|0)>>>0>1){m=r;n=s}else{o=s;break}}i=b;return o|0}}while(0);n=a+16|0;if((c[n>>2]|0)==1976){o=k;i=b;return o|0}m=a+12|0;l=a+7|0;a=g;s=g+4|0;r=k;p=k+1|0;q=k;while(1){k=p-1|0;L1249:do{if(k>>>0<q>>>0){t=(c[m>>2]|0)+(k<<4)|0}else{u=+(p|0);h[g>>3]=u+1.0;v=(c[s>>2]|0)+(c[a>>2]|0)|0;if((v|0)<0){w=-v|0;x=(v|0)==(w|0)?0:w}else{x=v}v=(c[n>>2]|0)+(((x|0)%((1<<(d[l]|0))-1|1|0)|0)<<5)|0;while(1){if((c[v+24>>2]|0)==3){if(+h[v+16>>3]==u){break}}w=c[v+28>>2]|0;if((w|0)==0){t=1296;break L1249}else{v=w}}t=v|0}}while(0);if((c[t+8>>2]|0)==0){break}k=p<<1;if(k>>>0>2147483645){y=952;break}r=p;p=k;q=c[j>>2]|0}if((y|0)==952){y=e;q=e+4|0;t=1;while(1){x=t-1|0;L1268:do{if(x>>>0<(c[j>>2]|0)>>>0){z=(c[m>>2]|0)+(x<<4)|0}else{u=+(t|0);h[e>>3]=u+1.0;a=(c[q>>2]|0)+(c[y>>2]|0)|0;if((a|0)<0){s=-a|0;A=(a|0)==(s|0)?0:s}else{A=a}a=(c[n>>2]|0)+(((A|0)%((1<<(d[l]|0))-1|1|0)|0)<<5)|0;while(1){if((c[a+24>>2]|0)==3){if(+h[a+16>>3]==u){break}}s=c[a+28>>2]|0;if((s|0)==0){z=1296;break L1268}else{a=s}}z=a|0}}while(0);if((c[z+8>>2]|0)==0){o=x;break}t=t+1|0}i=b;return o|0}if((p-r|0)>>>0<=1){o=r;i=b;return o|0}t=f;z=f+4|0;A=p;p=r;while(1){r=(A+p|0)>>>1;y=r-1|0;L1289:do{if(y>>>0<(c[j>>2]|0)>>>0){B=(c[m>>2]|0)+(y<<4)|0}else{u=+(r|0);h[f>>3]=u+1.0;q=(c[z>>2]|0)+(c[t>>2]|0)|0;if((q|0)<0){e=-q|0;C=(q|0)==(e|0)?0:e}else{C=q}q=(c[n>>2]|0)+(((C|0)%((1<<(d[l]|0))-1|1|0)|0)<<5)|0;while(1){if((c[q+24>>2]|0)==3){if(+h[q+16>>3]==u){break}}e=c[q+28>>2]|0;if((e|0)==0){B=1296;break L1289}else{q=e}}B=q|0}}while(0);y=(c[B+8>>2]|0)==0;x=y?r:A;a=y?p:r;if((x-a|0)>>>0>1){A=x;p=a}else{o=a;break}}i=b;return o|0}function ii(a){a=a|0;dn(a,0,7);et(a,24,0);dk(a,-1,4584);dr(a,4584);return 1}function ij(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+1048|0;d=b|0;e=b+1040|0;f=d$(a,2,12136,e)|0;d2(a,1,5);g=d8(a,3,1)|0;if((cS(a,4)|0)<1){h=eo(a,1)|0}else{h=d6(a,4)|0}ef(a,d);do{if((g|0)<(h|0)){j=g;do{dm(a,1,j);if((cW(a,-1)|0)==0){k=cT(a,cS(a,-1)|0)|0;dR(a,10952,(l=i,i=i+16|0,c[l>>2]=k,c[l+8>>2]=j,l)|0)|0;i=l}ee(d);ea(d,f,c[e>>2]|0);j=j+1|0;}while((j|0)<(h|0))}else{if((g|0)==(h|0)){break}ec(d);i=b;return 1}}while(0);dm(a,1,h);if((cW(a,-1)|0)==0){g=cT(a,cS(a,-1)|0)|0;dR(a,10952,(l=i,i=i+16|0,c[l>>2]=g,c[l+8>>2]=h,l)|0)|0;i=l}ee(d);ec(d);i=b;return 1}function ik(a){a=a|0;var b=0.0,c=0.0,d=0.0;d2(a,1,5);c6(a);L1323:do{if((dH(a,1)|0)==0){b=0.0}else{c=0.0;while(1){while(1){cM(a,-2);if((cS(a,-1)|0)==3){d=+cZ(a,-1,0);if(d>c){break}}if((dH(a,1)|0)==0){b=c;break L1323}}if((dH(a,1)|0)==0){b=d;break}else{c=d}}}}while(0);c7(a,b);return 1}function il(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;d2(a,1,5);d=(eo(a,1)|0)+1|0;e=cL(a)|0;if((e|0)==3){f=1004}else if((e|0)==2){g=d}else{e=dR(a,11272,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;j=e;i=b;return j|0}do{if((f|0)==1004){e=d6(a,2)|0;if((e|0)<1|(e|0)>(d|0)){dQ(a,2,2640)|0}if((d|0)>(e|0)){k=d}else{g=e;break}while(1){h=k-1|0;dm(a,1,h);dv(a,1,k);if((h|0)>(e|0)){k=h}else{g=e;break}}}}while(0);dv(a,1,g);j=0;i=b;return j|0}function im(a){a=a|0;var b=0,c=0;b=cL(a)|0;dn(a,b,1);c8(a,b);dt(a,-2,11552);if((b|0)<=0){return 1}cR(a,1);dv(a,-2,1);cP(a,1);if((b|0)>1){c=b}else{return 1}do{dv(a,1,c);c=c-1|0;}while((c|0)>1);return 1}function io(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;d2(a,1,5);d=d8(a,2,1)|0;if((cS(a,3)|0)<1){e=eo(a,1)|0}else{e=d6(a,3)|0}if((d|0)>(e|0)){f=0;i=b;return f|0}g=e-d|0;h=g+1|0;do{if((g|0)>=0){if((cF(a,h)|0)==0){break}dm(a,1,d);if((d|0)<(e|0)){j=d}else{f=h;i=b;return f|0}while(1){k=j+1|0;dm(a,1,k);if((k|0)<(e|0)){j=k}else{f=h;break}}i=b;return f|0}}while(0);h=dR(a,11944,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;f=h;i=b;return f|0}function ip(a){a=a|0;var b=0,c=0,d=0,e=0;d2(a,1,5);b=eo(a,1)|0;c=d8(a,2,b)|0;do{if((c|0)!=(b|0)){if(!((c|0)<1|(c|0)>(b+1|0))){break}dQ(a,1,2640)|0}}while(0);dm(a,1,c);if((c|0)<(b|0)){d=c}else{e=c;c6(a);dv(a,1,e);return 1}while(1){c=d+1|0;dm(a,1,c);dv(a,1,d);if((c|0)<(b|0)){d=c}else{e=b;break}}c6(a);dv(a,1,e);return 1}function iq(a){a=a|0;var b=0;d2(a,1,5);b=eo(a,1)|0;d1(a,40,12136);if((cS(a,2)|0)>=1){d2(a,2,6)}cM(a,2);ir(a,1,b);return 0}function ir(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;if((b|0)<(d|0)){f=b;g=d}else{i=e;return}while(1){dm(a,1,f);dm(a,1,g);if((is(a,-1,-2)|0)==0){cM(a,-3)}else{dv(a,1,f);dv(a,1,g)}d=g-f|0;if((d|0)==1){h=1070;break}b=(g+f|0)/2|0;dm(a,1,b);dm(a,1,f);do{if((is(a,-2,-1)|0)==0){cM(a,-2);dm(a,1,g);if((is(a,-1,-2)|0)==0){cM(a,-3);break}else{dv(a,1,b);dv(a,1,g);break}}else{dv(a,1,b);dv(a,1,f)}}while(0);if((d|0)==2){h=1071;break}dm(a,1,b);cR(a,-1);j=g-1|0;dm(a,1,j);dv(a,1,b);dv(a,1,j);k=j;l=f;while(1){m=l+1|0;dm(a,1,m);if((is(a,-1,-2)|0)==0){n=l;o=m}else{p=m;while(1){if((p|0)>=(g|0)){dR(a,2904,(q=i,i=i+1|0,i=i+7&-8,c[q>>2]=0,q)|0)|0;i=q}cM(a,-2);m=p+1|0;dm(a,1,m);if((is(a,-1,-2)|0)==0){n=p;o=m;break}else{p=m}}}p=k-1|0;dm(a,1,p);if((is(a,-3,-1)|0)==0){r=p}else{m=p;while(1){if((m|0)<=(f|0)){dR(a,2904,(q=i,i=i+1|0,i=i+7&-8,c[q>>2]=0,q)|0)|0;i=q}cM(a,-2);p=m-1|0;dm(a,1,p);if((is(a,-3,-1)|0)==0){r=p;break}else{m=p}}}if((r|0)<(o|0)){break}dv(a,1,o);dv(a,1,r);k=r;l=o}cM(a,-4);dm(a,1,j);dm(a,1,o);dv(a,1,j);dv(a,1,o);l=(o-f|0)<(g-o|0);k=n+2|0;b=l?k:f;d=l?g:n;ir(a,l?f:k,l?n:g);if((b|0)<(d|0)){f=b;g=d}else{h=1069;break}}if((h|0)==1069){i=e;return}else if((h|0)==1070){i=e;return}else if((h|0)==1071){i=e;return}}function is(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((cS(a,2)|0)==0){d=cY(a,b,c,1)|0;return d|0}else{cR(a,2);cR(a,b-1|0);cR(a,c-2|0);dz(a,2,1,0,0);c=c0(a,-1)|0;cM(a,-2);d=c;return d|0}return 0}function it(b){b=b|0;var d=0,e=0,f=0;d=b+12|0;e=0;do{f=hI(b,c[1184+(e<<2)>>2]|0)|0;c[(c[d>>2]|0)+184+(e<<2)>>2]=f;f=(c[(c[d>>2]|0)+184+(e<<2)>>2]|0)+5|0;a[f]=a[f]|32;e=e+1|0;}while((e|0)<17);return}function iu(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;g=ie(b,f)|0;if((c[g+8>>2]|0)!=0){h=g;return h|0}g=b+6|0;a[g]=(d[g]|0|1<<e)&255;h=0;return h|0}function iv(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=c[b+8>>2]&15;if((e|0)==5){f=c[(c[b>>2]|0)+8>>2]|0}else if((e|0)==7){f=c[(c[b>>2]|0)+8>>2]|0}else{f=c[(c[a+12>>2]|0)+252+(e<<2)>>2]|0}if((f|0)==0){g=1296;return g|0}g=ie(f,c[(c[a+12>>2]|0)+184+(d<<2)>>2]|0)|0;return g|0}function iw(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+64|0;h=g|0;j=g+24|0;k=g+48|0;l=a[f]|0;if((l<<24>>24|0)==27){c[k+12>>2]=10544}else if((l<<24>>24|0)==64|(l<<24>>24|0)==61){c[k+12>>2]=f+1}else{c[k+12>>2]=f}c[k>>2]=b;c[k+4>>2]=d;c[k+8>>2]=e;e=h|0;f=j|0;c[h>>2]=1635077147;a[h+4|0]=82;a[h+5|0]=0;a[h+6|0]=1;a[h+7|0]=4;a[h+8|0]=4;a[h+9|0]=4;a[h+10|0]=8;l=h+12|0;a[h+11|0]=0;a[l]=a[4976]|0;a[l+1|0]=a[4977]|0;a[l+2|0]=a[4978]|0;a[l+3|0]=a[4979]|0;a[l+4|0]=a[4980]|0;a[l+5|0]=a[4981]|0;a[f]=27;if((iP(d,j+1|0,17)|0)!=0){iz(k,4024);return 0}if((kZ(e|0,f|0,18)|0)==0){j=e9(b,1)|0;d=b+8|0;l=c[d>>2]|0;c[l>>2]=j;c[l+8>>2]=70;l=(c[d>>2]|0)+16|0;c[d>>2]=l;if(((c[b+24>>2]|0)-l|0)<16){eU(b,0)}l=fe(b)|0;h=j+12|0;c[h>>2]=l;ix(k,l);l=c[h>>2]|0;h=c[l+40>>2]|0;if((h|0)==1){m=j;i=g;return m|0}j=e9(b,h)|0;c[j+12>>2]=l;l=c[d>>2]|0;c[l-16>>2]=j;c[l-16+8>>2]=70;m=j;i=g;return m|0}if((kZ(e|0,f|0,4)|0)!=0){iz(k,2888);return 0}if((kZ(e|0,f|0,6)|0)!=0){iz(k,2608);return 0}if((kZ(e|0,f|0,12)|0)==0){iz(k,3256);return 0}else{iz(k,11920);return 0}return 0}function ix(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;f=i;i=i+184|0;g=f|0;j=f+8|0;k=f+16|0;l=f+24|0;m=f+32|0;n=f+40|0;o=f+48|0;p=f+56|0;q=f+64|0;r=f+72|0;s=f+80|0;t=f+88|0;u=f+96|0;v=f+104|0;w=f+112|0;x=f+120|0;y=f+128|0;z=f+136|0;A=f+144|0;B=f+152|0;C=f+160|0;D=f+168|0;E=f+176|0;F=b+4|0;if((iP(c[F>>2]|0,w,4)|0)!=0){iz(b,4024)}G=c[w>>2]|0;if((G|0)<0){iz(b,3256)}c[e+64>>2]=G;if((iP(c[F>>2]|0,v,4)|0)!=0){iz(b,4024)}G=c[v>>2]|0;if((G|0)<0){iz(b,3256)}c[e+68>>2]=G;if((iP(c[F>>2]|0,u,1)|0)!=0){iz(b,4024)}a[e+76|0]=a[u]|0;if((iP(c[F>>2]|0,t,1)|0)!=0){iz(b,4024)}a[e+77|0]=a[t]|0;if((iP(c[F>>2]|0,s,1)|0)!=0){iz(b,4024)}a[e+78|0]=a[s]|0;if((iP(c[F>>2]|0,r,4)|0)!=0){iz(b,4024)}s=c[r>>2]|0;if((s|0)<0){iz(b,3256)}r=b|0;t=c[r>>2]|0;if((s+1|0)>>>0>1073741823){gy(t)}u=s<<2;G=gz(t,0,0,u)|0;c[e+12>>2]=G;c[e+48>>2]=s;if((iP(c[F>>2]|0,G,u)|0)!=0){iz(b,4024)}if((iP(c[F>>2]|0,n,4)|0)!=0){iz(b,4024)}u=c[n>>2]|0;if((u|0)<0){iz(b,3256)}n=c[r>>2]|0;if((u+1|0)>>>0>268435455){gy(n)}G=gz(n,0,0,u<<4)|0;n=e+8|0;c[n>>2]=G;c[e+44>>2]=u;s=(u|0)>0;L1523:do{if(s){t=0;v=G;while(1){c[v+(t<<4)+8>>2]=0;w=t+1|0;if((w|0)>=(u|0)){break}t=w;v=c[n>>2]|0}if(!s){break}v=k;t=j;w=b+8|0;H=0;while(1){I=c[n>>2]|0;J=I+(H<<4)|0;if((iP(c[F>>2]|0,m,1)|0)!=0){K=1151;break}L=a[m]|0;if((L|0)==4){if((iP(c[F>>2]|0,t,4)|0)!=0){K=1161;break}M=c[j>>2]|0;if((M|0)==0){N=0}else{O=iQ(c[r>>2]|0,c[w>>2]|0,M)|0;if((iP(c[F>>2]|0,O,c[j>>2]|0)|0)!=0){K=1164;break}N=hH(c[r>>2]|0,O,(c[j>>2]|0)-1|0)|0}c[J>>2]=N;c[I+(H<<4)+8>>2]=d[N+4|0]|64}else if((L|0)==1){if((iP(c[F>>2]|0,l,1)|0)!=0){K=1155;break}c[J>>2]=a[l]|0;c[I+(H<<4)+8>>2]=1}else if((L|0)==0){c[I+(H<<4)+8>>2]=0}else if((L|0)==3){if((iP(c[F>>2]|0,v,8)|0)!=0){K=1158;break}h[J>>3]=+h[k>>3];c[I+(H<<4)+8>>2]=3}H=H+1|0;if((H|0)>=(u|0)){break L1523}}if((K|0)==1161){iz(b,4024)}else if((K|0)==1155){iz(b,4024)}else if((K|0)==1151){iz(b,4024)}else if((K|0)==1164){iz(b,4024)}else if((K|0)==1158){iz(b,4024)}}}while(0);if((iP(c[F>>2]|0,g,4)|0)!=0){iz(b,4024)}u=c[g>>2]|0;if((u|0)<0){iz(b,3256)}g=c[r>>2]|0;if((u+1|0)>>>0>1073741823){gy(g)}k=gz(g,0,0,u<<2)|0;g=e+16|0;c[g>>2]=k;c[e+56>>2]=u;l=(u|0)>0;do{if(l){N=0;j=k;while(1){c[j+(N<<2)>>2]=0;m=N+1|0;if((m|0)>=(u|0)){break}N=m;j=c[g>>2]|0}if(l){P=0}else{break}do{j=fe(c[r>>2]|0)|0;c[(c[g>>2]|0)+(P<<2)>>2]=j;ix(b,c[(c[g>>2]|0)+(P<<2)>>2]|0);P=P+1|0;}while((P|0)<(u|0))}}while(0);if((iP(c[F>>2]|0,q,4)|0)!=0){iz(b,4024)}u=c[q>>2]|0;if((u|0)<0){iz(b,3256)}q=c[r>>2]|0;if((u+1|0)>>>0>536870911){gy(q)}P=gz(q,0,0,u<<3)|0;q=e+28|0;c[q>>2]=P;c[e+40>>2]=u;L1578:do{if((u|0)>0){c[P>>2]=0;if((u|0)>1){g=1;while(1){c[(c[q>>2]|0)+(g<<3)>>2]=0;l=g+1|0;if((l|0)<(u|0)){g=l}else{Q=0;break}}}else{Q=0}while(1){if((iP(c[F>>2]|0,p,1)|0)!=0){K=1189;break}a[(c[q>>2]|0)+(Q<<3)+4|0]=a[p]|0;if((iP(c[F>>2]|0,o,1)|0)!=0){K=1191;break}a[(c[q>>2]|0)+(Q<<3)+5|0]=a[o]|0;Q=Q+1|0;if((Q|0)>=(u|0)){break L1578}}if((K|0)==1189){iz(b,4024)}else if((K|0)==1191){iz(b,4024)}}}while(0);if((iP(c[F>>2]|0,E,4)|0)!=0){iz(b,4024)}u=c[E>>2]|0;do{if((u|0)==0){R=0}else{Q=iQ(c[r>>2]|0,c[b+8>>2]|0,u)|0;if((iP(c[F>>2]|0,Q,c[E>>2]|0)|0)==0){R=hH(c[r>>2]|0,Q,(c[E>>2]|0)-1|0)|0;break}else{iz(b,4024)}}}while(0);c[e+36>>2]=R;if((iP(c[F>>2]|0,D,4)|0)!=0){iz(b,4024)}R=c[D>>2]|0;if((R|0)<0){iz(b,3256)}D=c[r>>2]|0;if((R+1|0)>>>0>1073741823){gy(D)}E=R<<2;u=gz(D,0,0,E)|0;c[e+20>>2]=u;c[e+52>>2]=R;if((iP(c[F>>2]|0,u,E)|0)!=0){iz(b,4024)}if((iP(c[F>>2]|0,C,4)|0)!=0){iz(b,4024)}E=c[C>>2]|0;if((E|0)<0){iz(b,3256)}C=c[r>>2]|0;if((E+1|0)>>>0>357913941){gy(C)}u=gz(C,0,0,E*12|0)|0;C=e+24|0;c[C>>2]=u;c[e+60>>2]=E;L1621:do{if((E|0)>0){c[u>>2]=0;if((E|0)>1){e=1;do{c[(c[C>>2]|0)+(e*12|0)>>2]=0;e=e+1|0;}while((e|0)<(E|0))}e=B;R=A;D=z;Q=b+8|0;o=0;while(1){if((iP(c[F>>2]|0,e,4)|0)!=0){K=1218;break}p=c[B>>2]|0;if((p|0)==0){S=0}else{P=iQ(c[r>>2]|0,c[Q>>2]|0,p)|0;if((iP(c[F>>2]|0,P,c[B>>2]|0)|0)!=0){K=1221;break}S=hH(c[r>>2]|0,P,(c[B>>2]|0)-1|0)|0}c[(c[C>>2]|0)+(o*12|0)>>2]=S;if((iP(c[F>>2]|0,R,4)|0)!=0){K=1224;break}P=c[A>>2]|0;if((P|0)<0){K=1226;break}c[(c[C>>2]|0)+(o*12|0)+4>>2]=P;if((iP(c[F>>2]|0,D,4)|0)!=0){K=1228;break}P=c[z>>2]|0;if((P|0)<0){K=1230;break}c[(c[C>>2]|0)+(o*12|0)+8>>2]=P;o=o+1|0;if((o|0)>=(E|0)){break L1621}}if((K|0)==1218){iz(b,4024)}else if((K|0)==1221){iz(b,4024)}else if((K|0)==1224){iz(b,4024)}else if((K|0)==1226){iz(b,3256)}else if((K|0)==1228){iz(b,4024)}else if((K|0)==1230){iz(b,3256)}}}while(0);if((iP(c[F>>2]|0,y,4)|0)!=0){iz(b,4024)}E=c[y>>2]|0;if((E|0)<0){iz(b,3256)}if((E|0)<=0){i=f;return}y=x;C=b+8|0;z=0;while(1){if((iP(c[F>>2]|0,y,4)|0)!=0){K=1239;break}A=c[x>>2]|0;if((A|0)==0){T=0}else{S=iQ(c[r>>2]|0,c[C>>2]|0,A)|0;if((iP(c[F>>2]|0,S,c[x>>2]|0)|0)!=0){K=1242;break}T=hH(c[r>>2]|0,S,(c[x>>2]|0)-1|0)|0}c[(c[q>>2]|0)+(z<<3)>>2]=T;S=z+1|0;if((S|0)<(E|0)){z=S}else{K=1247;break}}if((K|0)==1239){iz(b,4024)}else if((K|0)==1242){iz(b,4024)}else if((K|0)==1247){i=f;return}}function iy(b){b=b|0;var c=0;c=b;w=1635077147;a[c]=w&255;w=w>>8;a[c+1|0]=w&255;w=w>>8;a[c+2|0]=w&255;w=w>>8;a[c+3|0]=w&255;a[b+4|0]=82;a[b+5|0]=0;a[b+6|0]=1;a[b+7|0]=4;a[b+8|0]=4;a[b+9|0]=4;a[b+10|0]=8;c=b+12|0;a[b+11|0]=0;a[c]=a[4976]|0;a[c+1|0]=a[4977]|0;a[c+2|0]=a[4978]|0;a[c+3|0]=a[4979]|0;a[c+4|0]=a[4980]|0;a[c+5|0]=a[4981]|0;return}function iz(a,b){a=a|0;b=b|0;var d=0,e=0;d=a|0;gW(c[d>>2]|0,3704,(e=i,i=i+16|0,c[e>>2]=c[a+12>>2],c[e+8>>2]=b,e)|0)|0;i=e;eR(c[d>>2]|0,3)}function iA(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0;d=i;i=i+8|0;e=d|0;f=c[a+8>>2]|0;do{if((f|0)==3){g=a}else{if((f&15|0)!=4){g=0;break}j=c[a>>2]|0;if((gU(j+16|0,c[j+12>>2]|0,e)|0)==0){g=0;break}h[b>>3]=+h[e>>3];c[b+8>>2]=3;g=b}}while(0);i=d;return g|0}function iB(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0;e=i;i=i+32|0;f=b+8|0;if((c[f>>2]|0)!=3){g=0;i=e;return g|0}j=e|0;k=a$(j|0,4064,(l=i,i=i+8|0,h[l>>3]=+h[b>>3],l)|0)|0;i=l;l=hH(a,j,k)|0;c[b>>2]=l;c[f>>2]=d[l+4|0]|0|64;g=1;i=e;return g|0}function iC(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;h=b+12|0;j=d;d=0;while(1){if((d|0)>=100){k=1273;break}l=j+8|0;if((c[l>>2]|0)==69){m=c[j>>2]|0;n=ig(m,e)|0;o=n+8|0;if((c[o>>2]|0)!=0){k=1268;break}p=c[m+8>>2]|0;if((p|0)==0){k=1268;break}if((a[p+6|0]&1)!=0){k=1268;break}m=iu(p,0,c[(c[h>>2]|0)+184>>2]|0)|0;if((m|0)==0){k=1268;break}q=m;r=c[m+8>>2]|0}else{m=iv(b,j,0)|0;p=c[m+8>>2]|0;if((p|0)==0){k=1270;break}else{q=m;r=p}}if((r&15|0)==6){k=1272;break}else{j=q;d=d+1|0}}if((k|0)==1272){d=b+28|0;r=f-(c[d>>2]|0)|0;h=b+8|0;p=c[h>>2]|0;c[h>>2]=p+16;m=q;s=p;t=c[m+4>>2]|0;c[s>>2]=c[m>>2];c[s+4>>2]=t;c[p+8>>2]=c[q+8>>2];q=c[h>>2]|0;c[h>>2]=q+16;p=j;t=q;s=c[p+4>>2]|0;c[t>>2]=c[p>>2];c[t+4>>2]=s;c[q+8>>2]=c[l>>2];l=c[h>>2]|0;c[h>>2]=l+16;q=e;s=l;t=c[q+4>>2]|0;c[s>>2]=c[q>>2];c[s+4>>2]=t;c[l+8>>2]=c[e+8>>2];eZ(b,(c[h>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);e=c[d>>2]|0;d=c[h>>2]|0;l=d-16|0;c[h>>2]=l;h=l;l=e+r|0;t=c[h+4>>2]|0;c[l>>2]=c[h>>2];c[l+4>>2]=t;c[e+(r+8)>>2]=c[d-16+8>>2];i=g;return}else if((k|0)==1270){eK(b,j,10504)}else if((k|0)==1273){eM(b,8296,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b}else if((k|0)==1268){k=n;n=f;b=c[k+4>>2]|0;c[n>>2]=c[k>>2];c[n+4>>2]=b;c[f+8>>2]=c[o>>2];i=g;return}}function iD(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;h=b+12|0;j=d;d=0;while(1){if((d|0)>=100){k=1295;break}l=j+8|0;if((c[l>>2]|0)==69){m=c[j>>2]|0;n=m;o=ig(n,e)|0;if((c[o+8>>2]|0)!=0){p=o;break}q=c[m+8>>2]|0;if((q|0)==0){k=1285;break}if((a[q+6|0]&2)!=0){k=1285;break}r=iu(q,1,c[(c[h>>2]|0)+188>>2]|0)|0;if((r|0)==0){k=1285;break}s=r;t=c[r+8>>2]|0}else{r=iv(b,j,1)|0;q=c[r+8>>2]|0;if((q|0)==0){k=1292;break}else{s=r;t=q}}if((t&15|0)==6){k=1294;break}else{j=s;d=d+1|0}}do{if((k|0)==1295){eM(b,6456,(d=i,i=i+1|0,i=i+7&-8,c[d>>2]=0,d)|0);i=d}else if((k|0)==1294){d=b+8|0;t=c[d>>2]|0;c[d>>2]=t+16;h=s;q=t;r=c[h+4>>2]|0;c[q>>2]=c[h>>2];c[q+4>>2]=r;c[t+8>>2]=c[s+8>>2];t=c[d>>2]|0;c[d>>2]=t+16;r=j;q=t;h=c[r+4>>2]|0;c[q>>2]=c[r>>2];c[q+4>>2]=h;c[t+8>>2]=c[l>>2];t=c[d>>2]|0;c[d>>2]=t+16;h=e;q=t;r=c[h+4>>2]|0;c[q>>2]=c[h>>2];c[q+4>>2]=r;c[t+8>>2]=c[e+8>>2];t=c[d>>2]|0;c[d>>2]=t+16;r=f;q=t;h=c[r+4>>2]|0;c[q>>2]=c[r>>2];c[q+4>>2]=h;c[t+8>>2]=c[f+8>>2];eZ(b,(c[d>>2]|0)-64|0,0,a[(c[b+16>>2]|0)+18|0]&1);i=g;return}else if((k|0)==1285){if((o|0)!=1296){p=o;break}p=ib(b,n,e)|0}else if((k|0)==1292){eK(b,j,10504)}}while(0);j=f;k=p;e=c[j+4>>2]|0;c[k>>2]=c[j>>2];c[k+4>>2]=e;e=f+8|0;c[p+8>>2]=c[e>>2];a[m+6|0]=0;if((c[e>>2]&64|0)==0){i=g;return}if((a[(c[f>>2]|0)+5|0]&3)==0){i=g;return}if((a[m+5|0]&4)==0){i=g;return}fj(b,m);i=g;return}function iE(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=d+8|0;g=c[f>>2]|0;do{if((g|0)==3){if((c[e+8>>2]|0)!=3){break}i=+h[d>>3]<+h[e>>3]|0;return i|0}else{if((g&15|0)!=4){break}if((c[e+8>>2]&15|0)!=4){break}j=c[d>>2]|0;k=c[e>>2]|0;l=j+16|0;m=k+16|0;n=aJ(l|0,m|0)|0;L1736:do{if((n|0)==0){o=l;p=c[j+12>>2]|0;q=m;r=c[k+12>>2]|0;while(1){s=kU(o|0)|0;t=(s|0)==(p|0);if((s|0)==(r|0)){break}if(t){u=-1;break L1736}v=s+1|0;s=o+v|0;w=q+v|0;x=aJ(s|0,w|0)|0;if((x|0)==0){o=s;p=p-v|0;q=w;r=r-v|0}else{u=x;break L1736}}u=t&1^1}else{u=n}}while(0);i=u>>>31;return i|0}}while(0);u=b+8|0;t=c[u>>2]|0;g=iv(b,d,13)|0;do{if((c[g+8>>2]|0)==0){n=iv(b,e,13)|0;if((c[n+8>>2]|0)!=0){y=n;break}eP(b,d,e);return 0}else{y=g}}while(0);g=b+28|0;n=t-(c[g>>2]|0)|0;t=c[u>>2]|0;c[u>>2]=t+16;k=y;m=t;j=c[k+4>>2]|0;c[m>>2]=c[k>>2];c[m+4>>2]=j;c[t+8>>2]=c[y+8>>2];y=c[u>>2]|0;c[u>>2]=y+16;t=d;d=y;j=c[t+4>>2]|0;c[d>>2]=c[t>>2];c[d+4>>2]=j;c[y+8>>2]=c[f>>2];f=c[u>>2]|0;c[u>>2]=f+16;y=e;j=f;d=c[y+4>>2]|0;c[j>>2]=c[y>>2];c[j+4>>2]=d;c[f+8>>2]=c[e+8>>2];eZ(b,(c[u>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[g>>2]|0;g=c[u>>2]|0;e=g-16|0;c[u>>2]=e;f=e;e=b+n|0;d=c[f+4>>2]|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;c[b+(n+8)>>2]=c[g-16+8>>2];g=c[u>>2]|0;u=c[g+8>>2]|0;if((u|0)==0){i=0;return i|0}if((u|0)!=1){i=1;return i|0}i=(c[g>>2]|0)!=0|0;return i|0}function iF(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=d+8|0;g=c[f>>2]|0;do{if((g|0)==3){if((c[e+8>>2]|0)!=3){break}i=+h[d>>3]<=+h[e>>3]|0;return i|0}else{if((g&15|0)!=4){break}if((c[e+8>>2]&15|0)!=4){break}j=c[d>>2]|0;k=c[e>>2]|0;l=j+16|0;m=k+16|0;n=aJ(l|0,m|0)|0;L1765:do{if((n|0)==0){o=l;p=c[j+12>>2]|0;q=m;r=c[k+12>>2]|0;while(1){s=kU(o|0)|0;t=(s|0)==(p|0);if((s|0)==(r|0)){break}if(t){u=-1;break L1765}v=s+1|0;s=o+v|0;w=q+v|0;x=aJ(s|0,w|0)|0;if((x|0)==0){o=s;p=p-v|0;q=w;r=r-v|0}else{u=x;break L1765}}u=t&1^1}else{u=n}}while(0);i=(u|0)<1|0;return i|0}}while(0);u=b+8|0;t=c[u>>2]|0;g=iv(b,d,14)|0;do{if((c[g+8>>2]|0)==0){n=iv(b,e,14)|0;if((c[n+8>>2]|0)!=0){y=n;break}n=c[u>>2]|0;k=iv(b,e,13)|0;do{if((c[k+8>>2]|0)==0){m=iv(b,d,13)|0;if((c[m+8>>2]|0)!=0){z=m;break}eP(b,d,e);return 0}else{z=k}}while(0);k=b+28|0;m=n-(c[k>>2]|0)|0;j=c[u>>2]|0;c[u>>2]=j+16;l=z;r=j;q=c[l+4>>2]|0;c[r>>2]=c[l>>2];c[r+4>>2]=q;c[j+8>>2]=c[z+8>>2];j=c[u>>2]|0;c[u>>2]=j+16;q=e;r=j;l=c[q+4>>2]|0;c[r>>2]=c[q>>2];c[r+4>>2]=l;c[j+8>>2]=c[e+8>>2];j=c[u>>2]|0;c[u>>2]=j+16;l=d;r=j;q=c[l+4>>2]|0;c[r>>2]=c[l>>2];c[r+4>>2]=q;c[j+8>>2]=c[f>>2];eZ(b,(c[u>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);j=c[k>>2]|0;k=c[u>>2]|0;q=k-16|0;c[u>>2]=q;r=q;q=j+m|0;l=c[r+4>>2]|0;c[q>>2]=c[r>>2];c[q+4>>2]=l;c[j+(m+8)>>2]=c[k-16+8>>2];k=c[u>>2]|0;m=c[k+8>>2]|0;if((m|0)==0){i=1;return i|0}if((m|0)!=1){i=0;return i|0}i=(c[k>>2]|0)==0|0;return i|0}else{y=g}}while(0);g=b+28|0;z=t-(c[g>>2]|0)|0;t=c[u>>2]|0;c[u>>2]=t+16;k=y;m=t;j=c[k+4>>2]|0;c[m>>2]=c[k>>2];c[m+4>>2]=j;c[t+8>>2]=c[y+8>>2];y=c[u>>2]|0;c[u>>2]=y+16;t=d;d=y;j=c[t+4>>2]|0;c[d>>2]=c[t>>2];c[d+4>>2]=j;c[y+8>>2]=c[f>>2];f=c[u>>2]|0;c[u>>2]=f+16;y=e;j=f;d=c[y+4>>2]|0;c[j>>2]=c[y>>2];c[j+4>>2]=d;c[f+8>>2]=c[e+8>>2];eZ(b,(c[u>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[g>>2]|0;g=c[u>>2]|0;e=g-16|0;c[u>>2]=e;f=e;e=b+z|0;d=c[f+4>>2]|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;c[b+(z+8)>>2]=c[g-16+8>>2];g=c[u>>2]|0;u=c[g+8>>2]|0;if((u|0)==0){i=0;return i|0}if((u|0)!=1){i=1;return i|0}i=(c[g>>2]|0)!=0|0;return i|0}function iG(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=d+8|0;L1798:do{switch(c[f>>2]&63|0){case 5:{g=c[d>>2]|0;i=c[e>>2]|0;if((g|0)==(i|0)){j=1;return j|0}if((b|0)==0){j=0;return j|0}else{k=iH(b,c[g+8>>2]|0,c[i+8>>2]|0)|0;break L1798}break};case 7:{i=c[d>>2]|0;g=c[e>>2]|0;if((i|0)==(g|0)){j=1;return j|0}if((b|0)==0){j=0;return j|0}else{k=iH(b,c[i+8>>2]|0,c[g+8>>2]|0)|0;break L1798}break};case 22:{j=(c[d>>2]|0)==(c[e>>2]|0)|0;return j|0};case 1:{j=(c[d>>2]|0)==(c[e>>2]|0)|0;return j|0};case 2:{j=(c[d>>2]|0)==(c[e>>2]|0)|0;return j|0};case 0:{j=1;return j|0};case 20:{j=hD(c[d>>2]|0,c[e>>2]|0)|0;return j|0};case 3:{j=+h[d>>3]==+h[e>>3]|0;return j|0};case 4:{j=(c[d>>2]|0)==(c[e>>2]|0)|0;return j|0};default:{j=(c[d>>2]|0)==(c[e>>2]|0)|0;return j|0}}}while(0);if((k|0)==0){j=0;return j|0}g=b+8|0;i=c[g>>2]|0;l=b+28|0;m=i-(c[l>>2]|0)|0;c[g>>2]=i+16;n=k;o=i;p=c[n+4>>2]|0;c[o>>2]=c[n>>2];c[o+4>>2]=p;c[i+8>>2]=c[k+8>>2];k=c[g>>2]|0;c[g>>2]=k+16;i=d;d=k;p=c[i+4>>2]|0;c[d>>2]=c[i>>2];c[d+4>>2]=p;c[k+8>>2]=c[f>>2];f=c[g>>2]|0;c[g>>2]=f+16;k=e;p=f;d=c[k+4>>2]|0;c[p>>2]=c[k>>2];c[p+4>>2]=d;c[f+8>>2]=c[e+8>>2];eZ(b,(c[g>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[l>>2]|0;l=c[g>>2]|0;e=l-16|0;c[g>>2]=e;f=e;e=b+m|0;d=c[f+4>>2]|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;c[b+(m+8)>>2]=c[l-16+8>>2];l=c[g>>2]|0;g=c[l+8>>2]|0;if((g|0)==0){j=0;return j|0}if((g|0)!=1){j=1;return j|0}j=(c[l>>2]|0)!=0|0;return j|0}function iH(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0;if((d|0)==0){f=0;return f|0}if((a[d+6|0]&32)!=0){f=0;return f|0}g=b+12|0;b=iu(d,5,c[(c[g>>2]|0)+204>>2]|0)|0;if((b|0)==0){f=0;return f|0}if((d|0)==(e|0)){f=b;return f|0}if((e|0)==0){f=0;return f|0}if((a[e+6|0]&32)!=0){f=0;return f|0}d=iu(e,5,c[(c[g>>2]|0)+204>>2]|0)|0;if((d|0)==0){f=0;return f|0}g=c[b+8>>2]|0;L1861:do{if((g|0)==(c[d+8>>2]|0)){switch(g&63|0){case 20:{i=hD(c[b>>2]|0,c[d>>2]|0)|0;break};case 4:{i=(c[b>>2]|0)==(c[d>>2]|0)|0;break};case 0:{f=b;return f|0};case 2:{i=(c[b>>2]|0)==(c[d>>2]|0)|0;break};case 22:{i=(c[b>>2]|0)==(c[d>>2]|0)|0;break};case 1:{i=(c[b>>2]|0)==(c[d>>2]|0)|0;break};case 7:{if((c[b>>2]|0)==(c[d>>2]|0)){f=b}else{break L1861}return f|0};case 5:{if((c[b>>2]|0)==(c[d>>2]|0)){f=b}else{break L1861}return f|0};case 3:{i=+h[b>>3]==+h[d>>3]|0;break};default:{i=(c[b>>2]|0)==(c[d>>2]|0)|0}}if((i|0)==0){break}else{f=b}return f|0}}while(0);f=0;return f|0}function iI(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+32|0;g=b+8|0;j=f|0;k=b+12|0;l=b+28|0;m=b+16|0;n=e;e=c[g>>2]|0;L1881:while(1){o=e-32|0;p=e-32+8|0;q=c[p>>2]|0;r=e-16|0;L1883:do{if((q&15|0)==4|(q|0)==3){s=e-16+8|0;t=c[s>>2]|0;if((t&15|0)==4){u=q;v=r}else{if((t|0)!=3){w=1432;break}t=a$(j|0,4064,(x=i,i=i+8|0,h[x>>3]=+h[r>>3],x)|0)|0;i=x;y=hH(b,j,t)|0;t=r;c[t>>2]=y;c[s>>2]=d[y+4|0]|0|64;u=c[p>>2]|0;v=t}t=c[(c[v>>2]|0)+12>>2]|0;y=(u&15|0)==4;if((t|0)==0){if(y){z=2;break}if((u|0)!=3){z=2;break}A=a$(j|0,4064,(x=i,i=i+8|0,h[x>>3]=+h[o>>3],x)|0)|0;i=x;B=hH(b,j,A)|0;c[o>>2]=B;c[p>>2]=d[B+4|0]|0|64;z=2;break}do{if(y){if((c[(c[o>>2]|0)+12>>2]|0)!=0){break}B=r;A=o;C=c[B+4>>2]|0;c[A>>2]=c[B>>2];c[A+4>>2]=C;c[p>>2]=c[s>>2];z=2;break L1883}}while(0);L1899:do{if((n|0)>1){s=1;y=t;while(1){C=~s;A=e+(C<<4)|0;B=e+(C<<4)+8|0;C=c[B>>2]|0;if((C&15|0)==4){D=A}else{if((C|0)!=3){E=s;F=y;break L1899}C=a$(j|0,4064,(x=i,i=i+8|0,h[x>>3]=+h[A>>3],x)|0)|0;i=x;G=hH(b,j,C)|0;C=A;c[C>>2]=G;c[B>>2]=d[G+4|0]|0|64;D=C}C=c[(c[D>>2]|0)+12>>2]|0;if(C>>>0>=(-3-y|0)>>>0){w=1449;break L1881}G=C+y|0;C=s+1|0;if((C|0)<(n|0)){s=C;y=G}else{E=C;F=G;break}}}else{E=1;F=t}}while(0);t=iQ(b,(c[k>>2]|0)+144|0,F)|0;y=0;s=E;do{G=c[e+(-s<<4)>>2]|0;C=c[G+12>>2]|0;B=t+y|0;A=G+16|0;kV(B|0,A|0,C)|0;y=C+y|0;s=s-1|0;}while((s|0)>0);s=-E|0;C=hH(b,t,y)|0;c[e+(s<<4)>>2]=C;c[e+(s<<4)+8>>2]=d[C+4|0]|0|64;z=E}else{w=1432}}while(0);if((w|0)==1432){w=0;q=iv(b,o,15)|0;if((c[q+8>>2]|0)==0){C=iv(b,r,15)|0;if((c[C+8>>2]|0)==0){w=1435;break}else{H=C}}else{H=q}q=o-(c[l>>2]|0)|0;C=c[g>>2]|0;c[g>>2]=C+16;s=H;A=C;B=c[s+4>>2]|0;c[A>>2]=c[s>>2];c[A+4>>2]=B;c[C+8>>2]=c[H+8>>2];C=c[g>>2]|0;c[g>>2]=C+16;B=o;A=C;s=c[B+4>>2]|0;c[A>>2]=c[B>>2];c[A+4>>2]=s;c[C+8>>2]=c[p>>2];C=c[g>>2]|0;c[g>>2]=C+16;s=r;A=C;B=c[s+4>>2]|0;c[A>>2]=c[s>>2];c[A+4>>2]=B;c[C+8>>2]=c[e-16+8>>2];eZ(b,(c[g>>2]|0)-48|0,1,a[(c[m>>2]|0)+18|0]&1);C=c[l>>2]|0;B=c[g>>2]|0;A=B-16|0;c[g>>2]=A;s=A;A=C+q|0;G=c[s+4>>2]|0;c[A>>2]=c[s>>2];c[A+4>>2]=G;c[C+(q+8)>>2]=c[B-16+8>>2];z=2}B=n+1-z|0;q=(c[g>>2]|0)+(1-z<<4)|0;c[g>>2]=q;if((B|0)>1){n=B;e=q}else{w=1455;break}}if((w|0)==1435){eN(b,o,r)}else if((w|0)==1455){i=f;return}else if((w|0)==1449){eM(b,4952,(x=i,i=i+1|0,i=i+7&-8,c[x>>2]=0,x)|0);i=x}}function iJ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=e+8|0;g=c[f>>2]&15;L1923:do{if((g|0)==4){h[d>>3]=+((c[(c[e>>2]|0)+12>>2]|0)>>>0>>>0);c[d+8>>2]=3;return}else if((g|0)==5){i=c[e>>2]|0;j=i;k=c[i+8>>2]|0;i=k;do{if((k|0)!=0){if((a[k+6|0]&16)!=0){break}l=iu(i,4,c[(c[b+12>>2]|0)+200>>2]|0)|0;if((l|0)!=0){m=l;break L1923}}}while(0);h[d>>3]=+(ih(j)|0);c[d+8>>2]=3;return}else{i=iv(b,e,4)|0;if((c[i+8>>2]|0)!=0){m=i;break}eK(b,e,4008)}}while(0);g=b+28|0;i=d-(c[g>>2]|0)|0;d=b+8|0;k=c[d>>2]|0;c[d>>2]=k+16;l=m;n=k;o=c[l+4>>2]|0;c[n>>2]=c[l>>2];c[n+4>>2]=o;c[k+8>>2]=c[m+8>>2];m=c[d>>2]|0;c[d>>2]=m+16;k=e;e=m;o=c[k+4>>2]|0;c[e>>2]=c[k>>2];c[e+4>>2]=o;c[m+8>>2]=c[f>>2];m=c[d>>2]|0;c[d>>2]=m+16;o=m;e=c[k+4>>2]|0;c[o>>2]=c[k>>2];c[o+4>>2]=e;c[m+8>>2]=c[f>>2];eZ(b,(c[d>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[g>>2]|0;g=c[d>>2]|0;f=g-16|0;c[d>>2]=f;d=f;f=b+i|0;m=c[d+4>>2]|0;c[f>>2]=c[d>>2];c[f+4>>2]=m;c[b+(i+8)>>2]=c[g-16+8>>2];return}function iK(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0;j=i;i=i+32|0;k=j|0;l=j+8|0;m=j+16|0;n=e+8|0;o=c[n>>2]|0;do{if((o|0)==3){p=e;q=1473}else{if((o&15|0)!=4){break}r=c[e>>2]|0;if((gU(r+16|0,c[r+12>>2]|0,l)|0)==0){break}h[m>>3]=+h[l>>3];c[m+8>>2]=3;p=m;q=1473}}while(0);do{if((q|0)==1473){m=c[f+8>>2]|0;if((m|0)==3){if((f|0)==0){break}s=+h[f>>3]}else{if((m&15|0)!=4){break}m=c[f>>2]|0;if((gU(m+16|0,c[m+12>>2]|0,k)|0)==0){break}s=+h[k>>3]}h[d>>3]=+gS(g-6|0,+h[p>>3],s);c[d+8>>2]=3;i=j;return}}while(0);p=iv(b,e,g)|0;do{if((c[p+8>>2]|0)==0){k=iv(b,f,g)|0;if((c[k+8>>2]|0)!=0){t=k;break}eO(b,e,f)}else{t=p}}while(0);p=b+28|0;g=d-(c[p>>2]|0)|0;d=b+8|0;k=c[d>>2]|0;c[d>>2]=k+16;q=t;m=k;l=c[q+4>>2]|0;c[m>>2]=c[q>>2];c[m+4>>2]=l;c[k+8>>2]=c[t+8>>2];t=c[d>>2]|0;c[d>>2]=t+16;k=e;e=t;l=c[k+4>>2]|0;c[e>>2]=c[k>>2];c[e+4>>2]=l;c[t+8>>2]=c[n>>2];n=c[d>>2]|0;c[d>>2]=n+16;t=f;l=n;e=c[t+4>>2]|0;c[l>>2]=c[t>>2];c[l+4>>2]=e;c[n+8>>2]=c[f+8>>2];eZ(b,(c[d>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[p>>2]|0;p=c[d>>2]|0;f=p-16|0;c[d>>2]=f;d=f;f=b+g|0;n=c[d+4>>2]|0;c[f>>2]=c[d>>2];c[f+4>>2]=n;c[b+(g+8)>>2]=c[p-16+8>>2];i=j;return}function iL(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;b=c[a+16>>2]|0;d=b+24|0;e=c[d>>2]|0;f=b+28|0;g=c[(c[f>>2]|0)-4>>2]|0;h=g&63;switch(h|0){case 26:case 25:case 24:{i=a+8|0;j=c[i>>2]|0;k=c[j-16+8>>2]|0;do{if((k|0)==0){l=1}else{if((k|0)!=1){l=0;break}l=(c[j-16>>2]|0)==0|0}}while(0);k=l^1;c[i>>2]=j-16;if((h|0)==26){h=(c[(iv(a,e+(g>>>23<<4)|0,14)|0)+8>>2]|0)==0;m=h?l:k}else{m=k}if((m|0)==(g>>>6&255|0)){return}c[f>>2]=(c[f>>2]|0)+4;return};case 13:case 14:case 15:case 16:case 17:case 18:case 19:case 21:case 6:case 7:case 12:{f=a+8|0;m=c[f>>2]|0;k=m-16|0;c[f>>2]=k;f=g>>>6&255;l=k;k=e+(f<<4)|0;h=c[l+4>>2]|0;c[k>>2]=c[l>>2];c[k+4>>2]=h;c[e+(f<<4)+8>>2]=c[m-16+8>>2];return};case 29:{if((g&8372224|0)==0){return}c[a+8>>2]=c[b+4>>2];return};case 34:{c[a+8>>2]=c[b+4>>2];return};case 22:{m=a+8|0;f=c[m>>2]|0;h=f-32|0;k=h-(e+(g>>>23<<4))|0;e=f-16|0;l=f-48|0;j=c[e+4>>2]|0;c[l>>2]=c[e>>2];c[l+4>>2]=j;c[f-48+8>>2]=c[f-16+8>>2];if((k|0)>16){c[m>>2]=h;iI(a,k>>4)}k=c[m>>2]|0;a=c[d>>2]|0;d=g>>>6&255;g=k-16|0;h=a+(d<<4)|0;f=c[g+4>>2]|0;c[h>>2]=c[g>>2];c[h+4>>2]=f;c[a+(d<<4)+8>>2]=c[k-16+8>>2];c[m>>2]=c[b+4>>2];return};default:{return}}}function iM(b){b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0.0,ab=0.0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0.0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0;e=i;i=i+24|0;f=e|0;g=e+8|0;j=e+16|0;k=b+16|0;l=b+40|0;m=b+12|0;n=b+8|0;o=b+24|0;p=b+48|0;q=b+20|0;r=b+6|0;s=b+44|0;t=c[k>>2]|0;L1987:while(1){u=t|0;v=c[c[u>>2]>>2]|0;w=v+12|0;x=c[(c[w>>2]|0)+8>>2]|0;y=t+24|0;z=t+28|0;A=v+16|0;v=A;B=t+4|0;C=A;A=c[y>>2]|0;L1989:while(1){D=c[z>>2]|0;c[z>>2]=D+4;E=c[D>>2]|0;D=a[l]|0;do{if((D&12)==0){F=A}else{G=(c[p>>2]|0)-1|0;c[p>>2]=G;H=(G|0)==0;if(!H){if((D&4)==0){F=A;break}}I=c[k>>2]|0;G=D&255;if((G&8|0)==0|H^1){J=0}else{c[p>>2]=c[s>>2];J=1}K=I+18|0;H=a[K]|0;if(H<<24>>24>-1){if(J){eW(b,3,-1)}L2004:do{if((G&4|0)==0){L=I+28|0}else{M=c[(c[c[I>>2]>>2]|0)+12>>2]|0;N=I+28|0;P=c[N>>2]|0;Q=c[M+12>>2]|0;S=(P-Q>>2)-1|0;T=c[M+20>>2]|0;M=(T|0)==0;if(M){U=0}else{U=c[T+(S<<2)>>2]|0}do{if((S|0)!=0){V=c[q>>2]|0;if(P>>>0<=V>>>0){break}if(M){W=0}else{W=c[T+((V-Q>>2)-1<<2)>>2]|0}if((U|0)==(W|0)){L=N;break L2004}}}while(0);eW(b,2,U);L=N}}while(0);c[q>>2]=c[L>>2];if((a[r]|0)==1){X=1533;break L1987}}else{a[K]=H&127}F=c[y>>2]|0}}while(0);Y=E>>>6&255;Z=F+(Y<<4)|0;switch(E&63|0){case 17:{D=E>>>23;if((D&256|0)==0){_=F+(D<<4)|0}else{_=x+((D&255)<<4)|0}D=E>>>14;if((D&256|0)==0){$=F+((D&511)<<4)|0}else{$=x+((D&255)<<4)|0}do{if((c[_+8>>2]|0)==3){if((c[$+8>>2]|0)!=3){break}aa=+h[_>>3];ab=+h[$>>3];h[Z>>3]=aa-ab*+O(aa/ab);c[F+(Y<<4)+8>>2]=3;A=F;continue L1989}}while(0);iK(b,Z,_,$,10);A=c[y>>2]|0;continue L1989;break};case 18:{D=E>>>23;if((D&256|0)==0){ac=F+(D<<4)|0}else{ac=x+((D&255)<<4)|0}D=E>>>14;if((D&256|0)==0){ad=F+((D&511)<<4)|0}else{ad=x+((D&255)<<4)|0}do{if((c[ac+8>>2]|0)==3){if((c[ad+8>>2]|0)!=3){break}h[Z>>3]=+R(+(+h[ac>>3]),+(+h[ad>>3]));c[F+(Y<<4)+8>>2]=3;A=F;continue L1989}}while(0);iK(b,Z,ac,ad,11);A=c[y>>2]|0;continue L1989;break};case 23:{if((Y|0)!=0){fd(b,(c[y>>2]|0)+(Y-1<<4)|0)}c[z>>2]=(c[z>>2]|0)+((E>>>14)-131071<<2);A=F;continue L1989;break};case 24:{D=E>>>23;if((D&256|0)==0){ae=F+(D<<4)|0}else{ae=x+((D&255)<<4)|0}D=E>>>14;if((D&256|0)==0){af=F+((D&511)<<4)|0}else{af=x+((D&255)<<4)|0}if((c[ae+8>>2]|0)==(c[af+8>>2]|0)){ag=(iG(b,ae,af)|0)!=0|0}else{ag=0}D=c[z>>2]|0;G=D;if((ag|0)==(Y|0)){Q=c[G>>2]|0;T=Q>>>6&255;if((T|0)==0){ah=D}else{fd(b,(c[y>>2]|0)+(T-1<<4)|0);ah=c[z>>2]|0}ai=ah+((Q>>>14)-131070<<2)|0}else{ai=G+4|0}c[z>>2]=ai;A=c[y>>2]|0;continue L1989;break};case 19:{G=E>>>23;Q=F+(G<<4)|0;if((c[F+(G<<4)+8>>2]|0)==3){h[Z>>3]=-0.0- +h[Q>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue L1989}else{iK(b,Z,Q,Q,12);A=c[y>>2]|0;continue L1989}break};case 20:{Q=E>>>23;G=c[F+(Q<<4)+8>>2]|0;do{if((G|0)==0){aj=1}else{if((G|0)!=1){aj=0;break}aj=(c[F+(Q<<4)>>2]|0)==0|0}}while(0);c[Z>>2]=aj;c[F+(Y<<4)+8>>2]=1;A=F;continue L1989;break};case 21:{iJ(b,Z,F+(E>>>23<<4)|0);A=c[y>>2]|0;continue L1989;break};case 22:{Q=E>>>23;G=E>>>14&511;c[n>>2]=F+(G+1<<4);iI(b,1-Q+G|0);G=c[y>>2]|0;T=G+(Q<<4)|0;D=T;M=G+(Y<<4)|0;P=c[D+4>>2]|0;c[M>>2]=c[D>>2];c[M+4>>2]=P;c[G+(Y<<4)+8>>2]=c[G+(Q<<4)+8>>2];if((c[(c[m>>2]|0)+12>>2]|0)>0){if(Y>>>0<Q>>>0){ak=T}else{ak=G+(Y+1<<4)|0}c[n>>2]=ak;fv(b);c[n>>2]=c[B>>2]}G=c[y>>2]|0;c[n>>2]=c[B>>2];A=G;continue L1989;break};case 0:{G=E>>>23;T=F+(G<<4)|0;Q=Z;P=c[T+4>>2]|0;c[Q>>2]=c[T>>2];c[Q+4>>2]=P;c[F+(Y<<4)+8>>2]=c[F+(G<<4)+8>>2];A=F;continue L1989;break};case 1:{G=E>>>14;P=x+(G<<4)|0;Q=Z;T=c[P+4>>2]|0;c[Q>>2]=c[P>>2];c[Q+4>>2]=T;c[F+(Y<<4)+8>>2]=c[x+(G<<4)+8>>2];A=F;continue L1989;break};case 2:{G=c[z>>2]|0;c[z>>2]=G+4;T=(c[G>>2]|0)>>>6;G=x+(T<<4)|0;Q=Z;P=c[G+4>>2]|0;c[Q>>2]=c[G>>2];c[Q+4>>2]=P;c[F+(Y<<4)+8>>2]=c[x+(T<<4)+8>>2];A=F;continue L1989;break};case 3:{c[Z>>2]=E>>>23;c[F+(Y<<4)+8>>2]=1;if((E&8372224|0)==0){A=F;continue L1989}c[z>>2]=(c[z>>2]|0)+4;A=F;continue L1989;break};case 4:{T=Z;P=E>>>23;while(1){c[T+8>>2]=0;if((P|0)==0){A=F;continue L1989}else{T=T+16|0;P=P-1|0}}break};case 5:{P=c[(c[v+(E>>>23<<2)>>2]|0)+8>>2]|0;T=P;Q=Z;G=c[T+4>>2]|0;c[Q>>2]=c[T>>2];c[Q+4>>2]=G;c[F+(Y<<4)+8>>2]=c[P+8>>2];A=F;continue L1989;break};case 6:{P=E>>>14;if((P&256|0)==0){al=F+((P&511)<<4)|0}else{al=x+((P&255)<<4)|0}iC(b,c[(c[v+(E>>>23<<2)>>2]|0)+8>>2]|0,al,Z);A=c[y>>2]|0;continue L1989;break};case 7:{P=E>>>14;if((P&256|0)==0){am=F+((P&511)<<4)|0}else{am=x+((P&255)<<4)|0}iC(b,F+(E>>>23<<4)|0,am,Z);A=c[y>>2]|0;continue L1989;break};case 8:{P=E>>>23;if((P&256|0)==0){an=F+(P<<4)|0}else{an=x+((P&255)<<4)|0}P=E>>>14;if((P&256|0)==0){ao=F+((P&511)<<4)|0}else{ao=x+((P&255)<<4)|0}iD(b,c[(c[v+(Y<<2)>>2]|0)+8>>2]|0,an,ao);A=c[y>>2]|0;continue L1989;break};case 9:{P=c[v+(E>>>23<<2)>>2]|0;G=c[P+8>>2]|0;Q=Z;T=G;M=c[Q+4>>2]|0;c[T>>2]=c[Q>>2];c[T+4>>2]=M;M=F+(Y<<4)+8|0;c[G+8>>2]=c[M>>2];if((c[M>>2]&64|0)==0){A=F;continue L1989}M=c[Z>>2]|0;if((a[M+5|0]&3)==0){A=F;continue L1989}if((a[P+5|0]&4)==0){A=F;continue L1989}fh(b,P,M);A=F;continue L1989;break};case 10:{M=E>>>23;if((M&256|0)==0){ap=F+(M<<4)|0}else{ap=x+((M&255)<<4)|0}M=E>>>14;if((M&256|0)==0){aq=F+((M&511)<<4)|0}else{aq=x+((M&255)<<4)|0}iD(b,Z,ap,aq);A=c[y>>2]|0;continue L1989;break};case 11:{M=E>>>23;P=E>>>14&511;G=h9(b)|0;c[Z>>2]=G;c[F+(Y<<4)+8>>2]=69;if((P|M|0)!=0){T=gQ(M)|0;h4(b,G,T,gQ(P)|0)}if((c[(c[m>>2]|0)+12>>2]|0)>0){c[n>>2]=F+(Y+1<<4);fv(b);c[n>>2]=c[B>>2]}A=c[y>>2]|0;continue L1989;break};case 12:{P=E>>>23;T=F+(P<<4)|0;G=Y+1|0;M=T;Q=F+(G<<4)|0;D=c[M+4>>2]|0;c[Q>>2]=c[M>>2];c[Q+4>>2]=D;c[F+(G<<4)+8>>2]=c[F+(P<<4)+8>>2];P=E>>>14;if((P&256|0)==0){ar=F+((P&511)<<4)|0}else{ar=x+((P&255)<<4)|0}iC(b,T,ar,Z);A=c[y>>2]|0;continue L1989;break};case 13:{T=E>>>23;if((T&256|0)==0){as=F+(T<<4)|0}else{as=x+((T&255)<<4)|0}T=E>>>14;if((T&256|0)==0){at=F+((T&511)<<4)|0}else{at=x+((T&255)<<4)|0}do{if((c[as+8>>2]|0)==3){if((c[at+8>>2]|0)!=3){break}h[Z>>3]=+h[as>>3]+ +h[at>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue L1989}}while(0);iK(b,Z,as,at,6);A=c[y>>2]|0;continue L1989;break};case 14:{T=E>>>23;if((T&256|0)==0){au=F+(T<<4)|0}else{au=x+((T&255)<<4)|0}T=E>>>14;if((T&256|0)==0){av=F+((T&511)<<4)|0}else{av=x+((T&255)<<4)|0}do{if((c[au+8>>2]|0)==3){if((c[av+8>>2]|0)!=3){break}h[Z>>3]=+h[au>>3]- +h[av>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue L1989}}while(0);iK(b,Z,au,av,7);A=c[y>>2]|0;continue L1989;break};case 15:{T=E>>>23;if((T&256|0)==0){aw=F+(T<<4)|0}else{aw=x+((T&255)<<4)|0}T=E>>>14;if((T&256|0)==0){ax=F+((T&511)<<4)|0}else{ax=x+((T&255)<<4)|0}do{if((c[aw+8>>2]|0)==3){if((c[ax+8>>2]|0)!=3){break}h[Z>>3]=+h[aw>>3]*+h[ax>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue L1989}}while(0);iK(b,Z,aw,ax,8);A=c[y>>2]|0;continue L1989;break};case 16:{T=E>>>23;if((T&256|0)==0){ay=F+(T<<4)|0}else{ay=x+((T&255)<<4)|0}T=E>>>14;if((T&256|0)==0){az=F+((T&511)<<4)|0}else{az=x+((T&255)<<4)|0}do{if((c[ay+8>>2]|0)==3){if((c[az+8>>2]|0)!=3){break}h[Z>>3]=+h[ay>>3]/+h[az>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue L1989}}while(0);iK(b,Z,ay,az,9);A=c[y>>2]|0;continue L1989;break};case 25:{T=E>>>23;if((T&256|0)==0){aA=F+(T<<4)|0}else{aA=x+((T&255)<<4)|0}T=E>>>14;if((T&256|0)==0){aB=F+((T&511)<<4)|0}else{aB=x+((T&255)<<4)|0}T=(iE(b,aA,aB)|0)==(Y|0);P=c[z>>2]|0;G=P;if(T){T=c[G>>2]|0;D=T>>>6&255;if((D|0)==0){aC=P}else{fd(b,(c[y>>2]|0)+(D-1<<4)|0);aC=c[z>>2]|0}aD=aC+((T>>>14)-131070<<2)|0}else{aD=G+4|0}c[z>>2]=aD;A=c[y>>2]|0;continue L1989;break};case 26:{G=E>>>23;if((G&256|0)==0){aE=F+(G<<4)|0}else{aE=x+((G&255)<<4)|0}G=E>>>14;if((G&256|0)==0){aF=F+((G&511)<<4)|0}else{aF=x+((G&255)<<4)|0}G=(iF(b,aE,aF)|0)==(Y|0);T=c[z>>2]|0;D=T;if(G){G=c[D>>2]|0;P=G>>>6&255;if((P|0)==0){aG=T}else{fd(b,(c[y>>2]|0)+(P-1<<4)|0);aG=c[z>>2]|0}aH=aG+((G>>>14)-131070<<2)|0}else{aH=D+4|0}c[z>>2]=aH;A=c[y>>2]|0;continue L1989;break};case 27:{D=c[F+(Y<<4)+8>>2]|0;G=(D|0)==0;do{if((E&8372224|0)==0){if(G){break}if((D|0)!=1){X=1702;break}if((c[Z>>2]|0)!=0){X=1702}}else{if(G){X=1702;break}if((D|0)!=1){break}if((c[Z>>2]|0)==0){X=1702}}}while(0);if((X|0)==1702){X=0;c[z>>2]=(c[z>>2]|0)+4;A=F;continue L1989}D=c[z>>2]|0;G=c[D>>2]|0;P=G>>>6&255;if((P|0)==0){aI=D}else{fd(b,(c[y>>2]|0)+(P-1<<4)|0);aI=c[z>>2]|0}c[z>>2]=aI+((G>>>14)-131070<<2);A=F;continue L1989;break};case 28:{G=E>>>23;P=F+(G<<4)|0;D=c[F+(G<<4)+8>>2]|0;G=(D|0)==0;do{if((E&8372224|0)==0){if(G){break}if((D|0)!=1){X=1713;break}if((c[P>>2]|0)!=0){X=1713}}else{if(G){X=1713;break}if((D|0)!=1){break}if((c[P>>2]|0)==0){X=1713}}}while(0);if((X|0)==1713){X=0;c[z>>2]=(c[z>>2]|0)+4;A=F;continue L1989}G=P;T=Z;Q=c[G+4>>2]|0;c[T>>2]=c[G>>2];c[T+4>>2]=Q;c[F+(Y<<4)+8>>2]=D;Q=c[z>>2]|0;T=c[Q>>2]|0;G=T>>>6&255;if((G|0)==0){aJ=Q}else{fd(b,(c[y>>2]|0)+(G-1<<4)|0);aJ=c[z>>2]|0}c[z>>2]=aJ+((T>>>14)-131070<<2);A=F;continue L1989;break};case 29:{T=E>>>23;G=E>>>14&511;if((T|0)!=0){c[n>>2]=F+(Y+T<<4)}if((eX(b,Z,G-1|0)|0)==0){X=1723;break L1989}if((G|0)!=0){c[n>>2]=c[B>>2]}A=c[y>>2]|0;continue L1989;break};case 30:{G=E>>>23;if((G|0)!=0){c[n>>2]=F+(Y+G<<4)}if((eX(b,Z,-1)|0)==0){X=1728;break L1989}A=c[y>>2]|0;continue L1989;break};case 31:{X=1733;break L1989;break};case 32:{ab=+h[F+(Y+2<<4)>>3];G=Z|0;aa=ab+ +h[G>>3];aK=+h[F+(Y+1<<4)>>3];if(ab>0.0){if(aa>aK){A=F;continue L1989}}else{if(aK>aa){A=F;continue L1989}}c[z>>2]=(c[z>>2]|0)+((E>>>14)-131071<<2);h[G>>3]=aa;c[F+(Y<<4)+8>>2]=3;G=Y+3|0;h[F+(G<<4)>>3]=aa;c[F+(G<<4)+8>>2]=3;A=F;continue L1989;break};case 33:{G=Y+1|0;T=F+(G<<4)|0;Q=Y+2|0;M=F+(Q<<4)|0;S=F+(Y<<4)+8|0;V=c[S>>2]|0;if((V|0)!=3){if((V&15|0)!=4){X=1810;break L1987}V=c[Z>>2]|0;if((gU(V+16|0,c[V+12>>2]|0,j)|0)==0){X=1811;break L1987}h[Z>>3]=+h[j>>3];c[S>>2]=3;if((Z|0)==0){X=1812;break L1987}}V=F+(G<<4)+8|0;G=c[V>>2]|0;if((G|0)!=3){if((G&15|0)!=4){X=1813;break L1987}G=c[T>>2]|0;if((gU(G+16|0,c[G+12>>2]|0,g)|0)==0){X=1814;break L1987}h[T>>3]=+h[g>>3];c[V>>2]=3;if((T|0)==0){X=1815;break L1987}}T=F+(Q<<4)+8|0;Q=c[T>>2]|0;if((Q|0)!=3){if((Q&15|0)!=4){X=1816;break L1987}Q=c[M>>2]|0;if((gU(Q+16|0,c[Q+12>>2]|0,f)|0)==0){X=1817;break L1987}h[M>>3]=+h[f>>3];c[T>>2]=3;if((M|0)==0){X=1818;break L1987}}T=Z|0;h[T>>3]=+h[T>>3]- +h[M>>3];c[S>>2]=3;c[z>>2]=(c[z>>2]|0)+((E>>>14)-131071<<2);A=F;continue L1989;break};case 34:{S=Y+3|0;M=F+(S<<4)|0;T=Y+2|0;Q=Y+5|0;V=F+(T<<4)|0;G=F+(Q<<4)|0;aL=c[V+4>>2]|0;c[G>>2]=c[V>>2];c[G+4>>2]=aL;c[F+(Q<<4)+8>>2]=c[F+(T<<4)+8>>2];T=Y+1|0;Q=Y+4|0;aL=F+(T<<4)|0;G=F+(Q<<4)|0;V=c[aL+4>>2]|0;c[G>>2]=c[aL>>2];c[G+4>>2]=V;c[F+(Q<<4)+8>>2]=c[F+(T<<4)+8>>2];T=Z;Q=M;V=c[T+4>>2]|0;c[Q>>2]=c[T>>2];c[Q+4>>2]=V;c[F+(S<<4)+8>>2]=c[F+(Y<<4)+8>>2];c[n>>2]=F+(Y+6<<4);eZ(b,M,E>>>14&511,1);M=c[y>>2]|0;c[n>>2]=c[B>>2];S=c[z>>2]|0;c[z>>2]=S+4;V=c[S>>2]|0;aM=M;aN=V;aO=M+((V>>>6&255)<<4)|0;break};case 35:{aM=F;aN=E;aO=Z;break};case 36:{V=E>>>23;M=E>>>14&511;if((V|0)==0){aP=((c[n>>2]|0)-Z>>4)-1|0}else{aP=V}if((M|0)==0){V=c[z>>2]|0;c[z>>2]=V+4;aQ=(c[V>>2]|0)>>>6}else{aQ=M}M=c[Z>>2]|0;V=M;S=aP-50+(aQ*50|0)|0;if((S|0)>(c[V+28>>2]|0)){h8(b,V,S)}if((aP|0)>0){Q=M+5|0;T=aP;G=S;while(1){S=T+Y|0;aL=F+(S<<4)|0;aR=G-1|0;h6(b,V,G,aL);do{if((c[F+(S<<4)+8>>2]&64|0)!=0){if((a[(c[aL>>2]|0)+5|0]&3)==0){break}if((a[Q]&4)==0){break}fj(b,M)}}while(0);aL=T-1|0;if((aL|0)>0){T=aL;G=aR}else{break}}}c[n>>2]=c[B>>2];A=F;continue L1989;break};case 37:{G=c[(c[(c[w>>2]|0)+16>>2]|0)+(E>>>14<<2)>>2]|0;T=G+32|0;M=c[T>>2]|0;Q=c[G+40>>2]|0;V=c[G+28>>2]|0;L2309:do{if((M|0)==0){X=1785}else{D=M+16|0;P=0;while(1){if((P|0)>=(Q|0)){break}aL=d[V+(P<<3)+5|0]|0;if((a[V+(P<<3)+4|0]|0)==0){aS=c[(c[C+(aL<<2)>>2]|0)+8>>2]|0}else{aS=F+(aL<<4)|0}if((c[(c[D+(P<<2)>>2]|0)+8>>2]|0)==(aS|0)){P=P+1|0}else{X=1785;break L2309}}c[Z>>2]=M;c[F+(Y<<4)+8>>2]=70}}while(0);if((X|0)==1785){X=0;M=e9(b,Q)|0;c[M+12>>2]=G;c[Z>>2]=M;c[F+(Y<<4)+8>>2]=70;if((Q|0)>0){P=M+16|0;D=0;do{aR=d[V+(D<<3)+5|0]|0;if((a[V+(D<<3)+4|0]|0)==0){c[P+(D<<2)>>2]=c[C+(aR<<2)>>2]}else{c[P+(D<<2)>>2]=fb(b,F+(aR<<4)|0)|0}D=D+1|0;}while((D|0)<(Q|0))}if((a[G+5|0]&4)!=0){fk(b,G,M)}c[T>>2]=M}if((c[(c[m>>2]|0)+12>>2]|0)>0){c[n>>2]=F+(Y+1<<4);fv(b);c[n>>2]=c[B>>2]}A=c[y>>2]|0;continue L1989;break};case 38:{Q=(E>>>23)-1|0;D=(F-(c[u>>2]|0)>>4)-(d[(c[w>>2]|0)+76|0]|0)|0;P=D-1|0;if((Q|0)<0){if(((c[o>>2]|0)-(c[n>>2]|0)>>4|0)<=(P|0)){eU(b,P)}V=c[y>>2]|0;c[n>>2]=V+(P+Y<<4);aT=V;aU=P;aV=V+(Y<<4)|0}else{aT=F;aU=Q;aV=Z}if((aU|0)<=0){A=aT;continue L1989}Q=1-D|0;D=0;while(1){if((D|0)<(P|0)){V=D+Q|0;aR=aT+(V<<4)|0;aL=aV+(D<<4)|0;S=c[aR+4>>2]|0;c[aL>>2]=c[aR>>2];c[aL+4>>2]=S;c[aV+(D<<4)+8>>2]=c[aT+(V<<4)+8>>2]}else{c[aV+(D<<4)+8>>2]=0}V=D+1|0;if((V|0)<(aU|0)){D=V}else{A=aT;continue L1989}}break};default:{A=F;continue L1989}}D=c[aO+24>>2]|0;if((D|0)==0){A=aM;continue}Q=aO+16|0;P=aO;M=c[Q+4>>2]|0;c[P>>2]=c[Q>>2];c[P+4>>2]=M;c[aO+8>>2]=D;c[z>>2]=(c[z>>2]|0)+((aN>>>14)-131071<<2);A=aM}if((X|0)==1723){X=0;A=c[k>>2]|0;z=A+18|0;a[z]=a[z]|4;t=A;continue}else if((X|0)==1728){X=0;A=c[k>>2]|0;z=c[A+8>>2]|0;y=c[A>>2]|0;u=c[z>>2]|0;B=A+24|0;C=(c[B>>2]|0)+(d[(c[(c[y>>2]|0)+12>>2]|0)+76|0]<<4)|0;if((c[(c[w>>2]|0)+56>>2]|0)>0){fd(b,c[z+24>>2]|0)}if(y>>>0<C>>>0){x=0;v=y;do{D=v;M=u+(x<<4)|0;P=c[D+4>>2]|0;c[M>>2]=c[D>>2];c[M+4>>2]=P;c[u+(x<<4)+8>>2]=c[y+(x<<4)+8>>2];x=x+1|0;v=y+(x<<4)|0;}while(v>>>0<C>>>0)}C=y;c[z+24>>2]=u+((c[B>>2]|0)-C>>4<<4);v=u+((c[n>>2]|0)-C>>4<<4)|0;c[n>>2]=v;c[z+4>>2]=v;c[z+28>>2]=c[A+28>>2];v=z+18|0;a[v]=a[v]|64;c[k>>2]=z;t=z;continue}else if((X|0)==1733){X=0;v=E>>>23;if((v|0)!=0){c[n>>2]=F+(v-1+Y<<4)}if((c[(c[w>>2]|0)+56>>2]|0)>0){fd(b,F)}v=eY(b,Z)|0;if((a[t+18|0]&4)==0){X=1738;break}C=c[k>>2]|0;if((v|0)==0){t=C;continue}c[n>>2]=c[C+4>>2];t=C;continue}}if((X|0)==1533){if(!J){aW=c[L>>2]|0;aX=aW;aY=aX-4|0;aZ=aY;c[L>>2]=aZ;a_=a[K]|0;a$=a_|-128;a[K]=a$;a0=c[n>>2]|0;a1=a0-16|0;a2=I|0;c[a2>>2]=a1;eR(b,1)}c[p>>2]=1;aW=c[L>>2]|0;aX=aW;aY=aX-4|0;aZ=aY;c[L>>2]=aZ;a_=a[K]|0;a$=a_|-128;a[K]=a$;a0=c[n>>2]|0;a1=a0-16|0;a2=I|0;c[a2>>2]=a1;eR(b,1)}else if((X|0)==1738){i=e;return}else if((X|0)==1810){eM(b,3664,(a3=i,i=i+1|0,i=i+7&-8,c[a3>>2]=0,a3)|0);i=a3}else if((X|0)==1811){eM(b,3664,(a3=i,i=i+1|0,i=i+7&-8,c[a3>>2]=0,a3)|0);i=a3}else if((X|0)==1812){eM(b,3664,(a3=i,i=i+1|0,i=i+7&-8,c[a3>>2]=0,a3)|0);i=a3}else if((X|0)==1813){eM(b,3224,(a3=i,i=i+1|0,i=i+7&-8,c[a3>>2]=0,a3)|0);i=a3}else if((X|0)==1814){eM(b,3224,(a3=i,i=i+1|0,i=i+7&-8,c[a3>>2]=0,a3)|0);i=a3}else if((X|0)==1815){eM(b,3224,(a3=i,i=i+1|0,i=i+7&-8,c[a3>>2]=0,a3)|0);i=a3}else if((X|0)==1816){eM(b,2856,(a3=i,i=i+1|0,i=i+7&-8,c[a3>>2]=0,a3)|0);i=a3}else if((X|0)==1817){eM(b,2856,(a3=i,i=i+1|0,i=i+7&-8,c[a3>>2]=0,a3)|0);i=a3}else if((X|0)==1818){eM(b,2856,(a3=i,i=i+1|0,i=i+7&-8,c[a3>>2]=0,a3)|0);i=a3}}function iN(a){a=a|0;var b=0,e=0,f=0,g=0,h=0;b=i;i=i+8|0;e=b|0;f=cj[c[a+8>>2]&7](c[a+16>>2]|0,c[a+12>>2]|0,e)|0;if((f|0)==0){g=-1;i=b;return g|0}h=c[e>>2]|0;if((h|0)==0){g=-1;i=b;return g|0}c[a>>2]=h-1;c[a+4>>2]=f+1;g=d[f]|0;i=b;return g|0}function iO(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;c[b+16>>2]=a;c[b+8>>2]=d;c[b+12>>2]=e;c[b>>2]=0;c[b+4>>2]=0;return}function iP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+8|0;f=e|0;if((d|0)==0){g=0;i=e;return g|0}h=a|0;j=a+16|0;k=a+8|0;l=a+12|0;m=a+4|0;a=b;b=d;d=c[h>>2]|0;while(1){if((d|0)==0){n=cj[c[k>>2]&7](c[j>>2]|0,c[l>>2]|0,f)|0;if((n|0)==0){g=b;o=1836;break}p=c[f>>2]|0;if((p|0)==0){g=b;o=1839;break}c[h>>2]=p;c[m>>2]=n;q=p;r=n}else{q=d;r=c[m>>2]|0}n=b>>>0>q>>>0?q:b;kV(a|0,r|0,n)|0;p=(c[h>>2]|0)-n|0;c[h>>2]=p;c[m>>2]=(c[m>>2]|0)+n;if((b|0)==(n|0)){g=0;o=1838;break}else{a=a+n|0;b=b-n|0;d=p}}if((o|0)==1836){i=e;return g|0}else if((o|0)==1839){i=e;return g|0}else if((o|0)==1838){i=e;return g|0}return 0}function iQ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b+8|0;f=c[e>>2]|0;if(f>>>0>=d>>>0){g=c[b>>2]|0;return g|0}h=d>>>0<32?32:d;if((h+1|0)>>>0>4294967293){gy(a);return 0}d=b|0;b=gz(a,c[d>>2]|0,f,h)|0;c[d>>2]=b;c[e>>2]=h;g=b;return g|0}function iR(a){a=a|0;dn(a,0,2);et(a,1688,0);return 1}function iS(a){a=a|0;c7(a,+(b7(d$(a,1,8240,0)|0)|0));return 1}function iT(a){a=a|0;db(a,at(d$(a,1,8240,0)|0)|0)|0;return 1}function iU(a){a=a|0;dm(a,-1001e3,2);dm(a,-1001e3,2);dt(a,-2,3896);et(a,2304,0);da(a,10416,7)|0;dt(a,-2,8224);return 1}function iV(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;if((c0(a,1)|0)==0){d=d$(a,2,3984,0)|0;e=dR(a,4048,(f=i,i=i+8|0,c[f>>2]=d,f)|0)|0;i=f;g=e;i=b;return g|0}else{g=cL(a)|0;i=b;return g|0}return 0}function iW(a){a=a|0;var b=0,d=0,e=0;b=c[1568+((d_(a,1,4816,1616)|0)<<2)>>2]|0;d=dF(a,b,d8(a,2,0)|0)|0;if((b|0)==5|(b|0)==9){df(a,d);e=1;return e|0}else if((b|0)==3){b=dF(a,4,0)|0;c7(a,+(d|0)+ +(b|0)*.0009765625);c8(a,b);e=2;return e|0}else{c8(a,d);e=1;return e|0}return 0}function iX(a){a=a|0;var b=0,c=0;b=d$(a,1,0,0)|0;cM(a,1);if((eh(a,b,0)|0)==0){dz(a,0,-1,0,184);c=(cL(a)|0)-1|0;return c|0}else{c=dG(a)|0;return c|0}return 0}function iY(a){a=a|0;var b=0,c=0;b=d8(a,2,1)|0;cM(a,1);if(!((cW(a,1)|0)!=0&(b|0)>0)){c=dG(a)|0;return c|0}dT(a,b);cR(a,1);dI(a,2);c=dG(a)|0;return c|0}function iZ(a){a=a|0;d3(a,1);if((dp(a,1)|0)==0){c6(a);return 1}else{em(a,1,7144)|0;return 1}return 0}function i_(a){a=a|0;jh(a,5208,1,168);return 3}function i$(a){a=a|0;var b=0,c=0,d=0,e=0;b=d$(a,1,0,0)|0;c=d$(a,2,0,0)|0;d=(cS(a,3)|0)!=-1;if((eh(a,b,c)|0)!=0){c6(a);cO(a,-2);e=2;return e|0}if(!d){e=1;return e|0}cR(a,d?3:0);if((dM(a,-2,1)|0)!=0){e=1;return e|0}cM(a,-2);e=1;return e|0}function i0(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;i=i+8|0;d=b|0;e=c1(a,1,d)|0;f=d$(a,3,5888,0)|0;g=(cS(a,4)|0)!=-1;if((e|0)==0){h=d$(a,2,5760,0)|0;d2(a,1,6);cM(a,5);j=dC(a,6,0,h,f)|0}else{h=d$(a,2,e,0)|0;j=ek(a,e,c[d>>2]|0,h,f)|0}if((j|0)!=0){c6(a);cO(a,-2);k=2;i=b;return k|0}if(!g){k=1;i=b;return k|0}cR(a,g?4:0);if((dM(a,-2,1)|0)!=0){k=1;i=b;return k|0}cM(a,-2);k=1;i=b;return k|0}function i1(a){a=a|0;var b=0;d2(a,1,5);cM(a,2);if((dH(a,1)|0)!=0){b=2;return b|0}c6(a);b=1;return b|0}function i2(a){a=a|0;jh(a,6040,0,24);return 3}function i3(a){a=a|0;d3(a,1);c6(a);cO(a,1);return jg(a,(dA(a,(cL(a)|0)-2|0,-1,0,0,22)|0)==0|0)|0}function i4(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+8|0;d=b|0;e=cL(a)|0;di(a,8712);f=c[o>>2]|0;L2494:do{if((e|0)>=1){g=1;while(1){cR(a,-1);cR(a,g);dz(a,1,1,0,0);h=c1(a,-1,d)|0;if((h|0)==0){break}if((g|0)>1){av(9,f|0)|0}aw(h|0,1,c[d>>2]|0,f|0)|0;cM(a,-2);g=g+1|0;if((g|0)>(e|0)){break L2494}}g=dR(a,6408,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;j=g;i=b;return j|0}}while(0);av(10,f|0)|0;au(f|0)|0;j=0;i=b;return j|0}function i5(a){a=a|0;d3(a,1);d3(a,2);df(a,cX(a,1,2)|0);return 1}function i6(a){a=a|0;if(((cS(a,1)|0)-4|0)>>>0>=2){dQ(a,1,6600)|0}c8(a,c2(a,1)|0);return 1}function i7(a){a=a|0;d2(a,1,5);d3(a,2);cM(a,2);dl(a,1);return 1}function i8(a){a=a|0;d2(a,1,5);d3(a,2);d3(a,3);cM(a,3);du(a,1);return 1}function i9(b){b=b|0;var c=0,d=0,e=0,f=0;c=cL(b)|0;do{if((cS(b,1)|0)==4){if((a[c1(b,1,0)|0]|0)!=35){break}c8(b,c-1|0);d=1;return d|0}}while(0);e=d6(b,1)|0;if((e|0)<0){f=e+c|0}else{f=(e|0)>(c|0)?c:e}if((f|0)<=0){dQ(b,1,6744)|0}d=c-f|0;return d|0}function ja(a){a=a|0;var b=0,d=0,e=0;b=i;d=cS(a,2)|0;d2(a,1,5);if(!((d|0)==5|(d|0)==0)){dQ(a,2,7312)|0}if((em(a,1,7144)|0)==0){cM(a,2);dw(a,1)|0;e=1;i=b;return e|0}else{d=dR(a,6944,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;e=d;i=b;return e|0}return 0}function jb(b){b=b|0;var e=0,f=0,g=0,h=0.0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0.0,u=0,v=0.0,w=0.0;e=i;i=i+16|0;f=e|0;g=e+8|0;do{if((cS(b,2)|0)<1){h=+cZ(b,1,f);if((c[f>>2]|0)==0){d3(b,1);break}c7(b,h);i=e;return 1}else{j=d0(b,1,g)|0;k=j+(c[g>>2]|0)|0;l=d6(b,2)|0;if((l-2|0)>>>0>=35){dQ(b,2,7640)|0}m=bG(j|0,7496)|0;n=j+m|0;o=a[n]|0;if((o<<24>>24|0)==43){p=0;q=j+(m+1)|0}else if((o<<24>>24|0)==45){p=1;q=j+(m+1)|0}else{p=0;q=n}if((br(d[q]|0|0)|0)==0){break}h=+(l|0);r=0.0;n=q;while(1){m=a[n]|0;j=m&255;if((j-48|0)>>>0<10){s=(m<<24>>24)-48|0}else{s=(bj(j|0)|0)-55|0}if((s|0)>=(l|0)){t=r;u=n;break}v=h*r+ +(s|0);j=n+1|0;if((br(d[j]|0|0)|0)==0){t=v;u=j;break}else{r=v;n=j}}if((u+(bG(u|0,7496)|0)|0)!=(k|0)){break}if((p|0)==0){w=t}else{w=-0.0-t}c7(b,w);i=e;return 1}}while(0);c6(b);i=e;return 1}function jc(a){a=a|0;d3(a,1);ep(a,1,0)|0;return 1}function jd(a){a=a|0;d3(a,1);db(a,cT(a,cS(a,1)|0)|0)|0;return 1}function je(a){a=a|0;var b=0;b=cL(a)|0;if((b|0)<=1){dQ(a,2,8056)|0}cR(a,1);cQ(a,2,1);cP(a,2);return jg(a,(dA(a,b-2|0,-1,1,0,22)|0)==0|0)|0}function jf(a){a=a|0;return jg(a,(dy(a,0)|0)==1|0)|0}function jg(a,b){a=a|0;b=b|0;var c=0;if((cF(a,1)|0)==0){cM(a,0);df(a,0);db(a,7824)|0;c=2;return c|0}else{df(a,b);cP(a,1);c=cL(a)|0;return c|0}return 0}function jh(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if((em(a,1,b)|0)!=0){cR(a,1);dz(a,1,3,0,0);return}d2(a,1,5);de(a,d,0);cR(a,1);if((c|0)==0){c6(a);return}else{c8(a,0);return}}function ji(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;d1(a,2,5584);cR(a,1);dz(a,0,1,0,0);if((cS(a,-1)|0)==0){cM(a,-2);c[d>>2]=0;e=0;i=b;return e|0}if((cW(a,-1)|0)==0){dR(a,5408,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f}cP(a,5);e=c1(a,5,d)|0;i=b;return e|0}function jj(a){a=a|0;var b=0,c=0;b=d6(a,2)|0;d2(a,1,5);c=b+1|0;c8(a,c);dm(a,1,c);c=(cS(a,-1)|0)==0;return(c?1:2)|0}function jk(a){a=a|0;return(cL(a)|0)-1|0}function jl(a){a=a|0;dn(a,0,12);et(a,2200,0);return 1}function jm(a){a=a|0;var b=0,c=0,d=0,e=0;b=d7(a,1)|0;c=d6(a,2)|0;if((c|0)>-1&(b|0)<0){if((c|0)>31){d=-1}else{d=b>>>(c>>>0)|~(-1>>>(c>>>0))}c9(a,d);return 1}d=-c|0;if((c|0)>0){e=(c|0)>31?0:b>>>(c>>>0)}else{e=(d|0)>31?0:b<<d}c9(a,e);return 1}function jn(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=cL(a)|0;if((b|0)<1){c=-1}else{d=1;e=-1;while(1){f=(d7(a,d)|0)&e;g=d+1|0;if((g|0)>(b|0)){c=f;break}else{d=g;e=f}}}c9(a,c);return 1}function jo(a){a=a|0;c9(a,~(d7(a,1)|0));return 1}function jp(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=cL(a)|0;if((b|0)<1){c=0}else{d=1;e=0;while(1){f=d7(a,d)|0|e;g=d+1|0;if((g|0)>(b|0)){c=f;break}else{d=g;e=f}}}c9(a,c);return 1}function jq(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=cL(a)|0;if((b|0)<1){c=0}else{d=1;e=0;while(1){f=(d7(a,d)|0)^e;g=d+1|0;if((g|0)>(b|0)){c=f;break}else{d=g;e=f}}}c9(a,c);return 1}function jr(a){a=a|0;var b=0,c=0,d=0,e=0;b=cL(a)|0;if((b|0)<1){c=1}else{d=1;e=-1;do{e=(d7(a,d)|0)&e;d=d+1|0;}while((d|0)<=(b|0));c=(e|0)!=0|0}df(a,c);return 1}function js(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=d7(a,1)|0;e=d6(a,2)|0;f=d8(a,3,1)|0;if((e|0)<=-1){dQ(a,2,11208)|0}if((f|0)<=0){dQ(a,3,10864)|0}if((f+e|0)>32){dR(a,10664,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}c9(a,d>>>(e>>>0)&~(-2<<f-1));i=b;return 1}function jt(a){a=a|0;var b=0,c=0,d=0;b=d6(a,2)|0;c=d7(a,1)|0;d=b&31;c9(a,c>>>((32-d|0)>>>0)|c<<d);return 1}function ju(a){a=a|0;var b=0,c=0,d=0,e=0;b=d7(a,1)|0;c=d6(a,2)|0;if((c|0)<0){d=-c|0;e=(d|0)>31?0:b>>>(d>>>0);c9(a,e);return 1}else{e=(c|0)>31?0:b<<c;c9(a,e);return 1}return 0}function jv(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=d7(a,1)|0;e=d7(a,2)|0;f=d6(a,3)|0;g=d8(a,4,1)|0;if((f|0)<=-1){dQ(a,3,11208)|0}if((g|0)<=0){dQ(a,4,10864)|0}if((g+f|0)>32){dR(a,10664,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h}h=~(-2<<g-1);c9(a,d&~(h<<f)|(e&h)<<f);i=b;return 1}function jw(a){a=a|0;var b=0,c=0,d=0;b=-(d6(a,2)|0)|0;c=d7(a,1)|0;d=b&31;c9(a,c>>>((32-d|0)>>>0)|c<<d);return 1}function jx(a){a=a|0;var b=0,c=0,d=0,e=0;b=d7(a,1)|0;c=d6(a,2)|0;d=-c|0;if((c|0)>0){e=(c|0)>31?0:b>>>(c>>>0);c9(a,e);return 1}else{e=(d|0)>31?0:b<<d;c9(a,e);return 1}return 0}function jy(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=d+b|0;f=e-1|0;g=c[a+20>>2]|0;do{if((g|0)>(c[a+24>>2]|0)){h=(c[(c[a>>2]|0)+12>>2]|0)+(g-1<<2)|0;i=c[h>>2]|0;if((i&63|0)!=4){break}j=i>>>6&255;k=j+(i>>>23)|0;if((j|0)>(b|0)){l=2064}else{if((k+1|0)<(b|0)){l=2064}}if((l|0)==2064){if((j|0)<(b|0)|(j|0)>(e|0)){break}}m=(j|0)<(b|0)?j:b;c[h>>2]=((k|0)>(f|0)?k:f)-m<<23|m<<6&16320|i&8372287;return}}while(0);jI(a,b<<6|(d<<23)-8388608|4)|0;return}function jz(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return jI(a,c<<6|b|d<<23|e<<14)|0}function jA(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;b=a+28|0;d=c[b>>2]|0;c[b>>2]=-1;b=jI(a,2147450903)|0;if((d|0)==-1){e=b;return e|0}if((b|0)==-1){e=d;return e|0}f=c[(c[a>>2]|0)+12>>2]|0;g=b;while(1){h=f+(g<<2)|0;i=c[h>>2]|0;j=(i>>>14)-131071|0;if((j|0)==-1){break}k=g+1+j|0;if((k|0)==-1){break}else{g=k}}f=d+~g|0;if((((f|0)>-1?f:-f|0)|0)>131071){kC(c[a+12>>2]|0,4784);return 0}c[h>>2]=(f<<14)+2147467264|i&16383;e=b;return e|0}function jB(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return jI(a,c<<6|b|d<<14)|0}function jC(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;if((d|0)==-1){return}e=c[b>>2]|0;if((e|0)==-1){c[b>>2]=d;return}b=c[(c[a>>2]|0)+12>>2]|0;f=e;while(1){g=b+(f<<2)|0;h=c[g>>2]|0;e=(h>>>14)-131071|0;if((e|0)==-1){break}i=f+1+e|0;if((i|0)==-1){break}else{f=i}}b=~f+d|0;if((((b|0)>-1?b:-b|0)|0)>131071){kC(c[a+12>>2]|0,4784)}c[g>>2]=h&16383|(b<<14)+2147467264;return}function jD(a,b,c){a=a|0;b=b|0;c=c|0;jI(a,b<<6|(c<<23)+8388608|31)|0;return}function jE(a){a=a|0;var b=0;b=c[a+20>>2]|0;c[a+24>>2]=b;return b|0}function jF(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((c[b+20>>2]|0)==(e|0)){c[b+24>>2]=e;f=b+28|0;if((d|0)==-1){return}g=c[f>>2]|0;if((g|0)==-1){c[f>>2]=d;return}f=c[(c[b>>2]|0)+12>>2]|0;h=g;while(1){i=f+(h<<2)|0;j=c[i>>2]|0;g=(j>>>14)-131071|0;if((g|0)==-1){break}k=h+1+g|0;if((k|0)==-1){break}else{h=k}}f=~h+d|0;if((((f|0)>-1?f:-f|0)|0)>131071){kC(c[b+12>>2]|0,4784)}c[i>>2]=(f<<14)+2147467264|j&16383;return}if((d|0)==-1){return}j=b|0;f=d;while(1){d=c[(c[j>>2]|0)+12>>2]|0;i=d+(f<<2)|0;h=c[i>>2]|0;k=(h>>>14)-131071|0;if((k|0)==-1){l=-1}else{l=f+1+k|0}if((f|0)>0){k=d+(f-1<<2)|0;d=c[k>>2]|0;if((a[1256+(d&63)|0]|0)<0){m=k;n=d}else{o=2115}}else{o=2115}if((o|0)==2115){o=0;m=i;n=h}if((n&63|0)==28){c[m>>2]=n&8372224|n>>>23<<6|27;d=(c[(c[j>>2]|0)+12>>2]|0)+(f<<2)|0;k=~f+e|0;if((((k|0)>-1?k:-k|0)|0)>131071){o=2118;break}c[d>>2]=c[d>>2]&16383|(k<<14)+2147467264}else{k=~f+e|0;if((((k|0)>-1?k:-k|0)|0)>131071){o=2121;break}c[i>>2]=h&16383|(k<<14)+2147467264}if((l|0)==-1){o=2125;break}else{f=l}}if((o|0)==2118){kC(c[b+12>>2]|0,4784)}else if((o|0)==2121){kC(c[b+12>>2]|0,4784)}else if((o|0)==2125){return}}function jG(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;c[a+24>>2]=c[a+20>>2];d=a+28|0;if((b|0)==-1){return}e=c[d>>2]|0;if((e|0)==-1){c[d>>2]=b;return}d=c[(c[a>>2]|0)+12>>2]|0;f=e;while(1){g=d+(f<<2)|0;h=c[g>>2]|0;e=(h>>>14)-131071|0;if((e|0)==-1){break}i=f+1+e|0;if((i|0)==-1){break}else{f=i}}d=~f+b|0;if((((d|0)>-1?d:-d|0)|0)>131071){kC(c[a+12>>2]|0,4784)}c[g>>2]=(d<<14)+2147467264|h&16383;return}function jH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;if((b|0)==-1){return}e=a|0;a=(d<<6)+64&16320;d=b;while(1){f=(c[(c[e>>2]|0)+12>>2]|0)+(d<<2)|0;g=c[f>>2]|0;b=(g>>>14)-131071|0;if((b|0)==-1){break}h=d+1+b|0;c[f>>2]=g&-16321|a;if((h|0)==-1){i=2151;break}else{d=h}}if((i|0)==2151){return}c[f>>2]=g&-16321|a;return}function jI(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;e=b|0;f=c[e>>2]|0;g=b+28|0;h=c[g>>2]|0;i=b+20|0;j=c[i>>2]|0;do{if((h|0)==-1){k=j}else{l=h;m=f;while(1){n=c[m+12>>2]|0;o=n+(l<<2)|0;p=c[o>>2]|0;q=(p>>>14)-131071|0;if((q|0)==-1){r=-1}else{r=l+1+q|0}if((l|0)>0){q=n+(l-1<<2)|0;n=c[q>>2]|0;if((a[1256+(n&63)|0]|0)<0){s=q;t=n}else{u=2157}}else{u=2157}if((u|0)==2157){u=0;s=o;t=p}if((t&63|0)==28){c[s>>2]=t&8372224|t>>>23<<6|27;n=(c[(c[e>>2]|0)+12>>2]|0)+(l<<2)|0;q=j+~l|0;if((((q|0)>-1?q:-q|0)|0)>131071){u=2160;break}c[n>>2]=c[n>>2]&16383|(q<<14)+2147467264}else{q=j+~l|0;if((((q|0)>-1?q:-q|0)|0)>131071){u=2163;break}c[o>>2]=p&16383|(q<<14)+2147467264}if((r|0)==-1){u=2167;break}l=r;m=c[e>>2]|0}if((u|0)==2160){kC(c[b+12>>2]|0,4784);return 0}else if((u|0)==2167){k=c[i>>2]|0;break}else if((u|0)==2163){kC(c[b+12>>2]|0,4784);return 0}}}while(0);c[g>>2]=-1;g=f+48|0;if((k+1|0)>(c[g>>2]|0)){u=f+12|0;e=gx(c[(c[b+12>>2]|0)+52>>2]|0,c[u>>2]|0,g,4,2147483645,6248)|0;c[u>>2]=e;v=c[i>>2]|0;w=e}else{v=k;w=c[f+12>>2]|0}c[w+(v<<2)>>2]=d;d=c[i>>2]|0;v=f+52|0;if((d+1|0)>(c[v>>2]|0)){w=b+12|0;k=f+20|0;e=gx(c[(c[w>>2]|0)+52>>2]|0,c[k>>2]|0,v,4,2147483645,6248)|0;c[k>>2]=e;x=c[i>>2]|0;y=e;z=w;A=c[z>>2]|0;B=A+8|0;C=c[B>>2]|0;D=y+(x<<2)|0;c[D>>2]=C;E=c[i>>2]|0;F=E+1|0;c[i>>2]=F;return E|0}else{x=d;y=c[f+20>>2]|0;z=b+12|0;A=c[z>>2]|0;B=A+8|0;C=c[B>>2]|0;D=y+(x<<2)|0;c[D>>2]=C;E=c[i>>2]|0;F=E+1|0;c[i>>2]=F;return E|0}return 0}function jJ(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=b<<6;if((c|0)<262144){e=jI(a,d|c<<14|1)|0;return e|0}else{b=jI(a,d|2)|0;d=c<<6|39;jI(a,d)|0;e=b;return e|0}return 0}function jK(b,e){b=b|0;e=e|0;var f=0;f=(d[b+48|0]|0)+e|0;e=(c[b>>2]|0)+78|0;if((f|0)<=(d[e]|0|0)){return}if((f|0)>249){kC(c[b+12>>2]|0,3608)}a[e]=f&255;return}function jL(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b+48|0;g=a[f]|0;h=(g&255)+e|0;i=(c[b>>2]|0)+78|0;if((h|0)<=(d[i]|0|0)){j=g;k=j&255;l=k+e|0;m=l&255;a[f]=m;return}if((h|0)>249){kC(c[b+12>>2]|0,3608)}a[i]=h&255;j=a[f]|0;k=j&255;l=k+e|0;m=l&255;a[f]=m;return}function jM(a,b){a=a|0;b=b|0;var e=0,f=0;e=i;i=i+16|0;f=e|0;c[f>>2]=b;c[f+8>>2]=d[b+4|0]|0|64;b=jN(a,f,f)|0;i=e;return b|0}function jN(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+8|0;g=f|0;j=c[(c[b+12>>2]|0)+52>>2]|0;k=h7(j,c[b+4>>2]|0,d)|0;d=c[b>>2]|0;l=k+8|0;m=k|0;do{if((c[l>>2]|0)==3){h[g>>3]=+h[m>>3]+6755399441055744.0;k=c[g>>2]|0;n=c[d+8>>2]|0;if((c[n+(k<<4)+8>>2]|0)!=(c[e+8>>2]|0)){break}if((iG(0,n+(k<<4)|0,e)|0)==0){break}else{o=k}i=f;return o|0}}while(0);g=d+44|0;k=c[g>>2]|0;n=b+32|0;b=c[n>>2]|0;h[m>>3]=+(b|0);c[l>>2]=3;l=c[g>>2]|0;if((b+1|0)>(l|0)){m=d+8|0;c[m>>2]=gx(j,c[m>>2]|0,g,16,67108863,8040)|0;p=c[g>>2]|0}else{p=l}l=d+8|0;if((k|0)<(p|0)){p=k;while(1){k=p+1|0;c[(c[l>>2]|0)+(p<<4)+8>>2]=0;if((k|0)<(c[g>>2]|0)){p=k}else{break}}}p=c[l>>2]|0;l=e;g=p+(b<<4)|0;k=c[l+4>>2]|0;c[g>>2]=c[l>>2];c[g+4>>2]=k;k=e+8|0;c[p+(b<<4)+8>>2]=c[k>>2];c[n>>2]=(c[n>>2]|0)+1;if((c[k>>2]&64|0)==0){o=b;i=f;return o|0}k=c[e>>2]|0;if((a[k+5|0]&3)==0){o=b;i=f;return o|0}if((a[d+5|0]&4)==0){o=b;i=f;return o|0}fh(j,d,k);o=b;i=f;return o|0}function jO(a,b){a=a|0;b=+b;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h[f>>3]=b;j=c[(c[a+12>>2]|0)+52>>2]|0;h[g>>3]=b;c[g+8>>2]=3;if(b==0.0){k=j+8|0;l=c[k>>2]|0;c[k>>2]=l+16;m=hH(j,f,8)|0;c[l>>2]=m;c[l+8>>2]=d[m+4|0]|0|64;m=jN(a,(c[k>>2]|0)-16|0,g)|0;c[k>>2]=(c[k>>2]|0)-16;n=m;i=e;return n|0}else{n=jN(a,g,g)|0;i=e;return n|0}return 0}function jP(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=c[e>>2]|0;if((g|0)==12){h=(c[(c[b>>2]|0)+12>>2]|0)+(c[e+8>>2]<<2)|0;c[h>>2]=c[h>>2]&-8372225|(f<<14)+16384&8372224;return}else if((g|0)==13){g=e+8|0;e=b|0;h=(c[(c[e>>2]|0)+12>>2]|0)+(c[g>>2]<<2)|0;c[h>>2]=c[h>>2]&8388607|(f<<23)+8388608;f=(c[(c[e>>2]|0)+12>>2]|0)+(c[g>>2]<<2)|0;g=b+48|0;c[f>>2]=(d[g]|0)<<6|c[f>>2]&-16321;f=a[g]|0;h=(f&255)+1|0;i=(c[e>>2]|0)+78|0;do{if(h>>>0>(d[i]|0)>>>0){if(h>>>0>249){kC(c[b+12>>2]|0,3608)}else{a[i]=h&255;j=a[g]|0;break}}else{j=f}}while(0);a[g]=j+1&255;return}else{return}}function jQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b|0;e=c[d>>2]|0;if((e|0)==12){c[d>>2]=6;f=b+8|0;c[f>>2]=(c[(c[(c[a>>2]|0)+12>>2]|0)+(c[f>>2]<<2)>>2]|0)>>>6&255;return}else if((e|0)==13){e=(c[(c[a>>2]|0)+12>>2]|0)+(c[b+8>>2]<<2)|0;c[e>>2]=c[e>>2]&8388607|16777216;c[d>>2]=11;return}else{return}}function jR(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=f|0;switch(c[g>>2]|0){case 9:{h=f+8|0;i=h;j=h;k=b[j>>1]|0;do{if((k&256|0)==0){if((d[e+46|0]|0)>(k|0)){break}l=e+48|0;a[l]=(a[l]|0)-1&255}}while(0);k=i+2|0;do{if((a[i+3|0]|0)==7){if((d[e+46|0]|0)>(d[k]|0)){m=7;break}l=e+48|0;a[l]=(a[l]|0)-1&255;m=7}else{m=6}}while(0);c[h>>2]=jI(e,d[k]<<23|m|b[j>>1]<<14)|0;c[g>>2]=11;return};case 12:{c[g>>2]=6;j=f+8|0;c[j>>2]=(c[(c[(c[e>>2]|0)+12>>2]|0)+(c[j>>2]<<2)>>2]|0)>>>6&255;return};case 7:{c[g>>2]=6;return};case 13:{j=(c[(c[e>>2]|0)+12>>2]|0)+(c[f+8>>2]<<2)|0;c[j>>2]=c[j>>2]&8388607|16777216;c[g>>2]=11;return};case 8:{j=f+8|0;c[j>>2]=jI(e,c[j>>2]<<23|5)|0;c[g>>2]=11;return};default:{return}}}function jS(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;jR(b,e);do{if((c[e>>2]|0)==6){f=c[e+8>>2]|0;if((f&256|0)!=0){break}if((d[b+46|0]|0|0)>(f|0)){break}f=b+48|0;a[f]=(a[f]|0)-1&255}}while(0);f=b+48|0;g=a[f]|0;h=(g&255)+1|0;i=(c[b>>2]|0)+78|0;if(h>>>0<=(d[i]|0)>>>0){j=g;k=j+1&255;a[f]=k;l=k&255;m=l-1|0;jT(b,e,m);return}if(h>>>0>249){kC(c[b+12>>2]|0,3608)}a[i]=h&255;j=a[f]|0;k=j+1&255;a[f]=k;l=k&255;m=l-1|0;jT(b,e,m);return}function jT(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;j8(b,d,e);f=d|0;g=d+16|0;do{if((c[f>>2]|0)==10){h=c[d+8>>2]|0;if((h|0)==-1){break}i=c[g>>2]|0;if((i|0)==-1){c[g>>2]=h;break}j=c[(c[b>>2]|0)+12>>2]|0;k=i;while(1){l=j+(k<<2)|0;m=c[l>>2]|0;i=(m>>>14)-131071|0;if((i|0)==-1){break}n=k+1+i|0;if((n|0)==-1){break}else{k=n}}j=h+~k|0;if((((j|0)>-1?j:-j|0)|0)>131071){kC(c[b+12>>2]|0,4784)}else{c[l>>2]=(j<<14)+2147467264|m&16383;break}}}while(0);m=c[g>>2]|0;l=d+20|0;j=c[l>>2]|0;if((m|0)==(j|0)){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}L2943:do{if((m|0)==-1){q=2288}else{n=c[(c[b>>2]|0)+12>>2]|0;i=m;while(1){r=n+(i<<2)|0;if((i|0)>0){s=c[n+(i-1<<2)>>2]|0;if((a[1256+(s&63)|0]|0)<0){t=s}else{q=2284}}else{q=2284}if((q|0)==2284){q=0;t=c[r>>2]|0}if((t&63|0)!=28){q=2296;break L2943}s=((c[r>>2]|0)>>>14)-131071|0;if((s|0)==-1){q=2288;break L2943}r=i+1+s|0;if((r|0)==-1){q=2288;break}else{i=r}}}}while(0);L2954:do{if((q|0)==2288){if((j|0)==-1){u=-1;v=-1;break}t=c[(c[b>>2]|0)+12>>2]|0;m=j;while(1){i=t+(m<<2)|0;if((m|0)>0){n=c[t+(m-1<<2)>>2]|0;if((a[1256+(n&63)|0]|0)<0){w=n}else{q=2292}}else{q=2292}if((q|0)==2292){q=0;w=c[i>>2]|0}if((w&63|0)!=28){q=2296;break L2954}n=((c[i>>2]|0)>>>14)-131071|0;if((n|0)==-1){u=-1;v=-1;break L2954}i=m+1+n|0;if((i|0)==-1){u=-1;v=-1;break}else{m=i}}}}while(0);do{if((q|0)==2296){w=b+28|0;do{if((c[f>>2]|0)==10){x=-1}else{j=c[w>>2]|0;c[w>>2]=-1;m=jI(b,2147450903)|0;if((j|0)==-1){x=m;break}if((m|0)==-1){x=j;break}t=c[(c[b>>2]|0)+12>>2]|0;i=m;while(1){y=t+(i<<2)|0;z=c[y>>2]|0;n=(z>>>14)-131071|0;if((n|0)==-1){break}k=i+1+n|0;if((k|0)==-1){break}else{i=k}}t=j+~i|0;if((((t|0)>-1?t:-t|0)|0)>131071){kC(c[b+12>>2]|0,4784)}else{c[y>>2]=(t<<14)+2147467264|z&16383;x=m;break}}}while(0);t=b+20|0;k=b+24|0;c[k>>2]=c[t>>2];n=e<<6;h=jI(b,n|16387)|0;c[k>>2]=c[t>>2];r=jI(b,n|8388611)|0;c[k>>2]=c[t>>2];if((x|0)==-1){u=h;v=r;break}t=c[w>>2]|0;if((t|0)==-1){c[w>>2]=x;u=h;v=r;break}k=c[(c[b>>2]|0)+12>>2]|0;n=t;while(1){A=k+(n<<2)|0;B=c[A>>2]|0;t=(B>>>14)-131071|0;if((t|0)==-1){break}s=n+1+t|0;if((s|0)==-1){break}else{n=s}}k=x+~n|0;if((((k|0)>-1?k:-k|0)|0)>131071){kC(c[b+12>>2]|0,4784)}else{c[A>>2]=(k<<14)+2147467264|B&16383;u=h;v=r;break}}}while(0);B=c[b+20>>2]|0;c[b+24>>2]=B;A=c[l>>2]|0;L2992:do{if((A|0)!=-1){x=b|0;z=(e|0)==255;y=e<<6&16320;k=A;while(1){w=c[(c[x>>2]|0)+12>>2]|0;s=w+(k<<2)|0;t=c[s>>2]|0;C=(t>>>14)-131071|0;if((C|0)==-1){D=-1}else{D=k+1+C|0}if((k|0)>0){C=w+(k-1<<2)|0;w=c[C>>2]|0;if((a[1256+(w&63)|0]|0)<0){E=C;F=w}else{q=2320}}else{q=2320}if((q|0)==2320){q=0;E=s;F=t}if((F&63|0)==28){w=F>>>23;if(z|(w|0)==(e|0)){G=F&8372224|w<<6|27}else{G=F&-16321|y}c[E>>2]=G;w=(c[(c[x>>2]|0)+12>>2]|0)+(k<<2)|0;C=B+~k|0;if((((C|0)>-1?C:-C|0)|0)>131071){q=2326;break}c[w>>2]=c[w>>2]&16383|(C<<14)+2147467264}else{C=u+~k|0;if((((C|0)>-1?C:-C|0)|0)>131071){q=2329;break}c[s>>2]=t&16383|(C<<14)+2147467264}if((D|0)==-1){break L2992}else{k=D}}if((q|0)==2329){kC(c[b+12>>2]|0,4784)}else if((q|0)==2326){kC(c[b+12>>2]|0,4784)}}}while(0);D=c[g>>2]|0;if((D|0)==-1){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}u=b|0;G=e<<6;E=G&16320;if((e|0)==255){F=D;while(1){A=c[(c[u>>2]|0)+12>>2]|0;k=A+(F<<2)|0;x=c[k>>2]|0;y=(x>>>14)-131071|0;if((y|0)==-1){H=-1}else{H=F+1+y|0}if((F|0)>0){y=A+(F-1<<2)|0;A=c[y>>2]|0;if((a[1256+(A&63)|0]|0)<0){I=y;J=A}else{q=2338}}else{q=2338}if((q|0)==2338){q=0;I=k;J=x}if((J&63|0)==28){c[I>>2]=J&8372224|J>>>23<<6|27;A=(c[(c[u>>2]|0)+12>>2]|0)+(F<<2)|0;y=B+~F|0;if((((y|0)>-1?y:-y|0)|0)>131071){q=2362;break}c[A>>2]=c[A>>2]&16383|(y<<14)+2147467264}else{y=v+~F|0;if((((y|0)>-1?y:-y|0)|0)>131071){q=2364;break}c[k>>2]=x&16383|(y<<14)+2147467264}if((H|0)==-1){q=2368;break}else{F=H}}if((q|0)==2362){K=b+12|0;L=c[K>>2]|0;kC(L,4784)}else if((q|0)==2364){M=b+12|0;N=c[M>>2]|0;kC(N,4784)}else if((q|0)==2368){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}}else{O=D}while(1){D=c[(c[u>>2]|0)+12>>2]|0;H=D+(O<<2)|0;F=c[H>>2]|0;J=(F>>>14)-131071|0;if((J|0)==-1){P=-1}else{P=O+1+J|0}if((O|0)>0){J=D+(O-1<<2)|0;D=c[J>>2]|0;if((a[1256+(D&63)|0]|0)<0){Q=J;R=D}else{q=2349}}else{q=2349}if((q|0)==2349){q=0;Q=H;R=F}if((R&63|0)==28){if((R>>>23|0)==(e|0)){S=R&8372224|G|27}else{S=R&-16321|E}c[Q>>2]=S;D=(c[(c[u>>2]|0)+12>>2]|0)+(O<<2)|0;J=B+~O|0;if((((J|0)>-1?J:-J|0)|0)>131071){q=2363;break}c[D>>2]=c[D>>2]&16383|(J<<14)+2147467264}else{J=v+~O|0;if((((J|0)>-1?J:-J|0)|0)>131071){q=2365;break}c[H>>2]=F&16383|(J<<14)+2147467264}if((P|0)==-1){q=2369;break}else{O=P}}if((q|0)==2363){K=b+12|0;L=c[K>>2]|0;kC(L,4784)}else if((q|0)==2365){M=b+12|0;N=c[M>>2]|0;kC(N,4784)}else if((q|0)==2369){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}}function jU(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;jR(a,b);do{if((c[b>>2]|0)==6){e=b+8|0;f=c[e>>2]|0;if((c[b+16>>2]|0)==(c[b+20>>2]|0)){g=f;return g|0}if((f|0)<(d[a+46|0]|0|0)){h=e;break}jT(a,b,f);g=c[e>>2]|0;return g|0}else{h=b+8|0}}while(0);jS(a,b);g=c[h>>2]|0;return g|0}function jV(a,b){a=a|0;b=b|0;var e=0,f=0;e=b|0;do{if((c[e>>2]|0)==8){if((c[b+16>>2]|0)!=(c[b+20>>2]|0)){break}return}}while(0);jR(a,b);do{if((c[e>>2]|0)==6){f=c[b+8>>2]|0;if((c[b+16>>2]|0)==(c[b+20>>2]|0)){return}if((f|0)<(d[a+46|0]|0|0)){break}jT(a,b,f);return}}while(0);jS(a,b);return}function jW(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;e=b+16|0;f=b+20|0;if((c[e>>2]|0)==(c[f>>2]|0)){jR(a,b);return}jR(a,b);do{if((c[b>>2]|0)==6){g=c[b+8>>2]|0;if((c[e>>2]|0)==(c[f>>2]|0)){return}if((g|0)<(d[a+46|0]|0|0)){break}jT(a,b,g);return}}while(0);jS(a,b);return}function jX(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0;e=i;i=i+72|0;f=e|0;g=e+8|0;j=e+24|0;k=e+40|0;l=e+56|0;m=b+16|0;n=b+20|0;o=(c[m>>2]|0)==(c[n>>2]|0);jR(a,b);p=b|0;L3106:do{if(!o){do{if((c[p>>2]|0)==6){q=c[b+8>>2]|0;if((c[m>>2]|0)==(c[n>>2]|0)){break L3106}if((q|0)<(d[a+46|0]|0|0)){break}jT(a,b,q);break L3106}}while(0);jS(a,b)}}while(0);o=c[p>>2]|0;L3114:do{switch(o|0){case 4:{r=c[b+8>>2]|0;s=2421;break};case 2:case 3:case 1:{if((c[a+32>>2]|0)>=256){break L3114}if((o|0)==1){c[l+8>>2]=0;c[k>>2]=c[a+4>>2];c[k+8>>2]=69;t=jN(a,k,l)|0}else{c[j>>2]=(o|0)==2;c[j+8>>2]=1;t=jN(a,j,j)|0}c[b+8>>2]=t;c[p>>2]=4;u=t|256;i=e;return u|0};case 5:{q=b+8|0;v=+h[q>>3];h[f>>3]=v;w=c[(c[a+12>>2]|0)+52>>2]|0;h[g>>3]=v;c[g+8>>2]=3;if(v==0.0){x=w+8|0;y=c[x>>2]|0;c[x>>2]=y+16;z=hH(w,f,8)|0;c[y>>2]=z;c[y+8>>2]=d[z+4|0]|0|64;z=jN(a,(c[x>>2]|0)-16|0,g)|0;c[x>>2]=(c[x>>2]|0)-16;A=z}else{A=jN(a,g,g)|0}c[q>>2]=A;c[p>>2]=4;r=A;s=2421;break};default:{}}}while(0);do{if((s|0)==2421){if((r|0)>=256){break}u=r|256;i=e;return u|0}}while(0);jR(a,b);do{if((c[p>>2]|0)==6){r=b+8|0;s=c[r>>2]|0;if((c[m>>2]|0)==(c[n>>2]|0)){u=s;i=e;return u|0}if((s|0)<(d[a+46|0]|0|0)){B=r;break}jT(a,b,s);u=c[r>>2]|0;i=e;return u|0}else{B=b+8|0}}while(0);jS(a,b);u=c[B>>2]|0;i=e;return u|0}function jY(b,f,g){b=b|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0;h=c[f>>2]|0;if((h|0)==7){do{if((c[g>>2]|0)==6){i=c[g+8>>2]|0;if((i&256|0)!=0){break}if((d[b+46|0]|0)>(i|0)){break}i=b+48|0;a[i]=(a[i]|0)-1&255}}while(0);jT(b,g,c[f+8>>2]|0);return}else if((h|0)==8){jR(b,g);do{if((c[g>>2]|0)==6){i=g+8|0;j=c[i>>2]|0;if((c[g+16>>2]|0)==(c[g+20>>2]|0)){k=j;break}if((j|0)<(d[b+46|0]|0)){l=i;m=2446;break}jT(b,g,j);k=c[i>>2]|0}else{l=g+8|0;m=2446}}while(0);if((m|0)==2446){jS(b,g);k=c[l>>2]|0}jI(b,k<<6|c[f+8>>2]<<23|9)|0}else if((h|0)==9){h=f+8|0;f=h;k=(a[f+3|0]|0)==7?10:8;l=jX(b,g)|0;jI(b,l<<14|k|d[f+2|0]<<6|e[h>>1]<<23)|0}if((c[g>>2]|0)!=6){return}h=c[g+8>>2]|0;if((h&256|0)!=0){return}if((d[b+46|0]|0)>(h|0)){return}h=b+48|0;a[h]=(a[h]|0)-1&255;return}function jZ(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;jR(b,e);g=e|0;do{if((c[g>>2]|0)==6){h=e+8|0;i=c[h>>2]|0;if((c[e+16>>2]|0)==(c[e+20>>2]|0)){j=h;break}if((i|0)<(d[b+46|0]|0|0)){k=h;l=2464;break}jT(b,e,i);j=h}else{k=e+8|0;l=2464}}while(0);if((l|0)==2464){jS(b,e);j=k}k=c[j>>2]|0;do{if((c[g>>2]|0)==6){if((k&256|0)!=0){break}if((d[b+46|0]|0|0)>(k|0)){break}e=b+48|0;a[e]=(a[e]|0)-1&255}}while(0);e=b+48|0;c[j>>2]=d[e]|0;c[g>>2]=6;g=a[e]|0;l=(g&255)+2|0;h=(c[b>>2]|0)+78|0;do{if(l>>>0>(d[h]|0)>>>0){if(l>>>0>249){kC(c[b+12>>2]|0,3608)}else{a[h]=l&255;m=a[e]|0;break}}else{m=g}}while(0);a[e]=m+2&255;m=c[j>>2]|0;jI(b,k<<23|m<<6|(jX(b,f)|0)<<14|12)|0;if((c[f>>2]|0)!=6){return}m=c[f+8>>2]|0;if((m&256|0)!=0){return}if((d[b+46|0]|0|0)>(m|0)){return}a[e]=(a[e]|0)-1&255;return}function j_(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;jR(b,e);f=e|0;g=c[f>>2]|0;L3204:do{if((g|0)==10){h=c[(c[b>>2]|0)+12>>2]|0;i=e+8|0;j=c[i>>2]|0;k=h+(j<<2)|0;if((j|0)>0){l=h+(j-1<<2)|0;j=c[l>>2]|0;if((a[1256+(j&63)|0]|0)<0){m=l;n=j}else{o=2485}}else{o=2485}if((o|0)==2485){m=k;n=c[k>>2]|0}c[m>>2]=((n&16320|0)==0)<<6|n&-16321;p=c[i>>2]|0;o=2499}else if(!((g|0)==4|(g|0)==5|(g|0)==2)){i=e+8|0;do{if((g|0)==11){k=c[(c[(c[b>>2]|0)+12>>2]|0)+(c[i>>2]<<2)>>2]|0;if((k&63|0)!=20){o=2490;break}j=b+20|0;c[j>>2]=(c[j>>2]|0)-1;p=j7(b,27,k>>>23,0,1)|0;o=2499;break L3204}else if((g|0)==6){o=2495}else{o=2490}}while(0);if((o|0)==2490){k=b+48|0;j=a[k]|0;l=(j&255)+1|0;h=(c[b>>2]|0)+78|0;do{if(l>>>0>(d[h]|0)>>>0){if(l>>>0>249){kC(c[b+12>>2]|0,3608)}else{a[h]=l&255;q=a[k]|0;break}}else{q=j}}while(0);j=q+1&255;a[k]=j;j8(b,e,(j&255)-1|0);if((c[f>>2]|0)==6){o=2495}}do{if((o|0)==2495){j=c[i>>2]|0;if((j&256|0)!=0){break}if((d[b+46|0]|0)>(j|0)){break}j=b+48|0;a[j]=(a[j]|0)-1&255}}while(0);p=j7(b,28,255,c[i>>2]|0,0)|0;o=2499}}while(0);do{if((o|0)==2499){f=e+20|0;if((p|0)==-1){break}q=c[f>>2]|0;if((q|0)==-1){c[f>>2]=p;break}f=c[(c[b>>2]|0)+12>>2]|0;g=q;while(1){r=f+(g<<2)|0;s=c[r>>2]|0;q=(s>>>14)-131071|0;if((q|0)==-1){break}n=g+1+q|0;if((n|0)==-1){break}else{g=n}}f=p+~g|0;if((((f|0)>-1?f:-f|0)|0)>131071){kC(c[b+12>>2]|0,4784)}else{c[r>>2]=(f<<14)+2147467264|s&16383;break}}}while(0);s=e+16|0;e=c[s>>2]|0;c[b+24>>2]=c[b+20>>2];r=b+28|0;if((e|0)==-1){c[s>>2]=-1;return}p=c[r>>2]|0;if((p|0)==-1){c[r>>2]=e;c[s>>2]=-1;return}r=c[(c[b>>2]|0)+12>>2]|0;o=p;while(1){t=r+(o<<2)|0;u=c[t>>2]|0;p=(u>>>14)-131071|0;if((p|0)==-1){break}f=o+1+p|0;if((f|0)==-1){break}else{o=f}}r=e+~o|0;if((((r|0)>-1?r:-r|0)|0)>131071){kC(c[b+12>>2]|0,4784)}c[t>>2]=(r<<14)+2147467264|u&16383;c[s>>2]=-1;return}function j$(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;jR(b,e);f=e|0;g=c[f>>2]|0;L3258:do{if((g|0)==10){h=c[e+8>>2]|0;i=2535}else if(!((g|0)==1|(g|0)==3)){j=e+8|0;do{if((g|0)==11){k=c[(c[(c[b>>2]|0)+12>>2]|0)+(c[j>>2]<<2)>>2]|0;if((k&63|0)!=20){i=2526;break}l=b+20|0;c[l>>2]=(c[l>>2]|0)-1;h=j7(b,27,k>>>23,0,0)|0;i=2535;break L3258}else if((g|0)==6){i=2531}else{i=2526}}while(0);if((i|0)==2526){k=b+48|0;l=a[k]|0;m=(l&255)+1|0;n=(c[b>>2]|0)+78|0;do{if(m>>>0>(d[n]|0)>>>0){if(m>>>0>249){kC(c[b+12>>2]|0,3608)}else{a[n]=m&255;o=a[k]|0;break}}else{o=l}}while(0);l=o+1&255;a[k]=l;j8(b,e,(l&255)-1|0);if((c[f>>2]|0)==6){i=2531}}do{if((i|0)==2531){l=c[j>>2]|0;if((l&256|0)!=0){break}if((d[b+46|0]|0|0)>(l|0)){break}l=b+48|0;a[l]=(a[l]|0)-1&255}}while(0);h=j7(b,28,255,c[j>>2]|0,1)|0;i=2535}}while(0);do{if((i|0)==2535){f=e+16|0;if((h|0)==-1){break}o=c[f>>2]|0;if((o|0)==-1){c[f>>2]=h;break}f=c[(c[b>>2]|0)+12>>2]|0;g=o;while(1){p=f+(g<<2)|0;q=c[p>>2]|0;o=(q>>>14)-131071|0;if((o|0)==-1){break}k=g+1+o|0;if((k|0)==-1){break}else{g=k}}f=h+~g|0;if((((f|0)>-1?f:-f|0)|0)>131071){kC(c[b+12>>2]|0,4784)}else{c[p>>2]=(f<<14)+2147467264|q&16383;break}}}while(0);q=e+20|0;e=c[q>>2]|0;c[b+24>>2]=c[b+20>>2];p=b+28|0;if((e|0)==-1){c[q>>2]=-1;return}h=c[p>>2]|0;if((h|0)==-1){c[p>>2]=e;c[q>>2]=-1;return}p=c[(c[b>>2]|0)+12>>2]|0;i=h;while(1){r=p+(i<<2)|0;s=c[r>>2]|0;h=(s>>>14)-131071|0;if((h|0)==-1){break}f=i+1+h|0;if((f|0)==-1){break}else{i=f}}p=e+~i|0;if((((p|0)>-1?p:-p|0)|0)>131071){kC(c[b+12>>2]|0,4784)}c[r>>2]=(p<<14)+2147467264|s&16383;c[q>>2]=-1;return}function j0(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0;g=e+8|0;h=g;a[h+2|0]=c[g>>2]&255;b[g>>1]=(jX(d,f)|0)&65535;f=e|0;a[h+3|0]=(c[f>>2]|0)==8?8:7;c[f>>2]=9;return}function j1(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;j=i;i=i+24|0;k=j|0;c[k+20>>2]=-1;c[k+16>>2]=-1;c[k>>2]=5;h[k+8>>3]=0.0;if((e|0)==0){l=f|0;do{if((c[l>>2]|0)==5){if((c[f+16>>2]|0)!=-1){break}if((c[f+20>>2]|0)!=-1){break}m=f+8|0;h[m>>3]=-0.0- +h[m>>3];i=j;return}}while(0);jR(b,f);do{if((c[l>>2]|0)==6){m=c[f+8>>2]|0;if((c[f+16>>2]|0)==(c[f+20>>2]|0)){break}if((m|0)<(d[b+46|0]|0)){n=2567;break}jT(b,f,m)}else{n=2567}}while(0);if((n|0)==2567){jS(b,f)}j2(b,19,f,k,g);i=j;return}else if((e|0)==1){jR(b,f);l=f|0;L3325:do{switch(c[l>>2]|0){case 6:{n=2582;break};case 1:case 3:{c[l>>2]=2;break};case 4:case 5:case 2:{c[l>>2]=3;break};case 10:{m=c[(c[b>>2]|0)+12>>2]|0;o=c[f+8>>2]|0;p=m+(o<<2)|0;if((o|0)>0){q=m+(o-1<<2)|0;o=c[q>>2]|0;if((a[1256+(o&63)|0]|0)<0){r=q;s=o}else{n=2574}}else{n=2574}if((n|0)==2574){r=p;s=c[p>>2]|0}c[r>>2]=((s&16320|0)==0)<<6|s&-16321;break};case 11:{p=b+48|0;o=a[p]|0;q=(o&255)+1|0;m=(c[b>>2]|0)+78|0;do{if(q>>>0>(d[m]|0)>>>0){if(q>>>0>249){kC(c[b+12>>2]|0,3608)}else{a[m]=q&255;t=a[p]|0;break}}else{t=o}}while(0);o=t+1&255;a[p]=o;j8(b,f,(o&255)-1|0);if((c[l>>2]|0)==6){n=2582;break L3325}u=f+8|0;n=2585;break};default:{}}}while(0);do{if((n|0)==2582){t=f+8|0;s=c[t>>2]|0;if((s&256|0)!=0){u=t;n=2585;break}if((d[b+46|0]|0)>(s|0)){u=t;n=2585;break}s=b+48|0;a[s]=(a[s]|0)-1&255;u=t;n=2585}}while(0);if((n|0)==2585){c[u>>2]=jI(b,c[u>>2]<<23|20)|0;c[l>>2]=11}l=f+20|0;u=c[l>>2]|0;t=f+16|0;s=c[t>>2]|0;c[l>>2]=s;c[t>>2]=u;if((s|0)==-1){v=u}else{u=b|0;l=s;s=c[(c[u>>2]|0)+12>>2]|0;while(1){r=s+(l<<2)|0;if((l|0)>0){o=s+(l-1<<2)|0;q=c[o>>2]|0;if((a[1256+(q&63)|0]|0)<0){w=o;x=q}else{n=2590}}else{n=2590}if((n|0)==2590){n=0;w=r;x=c[r>>2]|0}if((x&63|0)==28){c[w>>2]=x&8372224|x>>>23<<6|27;y=c[(c[u>>2]|0)+12>>2]|0}else{y=s}r=((c[y+(l<<2)>>2]|0)>>>14)-131071|0;if((r|0)==-1){break}q=l+1+r|0;if((q|0)==-1){break}else{l=q;s=y}}v=c[t>>2]|0}if((v|0)==-1){i=j;return}t=b|0;y=v;v=c[(c[t>>2]|0)+12>>2]|0;while(1){s=v+(y<<2)|0;if((y|0)>0){l=v+(y-1<<2)|0;u=c[l>>2]|0;if((a[1256+(u&63)|0]|0)<0){z=l;A=u}else{n=2600}}else{n=2600}if((n|0)==2600){n=0;z=s;A=c[s>>2]|0}if((A&63|0)==28){c[z>>2]=A&8372224|A>>>23<<6|27;B=c[(c[t>>2]|0)+12>>2]|0}else{B=v}s=((c[B+(y<<2)>>2]|0)>>>14)-131071|0;if((s|0)==-1){n=2616;break}u=y+1+s|0;if((u|0)==-1){n=2614;break}else{y=u;v=B}}if((n|0)==2614){i=j;return}else if((n|0)==2616){i=j;return}}else if((e|0)==2){jR(b,f);do{if((c[f>>2]|0)==6){e=c[f+8>>2]|0;if((c[f+16>>2]|0)==(c[f+20>>2]|0)){break}if((e|0)<(d[b+46|0]|0)){n=2609;break}jT(b,f,e)}else{n=2609}}while(0);if((n|0)==2609){jS(b,f)}j2(b,21,f,k,g);i=j;return}else{i=j;return}}function j2(b,e,f,g,i){b=b|0;e=e|0;f=f|0;g=g|0;i=i|0;var j=0,k=0.0,l=0,m=0,n=0;j=f|0;do{if((c[j>>2]|0)==5){if((c[f+16>>2]|0)!=-1){break}if((c[f+20>>2]|0)!=-1){break}if((c[g>>2]|0)!=5){break}if((c[g+16>>2]|0)!=-1){break}if((c[g+20>>2]|0)!=-1){break}k=+h[g+8>>3];if((e-16|0)>>>0<2&k==0.0){break}l=f+8|0;h[l>>3]=+gS(e-13|0,+h[l>>3],k);return}}while(0);if((e|0)==21|(e|0)==19){m=0}else{m=jX(b,g)|0}l=jX(b,f)|0;do{if((l|0)>(m|0)){do{if((c[j>>2]|0)==6){n=c[f+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1&255}}while(0);if((c[g>>2]|0)!=6){break}n=c[g+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1&255}else{do{if((c[g>>2]|0)==6){n=c[g+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1&255}}while(0);if((c[j>>2]|0)!=6){break}n=c[f+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1&255}}while(0);c[f+8>>2]=jI(b,m<<14|e|l<<23)|0;c[j>>2]=11;c[(c[(c[b>>2]|0)+20>>2]|0)+((c[b+20>>2]|0)-1<<2)>>2]=i;return}function j3(a,b,d){a=a|0;b=b|0;d=d|0;switch(b|0){case 6:{jS(a,d);return};case 0:case 1:case 2:case 3:case 4:case 5:{do{if((c[d>>2]|0)==5){if((c[d+16>>2]|0)!=-1){break}if((c[d+20>>2]|0)!=-1){break}return}}while(0);jX(a,d)|0;return};case 13:{j_(a,d);return};case 14:{j$(a,d);return};default:{jX(a,d)|0;return}}}function j4(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;switch(e|0){case 0:case 1:case 2:case 3:case 4:case 5:{j2(b,e+13|0,f,g,h);return};case 13:{jR(b,g);i=g+20|0;j=c[f+20>>2]|0;do{if((j|0)!=-1){k=c[i>>2]|0;if((k|0)==-1){c[i>>2]=j;break}l=c[(c[b>>2]|0)+12>>2]|0;m=k;while(1){n=l+(m<<2)|0;o=c[n>>2]|0;k=(o>>>14)-131071|0;if((k|0)==-1){break}p=m+1+k|0;if((p|0)==-1){break}else{m=p}}l=j+~m|0;if((((l|0)>-1?l:-l|0)|0)>131071){kC(c[b+12>>2]|0,4784)}else{c[n>>2]=(l<<14)+2147467264|o&16383;break}}}while(0);o=f;n=g;c[o>>2]=c[n>>2];c[o+4>>2]=c[n+4>>2];c[o+8>>2]=c[n+8>>2];c[o+12>>2]=c[n+12>>2];c[o+16>>2]=c[n+16>>2];c[o+20>>2]=c[n+20>>2];return};case 10:case 11:case 12:{n=e+14|0;o=jX(b,f)|0;j=jX(b,g)|0;do{if((c[g>>2]|0)==6){i=c[g+8>>2]|0;if((i&256|0)!=0){break}if((d[b+46|0]|0|0)>(i|0)){break}i=b+48|0;a[i]=(a[i]|0)-1&255}}while(0);i=f|0;l=f+8|0;do{if((c[i>>2]|0)==6){p=c[l>>2]|0;if((p&256|0)!=0){break}if((d[b+46|0]|0|0)>(p|0)){break}p=b+48|0;a[p]=(a[p]|0)-1&255}}while(0);p=(n|0)==24;c[l>>2]=j7(b,n,p&1^1,p?o:j,p?j:o)|0;c[i>>2]=10;return};case 6:{i=g+16|0;o=g+20|0;j=(c[i>>2]|0)==(c[o>>2]|0);jR(b,g);p=g|0;L3475:do{if(!j){do{if((c[p>>2]|0)==6){n=c[g+8>>2]|0;if((c[i>>2]|0)==(c[o>>2]|0)){break L3475}if((n|0)<(d[b+46|0]|0|0)){break}jT(b,g,n);break L3475}}while(0);jS(b,g)}}while(0);do{if((c[p>>2]|0)==11){o=g+8|0;i=c[o>>2]|0;j=(c[b>>2]|0)+12|0;m=c[j>>2]|0;n=c[m+(i<<2)>>2]|0;if((n&63|0)!=22){break}l=f|0;k=f+8|0;do{if((c[l>>2]|0)==6){q=c[k>>2]|0;if((q&256|0)!=0){r=i;s=m;t=n;break}if((d[b+46|0]|0|0)>(q|0)){r=i;s=m;t=n;break}q=b+48|0;a[q]=(a[q]|0)-1&255;q=c[o>>2]|0;u=c[j>>2]|0;r=q;s=u;t=c[u+(q<<2)>>2]|0}else{r=i;s=m;t=n}}while(0);c[s+(r<<2)>>2]=c[k>>2]<<23|t&8388607;c[l>>2]=11;c[k>>2]=c[o>>2];return}}while(0);jS(b,g);j2(b,22,f,g,h);return};case 14:{jR(b,g);h=g+16|0;t=c[f+16>>2]|0;do{if((t|0)!=-1){r=c[h>>2]|0;if((r|0)==-1){c[h>>2]=t;break}s=c[(c[b>>2]|0)+12>>2]|0;p=r;while(1){v=s+(p<<2)|0;w=c[v>>2]|0;r=(w>>>14)-131071|0;if((r|0)==-1){break}n=p+1+r|0;if((n|0)==-1){break}else{p=n}}s=t+~p|0;if((((s|0)>-1?s:-s|0)|0)>131071){kC(c[b+12>>2]|0,4784)}else{c[v>>2]=(s<<14)+2147467264|w&16383;break}}}while(0);w=f;v=g;c[w>>2]=c[v>>2];c[w+4>>2]=c[v+4>>2];c[w+8>>2]=c[v+8>>2];c[w+12>>2]=c[v+12>>2];c[w+16>>2]=c[v+16>>2];c[w+20>>2]=c[v+20>>2];return};case 7:case 8:case 9:{v=e+17|0;e=jX(b,f)|0;w=jX(b,g)|0;do{if((c[g>>2]|0)==6){t=c[g+8>>2]|0;if((t&256|0)!=0){break}if((d[b+46|0]|0|0)>(t|0)){break}t=b+48|0;a[t]=(a[t]|0)-1&255}}while(0);g=f|0;t=f+8|0;do{if((c[g>>2]|0)==6){f=c[t>>2]|0;if((f&256|0)!=0){break}if((d[b+46|0]|0|0)>(f|0)){break}f=b+48|0;a[f]=(a[f]|0)-1&255}}while(0);c[t>>2]=j7(b,v,1,e,w)|0;c[g>>2]=10;return};default:{return}}}function j5(a,b){a=a|0;b=b|0;c[(c[(c[a>>2]|0)+20>>2]|0)+((c[a+20>>2]|0)-1<<2)>>2]=b;return}function j6(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=((e-1|0)/50|0)+1|0;e=(f|0)==-1?0:f;if((g|0)<512){f=d<<6|e<<23|g<<14|36;jI(b,f)|0;h=d+1|0;i=h&255;j=b+48|0;a[j]=i;return}if((g|0)>=67108864){kC(c[b+12>>2]|0,10208)}jI(b,d<<6|e<<23|36)|0;jI(b,g<<6|39)|0;h=d+1|0;i=h&255;j=b+48|0;a[j]=i;return}function j7(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;jI(a,d<<6|b|e<<23|f<<14)|0;f=a+28|0;e=c[f>>2]|0;c[f>>2]=-1;f=jI(a,2147450903)|0;if((e|0)==-1){g=f;return g|0}if((f|0)==-1){g=e;return g|0}b=c[(c[a>>2]|0)+12>>2]|0;d=f;while(1){h=b+(d<<2)|0;i=c[h>>2]|0;j=(i>>>14)-131071|0;if((j|0)==-1){break}k=d+1+j|0;if((k|0)==-1){break}else{d=k}}b=e+~d|0;if((((b|0)>-1?b:-b|0)|0)>131071){kC(c[a+12>>2]|0,4784);return 0}c[h>>2]=(b<<14)+2147467264|i&16383;g=f;return g|0}function j8(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0;f=i;i=i+24|0;g=f|0;j=f+8|0;jR(a,b);k=b|0;l=c[k>>2]|0;L3548:do{switch(l|0){case 3:case 2:{jI(a,e<<6|((l|0)==2)<<23|3)|0;break};case 1:{m=e+1|0;n=c[a+20>>2]|0;do{if((n|0)>(c[a+24>>2]|0)){o=(c[(c[a>>2]|0)+12>>2]|0)+(n-1<<2)|0;p=c[o>>2]|0;if((p&63|0)!=4){break}q=p>>>6&255;r=q+(p>>>23)|0;if((q|0)>(e|0)){s=2755}else{if((r+1|0)<(e|0)){s=2755}}if((s|0)==2755){if((q|0)<(e|0)|(q|0)>(m|0)){break}}t=(q|0)<(e|0)?q:e;c[o>>2]=t<<6&16320|p&8372287|((r|0)>(e|0)?r:e)-t<<23;break L3548}}while(0);jI(a,e<<6|4)|0;break};case 4:{m=c[b+8>>2]|0;n=e<<6;if((m|0)<262144){t=n|m<<14|1;jI(a,t)|0;break L3548}else{t=n|2;jI(a,t)|0;t=m<<6|39;jI(a,t)|0;break L3548}break};case 11:{t=(c[(c[a>>2]|0)+12>>2]|0)+(c[b+8>>2]<<2)|0;c[t>>2]=c[t>>2]&-16321|e<<6&16320;break};case 5:{u=+h[b+8>>3];h[g>>3]=u;t=c[(c[a+12>>2]|0)+52>>2]|0;h[j>>3]=u;c[j+8>>2]=3;if(u==0.0){m=t+8|0;n=c[m>>2]|0;c[m>>2]=n+16;r=hH(t,g,8)|0;c[n>>2]=r;c[n+8>>2]=d[r+4|0]|0|64;r=jN(a,(c[m>>2]|0)-16|0,j)|0;c[m>>2]=(c[m>>2]|0)-16;v=r}else{v=jN(a,j,j)|0}r=e<<6;if((v|0)<262144){m=r|v<<14|1;jI(a,m)|0;break L3548}else{m=r|2;jI(a,m)|0;m=v<<6|39;jI(a,m)|0;break L3548}break};case 6:{m=c[b+8>>2]|0;if((m|0)==(e|0)){break L3548}jI(a,m<<23|e<<6)|0;break};default:{i=f;return}}}while(0);c[b+8>>2]=e;c[k>>2]=6;i=f;return}function j9(a){a=a|0;dn(a,0,6);et(a,2144,0);return 1}function ka(a){a=a|0;var b=0;d2(a,1,6);b=hx(a)|0;cR(a,1);cH(a,b,1);return 1}function kb(a){a=a|0;var b=0,c=0,d=0;b=c4(a,1)|0;if((b|0)==0){dQ(a,1,2520)|0}c=kh(a,b,(cL(a)|0)-1|0)|0;if((c|0)<0){df(a,0);cO(a,-2);d=2;return d|0}else{df(a,1);cO(a,~c);d=c+1|0;return d|0}return 0}function kc(a){a=a|0;df(a,dh(a)|0);return 2}function kd(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;i=i+104|0;c=b|0;d=c4(a,1)|0;if((d|0)==0){dQ(a,1,2520)|0}do{if((d|0)==(a|0)){da(a,7904,7)|0}else{e=dE(d)|0;if((e|0)==0){if((eF(d,0,c)|0)>0){da(a,11496,6)|0;break}if((cL(d)|0)==0){da(a,11192,4)|0;break}else{da(a,11856,9)|0;break}}else if((e|0)==1){da(a,11856,9)|0;break}else{da(a,11192,4)|0;break}}}while(0);i=b;return 1}function ke(a){a=a|0;var b=0;d2(a,1,6);b=hx(a)|0;cR(a,1);cH(a,b,1);de(a,72,1);return 1}function kf(a){a=a|0;return e1(a,cL(a)|0,0,0)|0}function kg(a){a=a|0;var b=0,c=0,d=0;b=c4(a,-1001001)|0;c=kh(a,b,cL(a)|0)|0;if((c|0)>=0){d=c;return d|0}if((cW(a,-1)|0)!=0){dT(a,1);cO(a,-2);dI(a,2)}d=dG(a)|0;return d|0}function kh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((cF(b,c)|0)==0){da(a,3568,28)|0;d=-1;return d|0}do{if((dE(b)|0)==0){if((cL(b)|0)!=0){break}da(a,3120,28)|0;d=-1;return d|0}}while(0);cH(a,b,c);if((e_(b,a,c)|0)>>>0>=2){cH(b,a,1);d=-1;return d|0}c=cL(b)|0;if((cF(a,c+1|0)|0)==0){cM(b,~c);da(a,2784,26)|0;d=-1;return d|0}else{cH(b,a,c);d=c;return d|0}return 0}function ki(a){a=a|0;dn(a,0,16);et(a,2008,0);return 1}function kj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+256|0;d=c[n>>2]|0;aw(4416,11,1,d|0)|0;au(d|0)|0;e=b|0;f=c[m>>2]|0;if((aR(e|0,250,f|0)|0)==0){i=b;return 0}while(1){if((aJ(e|0,4352)|0)==0){g=2833;break}if((ek(a,e,kU(e|0)|0,4200,0)|0)==0){if((dA(a,0,0,0,0,0)|0)!=0){g=2830}}else{g=2830}if((g|0)==2830){g=0;h=c1(a,-1,0)|0;bM(d|0,4112,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j;au(d|0)|0}cM(a,0);aw(4416,11,1,d|0)|0;au(d|0)|0;if((aR(e|0,250,f|0)|0)==0){g=2832;break}}if((g|0)==2832){i=b;return 0}else if((g|0)==2833){i=b;return 0}return 0}function kk(a){a=a|0;if((cS(a,1)|0)==7){dq(a,1);return 1}else{c6(a);return 1}return 0}
function kl(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;c=i;i=i+8|0;d=c|0;if((cS(b,1)|0)==8){e=c4(b,1)|0}else{e=b}f=eD(e)|0;g=eC(e)|0;if((g|0)!=0&(g|0)!=12){da(b,4560,13)|0}else{eu(b,-1001e3,9800)|0;dh(e)|0;cH(e,b,1);dl(b,-2);cN(b,-2)}g=d|0;if((f&1|0)==0){h=0}else{a[g]=99;h=1}if((f&2|0)==0){j=h}else{a[d+h|0]=114;j=h+1|0}if((f&4|0)==0){k=j}else{a[d+j|0]=108;k=j+1|0}a[d+k|0]=0;db(b,g)|0;c8(b,eE(e)|0);i=c;return 3}function km(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+104|0;f=e|0;if((cS(b,1)|0)==8){g=c4(b,1)|0;h=1}else{g=b;h=0}j=h|2;k=d$(b,j,7304,0)|0;l=h+1|0;do{if((cV(b,l)|0)==0){if((cS(b,l)|0)==6){dd(b,7136,(h=i,i=i+8|0,c[h>>2]=k,h)|0)|0;i=h;h=c1(b,-1,0)|0;cR(b,l);cH(b,g,1);m=h;break}n=dQ(b,l,6904)|0;i=e;return n|0}else{if((eF(g,c_(b,l,0)|0,f)|0)!=0){m=k;break}c6(b);n=1;i=e;return n|0}}while(0);if((eJ(g,m,f)|0)==0){n=dQ(b,j,6720)|0;i=e;return n|0}dn(b,0,2);if((aT(m|0,83)|0)!=0){j=c[f+16>>2]|0;db(b,j)|0;dt(b,-2,6568);j=f+36|0;db(b,j)|0;dt(b,-2,6392);c8(b,c[f+24>>2]|0);dt(b,-2,6232);c8(b,c[f+28>>2]|0);dt(b,-2,6152);j=c[f+12>>2]|0;db(b,j)|0;dt(b,-2,6032)}if((aT(m|0,108)|0)!=0){c8(b,c[f+20>>2]|0);dt(b,-2,5872)}if((aT(m|0,117)|0)!=0){c8(b,d[f+32|0]|0);dt(b,-2,5752);c8(b,d[f+33|0]|0);dt(b,-2,5576);df(b,a[f+34|0]|0);dt(b,-2,5384)}if((aT(m|0,110)|0)!=0){j=c[f+4>>2]|0;db(b,j)|0;dt(b,-2,5184);j=c[f+8>>2]|0;db(b,j)|0;dt(b,-2,5040)}if((aT(m|0,116)|0)!=0){df(b,a[f+35|0]|0);dt(b,-2,4928)}if((aT(m|0,76)|0)!=0){if((g|0)==(b|0)){cR(b,-2);cN(b,-3)}else{cH(g,b,1)}dt(b,-2,4768)}if((aT(m|0,102)|0)==0){n=1;i=e;return n|0}if((g|0)==(b|0)){cR(b,-2);cN(b,-3)}else{cH(g,b,1)}dt(b,-2,4656);n=1;i=e;return n|0}function kn(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+104|0;c=b|0;if((cS(a,1)|0)==8){d=c4(a,1)|0;e=1}else{d=a;e=0}f=d6(a,e|2)|0;g=e+1|0;if((cS(a,g)|0)==6){cR(a,g);e=eG(a,0,f)|0;db(a,e)|0;h=1;i=b;return h|0}if((eF(d,d6(a,g)|0,c)|0)==0){h=dQ(a,g,9968)|0;i=b;return h|0}g=eG(d,c,f)|0;if((g|0)==0){c6(a);h=1;i=b;return h|0}else{cH(d,a,1);db(a,g)|0;cR(a,-2);h=2;i=b;return h|0}return 0}function ko(a){a=a|0;cR(a,-1001e3);return 1}function kp(a){a=a|0;d3(a,1);if((dp(a,1)|0)!=0){return 1}c6(a);return 1}function kq(a){a=a|0;var b=0,c=0,d=0;b=d6(a,2)|0;d2(a,1,6);c=dL(a,1,b)|0;if((c|0)==0){d=0;return d|0}db(a,c)|0;cO(a,-2);d=2;return d|0}function kr(a){a=a|0;var b=0,c=0,e=0,f=0,g=0;b=i;i=i+208|0;c=b|0;e=b+104|0;f=d6(a,2)|0;d2(a,1,6);cR(a,1);eJ(a,7816,e)|0;if((f|0)>0){if((f|0)>(d[e+32|0]|0|0)){g=2916}}else{g=2916}if((g|0)==2916){dQ(a,2,7616)|0}e=d6(a,4)|0;d2(a,3,6);cR(a,3);eJ(a,7816,c)|0;if((e|0)>0){if((e|0)>(d[c+32|0]|0|0)){g=2919}}else{g=2919}if((g|0)==2919){dQ(a,4,7616)|0}if((cU(a,1)|0)!=0){dQ(a,1,7472)|0}if((cU(a,3)|0)==0){dO(a,1,f,3,e);i=b;return 0}dQ(a,3,7472)|0;dO(a,1,f,3,e);i=b;return 0}function ks(a){a=a|0;var b=0,c=0,e=0,f=0;b=i;i=i+104|0;c=b|0;e=d6(a,2)|0;d2(a,1,6);cR(a,1);eJ(a,7816,c)|0;if((e|0)>0){if((e|0)>(d[c+32|0]|0|0)){f=2929}}else{f=2929}if((f|0)==2929){dQ(a,2,7616)|0}dg(a,dN(a,1,e)|0);i=b;return 1}function kt(a){a=a|0;if((cS(a,1)|0)==2){dQ(a,1,7992)|0}d2(a,1,7);if((cS(a,2)|0)>=1){d2(a,2,5)}cM(a,2);dx(a,1);return 1}function ku(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((cS(a,1)|0)==8){b=c4(a,1)|0;c=1}else{b=a;c=0}d=c+1|0;if((cS(a,d)|0)<1){cM(a,d);e=0;f=0;g=0}else{h=d0(a,c|2,0)|0;d2(a,d,6);i=d8(a,c+3|0,0)|0;c=(aT(h|0,99)|0)!=0|0;j=(aT(h|0,114)|0)==0;k=j?c:c|2;c=(aT(h|0,108)|0)==0;h=c?k:k|4;e=(i|0)>0?h|8:h;f=i;g=12}if((eu(a,-1001e3,9800)|0)!=0){l=dh(b)|0;cH(b,a,1);cR(a,d);du(a,-3);m=eB(b,g,e,f)|0;return 0}db(a,9552)|0;dt(a,-2,9336);cR(a,-1);dw(a,-2)|0;l=dh(b)|0;cH(b,a,1);cR(a,d);du(a,-3);m=eB(b,g,e,f)|0;return 0}function kv(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=i;i=i+104|0;c=b|0;if((cS(a,1)|0)==8){d=c4(a,1)|0;e=1}else{d=a;e=0}f=e+1|0;if((eF(d,d6(a,f)|0,c)|0)==0){g=dQ(a,f,9968)|0;i=b;return g|0}else{f=e+3|0;d3(a,f);cM(a,f);cH(a,d,1);f=eI(d,c,d6(a,e|2)|0)|0;db(a,f)|0;g=1;i=b;return g|0}return 0}function kw(a){a=a|0;var b=0;b=cS(a,2)|0;if(!((b|0)==5|(b|0)==0)){dQ(a,2,10184)|0}cM(a,2);dw(a,1)|0;return 1}function kx(a){a=a|0;var b=0,c=0,d=0;d3(a,3);b=d6(a,2)|0;d2(a,1,6);c=dM(a,1,b)|0;if((c|0)==0){d=0;return d|0}db(a,c)|0;cO(a,-1);d=1;return d|0}function ky(a){a=a|0;var b=0,c=0,d=0,e=0;if((cS(a,1)|0)==8){b=c4(a,1)|0;c=1}else{b=a;c=0}d=c+1|0;e=c1(a,d,0)|0;do{if((e|0)==0){if((cS(a,d)|0)<1){break}cR(a,d);return 1}}while(0);dP(a,b,e,d8(a,c|2,(b|0)==(a|0)|0)|0);return 1}function kz(a,b){a=a|0;b=b|0;var d=0;eu(a,-1001e3,9800)|0;dh(a)|0;dl(a,-2);if((cS(a,-1)|0)!=6){return}db(a,c[1808+(c[b>>2]<<2)>>2]|0)|0;d=c[b+20>>2]|0;if((d|0)>-1){c8(a,d)}else{c6(a)}dz(a,2,0,0,0);return}function kA(b){b=b|0;var d=0,e=0,f=0;d=0;do{e=hI(b,c[1e3+(d<<2)>>2]|0)|0;f=e+5|0;a[f]=a[f]|32;d=d+1|0;a[e+6|0]=d&255;}while((d|0)<22);return}function kB(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;if((d|0)>=257){f=c[1e3+(d-257<<2)>>2]|0;if((d|0)>=286){g=f;i=e;return g|0}h=gW(c[b+52>>2]|0,7760,(j=i,i=i+8|0,c[j>>2]=f,j)|0)|0;i=j;g=h;i=e;return g|0}h=c[b+52>>2]|0;if((a[d+729|0]&4)==0){b=gW(h,9920,(j=i,i=i+8|0,c[j>>2]=d,j)|0)|0;i=j;g=b;i=e;return g|0}else{b=gW(h,3064,(j=i,i=i+8|0,c[j>>2]=d,j)|0)|0;i=j;g=b;i=e;return g|0}return 0}function kC(a,b){a=a|0;b=b|0;kD(a,b,c[a+16>>2]|0)}function kD(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+64|0;g=f|0;gX(g,(c[b+68>>2]|0)+16|0,60);f=b+52|0;h=c[b+4>>2]|0;j=gW(c[f>>2]|0,9536,(k=i,i=i+24|0,c[k>>2]=g,c[k+8>>2]=h,c[k+16>>2]=d,k)|0)|0;i=k;if((e|0)==0){l=c[f>>2]|0;eR(l,3)}d=c[f>>2]|0;do{if((e-287|0)>>>0<3){h=b+60|0;g=c[h>>2]|0;m=g+4|0;n=c[m>>2]|0;o=g+8|0;p=c[o>>2]|0;do{if((n+1|0)>>>0>p>>>0){if(p>>>0>2147483645){kD(b,11448,0)}q=p<<1;if((q|0)==-2){gy(d)}else{r=g|0;s=gz(d,c[r>>2]|0,p,q)|0;c[r>>2]=s;c[o>>2]=q;t=c[m>>2]|0;u=s;break}}else{t=n;u=c[g>>2]|0}}while(0);c[m>>2]=t+1;a[u+t|0]=0;g=gW(c[f>>2]|0,7760,(k=i,i=i+8|0,c[k>>2]=c[c[h>>2]>>2],k)|0)|0;i=k;v=g}else{if((e|0)>=257){g=c[1e3+(e-257<<2)>>2]|0;if((e|0)>=286){v=g;break}n=gW(d,7760,(k=i,i=i+8|0,c[k>>2]=g,k)|0)|0;i=k;v=n;break}if((a[e+729|0]&4)==0){n=gW(d,9920,(k=i,i=i+8|0,c[k>>2]=e,k)|0)|0;i=k;v=n;break}else{n=gW(d,3064,(k=i,i=i+8|0,c[k>>2]=e,k)|0)|0;i=k;v=n;break}}}while(0);gW(d,9320,(k=i,i=i+16|0,c[k>>2]=j,c[k+8>>2]=v,k)|0)|0;i=k;l=c[f>>2]|0;eR(l,3)}function kE(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=c[a+52>>2]|0;g=hH(f,b,e)|0;e=f+8|0;b=c[e>>2]|0;c[e>>2]=b+16;c[b>>2]=g;c[b+8>>2]=d[g+4|0]|0|64;b=h7(f,c[(c[a+48>>2]|0)+4>>2]|0,(c[e>>2]|0)-16|0)|0;a=b+8|0;do{if((c[a>>2]|0)==0){c[b>>2]=1;c[a>>2]=1;if((c[(c[f+12>>2]|0)+12>>2]|0)<=0){break}fv(f)}}while(0);c[e>>2]=(c[e>>2]|0)-16;return g|0}function kF(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;a[d+76|0]=46;h=d+52|0;c[h>>2]=b;c[d>>2]=g;c[d+32>>2]=286;c[d+56>>2]=e;c[d+48>>2]=0;c[d+4>>2]=1;c[d+8>>2]=1;c[d+68>>2]=f;f=hI(b,6128)|0;c[d+72>>2]=f;b=f+5|0;a[b]=a[b]|32;b=d+60|0;d=c[b>>2]|0;f=gz(c[h>>2]|0,c[d>>2]|0,c[d+8>>2]|0,32)|0;c[c[b>>2]>>2]=f;c[(c[b>>2]|0)+8>>2]=32;return}function kG(a){a=a|0;var b=0,d=0,e=0;c[a+8>>2]=c[a+4>>2];b=a+32|0;d=b|0;if((c[d>>2]|0)==286){c[a+16>>2]=kH(a,a+24|0)|0;return}else{e=a+16|0;a=b;c[e>>2]=c[a>>2];c[e+4>>2]=c[a+4>>2];c[e+8>>2]=c[a+8>>2];c[e+12>>2]=c[a+12>>2];c[d>>2]=286;return}}function kH(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0;f=i;i=i+16|0;g=f|0;h=b+60|0;c[(c[h>>2]|0)+4>>2]=0;j=b|0;k=b+56|0;L3888:while(1){l=c[j>>2]|0;L3890:while(1){switch(l|0){case 45:{break L3890;break};case 34:case 39:{m=3093;break L3888;break};case 62:{m=3069;break L3888;break};case 46:{m=3195;break L3888;break};case 10:case 13:{m=3028;break L3890;break};case 61:{m=3053;break L3888;break};case 91:{m=3049;break L3888;break};case 58:{m=3085;break L3888;break};case 126:{m=3077;break L3888;break};case 60:{m=3061;break L3888;break};case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:{n=l;break L3888;break};case 32:case 12:case 9:case 11:{break};case-1:{o=286;m=3344;break L3888;break};default:{m=3317;break L3888}}p=c[k>>2]|0;q=c[p>>2]|0;c[p>>2]=q-1;p=c[k>>2]|0;if((q|0)==0){r=iN(p)|0}else{q=p+4|0;p=c[q>>2]|0;c[q>>2]=p+1;r=d[p]|0}c[j>>2]=r;l=r}if((m|0)==3028){m=0;kJ(b);continue}p=c[k>>2]|0;q=c[p>>2]|0;c[p>>2]=q-1;p=c[k>>2]|0;if((q|0)==0){s=iN(p)|0}else{q=p+4|0;p=c[q>>2]|0;c[q>>2]=p+1;s=d[p]|0}c[j>>2]=s;if((s|0)!=45){o=45;m=3348;break}p=c[k>>2]|0;q=c[p>>2]|0;c[p>>2]=q-1;p=c[k>>2]|0;if((q|0)==0){t=iN(p)|0}else{q=p+4|0;p=c[q>>2]|0;c[q>>2]=p+1;t=d[p]|0}c[j>>2]=t;do{if((t|0)==91){p=kK(b)|0;c[(c[h>>2]|0)+4>>2]=0;if((p|0)>-1){kL(b,0,p);c[(c[h>>2]|0)+4>>2]=0;continue L3888}else{u=c[j>>2]|0;break}}else{u=t}}while(0);while(1){if((u|0)==10|(u|0)==13|(u|0)==(-1|0)){continue L3888}p=c[k>>2]|0;q=c[p>>2]|0;c[p>>2]=q-1;p=c[k>>2]|0;if((q|0)==0){v=iN(p)|0}else{q=p+4|0;p=c[q>>2]|0;c[q>>2]=p+1;v=d[p]|0}c[j>>2]=v;u=v}}do{if((m|0)==3093){v=c[h>>2]|0;u=v+4|0;t=c[u>>2]|0;s=v+8|0;r=c[s>>2]|0;do{if((t+1|0)>>>0>r>>>0){if(r>>>0>2147483645){kD(b,11448,0);return 0}p=r<<1;q=c[b+52>>2]|0;if((p|0)==-2){gy(q);return 0}else{w=v|0;x=gz(q,c[w>>2]|0,r,p)|0;c[w>>2]=x;c[s>>2]=p;y=c[u>>2]|0;z=x;break}}else{y=t;z=c[v>>2]|0}}while(0);v=l&255;c[u>>2]=y+1;a[z+y|0]=v;t=c[k>>2]|0;s=c[t>>2]|0;c[t>>2]=s-1;t=c[k>>2]|0;if((s|0)==0){A=iN(t)|0}else{s=t+4|0;t=c[s>>2]|0;c[s>>2]=t+1;A=d[t]|0}c[j>>2]=A;L3937:do{if((A|0)==(l|0)){B=A&255}else{t=b+52|0;s=g|0;r=g+4|0;x=g+8|0;p=A;L3939:while(1){L3941:do{if((p|0)==(-1|0)){m=3106;break L3939}else if((p|0)==10|(p|0)==13){m=3107;break L3939}else if((p|0)==92){w=c[k>>2]|0;q=c[w>>2]|0;c[w>>2]=q-1;w=c[k>>2]|0;if((q|0)==0){C=iN(w)|0}else{q=w+4|0;w=c[q>>2]|0;c[q>>2]=w+1;C=d[w]|0}c[j>>2]=C;switch(C|0){case 10:case 13:{kJ(b);D=10;break};case 92:case 34:case 39:{E=C&255;m=3158;break};case 122:{w=c[k>>2]|0;q=c[w>>2]|0;c[w>>2]=q-1;w=c[k>>2]|0;if((q|0)==0){F=iN(w)|0}else{q=w+4|0;w=c[q>>2]|0;c[q>>2]=w+1;F=d[w]|0}c[j>>2]=F;if((a[F+729|0]&8)==0){G=F;break L3941}else{H=F}while(1){if((H|0)==10|(H|0)==13){kJ(b);I=c[j>>2]|0}else{w=c[k>>2]|0;q=c[w>>2]|0;c[w>>2]=q-1;w=c[k>>2]|0;if((q|0)==0){J=iN(w)|0}else{q=w+4|0;w=c[q>>2]|0;c[q>>2]=w+1;J=d[w]|0}c[j>>2]=J;I=J}if((a[I+729|0]&8)==0){G=I;break L3941}else{H=I}}break};case 97:{E=7;m=3158;break};case-1:{G=-1;break L3941;break};case 98:{E=8;m=3158;break};case 102:{E=12;m=3158;break};case 110:{E=10;m=3158;break};case 114:{E=13;m=3158;break};case 116:{E=9;m=3158;break};case 118:{E=11;m=3158;break};case 120:{c[s>>2]=120;w=c[k>>2]|0;q=c[w>>2]|0;c[w>>2]=q-1;w=c[k>>2]|0;if((q|0)==0){K=iN(w)|0}else{q=w+4|0;w=c[q>>2]|0;c[q>>2]=w+1;K=d[w]|0}c[j>>2]=K;c[r>>2]=K;if((a[K+729|0]&16)==0){L=2;m=3369;break L3939}w=gT(K)|0;q=c[k>>2]|0;M=c[q>>2]|0;c[q>>2]=M-1;q=c[k>>2]|0;if((M|0)==0){N=iN(q)|0}else{M=q+4|0;q=c[M>>2]|0;c[M>>2]=q+1;N=d[q]|0}c[j>>2]=N;c[x>>2]=N;if((a[N+729|0]&16)==0){L=3;m=3368;break L3939}E=(gT(N)|0)+(w<<4)&255;m=3158;break};default:{if((a[C+729|0]&2)==0){m=3143;break L3939}c[s>>2]=C;w=C-48|0;q=c[k>>2]|0;M=c[q>>2]|0;c[q>>2]=M-1;q=c[k>>2]|0;if((M|0)==0){O=iN(q)|0}else{M=q+4|0;q=c[M>>2]|0;c[M>>2]=q+1;O=d[q]|0}c[j>>2]=O;do{if((a[O+729|0]&2)==0){P=1;Q=w}else{c[r>>2]=O;q=(w*10|0)-48+O|0;M=c[k>>2]|0;R=c[M>>2]|0;c[M>>2]=R-1;M=c[k>>2]|0;if((R|0)==0){S=iN(M)|0}else{R=M+4|0;M=c[R>>2]|0;c[R>>2]=M+1;S=d[M]|0}c[j>>2]=S;if((a[S+729|0]&2)==0){P=2;Q=q;break}c[x>>2]=S;M=c[k>>2]|0;R=c[M>>2]|0;c[M>>2]=R-1;M=c[k>>2]|0;if((R|0)==0){T=iN(M)|0}else{R=M+4|0;M=c[R>>2]|0;c[R>>2]=M+1;T=d[M]|0}c[j>>2]=T;P=3;Q=(q*10|0)-48+S|0}}while(0);if((Q|0)>255){m=3149;break L3939}else{D=Q&255}}}if((m|0)==3158){m=0;w=c[k>>2]|0;q=c[w>>2]|0;c[w>>2]=q-1;w=c[k>>2]|0;if((q|0)==0){U=iN(w)|0}else{q=w+4|0;w=c[q>>2]|0;c[q>>2]=w+1;U=d[w]|0}c[j>>2]=U;D=E}w=c[h>>2]|0;q=w+4|0;M=c[q>>2]|0;R=w+8|0;V=c[R>>2]|0;if((M+1|0)>>>0>V>>>0){if(V>>>0>2147483645){m=3165;break L3939}W=V<<1;X=c[t>>2]|0;if((W|0)==-2){m=3167;break L3939}Y=w|0;Z=gz(X,c[Y>>2]|0,V,W)|0;c[Y>>2]=Z;c[R>>2]=W;_=c[q>>2]|0;$=Z}else{_=M;$=c[w>>2]|0}c[q>>2]=_+1;a[$+_|0]=D;G=c[j>>2]|0}else{q=c[h>>2]|0;w=q+4|0;M=c[w>>2]|0;Z=q+8|0;W=c[Z>>2]|0;if((M+1|0)>>>0>W>>>0){if(W>>>0>2147483645){m=3173;break L3939}R=W<<1;aa=c[t>>2]|0;if((R|0)==-2){m=3175;break L3939}Y=q|0;V=gz(aa,c[Y>>2]|0,W,R)|0;c[Y>>2]=V;c[Z>>2]=R;ab=c[w>>2]|0;ac=V}else{ab=M;ac=c[q>>2]|0}c[w>>2]=ab+1;a[ac+ab|0]=p&255;w=c[k>>2]|0;q=c[w>>2]|0;c[w>>2]=q-1;w=c[k>>2]|0;if((q|0)==0){ad=iN(w)|0}else{q=w+4|0;w=c[q>>2]|0;c[q>>2]=w+1;ad=d[w]|0}c[j>>2]=ad;G=ad}}while(0);if((G|0)==(l|0)){B=v;break L3937}else{p=G}}if((m|0)==3106){kD(b,11152,286);return 0}else if((m|0)==3107){kD(b,11152,289);return 0}else if((m|0)==3167){gy(X);return 0}else if((m|0)==3173){kD(b,11448,0);return 0}else if((m|0)==3175){gy(aa);return 0}else if((m|0)==3149){kN(b,s,P,10616);return 0}else if((m|0)==3165){kD(b,11448,0);return 0}else if((m|0)==3143){kN(b,j,1,10824);return 0}else if((m|0)==3368){kN(b,s,L,10440);return 0}else if((m|0)==3369){kN(b,s,L,10440);return 0}}}while(0);v=c[h>>2]|0;u=v+4|0;p=c[u>>2]|0;t=v+8|0;x=c[t>>2]|0;do{if((p+1|0)>>>0>x>>>0){if(x>>>0>2147483645){kD(b,11448,0);return 0}r=x<<1;w=c[b+52>>2]|0;if((r|0)==-2){gy(w);return 0}else{q=v|0;M=gz(w,c[q>>2]|0,x,r)|0;c[q>>2]=M;c[t>>2]=r;ae=c[u>>2]|0;af=M;break}}else{ae=p;af=c[v>>2]|0}}while(0);c[u>>2]=ae+1;a[af+ae|0]=B;v=c[k>>2]|0;p=c[v>>2]|0;c[v>>2]=p-1;v=c[k>>2]|0;if((p|0)==0){ag=iN(v)|0}else{p=v+4|0;v=c[p>>2]|0;c[p>>2]=v+1;ag=d[v]|0}c[j>>2]=ag;v=c[h>>2]|0;p=c[b+52>>2]|0;t=hH(p,(c[v>>2]|0)+1|0,(c[v+4>>2]|0)-2|0)|0;v=p+8|0;x=c[v>>2]|0;c[v>>2]=x+16;c[x>>2]=t;c[x+8>>2]=d[t+4|0]|64;x=h7(p,c[(c[b+48>>2]|0)+4>>2]|0,(c[v>>2]|0)-16|0)|0;M=x+8|0;do{if((c[M>>2]|0)==0){c[x>>2]=1;c[M>>2]=1;if((c[(c[p+12>>2]|0)+12>>2]|0)<=0){break}fv(p)}}while(0);c[v>>2]=(c[v>>2]|0)-16;c[e>>2]=t;o=289;i=f;return o|0}else if((m|0)==3069){p=c[k>>2]|0;M=c[p>>2]|0;c[p>>2]=M-1;p=c[k>>2]|0;if((M|0)==0){ah=iN(p)|0}else{M=p+4|0;p=c[M>>2]|0;c[M>>2]=p+1;ah=d[p]|0}c[j>>2]=ah;if((ah|0)!=61){o=62;i=f;return o|0}p=c[k>>2]|0;M=c[p>>2]|0;c[p>>2]=M-1;p=c[k>>2]|0;if((M|0)==0){ai=iN(p)|0}else{M=p+4|0;p=c[M>>2]|0;c[M>>2]=p+1;ai=d[p]|0}c[j>>2]=ai;o=282;i=f;return o|0}else if((m|0)==3195){p=c[h>>2]|0;M=p+4|0;x=c[M>>2]|0;u=p+8|0;r=c[u>>2]|0;do{if((x+1|0)>>>0>r>>>0){if(r>>>0>2147483645){kD(b,11448,0);return 0}q=r<<1;w=c[b+52>>2]|0;if((q|0)==-2){gy(w);return 0}else{V=p|0;R=gz(w,c[V>>2]|0,r,q)|0;c[V>>2]=R;c[u>>2]=q;aj=c[M>>2]|0;ak=R;break}}else{aj=x;ak=c[p>>2]|0}}while(0);c[M>>2]=aj+1;a[ak+aj|0]=46;p=c[k>>2]|0;x=c[p>>2]|0;c[p>>2]=x-1;p=c[k>>2]|0;if((x|0)==0){al=iN(p)|0}else{x=p+4|0;p=c[x>>2]|0;c[x>>2]=p+1;al=d[p]|0}c[j>>2]=al;do{if((al|0)!=0){if((aK(3928,al|0,2)|0)==0){break}p=c[h>>2]|0;x=p+4|0;u=c[x>>2]|0;r=p+8|0;t=c[r>>2]|0;do{if((u+1|0)>>>0>t>>>0){if(t>>>0>2147483645){kD(b,11448,0);return 0}v=t<<1;R=c[b+52>>2]|0;if((v|0)==-2){gy(R);return 0}else{q=p|0;V=gz(R,c[q>>2]|0,t,v)|0;c[q>>2]=V;c[r>>2]=v;am=c[x>>2]|0;an=V;break}}else{am=u;an=c[p>>2]|0}}while(0);c[x>>2]=am+1;a[an+am|0]=al&255;p=c[k>>2]|0;u=c[p>>2]|0;c[p>>2]=u-1;p=c[k>>2]|0;if((u|0)==0){ao=iN(p)|0}else{u=p+4|0;p=c[u>>2]|0;c[u>>2]=p+1;ao=d[p]|0}c[j>>2]=ao;if((ao|0)==0){o=279;i=f;return o|0}if((aK(3928,ao|0,2)|0)==0){o=279;i=f;return o|0}p=c[h>>2]|0;u=p+4|0;r=c[u>>2]|0;t=p+8|0;s=c[t>>2]|0;do{if((r+1|0)>>>0>s>>>0){if(s>>>0>2147483645){kD(b,11448,0);return 0}V=s<<1;v=c[b+52>>2]|0;if((V|0)==-2){gy(v);return 0}else{q=p|0;R=gz(v,c[q>>2]|0,s,V)|0;c[q>>2]=R;c[t>>2]=V;ap=c[u>>2]|0;aq=R;break}}else{ap=r;aq=c[p>>2]|0}}while(0);c[u>>2]=ap+1;a[aq+ap|0]=ao&255;p=c[k>>2]|0;r=c[p>>2]|0;c[p>>2]=r-1;p=c[k>>2]|0;if((r|0)==0){ar=iN(p)|0}else{r=p+4|0;p=c[r>>2]|0;c[r>>2]=p+1;ar=d[p]|0}c[j>>2]=ar;o=280;i=f;return o|0}}while(0);if((a[al+729|0]&2)==0){o=46}else{n=al;break}i=f;return o|0}else if((m|0)==3053){M=c[k>>2]|0;p=c[M>>2]|0;c[M>>2]=p-1;M=c[k>>2]|0;if((p|0)==0){as=iN(M)|0}else{p=M+4|0;M=c[p>>2]|0;c[p>>2]=M+1;as=d[M]|0}c[j>>2]=as;if((as|0)!=61){o=61;i=f;return o|0}M=c[k>>2]|0;p=c[M>>2]|0;c[M>>2]=p-1;M=c[k>>2]|0;if((p|0)==0){at=iN(M)|0}else{p=M+4|0;M=c[p>>2]|0;c[p>>2]=M+1;at=d[M]|0}c[j>>2]=at;o=281;i=f;return o|0}else if((m|0)==3317){if((a[l+729|0]&1)==0){M=c[k>>2]|0;p=c[M>>2]|0;c[M>>2]=p-1;M=c[k>>2]|0;if((p|0)==0){au=iN(M)|0}else{p=M+4|0;M=c[p>>2]|0;c[p>>2]=M+1;au=d[M]|0}c[j>>2]=au;o=l;i=f;return o|0}M=b+52|0;p=l&255;while(1){r=c[h>>2]|0;t=r+4|0;s=c[t>>2]|0;x=r+8|0;R=c[x>>2]|0;if((s+1|0)>>>0>R>>>0){if(R>>>0>2147483645){m=3322;break}V=R<<1;av=c[M>>2]|0;if((V|0)==-2){m=3324;break}q=r|0;v=gz(av,c[q>>2]|0,R,V)|0;c[q>>2]=v;c[x>>2]=V;aw=c[t>>2]|0;ax=v}else{aw=s;ax=c[r>>2]|0}c[t>>2]=aw+1;a[ax+aw|0]=p;t=c[k>>2]|0;r=c[t>>2]|0;c[t>>2]=r-1;t=c[k>>2]|0;if((r|0)==0){ay=iN(t)|0}else{r=t+4|0;t=c[r>>2]|0;c[r>>2]=t+1;ay=d[t]|0}c[j>>2]=ay;if((a[ay+729|0]&3)==0){m=3330;break}else{p=ay&255}}if((m|0)==3322){kD(b,11448,0);return 0}else if((m|0)==3324){gy(av);return 0}else if((m|0)==3330){p=c[h>>2]|0;t=c[M>>2]|0;r=hH(t,c[p>>2]|0,c[p+4>>2]|0)|0;p=t+8|0;s=c[p>>2]|0;c[p>>2]=s+16;c[s>>2]=r;v=r;V=v+4|0;c[s+8>>2]=d[V]|64;s=h7(t,c[(c[b+48>>2]|0)+4>>2]|0,(c[p>>2]|0)-16|0)|0;x=s+8|0;do{if((c[x>>2]|0)==0){c[s>>2]=1;c[x>>2]=1;if((c[(c[t+12>>2]|0)+12>>2]|0)<=0){break}fv(t)}}while(0);c[p>>2]=(c[p>>2]|0)-16;c[e>>2]=r;if((a[V]|0)!=4){o=288;i=f;return o|0}t=a[v+6|0]|0;if(t<<24>>24==0){o=288;i=f;return o|0}o=t&255|256;i=f;return o|0}}else if((m|0)==3049){t=kK(b)|0;if((t|0)>-1){kL(b,e,t);o=289;i=f;return o|0}if((t|0)==-1){o=91;i=f;return o|0}else{kD(b,4608,289);return 0}}else if((m|0)==3085){t=c[k>>2]|0;x=c[t>>2]|0;c[t>>2]=x-1;t=c[k>>2]|0;if((x|0)==0){az=iN(t)|0}else{x=t+4|0;t=c[x>>2]|0;c[x>>2]=t+1;az=d[t]|0}c[j>>2]=az;if((az|0)!=58){o=58;i=f;return o|0}t=c[k>>2]|0;x=c[t>>2]|0;c[t>>2]=x-1;t=c[k>>2]|0;if((x|0)==0){aA=iN(t)|0}else{x=t+4|0;t=c[x>>2]|0;c[x>>2]=t+1;aA=d[t]|0}c[j>>2]=aA;o=285;i=f;return o|0}else if((m|0)==3077){t=c[k>>2]|0;x=c[t>>2]|0;c[t>>2]=x-1;t=c[k>>2]|0;if((x|0)==0){aB=iN(t)|0}else{x=t+4|0;t=c[x>>2]|0;c[x>>2]=t+1;aB=d[t]|0}c[j>>2]=aB;if((aB|0)!=61){o=126;i=f;return o|0}t=c[k>>2]|0;x=c[t>>2]|0;c[t>>2]=x-1;t=c[k>>2]|0;if((x|0)==0){aC=iN(t)|0}else{x=t+4|0;t=c[x>>2]|0;c[x>>2]=t+1;aC=d[t]|0}c[j>>2]=aC;o=284;i=f;return o|0}else if((m|0)==3061){t=c[k>>2]|0;x=c[t>>2]|0;c[t>>2]=x-1;t=c[k>>2]|0;if((x|0)==0){aD=iN(t)|0}else{x=t+4|0;t=c[x>>2]|0;c[x>>2]=t+1;aD=d[t]|0}c[j>>2]=aD;if((aD|0)!=61){o=60;i=f;return o|0}t=c[k>>2]|0;x=c[t>>2]|0;c[t>>2]=x-1;t=c[k>>2]|0;if((x|0)==0){aE=iN(t)|0}else{x=t+4|0;t=c[x>>2]|0;c[x>>2]=t+1;aE=d[t]|0}c[j>>2]=aE;o=283;i=f;return o|0}else if((m|0)==3344){i=f;return o|0}else if((m|0)==3348){i=f;return o|0}}while(0);aE=c[h>>2]|0;aD=aE+4|0;aC=c[aD>>2]|0;aB=aE+8|0;aA=c[aB>>2]|0;do{if((aC+1|0)>>>0>aA>>>0){if(aA>>>0>2147483645){kD(b,11448,0);return 0}az=aA<<1;av=c[b+52>>2]|0;if((az|0)==-2){gy(av);return 0}else{ay=aE|0;aw=gz(av,c[ay>>2]|0,aA,az)|0;c[ay>>2]=aw;c[aB>>2]=az;aF=c[aD>>2]|0;aG=aw;break}}else{aF=aC;aG=c[aE>>2]|0}}while(0);c[aD>>2]=aF+1;a[aG+aF|0]=n&255;aF=c[k>>2]|0;aG=c[aF>>2]|0;c[aF>>2]=aG-1;aF=c[k>>2]|0;if((aG|0)==0){aH=iN(aF)|0}else{aG=aF+4|0;aF=c[aG>>2]|0;c[aG>>2]=aF+1;aH=d[aF]|0}c[j>>2]=aH;do{if((n|0)==48){if((aH|0)==0){aI=3544;aJ=0;break}if((aK(3096,aH|0,3)|0)==0){aI=3544;aJ=aH;break}aF=c[h>>2]|0;aG=aF+4|0;aD=c[aG>>2]|0;aE=aF+8|0;aC=c[aE>>2]|0;do{if((aD+1|0)>>>0>aC>>>0){if(aC>>>0>2147483645){kD(b,11448,0);return 0}aB=aC<<1;aA=c[b+52>>2]|0;if((aB|0)==-2){gy(aA);return 0}else{aw=aF|0;az=gz(aA,c[aw>>2]|0,aC,aB)|0;c[aw>>2]=az;c[aE>>2]=aB;aL=c[aG>>2]|0;aM=az;break}}else{aL=aD;aM=c[aF>>2]|0}}while(0);c[aG>>2]=aL+1;a[aM+aL|0]=aH&255;aF=c[k>>2]|0;aD=c[aF>>2]|0;c[aF>>2]=aD-1;aF=c[k>>2]|0;if((aD|0)==0){aN=iN(aF)|0}else{aD=aF+4|0;aF=c[aD>>2]|0;c[aD>>2]=aF+1;aN=d[aF]|0}c[j>>2]=aN;aI=2760;aJ=aN}else{aI=3544;aJ=aH}}while(0);aH=b+52|0;aN=aJ;L4256:while(1){do{if((aN|0)==0){aO=0}else{if((aK(aI|0,aN|0,3)|0)==0){aO=aN;break}aJ=c[h>>2]|0;aL=aJ+4|0;aM=c[aL>>2]|0;n=aJ+8|0;aF=c[n>>2]|0;if((aM+1|0)>>>0>aF>>>0){if(aF>>>0>2147483645){m=3261;break L4256}aD=aF<<1;aP=c[aH>>2]|0;if((aD|0)==-2){m=3263;break L4256}aE=aJ|0;aC=gz(aP,c[aE>>2]|0,aF,aD)|0;c[aE>>2]=aC;c[n>>2]=aD;aQ=c[aL>>2]|0;aR=aC}else{aQ=aM;aR=c[aJ>>2]|0}c[aL>>2]=aQ+1;a[aR+aQ|0]=aN&255;aL=c[k>>2]|0;aJ=c[aL>>2]|0;c[aL>>2]=aJ-1;aL=c[k>>2]|0;if((aJ|0)==0){aS=iN(aL)|0}else{aJ=aL+4|0;aL=c[aJ>>2]|0;c[aJ>>2]=aL+1;aS=d[aL]|0}c[j>>2]=aS;if((aS|0)==0){aO=0;break}if((aK(2496,aS|0,3)|0)==0){aO=aS;break}aL=c[h>>2]|0;aJ=aL+4|0;aM=c[aJ>>2]|0;aC=aL+8|0;aD=c[aC>>2]|0;if((aM+1|0)>>>0>aD>>>0){if(aD>>>0>2147483645){m=3273;break L4256}n=aD<<1;aT=c[aH>>2]|0;if((n|0)==-2){m=3275;break L4256}aE=aL|0;aF=gz(aT,c[aE>>2]|0,aD,n)|0;c[aE>>2]=aF;c[aC>>2]=n;aU=c[aJ>>2]|0;aV=aF}else{aU=aM;aV=c[aL>>2]|0}c[aJ>>2]=aU+1;a[aV+aU|0]=aS&255;aJ=c[k>>2]|0;aL=c[aJ>>2]|0;c[aJ>>2]=aL-1;aJ=c[k>>2]|0;if((aL|0)==0){aW=iN(aJ)|0}else{aL=aJ+4|0;aJ=c[aL>>2]|0;c[aL>>2]=aJ+1;aW=d[aJ]|0}c[j>>2]=aW;aO=aW}}while(0);aX=c[h>>2]|0;aY=aX+4|0;aZ=c[aY>>2]|0;a_=aX+8|0;a$=c[a_>>2]|0;a0=(aZ+1|0)>>>0>a$>>>0;if(!((a[aO+729|0]&16)!=0|(aO|0)==46)){m=3293;break}if(a0){if(a$>>>0>2147483645){m=3285;break}aG=a$<<1;a1=c[aH>>2]|0;if((aG|0)==-2){m=3287;break}aJ=aX|0;aL=gz(a1,c[aJ>>2]|0,a$,aG)|0;c[aJ>>2]=aL;c[a_>>2]=aG;a2=c[aY>>2]|0;a3=aL}else{a2=aZ;a3=c[aX>>2]|0}c[aY>>2]=a2+1;a[a3+a2|0]=aO&255;aL=c[k>>2]|0;aG=c[aL>>2]|0;c[aL>>2]=aG-1;aL=c[k>>2]|0;if((aG|0)==0){a4=iN(aL)|0}else{aG=aL+4|0;aL=c[aG>>2]|0;c[aG>>2]=aL+1;a4=d[aL]|0}c[j>>2]=a4;aN=a4}if((m|0)==3261){kD(b,11448,0);return 0}else if((m|0)==3263){gy(aP);return 0}else if((m|0)==3273){kD(b,11448,0);return 0}else if((m|0)==3275){gy(aT);return 0}else if((m|0)==3285){kD(b,11448,0);return 0}else if((m|0)==3287){gy(a1);return 0}else if((m|0)==3293){do{if(a0){if(a$>>>0>2147483645){kD(b,11448,0);return 0}m=a$<<1;a1=c[aH>>2]|0;if((m|0)==-2){gy(a1);return 0}else{aT=aX|0;aP=gz(a1,c[aT>>2]|0,a$,m)|0;c[aT>>2]=aP;c[a_>>2]=m;a5=c[aY>>2]|0;a6=aP;break}}else{a5=aZ;a6=c[aX>>2]|0}}while(0);c[aY>>2]=a5+1;a[a6+a5|0]=0;a5=b+76|0;a6=a[a5]|0;aY=c[h>>2]|0;aX=c[aY>>2]|0;aZ=c[aY+4>>2]|0;if((aZ|0)==0){a7=aX;a8=-1}else{aY=aZ;do{aY=aY-1|0;aZ=aX+aY|0;if((a[aZ]|0)==46){a[aZ]=a6}}while((aY|0)!=0);aY=c[h>>2]|0;a7=c[aY>>2]|0;a8=(c[aY+4>>2]|0)-1|0}aY=e|0;if((gU(a7,a8,aY)|0)!=0){o=287;i=f;return o|0}a8=a[a5]|0;a7=a[c[(bC()|0)>>2]|0]|0;a[a5]=a7;e=c[h>>2]|0;a6=c[e>>2]|0;aX=c[e+4>>2]|0;if((aX|0)==0){a9=a6;ba=-1}else{e=aX;do{e=e-1|0;aX=a6+e|0;if((a[aX]|0)==a8<<24>>24){a[aX]=a7}}while((e|0)!=0);e=c[h>>2]|0;a9=c[e>>2]|0;ba=(c[e+4>>2]|0)-1|0}if((gU(a9,ba,aY)|0)!=0){o=287;i=f;return o|0}o=a[a5]|0;a5=c[h>>2]|0;h=c[a5>>2]|0;f=c[a5+4>>2]|0;if((f|0)==0){kD(b,11816,287);return 0}else{bb=f}do{bb=bb-1|0;f=h+bb|0;if((a[f]|0)==o<<24>>24){a[f]=46}}while((bb|0)!=0);kD(b,11816,287);return 0}return 0}function kI(a){a=a|0;var b=0;b=kH(a,a+40|0)|0;c[a+32>>2]=b;return b|0}function kJ(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,i=0,j=0;b=a|0;e=c[b>>2]|0;f=a+56|0;g=c[f>>2]|0;h=c[g>>2]|0;c[g>>2]=h-1;g=c[f>>2]|0;if((h|0)==0){i=iN(g)|0}else{h=g+4|0;g=c[h>>2]|0;c[h>>2]=g+1;i=d[g]|0}c[b>>2]=i;do{if((i|0)==10|(i|0)==13){if((i|0)==(e|0)){break}g=c[f>>2]|0;h=c[g>>2]|0;c[g>>2]=h-1;g=c[f>>2]|0;if((h|0)==0){j=iN(g)|0}else{h=g+4|0;g=c[h>>2]|0;c[h>>2]=g+1;j=d[g]|0}c[b>>2]=j}}while(0);j=a+4|0;b=(c[j>>2]|0)+1|0;c[j>>2]=b;if((b|0)>2147483644){kC(a,9768)}else{return}}function kK(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;e=b|0;f=c[e>>2]|0;g=b+60|0;h=c[g>>2]|0;i=h+4|0;j=c[i>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((j+1|0)>>>0>l>>>0){if(l>>>0>2147483645){kD(b,11448,0);return 0}m=l<<1;n=c[b+52>>2]|0;if((m|0)==-2){gy(n);return 0}else{o=h|0;p=gz(n,c[o>>2]|0,l,m)|0;c[o>>2]=p;c[k>>2]=m;q=c[i>>2]|0;r=p;break}}else{q=j;r=c[h>>2]|0}}while(0);c[i>>2]=q+1;a[r+q|0]=f&255;q=b+56|0;r=c[q>>2]|0;i=c[r>>2]|0;c[r>>2]=i-1;r=c[q>>2]|0;if((i|0)==0){s=iN(r)|0}else{i=r+4|0;r=c[i>>2]|0;c[i>>2]=r+1;s=d[r]|0}c[e>>2]=s;if((s|0)!=61){t=s;u=0;v=(t|0)!=(f|0);w=v<<31>>31;x=w^u;return x|0}s=b+52|0;r=61;i=0;while(1){h=c[g>>2]|0;j=h+4|0;k=c[j>>2]|0;l=h+8|0;p=c[l>>2]|0;if((k+1|0)>>>0>p>>>0){if(p>>>0>2147483645){y=3398;break}m=p<<1;z=c[s>>2]|0;if((m|0)==-2){y=3400;break}o=h|0;n=gz(z,c[o>>2]|0,p,m)|0;c[o>>2]=n;c[l>>2]=m;A=c[j>>2]|0;B=n}else{A=k;B=c[h>>2]|0}c[j>>2]=A+1;a[B+A|0]=r;j=c[q>>2]|0;h=c[j>>2]|0;c[j>>2]=h-1;j=c[q>>2]|0;if((h|0)==0){C=iN(j)|0}else{h=j+4|0;j=c[h>>2]|0;c[h>>2]=j+1;C=d[j]|0}c[e>>2]=C;j=i+1|0;if((C|0)==61){r=C&255;i=j}else{t=C;u=j;y=3408;break}}if((y|0)==3408){v=(t|0)!=(f|0);w=v<<31>>31;x=w^u;return x|0}else if((y|0)==3400){gy(z);return 0}else if((y|0)==3398){kD(b,11448,0);return 0}return 0}function kL(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;g=b|0;h=c[g>>2]|0;i=b+60|0;j=c[i>>2]|0;k=j+4|0;l=c[k>>2]|0;m=j+8|0;n=c[m>>2]|0;do{if((l+1|0)>>>0>n>>>0){if(n>>>0>2147483645){kD(b,11448,0)}o=n<<1;p=c[b+52>>2]|0;if((o|0)==-2){gy(p)}else{q=j|0;r=gz(p,c[q>>2]|0,n,o)|0;c[q>>2]=r;c[m>>2]=o;s=c[k>>2]|0;t=r;break}}else{s=l;t=c[j>>2]|0}}while(0);c[k>>2]=s+1;a[t+s|0]=h&255;h=b+56|0;s=c[h>>2]|0;t=c[s>>2]|0;c[s>>2]=t-1;s=c[h>>2]|0;if((t|0)==0){u=iN(s)|0}else{t=s+4|0;s=c[t>>2]|0;c[t>>2]=s+1;u=d[s]|0}c[g>>2]=u;if((u|0)==10|(u|0)==13){kJ(b);v=3421}else{w=u}L4411:while(1){if((v|0)==3421){v=0;w=c[g>>2]|0}x=(e|0)==0;y=b+52|0;L4415:do{if(x){u=w;while(1){if((u|0)==93){v=3430;break L4415}else if((u|0)==(-1|0)){v=3470;break L4411}else if((u|0)==10|(u|0)==13){break L4415}s=c[h>>2]|0;t=c[s>>2]|0;c[s>>2]=t-1;s=c[h>>2]|0;if((t|0)==0){z=iN(s)|0}else{t=s+4|0;s=c[t>>2]|0;c[t>>2]=s+1;z=d[s]|0}c[g>>2]=z;u=z}}else{u=w;while(1){if((u|0)==93){v=3430;break L4415}else if((u|0)==(-1|0)){v=3469;break L4411}else if((u|0)==10|(u|0)==13){break L4415}s=c[i>>2]|0;t=s+4|0;k=c[t>>2]|0;j=s+8|0;l=c[j>>2]|0;if((k+1|0)>>>0>l>>>0){if(l>>>0>2147483645){v=3454;break L4411}m=l<<1;A=c[y>>2]|0;if((m|0)==-2){v=3456;break L4411}n=s|0;r=gz(A,c[n>>2]|0,l,m)|0;c[n>>2]=r;c[j>>2]=m;B=c[t>>2]|0;C=r}else{B=k;C=c[s>>2]|0}c[t>>2]=B+1;a[C+B|0]=u&255;t=c[h>>2]|0;s=c[t>>2]|0;c[t>>2]=s-1;t=c[h>>2]|0;if((s|0)==0){D=iN(t)|0}else{s=t+4|0;t=c[s>>2]|0;c[s>>2]=t+1;D=d[t]|0}c[g>>2]=D;u=D}}}while(0);if((v|0)==3430){v=0;if((kK(b)|0)==(f|0)){v=3431;break}else{v=3421;continue}}u=c[i>>2]|0;t=u+4|0;s=c[t>>2]|0;k=u+8|0;r=c[k>>2]|0;if((s+1|0)>>>0>r>>>0){if(r>>>0>2147483645){v=3445;break}m=r<<1;E=c[y>>2]|0;if((m|0)==-2){v=3447;break}j=u|0;n=gz(E,c[j>>2]|0,r,m)|0;c[j>>2]=n;c[k>>2]=m;F=c[t>>2]|0;G=n}else{F=s;G=c[u>>2]|0}c[t>>2]=F+1;a[G+F|0]=10;kJ(b);if(!x){v=3421;continue}c[(c[i>>2]|0)+4>>2]=0;v=3421}if((v|0)==3445){kD(b,11448,0)}else if((v|0)==3469){H=(e|0)!=0;I=H?10160:9944;kD(b,I,286)}else if((v|0)==3470){H=(e|0)!=0;I=H?10160:9944;kD(b,I,286)}else if((v|0)==3456){gy(A)}else if((v|0)==3454){kD(b,11448,0)}else if((v|0)==3447){gy(E)}else if((v|0)==3431){v=c[g>>2]|0;E=c[i>>2]|0;A=E+4|0;I=c[A>>2]|0;H=E+8|0;F=c[H>>2]|0;do{if((I+1|0)>>>0>F>>>0){if(F>>>0>2147483645){kD(b,11448,0)}G=F<<1;D=c[y>>2]|0;if((G|0)==-2){gy(D)}else{B=E|0;C=gz(D,c[B>>2]|0,F,G)|0;c[B>>2]=C;c[H>>2]=G;J=c[A>>2]|0;K=C;break}}else{J=I;K=c[E>>2]|0}}while(0);c[A>>2]=J+1;a[K+J|0]=v&255;v=c[h>>2]|0;J=c[v>>2]|0;c[v>>2]=J-1;v=c[h>>2]|0;if((J|0)==0){L=iN(v)|0}else{J=v+4|0;v=c[J>>2]|0;c[J>>2]=v+1;L=d[v]|0}c[g>>2]=L;if(x){return}x=c[i>>2]|0;i=f+2|0;f=c[y>>2]|0;y=hH(f,(c[x>>2]|0)+i|0,(c[x+4>>2]|0)-(i<<1)|0)|0;i=f+8|0;x=c[i>>2]|0;c[i>>2]=x+16;c[x>>2]=y;c[x+8>>2]=d[y+4|0]|0|64;x=h7(f,c[(c[b+48>>2]|0)+4>>2]|0,(c[i>>2]|0)-16|0)|0;b=x+8|0;do{if((c[b>>2]|0)==0){c[x>>2]=1;c[b>>2]=1;if((c[(c[f+12>>2]|0)+12>>2]|0)<=0){break}fv(f)}}while(0);c[i>>2]=(c[i>>2]|0)-16;c[e>>2]=y;return}}function kM(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=c[b+60>>2]|0;f=e+4|0;g=c[f>>2]|0;h=e+8|0;i=c[h>>2]|0;if((g+1|0)>>>0<=i>>>0){j=g;k=c[e>>2]|0;l=d&255;m=j+1|0;c[f>>2]=m;n=k+j|0;a[n]=l;return}if(i>>>0>2147483645){kD(b,11448,0)}g=i<<1;o=c[b+52>>2]|0;if((g|0)==-2){gy(o)}b=e|0;e=gz(o,c[b>>2]|0,i,g)|0;c[b>>2]=e;c[h>>2]=g;j=c[f>>2]|0;k=e;l=d&255;m=j+1|0;c[f>>2]=m;n=k+j|0;a[n]=l;return}function kN(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;c[(c[a+60>>2]|0)+4>>2]=0;kM(a,92);if((d|0)>0){f=0}else{kD(a,e,289)}while(1){g=c[b+(f<<2)>>2]|0;if((g|0)==-1){h=15;break}kM(a,g);g=f+1|0;if((g|0)<(d|0)){f=g}else{h=16;break}}if((h|0)==15){kD(a,e,289)}else if((h|0)==16){kD(a,e,289)}}function kO(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[3044]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=12216+(h<<2)|0;j=12216+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[3044]=e&~(1<<g)}else{if(l>>>0<(c[3048]|0)>>>0){bL();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{bL();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[3046]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=12216+(p<<2)|0;m=12216+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[3044]=e&~(1<<r)}else{if(l>>>0<(c[3048]|0)>>>0){bL();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{bL();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[3046]|0;if((l|0)!=0){q=c[3049]|0;d=l>>>3;l=d<<1;f=12216+(l<<2)|0;k=c[3044]|0;h=1<<d;do{if((k&h|0)==0){c[3044]=k|h;s=f;t=12216+(l+2<<2)|0}else{d=12216+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[3048]|0)>>>0){s=g;t=d;break}bL();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[3046]=m;c[3049]=e;n=i;return n|0}l=c[3045]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[12480+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[3048]|0;if(r>>>0<i>>>0){bL();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){bL();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){bL();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){bL();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){bL();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{bL();return 0}}}while(0);L99:do{if((e|0)!=0){f=d+28|0;i=12480+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[3045]=c[3045]&~(1<<c[f>>2]);break L99}else{if(e>>>0<(c[3048]|0)>>>0){bL();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L99}}}while(0);if(v>>>0<(c[3048]|0)>>>0){bL();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[3046]|0;if((f|0)!=0){e=c[3049]|0;i=f>>>3;f=i<<1;q=12216+(f<<2)|0;k=c[3044]|0;g=1<<i;do{if((k&g|0)==0){c[3044]=k|g;y=q;z=12216+(f+2<<2)|0}else{i=12216+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[3048]|0)>>>0){y=l;z=i;break}bL();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[3046]=p;c[3049]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[3045]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[12480+(A<<2)>>2]|0;L147:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L147}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[12480+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[3046]|0)-g|0)>>>0){o=g;break}q=K;m=c[3048]|0;if(q>>>0<m>>>0){bL();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){bL();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){bL();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){bL();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){bL();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{bL();return 0}}}while(0);L197:do{if((e|0)!=0){i=K+28|0;m=12480+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[3045]=c[3045]&~(1<<c[i>>2]);break L197}else{if(e>>>0<(c[3048]|0)>>>0){bL();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L197}}}while(0);if(L>>>0<(c[3048]|0)>>>0){bL();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;m=12216+(e<<2)|0;r=c[3044]|0;j=1<<i;do{if((r&j|0)==0){c[3044]=r|j;O=m;P=12216+(e+2<<2)|0}else{i=12216+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[3048]|0)>>>0){O=d;P=i;break}bL();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=12480+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[3045]|0;l=1<<Q;if((m&l|0)==0){c[3045]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=168;break}else{l=l<<1;m=j}}if((T|0)==168){if(S>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[3048]|0;if(m>>>0<i>>>0){bL();return 0}if(j>>>0<i>>>0){bL();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[3046]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[3049]|0;if(S>>>0>15){R=J;c[3049]=R+o;c[3046]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[3046]=0;c[3049]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[3047]|0;if(o>>>0<J>>>0){S=J-o|0;c[3047]=S;J=c[3050]|0;K=J;c[3050]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[3028]|0)==0){J=bJ(30)|0;if((J-1&J|0)==0){c[3030]=J;c[3029]=J;c[3031]=-1;c[3032]=-1;c[3033]=0;c[3155]=0;c[3028]=(cc(0)|0)&-16^1431655768;break}else{bL();return 0}}}while(0);J=o+48|0;S=c[3030]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[3154]|0;do{if((O|0)!=0){P=c[3152]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L289:do{if((c[3155]&4|0)==0){O=c[3050]|0;L291:do{if((O|0)==0){T=198}else{L=O;P=12624;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=198;break L291}else{P=M}}if((P|0)==0){T=198;break}L=R-(c[3047]|0)&Q;if(L>>>0>=2147483647){W=0;break}m=bA(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=207}}while(0);do{if((T|0)==198){O=bA(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[3029]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[3152]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}m=c[3154]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=bA($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=207}}while(0);L311:do{if((T|0)==207){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=218;break L289}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[3030]|0;O=K-_+g&-g;if(O>>>0>=2147483647){ac=_;break}if((bA(O|0)|0)==-1){bA(m|0)|0;W=Y;break L311}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=218;break L289}}}while(0);c[3155]=c[3155]|4;ad=W;T=215}else{ad=0;T=215}}while(0);do{if((T|0)==215){if(S>>>0>=2147483647){break}W=bA(S|0)|0;Z=bA(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=218}}}while(0);do{if((T|0)==218){ad=(c[3152]|0)+aa|0;c[3152]=ad;if(ad>>>0>(c[3153]|0)>>>0){c[3153]=ad}ad=c[3050]|0;L331:do{if((ad|0)==0){S=c[3048]|0;if((S|0)==0|ab>>>0<S>>>0){c[3048]=ab}c[3156]=ab;c[3157]=aa;c[3159]=0;c[3053]=c[3028];c[3052]=-1;S=0;do{Y=S<<1;ac=12216+(Y<<2)|0;c[12216+(Y+3<<2)>>2]=ac;c[12216+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[3050]=ab+ae;c[3047]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[3051]=c[3032]}else{S=12624;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=230;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==230){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[3050]|0;Y=(c[3047]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[3050]=Z+ai;c[3047]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[3051]=c[3032];break L331}}while(0);if(ab>>>0<(c[3048]|0)>>>0){c[3048]=ab}S=ab+aa|0;Y=12624;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=240;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==240){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[3050]|0)){J=(c[3047]|0)+K|0;c[3047]=J;c[3050]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[3049]|0)){J=(c[3046]|0)+K|0;c[3046]=J;c[3049]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L376:do{if(X>>>0<256){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=12216+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[3048]|0)>>>0){bL();return 0}if((c[U+12>>2]|0)==(Z|0)){break}bL();return 0}}while(0);if((Q|0)==(U|0)){c[3044]=c[3044]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[3048]|0)>>>0){bL();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}bL();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[3048]|0)>>>0){bL();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){bL();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{bL();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=12480+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[3045]=c[3045]&~(1<<c[P>>2]);break L376}else{if(m>>>0<(c[3048]|0)>>>0){bL();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L376}}}while(0);if(an>>>0<(c[3048]|0)>>>0){bL();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256){V=J<<1;X=12216+(V<<2)|0;P=c[3044]|0;m=1<<J;do{if((P&m|0)==0){c[3044]=P|m;as=X;at=12216+(V+2<<2)|0}else{J=12216+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[3048]|0)>>>0){as=U;at=J;break}bL();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8)>>2]=as;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){au=0}else{if(ar>>>0>16777215){au=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=12480+(au<<2)|0;c[ab+(W+28)>>2]=au;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[3045]|0;Q=1<<au;if((X&Q|0)==0){c[3045]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}aw=X+16+(Q>>>31<<2)|0;m=c[aw>>2]|0;if((m|0)==0){T=313;break}else{Q=Q<<1;X=m}}if((T|0)==313){if(aw>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[aw>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[3048]|0;if(X>>>0<$>>>0){bL();return 0}if(m>>>0<$>>>0){bL();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=12624;while(1){ax=c[W>>2]|0;if(ax>>>0<=Y>>>0){ay=c[W+4>>2]|0;az=ax+ay|0;if(az>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ax+(ay-39)|0;if((W&7|0)==0){aA=0}else{aA=-W&7}W=ax+(ay-47+aA)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aB=0}else{aB=-_&7}_=aa-40-aB|0;c[3050]=ab+aB;c[3047]=_;c[ab+(aB+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[3051]=c[3032];c[ac+4>>2]=27;c[W>>2]=c[3156];c[W+4>>2]=c[3157];c[W+8>>2]=c[3158];c[W+12>>2]=c[3159];c[3156]=ab;c[3157]=aa;c[3159]=0;c[3158]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<az>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<az>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256){K=W<<1;Z=12216+(K<<2)|0;S=c[3044]|0;m=1<<W;do{if((S&m|0)==0){c[3044]=S|m;aC=Z;aD=12216+(K+2<<2)|0}else{W=12216+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[3048]|0)>>>0){aC=Q;aD=W;break}bL();return 0}}while(0);c[aD>>2]=ad;c[aC+12>>2]=ad;c[ad+8>>2]=aC;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aE=0}else{if(_>>>0>16777215){aE=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aE=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=12480+(aE<<2)|0;c[ad+28>>2]=aE;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[3045]|0;Q=1<<aE;if((Z&Q|0)==0){c[3045]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aE|0)==31){aF=0}else{aF=25-(aE>>>1)|0}Q=_<<aF;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aG=Z+16+(Q>>>31<<2)|0;m=c[aG>>2]|0;if((m|0)==0){T=348;break}else{Q=Q<<1;Z=m}}if((T|0)==348){if(aG>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[aG>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[3048]|0;if(Z>>>0<m>>>0){bL();return 0}if(_>>>0<m>>>0){bL();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[3047]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[3047]=_;ad=c[3050]|0;Q=ad;c[3050]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(bD()|0)>>2]=12;n=0;return n|0}function kP(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[3048]|0;if(b>>>0<e>>>0){bL()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){bL()}h=f&-8;i=a+(h-8)|0;j=i;L548:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){bL()}if((n|0)==(c[3049]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[3046]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=12216+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){bL()}if((c[k+12>>2]|0)==(n|0)){break}bL()}}while(0);if((s|0)==(k|0)){c[3044]=c[3044]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){bL()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}bL()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){bL()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){bL()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){bL()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{bL()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=12480+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[3045]=c[3045]&~(1<<c[v>>2]);q=n;r=o;break L548}else{if(p>>>0<(c[3048]|0)>>>0){bL()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L548}}}while(0);if(A>>>0<(c[3048]|0)>>>0){bL()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3048]|0)>>>0){bL()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[3048]|0)>>>0){bL()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){bL()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){bL()}do{if((e&2|0)==0){if((j|0)==(c[3050]|0)){B=(c[3047]|0)+r|0;c[3047]=B;c[3050]=q;c[q+4>>2]=B|1;if((q|0)!=(c[3049]|0)){return}c[3049]=0;c[3046]=0;return}if((j|0)==(c[3049]|0)){B=(c[3046]|0)+r|0;c[3046]=B;c[3049]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L651:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=12216+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[3048]|0)>>>0){bL()}if((c[u+12>>2]|0)==(j|0)){break}bL()}}while(0);if((g|0)==(u|0)){c[3044]=c[3044]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[3048]|0)>>>0){bL()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}bL()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[3048]|0)>>>0){bL()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[3048]|0)>>>0){bL()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){bL()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{bL()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=12480+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[3045]=c[3045]&~(1<<c[t>>2]);break L651}else{if(f>>>0<(c[3048]|0)>>>0){bL()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L651}}}while(0);if(E>>>0<(c[3048]|0)>>>0){bL()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[3048]|0)>>>0){bL()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[3048]|0)>>>0){bL()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[3049]|0)){H=B;break}c[3046]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=12216+(d<<2)|0;A=c[3044]|0;E=1<<r;do{if((A&E|0)==0){c[3044]=A|E;I=e;J=12216+(d+2<<2)|0}else{r=12216+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[3048]|0)>>>0){I=h;J=r;break}bL()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=12480+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[3045]|0;d=1<<K;do{if((r&d|0)==0){c[3045]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=525;break}else{A=A<<1;J=E}}if((N|0)==525){if(M>>>0<(c[3048]|0)>>>0){bL()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[3048]|0;if(J>>>0<E>>>0){bL()}if(B>>>0<E>>>0){bL()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[3052]|0)-1|0;c[3052]=q;if((q|0)==0){O=12632}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[3052]=-1;return}function kQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=kO(b)|0;return d|0}if(b>>>0>4294967231){c[(bD()|0)>>2]=12;d=0;return d|0}if(b>>>0<11){e=16}else{e=b+11&-8}f=kR(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=kO(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;e=g>>>0<b>>>0?g:b;kV(f|0,a|0,e)|0;kP(a);d=f;return d|0}function kR(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[3048]|0;if(g>>>0<j>>>0){bL();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){bL();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){bL();return 0}if((k|0)==0){if(b>>>0<256){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[3030]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;kS(g+b|0,k);n=a;return n|0}if((i|0)==(c[3050]|0)){k=(c[3047]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[3050]=g+b;c[3047]=l;n=a;return n|0}if((i|0)==(c[3049]|0)){l=(c[3046]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[3046]=q;c[3049]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L837:do{if(m>>>0<256){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=12216+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){bL();return 0}if((c[l+12>>2]|0)==(i|0)){break}bL();return 0}}while(0);if((k|0)==(l|0)){c[3044]=c[3044]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){bL();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}bL();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){bL();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){bL();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){bL();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{bL();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=12480+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3045]=c[3045]&~(1<<c[t>>2]);break L837}else{if(s>>>0<(c[3048]|0)>>>0){bL();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L837}}}while(0);if(y>>>0<(c[3048]|0)>>>0){bL();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[3048]|0)>>>0){bL();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;kS(g+b|0,q);n=a;return n|0}return 0}function kS(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L913:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[3048]|0;if(i>>>0<l>>>0){bL()}if((j|0)==(c[3049]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[3046]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=12216+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){bL()}if((c[p+12>>2]|0)==(j|0)){break}bL()}}while(0);if((q|0)==(p|0)){c[3044]=c[3044]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){bL()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}bL()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){bL()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){bL()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){bL()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{bL()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=12480+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3045]=c[3045]&~(1<<c[t>>2]);n=j;o=k;break L913}else{if(m>>>0<(c[3048]|0)>>>0){bL()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L913}}}while(0);if(y>>>0<(c[3048]|0)>>>0){bL()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3048]|0)>>>0){bL()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[3048]|0)>>>0){bL()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[3048]|0;if(e>>>0<a>>>0){bL()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[3050]|0)){A=(c[3047]|0)+o|0;c[3047]=A;c[3050]=n;c[n+4>>2]=A|1;if((n|0)!=(c[3049]|0)){return}c[3049]=0;c[3046]=0;return}if((f|0)==(c[3049]|0)){A=(c[3046]|0)+o|0;c[3046]=A;c[3049]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L1012:do{if(z>>>0<256){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=12216+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){bL()}if((c[g+12>>2]|0)==(f|0)){break}bL()}}while(0);if((t|0)==(g|0)){c[3044]=c[3044]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){bL()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}bL()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){bL()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){bL()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){bL()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{bL()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=12480+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[3045]=c[3045]&~(1<<c[l>>2]);break L1012}else{if(m>>>0<(c[3048]|0)>>>0){bL()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L1012}}}while(0);if(C>>>0<(c[3048]|0)>>>0){bL()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[3048]|0)>>>0){bL()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[3048]|0)>>>0){bL()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[3049]|0)){F=A;break}c[3046]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256){z=o<<1;y=12216+(z<<2)|0;C=c[3044]|0;b=1<<o;do{if((C&b|0)==0){c[3044]=C|b;G=y;H=12216+(z+2<<2)|0}else{o=12216+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[3048]|0)>>>0){G=d;H=o;break}bL()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=12480+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[3045]|0;z=1<<I;if((o&z|0)==0){c[3045]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=805;break}else{I=I<<1;J=G}}if((L|0)==805){if(K>>>0<(c[3048]|0)>>>0){bL()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[3048]|0;if(J>>>0<I>>>0){bL()}if(L>>>0<I>>>0){bL()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function kT(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0.0,O=0,P=0,Q=0.0,R=0.0,S=0.0;e=b;while(1){f=e+1|0;if((aA(a[e]|0)|0)==0){break}else{e=f}}g=a[e]|0;if((g<<24>>24|0)==43){i=f;j=0}else if((g<<24>>24|0)==45){i=f;j=1}else{i=e;j=0}e=-1;f=0;g=i;while(1){k=a[g]|0;if(((k<<24>>24)-48|0)>>>0<10){l=e}else{if(k<<24>>24!=46|(e|0)>-1){break}else{l=f}}e=l;f=f+1|0;g=g+1|0}l=g+(-f|0)|0;i=(e|0)<0;m=((i^1)<<31>>31)+f|0;n=(m|0)>18;o=(n?-18:-m|0)+(i?f:e)|0;e=n?18:m;do{if((e|0)==0){p=b;q=0.0}else{if((e|0)>9){m=l;n=e;f=0;while(1){i=a[m]|0;r=m+1|0;if(i<<24>>24==46){s=a[r]|0;t=m+2|0}else{s=i;t=r}u=(f*10|0)-48+(s<<24>>24)|0;r=n-1|0;if((r|0)>9){m=t;n=r;f=u}else{break}}v=+(u|0)*1.0e9;w=9;x=t;y=853}else{if((e|0)>0){v=0.0;w=e;x=l;y=853}else{z=0.0;A=0.0}}if((y|0)==853){f=x;n=w;m=0;while(1){r=a[f]|0;i=f+1|0;if(r<<24>>24==46){B=a[i]|0;C=f+2|0}else{B=r;C=i}D=(m*10|0)-48+(B<<24>>24)|0;i=n-1|0;if((i|0)>0){f=C;n=i;m=D}else{break}}z=+(D|0);A=v}E=A+z;do{if((k<<24>>24|0)==69|(k<<24>>24|0)==101){m=g+1|0;n=a[m]|0;if((n<<24>>24|0)==45){F=g+2|0;G=1}else if((n<<24>>24|0)==43){F=g+2|0;G=0}else{F=m;G=0}m=a[F]|0;if(((m<<24>>24)-48|0)>>>0<10){H=F;I=0;J=m}else{K=0;L=F;M=G;break}while(1){m=(I*10|0)-48+(J<<24>>24)|0;n=H+1|0;f=a[n]|0;if(((f<<24>>24)-48|0)>>>0<10){H=n;I=m;J=f}else{K=m;L=n;M=G;break}}}else{K=0;L=g;M=0}}while(0);n=o+((M|0)==0?K:-K|0)|0;m=(n|0)<0?-n|0:n;if((m|0)>511){c[(bD()|0)>>2]=34;N=1.0;O=336;P=511;y=870}else{if((m|0)==0){Q=1.0}else{N=1.0;O=336;P=m;y=870}}if((y|0)==870){while(1){y=0;if((P&1|0)==0){R=N}else{R=N*+h[O>>3]}m=P>>1;if((m|0)==0){Q=R;break}else{N=R;O=O+8|0;P=m;y=870}}}if((n|0)>-1){p=L;q=E*Q;break}else{p=L;q=E/Q;break}}}while(0);if((d|0)!=0){c[d>>2]=p}if((j|0)==0){S=q;return+S}S=-0.0-q;return+S}function kU(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function kV(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function kW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;t=t+1|0;c[a>>2]=t;while((e|0)<40){if((c[d+(e<<2)>>2]|0)==0){c[d+(e<<2)>>2]=t;c[d+((e<<2)+4)>>2]=b;c[d+((e<<2)+8)>>2]=0;return 0}e=e+2|0}ba(116);ba(111);ba(111);ba(32);ba(109);ba(97);ba(110);ba(121);ba(32);ba(115);ba(101);ba(116);ba(106);ba(109);ba(112);ba(115);ba(32);ba(105);ba(110);ba(32);ba(97);ba(32);ba(102);ba(117);ba(110);ba(99);ba(116);ba(105);ba(111);ba(110);ba(32);ba(99);ba(97);ba(108);ba(108);ba(44);ba(32);ba(98);ba(117);ba(105);ba(108);ba(100);ba(32);ba(119);ba(105);ba(116);ba(104);ba(32);ba(97);ba(32);ba(104);ba(105);ba(103);ba(104);ba(101);ba(114);ba(32);ba(118);ba(97);ba(108);ba(117);ba(101);ba(32);ba(102);ba(111);ba(114);ba(32);ba(77);ba(65);ba(88);ba(95);ba(83);ba(69);ba(84);ba(74);ba(77);ba(80);ba(83);ba(10);ab(0);return 0}function kX(a,b){a=a|0;b=b|0;var d=0,e=0;while((d|0)<20){e=c[b+(d<<2)>>2]|0;if((e|0)==0)break;if((e|0)==(a|0)){return c[b+((d<<2)+4)>>2]|0}d=d+2|0}return 0}function kY(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function kZ(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0;while((e|0)<(c|0)){f=d[a+e|0]|0;g=d[b+e|0]|0;if((f|0)!=(g|0))return((f|0)>(g|0)?1:-1)|0;e=e+1|0}return 0}function k_(a){a=a|0;if((a|0)<65)return a|0;if((a|0)>90)return a|0;return a-65+97|0}function k$(a,b){a=a|0;b=b|0;return cf[a&511](b|0)|0}function k0(a,b){a=a|0;b=b|0;cg[a&1](b|0)}function k1(a,b,c){a=a|0;b=b|0;c=c|0;ch[a&31](b|0,c|0)}function k2(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return ci[a&7](b|0,c|0,d|0,e|0)|0}function k3(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return cj[a&7](b|0,c|0,d|0)|0}function k4(a){a=a|0;ck[a&1]()}function k5(a,b,c){a=a|0;b=b|0;c=c|0;return cl[a&3](b|0,c|0)|0}function k6(a){a=a|0;ab(0);return 0}function k7(a){a=a|0;ab(1)}function k8(a,b){a=a|0;b=b|0;ab(2)}function k9(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ab(3);return 0}function la(a,b,c){a=a|0;b=b|0;c=c|0;ab(4);return 0}function lb(){ab(5)}function lc(a,b){a=a|0;b=b|0;ab(6);return 0}
// EMSCRIPTEN_END_FUNCS
var cf=[k6,k6,fJ,k6,i2,k6,gI,k6,jd,k6,fN,k6,f0,k6,jp,k6,kp,k6,f9,k6,jn,k6,jf,k6,i1,k6,gG,k6,gj,k6,im,k6,gs,k6,f5,k6,kl,k6,f6,k6,ks,k6,fD,k6,fH,k6,gZ,k6,kn,k6,fL,k6,f4,k6,hW,k6,hM,k6,g6,k6,kx,k6,f_,k6,g3,k6,hO,k6,g_,k6,gd,k6,kg,k6,hU,k6,gM,k6,gp,k6,io,k6,hK,k6,iV,k6,jc,k6,gf,k6,ez,k6,ge,k6,il,k6,hY,k6,fV,k6,hN,k6,iS,k6,kw,k6,jq,k6,jv,k6,gF,k6,gn,k6,hQ,k6,gY,k6,iT,k6,f7,k6,hV,k6,g7,k6,kq,k6,kr,k6,jb,k6,ka,k6,hP,k6,gE,k6,fF,k6,hR,k6,gB,k6,gq,k6,je,k6,fI,k6,ke,k6,kc,k6,f8,k6,fS,k6,gA,k6,go,k6,fE,k6,jx,k6,js,k6,jj,k6,gw,k6,h1,k6,fY,k6,ki,k6,ip,k6,gh,k6,ga,k6,jk,k6,i3,k6,gc,k6,gv,k6,fX,k6,jt,k6,i6,k6,kf,k6,ku,k6,g$,k6,iY,k6,gN,k6,hT,k6,gm,k6,iX,k6,gl,k6,hL,k6,g5,k6,gr,k6,i5,k6,fG,k6,iZ,k6,gg,k6,fZ,k6,gi,k6,ik,k6,i$,k6,g2,k6,i4,k6,fW,k6,gk,k6,kd,k6,hX,k6,kv,k6,kb,k6,hS,k6,kj,k6,ja,k6,g4,k6,ij,k6,i_,k6,iU,k6,f1,k6,f$,k6,gt,k6,jl,k6,ju,k6,kt,k6,g1,k6,i9,k6,fU,k6,ko,k6,jr,k6,i8,k6,jw,k6,iW,k6,gO,k6,gH,k6,ii,k6,i0,k6,j9,k6,f2,k6,jo,k6,gu,k6,gb,k6,i7,k6,g0,k6,fM,k6,iq,k6,jm,k6,km,k6,ky,k6,iR,k6,fT,k6,kk,k6,fK,k6,gD,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6,k6];var cg=[k7,k7];var ch=[k8,k8,fx,k8,dB,k8,hA,k8,e4,k8,e$,k8,kz,k8,cG,k8,e0,k8,k8,k8,k8,k8,k8,k8,k8,k8,k8,k8,k8,k8,k8,k8];var ci=[k9,k9,h2,k9,ey,k9,k9,k9];var cj=[la,la,ej,la,el,la,ji,la];var ck=[lb,lb];var cl=[lc,lc,hz,lc];return{_testSetjmp:kX,_saveSetjmp:kW,_free:kP,_main:cE,_memcmp:kZ,_tolower:k_,_strlen:kU,_memset:kY,_malloc:kO,_memcpy:kV,_realloc:kQ,_lua_execute:cD,runPostSets:cC,stackAlloc:cm,stackSave:cn,stackRestore:co,setThrew:cp,setTempRet0:cs,setTempRet1:ct,setTempRet2:cu,setTempRet3:cv,setTempRet4:cw,setTempRet5:cx,setTempRet6:cy,setTempRet7:cz,setTempRet8:cA,setTempRet9:cB,dynCall_ii:k$,dynCall_vi:k0,dynCall_vii:k1,dynCall_iiiii:k2,dynCall_iiii:k3,dynCall_v:k4,dynCall_iii:k5}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiiii": invoke_iiiii, "invoke_iiii": invoke_iiii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "_llvm_lifetime_end": _llvm_lifetime_end, "_lseek": _lseek, "_rand": _rand, "__scanString": __scanString, "_fclose": _fclose, "_freopen": _freopen, "_emscripten_run_script_string": _emscripten_run_script_string, "_fflush": _fflush, "_fputc": _fputc, "_fwrite": _fwrite, "_send": _send, "_mktime": _mktime, "_tmpnam": _tmpnam, "_isspace": _isspace, "_localtime": _localtime, "_read": _read, "_ceil": _ceil, "_strstr": _strstr, "_fsync": _fsync, "_fscanf": _fscanf, "_remove": _remove, "_modf": _modf, "_strcmp": _strcmp, "_memchr": _memchr, "_llvm_va_end": _llvm_va_end, "_tmpfile": _tmpfile, "_snprintf": _snprintf, "_fgetc": _fgetc, "_cosh": _cosh, "__getFloat": __getFloat, "_fgets": _fgets, "_close": _close, "_strchr": _strchr, "_asin": _asin, "_clock": _clock, "___setErrNo": ___setErrNo, "_emscripten_exit_with_live_runtime": _emscripten_exit_with_live_runtime, "_isxdigit": _isxdigit, "_ftell": _ftell, "_exit": _exit, "_sprintf": _sprintf, "_strrchr": _strrchr, "_fmod": _fmod, "__isLeapYear": __isLeapYear, "_ferror": _ferror, "_llvm_uadd_with_overflow_i32": _llvm_uadd_with_overflow_i32, "_gmtime": _gmtime, "_localtime_r": _localtime_r, "_sinh": _sinh, "_recv": _recv, "_cos": _cos, "_putchar": _putchar, "_islower": _islower, "_acos": _acos, "_isupper": _isupper, "_strftime": _strftime, "_strncmp": _strncmp, "_tzset": _tzset, "_setlocale": _setlocale, "_ldexp": _ldexp, "_toupper": _toupper, "_printf": _printf, "_pread": _pread, "_fopen": _fopen, "_open": _open, "_frexp": _frexp, "__arraySum": __arraySum, "_log": _log, "_isalnum": _isalnum, "_system": _system, "_isalpha": _isalpha, "_rmdir": _rmdir, "_log10": _log10, "_srand": _srand, "__formatString": __formatString, "_getenv": _getenv, "_llvm_pow_f64": _llvm_pow_f64, "_sbrk": _sbrk, "_tanh": _tanh, "_localeconv": _localeconv, "___errno_location": ___errno_location, "_strerror": _strerror, "_llvm_lifetime_start": _llvm_lifetime_start, "_strspn": _strspn, "_ungetc": _ungetc, "_rename": _rename, "_sysconf": _sysconf, "_fread": _fread, "_abort": _abort, "_fprintf": _fprintf, "_tan": _tan, "___buildEnvironment": ___buildEnvironment, "_feof": _feof, "__addDays": __addDays, "_gmtime_r": _gmtime_r, "_ispunct": _ispunct, "_clearerr": _clearerr, "_fabs": _fabs, "_floor": _floor, "__reallyNegative": __reallyNegative, "_fseek": _fseek, "_sqrt": _sqrt, "_write": _write, "_sin": _sin, "_longjmp": _longjmp, "_atan": _atan, "_strpbrk": _strpbrk, "_isgraph": _isgraph, "_unlink": _unlink, "__exit": __exit, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_emscripten_run_script_int": _emscripten_run_script_int, "_difftime": _difftime, "_iscntrl": _iscntrl, "_atan2": _atan2, "_exp": _exp, "_time": _time, "_setvbuf": _setvbuf, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "_stderr": _stderr, "_stdout": _stdout }, buffer);
var _testSetjmp = Module["_testSetjmp"] = asm["_testSetjmp"];
var _saveSetjmp = Module["_saveSetjmp"] = asm["_saveSetjmp"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _memcmp = Module["_memcmp"] = asm["_memcmp"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _lua_execute = Module["_lua_execute"] = asm["_lua_execute"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}

var Lua = {
  // public
  init: function() {
    Lua.execute("-- JS<-->Lua glue\n--\n-- Horribly hackish, this is not the right way to do it\n\njs.number = 1\njs.string = 2\njs.object = 3\njs.func = 4\n\njs.lua_table = {}\njs.lua_index = 1\n\njs.to_js = function(x)\n  if type(x) == 'number' then return tostring(x)\n  elseif type(x) == 'string' then return '\"' .. x .. '\"'\n  elseif type(x) == 'function' then\n    local lua_index = js.lua_index\n    js.lua_index = js.lua_index + 1\n    js.lua_table[lua_index] = x\n    return 'Lua.funcWrapper(' .. lua_index .. ')'\n  --elseif type(x) == 'table' then return 'Lua.wrappers[\n  else return '<{[Unsupported]}>' end\nend\n\njs.convert_args = function(args)\n  local js_args = ''\n  for i, v in ipairs(args) do\n    if i > 1 then js_args = js_args .. ',' end\n    js_args = js_args .. js.to_js(v)\n  end\n  return js_args\nend\n\njs.wrapper_index = 1\n\njs.wrapper = {}\n\njs.wrapper.__index = function(table, key)\n  if key == 'new' then\n    local ret = { what = 'Lua.wrappers[' .. table.index .. ']' }\n    setmetatable(ret, js.new.property)\n    return ret\n  end\n  return js.get('Lua.wrappers[' .. table.index .. '].' .. key, table)\nend\n\njs.wrapper.__newindex = function(table, key, v)\n  js.run('Lua.wrappers[' .. table.index .. '].'..key..\"=\"..js.to_js(v))\nend\n\njs.wrapper.__call = function(table, ...)\n  if rawget(table, 'parent') then\n    local suffix = js.convert_args({...})\n    if string.len(suffix) > 0 then suffix = ',' .. suffix end\n    return js.get('(tempFunc = Lua.wrappers[' .. table.index .. '], tempFunc).call(Lua.wrappers[' .. table.parent.index .. ']' .. suffix .. ')') -- tempFunc needed to work around js invalid call issue FIXME\n  else\n    return js.get('(tempFunc = Lua.wrappers[' .. table.index .. '], tempFunc)(' .. js.convert_args({...}) .. ')') -- tempFunc needed to work around js invalid call issue FIXME\n  end\nend\n\njs.wrapper.__gc = function(table)\n  js.run('delete Lua.reverseWrappers[Lua.wrappers['..table.index..']]')\n  js.run('delete Lua.wrappers['..table.index..']')\nend\n\nlocal wrapper_store = {}\nsetmetatable(wrapper_store, {__mode='v'})\n\njs.getWrapperStore = function() return wrapper_store end\njs.storeGet = function(idx) return wrapper_store[idx] end\n\njs.get = function(what, parent)\n  local ret = { index = js.wrapper_index, parent=false }\n  js.wrapper_index = js.wrapper_index + 1\n  local return_type = js.run(\"Lua.test('\" .. what .. \"', \"..(js.wrapper_index-1)..\")\")\n  if return_type < 0 then\n    return wrapper_store[-return_type]\n  elseif return_type == js.number then\n    return js.run('Lua.last')\n  elseif return_type == js.string then\n    return js.run_string('Lua.last')\n  elseif return_type == js.object or return_type == js.func then\n    js.run('Lua.wrappers[' .. ret.index .. '] = Lua.last')\n    ret.parent = parent\n    setmetatable(ret, js.wrapper)\n    wrapper_store[js.wrapper_index-1] = ret\n    return ret\n  else\n    return '!Unsupported!'\n  end\nend\n\njs.global = js.get('Lua.theGlobal')\n\njs.new = {}\nsetmetatable(js.new, js.new)\njs.new.__index = function(table, key)\n  local ret = { what = key }\n  setmetatable(ret, js.new.property)\n  return ret\nend\n\njs.new.property = {}\njs.new.property.__call = function(table, ...)\n  return js.get('new ' .. table.what .. '(' .. js.convert_args({...}) .. ')')\nend\n\n");

    if (typeof window == 'object') {
      // Run script tags on page
      var onload = window.onload;
      window.onload = function() {
        if (onload) onload();
        Lua.executeScripts();
      };
    }
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

if (!Module.noInitialRun) Lua.init();

