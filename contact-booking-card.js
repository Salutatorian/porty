/**
 * MagicBento-style effects for .contactBentoCard only (particles, glow, click pulse).
 * GSAP must load before this file. Skips work when prefers-reduced-motion.
 */
(function () {
  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function isDarkTheme() {
    var h = document.documentElement.getAttribute("data-theme");
    if (h === "dark") return true;
    if (document.body.classList.contains("dark")) return true;
    return false;
  }

  function init() {
    var card = document.querySelector(".contactBentoCard");
    if (!card) return;

    var canvas = card.querySelector(".contactBentoCard__particles");
    var spotlight = card.querySelector(".contactBentoCard__spotlight");
    if (!canvas || !spotlight) return;

    var particleCount = 10;
    var spotlightRadius = 360;

    if (prefersReducedMotion() || typeof window.gsap === "undefined") {
      canvas.style.display = "none";
      spotlight.style.opacity = "0";
      return;
    }

    var gsap = window.gsap;
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    var w = 0;
    var h = 0;
    var particles = [];
    var mx = 0.5;
    var my = 0.5;
    var targetMx = 0.5;
    var targetMy = 0.5;
    var rafId = 0;

    function glowRgb() {
      return isDarkTheme() ? "132, 0, 255" : "190, 150, 90";
    }

    function resize() {
      var rect = card.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnParticles() {
      particles.length = 0;
      for (var i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 1.2,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          ph: Math.random() * Math.PI * 2,
        });
      }
    }

    function drawFrame() {
      ctx.clearRect(0, 0, w, h);
      var rgb = glowRgb().split(",").map(function (x) {
        return parseInt(x.trim(), 10);
      });
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.ph += 0.008;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        var a = 0.15 + Math.sin(p.ph + i) * 0.08;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
        ctx.fill();
      }
      rafId = requestAnimationFrame(drawFrame);
    }

    var followRaf = 0;

    function updateSpotlight() {
      var xp = mx * 100;
      var yp = my * 100;
      var rgb = glowRgb();
      spotlight.style.background =
        "radial-gradient(circle " +
        spotlightRadius +
        "px at " +
        xp +
        "% " +
        yp +
        "%, rgba(" +
        rgb +
        ", 0.22), transparent 62%)";
    }

    function followLoop() {
      mx += (targetMx - mx) * 0.12;
      my += (targetMy - my) * 0.12;
      updateSpotlight();
      if (
        Math.abs(targetMx - mx) > 0.004 ||
        Math.abs(targetMy - my) > 0.004
      ) {
        followRaf = requestAnimationFrame(followLoop);
      } else {
        followRaf = 0;
      }
    }

    function kickFollow() {
      if (!followRaf) followRaf = requestAnimationFrame(followLoop);
    }

    function onMove(ev) {
      var rect = card.getBoundingClientRect();
      var x = (ev.clientX - rect.left) / rect.width;
      var y = (ev.clientY - rect.top) / rect.height;
      targetMx = Math.max(0, Math.min(1, x));
      targetMy = Math.max(0, Math.min(1, y));
      kickFollow();
    }

    function onLeave() {
      targetMx = 0.5;
      targetMy = 0.5;
      kickFollow();
    }

    function pulseGlow() {
      var rgb = glowRgb();
      gsap.fromTo(
        card,
        {
          boxShadow:
            "0 0 0 1px rgba(" +
            rgb +
            ", 0.35), 0 0 28px rgba(" +
            rgb +
            ", 0.35)",
        },
        {
          duration: 0.45,
          boxShadow:
            "0 0 0 1px rgba(" +
            rgb +
            ", 0.18), 0 0 18px rgba(" +
            rgb +
            ", 0.15)",
          ease: "power2.out",
        }
      );
    }

    resize();
    spawnParticles();
    mx = 0.5;
    my = 0.5;
    updateSpotlight();
    drawFrame();

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
    card.addEventListener(
      "click",
      function (e) {
        if (e.target.closest("a.contactBentoCard__btn")) pulseGlow();
      },
      true
    );

    window.addEventListener(
      "resize",
      function () {
        resize();
        spawnParticles();
      },
      { passive: true }
    );

    var mo = new MutationObserver(function () {
      resize();
      spawnParticles();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    mo.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener(
      "beforeunload",
      function () {
        cancelAnimationFrame(rafId);
        cancelAnimationFrame(followRaf);
        mo.disconnect();
      },
      { once: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
