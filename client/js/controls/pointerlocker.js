
module.exports = function() {
  var scope = this;

  var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
  var pointerlockElement = document.body;

  this.canRequestPointerlock = false;
  this.currentlyHasPointerlock = false;

  addPointerlockListeners();

  this.requestPointerlock = function() {
    scope.canRequestPointerlock = true;

    pointerlockElement.requestPointerLock = pointerlockElement.requestPointerLock ||
                                            pointerlockElement.mozRequestPointerLock ||
                                            pointerlockElement.webkitRequestPointerLock;

    if (pointerlockElement.requestPointerLock) {
      pointerlockElement.requestPointerLock();
    }
  };

  this.exitPointerlock = function() {
    document.exitPointerLock =  document.exitPointerLock    ||
                                document.mozExitPointerLock ||
                                document.webkitExitPointerLock;

    if (document.exitPointerLock) {
      document.exitPointerLock();
    }

    scope.canRequestPointerlock = false;
  };

  this.canEverHavePointerLock = function() {
    return havePointerLock;
  };

  function pointerlockchange() {
    if (document.pointerLockElement === pointerlockElement || document.mozPointerLockElement === pointerlockElement || document.webkitPointerLockElement === pointerlockElement ) {
      scope.currentlyHasPointerlock = true;
    }
    else {
      scope.currentlyHasPointerlock = false;
    }

    if (scope.pointerLockChangeCallback) {
      scope.pointerLockChangeCallback(scope.currentlyHasPointerlock);
    }
  }

  function pointerlockerror(event) {
    console.log('POINTER LOCK ERROR:');
    console.log(event);
  }

  function addPointerlockListeners() {
    if (havePointerLock) {
      // Hook pointer lock state change events
      document.addEventListener('pointerlockchange', function() {
        pointerlockchange();
      }, false);
      document.addEventListener('mozpointerlockchange', function() {
        pointerlockchange();
      }, false);
      document.addEventListener('webkitpointerlockchange', function() {
        pointerlockchange();
      }, false);

      document.addEventListener('pointerlockerror', function(ev) {
        pointerlockerror(ev);
      }, false);
      document.addEventListener('mozpointerlockerror', function(ev) {
        pointerlockerror(ev);
      }, false);
      document.addEventListener('webkitpointerlockerror', function(ev) {
        pointerlockerror(ev);
      }, false);
    }
  }
};
