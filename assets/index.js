(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const state = {
  words: [],
  currentWordIndex: 0,
  currentLetterIndex: 0,
  typedHistory: [],
  isActive: false,
  startTime: null,
  wordStates: [],
  errors: 0,
  mode: "words",
  // 'words', 'timed', 'endless'
  value: 25,
  // word count or time in seconds
  timer: null,
  timeLeft: 0,
  theme: "dark"
  // 'dark', 'light'
};
var module$1 = {};
(function main(global, module, isWorker, workerSize) {
  var canUseWorker = !!(global.Worker && global.Blob && global.Promise && global.OffscreenCanvas && global.OffscreenCanvasRenderingContext2D && global.HTMLCanvasElement && global.HTMLCanvasElement.prototype.transferControlToOffscreen && global.URL && global.URL.createObjectURL);
  var canUsePaths = typeof Path2D === "function" && typeof DOMMatrix === "function";
  var canDrawBitmap = (function() {
    if (!global.OffscreenCanvas) {
      return false;
    }
    try {
      var canvas = new OffscreenCanvas(1, 1);
      var ctx = canvas.getContext("2d");
      ctx.fillRect(0, 0, 1, 1);
      var bitmap = canvas.transferToImageBitmap();
      ctx.createPattern(bitmap, "no-repeat");
    } catch (e) {
      return false;
    }
    return true;
  })();
  function noop() {
  }
  function promise(func) {
    var ModulePromise = module.exports.Promise;
    var Prom = ModulePromise !== void 0 ? ModulePromise : global.Promise;
    if (typeof Prom === "function") {
      return new Prom(func);
    }
    func(noop, noop);
    return null;
  }
  var bitmapMapper = /* @__PURE__ */ (function(skipTransform, map) {
    return {
      transform: function(bitmap) {
        if (skipTransform) {
          return bitmap;
        }
        if (map.has(bitmap)) {
          return map.get(bitmap);
        }
        var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0);
        map.set(bitmap, canvas);
        return canvas;
      },
      clear: function() {
        map.clear();
      }
    };
  })(canDrawBitmap, /* @__PURE__ */ new Map());
  var raf = (function() {
    var TIME = Math.floor(1e3 / 60);
    var frame, cancel;
    var frames = {};
    var lastFrameTime = 0;
    if (typeof requestAnimationFrame === "function" && typeof cancelAnimationFrame === "function") {
      frame = function(cb) {
        var id = Math.random();
        frames[id] = requestAnimationFrame(function onFrame(time) {
          if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
            lastFrameTime = time;
            delete frames[id];
            cb();
          } else {
            frames[id] = requestAnimationFrame(onFrame);
          }
        });
        return id;
      };
      cancel = function(id) {
        if (frames[id]) {
          cancelAnimationFrame(frames[id]);
        }
      };
    } else {
      frame = function(cb) {
        return setTimeout(cb, TIME);
      };
      cancel = function(timer) {
        return clearTimeout(timer);
      };
    }
    return { frame, cancel };
  })();
  var getWorker = /* @__PURE__ */ (function() {
    var worker;
    var prom;
    var resolves = {};
    function decorate(worker2) {
      function execute(options, callback) {
        worker2.postMessage({ options: options || {}, callback });
      }
      worker2.init = function initWorker(canvas) {
        var offscreen = canvas.transferControlToOffscreen();
        worker2.postMessage({ canvas: offscreen }, [offscreen]);
      };
      worker2.fire = function fireWorker(options, size, done) {
        if (prom) {
          execute(options, null);
          return prom;
        }
        var id = Math.random().toString(36).slice(2);
        prom = promise(function(resolve) {
          function workerDone(msg) {
            if (msg.data.callback !== id) {
              return;
            }
            delete resolves[id];
            worker2.removeEventListener("message", workerDone);
            prom = null;
            bitmapMapper.clear();
            done();
            resolve();
          }
          worker2.addEventListener("message", workerDone);
          execute(options, id);
          resolves[id] = workerDone.bind(null, { data: { callback: id } });
        });
        return prom;
      };
      worker2.reset = function resetWorker() {
        worker2.postMessage({ reset: true });
        for (var id in resolves) {
          resolves[id]();
          delete resolves[id];
        }
      };
    }
    return function() {
      if (worker) {
        return worker;
      }
      if (!isWorker && canUseWorker) {
        var code = [
          "var CONFETTI, SIZE = {}, module = {};",
          "(" + main.toString() + ")(this, module, true, SIZE);",
          "onmessage = function(msg) {",
          "  if (msg.data.options) {",
          "    CONFETTI(msg.data.options).then(function () {",
          "      if (msg.data.callback) {",
          "        postMessage({ callback: msg.data.callback });",
          "      }",
          "    });",
          "  } else if (msg.data.reset) {",
          "    CONFETTI && CONFETTI.reset();",
          "  } else if (msg.data.resize) {",
          "    SIZE.width = msg.data.resize.width;",
          "    SIZE.height = msg.data.resize.height;",
          "  } else if (msg.data.canvas) {",
          "    SIZE.width = msg.data.canvas.width;",
          "    SIZE.height = msg.data.canvas.height;",
          "    CONFETTI = module.exports.create(msg.data.canvas);",
          "  }",
          "}"
        ].join("\n");
        try {
          worker = new Worker(URL.createObjectURL(new Blob([code])));
        } catch (e) {
          typeof console !== "undefined" && typeof console.warn === "function" ? console.warn("🎊 Could not load worker", e) : null;
          return null;
        }
        decorate(worker);
      }
      return worker;
    };
  })();
  var defaults = {
    particleCount: 50,
    angle: 90,
    spread: 45,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    x: 0.5,
    y: 0.5,
    shapes: ["square", "circle"],
    zIndex: 100,
    colors: [
      "#26ccff",
      "#a25afd",
      "#ff5e7e",
      "#88ff5a",
      "#fcff42",
      "#ffa62d",
      "#ff36ff"
    ],
    // probably should be true, but back-compat
    disableForReducedMotion: false,
    scalar: 1
  };
  function convert(val, transform) {
    return transform ? transform(val) : val;
  }
  function isOk(val) {
    return !(val === null || val === void 0);
  }
  function prop(options, name, transform) {
    return convert(
      options && isOk(options[name]) ? options[name] : defaults[name],
      transform
    );
  }
  function onlyPositiveInt(number) {
    return number < 0 ? 0 : Math.floor(number);
  }
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  function toDecimal(str) {
    return parseInt(str, 16);
  }
  function colorsToRgb(colors) {
    return colors.map(hexToRgb);
  }
  function hexToRgb(str) {
    var val = String(str).replace(/[^0-9a-f]/gi, "");
    if (val.length < 6) {
      val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
    }
    return {
      r: toDecimal(val.substring(0, 2)),
      g: toDecimal(val.substring(2, 4)),
      b: toDecimal(val.substring(4, 6))
    };
  }
  function getOrigin(options) {
    var origin = prop(options, "origin", Object);
    origin.x = prop(origin, "x", Number);
    origin.y = prop(origin, "y", Number);
    return origin;
  }
  function setCanvasWindowSize(canvas) {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
  }
  function setCanvasRectSize(canvas) {
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  function getCanvas(zIndex) {
    var canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0px";
    canvas.style.left = "0px";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = zIndex;
    return canvas;
  }
  function ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(radiusX, radiusY);
    context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
    context.restore();
  }
  function randomPhysics(opts) {
    var radAngle = opts.angle * (Math.PI / 180);
    var radSpread = opts.spread * (Math.PI / 180);
    return {
      x: opts.x,
      y: opts.y,
      wobble: Math.random() * 10,
      wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
      velocity: opts.startVelocity * 0.5 + Math.random() * opts.startVelocity,
      angle2D: -radAngle + (0.5 * radSpread - Math.random() * radSpread),
      tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
      color: opts.color,
      shape: opts.shape,
      tick: 0,
      totalTicks: opts.ticks,
      decay: opts.decay,
      drift: opts.drift,
      random: Math.random() + 2,
      tiltSin: 0,
      tiltCos: 0,
      wobbleX: 0,
      wobbleY: 0,
      gravity: opts.gravity * 3,
      ovalScalar: 0.6,
      scalar: opts.scalar,
      flat: opts.flat
    };
  }
  function updateFetti(context, fetti) {
    fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
    fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
    fetti.velocity *= fetti.decay;
    if (fetti.flat) {
      fetti.wobble = 0;
      fetti.wobbleX = fetti.x + 10 * fetti.scalar;
      fetti.wobbleY = fetti.y + 10 * fetti.scalar;
      fetti.tiltSin = 0;
      fetti.tiltCos = 0;
      fetti.random = 1;
    } else {
      fetti.wobble += fetti.wobbleSpeed;
      fetti.wobbleX = fetti.x + 10 * fetti.scalar * Math.cos(fetti.wobble);
      fetti.wobbleY = fetti.y + 10 * fetti.scalar * Math.sin(fetti.wobble);
      fetti.tiltAngle += 0.1;
      fetti.tiltSin = Math.sin(fetti.tiltAngle);
      fetti.tiltCos = Math.cos(fetti.tiltAngle);
      fetti.random = Math.random() + 2;
    }
    var progress = fetti.tick++ / fetti.totalTicks;
    var x1 = fetti.x + fetti.random * fetti.tiltCos;
    var y1 = fetti.y + fetti.random * fetti.tiltSin;
    var x2 = fetti.wobbleX + fetti.random * fetti.tiltCos;
    var y2 = fetti.wobbleY + fetti.random * fetti.tiltSin;
    context.fillStyle = "rgba(" + fetti.color.r + ", " + fetti.color.g + ", " + fetti.color.b + ", " + (1 - progress) + ")";
    context.beginPath();
    if (canUsePaths && fetti.shape.type === "path" && typeof fetti.shape.path === "string" && Array.isArray(fetti.shape.matrix)) {
      context.fill(transformPath2D(
        fetti.shape.path,
        fetti.shape.matrix,
        fetti.x,
        fetti.y,
        Math.abs(x2 - x1) * 0.1,
        Math.abs(y2 - y1) * 0.1,
        Math.PI / 10 * fetti.wobble
      ));
    } else if (fetti.shape.type === "bitmap") {
      var rotation = Math.PI / 10 * fetti.wobble;
      var scaleX = Math.abs(x2 - x1) * 0.1;
      var scaleY = Math.abs(y2 - y1) * 0.1;
      var width = fetti.shape.bitmap.width * fetti.scalar;
      var height = fetti.shape.bitmap.height * fetti.scalar;
      var matrix = new DOMMatrix([
        Math.cos(rotation) * scaleX,
        Math.sin(rotation) * scaleX,
        -Math.sin(rotation) * scaleY,
        Math.cos(rotation) * scaleY,
        fetti.x,
        fetti.y
      ]);
      matrix.multiplySelf(new DOMMatrix(fetti.shape.matrix));
      var pattern = context.createPattern(bitmapMapper.transform(fetti.shape.bitmap), "no-repeat");
      pattern.setTransform(matrix);
      context.globalAlpha = 1 - progress;
      context.fillStyle = pattern;
      context.fillRect(
        fetti.x - width / 2,
        fetti.y - height / 2,
        width,
        height
      );
      context.globalAlpha = 1;
    } else if (fetti.shape === "circle") {
      context.ellipse ? context.ellipse(fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI) : ellipse(context, fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI);
    } else if (fetti.shape === "star") {
      var rot = Math.PI / 2 * 3;
      var innerRadius = 4 * fetti.scalar;
      var outerRadius = 8 * fetti.scalar;
      var x = fetti.x;
      var y = fetti.y;
      var spikes = 5;
      var step = Math.PI / spikes;
      while (spikes--) {
        x = fetti.x + Math.cos(rot) * outerRadius;
        y = fetti.y + Math.sin(rot) * outerRadius;
        context.lineTo(x, y);
        rot += step;
        x = fetti.x + Math.cos(rot) * innerRadius;
        y = fetti.y + Math.sin(rot) * innerRadius;
        context.lineTo(x, y);
        rot += step;
      }
    } else {
      context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
      context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
      context.lineTo(Math.floor(x2), Math.floor(y2));
      context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
    }
    context.closePath();
    context.fill();
    return fetti.tick < fetti.totalTicks;
  }
  function animate(canvas, fettis, resizer, size, done) {
    var animatingFettis = fettis.slice();
    var context = canvas.getContext("2d");
    var animationFrame;
    var destroy;
    var prom = promise(function(resolve) {
      function onDone() {
        animationFrame = destroy = null;
        context.clearRect(0, 0, size.width, size.height);
        bitmapMapper.clear();
        done();
        resolve();
      }
      function update() {
        if (isWorker && !(size.width === workerSize.width && size.height === workerSize.height)) {
          size.width = canvas.width = workerSize.width;
          size.height = canvas.height = workerSize.height;
        }
        if (!size.width && !size.height) {
          resizer(canvas);
          size.width = canvas.width;
          size.height = canvas.height;
        }
        context.clearRect(0, 0, size.width, size.height);
        animatingFettis = animatingFettis.filter(function(fetti) {
          return updateFetti(context, fetti);
        });
        if (animatingFettis.length) {
          animationFrame = raf.frame(update);
        } else {
          onDone();
        }
      }
      animationFrame = raf.frame(update);
      destroy = onDone;
    });
    return {
      addFettis: function(fettis2) {
        animatingFettis = animatingFettis.concat(fettis2);
        return prom;
      },
      canvas,
      promise: prom,
      reset: function() {
        if (animationFrame) {
          raf.cancel(animationFrame);
        }
        if (destroy) {
          destroy();
        }
      }
    };
  }
  function confettiCannon(canvas, globalOpts) {
    var isLibCanvas = !canvas;
    var allowResize = !!prop(globalOpts || {}, "resize");
    var hasResizeEventRegistered = false;
    var globalDisableForReducedMotion = prop(globalOpts, "disableForReducedMotion", Boolean);
    var shouldUseWorker = canUseWorker && !!prop(globalOpts || {}, "useWorker");
    var worker = shouldUseWorker ? getWorker() : null;
    var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
    var initialized = canvas && worker ? !!canvas.__confetti_initialized : false;
    var preferLessMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion)").matches;
    var animationObj;
    function fireLocal(options, size, done) {
      var particleCount = prop(options, "particleCount", onlyPositiveInt);
      var angle = prop(options, "angle", Number);
      var spread = prop(options, "spread", Number);
      var startVelocity = prop(options, "startVelocity", Number);
      var decay = prop(options, "decay", Number);
      var gravity = prop(options, "gravity", Number);
      var drift = prop(options, "drift", Number);
      var colors = prop(options, "colors", colorsToRgb);
      var ticks = prop(options, "ticks", Number);
      var shapes = prop(options, "shapes");
      var scalar = prop(options, "scalar");
      var flat = !!prop(options, "flat");
      var origin = getOrigin(options);
      var temp = particleCount;
      var fettis = [];
      var startX = canvas.width * origin.x;
      var startY = canvas.height * origin.y;
      while (temp--) {
        fettis.push(
          randomPhysics({
            x: startX,
            y: startY,
            angle,
            spread,
            startVelocity,
            color: colors[temp % colors.length],
            shape: shapes[randomInt(0, shapes.length)],
            ticks,
            decay,
            gravity,
            drift,
            scalar,
            flat
          })
        );
      }
      if (animationObj) {
        return animationObj.addFettis(fettis);
      }
      animationObj = animate(canvas, fettis, resizer, size, done);
      return animationObj.promise;
    }
    function fire(options) {
      var disableForReducedMotion = globalDisableForReducedMotion || prop(options, "disableForReducedMotion", Boolean);
      var zIndex = prop(options, "zIndex", Number);
      if (disableForReducedMotion && preferLessMotion) {
        return promise(function(resolve) {
          resolve();
        });
      }
      if (isLibCanvas && animationObj) {
        canvas = animationObj.canvas;
      } else if (isLibCanvas && !canvas) {
        canvas = getCanvas(zIndex);
        document.body.appendChild(canvas);
      }
      if (allowResize && !initialized) {
        resizer(canvas);
      }
      var size = {
        width: canvas.width,
        height: canvas.height
      };
      if (worker && !initialized) {
        worker.init(canvas);
      }
      initialized = true;
      if (worker) {
        canvas.__confetti_initialized = true;
      }
      function onResize() {
        if (worker) {
          var obj = {
            getBoundingClientRect: function() {
              if (!isLibCanvas) {
                return canvas.getBoundingClientRect();
              }
            }
          };
          resizer(obj);
          worker.postMessage({
            resize: {
              width: obj.width,
              height: obj.height
            }
          });
          return;
        }
        size.width = size.height = null;
      }
      function done() {
        animationObj = null;
        if (allowResize) {
          hasResizeEventRegistered = false;
          global.removeEventListener("resize", onResize);
        }
        if (isLibCanvas && canvas) {
          if (document.body.contains(canvas)) {
            document.body.removeChild(canvas);
          }
          canvas = null;
          initialized = false;
        }
      }
      if (allowResize && !hasResizeEventRegistered) {
        hasResizeEventRegistered = true;
        global.addEventListener("resize", onResize, false);
      }
      if (worker) {
        return worker.fire(options, size, done);
      }
      return fireLocal(options, size, done);
    }
    fire.reset = function() {
      if (worker) {
        worker.reset();
      }
      if (animationObj) {
        animationObj.reset();
      }
    };
    return fire;
  }
  var defaultFire;
  function getDefaultFire() {
    if (!defaultFire) {
      defaultFire = confettiCannon(null, { useWorker: true, resize: true });
    }
    return defaultFire;
  }
  function transformPath2D(pathString, pathMatrix, x, y, scaleX, scaleY, rotation) {
    var path2d = new Path2D(pathString);
    var t1 = new Path2D();
    t1.addPath(path2d, new DOMMatrix(pathMatrix));
    var t2 = new Path2D();
    t2.addPath(t1, new DOMMatrix([
      Math.cos(rotation) * scaleX,
      Math.sin(rotation) * scaleX,
      -Math.sin(rotation) * scaleY,
      Math.cos(rotation) * scaleY,
      x,
      y
    ]));
    return t2;
  }
  function shapeFromPath(pathData) {
    if (!canUsePaths) {
      throw new Error("path confetti are not supported in this browser");
    }
    var path, matrix;
    if (typeof pathData === "string") {
      path = pathData;
    } else {
      path = pathData.path;
      matrix = pathData.matrix;
    }
    var path2d = new Path2D(path);
    var tempCanvas = document.createElement("canvas");
    var tempCtx = tempCanvas.getContext("2d");
    if (!matrix) {
      var maxSize = 1e3;
      var minX = maxSize;
      var minY = maxSize;
      var maxX = 0;
      var maxY = 0;
      var width, height;
      for (var x = 0; x < maxSize; x += 2) {
        for (var y = 0; y < maxSize; y += 2) {
          if (tempCtx.isPointInPath(path2d, x, y, "nonzero")) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      width = maxX - minX;
      height = maxY - minY;
      var maxDesiredSize = 10;
      var scale = Math.min(maxDesiredSize / width, maxDesiredSize / height);
      matrix = [
        scale,
        0,
        0,
        scale,
        -Math.round(width / 2 + minX) * scale,
        -Math.round(height / 2 + minY) * scale
      ];
    }
    return {
      type: "path",
      path,
      matrix
    };
  }
  function shapeFromText(textData) {
    var text, scalar = 1, color = "#000000", fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';
    if (typeof textData === "string") {
      text = textData;
    } else {
      text = textData.text;
      scalar = "scalar" in textData ? textData.scalar : scalar;
      fontFamily = "fontFamily" in textData ? textData.fontFamily : fontFamily;
      color = "color" in textData ? textData.color : color;
    }
    var fontSize = 10 * scalar;
    var font = "" + fontSize + "px " + fontFamily;
    var canvas = new OffscreenCanvas(fontSize, fontSize);
    var ctx = canvas.getContext("2d");
    ctx.font = font;
    var size = ctx.measureText(text);
    var width = Math.ceil(size.actualBoundingBoxRight + size.actualBoundingBoxLeft);
    var height = Math.ceil(size.actualBoundingBoxAscent + size.actualBoundingBoxDescent);
    var padding = 2;
    var x = size.actualBoundingBoxLeft + padding;
    var y = size.actualBoundingBoxAscent + padding;
    width += padding + padding;
    height += padding + padding;
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext("2d");
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    var scale = 1 / scalar;
    return {
      type: "bitmap",
      // TODO these probably need to be transfered for workers
      bitmap: canvas.transferToImageBitmap(),
      matrix: [scale, 0, 0, scale, -width * scale / 2, -height * scale / 2]
    };
  }
  module.exports = function() {
    return getDefaultFire().apply(this, arguments);
  };
  module.exports.reset = function() {
    getDefaultFire().reset();
  };
  module.exports.create = confettiCannon;
  module.exports.shapeFromPath = shapeFromPath;
  module.exports.shapeFromText = shapeFromText;
})((function() {
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  return this || {};
})(), module$1, false);
const confetti = module$1.exports;
module$1.exports.create;
const wordsEl = document.getElementById("words");
const inputField = document.getElementById("input-field");
const caretEl = document.getElementById("caret");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const timerEl = document.getElementById("timer");
const progressStatEl = document.getElementById("progress-stat");
const progressLabelEl = progressStatEl.querySelector(".stat-label");
const restartBtn = document.getElementById("restart-btn");
const resultsEl = document.getElementById("results");
const resultWpmEl = document.getElementById("result-wpm");
const resultAccuracyEl = document.getElementById("result-accuracy");
const resultCharactersEl = document.getElementById("result-characters");
const newTestBtn = document.getElementById("new-test-btn");
const wordCountBtns = document.querySelectorAll("#word-count-selector .config-btn");
const timedBtn = document.getElementById("timed-btn");
const timeBtns = document.querySelectorAll("#time-selector .config-btn");
const endlessBtn = document.querySelector("#endless-group .config-btn");
const themeBtn = document.getElementById("theme-btn");
function updateThemeUI(theme) {
  if (theme === "light") {
    document.body.classList.add("theme-light");
  } else {
    document.body.classList.remove("theme-light");
  }
  themeBtn.textContent = `theme: ${theme}`;
}
function updateConfigUI() {
  const timedGroup = document.getElementById("timed-group");
  const timeSelector = document.getElementById("time-selector");
  document.getElementById("endless-group");
  wordCountBtns.forEach((btn) => {
    if (state.mode === "words" && parseInt(btn.dataset.value) === state.value) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  if (state.mode === "timed") {
    timedGroup.classList.add("collapsed");
    timeSelector.classList.remove("collapsed");
    timeBtns.forEach((btn) => {
      if (parseInt(btn.dataset.value) === state.value) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    if (endlessBtn) endlessBtn.classList.remove("active");
  } else if (state.mode === "endless") {
    timedGroup.classList.remove("collapsed");
    timeSelector.classList.add("collapsed");
    timedBtn.classList.remove("active");
    if (endlessBtn) endlessBtn.classList.add("active");
  } else {
    timedGroup.classList.remove("collapsed");
    timeSelector.classList.add("collapsed");
    timedBtn.classList.remove("active");
    if (endlessBtn) endlessBtn.classList.remove("active");
  }
  if (state.mode === "words") {
    progressLabelEl.textContent = "Words";
    timerEl.textContent = "0";
  } else if (state.mode === "timed") {
    progressLabelEl.textContent = "Time";
    timerEl.textContent = state.value;
  } else {
    progressLabelEl.textContent = "Words";
    timerEl.textContent = "0";
  }
}
function updateCaret() {
  const currentWord = document.querySelector(".word.current");
  if (!currentWord) return;
  const currentLetter = currentWord.querySelector(`.letter[data-letter-index="${state.currentLetterIndex}"]`);
  const wordRect = currentWord.getBoundingClientRect();
  const typingAreaRect = document.querySelector(".typing-area").getBoundingClientRect();
  if (wordRect.top > typingAreaRect.top + 100) {
    const scrollOffset = wordRect.top - typingAreaRect.top - 20;
    wordsEl.scrollTo({
      top: wordsEl.scrollTop + scrollOffset,
      behavior: "auto"
      // Instant scroll to prevent jumping/jitter during fast typing
    });
  }
  if (currentLetter) {
    const letterRect = currentLetter.getBoundingClientRect();
    caretEl.style.left = `${letterRect.left - typingAreaRect.left}px`;
    caretEl.style.top = `${letterRect.top - typingAreaRect.top}px`;
  } else {
    const letters = currentWord.querySelectorAll(".letter");
    if (letters.length > 0) {
      const lastLetter = letters[letters.length - 1];
      const letterRect = lastLetter.getBoundingClientRect();
      caretEl.style.left = `${letterRect.right - typingAreaRect.left}px`;
      caretEl.style.top = `${letterRect.top - typingAreaRect.top}px`;
    } else {
      caretEl.style.left = `${wordRect.left - typingAreaRect.left}px`;
      caretEl.style.top = `${wordRect.top - typingAreaRect.top}px`;
    }
  }
}
function updateWordDisplay(wordIndex, typedValue) {
  const wordEl = document.querySelector(`.word[data-word-index="${wordIndex}"]`);
  const currentWord = state.words[wordIndex];
  if (!wordEl) return;
  if (typedValue.length > currentWord.length) {
    wordEl.classList.add("error");
  } else {
    wordEl.classList.remove("error");
  }
  const letters = wordEl.querySelectorAll(".letter:not(.extra)");
  const extraLetters = wordEl.querySelectorAll(".letter.extra");
  extraLetters.forEach((el) => el.remove());
  letters.forEach((letterEl, index) => {
    if (index < typedValue.length) {
      if (typedValue[index] === currentWord[index]) {
        letterEl.className = "letter correct";
      } else {
        letterEl.className = "letter incorrect";
      }
    } else {
      letterEl.className = "letter";
    }
  });
  if (typedValue.length > currentWord.length) {
    const extraChars = typedValue.slice(currentWord.length);
    extraChars.split("").forEach((char) => {
      const extraEl = document.createElement("span");
      extraEl.className = "letter extra";
      extraEl.textContent = char;
      wordEl.appendChild(extraEl);
    });
  }
}
function calculateWPM() {
  if (!state.startTime) return 0;
  const timeElapsed = (Date.now() - state.startTime) / 1e3 / 60;
  if (timeElapsed === 0) return 0;
  const wordsTyped = state.currentWordIndex + state.currentLetterIndex / 5;
  return Math.round(wordsTyped / timeElapsed);
}
function calculateAccuracy() {
  if (state.typedHistory.length === 0 && state.currentLetterIndex === 0) return 100;
  let correctChars = 0;
  let totalChars = 0;
  for (let i = 0; i < state.currentWordIndex; i++) {
    const word = state.words[i];
    const typed = state.wordStates[i]?.typed || "";
    for (let j = 0; j < Math.max(word.length, typed.length); j++) {
      totalChars++;
      if (word[j] === typed[j]) correctChars++;
    }
  }
  const currentWord = state.words[state.currentWordIndex];
  const currentTyped = inputField.value;
  for (let i = 0; i < currentTyped.length; i++) {
    totalChars++;
    if (currentWord[i] === currentTyped[i]) correctChars++;
  }
  return totalChars > 0 ? Math.round(correctChars / totalChars * 100) : 100;
}
function updateStats() {
  wpmEl.textContent = calculateWPM();
  accuracyEl.textContent = `${calculateAccuracy()}%`;
  if (state.mode === "words") {
    timerEl.textContent = state.currentWordIndex;
  } else if (state.mode === "endless") {
    timerEl.textContent = state.currentWordIndex;
  }
}
function showResults(finalWPM, finalAccuracy, totalChars) {
  resultWpmEl.textContent = finalWPM;
  resultAccuracyEl.textContent = `${finalAccuracy}%`;
  resultCharactersEl.textContent = totalChars;
  resultsEl.style.display = "flex";
  restartBtn.style.display = "none";
  const confettiColors = state.theme === "light" ? ["#ff9671", "#ffcc5c", "#f9f871", "#ff69b4", "#ffffff"] : ["#a8e6cf", "#ff8b94", "#ffaaa5", "#ffd3b6", "#dcedc1"];
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: confettiColors
  });
}
const WORDS = [
  "the",
  "be",
  "of",
  "and",
  "a",
  "to",
  "in",
  "he",
  "have",
  "it",
  "that",
  "for",
  "they",
  "i",
  "with",
  "as",
  "not",
  "on",
  "she",
  "at",
  "by",
  "this",
  "we",
  "you",
  "do",
  "but",
  "from",
  "or",
  "which",
  "one",
  "would",
  "all",
  "will",
  "there",
  "say",
  "who",
  "make",
  "when",
  "can",
  "more",
  "if",
  "no",
  "man",
  "out",
  "other",
  "so",
  "what",
  "time",
  "up",
  "go",
  "about",
  "than",
  "into",
  "could",
  "state",
  "only",
  "new",
  "year",
  "some",
  "take",
  "come",
  "these",
  "know",
  "see",
  "use",
  "get",
  "like",
  "then",
  "first",
  "any",
  "work",
  "now",
  "may",
  "such",
  "give",
  "over",
  "think",
  "most",
  "even",
  "find",
  "day",
  "also",
  "after",
  "way",
  "many",
  "must",
  "look",
  "before",
  "great",
  "back",
  "through",
  "long",
  "where",
  "much",
  "should",
  "well",
  "people",
  "down",
  "own",
  "just",
  "because",
  "good",
  "each",
  "those",
  "feel",
  "seem",
  "how",
  "high",
  "too",
  "place",
  "little",
  "world",
  "very",
  "still",
  "nation",
  "hand",
  "old",
  "life",
  "tell",
  "write",
  "become",
  "here",
  "show",
  "house",
  "both",
  "between",
  "need",
  "mean",
  "call",
  "develop",
  "under",
  "last",
  "right",
  "move",
  "thing",
  "general",
  "school",
  "never",
  "same",
  "another",
  "begin",
  "while",
  "number",
  "part",
  "turn",
  "real",
  "leave",
  "might",
  "want",
  "point",
  "form",
  "off",
  "child",
  "few",
  "small",
  "since",
  "against",
  "ask",
  "late",
  "home",
  "interest",
  "large",
  "person",
  "end",
  "open",
  "public",
  "follow",
  "during",
  "present",
  "without",
  "again",
  "hold",
  "groove",
  "around",
  "possible",
  "head",
  "consider",
  "word",
  "program",
  "problem",
  "however",
  "lead",
  "system",
  "set",
  "order",
  "eye",
  "plan",
  "run",
  "keep",
  "face",
  "fact",
  "group",
  "play",
  "stand",
  "increase",
  "early",
  "course",
  "change",
  "help",
  "line",
  "quest",
  "void",
  "pixel",
  "cyber",
  "neon",
  "flux",
  "wave",
  "pulse",
  "echo",
  "drift",
  "glow",
  "haze",
  "mist",
  "rain",
  "soul",
  "star",
  "moon",
  "sky",
  "blue",
  "dark",
  "light",
  "night",
  "zero",
  "one",
  "code",
  "data",
  "link",
  "node",
  "grid",
  "core",
  "base",
  "acid",
  "bass",
  "beat",
  "drum",
  "flow",
  "jazz",
  "funk",
  "vibe",
  "zone",
  "zen",
  "art",
  "ink",
  "pen",
  "key",
  "lock",
  "door",
  "gate",
  "path",
  "road",
  "city",
  "town",
  "park",
  "lake",
  "sea",
  "ocean",
  "river",
  "mountain",
  "forest",
  "tree",
  "leaf",
  "flower",
  "bloom",
  "grow",
  "root",
  "seed",
  "soil",
  "earth",
  "wind",
  "fire",
  "water",
  "ice",
  "snow",
  "storm",
  "cloud",
  "rain",
  "sun",
  "star",
  "space",
  "time",
  "warp",
  "speed",
  "drive",
  "ship",
  "boat",
  "car",
  "plane",
  "train",
  "bike",
  "ride",
  "walk",
  "run",
  "jump",
  "fly",
  "swim",
  "dive",
  "sink",
  "float",
  "drift",
  "glide",
  "slide",
  "slip",
  "fall",
  "rise",
  "lift",
  "drop",
  "spin",
  "turn",
  "roll",
  "rock",
  "stone",
  "sand",
  "dust",
  "ash",
  "smoke",
  "steam",
  "fog",
  "mist",
  "haze",
  "blur",
  "focus",
  "sharp",
  "clear",
  "clean",
  "pure",
  "fresh",
  "cool",
  "warm",
  "hot",
  "cold",
  "soft",
  "hard",
  "rough",
  "smooth",
  "flat",
  "round",
  "square",
  "cube",
  "sphere",
  "cone",
  "line",
  "dot",
  "point",
  "shape",
  "form",
  "color",
  "paint",
  "draw",
  "sketch",
  "trace",
  "print",
  "type",
  "text",
  "font",
  "style",
  "mode",
  "mood",
  "tone",
  "tune",
  "note",
  "song",
  "sound",
  "noise",
  "voice",
  "word",
  "talk",
  "speak",
  "say",
  "tell",
  "ask",
  "hear",
  "listen",
  "look",
  "see",
  "watch",
  "view",
  "scan",
  "read",
  "write",
  "learn",
  "know",
  "think",
  "mind",
  "brain",
  "idea",
  "thought",
  "dream",
  "wish",
  "hope",
  "love",
  "hate",
  "fear",
  "anger",
  "joy",
  "sad",
  "happy",
  "calm",
  "peace",
  "war",
  "fight",
  "win",
  "lose",
  "game",
  "play",
  "sport",
  "team",
  "group",
  "crowd",
  "solo",
  "duo",
  "trio",
  "band",
  "club",
  "party",
  "event",
  "show",
  "stage",
  "scene",
  "act",
  "role",
  "cast",
  "crew",
  "film",
  "movie",
  "video",
  "image",
  "photo",
  "pic",
  "cam",
  "lens",
  "zoom",
  "focus",
  "flash",
  "light",
  "dark",
  "shadow",
  "shade",
  "tint",
  "hue",
  "sat",
  "val",
  "red",
  "green",
  "blue",
  "cyan",
  "magenta",
  "yellow",
  "black",
  "white",
  "gray",
  "grey",
  "silver",
  "gold",
  "copper",
  "bronze",
  "metal",
  "steel",
  "iron",
  "rust",
  "glass",
  "wood",
  "plastic",
  "paper",
  "cloth",
  "silk",
  "wool",
  "cotton",
  "linen",
  "denim",
  "leather",
  "skin",
  "bone",
  "blood",
  "sweat",
  "tear",
  "smile",
  "laugh",
  "cry",
  "shout",
  "scream",
  "whisper",
  "breath",
  "breathe",
  "air",
  "gas",
  "fuel",
  "oil",
  "power",
  "energy",
  "force",
  "mass",
  "speed",
  "rate",
  "time",
  "clock",
  "watch",
  "hour",
  "minute",
  "second",
  "moment",
  "now",
  "then",
  "later",
  "soon",
  "never",
  "always",
  "ever",
  "forever",
  "once",
  "twice",
  "thrice",
  "first",
  "second",
  "third",
  "last",
  "next",
  "prev",
  "start",
  "stop",
  "end",
  "begin",
  "finish",
  "done",
  "ready",
  "set",
  "go"
];
function generateWords(count) {
  const words = [];
  let lastWord = "";
  for (let i = 0; i < count; i++) {
    let newWord;
    do {
      newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    } while (newWord === lastWord);
    words.push(newWord);
    lastWord = newWord;
  }
  return words;
}
function initializeTest() {
  if (state.timer) clearInterval(state.timer);
  let wordCount = 50;
  if (state.mode === "words") {
    wordCount = state.value;
  } else if (state.mode === "timed") {
    wordCount = 100;
  }
  state.words = generateWords(wordCount);
  state.currentWordIndex = 0;
  state.currentLetterIndex = 0;
  state.typedHistory = [];
  state.isActive = false;
  state.startTime = null;
  state.wordStates = state.words.map(() => ({ typed: "", completed: false }));
  state.errors = 0;
  if (state.mode === "timed") {
    state.timeLeft = state.value;
  } else {
    state.timeLeft = 0;
  }
  wordsEl.innerHTML = "";
  state.words.forEach((word, wordIndex) => {
    const wordEl = document.createElement("div");
    wordEl.className = "word";
    wordEl.dataset.wordIndex = wordIndex;
    word.split("").forEach((letter, letterIndex) => {
      const letterEl = document.createElement("span");
      letterEl.className = "letter";
      letterEl.textContent = letter;
      letterEl.dataset.letterIndex = letterIndex;
      wordEl.appendChild(letterEl);
    });
    wordsEl.appendChild(wordEl);
  });
  document.querySelector(".word").classList.add("current");
  updateCaret();
  updateConfigUI();
  resultsEl.style.display = "none";
  restartBtn.style.display = "flex";
  document.body.classList.remove("focus-mode");
  wordsEl.classList.remove("blur");
  wordsEl.scrollTop = 0;
  wordsEl.classList.remove("fade-in");
  void wordsEl.offsetWidth;
  wordsEl.classList.add("fade-in");
  inputField.value = "";
  inputField.focus();
  wpmEl.textContent = "0";
  accuracyEl.textContent = "100%";
  document.removeEventListener("keydown", handlePostTestControls);
}
function startTimer() {
  if (state.mode !== "timed") return;
  state.timer = setInterval(() => {
    state.timeLeft--;
    timerEl.textContent = state.timeLeft;
    if (state.timeLeft <= 0) {
      endTest();
    }
  }, 1e3);
}
function moveToNextWord() {
  const currentWord = document.querySelector(".word.current");
  if (!currentWord) return;
  state.wordStates[state.currentWordIndex].completed = true;
  currentWord.classList.remove("current");
  state.currentWordIndex++;
  state.currentLetterIndex = 0;
  if (state.mode === "words" && state.currentWordIndex >= state.value) {
    endTest();
    return;
  }
  if ((state.mode === "endless" || state.mode === "timed") && state.currentWordIndex >= state.words.length - 10) {
    const newWords = generateWords(20);
    state.words.push(...newWords);
    newWords.forEach((word, i) => {
      const wordIndex = state.words.length - 20 + i;
      state.wordStates.push({ typed: "", completed: false });
      const wordEl = document.createElement("div");
      wordEl.className = "word";
      wordEl.dataset.wordIndex = wordIndex;
      word.split("").forEach((letter, letterIndex) => {
        const letterEl = document.createElement("span");
        letterEl.className = "letter";
        letterEl.textContent = letter;
        letterEl.dataset.letterIndex = letterIndex;
        wordEl.appendChild(letterEl);
      });
      wordsEl.appendChild(wordEl);
    });
  }
  if (state.currentWordIndex >= state.words.length) {
    endTest();
    return;
  }
  const nextWord = document.querySelector(`.word[data-word-index="${state.currentWordIndex}"]`);
  if (nextWord) {
    nextWord.classList.add("current");
    inputField.value = state.wordStates[state.currentWordIndex]?.typed || "";
    updateWordDisplay(state.currentWordIndex, inputField.value);
    updateCaret();
  } else {
    endTest();
  }
}
function handleTyping(e) {
  if (!state.isActive && inputField.value.length > 0) {
    state.isActive = true;
    state.startTime = Date.now();
    document.body.classList.add("focus-mode");
    const helpText = document.querySelector(".help-text");
    if (helpText) {
      helpText.style.display = "none";
    }
    startTimer();
  }
  const typedValue = inputField.value;
  state.wordStates[state.currentWordIndex].typed = typedValue;
  updateWordDisplay(state.currentWordIndex, typedValue);
  state.currentLetterIndex = typedValue.length;
  updateCaret();
  updateStats();
  if (state.mode === "words" && state.currentWordIndex === state.value - 1) {
    const currentWord = state.words[state.currentWordIndex];
    if (typedValue.length >= currentWord.length) {
      setTimeout(() => {
        state.wordStates[state.currentWordIndex].completed = true;
        endTest();
      }, 100);
    }
  }
}
function handleKeydown(e) {
  if (document.activeElement !== inputField) {
    inputField.focus();
  }
  if (e.key === "Tab") {
    e.preventDefault();
    initializeTest();
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    if (state.isActive) {
      moveToNextWord();
    }
    return;
  }
  if (e.key >= "0" && e.key <= "9") {
    e.preventDefault();
    return;
  }
  if (e.key === " ") {
    if (!state.isActive) {
      e.preventDefault();
      return;
    }
    if (!state.wordStates[state.currentWordIndex].completed) {
      e.preventDefault();
      const currentWord = state.words[state.currentWordIndex];
      const typedValue = inputField.value;
      if (typedValue.length >= currentWord.length) {
        moveToNextWord();
      } else {
        state.errors++;
        const newValue = typedValue + " ";
        inputField.value = newValue;
        state.wordStates[state.currentWordIndex].typed = newValue;
        updateWordDisplay(state.currentWordIndex, newValue);
        state.currentLetterIndex = newValue.length;
        updateCaret();
        updateStats();
      }
      return;
    }
  }
  if (e.key === "Backspace" && inputField.value.length === 0 && state.currentWordIndex > 0) {
    e.preventDefault();
    document.querySelector(`.word[data-word-index="${state.currentWordIndex - 1}"]`);
    const currentWordEl = document.querySelector(".word.current");
    if (currentWordEl) currentWordEl.classList.remove("current");
    state.currentWordIndex--;
    state.wordStates[state.currentWordIndex].completed = false;
    const prevWordEl = document.querySelector(`.word[data-word-index="${state.currentWordIndex}"]`);
    prevWordEl.classList.add("current");
    prevWordEl.classList.remove("error", "correct");
    const prevTyped = state.wordStates[state.currentWordIndex].typed;
    inputField.value = prevTyped;
    state.currentLetterIndex = prevTyped.length;
    updateCaret();
  }
}
let restartCooldown = false;
function endTest() {
  state.isActive = false;
  if (state.timer) clearInterval(state.timer);
  inputField.blur();
  document.body.classList.remove("focus-mode");
  wordsEl.classList.add("blur");
  const timeElapsed = (Date.now() - state.startTime) / 1e3 / 60;
  let totalChars = 0;
  let correctChars = 0;
  for (let i = 0; i <= state.currentWordIndex; i++) {
    const typedValue = state.wordStates[i]?.typed || "";
    const expectedWord = state.words[i];
    if (!expectedWord) continue;
    for (let j = 0; j < Math.max(typedValue.length, expectedWord.length); j++) {
      totalChars++;
      if (typedValue[j] === expectedWord[j]) {
        correctChars++;
      }
    }
  }
  const finalWPM = timeElapsed > 0 ? Math.round(totalChars / 5 / timeElapsed) : 0;
  const finalAccuracy = totalChars > 0 ? Math.round(correctChars / totalChars * 100) : 100;
  showResults(finalWPM, finalAccuracy, totalChars);
  restartCooldown = true;
  setTimeout(() => {
    restartCooldown = false;
  }, 800);
  document.addEventListener("keydown", handlePostTestControls);
}
function handlePostTestControls(e) {
  if (restartCooldown) {
    e.preventDefault();
    return;
  }
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    initializeTest();
  }
}
const isApp = typeof window !== "undefined" && (window.__TAURI__ !== void 0 || window.__TAURI_INTERNALS__ !== void 0 || window.__TAURI_IPC__ !== void 0);
const isWeb = !isApp;
const platform = isApp ? "tauri" : "web";
console.log(`🚀 Slimetype running on: ${platform} (App: ${isApp}, Web: ${isWeb})`);
inputField.addEventListener("input", handleTyping);
window.addEventListener("keydown", handleKeydown);
restartBtn.addEventListener("click", () => {
  inputField.focus();
  initializeTest();
});
newTestBtn.addEventListener("click", () => {
  initializeTest();
});
wordCountBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mode = "words";
    state.value = parseInt(btn.dataset.value);
    initializeTest();
  });
});
timedBtn.addEventListener("click", () => {
  state.mode = "timed";
  state.value = 30;
  updateConfigUI();
  initializeTest();
});
timeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mode = "timed";
    state.value = parseInt(btn.dataset.value);
    initializeTest();
  });
});
if (endlessBtn) {
  endlessBtn.addEventListener("click", () => {
    state.mode = "endless";
    state.value = 0;
    initializeTest();
  });
}
themeBtn.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  updateThemeUI(state.theme);
  localStorage.setItem("slimetype-theme", state.theme);
});
document.querySelector(".typing-area").addEventListener("click", () => {
  inputField.focus();
});
const savedTheme = localStorage.getItem("slimetype-theme");
if (savedTheme) {
  state.theme = savedTheme;
}
updateThemeUI(state.theme);
initializeTest();
//# sourceMappingURL=index.js.map
