
let $ = require('jquery');
let THREE = require('three');
let Physijs = require('./lib/physi.js');
let TWEEN = require('tween.js');

import {ThreeBoiler} from './three-boiler.es6';
import {MainScene} from './main-scene.es6';

let FlyControls = require('./controls/fly-controls');

var ON_PHONE = (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
var USE_CONTROLS = false;

var BaseLoadingText = 'is loading';
var $splashStatus = $('#splash-status');

class Sheen extends ThreeBoiler {
  constructor() {
    super({
      antialias: true,
      alpha: true,
      onPhone: ON_PHONE
    });

    this.useControls = USE_CONTROLS;

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

    if (this.useControls) {
      this.controls = new FlyControls(this.camera, {
        allowYMovement: false,
        movementSpeed: 15.0,
        restrictedXRange: {min: -195, max: 195},
        restrictedZRange: {min: -195, max: 195}
      });
      this.scene.add(this.controls.getObject());
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

      if (this.useControls) {
        if (this.controls.requestPointerlock) {
          this.controls.requestPointerlock();
        }
        this.controls.enabled = true;
      }

      if (!this.hasStarted) {
        this.start();
      }

      this.mainScene.click(ev);
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
    if (this.useControls) {
      this.controls.update();
    }
    this.mainScene.update(this.clock.getDelta());
  }

  keypress(keycode) {
    super.keypress(keycode);

    switch (keycode) {
      case 38:  /* up */
      case 119: /* w */
        this.mainScene.zoomIn();
        break;

      case 40:  /* down */
      case 115: /* s */
      this.mainScene.zoomOut();
        break;

      case 37:  /* left */
      case 97: /* a */
      this.mainScene.rotateLeft();
        break;

      case 39:  /* right */
      case 100: /* d */
      this.mainScene.rotateRight();
        break;
    }
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
      $('#mobile-error-overlay').fadeIn(1000);
    }
    else {
      setTimeout(() => {
        if (!this.hasStarted) {
          $('#splash-controls').fadeIn(1000);
        }
      }, 250);
      setTimeout(() => {
        if (!this.hasStarted) {
          $('#click-to-start').fadeIn(1000);
        }
      }, 1750);
    }
  }

  start() {
    $('.splash-overlay').fadeOut(1000);
    if (this.onPhone) {
      $('#mobile-error-overlay').fadeOut(1000);
    }

    this.mainScene.doTimedWork();

    this.hasStarted = true;
  }

}

$(function() {
  var sheen = new Sheen();
  sheen.activate();
});
