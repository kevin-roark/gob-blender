
var THREE = require('three');

var loader = new THREE.JSONLoader();

var currentlyLoadingCallbackQueue = {};

module.exports = function loadModel(name, callback) {
  if (typeof callback !== 'function') return;

  if (isModelLoading(name)) {
    addCallbackToModelQueue(name, callback);
    return;
  }

  addCallbackToModelQueue(name, callback);
  loader.load(name, function(geometry, materials) {
    fullfillCallbacks(name, geometry, materials);
  });
};

function isModelLoading(name) {
  return currentlyLoadingCallbackQueue[name] !== undefined;
}

function addCallbackToModelQueue(name, callback) {
  if (currentlyLoadingCallbackQueue[name] === undefined) {
    currentlyLoadingCallbackQueue[name] = [];
  }

  currentlyLoadingCallbackQueue[name].push(callback);
}

function fullfillCallbacks(name, geometry, materials) {
  var queue = currentlyLoadingCallbackQueue[name];
  if (queue === undefined) {
    return;
  }

  for (var i = 0; i < queue.length; i++) {
    var callback = queue[i];
    callback(geometry, materials);
  }

  delete currentlyLoadingCallbackQueue[name];
}
