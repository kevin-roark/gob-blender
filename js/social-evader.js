
var $ = require('jquery');
var Vector = require('./vector');

function evade(evt) {

  var $this = $(this),
      corner = $this.offset(),
      center = {x: corner.left + $this.outerWidth() / 2, y: corner.top + $this.outerHeight() / 2},
      dist = new Vector(center.x - evt.pageX, center.y - evt.pageY),
      closest = $this.outerWidth() / 2;

  // proximity test
  if (dist.length() >= closest) {
    return;
  }

  // calculate new position
  var delta = dist.normal().multeq(closest).sub(dist),
      newCorner = {left: corner.left + delta.x, top: corner.top + delta.y};

  // bounds check
  var pad = 12;
  newCorner.left = clamp(newCorner.left, -pad, window.innerWidth - $this.outerWidth() + pad);
  newCorner.top = clamp(newCorner.top, -pad, window.innerHeight - $this.outerHeight() + pad);

  // move bumper
  setTimeout(function() {
    $this.offset(newCorner);
  }, 100);
}

function clamp(val, min, max) {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
}

function beginEvade() {
  $(this).bind('mousemove', evade);
}

function endEvade() {
  $(this).unbind('mousemove', evade);
}

module.exports = function() {
  $(function () {
    $('.social-button').bind('mouseenter', beginEvade);
    $('.social-button').bind('mouseleave', endEvade);
  });
};
