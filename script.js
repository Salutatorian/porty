(function () {
  var STORAGE_KEY = "greater-engine-theme";

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function getPreferredTheme() {
    var stored = getStoredTheme();
    if (stored === "dark" || stored === "light") return stored;
    if (stored === "reading") {
      setStoredTheme("light");
      return "light";
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function initTheme() {
    var theme = getPreferredTheme();
    applyTheme(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute("data-theme");
    var next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    setStoredTheme(next);
    try { window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } })); } catch (e) {}
  }

  /* Credits fan deck (#credits-deck-stack): parallax tilt from pointer vs card center (~±10deg). */
  var CARD_TILT_DEG_PER_HALF = 20;

  function resetCreditsDeckTilt(mount) {
    if (!mount) return;
    Array.prototype.forEach.call(mount.querySelectorAll(".friend-card"), function (c) {
      c.style.setProperty("--tilt-rx", "0deg");
      c.style.setProperty("--tilt-ry", "0deg");
      c.style.setProperty("--mx", "-9999px");
      c.style.setProperty("--my", "-9999px");
    });
  }

  /* ---- Credits full-screen overlay (dock + palette; same #credits-deck-stack fan deck) ---- */
  var geCreditsOverlayEl = null;
  var geCreditsOverlayIsOpen = false;
  var geCreditsCloseTimer = 0;

  function prefersCreditsOverlayReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  function ensureCreditsOverlay() {
    if (geCreditsOverlayEl) return geCreditsOverlayEl;
    var root = document.createElement("div");
    root.id = "ge-credits-overlay";
    root.className = "ge-credits-overlay";
    if (prefersCreditsOverlayReducedMotion()) root.classList.add("ge-credits-overlay--reduced");
    root.setAttribute("hidden", "");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div class="ge-credits-overlay__backdrop" data-credits-backdrop="1" aria-hidden="true"></div>' +
      '<div class="ge-credits-overlay__panel" role="dialog" aria-modal="true" aria-label="Credits">' +
      '  <div class="credits-deck credits-deck--overlay" aria-label="Credits">' +
      '    <div class="friends-fab-stack credits-deck-stack" id="credits-deck-stack">' +
      '      <div class="friends-fab-stack-inner stack-inner-visible" role="list" aria-label="Credits">' +
      '<article class="friend-card" role="listitem" tabindex="0" style="--rest-x:-2px; --rest-y:-6px; --rest-rot:-3deg; --fan-x:20px; --fan-y:-380px; --fan-rot:-10deg; --z:1; --stagger:3;">' +
      '          <div class="friend-card-avatar" aria-hidden="true">&lt;blank&gt;</div>' +
      '          <p class="friend-card-eyebrow font-dot">blank</p>' +
      '          <h3 class="friend-card-name">&lt;blank&gt;</h3>' +
      '          <p class="friend-card-blurb">&lt;blank&gt;</p>' +
      '</article>' +
      '<article class="friend-card" role="listitem" tabindex="0" style="--rest-x:0px; --rest-y:-3px; --rest-rot:-1deg; --fan-x:200px; --fan-y:-410px; --fan-rot:-5deg; --z:2; --stagger:2;">' +
      '          <div class="friend-card-avatar" aria-hidden="true">&lt;blank&gt;</div>' +
      '          <p class="friend-card-eyebrow font-dot">blank</p>' +
      '          <h3 class="friend-card-name">&lt;blank&gt;</h3>' +
      '          <p class="friend-card-blurb">&lt;blank&gt;</p>' +
      '</article>' +
      '<article class="friend-card friend-card--spotlight" role="listitem" tabindex="0" style="--rest-x:0px; --rest-y:0px; --rest-rot:0deg; --fan-x:380px; --fan-y:-430px; --fan-rot:0deg; --z:5; --stagger:0;">' +
      '          <div class="friend-card-avatar friend-card-avatar--photo" aria-hidden="true"><img src="/images/friends/ty.png" alt="" /></div>' +
      '          <p class="friend-card-eyebrow font-dot">day one</p>' +
      '          <h3 class="friend-card-name">Ty Cepeda</h3>' +
      '          <p class="friend-card-blurb">Edit me — your shoutout for Ty.</p>' +
      '</article>' +
      '<article class="friend-card" role="listitem" tabindex="0" style="--rest-x:0px; --rest-y:-3px; --rest-rot:1deg; --fan-x:560px; --fan-y:-410px; --fan-rot:5deg; --z:2; --stagger:2;">' +
      '          <div class="friend-card-avatar" aria-hidden="true">&lt;blank&gt;</div>' +
      '          <p class="friend-card-eyebrow font-dot">blank</p>' +
      '          <h3 class="friend-card-name">&lt;blank&gt;</h3>' +
      '          <p class="friend-card-blurb">&lt;blank&gt;</p>' +
      '</article>' +
      '<article class="friend-card" role="listitem" tabindex="0" style="--rest-x:2px; --rest-y:-6px; --rest-rot:3deg; --fan-x:740px; --fan-y:-380px; --fan-rot:10deg; --z:1; --stagger:3;">' +
      '          <div class="friend-card-avatar" aria-hidden="true">&lt;blank&gt;</div>' +
      '          <p class="friend-card-eyebrow font-dot">blank</p>' +
      '          <h3 class="friend-card-name">&lt;blank&gt;</h3>' +
      '          <p class="friend-card-blurb">&lt;blank&gt;</p>' +
      '</article>' +
      '</div></div></div></div>';

    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-credits-close]")) {
        e.preventDefault();
        closeCreditsOverlay();
        return;
      }
      if (e.target.closest("[data-credits-backdrop]")) {
        closeCreditsOverlay();
        return;
      }
      if (!e.target.closest(".credits-deck")) {
        closeCreditsOverlay();
      }
    });

    document.body.appendChild(root);
    geCreditsOverlayEl = root;
    return root;
  }

  function setCreditsNavActive(active) {
    document
      .querySelectorAll('a[href="#credits-overlay"].nav-link, a[href="#credits-overlay"].mobile-nav-link')
      .forEach(function (a) {
        a.classList.toggle("active", !!active);
      });
  }

  function ensureCreditsDeckInitialized() {
    var mount = document.getElementById("credits-deck-stack");
    if (!mount || mount.dataset.creditsDeckBound === "1") return;
    initCreditsDeck();
  }

  function openCreditsOverlay() {
    if (geCreditsCloseTimer) {
      clearTimeout(geCreditsCloseTimer);
      geCreditsCloseTimer = 0;
    }
    var root = ensureCreditsOverlay();
    if (geCreditsOverlayIsOpen) return;
    geCreditsOverlayIsOpen = true;
    root.removeAttribute("hidden");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("ge-credits-overlay-open");
    setCreditsNavActive(true);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.add("is-open");
        ensureCreditsDeckInitialized();
        var focusCard =
          root.querySelector(".friend-card--spotlight") || root.querySelector(".friend-card");
        if (focusCard) focusCard.focus({ preventScroll: true });
      });
    });
  }

  function closeCreditsOverlay() {
    var root = geCreditsOverlayEl;
    if (!root || !geCreditsOverlayIsOpen) return;
    geCreditsOverlayIsOpen = false;
    root.classList.remove("is-open");
    document.body.classList.remove("ge-credits-overlay-open");
    setCreditsNavActive(false);
    resetCreditsDeckTilt(root.querySelector("#credits-deck-stack"));
    if (geCreditsCloseTimer) clearTimeout(geCreditsCloseTimer);
    geCreditsCloseTimer = window.setTimeout(function () {
      geCreditsCloseTimer = 0;
      if (geCreditsOverlayIsOpen) return;
      root.setAttribute("hidden", "");
      root.setAttribute("aria-hidden", "true");
    }, prefersCreditsOverlayReducedMotion() ? 0 : 340);
  }

  function toggleCreditsOverlay() {
    if (geCreditsOverlayIsOpen) closeCreditsOverlay();
    else openCreditsOverlay();
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest('a[href="#credits-overlay"]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      var mobileNav = document.querySelector(".mobile-nav");
      var menuBtn = document.querySelector(".mobile-menu-btn");
      if (mobileNav) mobileNav.classList.remove("is-open");
      document.body.classList.remove("mobile-menu-open");
      if (menuBtn) {
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Open menu");
      }
      toggleCreditsOverlay();
    },
    true
  );

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Escape" || !geCreditsOverlayIsOpen) return;
      e.preventDefault();
      e.stopPropagation();
      closeCreditsOverlay();
    },
    true
  );

  document.addEventListener("ge-open-credits", function () {
    openCreditsOverlay();
  });

  /** Friend card fan + motif + tilt on `#credits-deck-stack` (in global overlay). */
  function initCreditsDeck() {
    var mount = document.getElementById("credits-deck-stack");
    if (!mount || mount.dataset.creditsDeckBound === "1") return;
    mount.dataset.creditsDeckBound = "1";

    var ICON_GLYPHS = {
      star: '<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
      zap: '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
      circle: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1"/>',
      triangle: '<polygon points="12,3 22,21 2,21" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
      hexagon: '<polygon points="17.5,3 6.5,3 1,12 6.5,21 17.5,21 23,12" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
      square: '<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1"/>',
      plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
      moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
      diamond: '<polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
      asterisk: '<path d="M12 2v20M3.5 6.5l17 11M3.5 17.5l17-11" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
      target: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1"/>',
      cross: '<path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
      code: '<path d="M9 8l-5 4 5 4M15 8l5 4-5 4" stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"/>',
      orbit: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1" transform="rotate(30 12 12)"/>',
      atom: '<circle cx="12" cy="12" r="2" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1" transform="rotate(60 12 12)"/>'
    };
    function fnv1aHash(str) {
      var h = 2166136261 >>> 0;
      for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }
    function mulberry32(seed) {
      return function () {
        seed = (seed + 0x6D2B79F5) >>> 0;
        var t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    Array.prototype.forEach.call(mount.querySelectorAll(".friend-card"), function (card) {
      if (card.querySelector(".friend-card-motif")) return;
      var nameEl = card.querySelector(".friend-card-name");
      var seedSrc = (nameEl ? nameEl.textContent : card.textContent || "friend").trim().toLowerCase();
      var rand = mulberry32(fnv1aHash(seedSrc));
      var keys = Object.keys(ICON_GLYPHS);
      var count = 36 + Math.floor(rand() * 13);
      var motif = document.createElement("div");
      motif.className = "friend-card-motif";
      motif.setAttribute("aria-hidden", "true");
      var html = "";
      for (var i = 0; i < count; i++) {
        var key = keys[Math.floor(rand() * keys.length)];
        var size = 8 + Math.floor(rand() * 6);
        var x = 4 + Math.floor(rand() * 92);
        var y = 4 + Math.floor(rand() * 92);
        var rot = Math.floor(rand() * 80 - 40);
        var op = (0.6 + rand() * 0.4).toFixed(2);
        html +=
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size +
          '" style="position:absolute;left:' + x + "%;top:" + y +
          "%;transform:translate(-50%,-50%) rotate(" + rot +
          "deg);opacity:" + op + ';">' + ICON_GLYPHS[key] + "</svg>";
      }
      motif.innerHTML = html;
      card.insertBefore(motif, card.firstChild);
    });

    Array.prototype.forEach.call(mount.querySelectorAll(".friend-card"), function (card) {
      var raf = 0;
      var lastEv = null;
      function frame() {
        raf = 0;
        if (!lastEv) return;
        var r = card.getBoundingClientRect();
        var px = (lastEv.clientX - r.left) / r.width - 0.5;
        var py = (lastEv.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--tilt-ry", (px * CARD_TILT_DEG_PER_HALF).toFixed(2) + "deg");
        card.style.setProperty("--tilt-rx", (-py * CARD_TILT_DEG_PER_HALF).toFixed(2) + "deg");
        card.style.setProperty("--mx", (lastEv.clientX - r.left).toFixed(0) + "px");
        card.style.setProperty("--my", (lastEv.clientY - r.top).toFixed(0) + "px");
      }
      card.addEventListener(
        "mouseenter",
        function () { card.classList.add("is-tilting"); },
        { passive: true }
      );
      card.addEventListener(
        "mousemove",
        function (e) {
          lastEv = e;
          if (!raf) raf = requestAnimationFrame(frame);
        },
        { passive: true }
      );
      card.addEventListener(
        "mouseleave",
        function () {
          lastEv = null;
          card.classList.remove("is-tilting");
          card.style.setProperty("--tilt-rx", "0deg");
          card.style.setProperty("--tilt-ry", "0deg");
          card.style.setProperty("--mx", "-9999px");
          card.style.setProperty("--my", "-9999px");
        },
        { passive: true }
      );
    });

    if (!window.__geCreditsDeckThemeListener) {
      window.__geCreditsDeckThemeListener = 1;
      window.addEventListener("themechange", function () {
        resetCreditsDeckTilt(document.getElementById("credits-deck-stack"));
      });
    }
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest(".theme-toggle, .nav-link[data-dock-action=\"theme\"], .nav-link[href=\"#theme\"]");
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      var dockBtns = document.querySelectorAll('.nav-link[href="#theme"]');
      dockBtns.forEach(function (b) { b.classList.add("is-flipping"); });
      setTimeout(function () {
        toggleTheme();
        setTimeout(function () {
          dockBtns.forEach(function (b) { b.classList.remove("is-flipping"); });
        }, 30);
      }, 180);
    }
  });

  function openCommandPalette() {
    if (window.GECommandPalette && typeof window.GECommandPalette.open === "function") {
      window.GECommandPalette.open();
      return;
    }
    var isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || "");
    var ev = new KeyboardEvent("keydown", {
      key: "k",
      bubbles: true,
      cancelable: true,
      metaKey: isMac,
      ctrlKey: !isMac,
    });
    document.dispatchEvent(ev);
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest('.nav-link[data-dock-action="search"]')) {
      e.preventDefault();
      e.stopPropagation();
      openCommandPalette();
    }
  });

  function closeMobileMenu() {
    var mobileNav = document.querySelector(".mobile-nav");
    var menuBtn = document.querySelector(".mobile-menu-btn");
    if (mobileNav) mobileNav.classList.remove("is-open");
    document.body.classList.remove("mobile-menu-open");
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open menu");
    }
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest(".mobile-menu-btn")) {
      e.preventDefault();
      var menuBtn = e.target.closest(".mobile-menu-btn");
      var mobileNav = document.querySelector(".mobile-nav");
      if (menuBtn && mobileNav) {
        var isOpen = mobileNav.classList.toggle("is-open");
        document.body.classList.toggle("mobile-menu-open", isOpen);
        menuBtn.setAttribute("aria-expanded", isOpen);
        menuBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      }
    } else if (e.target.closest(".mobile-nav-close") || e.target.closest(".mobile-nav-link")) {
      closeMobileMenu();
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    ensureCreditsOverlay();
    initTheme();
    initCreditsDeck();

    // Scroll reveal: fade in elements as they enter viewport
    var reveals = document.querySelectorAll(".scroll-reveal");
    if (reveals.length && "IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      reveals.forEach(function (el) { observer.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add("is-visible"); });
    }

    var mobileNav = document.querySelector(".mobile-nav");
    if (mobileNav) {
      var path = (window.location.pathname || "").toLowerCase();
      var isWriting = path.indexOf("/writing") >= 0;
      mobileNav.querySelectorAll(".mobile-nav-link").forEach(function (link) {
        var label = (link.textContent || "").trim().toLowerCase();
        var active = (label === "home" && (path === "/" || path === "" || path === "/index.html")) ||
                    (label === "about" && path.endsWith("about")) ||
                    (label === "writing" && isWriting) ||
                    (label === "books" && path.endsWith("books")) ||
                    (label === "photos" && path.endsWith("photos")) ||
                    (label === "training" && path.endsWith("training"));
        if (active) link.classList.add("active");
      });
    }
  });

  window.addEventListener("pagechange", function () {
    initCreditsDeck();
  });
})();
