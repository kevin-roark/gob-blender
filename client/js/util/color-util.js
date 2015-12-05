
var THREE = require('three');

module.exports.randomThreeColor = function() {
  return new THREE.Color(parseInt(Math.random() * 16777215));
};
