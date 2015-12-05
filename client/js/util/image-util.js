
var THREE = require('three');

// https://github.com/mrdoob/three.js/issues/687
// handles CORS texture thing
module.exports.loadTexture = function loadImage(path, needCors) {
  if (!path) path = '';

  if (needCors) {
    path = corsPath(path);
  }

  THREE.ImageUtils.crossOrigin = '';
  return THREE.ImageUtils.loadTexture(path);
}

module.exports.loadDomImage = function(path, callback) {
  if (!path) path = '';

  path = corsPath(path);

  var img = new Image();
  img.crossOrigin = '';

  img.onload = function() {
      callback(img);
  };

  img.src = path;
}

var corsPath = function(path) {
  return 'http://crossorigin.me/' + path; // add cors headers, thank you!
}
