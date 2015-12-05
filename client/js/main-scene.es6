var THREE = require('three');
var buzz = require('./lib/buzz');
var TWEEN = require('tween.js');
var io = require('socket.io-client');
var kt = require('kutility');

import {SheenScene} from './sheen-scene.es6';
var colorUtil = require('./util/color-util');

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
      var sound = new buzz.sound('/media/' + filename, {
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

    var properties = {x: mesh.position.x, y: mesh.position.y, z: mesh.position.z, scale: mesh.scale.x};
    var detailTween = new TWEEN.Tween(properties)
    .to({x: 0, y: 1, z: -25, scale: 12}, 2000)
    .onUpdate(() => {
      mesh.position.set(properties.x, properties.y, properties.z);
      mesh.scale.set(properties.scale, properties.scale, properties.scale);
    })
    .easing(TWEEN.Easing.Elastic.Out);
    detailTween.start();
  }

  bringDetailTweetBackHome() {
    var mesh = this.detailedTweetMesh;
    this.detailedTweetMesh = null;

    var targetPosition = this.randomTweetMeshPosition();

    var properties = {x: mesh.position.x, y: mesh.position.y, z: mesh.position.z, scale: mesh.scale.x};
    var returnTween = new TWEEN.Tween(properties)
    .to({x: targetPosition.x, y: targetPosition.y, z: targetPosition.z, scale: Math.random() * 4 + 0.1}, 2000)
    .onUpdate(() => {
      mesh.position.set(properties.x, properties.y, properties.z);
      mesh.scale.set(properties.scale, properties.scale, properties.scale);
    })
    .easing(TWEEN.Easing.Elastic.Out);
    returnTween.start();
  }

  handleNewTweet(tweetData) {
    console.log('new tweet');

    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshLambertMaterial({
        color: colorUtil.randomThreeColor()
        //map: this.randomReligionTexture()
      })
    );

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

    this.makeGodSound(tweetData.sentiment);
  }

  randomTweetMeshPosition() {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 30,
      Math.random() * -150 - 18
    );
  }

  randomReligionTexture() {
    var total = 646;
    var base = 'http://crossorigin.me/' + 'http://fasenfest.com/jesustest/jesus/jesus';
    var idx = kt.randInt(total - 1) + 1;
    var filename = base + idx + '.jpg';

    THREE.ImageUtils.crossOrigin = '';
    return THREE.ImageUtils.loadTexture(filename);
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
