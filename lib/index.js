var ram = require(__dirname + '/../ram.core.js').ram,
    jsdom = require('jsdom'),
    fs = require('fs');

require(__dirname + '/../ram.promise.js')(ram);
require(__dirname + '/../ram.enumerable.js')(ram);

module.exports = ram;
module.exports.jsdom = jsdom;
module.exports.browser = function(html, fn) {
  var js = '',
      files = ('ram.core.js ram.oo.js ram.enumerable.js ram.promise.js '
              + 'ram.functional.js ram.dom.js ram.plugins.js ram.events.js '
              + 'ram.net.js ram.touch.js ram.anim.js').split(' ');

  files.forEach(function(file) {
    js += fs.readFileSync(__dirname + '/../' + file);
  });

  jsdom.env({
    html: html,
    src: [ js ],
    done: function(err, window) {
      if (err) throw(err);
      fn(window.ram);
    }
  });
};
