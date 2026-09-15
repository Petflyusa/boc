(function () {
  'use strict';
  var canvas = document.getElementById('particle-background');
  var context = canvas && canvas.getContext('2d');
  if (!context) return;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var width = 0, height = 0, points = [], frame = 0, lastTime = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Bound work on large screens; keep smaller screens spacious.
    var count = Math.min(90, Math.max(24, Math.round(width * height / 17000)));
    points = Array.from({ length: count }, function () {
      return { x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9,
        radius: 0.8 + Math.random() * 0.8, accent: Math.random() < 0.16 };
    });
    draw(0);
  }

  function draw(seconds) {
    context.clearRect(0, 0, width, height);
    points.forEach(function (point) {
      point.x = (point.x + point.vx * seconds + width) % width;
      point.y = (point.y + point.vy * seconds + height) % height;
    });
    points.forEach(function (point, index) {
      for (var j = index + 1; j < points.length; j += 1) {
        var other = points[j];
        var distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance >= 145) continue;
        context.strokeStyle = 'rgba(105, 117, 130,' + (0.13 * (1 - distance / 145)) + ')';
        context.lineWidth = 0.65;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }
      context.fillStyle = point.accent ? 'rgba(130,47,56,0.32)' : 'rgba(99,114,130,0.30)';
      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  function animate(time) {
    // Render at about 30 fps; motion stays time-based across displays.
    if (!lastTime || time - lastTime >= 32) {
      draw(lastTime ? Math.min((time - lastTime) / 1000, 0.08) : 0);
      lastTime = time;
    }
    frame = window.requestAnimationFrame(animate);
  }

  function updateMotion() {
    window.cancelAnimationFrame(frame);
    lastTime = 0;
    if (!motion.matches && !document.hidden) frame = window.requestAnimationFrame(animate);
    else draw(0);
  }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', updateMotion);
  motion.addEventListener('change', updateMotion);
  resize();
  updateMotion();
})();
