
module.exports.computeShit = function(geometry) {
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();
};
