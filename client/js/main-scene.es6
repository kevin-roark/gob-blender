var THREE = require('three');
var buzz = require('./lib/buzz');
var TWEEN = require('tween.js');
var io = require('socket.io-client');
var kt = require('kutility');

import {SheenScene} from './sheen-scene.es6';

var MAX_MESH_COUNT = 150;
var TWEETS_PER_SECOND = 3;
var PI2 = Math.PI * 2;
var SCENE_RADIUS = 50;

export class MainScene extends SheenScene {

  /// Init


  constructor(renderer, camera, scene, options) {
    super(renderer, camera, scene, options);

    this.onPhone = options.onPhone || false;
    this.useSkybox = true;
    this.useMeshImages = true;
    this.useSentimentColor = true;
    this.useRandomColor = false;
    this.usePercussion = false;
    this.useInstruments = true;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.tweetMeshes = [];
    this.sounds = {};
    this.cameraRotationAngle = 0;

    var soundFilenames = ['altglock1','altglock2','altglock3','altglock4','altglock5','altglock6','altglock7','altglock8','badmallet1','badmallet2','badmallet3','badmallet4','badmallet5','badmallet6','badmallet7','badmallet8','background1', 'background1loud', 'bell1', 'bell2', 'bell3', 'bell4','clouds1','clouds2','clouds3','clouds4','clouds5','clouds6','clouds7','clouds8','dbass1','dbass2','dbass3','dbass4','dbass5','dbass6','dbass7','dbass8', 'glock1', 'glock2', 'glock3', 'glock4', 'glock5', 'glock6', 'glock7', 'glock8', 'glock9', 'glock10', 'glock11', 'glock12', 'glock13', 'mallet1', 'mallet2', 'mallet3', 'mallet4', 'mallet5', 'mallet6', 'mallet7', 'mallet8', 'tile1', 'tile2', 'tile3', 'tile4', 'tile5', 'tile6', 'tile7', 'tile8'];
    soundFilenames.forEach((filename) => {
      var sound = new buzz.sound('/media/sound/instruments/' + filename, {
        formats: ['mp3', 'ogg'],
        webAudioApi: true,
        volume: 30
      });
      this.sounds[filename] = sound;
    });

    var soundFilenames2 = [];
    for (var i = 1; i <= 31; i++) {
      soundFilenames2.push('hh' + i);
    }
    for (var i = 1; i <= 19; i++) {
      soundFilenames2.push('kick' + i);
    }

    soundFilenames2.forEach((filename) => {
      var sound = new buzz.sound('/media/sound/percussion/' + filename, {
        formats: ['mp3'],
        webAudioApi: true,
        volume: 30
      });
      this.sounds[filename] = sound;
    });

    this.detailTweetTextElement = document.querySelector('#detail-tweet-text');
    this.sounds.background1loud.setVolume(70);
    this.sounds.background1loud.setTime(0);
    this.sounds.background1loud.play();

    this.socket = io('http://localhost:6001');
    this.socket.on('fresh-tweet', this.handleNewTweet.bind(this));

    if (this.useSkybox) {
      var imagePrefix = "media/textures/skybox/";
      var directions  = ["px", "nx", "py", "ny", "pz", "nz"];
      var imageSuffix = ".jpg";
      var skyGeometry = new THREE.CubeGeometry(1000, 1000, 1000);

      var materialArray = [];
      for (var i = 0; i < 6; i++)
        materialArray.push( new THREE.MeshBasicMaterial({
          map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
          side: THREE.BackSide
        }));
      var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
      var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
      this.scene.add(skyBox);
    }

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

    this.cameraRotationAngle += 0.002;

    this.camera.position.x = SCENE_RADIUS * Math.sin(this.cameraRotationAngle);
    this.camera.position.y = SCENE_RADIUS * Math.sin(this.cameraRotationAngle);
    this.camera.position.z = SCENE_RADIUS * Math.cos(this.cameraRotationAngle);
    this.camera.lookAt(this.scene.position);
  }

  // Interaction

  spacebarPressed() {

  }

  click(ev) {
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

    var tweet = mesh.__tweetData.tweet;
    this.detailTweetTextElement.innerHTML = '<b>' + tweet.username + '</b><br>' + urlify(tweet.text);

    THREE.SceneUtils.attach(mesh, this.scene, this.camera);

    this.tweenMeshSickStyles(mesh, {
      position: {x: 0, y: 1, z: -25},
      scale: 12,
      detailOpacity: 1.0
    });
  }

  bringDetailTweetBackHome() {
    var mesh = this.detailedTweetMesh;
    this.detailedTweetMesh = null;

    THREE.SceneUtils.detach(mesh, this.camera, this.scene);

    this.tweenMeshSickStyles(mesh, {
      position: this.randomTweetMeshPosition(),
      scale: Math.random() * 4 + 0.1,
      detailOpacity: 0.0
    });
  }

  tweenMeshSickStyles(mesh, options) {
    var position = options.position;
    var scale = options.scale !== undefined ? options.scale : 1;
    var detailOpacity = options.detailOpacity !== undefined ? options.detailOpacity : 1.0;

    var properties = {
      x: mesh.position.x, y: mesh.position.y, z: mesh.position.z,
      scale: mesh.scale.x,
      opacity: parseFloat(this.detailTweetTextElement.style.opacity)
    };
    var target = {
      x: position.x, y: position.y, z: position.z,
      scale: scale,
      opacity: detailOpacity
    };
    new TWEEN.Tween(properties)
    .to(target, 500)
    .onUpdate(() => {
      mesh.position.set(properties.x, properties.y, properties.z);
      mesh.scale.set(properties.scale, properties.scale, properties.scale);
      this.detailTweetTextElement.style.opacity = properties.opacity;
    })
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

    new TWEEN.Tween(mesh.rotation)
    .to({x: Math.random() * PI2, y: Math.random() * PI2, z: Math.random() * PI2}, 1000)
    .easing(TWEEN.Easing.Elastic.Out)
    .start();
  }

  handleNewTweet(tweetData) {
    this.makeGodSound(tweetData.sentiment);

    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshLambertMaterial({
        color: this.colorForSentiment(tweetData.sentiment)
        //map: this.religionTextureForSentiment(tweetData.sentiment)
      })
    );

    if(this.useMeshImages){
      mesh.material.map = this.religionTextureForSentiment(tweetData.sentiment);
    }

    mesh.__tweetData = tweetData;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(this.randomTweetMeshPosition());

    var scale = {value: 0.05};
    var updateMeshScale = () => { mesh.scale.set(scale.value, scale.value, scale.value); };
    updateMeshScale();
    var meshTween = new TWEEN.Tween(scale).to({value: Math.random() * 2 + (tweetData.tweet.text.length / 40)}, 1000);
    meshTween.onUpdate(updateMeshScale);
    meshTween.easing(TWEEN.Easing.Circular.Out);
    meshTween.start();

    this.scene.add(mesh);
    this.tweetMeshes.push(mesh);

    var lifetime = (MAX_MESH_COUNT / TWEETS_PER_SECOND) * 1000 - 5000;
    setTimeout(() => {
      removeFromArray(this.tweetMeshes, mesh);

      if (mesh === this.detailedTweetMesh) {
        this.bringDetailTweetBackHome();
      }

      var deathTween = new TWEEN.Tween(scale).to({value: 0.01}, 5000);
      deathTween.onUpdate(updateMeshScale);
      deathTween.easing(TWEEN.Easing.Circular.Out);
      deathTween.onComplete(() => { this.scene.remove(mesh); });
      deathTween.start();
    }, lifetime);
  }

  randomTweetMeshPosition() {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 150,
      (Math.random() - 0.5) * 150,
      (Math.random() - 0.5) * 150
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

    if (this.useSentimentColor){
      if (score < 0) {
        color.setRGB(1, 1 - percent, 1 - percent);
      }
      else {
        color.setRGB(1 - percent, 1, 1 - percent);
      }
    }
    else if (this.useRandomColor) {
      color.setRGB(Math.random(),Math.random(),Math.random());
    }
    return color;
  }

  makeGodSound(score) {
    var sounds = this.sounds;
    var soundArray = [];
    var percSoundArray = [];

    var sound;
    var sound2;

    if (score>15) {
      soundArray = [sounds.glock13];
      percSoundArray = [sounds.hh28,sounds.hh29,sounds.hh30,sounds.hh31,sounds.hh32];
    }
    else if (score>14) {
      soundArray = [sounds.glock12];
      percSoundArray = [sounds.hh27,sounds.hh28,sounds.hh29,sounds.hh30,sounds.hh31];
    }
    else if (score>13) {
      soundArray = [sounds.glock11];
      percSoundArray = [sounds.hh26,sounds.hh27,sounds.hh28,sounds.hh29,sounds.hh30];
    }
    else if (score>12) {
      soundArray = [sounds.glock10];
      percSoundArray = [sounds.hh25,sounds.hh26,sounds.hh27,sounds.hh28,sounds.hh29];
    }
    else if (score>11) {
      soundArray = [sounds.glock9];
      percSoundArray = [sounds.hh24,sounds.hh25,sounds.hh26,sounds.hh27,sounds.hh28];
    }
    else if (score>10) {
      soundArray = [sounds.glock8];
      percSoundArray = [sounds.hh23,sounds.hh24,sounds.hh25,sounds.hh26,sounds.hh27];
    }
    else if (score>9) {
      soundArray = [sounds.glock7];
      percSoundArray = [sounds.hh22,sounds.hh23,sounds.hh24,sounds.hh25,sounds.hh26];
    }
    else if (score>8) {
      soundArray = [sounds.altglock6];
      percSoundArray = [sounds.hh21,sounds.hh22,sounds.hh23,sounds.hh24,sounds.hh25];
    }
    else if (score>7) {
      soundArray = [sounds.altglock5];
      percSoundArray = [sounds.hh20,sounds.hh21,sounds.hh22,sounds.hh23,sounds.hh24];
    }
    else if (score>6) {
      soundArray = [sounds.altglock4];
      percSoundArray = [sounds.hh10,sounds.hh11,sounds.hh12,sounds.hh13,sounds.hh14];
    }
    else if (score>5) {
      soundArray = [sounds.altglock3];
      percSoundArray = [sounds.hh9,sounds.hh10,sounds.hh11,sounds.hh12,sounds.hh13];
    }
    else if (score>4) {
      soundArray = [sounds.altglock2];
      percSoundArray = [sounds.hh8,sounds.hh9,sounds.hh10,sounds.hh11,sounds.hh12];
    }
    else if (score>3) {
      soundArray = [sounds.altglock1];
      percSoundArray = [sounds.hh7,sounds.hh8,sounds.hh9,sounds.hh10,sounds.hh11];
    }
    else if (score>2) {
      soundArray = [sounds.mallet4,sounds.mallet5,sounds.mallet6,sounds.mallet7,sounds.mallet8];
      percSoundArray = [sounds.hh6,sounds.hh7,sounds.hh8,sounds.hh9,sounds.hh10];
    }
    else if (score>1) {
      soundArray = [sounds.mallet3,sounds.mallet4,sounds.mallet5,sounds.mallet6,sounds.mallet7];
      percSoundArray = [sounds.hh5,sounds.hh6,sounds.hh7,sounds.hh8,sounds.hh9];
    }
    else if (score>0) {
      soundArray = [sounds.mallet2,sounds.mallet3,sounds.mallet4,sounds.mallet5,sounds.mallet6];
      percSoundArray = [sounds.hh4,sounds.hh5,sounds.hh6,sounds.hh7,sounds.hh8];
    }
    else if (score>-1) {
      soundArray = [sounds.mallet1,sounds.mallet2,sounds.mallet3,sounds.mallet4,sounds.mallet5];
      percSoundArray = [sounds.hh3,sounds.hh4,sounds.hh5,sounds.hh6,sounds.hh7];
    }
    else if (score>-2) {
      soundArray = [sounds.dbass4,sounds.dbass5,sounds.dbass6,sounds.dbass7,sounds.dbass8];
      percSoundArray = [sounds.hh2,sounds.hh3,sounds.hh4,sounds.hh5,sounds.hh6];
    }
    else if (score>-3) {
      soundArray = [sounds.dbass1,sounds.dbass2,sounds.dbass3,sounds.dbass4,sounds.dbass5];
      percSoundArray = [sounds.hh1,sounds.hh2,sounds.hh3,sounds.hh4,sounds.hh5];
    }
    else if (score>-4) {
      soundArray = [sounds.cloud8];
      percSoundArray = [sounds.kick17, sounds.kick18, sounds.kick19, sounds.kick20];
    }
    else if (score>-5) {
      soundArray = [sounds.clouds7];
      percSoundArray = [sounds.kick13, sounds.kick14, sounds.kick15, sounds.kick16];
    }
    else if (score>-6) {
      soundArray = [sounds.clouds6];
      percSoundArray = [sounds.kick9, sounds.kick10, sounds.kick11, sounds.kick12];
    }
    else if (score>-7) {
      soundArray = [sounds.clouds5];
      percSoundArray = [sounds.kick6, sounds.kick7, sounds.kick8];
    }
    else if (score>-8) {
      soundArray = [sounds.clouds4];
      percSoundArray = [sounds.kick4, sounds.kick5];
    }
    else if (score>-9) {
      soundArray = [sounds.clouds3];
      percSoundArray = [sounds.kick3];
    }
    else if (score>-10) {
      soundArray = [sounds.clouds2];
      percSoundArray = [sounds.kick2];
    }
    else {
      soundArray = [sounds.clouds1];
      percSoundArray = [sounds.kick1];
    }

    if(this.useInstruments){
      sound = kt.choice(soundArray);
      if (sound.isPaused() || sound.getTime() > 0.2) {
        sound.setTime(0);
        sound.play();
      }
    }

    if(this.usePercussion){
      sound2 = kt.choice(percSoundArray);
      if (sound2.isPaused() || sound2.getTime() > 0.2) {
        sound2.setTime(0);
        sound2.play();
      }
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

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    });
}
