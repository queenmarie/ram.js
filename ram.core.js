/**
 * The core ram module.
 */
(function(global) {
  var middleware = [], ram, modules = {};

  /**
   * The ram object.  Use `ram('selector')` for quick DOM access when built with the DOM module.
   *
   * @returns {Object} The ram object, run through `init`
   */
  ram = function() {
    var result, i;
    for (i = 0; i < middleware.length; i++) {
      result = middleware[i].apply(ram, arguments);
      if (result) {
        return result;
      }
    }
  }

  ram.VERSION = '0.0.90';
  ram.lesson = 'Part 90: AMD';

  /**
   * This alias will be used as an alternative to `ram()`.
   * If `__ram_alias` is present in the global scope this will be used instead. 
   * 
   */
  if (typeof window !== 'undefined') {
    ram.alias = window.__ram_alias || '$r';
    window[ram.alias] = ram;
  }

  /**
   * Determine if an object is an `Array`.
   *
   * @param {Object} object An object that may or may not be an array
   * @returns {Boolean} True if the parameter is an array
   */
  ram.isArray = Array.isArray || function(object) {
    return !!(object && object.concat
              && object.unshift && !object.callee);
  };

  /**
   * Convert an `Array`-like collection into an `Array`.
   *
   * @param {Object} collection A collection of items that responds to length
   * @returns {Array} An `Array` of items
   */
  ram.toArray = function(collection) {
    var results = [], i;
    for (i = 0; i < collection.length; i++) {
      results.push(collection[i]);
    }
    return results;
  };

  // This can be overriden by libraries that extend ram(...)
  ram.init = function(fn) {
    middleware.unshift(fn);
  };

  /**
   * Determines if an object is a `Number`.
   *
   * @param {Object} object A value to test
   * @returns {Boolean} True if the object is a Number
   */
  ram.isNumber = function(object) {
    return (object === +object) || (toString.call(object) === '[object Number]');
  };

  /**
   * Binds a function to an object.
   *
   * @param {Function} fn A function
   * @param {Object} object An object to bind to
   * @returns {Function} A rebound method
   */
  ram.bind = function(fn, object) {
    var slice = Array.prototype.slice,
        args  = slice.apply(arguments, [2]);
    return function() {
      return fn.apply(object || {}, args.concat(slice.apply(arguments)));
    };
  };

  var testCache = {},
      detectionTests = {};

  /**
   * Used to add feature-detection methods.
   *
   * @param {String} name The name of the test
   * @param {Function} fn The function that performs the test
   */
  ram.addDetectionTest = function(name, fn) {
    if (!detectionTests[name]) {
      detectionTests[name] = fn;
    }
  };

  /**
   * Run a feature detection name.
   *
   * @param {String} name The name of the test
   * @returns {Boolean} The outcome of the test
   */
  ram.detect = function(testName) {
    if (typeof testCache[testCache] === 'undefined') {
      testCache[testName] = detectionTests[testName]();
    }
    return testCache[testName];
  };

  ram.define = function(module, dependencies, fn) {
    if (typeof define === 'function' && define.amd) {
      define(module, dependencies, fn);
    } else {
      if (dependencies && dependencies.length) {
        for (var i = 0; i < dependencies.length; i++) {
          dependencies[i] = modules[dependencies[i]];
        }
      }
      modules[module] = fn.apply(this, dependencies || []);
    }
  };

  /**
   * Export `ram` based on environment.
   */
  global.ram = ram;

  if (typeof exports !== 'undefined') {
    exports.ram = ram;
  }

  ram.define('ram.core', [], function() { return ram; } );

  if (typeof define === 'undefined') {
    global.define = ram.define;
  }
}(typeof window === 'undefined' ? this : window));
