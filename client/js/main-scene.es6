var THREE = require('three');
var buzz = require('./lib/buzz');
var TWEEN = require('tween.js');
var io = require('socket.io-client');
var kt = require('kutility');

import {SheenScene} from './sheen-scene.es6';

var MAX_MESH_COUNT = 200;
var TWEETS_PER_SECOND = 5;
var PI2 = Math.PI * 2;

export class MainScene extends SheenScene {

  /// Init

  constructor(renderer, camera, scene, options) {
    super(renderer, camera, scene, options);

    this.onPhone = options.onPhone || false;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.tweetMeshes = [];
    this.sounds = {};

    var soundFilenames = ['background1', 'bell1', 'bell2', 'bell3', 'bell4', 'glock1', 'glock2', 'glock3', 'glock4', 'mallet1', 'mallet2', 'mallet3', 'mallet4'];
    soundFilenames.forEach((filename) => {
      var sound = new buzz.sound('/media/sound/' + filename, {
        formats: ['mp3', 'ogg'],
        webAudioApi: true,
        volume: 30
      });
      this.sounds[filename] = sound;
    });

    this.socket = io('http://localhost:6001');
    this.socket.on('fresh-tweet', this.handleNewTweet.bind(this));

    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false);
    document.addEventListener('touchstart', (ev) => {
      ev.preventDefault();

      ev.clientX = ev.touches[0].clientX;
      ev.clientY = ev.touches[0].clientY;
      this.onDocumentMouseDown(ev);
    }, false);
  }

  /// Overrides

  enter() {
    super.enter();

    this.renderer.setClearColor(0xf0f0f0);

    if (!this.domMode) {
      // the heaven and the lights
      this.makeLights();
    }
  }

  doTimedWork() {
    super.doTimedWork();
  }

  update(dt) {
    super.update(dt);
  }

  // Interaction

  spacebarPressed() {

  }

  click() {

  }

  onDocumentMouseDown(ev) {
    ev.preventDefault();

    if (this.detailedTweetMesh) {
      this.bringDetailTweetBackHome();
      return;
    }

    // find the mesh that was clicked and bring it into detail mode

		this.mouse.x = (ev.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
		this.mouse.y = -(ev.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);

		var intersects = this.raycaster.intersectObjects(this.tweetMeshes);

		if (intersects.length > 0) {
      var firstIntersection = intersects[0].object;
      this.bringMeshToDetail(firstIntersection);
		}
  }

  bringMeshToDetail(mesh) {
    this.detailedTweetMesh = mesh;

    this.tweenMeshSickStyles(mesh, {x: 0, y: 1, z: -25}, 12);
  }

  bringDetailTweetBackHome() {
    var mesh = this.detailedTweetMesh;
    this.detailedTweetMesh = null;

    this.tweenMeshSickStyles(mesh, this.randomTweetMeshPosition(), Math.random() * 4 + 0.1);
  }

  tweenMeshSickStyles(mesh, position, scale) {
    var properties = {
      x: mesh.position.x, y: mesh.position.y, z: mesh.position.z,
      scale: mesh.scale.x,
      rx: mesh.rotation.x, ry: mesh.rotation.y, rz: mesh.rotation.z
    };

    var target = {
      x: position.x, y: position.y, z: position.z,
      scale: scale,
      rx: Math.random() * PI2, ry: Math.random() * PI2, rz: Math.random() * PI2
    };

    var tween = new TWEEN.Tween(properties)
    .to(target, 2000)
    .onUpdate(() => {
      mesh.position.set(properties.x, properties.y, properties.z);
      mesh.rotation.set(properties.rx, properties.ry, properties.rz);
      mesh.scale.set(properties.scale, properties.scale, properties.scale);
    })
    .easing(TWEEN.Easing.Elastic.Out);

    tween.start();
  }

  handleNewTweet(tweetData) {
    console.log('new tweet');

    this.makeGodSound(tweetData.sentiment);

    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshLambertMaterial({
        color: this.colorForSentiment(tweetData.sentiment),
        transparent: true,
        opacity: Math.random() * 0.2 + 0.8,
        map: this.religionTextureForSentiment(tweetData.sentiment)
      })
    );

    mesh.__tweetData = tweetData;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(this.randomTweetMeshPosition());

    var scale = {value: 0.05};
    var updateMeshScale = () => { mesh.scale.set(scale.value, scale.value, scale.value); };
    updateMeshScale();
    var meshTween = new TWEEN.Tween(scale).to({value: Math.random() * 4 + 0.1}, 1000);
    meshTween.onUpdate(updateMeshScale);
    meshTween.easing(TWEEN.Easing.Circular.Out);
    meshTween.start();

    this.scene.add(mesh);
    this.tweetMeshes.push(mesh);

    var lifetime = (MAX_MESH_COUNT / TWEETS_PER_SECOND) * 1000;
    setTimeout(() => {
      removeFromArray(this.tweetMeshes, mesh);

      var deathTween = new TWEEN.Tween(scale).to({value: 0.01}, 5000);
      deathTween.onUpdate(updateMeshScale);
      deathTween.easing(TWEEN.Easing.Circular.Out);
      deathTween.onComplete(() => { this.scene.remove(mesh); });
      deathTween.start();
    }, lifetime);
  }

  randomTweetMeshPosition() {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 30,
      Math.random() * -150 - 18
    );
  }

  religionTextureForSentiment(score) {
    var total = score >= 0 ? 646 : 446;
    var idx = kt.randInt(total - 1) + 1;
    var filebase = score >= 0 ? '/media/photos/jesus/jesus' : '/media/photos/hell/hell';
    var filename = filebase + idx + '.jpg';

    var texture = THREE.ImageUtils.loadTexture(filename);
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  colorForSentiment(score) {
    var color = new THREE.Color(0xffffff);

    var maxMagnitude = 10;
    var clampedScore = score < 0 ? Math.min(-score, maxMagnitude) : Math.min(score, maxMagnitude);
    var percent = clampedScore / maxMagnitude;

    if (score < 0) {
      color.setRGB(1, 1 - percent, 1 - percent);
    }
    else {
      color.setRGB(1 - percent, 1, 1 - percent);
    }

    return color;
  }

  makeGodSound(score) {
    var sounds = this.sounds;

    var sound;
    if (score>4) {
      sound = sounds.glock4;
    }
    else if (score>3) {
      sound = sounds.glock3;
    }
    else if (score>2) {
      sound = sounds.glock2;
    }
    else if (score>1) {
      sound = sounds.mallet4;
    }
    else if (score>0) {
      sound = sounds.mallet3;
    }
    else if (score>-1) {
      sound = sounds.mallet2;
    }
    else if (score>-2) {
      sound = sounds.mallet1;
    }
    else if (score>-3) {
      sound = sounds.bell4;
    }
    else if (score>-4) {
      sound = sounds.bell3;
    }
    else if (score>-5) {
      sound = sounds.bell2;
    }
    else {
      sound = sounds.bell1;
    }

    if (sound.isPaused() || sound.getTime() > 0.2) {
      sound.setTime(0);
      sound.play();
    }
  }

  // Creation

  makeLights() {
    var light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 500, 2000);
    light.castShadow = true;

    light.shadowCameraNear = 200;
    light.shadowCameraFar = this.camera.far;
    light.shadowCameraFov = 50;

    light.shadowBias = -0.00022;

    light.shadowMapWidth = 2048;
    light.shadowMapHeight = 2048;

    this.scene.add(light);
  }
}

function removeFromArray(arr, el) {
  var idx = arr.indexOf(el);
  if (idx > -1) {
    arr.splice(idx, 1);
  }
}
