
module.exports = Vector;

function Vector(x,y) {
    this.x = x;
    this.y = y;
}

Vector.prototype = {
    clone: function () {
        return new Vector(this.x, this.y);
    },
    negate: function () {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    },
    neg: function () {
        return this.clone().negate();
    },
    addeq: function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    },
    subeq: function (v) {
        return this.addeq(v.neg());
    },
    add: function (v) {
        return this.clone().addeq(v);
    },
    sub: function (v) {
        return this.clone().subeq(v);
    },
    multeq: function (c) {
        this.x *= c;
        this.y *= c;
        return this;
    },
    diveq: function (c) {
        this.x /= c;
        this.y /= c;
        return this;
    },
    mult: function (c) {
        return this.clone().multeq(c);
    },
    div: function (c) {
        return this.clone().diveq(c);
    },

    dot: function (v) {
        return this.x * v.x + this.y * v.y;
    },
    length: function () {
        return Math.sqrt(this.dot(this));
    },
    normal: function () {
        return this.clone().diveq(this.length());
    }
};
