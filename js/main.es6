
let $ = require('jquery');
let THREE = require('three');
let Physijs = require('./lib/physi.js');
let TWEEN = require('tween.js');

import {ThreeBoiler} from './three-boiler.es6';
import {MainScene} from './main-scene.es6';

let FlyControls = require('./controls/fly-controls');

var ON_PHONE = (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

var BaseLoadingText = 'is loading';
var $splashStatus = $('#splash-status');

class Sheen extends ThreeBoiler {
  constructor() {
    super({
      antialias: true,
      alpha: true,
      onPhone: ON_PHONE
    });

    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (!isChrome) {
      $('#splash-please-use-chrome').show();
    }

    if (this.renderer) {
      this.renderer.shadowMapEnabled = true;
      this.renderer.shadowMapCullFace = THREE.CullFaceBack;
      this.renderer.shadowMapType = THREE.PCFSoftShadowMap;

      this.renderer.gammaInput = true;
  	  this.renderer.gammaOutput = true;
    }

    this.mainScene = new MainScene(this.renderer, this.camera, this.scene, {onPhone: ON_PHONE});
    this.mainScene.controls = this.controls;

    this.clock = new THREE.Clock();

    $(document).click((ev) => {
      if ($(ev.target).is('a')) {
        return;
      }

      if (this.loading) {
        return;
      }

      if (this.hasStarted) {
        this.mainScene.click(ev);
      }
    });

    $('#click-to-start').click(() => {
      if (!this.hasStarted) {
        this.start(false);
      }
    });

    $('#click-to-start-simple').click(() => {
      if (!this.hasStarted) {
        this.start(true);
      }
    });

    $(document).mousemove((ev) => {
      this.mainScene.move(ev);
    });
  }

  createScene() {
    var scene = new Physijs.Scene();

    scene.setGravity(new THREE.Vector3(0, -50, 0));

    scene.addEventListener('update', function() {
      // here wanna apply new forces to objects and things based on state
      scene.simulate(undefined, 1);
    });

    return scene;
  }

  createAmbientLight() {
    return new THREE.AmbientLight(0x505050);
  }

  activate() {
    super.activate();

    this.loading = true;
    this.updateLoadingView();
    setTimeout(() => {
      this.didFinishLoading();
    }, 500);

    this.scene.simulate();

    this.mainScene.startScene();
  }

  render() {
    super.render();

    TWEEN.update();
    this.mainScene.update(this.clock.getDelta());
  }

  setAppActive(active) {
    super.setAppActive(active);

    if (this.mainScene) {
      this.mainScene.setAppActive(active);
    }
  }

  keypress(keycode) {
    super.keypress(keycode);

    this.mainScene.keypress(keycode);
  }

  keydown(keycode) {
    super.keydown(keycode);

    this.mainScene.keydown(keycode);
  }

  keyup(keycode) {
    super.keyup(keycode);

    this.mainScene.keyup(keycode);
  }

  spacebarPressed() {
    this.mainScene.spacebarPressed();
  }

  updateLoadingView() {
    if (!this.loading) {
      return;
    }

    var currentText = $splashStatus.text();
    if (currentText.length < BaseLoadingText.length + 3) {
      currentText += '.';
      $splashStatus.text(currentText);
    }
    else {
      $splashStatus.text(BaseLoadingText);
    }

    setTimeout(() => {
      this.updateLoadingView();
    }, 250);
  }

  didFinishLoading() {
    this.loading = false;

    $splashStatus.text('is ready');
    $splashStatus.css('font-style', 'italic');

    if (this.onPhone) {
      $('#splash-mobile-warning').fadeIn(1000);
    }

    setTimeout(() => {
      if (!this.hasStarted) {
        $('#splash-controls').fadeIn(1000);
      }
    }, 250);
    setTimeout(() => {
      if (!this.hasStarted) {
        $('.click-to-start-container').fadeIn(1000);
      }
    }, 1750);
  }

  start(simpleMode) {
    $('.splash-overlay').fadeOut(1000);
    if (this.onPhone) {
      $('#mobile-error-overlay').fadeOut(1000);
    }

    this.mainScene.doTimedWork(simpleMode);

    this.hasStarted = true;
  }

}

$(function() {
  var sheen = new Sheen();
  sheen.activate();
});
