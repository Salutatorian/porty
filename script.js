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

  /* Friends FAB: use capture phase so theme-button handlers (stopPropagation) never block this. */
  function initFriendsFab() {
    var fab = document.getElementById("friends-fab");
    var trig = document.getElementById("friends-fab-trigger");
    if (!fab || !trig) return;
    if (fab.dataset.friendsFabBound === "1") return;
    fab.dataset.friendsFabBound = "1";

    function setOpen(o) {
      fab.classList.toggle("is-open", o);
      trig.setAttribute("aria-expanded", o ? "true" : "false");
      if (!o) {
        Array.prototype.forEach.call(fab.querySelectorAll(".friend-card"), function (c) {
          c.style.setProperty("--tilt-rx", "0deg");
          c.style.setProperty("--tilt-ry", "0deg");
        });
      }
    }

    /* Deterministic per-friend icon motif (stable across reloads).
       FNV-1a hash → mulberry32 PRNG → pick 5-7 lucide-ish SVG glyphs at
       seeded positions/sizes/rotations. Same name = same layout, forever. */
    var ICON_GLYPHS = {
      star: '<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="currentColor"/>',
      zap: '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="currentColor"/>',
      circle: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>',
      triangle: '<polygon points="12,3 22,21 2,21" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
      hexagon: '<polygon points="17.5,3 6.5,3 1,12 6.5,21 17.5,21 23,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
      square: '<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>',
      plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
      moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>',
      diamond: '<polygon points="12,2 22,12 12,22 2,12" fill="currentColor"/>',
      asterisk: '<path d="M12 2v20M3.5 6.5l17 11M3.5 17.5l17-11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      target: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/>',
      cross: '<path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'
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
    Array.prototype.forEach.call(fab.querySelectorAll(".friend-card"), function (card) {
      if (card.querySelector(".friend-card-motif")) return;
      var nameEl = card.querySelector(".friend-card-name");
      var seedSrc = (nameEl ? nameEl.textContent : card.textContent || "friend").trim().toLowerCase();
      var rand = mulberry32(fnv1aHash(seedSrc));
      var keys = Object.keys(ICON_GLYPHS);
      var count = 5 + Math.floor(rand() * 3);
      var motif = document.createElement("div");
      motif.className = "friend-card-motif";
      motif.setAttribute("aria-hidden", "true");
      var svgNS = "http://www.w3.org/2000/svg";
      var html = "";
      for (var i = 0; i < count; i++) {
        var key = keys[Math.floor(rand() * keys.length)];
        var size = 22 + Math.floor(rand() * 28);
        var x = 6 + Math.floor(rand() * 88);
        var y = 6 + Math.floor(rand() * 88);
        var rot = Math.floor(rand() * 60 - 30);
        var op = (0.55 + rand() * 0.45).toFixed(2);
        html +=
          '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
          '" style="position:absolute;left:' + x + '%;top:' + y +
          '%;transform:translate(-50%,-50%) rotate(' + rot +
          'deg);opacity:' + op + ';">' + ICON_GLYPHS[key] + "</svg>";
      }
      motif.innerHTML = html;
      card.insertBefore(motif, card.firstChild);
    });

    /* 3D parallax tilt on whichever card is currently being hovered. */
    Array.prototype.forEach.call(fab.querySelectorAll(".friend-card"), function (card) {
      var raf = 0;
      var lastEv = null;
      function frame() {
        raf = 0;
        if (!lastEv) return;
        var r = card.getBoundingClientRect();
        var px = (lastEv.clientX - r.left) / r.width - 0.5;
        var py = (lastEv.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--tilt-ry", (px * 3).toFixed(2) + "deg");
        card.style.setProperty("--tilt-rx", (-py * 3).toFixed(2) + "deg");
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
        },
        { passive: true }
      );
    });

    trig.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        setOpen(!fab.classList.contains("is-open"));
      },
      true
    );

    fab.addEventListener(
      "click",
      function (e) {
        if (e.target.closest(".friend-card") || e.target.closest(".friends-fab-trigger")) return;
        setOpen(false);
      },
      false
    );

    document.addEventListener(
      "click",
      function (e) {
        if (!fab.contains(e.target)) setOpen(false);
      },
      false
    );

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("themechange", function () {
      setOpen(false);
    });
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
    var trigger = document.querySelector(".search-trigger");
    if (trigger) {
      trigger.click();
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
    initTheme();
    initFriendsFab();

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
    initFriendsFab();
  });
})();
