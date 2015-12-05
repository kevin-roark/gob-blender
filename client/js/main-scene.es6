
var THREE = require('three');
var $ = require('jquery');
var buzz = require('./lib/buzz');
var kt = require('kutility');
var TWEEN = require('tween.js');
var io = require('socket.io-client');

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
        formats: [ "ogg", "mp3"],
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
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshBasicMaterial({color: colorUtil.randomThreeColor()})
    );

    mesh.position.set(
      (Math.random() - 0.5) * 20,
      Math.random() * 10,
      Math.random() * -20 - 1
    );

    mesh.scale = 0.05;
    var meshTween = new THREE.Tween(mesh).to({scale: Math.random() * 8 + 1}, 1000);
    meshTween.easing(TWEEN.Easing.Circular.EaseOut);
    meshTween.start();

    this.scene.add(mesh);

    this.makeGodSound(tweetData.sentiment);
  }

  makeGodSound(score) {
    var sounds = this.sounds;

    if (score>4) {
      sounds.glock4.play();
    }
    else if (score>3) {
      sounds.glock3.play();
    }
    else if (score>2) {
      sounds.glock2.play();
    }
    else if (score>1) {
      sounds.mallet4.play();
    }
    else if (score>0) {
      sounds.mallet3.play();
    }
    else if (score>-1) {
      sounds.mallet2.play();
    }
    else if (score>-2) {
      sounds.mallet1.play();
    }
    else if (score>-3) {
      sounds.bell4.play();
    }
    else if (score>-4) {
      sounds.bell3.play();
    }
    else if (score>-5) {
      sounds.bell2.play();
    }
    else {
      sounds.bell1.play();
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
