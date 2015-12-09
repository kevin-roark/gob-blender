
let THREE = require('three');
let kt = require('kutility');
let Physijs = require('./lib/physi.js');

module.exports = SheenMesh;

var loader = require('./util/model-loader');

function SheenMesh(options) {
  var startPos = options.position || new THREE.Vector3();
  this.startX = startPos.x;
  this.startY = startPos.y;
  this.startZ = startPos.z;

  this.scale = options.scale || 1;

  this.modelName = options.modelName;
  this.modelChoices = [];

  this.meshCreator = options.meshCreator;

  this.ignorePhysics = options.ignorePhysics;
  this.mass = options.mass || 20;
  this.friction = options.friction || 0.4;
  this.restitution = options.restitution || 0.6;
  this.collisionHandler = options.collisionHandler;

  this.melting = false;
  this.twitching = false;
}

SheenMesh.prototype.move = function(x, y, z) {
  if (!this.mesh) return;

  this.mesh.position.x += x;
  this.mesh.position.y += y;
  this.mesh.position.z += z;

  this.mesh.__dirtyPosition = true;
};

SheenMesh.prototype.rotate = function(rx, ry, rz) {
  if (!this.mesh) return;

  this.mesh.rotation.x += rx;
  this.mesh.rotation.y += ry;
  this.mesh.rotation.z += rz;

  this.mesh.__dirtyRotation = true;
};

SheenMesh.prototype.moveTo = function(x, y, z) {
  if (!this.mesh) return;

  this.mesh.position.set(x, y, z);

  this.move(0, 0, 0);
};

SheenMesh.prototype.scaleBody = function(s) {
  if (!this.mesh) return;

  this.mesh.scale.set(s, s, s);
};

SheenMesh.prototype.scaleMultiply = function(s) {
  if (!this.mesh) return;

  this.mesh.scale.set(this.initialScale.x * s, this.initialScale.y * s, this.initialScale.z * s);
};

SheenMesh.prototype.createMesh = function(callback) {
  var self = this;

  if (self.meshCreator) {
    self.meshCreator(function(geometry, material, mesh) {
      self.geometry = geometry;
      self.material = material;
      self.mesh = mesh;
      if (callback) {
        callback();
      }
    });
  }
  else {
    if (!self.modelName) {
      if (self.modelChoices) {
        self.modelName = kt.choice(self.modelChoices);
      }
      else {
        self.modelName = '';
      }
    }

    loader(self.modelName, function(geometry, materials) {
      self.geometry = geometry;
      
      self.materials = materials;
      self.faceMaterial = new THREE.MeshFaceMaterial(materials);

      if (self.ignorePhysics) {
        self.material = self.faceMaterial;
        self.mesh = new THREE.Mesh(geometry, self.material);
      }
      else {
        self.material = Physijs.createMaterial(self.faceMaterial, self.friction, self.restitution);
        self.mesh = new Physijs.ConvexMesh(geometry, self.material, self.mass);
      }

      if (callback) {
        callback();
      }
    });
  }
};

SheenMesh.prototype.addTo = function(scene, callback) {
  var self = this;

  var addMesh = function() {
    scene.add(self.mesh);

    if (callback) {
      callback(self);
    }
  };

  if (!self.mesh) {
    self.createMesh(function() {
      if (!self.ignorePhysics && self.collisionHandler) {
        self.mesh.addEventListener('collision', function(other_object, relative_velocity, relative_rotation, contact_normal) {
          self.collisionHandler(other_object, relative_velocity, relative_rotation, contact_normal);
        });
      }

      self.scaleBody(self.scale);

      self.moveTo(self.startX, self.startY, self.startZ);

      self.additionalInit();

      self.initialPosition = {x: self.mesh.position.x, y: self.mesh.position.y, z: self.mesh.position.z};
      self.initialScale = {x: self.mesh.scale.x, y: self.mesh.scale.y, z: self.mesh.scale.z};
      self.initialRotation = {x: self.mesh.rotation.x, y: self.mesh.rotation.y, z: self.mesh.rotation.z};

      addMesh();
    });
  }
  else {
    addMesh();
  }
};

SheenMesh.prototype.removeFrom = function(scene) {
  if (this.mesh) {
    scene.remove(this.mesh);
  }
};

SheenMesh.prototype.setMeshColor = function(hex) {
  if (!this.mesh) {
    return;
  }

  var materials = this.mesh.material.materials || [this.mesh.material];
  for (var i = 0; i < materials.length; i++) {
    var mat = materials[i];
    mat.color = new THREE.Color(hex);
    mat.ambient = new THREE.Color(hex);
    mat.emissive = new THREE.Color(hex);
    mat.needsUpdate = true;
  }
};

SheenMesh.prototype.update = function() {
  if (this.twitching) {
    this.twitch(this.twitchIntensity || 1);
  }

  if (this.fluctuating) {
    this.fluctuate(1);
  }

  this.additionalRender();
};

SheenMesh.prototype.twitch = function(scalar) {
  var x = (Math.random() - 0.5) * scalar;
  var y = (Math.random() - 0.5) * scalar;
  var z = (Math.random() - 0.5) * scalar;
  this.move(x, y, z);
};

SheenMesh.prototype.fluctuate = function(scalar) {
  var x = (Math.random() - 0.5) * scalar;
  var y = (Math.random() - 0.5) * scalar;
  var z = (Math.random() - 0.5) * scalar;
  this.rotate(x, y, z);
};

SheenMesh.prototype.fallToFloor = function(threshold, speed) {
  if (!threshold) threshold = 1.5;
  if (!speed) speed = 0.5;

  var self = this;

  var fallInterval = setInterval(function() {
    var dy = Math.random() * -speed;

    self.move(0, dy, 0);

    if (self.mesh && self.mesh.position.y < threshold) {
      clearInterval(fallInterval);
    }
  }, 24);
};

SheenMesh.prototype.additionalInit = function() {};
SheenMesh.prototype.additionalRender = function() {};
