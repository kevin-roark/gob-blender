
var THREE = require('three');

var _cache = {};

module.exports.createRaindrop = function(options) {
  if (!options) options = {};
  var slices = options.slices || 12;
  var stacks = options.stacks || 12;
  var radius = options.radius || 50;

  var cacheString = ['raindrop', slices + '', stacks + '', radius + ''].join('-');
  if (_cache[cacheString]) {
    return _cache[cacheString].clone();
  }

  function raindrop(u, v) {
    // modeling a tear drop: http://paulbourke.net/geometry/teardrop/

    var theta = u * Math.PI;
    var phi = v * Math.PI * 2;

    var sc = radius * 0.5 * (1 - Math.cos(theta)) * Math.sin(theta); // sphere-ish value used for x and z
    var x = sc * Math.cos(phi);
    var z = sc * Math.sin(phi);
    var y = radius * Math.cos(theta);

    return new THREE.Vector3(x, y, z);
  }

  var geometry = new THREE.ParametricGeometry(raindrop, slices, stacks);
  _cache[cacheString] = geometry;
  return geometry;
};

module.exports.createCrumpledGarbage = function(options) {
  if (!options) options = {};
  var slices = options.slices || 8;
  var stacks = options.stacks || 8;
  var radius = options.radius || 50;

  function garbage(u, v) {
    var x = Math.sin(u) * radius;
    var z = Math.sin(v / 2) * 2 * radius;
    var y = (Math.sin(u * 4 * Math.PI) + Math.cos(v * 2 * Math.PI)) * 2.8;

    return new THREE.Vector3(x, y, z);
  }

  return new THREE.ParametricGeometry(garbage, slices, stacks);
};
