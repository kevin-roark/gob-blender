/**
 * Modified from mrdoob's THREE.PointerLockControls
 */

var THREE = require('three');
var Pointerlocker = require('./pointerlocker');

module.exports = function (camera, options) {
	if (!options) options = {};

	var scope = this;

	camera.rotation.set(0, 0, 0);

	var locker = new Pointerlocker();

	var pitchObject = new THREE.Object3D();
	pitchObject.add(camera);

	var rollObject = new THREE.Object3D();
	rollObject.add(pitchObject);

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add(rollObject);

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var moveUp = false;
	var moveDown = false;
	var rollLeft = false;
	var rollRight = false;

	var prevTime = performance.now();

	var velocity = new THREE.Vector3();
	var velocityStep = options.velocityStep || 800;

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {
		if (!locker.currentlyHasPointerlock || !scope.enabled) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x += movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
	};

	var onKeyDown = function ( event ) {
		switch ( event.keyCode ) {
			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true;
				break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

			case 82: /*R*/ moveUp = true; break;

			case 70: /*F*/ moveDown = true; break;

			case 81: /*Q*/ rollLeft = true; break;
			case 69: /*E*/ rollRight = true; break;
		}
	};

	var onKeyUp = function ( event ) {
		switch( event.keyCode ) {
			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

			case 82: /*R*/ moveUp = false; break;

			case 70: /*F*/ moveDown = false; break;

			case 81: /*Q*/ rollLeft = false; break;
			case 69: /*E*/ rollRight = false; break;
		}
	};

	document.addEventListener('mousemove', onMouseMove, false);
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);

	this.enabled = false;

	this.getObject = function () {
		return yawObject;
	};

	this.isIdle = function() {
		return !(moveForward || moveBackward || moveLeft || moveRight);
	};

	this.getDirection = function() {
		// assumes the camera itself is not rotated
		var direction = new THREE.Vector3( 0, 0, -1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {
			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );
			v.copy( direction ).applyEuler( rotation );
			return v;
		};
	}();

	this.update = function () {
		if ( scope.enabled === false ) return;

		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;

		velocity.x -= velocity.x * 10.0 * delta;
		velocity.y -= velocity.y * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		var velDelta = velocityStep * delta;

		if (moveForward) velocity.z -= velDelta;
		if (moveBackward) velocity.z += velDelta;

		if (moveLeft) velocity.x -= velDelta;
		if (moveRight) velocity.x += velDelta;

		if (moveUp) velocity.y += velDelta;
		if (moveDown) velocity.y -= velDelta;

		if (rollLeft) rollObject.rotation.z -= 0.02;
		if (rollRight) rollObject.rotation.z += 0.02;

		yawObject.translateX(velocity.x * delta);
		yawObject.translateY(velocity.y * delta);
		yawObject.translateZ(velocity.z * delta);

		prevTime = time;
	};

	this.requestPointerlock = function() {
		locker.requestPointerlock();
	};

};
