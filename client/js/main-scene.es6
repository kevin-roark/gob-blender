
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

    this.sounds = {};

    var soundFilenames = ['background1','bell1','bell2','bell3','bell4','glock1','glock2','glock3','glock4','mallet1','mallet2','mallet3','mallet4'];
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
  }

  /// Overrides

  enter() {
    super.enter();

    this.controlObject = this.controls.getObject();

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

  handleNewTweet(tweetData) {
    console.log('new tweet');

    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({
        //color: colorUtil.randomThreeColor()
        map: this.randomReligionTexture()
      })
    );

    mesh.position.set(
      (Math.random() - 0.5) * 50,
      Math.random() * 40,
      Math.random() * -150 - 20
    );

    var scale = {value: 0.05};
    var updateMeshScale = () => { mesh.scale.set(scale.value, scale.value, scale.value); };
    updateMeshScale();
    var meshTween = new TWEEN.Tween(scale).to({value: Math.random() * 4 + 0.1}, 1000);
    meshTween.onUpdate(updateMeshScale);
    meshTween.easing(TWEEN.Easing.Circular.Out);
    meshTween.start();

    this.scene.add(mesh);

    this.makeGodSound(tweetData.sentiment);
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
    let container = new THREE.Object3D();
    this.scene.add(container);
    this.lightContainer = container;

    this.frontLight = makeDirectionalLight();
    this.frontLight.position.set(0, 125, 148);

    this.backLight = makeDirectionalLight();
    this.backLight.position.set(0, 125, -148);

    this.leftLight = makeDirectionalLight();
    this.leftLight.position.set(-148, 125, 0);

    this.rightLight = makeDirectionalLight();
    this.rightLight.position.set(148, 125, 0);

    this.spotLight = new THREE.SpotLight(0xffffff, 10.0, 155, 40, 30); // color, intensity, distance, angle, exponent, decay
    this.spotLight.position.set(0, 150, 0);
    this.spotLight.shadowCameraFov = 20;
    this.spotLight.shadowCameraNear = 1;
    setupShadow(this.spotLight);
    container.add(this.spotLight);

    this.lights = [this.frontLight, this.backLight, this.leftLight, this.rightLight, this.spotLight];

    function makeDirectionalLight() {
      var light = new THREE.DirectionalLight(0xffffff, 0.13);
      light.color.setHSL(0.1, 1, 0.95);

      container.add(light);
      return light;
    }

    function setupShadow(light) {
      light.castShadow = true;
      //light.shadowCameraFar = 500;
      light.shadowDarkness = 0.6;
      light.shadowMapWidth = light.shadowMapHeight = 2048;
    }

  }


}
