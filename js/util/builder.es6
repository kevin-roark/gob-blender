
var THREE = require('three');
let Physijs = require('../lib/physi.js');
var SheenMesh = require('../sheen-mesh');
var geometryUtil = require('./geometry-util');

export function createGround(options) {
  var length = options.length || 100;
  var y = options.y || 0;
  var collisionHandler = options.collisionHandler;
  var rawMaterial = options.material || new THREE.MeshPhongMaterial({
    color: 0x101010,
    side: THREE.DoubleSide
  });

  return new SheenMesh({
    meshCreator: (callback) => {
      let geometry = new THREE.PlaneBufferGeometry(length, length);
      geometryUtil.computeShit(geometry);

      let material = makePhysicsMaterial(rawMaterial);

      let mesh = new Physijs.BoxMesh(geometry, material, 0);
      mesh.rotation.x = -Math.PI / 2;
      mesh.__dirtyRotation = true;

      mesh.receiveShadow = true;

      callback(geometry, material, mesh);
    },

    position: new THREE.Vector3(0, y, 0),

    collisionHandler: collisionHandler
  });
}

export function createWall(options) {
  var direction = options.direction || 'left';
  var roomLength = options.roomLength || 100;
  var wallHeight = options.wallHeight || 100;
  var rawMaterial = options.material || new THREE.MeshPhongMaterial({
    color: 0x101010,
    side: THREE.DoubleSide
  });

  var position = new THREE.Vector3();
  switch (direction) {
    case 'left':
      position.set(-roomLength/2, wallHeight/2 , 0);
      break;

    case 'right':
      position.set(roomLength/2, wallHeight/2 , 0);
      break;

    case 'back':
      position.set(0, wallHeight/2, -roomLength/2);
      break;

    case 'front':
      position.set(0, wallHeight/2, roomLength/2);
      break;
  }

  return new SheenMesh({
    meshCreator: (callback) => {
      var geometry;
      switch (direction) {
        case 'left':
        case 'right':
          geometry = new THREE.BoxGeometry(1, wallHeight, roomLength);
          break;

        case 'back':
        case 'front':
          geometry = new THREE.BoxGeometry(roomLength, wallHeight, 1);
          break;
      }

      if (!geometry) {
        callback(null, null, null);
        return;
      }

      geometryUtil.computeShit(geometry);

      // lets go high friction, low restitution
      let material = makePhysicsMaterial(rawMaterial);

      let mesh = new Physijs.BoxMesh(geometry, material, 0);

      callback(geometry, material, mesh);
    },

    position: position,

    collisionHandler: () => {}
  });
}

export function makePhysicsMaterial(material) {
  // lets go high friction, low restitution
  return Physijs.createMaterial(material, 0.8, 0.4);
}
