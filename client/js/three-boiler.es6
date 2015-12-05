
let $ = require('jquery');
let THREE = require('three');

export class ThreeBoiler {
  constructor(rendererOptions) {
    this.onPhone = rendererOptions.onPhone || false;
    if (!this.onPhone) {
      try {
        this.renderer = new THREE.WebGLRenderer(rendererOptions);
        this.renderMode = 'webgl';
      } catch(e) {
        $('.webgl-error').show();
        setTimeout(function() {
          $('.webgl-error').fadeOut();
        }, 6666);
        this.renderer = new THREE.CanvasRenderer();
        this.renderMode = 'canvas';
      }

      this.renderer.setClearColor(0xffffff, 1);
      document.body.appendChild(this.renderer.domElement);
    }

    this.scene = this.createScene();

    this.camera = this.createCamera();
    this.scene.add(this.camera);

    this.ambientLight = this.createAmbientLight();
    this.scene.add(this.ambientLight);

    $(window).resize(() => {this.resize();});
    this.resize();

    $('body').keypress((ev) => {this.keypress(ev.which);});
  }

  createScene() {
    return new THREE.Scene();
  }

  createCamera() {
    return new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 5000);
  }

  createAmbientLight() {
    return new THREE.AmbientLight(0x404040);
  }

  activate() {
    this.frame = 0;
    this.render();
  }

  render() {
    requestAnimationFrame(() => {this.render();});

    this.frame += 1;

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  resize() {
    if (this.renderer) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  fadeSceneOverlay(behavior, options) {
    if (!options) options = {};
    let duration = options.duration || 1000;

    $sceneOverlay.fadeIn(duration, () => {
      behavior();
      $sceneOverlay.fadeOut(duration);
    });
  }

  keypress(keycode) {
    switch (keycode) {
      case 32:
        this.spacebarPressed();
        break;
      default:
        break;
    }
  }

  spacebarPressed() {
    // lol
  }
}

// setup typeface
window._typeface_js = {faces: THREE.FontUtils.faces, loadFace: THREE.FontUtils.loadFace};
THREE.typeface_js = window._typeface_js;

// request animation frame shim
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
                                      window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
