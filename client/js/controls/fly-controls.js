/**
 * Originally by James Baicoianu / http://www.baicoianu.com/
 * Modified by Kevin Roark (porkf.at) to meld with pointerlock controls
 */

var THREE = require('three');
var Pointerlocker = require('./pointerlocker');

var PI_2 = Math.PI / 2;

module.exports = function (camera, options) {
	if (!options) options = {};

	camera.rotation.set(0, 0, 0);
	var pitchObject = new THREE.Object3D();
	pitchObject.add(camera);
	var yawObject = new THREE.Object3D();
	yawObject.add(pitchObject);

	// API

	this.domElement = options.domElement || document;
	if (this.domElement.setAttribute) {
		this.domElement.setAttribute('tabindex', -1);
	}

	this.movementSpeed = options.movementSpeed || 9.0;
	this.rollSpeed = options.rollSpeed || 0.5;
	this.movementSpeedMultiplier = 1.0;

	this.jumpEnabled = options.jumpEnabled !== undefined ? options.jumpEnabled : true;
	this.canJump = true;
	this.jumpVelocityBoost = options.jumpVelocityBoost || 100.0;
	this.jumpVelocity = 0.0;
	this.jumpGroundThreshold = options.jumpGroundThreshold || 10.0;
	this.mass = options.mass || 10.0;

	this.dragToLook = options.dragToLook || false;
	this.autoForward = options.autoForward || false;
	this.keysAsRotation = options.keysAsRotation || false;

	this.allowYMovement = options.allowYMovement || false;
	this.restrictedXRange = options.restrictedXRange || null;
	this.restrictedZRange = options.restrictedZRange || null;

	this.enabled = false;

	this.locker = new Pointerlocker();

	this.getObject = function() {
		return yawObject;
	};

	this.pitchObject = function() {
		return pitchObject;
	};

	this.setEnabled = function(enabled) {
		this.enabled = enabled;
	};

	this.requestPointerlock = function() {
		this.locker.requestPointerlock();
	};
	this.exitPointerlock = function() {
		this.locker.exitPointerlock();
	};

	this.reset = function() {
		[yawObject, pitchObject, camera].forEach(function(obj) {
			obj.position.set(0, 0, 0); obj.rotation.set(0, 0, 0);
		});
	};

	// internals

	this.prevTime = window.performance ? window.performance.now() : new Date();

	this.mouseStatus = 0;

	this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
	this.moveVector = new THREE.Vector3( 0, 0, 0 );
	this.rotationVector = new THREE.Vector3( 0, 0, 0 );

	this.keydown = function( event ) {
		if ( event.altKey ) {
			return;
		}

		switch ( event.keyCode ) {
			case 16: /* shift */ this.movementSpeedMultiplier = 0.1; break;

			case 87: /*W*/ this.moveState.forward = 1; break;
			case 83: /*S*/ this.moveState.back = 1; break;

			case 65: /*A*/ this.moveState.left = 1; break;
			case 68: /*D*/ this.moveState.right = 1; break;

			case 82: /*R*/ this.moveState.up = 1; break;
			case 70: /*F*/ this.moveState.down = 1; break;

			case 38: /*up*/ {
				if (this.keysAsRotation) {
					this.moveState.pitchUp = 1;
				} else {
					this.moveState.forward = 1;
				}
			} break;
			case 40: /*down*/ {
				if (this.keysAsRotation) {
					this.moveState.pitchDown = 1;
				} else {
					this.moveState.back = 1;
				}
			} break;

			case 37: /*left*/ {
				if (this.keysAsRotation) {
					this.moveState.yawLeft = 1;
				} else {
					this.moveState.left = 1;
				}
			} break;
			case 39: /*right*/ {
				if (this.keysAsRotation) {
					this.moveState.yawRight = 1;
				} else {
					this.moveState.right = 1;
				}
			} break;

			case 81: /*Q*/ this.moveState.rollLeft = 1; break;
			case 69: /*E*/ this.moveState.rollRight = 1; break;

			case 32: /* space */ {
				if (this.jumpEnabled && this.canJump) {
					this.jumpVelocity += this.jumpVelocityBoost;
					this.canJump = false;
				}
			} break;
		}

		this.updateMovementVector();
		this.updateRotationVector();
	};

	this.keyup = function( event ) {
		switch( event.keyCode ) {
			case 16: /* shift */ this.movementSpeedMultiplier = 1; break;

			case 87: /*W*/ this.moveState.forward = 0; break;
			case 83: /*S*/ this.moveState.back = 0; break;

			case 65: /*A*/ this.moveState.left = 0; break;
			case 68: /*D*/ this.moveState.right = 0; break;

			case 82: /*R*/ this.moveState.up = 0; break;
			case 70: /*F*/ this.moveState.down = 0; break;

			case 38: /*up*/ {
				this.moveState.forward = 0;
				this.moveState.pitchUp = 0;
			} break;
			case 40: /*down*/ {
				this.moveState.back = 0;
				this.moveState.pitchDown = 0;
			} break;

			case 37: /*left*/ {
				this.moveState.left = 0;
				this.moveState.yawLeft = 0;
			} break;
			case 39: /*right*/ {
				this.moveState.right = 0;
				this.moveState.yawRight = 0;
			} break;

			case 81: /*Q*/ this.moveState.rollLeft = 0; break;
			case 69: /*E*/ this.moveState.rollRight = 0; break;

			case 90: /*Z - reset*/ {
				this.reset();
			} break;
		}

		this.updateMovementVector();
		this.updateRotationVector();
	};

	this.mousedown = function( event ) {
		if (!this.enabled) return;
		if (this.locker.canEverHavePointerLock() && !this.locker.currentlyHasPointerlock) return;

		if ( this.domElement !== document ) {
			this.domElement.focus();
		}

		event.preventDefault();
		event.stopPropagation();

		if ( this.dragToLook ) {
			this.mouseStatus ++;
		} else {
			switch ( event.button ) {
				case 0: this.moveState.forward = 1; break;
				case 2: this.moveState.back = 1; break;
			}

			this.updateMovementVector();
		}
	};

	this.mousemove = function( event ) {
		if (!this.enabled) return;
		if (this.locker.canEverHavePointerLock() && !this.locker.currentlyHasPointerlock) return;

		if ( !this.dragToLook || this.mouseStatus > 0 ) {
			var movementX = event.movementX || event.mozMovementX || event.webkitMovementX;
			var movementY = event.movementY || event.mozMovementY || event.webkitMovementY;

			// fallback for browsers with no movement
		  if (movementX === undefined || movementY === undefined) {
		    if (this.lastClientX !== undefined) {
		      movementX = event.clientX - this.lastClientX;
		      movementY = event.clientY - this.lastClientY;
		    }
		    else {
		      movementX = 0;
		      movementY = 0;
		    }

				this.lastClientX = event.clientX; this.lastClientY = event.clientY;
			}

			yawObject.rotation.y -= movementX * 0.002;

			pitchObject.rotation.x -= movementY * 0.002;
			pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2,pitchObject.rotation.x));
		}
	};

	this.mouseup = function( event ) {
		if (!this.enabled) return;
		if (this.locker.canEverHavePointerLock() && !this.locker.currentlyHasPointerlock) return;

		event.preventDefault();
		event.stopPropagation();

		if ( this.dragToLook ) {
			this.mouseStatus--;
			this.moveState.yawLeft = this.moveState.pitchDown = 0;
		} else {
			switch ( event.button ) {
				case 0: this.moveState.forward = 0; break;
				case 2: this.moveState.back = 0; break;
			}

			this.updateMovementVector();
		}

		this.updateRotationVector();
	};

	this.update = function() {
		var time = window.performance ? window.performance.now() : new Date();
		var delta = ( time - this.prevTime ) / 1000;

		if (this.enabled) {
			var moveMult = delta * this.movementSpeed * this.movementSpeedMultiplier;
			var rotMult = delta * this.rollSpeed;

			yawObject.translateX(this.moveVector.x * moveMult);
			if (this.restrictedXRange) {
				yawObject.position.x = clamp(yawObject.position.x, this.restrictedXRange.min, this.restrictedXRange.max);
			}

			yawObject.translateZ(this.moveVector.z * moveMult);
			if (this.restrictedZRange) {
				yawObject.position.z = clamp(yawObject.position.z, this.restrictedZRange.min, this.restrictedZRange.max);
			}

			if (this.allowYMovement) {
				yawObject.translateY(this.moveVector.y * moveMult);
			}
			else if (this.jumpEnabled) {
				this.jumpVelocity -= (9.8 * this.mass * delta);
				var jdy = this.jumpVelocity * delta;
				yawObject.translateY(jdy);

				if (yawObject.position.y < this.jumpGroundThreshold) {
					this.jumpVelocity = 0;
					yawObject.position.y = this.jumpGroundThreshold;
					this.canJump = true;
				}
			}

			if (this.keysAsRotation) {
				yawObject.rotateX(this.rotationVector.x * rotMult);
				yawObject.rotateY(this.rotationVector.y * rotMult);
				yawObject.rotateZ(this.rotationVector.z * rotMult);
			}
		}

		this.mostRecentDelta = delta;
		this.prevTime = time;
	};

	this.updateMovementVector = function() {
		var forward = ( this.moveState.forward || ( this.autoForward && !this.moveState.back ) ) ? 1 : 0;

		this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
		this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
		this.moveVector.z = ( -forward + this.moveState.back );
	};

	this.updateRotationVector = function() {
		this.rotationVector.x = ( -this.moveState.pitchDown + this.moveState.pitchUp );
		this.rotationVector.y = ( -this.moveState.yawRight  + this.moveState.yawLeft );
		this.rotationVector.z = ( -this.moveState.rollRight + this.moveState.rollLeft );
	};

	this.getContainerDimensions = function() {
		if ( this.domElement !== document ) {
			return {
				size	: [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
				offset	: [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
			};
		} else {
			return {
				size	: [ window.innerWidth, window.innerHeight ],
				offset	: [ 0, 0 ]
			};
		}
	};

	function bind( scope, fn ) {
		return function () {
			fn.apply( scope, arguments );
		};
	}

	function clamp(num, min, max) {
		return Math.min(Math.max(num, min), max);
	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	this.domElement.addEventListener( 'mousemove', bind( this, this.mousemove ), false );
	this.domElement.addEventListener( 'mousedown', bind( this, this.mousedown ), false );
	this.domElement.addEventListener( 'mouseup',   bind( this, this.mouseup ), false );

	window.addEventListener( 'keydown', bind( this, this.keydown ), false );
	window.addEventListener( 'keyup',   bind( this, this.keyup ), false );

	this.updateMovementVector();
	this.updateRotationVector();
};
