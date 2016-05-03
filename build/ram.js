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

  ram.v = 'ram.js javascript framework : Version 0.0.1';
  ram.arki = 'AMD';
  ram.io = 'need anything? dont know how to get it? visit ram.io today lol';
  ram.author = 'Marie, Ritwick'

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

/**
 * The ram Class:
 * 
 *     User = ram.Class({
 *       initialize: function(name, age) {
 *         this.name = name;
 *         this.age  = age;
 *       }
 *     });
 *
 *     new User('Osama', '69');
 *
 * Inheritance:
 *
 * Pass an object to `ram.Class` to inherit from it.
 *
 *     SuperUser = ram.Class(User, {
 *       initialize: function() {
 *         this.$super('initialize', arguments);
 *       },
 *
 *       toString: function() {
 *         return "SuperUser: " + this.$super('toString');
 *       }
 *     });
 *
 * Mixins: 
 * 
 * Objects can be embedded within each other:
 *
 *     MixinUser = ram.Class({
 *       include: User,
 *
 *       initialize: function(log) {
 *         this.log = log;
 *       }
 *     });
 *
 **/
define('ram.oo', ['ram.core'], function(ram) {
  var Class, oo;

  Class = function() {
    return oo.create.apply(this, arguments);
  }

  oo = {
    create: function() {
      var methods = null,
          parent  = undefined,
          klass   = function() {
            this.$super = function(method, args) { return oo.$super(this.$parent, this, method, args); };
            this.initialize.apply(this, arguments);
          };

      if (typeof arguments[0] === 'function') {
        parent = arguments[0];
        methods = arguments[1];
      } else {
        methods = arguments[0];
      }

      if (typeof parent !== 'undefined') {
        oo.extend(klass.prototype, parent.prototype);
        klass.prototype.$parent = parent.prototype;
      }

      oo.mixin(klass, methods);
      oo.extend(klass.prototype, methods);
      klass.prototype.constructor = klass;

      if (!klass.prototype.initialize)
        klass.prototype.initialize = function(){};

      return klass;
    },

    mixin: function(klass, methods) {
      if (typeof methods.include !== 'undefined') {
        if (typeof methods.include === 'function') {
          oo.extend(klass.prototype, methods.include.prototype);
        } else {
          for (var i = 0; i < methods.include.length; i++) {
            oo.extend(klass.prototype, methods.include[i].prototype);
          }
        }
      }
    },

    extend: function(destination, source) {
      for (var property in source)
        destination[property] = source[property];
      return destination;
    },
    $super: function(parentClass, instance, method, args) {
      return parentClass[method].apply(instance, args);
    }
  };

  ram.Class = Class;
  ram.oo = oo;
  return oo;
});

/**
 * The ram Enumerable module.
 *
 * This is bound to DOM objects:
 *
 *     global('p').each(function() {
 *       // `this` contains a DOM element
 *     });
 * 
 */
define('ram.enumerable', ['ram.core'], function(ram) {
  function EnumerableModule(global) {
    global.enumerable = {
      /**
       * Throw to break out of iterators.
       */
      Break: {},

      /**
       * Iterates using a function over a set of items.  Example:
       *
       *      ram.enumerable.each([1, 2, 3], function(n) {
       *        console.log(n);
       *      });
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Function} callback The function to run
       * @param {Object} [context] An optional parameter to determine `this` in the callback
       * @returns {Object} The passed in enumerable object
       */
      each: function(enumerable, callback, context) {
        try {
          if (Array.prototype.forEach && enumerable.forEach === Array.prototype.forEach) {
            enumerable.forEach(callback, context);
          } else if (global.isNumber(enumerable.length)) {
            for (var i = 0, l = enumerable.length; i < l; i++) callback.call(enumerable, enumerable[i], i, enumerable);
          } else {
            for (var key in enumerable) {
              if (hasOwnProperty.call(enumerable, key)) callback.call(context, enumerable[key], key, enumerable);
            }
          }
        } catch(e) {
          if (e != global.enumerable.Break) throw e;
        }

        return enumerable;
      },

      /**
       * Changes a set of item using a function. Example:
       *
       *      ram.enumerable.map([1, 2, 3], function(n) {
       *        return n + 1;
       *      });
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Function} callback The function to run over each item
       * @param {Object} [context] An optional parameter to determine `this` in the callback
       * @returns {Array} The changed items
       */
      map: function(enumerable, callback, context) {
        if (Array.prototype.map && enumerable.map === Array.prototype.map) return enumerable.map(callback, context);
        var results = [];
        global.enumerable.each(enumerable, function(value, index, list) {
          results.push(callback.call(context, value, index, list));
        });
        return results;
      },

      /**
       * Removes items based on a callback.  For example:
       *
       *      var a = [1, 2, 3, 4, 5, 6, 7, 8];
       *      ram.enumerable.filter(a, function(n) {
       *        return n % 2 === 0;
       *      });
       *
       *      => [2, 4, 6, 8]
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Function} callback The function to run over each item
       * @param {Object} [context] An optional parameter to determine `this` in the callback
       * @returns {Array} The filtered items
       */
      filter: function(enumerable, callback, context) {
        if (Array.prototype.filter && enumerable.filter === Array.prototype.filter)
          return enumerable.filter(callback, context);
        var results   = [],
            pushIndex = !global.isArray(enumerable);
        global.enumerable.each(enumerable, function(value, index, list) {
          if (callback.call(context, value, index, list)) {
            if (pushIndex) {
              results.push([index, value]);
            } else {
              results.push(value);
            }
          }
        });
        return results;
      },

      /**
       * The opposite of filter.  For example:
       *
       *      var a = [1, 2, 3, 4, 5, 6, 7, 8];
       *      ram.enumerable.reject(a, function(n) {
       *        return n % 2 === 0;
       *      });
       *
       *      => [1, 3, 5, 7]
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Function} callback The function to run over each item
       * @param {Object} [context] An optional parameter to determine `this` in the callback
       * @returns {Array} The rejected items
       */
      reject: function(enumerable, callback, context) {
        return this.filter(enumerable, function() {
          return !callback.apply(context, arguments);
        }, context);
      },

      /**
       * Find a single item.  For example:
       *
       *      var a = [1, 2, 3, 4, 5, 6, 7, 8];
       *      ram.enumerable.detect(a, function(n) {
       *        return n === 3;
       *      });
       *
       *      => 3
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Function} callback The function to run over each item
       * @param {Object} [context] An optional parameter to determine `this` in the callback
       * @returns {Object} The item, if found
       */
      detect: function(enumerable, callback, context) {
        var result;
        global.enumerable.each(enumerable, function(value, index, list) {
          if (callback.call(context, value, index, list)) {
            result = value;
            throw global.enumerable.Break;
          }
        });
        return result;
      },

      /**
       * Runs a function over each item, collecting the results:
       *
       *      var a = [1, 2, 3, 4, 5, 6, 7, 8];
       *      ram.enumerable.reduce(a, 0, function(memo, n) {
       *        return memo + n;
       *      });
       *
       *      => 36
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Object} memo The initial accumulator value
       * @param {Function} callback The function to run over each item
       * @param {Object} [context] An optional parameter to determine `this` in the callback
       * @returns {Object} The accumulated results
       */
      reduce: function(enumerable, memo, callback, context) {
        if (Array.prototype.reduce && enumerable.reduce === Array.prototype.reduce)
          return enumerable.reduce(global.bind(callback, context), memo);
        global.enumerable.each(enumerable, function(value, index, list) {
          memo = callback.call(context, memo, value, index, list);
        });
        return memo;
      },

      /**
       * Flattens multidimensional arrays:
       *
       *      ram.enumerable.flatten([[2, 4], [[6], 8]]);
       *
       *      => [2, 4, 6, 8]
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @returns {Object} The flat array
       */
      flatten: function(array) {
        return global.enumerable.reduce(array, [], function(memo, value) {
          if (global.isArray(value)) return memo.concat(global.enumerable.flatten(value));
          memo.push(value);
          return memo;
        });
      },

      /**
       * Return the last items from a list:
       *
       *      ram.enumerable.tail([1, 2, 3, 4, 5], 3);
       *
       *      => [4, 5]
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Number} start The index of the item to 'cut' the array
       * @returns {Object} A list of items
       */
      tail: function(enumerable, start) {
        start = typeof start === 'undefined' ? 1 : start;
        return Array.prototype.slice.apply(enumerable, [start]);
      },

      /**
       * Invokes `method` on a list of items:
       *
       *      ram.enumerable.invoke(['hello', 'world'], 'substring', 0, 3);
       *
       *      => ['hel', 'wor']
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Function} method The method to invoke on each item
       * @returns {Object} The changed list
       */
      invoke: function(enumerable, method) {
        var args = global.enumerable.tail(arguments, 2); 
        return global.enumerable.map(enumerable, function(value) {
          return (method ? value[method] : value).apply(value, args);
        });
      },

      /**
       * Pluck a property from each item of a list:
       *
       *      ram.enumerable.pluck(['hello', 'world'], 'length');
       *
       *      => [5, 5]
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {String} key The property to pluck
       * @returns {Object} The plucked properties
       */
      pluck: function(enumerable, key) {
        return global.enumerable.map(enumerable, function(value) {
          return value[key];
        });
      },

      /**
       * Determines if a list matches some items based on a callback:
       *
       *      ram.enumerable.some([1, 2, 3], function(value) {
       *        return value === 3;
       *      });
       *
       *      => true
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Function} callback A function to run against each item
       * @param {Object} [context] An optional parameter to determine `this` in the callback
       * @returns {Boolean} True if an item was matched
       */
      some: function(enumerable, callback, context) {
        callback = callback || global.enumerable.identity;
        if (Array.prototype.some && enumerable.some === Array.prototype.some)
          return enumerable.some(callback, context);
        var result = false;
        global.enumerable.each(enumerable, function(value, index, list) {
          if (result = callback.call(context, value, index, list)) {
            throw global.enumerable.Break;
          }
        });
        return result;
      },

      /**
       * Checks if all items match the callback:
       *
       *      ram.enumerable.all([1, 2, 3], function(value) {
       *        return value < 4;
       *      })
       *
       *      => true
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Function} callback A function to run against each item
       * @param {Object} [context] An optional parameter to determine `this` in the callback
       * @returns {Boolean} True if all items match
       */
      all: function(enumerable, callback, context) {
        callback = callback || global.enumerable.identity;
        if (Array.prototype.every && enumerable.every === Array.prototype.every)
          return enumerable.every(callback, context);
        var result = true;
        global.enumerable.each(enumerable, function(value, index, list) {
          if (!(result = result && callback.call(context, value, index, list))) {
            throw global.enumerable.Break;
          }
        });
        return result;
      },

      /**
       * Checks if one item matches a value:
       *
       *      ram.enumerable.include([1, 2, 3], 3);
       *
       *      => true
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @param {Object} target A value to find
       * @returns {Boolean} True if an item was found
       */
      include: function(enumerable, target) {
        if (Array.prototype.indexOf && enumerable.indexOf === Array.prototype.indexOf)
          return enumerable.indexOf(target) != -1;
        var found = false;
        global.enumerable.each(enumerable, function(value, key) {
          if (found = value === target) {
            throw global.enumerable.Break;
          }
        });
        return found;
      },

      /**
       * Chain enumerable calls:
       *
       *      ram.enumerable.chain([1, 2, 3, 4])
       *        .filter(function(n) { return n % 2 == 0; })
       *        .map(function(n) { return n * 10; })
       *        .values();
       *
       *      => [20, 40]
       *
       * @param {Object} enumerable A set of items that responds to `length`
       * @returns {Object} The chained enumerable API
       */
      chain: function(enumerable) {
        return new global.enumerable.Chainer(enumerable);
      },

      identity: function(value) {
        return value;
      }
    };

    // Aliases
    global.enumerable.select = global.enumerable.filter;
    global.enumerable.collect = global.enumerable.map;
    global.enumerable.inject = global.enumerable.reduce;
    global.enumerable.rest = global.enumerable.tail;
    global.enumerable.any = global.enumerable.some;
    global.enumerable.every = global.enumerable.all;
    global.chainableMethods = ['map', 'collect', 'detect', 'filter', 'reduce', 'each',
                               'tail', 'rest', 'reject', 'pluck', 'any', 'some', 'all'];

    // Chainer class
    global.enumerable.Chainer = function(values) {
      this.results = values;
    };

    global.enumerable.Chainer.prototype.values = function() {
      return this.results;
    };

    global.enumerable.each(global.chainableMethods, function(methodName) {
      var method = global.enumerable[methodName];
      global.enumerable.Chainer.prototype[methodName] = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this.results);
        this.results = method.apply(this, args);
        return this;
      }
    });

    global.init(function(arg) {
      if (arg.hasOwnProperty.length && typeof arg !== 'string') {
        return global.enumerable.chain(arg);
      }
    });
  }

  if (typeof module !== 'undefined') {
    module.exports = function(t) {
      return EnumerableModule(t);
    }
  } else {
    EnumerableModule(ram);
  }
});

/**
 * The ram Promise module.
 */
define('ram.promise', ['ram.core'], function(ram) {
  function PromiseModule(global) {
    /**
     * The Promise class.
     */
    function Promise() {
      var self = this;
      this.pending = [];

      /**
       * Resolves a promise.
       *
       * @param {Object} A value
       */
      this.resolve = function(result) {
        self.complete('resolve', result);
      },

      /**
       * Rejects a promise.
       *
       * @param {Object} A value
       */
      this.reject = function(result) {
        self.complete('reject', result);
      }
    }

    Promise.prototype = {
      /**
       * Adds a success and failure handler for completion of this Promise object.
       *
       * @param {Function} success The success handler 
       * @param {Function} success The failure handler
       * @returns {Promise} `this`
       */
      then: function(success, failure) {
        this.pending.push({ resolve: success, reject: failure });
        return this;
      },

      /**
       * Runs through each pending 'thenable' based on type (resolve, reject).
       *
       * @param {String} type The thenable type
       * @param {Object} result A value
       */
      complete: function(type, result) {
        while (this.pending[0]) {
          this.pending.shift()[type](result);
        }
      }
    };

    /**
      * Chained Promises:
      *
      *     global().delay(1000).then(function() {
      *       assert.ok((new Date()).valueOf() - start >= 1000);  
      *     });
      *
      */
    var chain = {};

    ram.init(function() {
      if (arguments.length === 0)
        return chain;
    });

    chain.delay = function(ms) {
      var p = new ram.Promise();
      setTimeout(p.resolve, ms);
      return p;
    };

    global.Promise = Promise;
  }

  if (typeof module !== 'undefined') {
    module.exports = function(t) {
      return PromiseModule(t);
    }
  } else {
    PromiseModule(ram);
  }

  return ram.Promise;
});


/**
 * ram Functional helpers.
 */
define('ram.functional', ['ram.core'], function(ram) {
  ram.functional = {
    curry: ram.bind,

    memoize: function(memo, fn) {
      var wrapper = function(n) {
        var result = memo[n];
        if (typeof result !== 'number') {
          result = fn(wrapper, n);
          memo[n] = result;
        }
        return result;
      };
      return wrapper;
    } 
  };
  return ram;
});

/**
 * The ram DOM module.
 */
define('ram.dom', ['ram.core'], function(ram) {
  var dom = {}, InvalidFinder = Error, macros, rules, tokenMap,
      find, matchMap, findMap, filter, scannerRegExp, nodeTypes,
      getStyle, setStyle, cssNumericalProperty, propertyFix,
      getAttributeParamFix, booleanAttributes;

  macros = {
    'nl':        '\n|\r\n|\r|\f',
    'w':         '[\s\r\n\f]*',
    'nonascii':  '[^\0-\177]',
    'num':       '-?([0-9]+|[0-9]*\.[0-9]+)',
    'unicode':   '\\[0-9A-Fa-f]{1,6}(\r\n|[\s\n\r\t\f])?',
    'escape':    '#{unicode}|\\[^\n\r\f0-9A-Fa-f]',
    'nmchar':    '[_A-Za-z0-9-]|#{nonascii}|#{escape}',
    'nmstart':   '[_A-Za-z]|#{nonascii}|#{escape}',
    'ident':     '[-@]?(#{nmstart})(#{nmchar})*',
    'name':      '(#{nmchar})+',
    'string1':   '"([^\n\r\f"]|#{nl}|#{nonascii}|#{escape})*"',
    'string2':   "'([^\n\r\f']|#{nl}|#{nonascii}|#{escape})*'",
    'string':    '#{string1}|#{string2}'
  };

  nodeTypes = {
    ELEMENT_NODE:                  1,
    ATTRIBUTE_NODE:                2,
    TEXT_NODE:                     3,
    CDATA_SECTION_NODE:            4,
    ENTITY_REFERENCE_NODE:         5,
    ENTITY_NODE:                   6,
    PROCESSING_INSTRUCTION_NODE:   7,
    COMMENT_NODE:                  8,
    DOCUMENT_NODE:                 9,
    DOCUMENT_TYPE_NODE:            10,
    DOCUMENT_FRAGMENT_NODE:        11,
    NOTATION_NODE:                 12
  };

  cssNumericalProperty = {
    'zIndex':     true,
    'fontWeight': true,
    'opacity':    true,
    'zoom':       true,
    'lineHeight': true
  };

  booleanAttributes = {
    'selected': true,
    'readonly': true,
    'checked':  true
  };

  rules = {
    'name and id':    '(#{ident}##{ident})',
    'id':             '(##{ident})',
    'class':          '(\\.#{ident})',
    'name and class': '(#{ident}\\.#{ident})',
    'element':        '(#{ident})',
    'pseudo class':   '(:#{ident})'
  };

  propertyFix = {
    tabindex:        'tabIndex',
    readonly:        'readOnly',
    'for':           'htmlFor',
    'class':         'className',
    maxlength:       'maxLength',
    cellspacing:     'cellSpacing',
    cellpadding:     'cellPadding',
    rowspan:         'rowSpan',
    colspan:         'colSpan',
    usemap:          'useMap',
    frameborder:     'frameBorder',
    contenteditable: 'contentEditable'
  };

  getAttributeParamFix = {
    width: true,
    height: true,
    src: true,
    href: true
  };

  ram.addDetectionTest('classList', function() {
    var div = document.createElement('div');

    if (div.classList) {
      return true;
    }

    div = null;
    return false;
  });

  function scanner() {
    function replacePattern(pattern, patterns) {
      var matched = true, match;
      while (matched) {
        match = pattern.match(/#\{([^}]+)\}/);
        if (match && match[1]) {
          pattern = pattern.replace(new RegExp('#\{' + match[1] + '\}', 'g'), patterns[match[1]]);
          matched = true;
        } else {
          matched = false;
        }
      }
      return pattern;
    }

    function escapePattern(text) {
      return text.replace(/\//g, '//');
    }

    function convertPatterns() {
      var key, pattern, results = {}, patterns, source;

      if (arguments.length === 2) {
        source = arguments[0];
        patterns = arguments[1];
      } else {
        source = arguments[0];
        patterns = arguments[0];
      }

      for (key in patterns) {
        pattern = escapePattern(replacePattern(patterns[key], source));
        results[key] = pattern;
      }

      return results;
    }

    function joinPatterns(regexps) {
      var results = [], key;
      for (key in regexps) {
        results.push(regexps[key]);
      }
      return new RegExp(results.join('|'), 'g');
    }

    return joinPatterns(
      convertPatterns(convertPatterns(macros), rules)
    );
  }

  scannerRegExp = scanner();

  find = {
    byId: function(root, id) {
      if (root === null) return [];
      return [root.getElementById(id)];
    },

    byNodeName: function(root, tagName) {
      if (root === null) return [];
      var i, results = [], nodes = root.getElementsByTagName(tagName);
      for (i = 0; i < nodes.length; i++) {
        results.push(nodes[i]);
      }
      return results;
    },

    byClassName: function(root, className) {
      if (root === null) return [];
      var i, results = [], nodes = root.getElementsByTagName('*');
      for (i = 0; i < nodes.length; i++) {
        if (nodes[i].className.match('\\b' + className + '\\b')) {
          results.push(nodes[i]);
        }
      }
      return results;
    }
  };

  findMap = {
    'id': function(root, selector) {
      selector = selector.split('#')[1];
      return find.byId(root, selector);
    },

    'name and id': function(root, selector) {
      var matches = selector.split('#'), name, id;
      name = matches[0];
      id = matches[1];
      return filter.byAttr(find.byId(root, id), 'nodeName', name.toUpperCase());
    },

    'name': function(root, selector) {
      return find.byNodeName(root, selector);
    },

    'class': function(root, selector) {
      selector = selector.split('\.')[1];
      return find.byClassName(root, selector);
    },

    'name and class': function(root, selector) {
      var matches = selector.split('\.'), name, className;
      name = matches[0];
      className = matches[1];
      return filter.byAttr(find.byClassName(root, className), 'nodeName', name.toUpperCase());
    }
  };

  if (typeof document !== 'undefined' && typeof document.getElementsByClassName !== 'undefined') {
    find.byClassName = function(root, className) {
      return root.getElementsByClassName(className);
    };
  }

  filter = {
    byAttr: function(elements, attribute, value) {
      var key, results = [];
      for (key in elements) {
        if (elements[key] && elements[key][attribute] === value) {
          results.push(elements[key]);
        }
      }
      return results;
    }
  };

  matchMap = {
    'id': function(element, selector) {
      selector = selector.split('#')[1];
      return element && element.id === selector;
    },

    'name': function(element, nodeName) {
      return element.nodeName === nodeName.toUpperCase();
    },

    'name and id': function(element, selector) {
      return matchMap.id(element, selector) && matchMap.name(element, selector.split('#')[0]);
    },

    'class': function(element, selector) {
      if (element && element.className) {
        selector = selector.split('\.')[1];
        return element.className.match('\\b' + selector + '\\b'); 
      }
    },

    'name and class': function(element, selector) {
      return matchMap['class'](element, selector) && matchMap.name(element, selector.split('\.')[0]);
    }
  };

  function Searcher(root, tokens) {
    this.root = root;
    this.key_selector = tokens.pop();
    this.tokens = tokens;
    this.results = [];
  }

  Searcher.prototype.matchesToken = function(element, token) {
    if (!matchMap[token.finder]) {
      throw new InvalidFinder('Invalid matcher: ' + token.finder); 
    }
    return matchMap[token.finder](element, token.identity);
  };

  Searcher.prototype.find = function(token) {
    if (!findMap[token.finder]) {
      throw new InvalidFinder('Invalid finder: ' + token.finder); 
    }
    return findMap[token.finder](this.root, token.identity); 
  };

  Searcher.prototype.matchesAllRules = function(element) {
    if (this.tokens.length === 0) return;

    var i = this.tokens.length - 1,
        token = this.tokens[i],
        matchFound = false;

    while (i >= 0 && element) {
      if (this.matchesToken(element, token)) {
        matchFound = true;
        i--;
        token = this.tokens[i];
      }
      element = element.parentNode;
    }

    return matchFound && i < 0;
  };

  Searcher.prototype.parse = function() {
    // Find all elements with the key selector
    var i, element, elements = this.find(this.key_selector), results = [];

    // Traverse upwards from each element to see if it matches all of the rules
    for (i = 0; i < elements.length; i++) {
      element = elements[i];
      if (this.tokens.length > 0) {
        if (this.matchesAllRules(element.parentNode)) {
          results.push(element);
        }
      } else {
        if (this.matchesToken(element, this.key_selector)) {
          results.push(element);
        }
      }
    }
    return results;
  };

  Searcher.prototype.values = function() {
    return this.results;
  };

  function normalize(text) {
    return text.replace(/^\s+|\s+$/g, '').replace(/[ \t\r\n\f]+/g, ' ');
  }

  // Tokens are used by the Tokenizer
  function Token(identity, finder) {
    this.identity = identity;
    this.finder   = finder;
  }

  Token.prototype.toString = function() {
    return 'identity: ' + this.identity + ', finder: ' + this.finder;
  };

  // Tokenizer: classify sections of the scanner output
  function Tokenizer(selector) {
    this.selector = normalize(selector);
    this.tokens = [];
    this.tokenize();
  }

  Tokenizer.prototype.tokenize = function() {
    var match, r, finder;

    r = scannerRegExp;
    r.lastIndex = 0;

    while (match = r.exec(this.selector)) {
      finder = null;

      if (match[10]) {
        finder = 'id';
      } else if (match[1]) {
        finder = 'name and id';
      } else if (match[29]) {
        finder = 'name';
      } else if (match[15]) {
        finder = 'class';
      } else if (match[20]) {
        finder = 'name and class';
      }
      this.tokens.push(new Token(match[0], finder));
    }
    return this.tokens;
  };

  Tokenizer.prototype.finders = function() {
    var i, results = [];
    for (i in this.tokens) {
      results.push(this.tokens[i].finder);
    }
    return results;
  };

  dom.tokenize = function(selector) {
    var tokenizer = new Tokenizer(selector);
    return tokenizer;
  };

  function get(selector, root) {
    var tokens = dom.tokenize(selector).tokens,
        searcher = new Searcher(root, tokens);
    return searcher.parse();
  }

  ram.addDetectionTest('querySelectorAll', function() {
    var div = document.createElement('div');
    div.innerHTML = '<p class="TEST"></p>';

    // Some versions of Safari can't handle uppercase in quirks mode
    if (div.querySelectorAll) {
      if (div.querySelectorAll('.TEST').length === 0) return false;
      return true;
    }

    // Helps IE release memory associated with the div
    div = null;
    return false;
  });

  /**
   * Converts property names with hyphens to camelCase.
   *
   * @param {String} text A property name
   * @returns {String} text A camelCase property name
   */
  function camelCase(text) {
    if (typeof text !== 'string') return;
    return text.replace(/-([a-z])/ig, function(all, letter) { return letter.toUpperCase(); });
  };

  /**
   * Converts property names in camelCase to ones with hyphens.
   *
   * @param {String} text A property name
   * @returns {String} text A camelCase property name
   */
  function uncamel(text) {
    if (typeof text !== 'string') return;
    return text.replace(/([A-Z])/g, '-$1').toLowerCase();
  };

  function invalidCSSNode(element) {
    return !element || element.nodeType === nodeTypes.TEXT_NODE || element.nodeType === nodeTypes.COMMENT_NODE || !element.style;
  }

  function setStyleProperty(element, property, value) {
    if (invalidCSSNode(element)) {
      return;
    }

    if (typeof value === 'number' && !cssNumericalProperty[property]) {
      value += 'px';
    }

    element.style[property] = value;
  }

  if (typeof document !== 'undefined') {
    if (document.documentElement.currentStyle) {
      getStyle = function(element, property) {
        return element.currentStyle[camelCase(property)];
      };

      setStyle = function(element, property, value) {
        return setStyleProperty(element, camelCase(property), value);
      };
    } else if (document.defaultView.getComputedStyle) {
      getStyle = function(element, property) {
        return element.ownerDocument.defaultView.getComputedStyle(element, null).getPropertyValue(uncamel(property));
      };

      setStyle = function(element, property, value) {
        return setStyleProperty(element, property, value);
      };
    }
  }

  /**
   * Gets or sets style values.
   *
   * @param {Object} element A DOM element
   * @returns {Object} The style value
   */
  dom.css = function(element, options) {
    if (typeof options === 'string') {
      return getStyle(element, options);
    } else {
      for (var property in options) {
        if (options.hasOwnProperty(property)) {
          setStyle(element, property, options[property]);
        }
      }
    }
  };

  /**
   * Finds DOM elements based on a CSS selector.
   *
   * @param {String} selector A CSS selector
   * @returns {Array} The elements
   */
  dom.get = function(selector) {
    var root = typeof arguments[1] === 'undefined' ? document : arguments[1];
    return ram.toArray(ram.detect('querySelectorAll') ?
      root.querySelectorAll(selector) : get(selector, root));
  };

  /**
   * Does an element satify a selector, based on root element?
   *
   * @param {Object} element A DOM element
   * @param {String} selector A CSS selector
   * @param {Object} root The root DOM element
   * @returns {Object} The matching DOM element
   */
  dom.findElement = function(element, selector, root) {
    var tokens = dom.tokenize(selector).tokens,
        searcher = new Searcher(root, []);
    searcher.tokens = tokens;
    while (element) {
      if (searcher.matchesAllRules(element)) {
        return element;
      }
      element = element.parentNode;
    }
  };

  function manipulateDOM(element, html, callback) {
    var context = document,
        isTable = element.nodeName === 'TABLE',
        shim,
        div;

    div = context.createElement('div');
    div.innerHTML = '<' + element.nodeName + '>' + html + '</' + element.nodeName + '>';
    shim = isTable ? div.lastChild.lastChild : div.lastChild;
    callback(isTable ? element.lastChild : element, shim);
    div = null;
  };

  function getText(elements) {
    var results = '', element, i;

    for (i = 0; elements[i]; i++) {
      element = elements[i];
      if (element.nodeType === nodeTypes.TEXT_NODE 
          || element.nodeType === nodeTypes.CDATA_SECTION_NODE) {
        results += element.nodeValue;
      } else if (element.nodeType !== nodeTypes.COMMENT_NODE) {
        results += getText(element.childNodes);
      }
    }

    return results;
  };

  /**
   * Replaces the content of an element.
   *
   * @param {Object} element A DOM element
   * @param {String} html A string containing HTML
   */
  dom.replace = function(element, html) {
    manipulateDOM(element, html, function(insert, shim) {
      element.replaceChild(shim, insert);
    });
  };

  /**
   * Appends an element to the end of an element.
   *
   * @param {Object} element A DOM element
   * @param {String} html A string containing HTML
   */
  dom.append = function(element, html) {
    manipulateDOM(element, html, function(insertTo, shim) {
      insertTo.appendChild(shim.firstChild);
    });
  };

  /**
   * Set or get innerHTML.
   *
   * @param {Object} element A DOM element
   * @param {String} html A string containing HTML
   */
  dom.html = function(element, html) {
    if (arguments.length === 1) {
      return element.innerHTML;
    }

    try {
      element.innerHTML = html;
    } catch (e) {
      dom.replace(element, html);
    }
  };

  /**
   * Set or get text nodes.
   *
   * @param {Object} element A DOM element
   * @param {String} text A string containing text
   */
  dom.text = function(element, text) {
    if (arguments.length === 1) {
      return getText(element);
    } else {
      dom.empty(element);
      element.appendChild(document.createTextNode(text));
    }
  };

  /**
   * Empty nodes.
   *
   * @param {Object} element A DOM element
   */
  dom.empty = function(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  };

  /**
   * @param {Object} element A DOM element
   * @param {String} className The class name
   * @return {Boolean}
   */
  if (ram.detect('classList')) {
    dom.hasClass = function(element, className) {
      return element.classList.contains(className);
    };
  } else {
    dom.hasClass = function(element, className) {
      return (' ' + element.className + ' ').indexOf(' ' + className + ' ') !== -1;
    };
  }

  /**
   * Append CSS classes.
   *
   * @param {Object} element A DOM element
   * @param {String} className The class name
   */
  dom.addClass = function(element, className) {
    if (!className || typeof className !== 'string') return;
    if (element.nodeType !== nodeTypes.ELEMENT_NODE) return;
    if (element.classList) return element.classList.add(className);

    if (element.className && element.className.length) {
      if (!element.className.match('\\b' + className + '\\b')) {
        element.className += ' ' + className;
      }
    } else {
      element.className = className;
    }
  };

  /**
   * Remove CSS classes.
   *
   * @param {Object} element A DOM element
   * @param {String} className The class name
   */
  dom.removeClass = function(element, className) {
    if (!className || typeof className !== 'string') return;
    if (element.nodeType !== nodeTypes.ELEMENT_NODE) return;
    if (element.classList) return element.classList.remove(className);

    if (element.className) {
      element.className = element.className.
        replace(new RegExp('\\s?\\b' + className + '\\b'), '').
        replace(/^\s+/, '');
    }
  };

  ram.addDetectionTest('getAttribute', function() {
    var div = document.createElement('div');
    div.innerHTML = '<a href="/example"></a>';

    if (div.childNodes[0].getAttribute('href') === '/example') {
      return true;
    }

    // Helps IE release memory associated with the div
    div = null;
    return false;
  });

  function getAttribute(element, name) {
    if (propertyFix[name]) {
      name = propertyFix[name];
    }

    if (getAttributeParamFix[name]) {
      return element.getAttribute(name, 2);
    }

    if (name === 'value' && element.nodeName === 'BUTTON') {
      return element.getAttributeNode(name).nodeValue;
    } else if (booleanAttributes[name]) {
      return element[name] ? name : undefined;
    }

    return element.getAttribute(name);
  }

  function setAttribute(element, name, value) {
    if (propertyFix[name]) {
      name = propertyFix[name];
    }

    if (name === 'value' && element.nodeName === 'BUTTON') {
      return element.getAttributeNode(name).nodeValue = value;
    }

    return element.setAttribute(name, value);
  }

  function removeAttribute(element, name) {
    if (element.nodeType !== nodeTypes.ELEMENT_NODE) return;
    if (propertyFix[name]) name = propertyFix[name];
    setAttribute(element, name, '');
    element.removeAttributeNode(element.getAttributeNode(name));
  }

  /**
   * Removes an attribute from a node.
   *
   * @param {Object} element A DOM element
   * @param {String} attribute The attribute name
   */
  dom.removeAttr = function(element, attribute) {
    ram.detect('getAttribute') ?
      element.removeAttribute(attribute) : removeAttribute(element, attribute);
  };

  /**
   * Get or set attributes.
   *
   * @param {Object} element A DOM element
   * @param {String} attribute The attribute name
   * @param {String} value The attribute value
   */
  dom.attr = function(element, attribute, value) {
    if (typeof value === 'undefined') {
      return ram.detect('getAttribute') ?
        element.getAttribute(attribute) : getAttribute(element, attribute);
    } else {
      if (value === null) {
        return dom.removeAttr(element, attribute);
      } else {
        return ram.detect('getAttribute') ?
          element.setAttribute(attribute, value) : setAttribute(element, attribute, value);
      }
    }
  };

  /**
   * Get or set properties.
   *
   * @param {Object} element A DOM element
   * @param {String} attribute The property name
   * @param {String|Number|Boolean} value The property value
   */
  dom.prop = function(element, property, value) {
    if (propertyFix[property])
      property = propertyFix[property];
    if (typeof value === 'undefined') {
      return element[property];
    } else {
      if (value === null) {
        return dom.removeProperty(element, property);
      } else {
        return element[property] = value;
      }
    }
  };

  /**
   * Removes properties.
   *
   * @param {Object} element A DOM element
   * @param {String} attribute The property name
   */
  dom.removeProp = function(element, property) {
    if (propertyFix[property])
      property = propertyFix[property];
    try {
      element[property] = undefined;
      delete element[property];
    } catch (e) {
    }
  };

  // Chained API
  ram.init(function(arg) {
    if (typeof arg === 'string' || typeof arg === 'undefined') {
      // CSS selector
      return ram.domChain.init(arg);
    }
  });

  ram.domChain = {
    init: function(selector) {
      this.selector = selector;
      this.length = 0;
      this.prevObject = null;
      this.elements = [];

      if (!selector) {
        return this;
      } else {
        return this.find(selector);
      }
    },

    writeElements: function() {
      for (var i = 0; i < this.elements.length; i++) {
        this[i] = this.elements[i];
      }
    },

    /**
      * `first` will return a domChain with a length of 1 or 0.
      */
    first: function() {
      var elements = [],
          ret = ram.domChain;
      ret.elements = this.elements.length === 0 ? [] : [this.elements[0]];
      ret.selector = this.selector;
      ret.length = ret.elements.length;
      ret.prevObject = this;
      ret.writeElements();
      return ret;
    },

    /**
     * Get or set innerHTML.  Applied to every element.
     *
     * @param {String} html A string containing HTML
     * @returns {Object} `this` or the innerHTML
     */
    html: function(html) {
      if (arguments.length === 0) {
        return this.elements.length === 0 ? null : dom.html(this[0]);
      } else {
        for (var i = 0; i < this.elements.length; i++) {
          dom.html(this[i], html);
        }
      }
      return this;
    },

    /**
     * Get or set text nodes.  Applied to every element.
     *
     * @param {String} text A string containing text to set
     * @returns {Object} `this` or the text content
     */
    text: function(text) {
      if (arguments.length === 0) {
        return this.elements.length === 0 ? null : getText(this.elements);
      } else {
        for (var i = 0; i < this.elements.length; i++) {
          dom.text(this.elements[i], text);
        }
      }
      return this;
    },

    /**
     * Get or set styles.
     *
     * @param {Objects} options Either options for a style to set or a property name
     * @returns {Object} `this` or the style property
     */
    css: function(options) {
      if (typeof options === 'string') {
        return this.elements.length > 0 ? getStyle(this.elements[0], options) : null;
      } else {
        for (var i = 0; i < this.elements.length; i++) {
          dom.css(this[i], options);
        }
      }
      return this;
    },

    /**
     * Add class names.
     *
     * @param {String} className A class name
     * @returns {Object} `this`
     */
    addClass: function(className) {
      for (var i = 0; i < this.elements.length; i++) {
        dom.addClass(this[i], className);
      }
      return this;
    },

    /**
     * Detects if a class is present.
     *
     * @param {String} className A class name
     * @returns {Boolean}
     */
    hasClass: function(className) {
      for (var i = 0; i < this.length; i++) {
        if (dom.hasClass(this[i], className)) {
          return true;
        }
      }
      return false;
    },

    /**
     * Remove class names.
     *
     * @param {String} className A class name
     * @returns {Object} `this`
     */
    removeClass: function(className) {
      for (var i = 0; i < this.elements.length; i++) {
        dom.removeClass(this[i], className);
      }
      return this;
    },

    /**
     * Get or set an attribute.
     *
     * @param {String} attribute The attribute name
     * @param {String} value The attribute value
     * @returns {String} The attribute value
     */
    attr: function(attribute, value) {
      if (this.elements.length > 0) {
        return dom.attr(this[0], attribute, value);
      }
    },

    /**
     * Remove an attribute.
     *
     * @param {String} attribute The attribute name
     * @returns {Object} `this`
     */
    removeAttr: function(attribute) {
      if (this.elements.length > 0) {
        dom.removeAttr(this[0], attribute);
      }
      return this;
    },

    /**
     * Get or set a property.
     *
     * @param {String} property The property name
     * @param {String} value The property value
     * @returns {String} The property value
     */
    prop: function(property, value) {
      if (this.elements.length > 0) {
        return dom.prop(this[0], property, value);
      }
    },

    /**
     * Removes properties.
     *
     * @param {String} attribute The property name
     */
    removeProp: function(property) {
      if (this.elements.length > 0) {
        return dom.removeProp(this[0], property, value);
      }
    },

    /**
     * Append HTML to an element.  Applied to every element.
     *
     * @param {String} html A string containing HTML
     * @returns {Object} `this`
     */
    append: function(html) {
      for (var i = 0; i < this.elements.length; i++) {
        dom.append(this[i], html);
      }
      return this;
    },

    find: function(selector) {
      var elements = [],
          ret = ram.domChain,
          root = document;

      if (this.prevObject) {
        if (this.prevObject.elements.length > 0) {
          root = this.prevObject.elements[0];
        } else {
          root = null;
        }
      }

      elements = dom.get(selector, root);
      this.elements = elements;
      ret.elements = elements;
      ret.selector = selector;
      ret.length = elements.length;
      ret.prevObject = this;
      ret.writeElements();
      return ret;
    }
  };

  ram.domChain.init.prototype = ram.domChain;

  /**
    * Enumerable methods can be chained with DOM calls:
    *
    *       ram('p').each(function(element) {
    *         console.log(element);
    *       });
    *
    */
  if (typeof ram.enumerable !== 'undefined') {
    ram.domChain['values'] = function() {
      return this.elements;
    };

    ram.enumerable.each(ram.chainableMethods, function(methodName) {
      ram.domChain[methodName] = function(fn) {
        var elements = ram.enumerable[methodName](this, fn),
            ret = ram.domChain;
        this.elements = elements;
        ret.elements = elements;
        ret.selector = this.selector;
        ret.length = elements.length;
        ret.prevObject = this;
        ret.writeElements();
        return ret;
      };
    });
  }

  dom.nodeTypes = nodeTypes;
  ram.dom = dom;
  return dom;
});

/**
 * The ram plugin module.
 *
 * This is an example plugin:
 *
 *     ram.plugins.register('BSU', {
 *       name: 'Blow Shit Up',
 *       version: '1.0.0',
 *       description: 'makes america your bitch',
 *       author: 'osama bin laden <obl@alqaeda.com>',
 *       licenses: [ { type: '911' } ],
 *
 *       turnRed: function() {
 *         this[0].style.backgroundColor = '#ff0000';
 *         return this;
 *       }
 *     });
 *
 */
define('ram.dom', ['ram.core'], function(ram) {
  var plugins = {};
  plugins.registered = {};
  plugins.AlreadyRegistered = Error;
  plugins.NotFound = Error;

  /**
   * Registers a plugin, making it available for
   * chained DOM calls.
   * 
   * Throws ram.plugins.AlreadyRegistered if a
   * plugin with the same name has been registered.
   *
   * @param {String} methodName The name of your plugin method 
   * @param {Object} metadata Your plugin
   */
  plugins.register = function(methodName, metadata) {
    if (plugins.registered[methodName]) {
      throw new plugins.AlreadyRegistered('Already registered a plugin called: ' + methodName);
    }

    plugins.registered[methodName] = metadata;
    ram.domChain[methodName] = metadata[methodName];
  };

  /**
   * Removes a plugin.  Throws ram.plugins.NotFound if
   * the plugin could not be found.
   *
   * @param {String} methodName The name of the plugin
   */
  plugins.remove = function(methodName) {
    if (!plugins.registered.hasOwnProperty(methodName)) {
      throw new plugins.NotFound('Plugin not found: ' + methodName);
    } else {
      delete plugins.registered[methodName]
      delete ram.domChain[methodName];
    }
  };

  ram.plugins = plugins;
  return plugins;
});

/**
 * The ram Events module.
 *
 */
define('ram.events', ['ram.core', 'ram.dom'], function(ram) {
  var events = {},
      cache = [],
      onReadyBound = false,
      isReady = false,
      DOMContentLoaded,
      readyCallbacks = [],
      Emitter;

  function isValidElement(element) {
    return element.nodeType !== 3 && element.nodeType !== 8;
  }

  function stop(event) {
    event.preventDefault(event);
    event.stopPropagation(event);
  }

  function fix(event, element) {
    if (!event) var event = window.event;

    event.stop = function() { stop(event); };

    if (typeof event.target === 'undefined')
      event.target = event.srcElement || element;

    if (!event.preventDefault)
      event.preventDefault = function() { event.returnValue = false; };

    if (!event.stopPropagation)
      event.stopPropagation = function() { event.cancelBubble = true; };

    if (event.target && event.target.nodeType === 3)
      event.target = event.target.parentNode;

    if (event.pageX == null && event.clientX != null) {
      var doc = document.documentElement, body = document.body;
      event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
    }

    return event;
  }

  function createResponder(element, handler) {
    return function(event) {
      fix(event, element);
      return handler(event);
    };
  }

  function removeCachedResponder(element, type, handler) {
    var i = 0, responder, j = 0;
    for (j = 0; j < cache.length; j++) {
      if (cache[j].element !== element
          && cache[j].type !== type
          && cache[j].handler !== handler) {
        cache[i++] = cache[j];
      } else {
        responder = cache[j].responder;
      }
    }
    cache.length = i;
    return responder;
  }

  function ready() {
    if (!isReady) {
      // Make sure body exists
      if (!document.body) {
        return setTimeout(ready, 13);
      }

      isReady = true;

      for (var i in readyCallbacks) {
        readyCallbacks[i]();
      }

      readyCallbacks = null;

      // TODO:
      // When custom events work properly in IE:
      // events.fire(document, 'dom:ready');
    }
  }

  // This checks if the DOM is ready recursively
  function DOMReadyScrollCheck() {
    if (isReady) {
      return;
    }

    try {
      document.documentElement.doScroll('left');
    } catch(e) {
      setTimeout(DOMReadyScrollCheck, 1);
      return;
    }

    ready();
  }

  // DOMContentLoaded cleans up listeners
  if (typeof document !== 'undefined') {
    if (document.addEventListener) {
      DOMContentLoaded = function() {
        document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);
        ready();
      };
    } else if (document.attachEvent) {
      DOMContentLoaded = function() {
        if (document.readyState === 'complete') {
          document.detachEvent('onreadystatechange', DOMContentLoaded);
          ready();
        }
      };
    }
  }

  function bindOnReady() {
    if (onReadyBound) return;
    onReadyBound = true;

    if (document.readyState === 'complete') {
      ready();
    } else if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', DOMContentLoaded, false );
      window.addEventListener('load', ready, false);
    } else if (document.attachEvent) {
      document.attachEvent('onreadystatechange', DOMContentLoaded);

      window.attachEvent('onload', ready);

      // Check to see if the document is ready
      var toplevel = false;
      try {
        toplevel = window.frameElement == null;
      } catch(e) {}

      if (document.documentElement.doScroll && toplevel) {
        DOMReadyScrollCheck();
      }
    }
  }

  function IEType(type) {
    if (type.match(/:/)) {
      return type;
    }
    return 'on' + type;
  }

  /**
   * Bind an event to an element.
   *
   *      ram.events.add(element, 'click', function() {
   *        console.log('Clicked');
   *      });
   *
   * @param {Object} element A DOM element
   * @param {String} type The event name
   * @param {Function} handler The event handler
   */
  events.add = function(element, type, handler) {
    if (!isValidElement(element)) return;

    var responder = createResponder(element, handler);
    cache.push({ element: element, type: type, handler: handler, responder: responder });

    if (type.match(/:/) && element.attachEvent) {
      element.attachEvent('ondataavailable', responder);
    } else {
      if (element.addEventListener) {
        element.addEventListener(type, responder, false);
      } else if (element.attachEvent) {
        element.attachEvent(IEType(type), responder);
      }
    }
  };

  /**
   * Remove an event from an element.
   *
   *      ram.events.add(element, 'click', callback);
   *
   * @param {Object} element A DOM element
   * @param {String} type The event name
   * @param {Function} handler The event handler
   */
  events.remove = function(element, type, handler) {
    if (!isValidElement(element)) return;
    var responder = removeCachedResponder(element, type, handler);

    if (document.removeEventListener) {
      element.removeEventListener(type, responder, false);
    } else {
      element.detachEvent(IEType(type), responder);
    }
  };

  /**
   * Fires an event.
   *
   *      ram.events.fire(element, 'click');
   *
   * @param {Object} element A DOM element
   * @param {String} type The event name
   * @returns {Object} The browser's `fireEvent` or `dispatchEvent` result
   */
  events.fire = function(element, type) {
    var event;
    if (document.createEventObject) {
      event = document.createEventObject();
      fix(event, element);

      // This isn't quite ready
      if (type.match(/:/)) {
        event.eventName = type;
        event.eventType = 'ondataavailable';
        return element.fireEvent(event.eventType, event)
      } else {
        return element.fireEvent(IEType(type), event)
      }
    } else {
      event = document.createEvent('HTMLEvents');
      fix(event, element);
      event.eventName = type;
      event.initEvent(type, true, true);
      return !element.dispatchEvent(event);
    }
  };

  /**
   * Add a 'DOM ready' callback.
   *
   *      ram.events.ready(function() {
   *        // The DOM is ready
   *      });
   *
   * @param {Function} callback A callback to run
   */
  events.ready = function(callback) {
    bindOnReady();
    readyCallbacks.push(callback);
  };

  if (ram.dom !== 'undefined') {
    events.delegate = function(element, selector, type, handler) {
      return events.add(element, type, function(event) {
        var matches = ram.dom.findElement(event.target, selector, event.currentTarget);
        if (matches) {
          handler(event);
        }
      });
    };
  }

  /**
    * Events can be chained with DOM calls:
    *
    *       ram('p').bind('click', function(e) {
    *         alert('ouch');
    *       });
    *
    * The event will be bound to each matching element.
    *
    */
  events.addDOMethods = function() {
    if (typeof ram.domChain === 'undefined') return;

    ram.domChain.bind = function(type, handler) {
      var element;
      for (var i = 0; i < this.length; i++) {
        element = this[i];
        if (handler) {
          ram.events.add(element, type, handler);
        } else {
          ram.events.fire(element, type);
        }
      }
      return this;
    };

    var chainedAliases = ('click dblclick mouseover mouseout mousemove ' +
                          'mousedowe mouseup blur focus change keydown ' +
                          'keypress keyup resize scroll').split(' ');

    for (var i = 0; i < chainedAliases.length; i++) {
      (function(name) {
        ram.domChain[name] = function(handler) {
          return this.bind(name, handler);
        };
      })(chainedAliases[i]);
    }
  };

  events.addDOMethods();

  /**
    * A generic event manager, based on Node's EventEmitter:
    *
    *       var EventEmitter = ram.events.Emitter,
    *           emitter = new EventEmitter();
    *
    *       emitter.on('testFired', function() {
    *         assert.ok(true);
    *       });
    *
    *       emitter.emit('testFired');
    */
  Emitter = function() {
    this.events = {};
  };

  Emitter.prototype = {
    /**
     * Adds a listener.  Multiple can be added per eventName.  Aliased as `on`.
     *
     * @param {String} eventName The name of the event
     * @param {Function} handler A callback
     */
    addListener: function(eventName, handler) {
      if (eventName in this.events === false)
        this.events[eventName] = [];

      this.events[eventName].push(handler);
    },

    /**
     * Triggers all matching listeners.
     *
     * @param {String} eventName The name of the event
     * @returns {Boolean} `true` if an event fired
     */
    emit: function(eventName) {
      var fired = false;
      if (eventName in this.events === false) return fired;

      var list = this.events[eventName].slice();

      for (var i = 0; i < list.length; i++) {
        list[i].apply(this, Array.prototype.slice.call(arguments, 1));
        fired = true;
      }
      
      return fired;
    },

    /**
     * Removes all matching listeners.
     *
     * @param {String} eventName The name of the event
     * @returns {Boolean} `true` if an event was removed
     */
    removeAllListeners: function(eventName) {
      if (eventName in this.events === false) return false;

      delete this.events[eventName];
      return true;
    },

    removeListenerAt: function(eventName, i) {
      this.events[eventName].splice(i, 1);
    },

    /**
     * Removes a listener based on the handler function.
     *
     * @param {String} eventName The name of the event
     * @param {Function} handler The handler function to remove
     * @returns {Boolean} `true` if an event was removed
     */
    removeListener: function(eventName, handler) {
      if (eventName in this.events === false) return false;

      for (var i = 0; i < this.events[eventName].length; i++) {
        if (this.events[eventName][i] == handler) {
          this.removeListenerAt(eventName, i);
          return true;
        }
      }

      return false;
    }
  };

  Emitter.prototype.on = Emitter.prototype.addListener;

  events.Emitter = Emitter;

  /**
    * DOM ready event handlers can also be set with:
    *
    *      ram.ready(function() { });
    *
    * Or just by passing a function to `ram()`:
    *
    *      ram(function() {} );
    *
    */
  ram.ready = events.ready;
  ram.events = events;

  ram.init(function(arg) {
    if (arguments.length === 1
        && typeof arguments[0] === 'function') {
      ram.events.ready(arguments[0]);
    }
  });

  if (typeof window !== 'undefined' && window.attachEvent && !window.addEventListener) {
    window.attachEvent('onunload', function() {
      for (var i = 0; i < cache.length; i++) {
        try {
          events.remove(cache[i].element, cache[i].type);
          cache[i] = null;
        } catch(e) {}
      }
    });
  }
});

/**
 * The ram Net module (Ajax).
 */
define('ram.net', ['ram.core', 'ram.dom'], function(ram) {
  var net = {};

  /**
    * Ajax request options:
    *
    *   - `method`: {String} HTTP method - GET, POST, etc.
    *   - `success`: {Function} A callback to run when a request is successful
    *   - `error`: {Function} A callback to run when the request fails
    *   - `asynchronous`: {Boolean} Defaults to asynchronous
    *   - `postBody`: {String} The HTTP POST body
    *   - `contentType`: {String} The content type of the request, default is `application/x-www-form-urlencoded`
    *
    */

  /**
    * Removes leading and trailing whitespace.
    * @param {String}
    * @return {String}
    */
  var trim = ''.trim
    ? function(s) { return s.trim(); }
    : function(s) { return s.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };

  function xhr() {
    if (typeof XMLHttpRequest !== 'undefined' && (window.location.protocol !== 'file:' || !window.ActiveXObject)) {
      return new XMLHttpRequest();
    } else {
      try {
        return new ActiveXObject('Msxml2.XMLHTTP.6.0');
      } catch(e) { }
      try {
        return new ActiveXObject('Msxml2.XMLHTTP.3.0');
      } catch(e) { }
      try {
        return new ActiveXObject('Msxml2.XMLHTTP');
      } catch(e) { }
    }
    return false;
  }

  function successfulRequest(request) {
    return (request.status >= 200 && request.status < 300) ||
        request.status == 304 ||
        (request.status == 0 && request.responseText);
  }

  /**
    * Serialize JavaScript for HTTP requests.
    *
    * @param {Object} object An Array or Object
    * @returns {String} A string suitable for a GET or POST request
    */
  net.serialize = function(object) {
    if (!object) return;

    if (typeof object === 'string') {
      return object;
    }

    var results = [];
    for (var key in object) {
      results.push(encodeURIComponent(key) + '=' + encodeURIComponent(object[key]));
    }
    return results.join('&');
  };

  /**
    * JSON.parse support can be inferred using `ram.detect('JSON.parse')`.
    */
  ram.addDetectionTest('JSON.parse', function() {
    return window.JSON && window.JSON.parse;
  });

  /**
    * Parses JSON represented as a string.
    *
    * @param {String} string The original string
    * @returns {Object} A JavaScript object
    */
  net.parseJSON = function(string) {
    if (typeof string !== 'string' || !string) return null;
    string = trim(string);
    return ram.detect('JSON.parse') ?
      window.JSON.parse(string) :
      (new Function('return ' + string))();
  };

  /**
    * Parses XML represented as a string.
    *
    * @param {String} string The original string
    * @returns {Object} A JavaScript object
    */
  if (window.DOMParser) {
    net.parseXML = function(text) {
      return new DOMParser().parseFromString(text, 'text/xml');
    };
  } else {
    net.parseXML = function(text) {
      var xml = new ActiveXObject('Microsoft.XMLDOM');
      xml.async = 'false';
      xml.loadXML(text);
      return xml;
    };
  }

  /**
    * Creates an Ajax request.  Returns an object that can be used
    * to chain calls.  For example:
    * 
    *      $r.post('/post-test')
    *        .data({ key: 'value' })
    *        .end(function(res) {
    *          assert.equal('value', res.responseText);
    *        });
    *
    *      $r.get('/get-test')
    *        .set('Accept', 'text/html')
    *        .end(function(res) {
    *          assert.equal('Sample text', res.responseText);
    *        });
    *
    * The available chained methods are:
    * 
    * `set` -- set a HTTP header
    * `data` -- the postBody
    * `end` -- send the request over the network, and calls your callback with a `res` object
    * `send` -- sends the request and calls `data`: `.send({ data: value }, function(res) { });`
    *
    * @param {String} The URL to call
    * @param {Object} Optional settings
    * @returns {Object} A chainable object for further configuration
    */
  function ajax(url, options) {
    var request = xhr(),
        promise,
        then,
        response = {},
        chain;
        
    if (ram.Promise) {
      promise = new ram.Promise();
    }

    function respondToReadyState(readyState) {
      if (request.readyState == 4) {
        var contentType = request.mimeType || request.getResponseHeader('content-type') || '';

        response.status = request.status;
        response.responseText = request.responseText;
        if (/json/.test(contentType)) {
          response.responseJSON = net.parseJSON(request.responseText);
        } else if (/xml/.test(contentType)) {
          response.responseXML = net.parseXML(request.responseText);
        }

        response.success = successfulRequest(request);

        if (options.callback) {
          return options.callback(response, request);
        }

        if (response.success) {
          if (options.success) options.success(response, request);
          if (promise) promise.resolve(response, request);
        } else {
          if (options.error) options.error(response, request);
          if (promise) promise.reject(response, request);
        }
      }
    }

    // Set the HTTP headers
    function setHeaders() {
      var defaults = {
        'Accept': 'text/javascript, application/json, text/html, application/xml, text/xml, */*',
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      /**
       * Merge headers with defaults.
       */
      for (var name in defaults) {
        if (!options.headers.hasOwnProperty(name))
          options.headers[name] = defaults[name];
      }

      for (var name in options.headers) {
        request.setRequestHeader(name, options.headers[name]);
      }
    }

    if (typeof options === 'undefined') options = {};

    options.method = options.method ? options.method.toLowerCase() : 'get';
    options.asynchronous = options.asynchronous || true;
    options.postBody = options.postBody || '';
    request.onreadystatechange = respondToReadyState;
    request.open(options.method, url, options.asynchronous);

    options.headers = options.headers || {};
    if (options.contentType) {
      options.headers['Content-Type'] = options.contentType;
    }

    if (typeof options.postBody !== 'string') {
      // Serialize JavaScript
      options.postBody = net.serialize(options.postBody);
    }

    setHeaders();

    function send() {
      try {
        request.send(options.postBody);
      } catch (e) {
        if (options.error) {
          options.error();
        }
      }
    }

    chain = {
      set: function(key, value) {
        options.headers[key] = value;
        return chain;
      },

      send: function(data, callback) {
        options.postBody = net.serialize(data);
        options.callback = callback;
        send();
        return chain;
      },

      end: function(callback) {
        options.callback = callback;
        send();
        return chain;
      },

      data: function(data) {
        options.postBody = net.serialize(data);
        return chain;
      },

      then: function() {
        chain.end();
        if (promise) promise.then.apply(promise, arguments);
        return chain;
      }
    };

    return chain;
  }

  function JSONPCallback(url, success, failure) {
    var self = this;
    this.url = url;
    this.methodName = '__ram_jsonp_' + parseInt(new Date().getTime());
    this.success = success;
    this.failure = failure;

    function runCallback(json) {
      self.success(json);
      self.teardown();
    }

    window[this.methodName] = runCallback;
  }

  JSONPCallback.prototype.run = function() {
    this.scriptTag = document.createElement('script');
    this.scriptTag.id = this.methodName;
    this.scriptTag.src = this.url.replace('{callback}', this.methodName);
    document.body.appendChild(this.scriptTag);
  }

  JSONPCallback.prototype.teardown = function() {
    window[this.methodName] = null;
    delete window[this.methodName];
    if (this.scriptTag) {
      document.body.removeChild(this.scriptTag);
    }
  }

  /**
   * An Ajax GET request.
   *
   *      $r.get('/get-test')
   *        .set('Accept', 'text/html')
   *        .end(function(res) {
   *          assert.equal('Sample text', res.responseText);
   *        });
   *
   * @param {String} url The URL to request
   * @param {Object} options The Ajax request options
   * @returns {Object} A chainable object for further configuration
   */
  net.get = function(url, options) {
    if (typeof options === 'undefined') options = {};
    options.method = 'get';
    return ajax(url, options);
  };

  /**
   * An Ajax POST request.
   *
   *      $r.post('/post-test')
   *        .data({ key: 'value' })
   *        .end(function(res) {
   *          assert.equal('value', res.responseText);
   *        });
   *
   * @param {String} url The URL to request
   * @param {Object} options The Ajax request options (`postBody` may come in handy here)
   * @returns {Object} An object for further chaining with promises
   */
  net.post = function(url, options) {
    if (typeof options === 'undefined') options = {};
    options.method = 'post';
    return ajax(url, options);
  };

  /**
   * A jsonp request.  Example:
   *
   *     var url = 'http://feeds.delicious.com/v1/json/';
   *     url += 'osama_binladen/javascript?callback={callback}';
   *
   *     ram.net.jsonp(url, {
   *       success: function(json) {
   *         console.log(json);
   *       }
   *     });
   *
   * @param {String} url The URL to request
   */
  net.jsonp = function(url, options) {
    if (typeof options === 'undefined') options = {};
    var callback = new JSONPCallback(url, options.success, options.failure);
    callback.run();
  };

  /**
    * The Ajax methods are mapped to the `ram` object:
    *
    *      ram.get();
    *      ram.post();
    *      ram.json();
    *
    */
  ram.get = net.get;
  ram.post = net.post;
  ram.jsonp = net.jsonp;

  net.ajax = ajax;
  ram.net = net;
});

/**
 * Support for touchscreen devices.  Run `ram.touch.register()` to get touch event support.
 *
 * Tap:
 *
 *     ram.events.add(element, 'tap', function(e) {
 *       alert('tap');
 *     });
 *
 * Swipe:
 *
 *     ram.events.add(element, 'swipe', function(e) {
 *       alert('swipe');
 *     });
 *
 * Orientation Changes:
 *
 * Device orientation is available in `ram.touch.orientation()`.
 *
 *     ram.events.add(element, 'orientationchange', function(e) {
 *       alert('Orientation is now: ' + ram.touch.orientation());
 *     });
 */
define('ram.dom', ['ram.core', 'ram.dom', 'ram.events'], function(ram, dom, events) {
  var touch = {}, state = {};

  touch.swipeThreshold = 50;

  // Returns [orientation angle, orientation string]
  touch.orientation = function() {
    var orientation = window.orientation,
        orientationString = '';
    switch (orientation) {
      case 0:
        orientationString += 'portrait';
      break;

      case -90:
        orientationString += 'landscape right';
      break;

      case 90:
        orientationString += 'landscape left';
      break;

      case 180:
        orientationString += 'portrait upside-down';
      break;
    }
    return [orientation, orientationString];
  };

  function touchStart(e) {
    state.touches = e.touches;
    state.startTime  = (new Date).getTime();
    state.x = e.changedTouches[0].clientX;
    state.y = e.changedTouches[0].clientY;
    state.startX = state.x;
    state.startY = state.y;
    state.target = e.target;
    state.duration = 0;
  }

  function touchEnd(e) {
    var x = e.changedTouches[0].clientX,
        y = e.changedTouches[0].clientY;

    if (state.x === x && state.y === y && state.touches.length == 1) {
      ram.events.fire(e.target, 'tap');
    }
  }

  function touchMove(e) {
    var moved = 0, touch = e.changedTouches[0];
    state.duration = (new Date).getTime() - state.startTime;
    state.x = state.startX - touch.pageX;
    state.y = state.startY - touch.pageY;
    moved = Math.sqrt(Math.pow(Math.abs(state.x), 2) + Math.pow(Math.abs(state.y), 2));

    if (state.duration < 1000 && moved > ram.touch.swipeThreshold) {
      ram.events.fire(e.target, 'swipe');
    }
  }

  // register must be called to register for touch event helpers
  touch.register = function() {
    ram.events.add(document, 'touchstart', touchStart);
    ram.events.add(document, 'touchmove', touchMove);
    ram.events.add(document, 'touchend', touchEnd);
    ram.touch.swipeThreshold = screen.width / 5;
  };

  ram.touch = touch;
  return ram.touch;
});

/**
 * The main animation method is `ram.anim.animate`.  The animate method animates CSS properties.
 *
 * There are also animation helper methods, like `ram.anim.fadeIn` and `ram.anim.move`.  
 *
 * Animation Examples:
 *
 * Turn a paragraph red:
 *
 *      ram.anim.animate($r('p')[0], 2000, {
 *        'color': '#ff0000'
 *      });
 *
 * Move a paragraph:
 *
 *      ram.anim.animate($r('p')[0], 2000, {
 *        'marginLeft': '400px'
 *      });
 *
 * It's possible to chain animation module calls with `ram.anim.chain`, but it's easier to use the DOM chained methods:
 *
 *      ram('p').fadeIn(2000).animate(1000, {
 *        'marginLeft': '200px'
 *      })
 *
 * Or:
 *
 *      $r('p').fadeIn(2000).animate(1000, {
 *        'marginLeft': '200px'
 *      })
 *
 */

define('ram.anim', ['ram.core', 'ram.dom'], function(ram, dom) {
  var anim = {},
      easing = {},
      Chainer,
      opacityType,
      methodName,
      CSSTransitions = {};

  // These CSS related functions should be moved into ram.css
  function camelize(property) {
    return property.replace(/-+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  }

  function getOpacityType() {
    return (typeof document.body.style.opacity !== 'undefined') ? 'opacity' : 'filter';
  }

  function Colour(value) {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.value = this.normalise(value);
    this.parse();
  }

  // Based on: http://www.phpied.com/rgb-color-parser-in-javascript/
  Colour.matchers = [
    {
      re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
      example: ['rgb(123, 234, 45)', 'rgb(255,234,245)'],
      process: function (bits){
        return [
          parseInt(bits[1], 10),
          parseInt(bits[2], 10),
          parseInt(bits[3], 10)
        ];
      }
    },
    {
      re: /^(\w{2})(\w{2})(\w{2})$/,
      example: ['#00ff00', '336699'],
      process: function (bits){
        return [
          parseInt(bits[1], 16),
          parseInt(bits[2], 16),
          parseInt(bits[3], 16)
        ];
      }
    },
    {
      re: /^(\w{1})(\w{1})(\w{1})$/,
      example: ['#fb0', 'f0f'],
      process: function (bits) {
        return [
          parseInt(bits[1] + bits[1], 16),
          parseInt(bits[2] + bits[2], 16),
          parseInt(bits[3] + bits[3], 16)
        ];
      }
    }
  ];

  Colour.prototype.normalise = function(value) {
    value.replace(/ /g, '');
    if (value.charAt(0) === '#') {
      value = value.substr(1, 6);
    }
    return value;
  };

  Colour.prototype.parse = function() {
    var channels = [], i;
    for (i = 0; i < Colour.matchers.length; i++) {
      channels = this.value.match(Colour.matchers[i].re);
      if (channels) {
        channels = Colour.matchers[i].process(channels);
        this.r = channels[0];
        this.g = channels[1];
        this.b = channels[2];
        break;
      }
    }
    this.validate();
  };

  Colour.prototype.validate = function() {
    this.r = (this.r < 0 || isNaN(this.r)) ? 0 : ((this.r > 255) ? 255 : this.r);
    this.g = (this.g < 0 || isNaN(this.g)) ? 0 : ((this.g > 255) ? 255 : this.g);
    this.b = (this.b < 0 || isNaN(this.b)) ? 0 : ((this.b > 255) ? 255 : this.b);
  };

  Colour.prototype.sum = function() {
    return this.r + this.g + this.b;
  };

  Colour.prototype.toString = function() {
    return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
  };

  function isColour(value) {
    return typeof value === 'string' && value.match(/(#[a-f|A-F|0-9]|rgb)/);
  }
  
  function parseColour(value) {
    return { value: new Colour(value), units: '', transform: colourTransform };
  }

  function numericalTransform(parsedValue, position, easingFunction) {
    return (easingFunction(position) * parsedValue.value);
  }

  function colourTransform(v, position, easingFunction) {
    var colours = [];
    colours[0] = Math.round(v.base.r + (v.direction[0] * (Math.abs(v.base.r - v.value.r) * easingFunction(position))));
    colours[1] = Math.round(v.base.g + (v.direction[1] * (Math.abs(v.base.g - v.value.g) * easingFunction(position))));
    colours[2] = Math.round(v.base.b + (v.direction[2] * (Math.abs(v.base.b - v.value.b) * easingFunction(position))));
    return 'rgb(' + colours.join(', ') + ')';
  }

  function parseNumericalValue(value) {
    var n = (typeof value === 'string') ? parseFloat(value) : value,
        units = (typeof value === 'string') ? value.replace(n, '') : '';
    return { value: n, units: units, transform: numericalTransform };
  }

  function parseCSSValue(value, element, property) {
    if (isColour(value)) {
      var colour = parseColour(value), i;
      colour.base = new Colour(element.style[property]);
      colour.direction = [colour.base.r < colour.value.r ? 1 : -1,
                          colour.base.g < colour.value.g ? 1 : -1,
                          colour.base.b < colour.value.b ? 1 : -1];
      return colour;
    } else if (typeof value !== 'object') {
      return parseNumericalValue(value);
    } else {
      return value;
    }
  }

  function setCSSProperty(element, property, value) {
    if (property === 'opacity' && opacityType === 'filter') {
      element.style[opacityType] = 'alpha(opacity=' + Math.round(value * 100) + ')';
      return element;
    }
    element.style[property] = value;
    return element;
  }

  easing.linear = function(position) {
    return position;
  };

  easing.sine = function(position) {
    return (-Math.cos(position * Math.PI) / 2) + 0.5;
  };

  easing.reverse = function(position) {
    return 1.0 - position;
  };

  easing.spring = function(position) {
    return 1 - (Math.cos(position * Math.PI * 4) * Math.exp(-position * 6));
  };

  easing.bounce = function(position) {
    if (position < (1 / 2.75)) {
      return 7.6 * position * position;
    } else if (position < (2 /2.75)) {
      return 7.6 * (position -= (1.5 / 2.75)) * position + 0.74;
    } else if (position < (2.5 / 2.75)) {
      return 7.6 * (position -= (2.25 / 2.75)) * position + 0.91;
    } else {
      return 7.6 * (position -= (2.625 / 2.75)) * position + 0.98;
    }
  };

  /**
   * Animates an element using CSS properties.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} properties CSS properties to animate, for example: `{ width: '20px' }`
   * @param {Object} options Currently accepts an easing function or built-in easing method name (linear, sine, reverse, spring, bounce)
   */
  anim.animate = function(element, duration, properties, options) {
    var start = new Date().valueOf(),
        finish = start + duration,
        easingFunction = easing.linear,
        interval,
        p;

    if (!opacityType) {
      opacityType = getOpacityType();
    }

    options = options || {};
    if (options.hasOwnProperty('easing')) {
      if (typeof options.easing === 'string') {
        easingFunction = easing[options.easing];
      } else if (options.easing) {
        easingFunction = options.easing;
      }
    }

    for (p in properties) {
      if (properties.hasOwnProperty(p)) {
        properties[p] = parseCSSValue(properties[p], element, p);
        if (p === 'opacity' && opacityType === 'filter') {
          element.style.zoom = 1;
        } else if (CSSTransitions.vendorPrefix && (p === 'left' || p === 'top')) {
          CSSTransitions.start(element, duration, p, properties[p].value + properties[p].units, options.easing);
          return setTimeout(function() {
            CSSTransitions.end(element, p);
          }, duration);
        }
      }
    }

    interval = setInterval(function() {
      var time = new Date().valueOf(), position = time > finish ? 1 : (time - start) / duration,
          property;

      for (property in properties) {
        if (properties.hasOwnProperty(property)) {
          setCSSProperty(
            element,
            property,
            properties[property].transform(properties[property], position, easingFunction) + properties[property].units);
        }
      }

      if (time > finish) {
        clearInterval(interval);
      }
    }, 10);
  };

  CSSTransitions = {
    // CSS3 vendor detection
    vendors: {
      // Opera Presto 2.3
      'opera': {
        'prefix': '-o-',
        'detector': function() {
          try {
            document.createEvent('OTransitionEvent');
            return true;
          } catch(e) {
            return false;
          }
        }
      },

      // Chrome 5, Safari 4
      'webkit': {
        'prefix': '-webkit-',
        'detector': function() {
          try {
            document.createEvent('WebKitTransitionEvent');
            return true;
          } catch(e) {
            return false;
          }
        }
      },

      // Firefox 4
      'firefox': {
        'prefix': '-moz-',
        'detector': function() {
          var div = document.createElement('div'),
              supported = false;
          if (typeof div.style.MozTransition !== 'undefined') {
            supported = true;
          }
          div = null;
          return supported;
        }
      }
    },

    findCSS3VendorPrefix: function() {
      var detector;
      for (detector in CSSTransitions.vendors) {
        if (this.vendors.hasOwnProperty(detector)) {
          detector = this.vendors[detector];
          if (detector.detector()) {
            return detector.prefix;
          }
        }
      }
    },

    vendorPrefix: null,

    // CSS3 Transitions
    start: function(element, duration, property, value, easing) {
      element.style[camelize(this.vendorPrefix + 'transition')] = property + ' ' + duration + 'ms ' + (easing || 'linear');
      element.style[property] = value;
    },

    end: function(element, property) {
      element.style[camelize(this.vendorPrefix + 'transition')] = null;
    }
  };

  CSSTransitions.vendorPrefix = CSSTransitions.findCSS3VendorPrefix();

  /**
   * Fade an element.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} options to, from, easing function: `{ to: 1, from: 0, easing: 'bounce' }`
   */
  anim.fade = function(element, duration, options) {
    element.style.opacity = options.from;
    return anim.animate(element, duration, { 'opacity': options.to }, { 'easing': options.easing });
  };

  /**
   * Fade in an element.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} options May include an easing function: `{ to: 1, from: 0, easing: 'bounce' }`
   */
  anim.fadeIn = function(element, duration, options) {
    options = options || {};
    options.from = options.from || 0.0;
    options.to = options.to || 1.0;
    return anim.fade(element, duration, options);
  };

  /**
   * Fade out an element.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} options May include an easing function: `{ to: 1, from: 0, easing: 'bounce' }`
   */
  anim.fadeOut = function(element, duration, options) {
    var from;
    options = options || {};
    options.from = options.from || 1.0;
    options.to = options.to || 0.0;

    // Swap from and to
    from = options.from;
    options.from = options.to;
    options.to = from;

    // This easing function reverses the position value and adds from
    options.easing = function(p) { return (1.0 - p) + options.from; };

    return anim.fade(element, duration, options);
  };

  /**
   * Highlight an element.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} options May include an easing function: `{ to: 1, from: 0, easing: 'bounce' }`
   */
  anim.highlight = function(element, duration, options) {
    var style = element.currentStyle ? element.currentStyle : getComputedStyle(element, null);
    options = options || {};
    options.from = options.from || '#ff9';
    options.to = options.to || style.backgroundColor;
    options.easing = options.easing || easing.sine;
    duration = duration || 500;
    element.style.backgroundColor = options.from;
    return setTimeout(function() {
      anim.animate(element, duration, { 'backgroundColor': options.to, 'easing': options.easing });
    }, 200);
  };

  /**
   * Move an element.
   *
   * @param {Object} element A DOM element
   * @param {Number} duration Duration in milliseconds
   * @param {Object} options Position and easing, for example: `{ left: 100, top: 50, easing: 'sine' }`
   */
  anim.move = function(element, duration, options) {
    return anim.animate(element, duration, { 'left': options.x, 'top': options.y }, { 'easing': options.easing || easing.sine });
  };

  /**
   * Parse colour strings.  For example:
   *
   *      assert.equal('rgb(255, 0, 255)',
   *                   ram.anim.parseColour('#ff00ff').toString());
   *
   * @param {String} colourString A hex colour string
   * @returns {String} RGB string
   */
  anim.parseColour = function(colourString) { return new Colour(colourString); };
  anim.pause = function(element, duration, options) {};

  /**
   * Easing functions: linear, sine, reverse, spring, bounce.
   */
  anim.easing = easing;

  Chainer = function(element) {
    this.element = element;
    this.position = 0;
  };

  function makeChain(m) {
    var method = anim[m];
    Chainer.prototype[m] = function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(this.element);
      // Note: the duration needs to be communicated another way
      // because of defaults (like highlight())
      this.position += args[1] || 0;
      setTimeout(function() {
        method.apply(null, args);
      }, this.position);
      return this;
    };
  }

  for (methodName in anim) {
    if (anim.hasOwnProperty(methodName)) {
      makeChain(methodName);
    }
  }

  /**
   * Chain animation module calls, for example:
   *
   *     ram.anim.chain(element)
   *       .highlight()
   *       .pause(250)
   *       .move(100, { x: '100px', y: '100px', easing: 'ease-in-out' })
   *       .animate(250, { width: '1000px' })
   *       .fadeOut(250)
   *       .pause(250)
   *       .fadeIn(250)
   *       .animate(250, { width: '20px' });
   *
   * @param {Object} element A DOM element
   * @returns {Chainer} Chained API object
   */
  anim.chain = function(element) {
    return new Chainer(element);
  };

  /**
    * Animations can be chained with DOM calls:
    *
    *       ram('p').animate(2000, {
    *         color: '#ff0000'
    *       });
    *
    */
  anim.addDOMethods = function() {
    if (typeof ram.domChain === 'undefined') {
      return;
    }

    var chainedAliases = ('animate fade fadeIn fadeOut highlight ' +
                          'move parseColour pause easing').split(' '),
        i;

    function makeChainedAlias(name) {
      ram.domChain[name] = function(handler) {
        var j, args = ram.toArray(arguments);
        args.unshift(null);

        for (j = 0; j < this.length; j++) {
          args[0] = this[j];
          anim[name].apply(this, args);
        }
        return this;
      };
    }

    for (i = 0; i < chainedAliases.length; i++) {
      makeChainedAlias(chainedAliases[i]);
    }
  };
  anim.addDOMethods();

  ram.anim = anim;
  return anim;
});

/**
 * Contains everything relating to the `require` module.
 */
define('ram.require', ['ram.core'], function(ram) {
  var appendTo = document.head || document.getElementsByTagName('head'),
      scriptOptions = ['async', 'defer', 'src', 'text'];

  /**
   * Used to determine if a script is from the same origin.
   *
   * @param {String} Path to a script
   * @return {Boolean} True when `src` is from the same origin
   */
  function isSameOrigin(src) {
    return src.charAt(0) === '/'
      || src.indexOf(location.protocol + '//' + location.host) !== -1
      || false;
  }

  /**
   * Creates a script tag from a set of options.
   *
   * Options may include: `async`, `defer`, `src`, and `text`.
   *
   * @param {Object} The options
   * @return {Object} The script tag's DOM object
   */
  function createScript(options) {
    var script = document.createElement('script'),
        key;

    for (key in scriptOptions) {
      key = scriptOptions[key];

      if (options[key]) {
        script[key] = options[key];
      }
    }

    return script;
  }

  /**
   * Inserts a script tag into the document.
   *
   * @param {String} The script tag
   */
  function insertScript(script) {
    appendTo.insertBefore(script, appendTo.firstChild);
  }

  /**
   * Loads scripts using script tag insertion.
   *
   * @param {String} The script path
   * @param {Object} A configuration object
   * @param {Function} A callback
   */
  function requireWithScriptInsertion(scriptSrc, options, fn) {
    options.src = scriptSrc;
    var script = createScript(options);

    script.onload = script.onreadystatechange = function() {
      if (!script.readyState || (script.readyState === 'complete' || script.readyState === 'loaded')) {
        script.onload = script.onreadystatechange = null;
        fn();
        appendTo.removeChild(script);
      }
    };

    insertScript(script, options, fn);
  }

  /**
   * Loads scripts using XMLHttpRequest.
   *
   * @param {String} The script path
   * @param {Object} A configuration object
   * @param {Function} A callback
   */
  function requireWithXMLHttpRequest(scriptSrc, options, fn) {
    if (!isSameOrigin(scriptSrc)) {
      throw('Scripts loaded with XMLHttpRequest must be from the same origin');
    }

    if (!ram.get) {
      throw('Loading scripts with XMLHttpRequest requires ram.net to be loaded');
    }

    ram
      .get(scriptSrc)
      .end(function(res) {
        options.text = res.responseText;
        fn(options);
      });
  }

  /**
   * Parse and run a queue of scripts, preloading where required.
   *
   * TODO: Handle remote scripts
   *
   * @param {Array} An array of scripts.
   */
  function Queue(sources) {
    this.sources = sources;
    this.events = new ram.events.Emitter();
    this.queue = [];
    this.currentGroup = 0;
    this.groups = {};
    this.groupKeys = [];
    this.parseQueue(this.sources, false, 0);

    this.installEventHandlers();
    this.pointer = 0;
    this.preloadCount = 0;

    var self = this;
    runWhenReady(function() {
      self.runQueue();
    });
  }

  Queue.prototype = {
    on: function() {
      this.events.on.apply(this.events, arguments);
      return this;
    },

    emit: function() {
      this.events.emit.apply(this.events, arguments);
      return this;
    },

    installEventHandlers: function() {
      var self = this;

      this.on('preloaded', function(groupItem, options) {
        var group = self.groups[groupItem.group];
        groupItem.preloaded = true;
        groupItem.scriptOptions = options;
        self.preloadCount--;

        if (self.preloadCount === 0) {
          self.emit('preload-complete');
        }
      });

      this.on('preload-complete', function() {
        this.emit('execute-next');
      });

      this.on('execute-next', function() {
        var groupItem = self.nextItem();

        function completeCallback() {
          groupItem.loaded = true;
          self.emit('loaded', groupItem);
          self.emit('execute-next');
        }

        if (groupItem) {
          if (groupItem.preload) {
            self.execute(groupItem, completeCallback);
          } else {
            self.fetchExecute(groupItem, completeCallback);
          }
        } else {
          self.emit('complete');
        }
      });
    },

    nextItem: function() {
      var group, i, j, item;

      for (i = 0; i < this.groupKeys.length; i++) {
        group = this.groups[this.groupKeys[i]];
        for (j = 0; j < group.length; j++) {
          item = group[j];
          if (!item.loaded) {
            return item;
          }
        }
      }
    },

    fetchExecute: function(item, fn) {
      var self = this;
      requireWithScriptInsertion(item.src, { async: true, defer: true }, function() {
        fn();
      });
    },

    execute: function(item, fn) {
      if (item && item.scriptOptions) {
        script = createScript(item.scriptOptions);
        insertScript(script);
        appendTo.removeChild(script);
      }

      fn();
    },

    enqueue: function(source, async) {
      var preload = isSameOrigin(source),
          options;

      options = {
        src: source,
        preload: preload,
        async: async,
        group: this.currentGroup
      };

      if (!this.groups[this.currentGroup]) {
        this.groups[this.currentGroup] = [];
        this.groupKeys.push(this.currentGroup);
      }

      this.groups[this.currentGroup].push(options);
    },

    parseQueue: function(sources, async, level) {
      var i, source;
      for (i = 0; i < sources.length; i++) {
        source = sources[i];
        if (ram.isArray(source)) {
          this.currentGroup++;
          this.parseQueue(source, true, level + 1);
        } else {
          if (level === 0) {
            this.currentGroup++;
          }
          this.enqueue(source, async);
        }
      }
    },

    runQueue: function() {
      // Preload everything that can be preloaded
      this.preloadAll();
    },

    preloadAll: function() {
      var i, g, group, item, self = this;
      for (g = 0; g < this.groupKeys.length; g++) {
        group = this.groups[this.groupKeys[g]];
        
        for (i = 0; i < group.length; i++ ) {
          item = group[i];

          if (item.preload) {
            this.preloadCount++;
            (function(groupItem) {
              requireWithXMLHttpRequest(groupItem.src, {}, function(script) {
                self.emit('preloaded', groupItem, script);
              })
            }(item));
          }
        }
      }

      if (this.preloadCount === 0) {
        this.emit('execute-next');
      }
    }
  };

  function runWhenReady(fn) {
    setTimeout(function() {
      if ('item' in appendTo) {
        if (!appendTo[0]) {
          return setTimeout(arguments.callee, 25);
        }

        appendTo = appendTo[0];
      }

      fn();
    });
  }

  /**
   * Non-blocking script loading.
   *
   * @param {String} The script path
   * @param {Object} A configuration object.  Options: {Boolean} `defer`, {Boolean} `async`
   * @param {Function} A callback
   */
  ram.require = function(scriptSrc, options, fn) {
    options = options || {};
    fn = fn || function() {};

    if (ram.isArray(scriptSrc)) {
      return new Queue(scriptSrc);
    }

    runWhenReady(function() {
      switch (options.transport) {
        case 'XMLHttpRequest':
          return requireWithXMLHttpRequest(scriptSrc, options, function(options) {
            var script = createScript(options);
            insertScript(script);
            appendTo.removeChild(script);
            fn();
          });

        case 'scriptInsertion':
          return requireWithScriptInsertion(scriptSrc, options, fn);

        default:
          return requireWithScriptInsertion(scriptSrc, options, fn);
      }
    });
  };

  ram.require.isSameOrigin = isSameOrigin;
  return ram.require;
});
