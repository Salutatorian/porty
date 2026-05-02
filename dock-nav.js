/**
 * Vanilla port of @unlumen-ui/dock: gaussian magnification, springs, bottom anchor, tooltip + separators.
 * Matches defaults: magnification 1.8, distance 120, iconSize 40, gap 4, border radius 16.
 */
(function () {
  var MAGNIFICATION = 1.8;
  var DISTANCE = 120;
  var ICON_BASE = 40;
  var GAP = 4;
  var SPRING = 0.28;

  var LABELS = {
    "/": "Home",
    "/portfolio": "Work",
    "/about": "About",
    "/writing": "Writing",
    "/books": "Books",
    "/movies": "Movies",
    "/photos": "Photos",
    "/videos": "Videos",
    "/tools": "Tools",
    "/training": "Training",
    "#search": "Search",
    "#theme": "Theme",
  };

  function prefersReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  function prefersCoarsePointer() {
    try {
      return window.matchMedia("(pointer: coarse)").matches;
    } catch (e) {
      return false;
    }
  }

  function iconSizePx() {
    try {
      return window.matchMedia("(max-width: 640px)").matches ? 36 : ICON_BASE;
    } catch (e) {
      return ICON_BASE;
    }
  }

  function gaussianScale(d, mag, dist) {
    return (mag - 1) * Math.exp(-(d * d) / (2 * dist * dist)) + 1;
  }

  function initDock(nav) {
    if (!nav || nav.dataset.dockEnhanced === "1") return;

    try {
      if (window.getComputedStyle(nav).display === "none") return;
    } catch (e) {}

    var links = nav.querySelectorAll(":scope > a.nav-link");
    if (!links.length) return;

    nav.dataset.dockEnhanced = "1";
    nav.classList.add("nav--dock");
    nav.style.gap = GAP + "px";

    var ICON_SIZE = iconSizePx();

    var tooltip = document.createElement("div");
    tooltip.className = "dock-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.innerHTML =
      '<span class="dock-tooltip-inner"></span><svg class="dock-tooltip-caret" width="8" height="4" viewBox="0 0 8 4" aria-hidden="true"><path d="M0 0L4 4L8 0" fill="currentColor"/></svg>';
    tooltip.hidden = true;
    nav.appendChild(tooltip);
    var tooltipInner = tooltip.querySelector(".dock-tooltip-inner");

    var slots = [];
    links.forEach(function (a) {
      var href = a.getAttribute("href") || "";

      var wrap = document.createElement("div");
      wrap.className = "dock-slot";
      wrap.dataset.dockHref = href;

      var inner = document.createElement("div");
      inner.className = "dock-icon-inner";

      a.parentNode.insertBefore(wrap, a);
      inner.appendChild(a);
      wrap.appendChild(inner);

      var label = LABELS[href] || (a.textContent || "").trim() || "";
      if (label) {
        a.setAttribute("aria-label", label);
        // Use custom CSS tooltip only to avoid duplicate native bubbles.
        a.title = "";
        wrap.setAttribute("data-dock-label", label);
      }

      slots.push({
        wrap: wrap,
        inner: inner,
        link: a,
        currW: ICON_SIZE,
        targetW: ICON_SIZE,
      });
    });

    function insertSepAfterHref(href) {
      var sel = '.dock-slot[data-dock-href="' + href.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"]';
      var w = nav.querySelector(sel);
      if (!w) return;
      var next = w.nextElementSibling;
      if (next && next.classList && next.classList.contains("dock-separator")) return;
      var sep = document.createElement("span");
      sep.className = "dock-separator";
      sep.setAttribute("aria-hidden", "true");
      w.parentNode.insertBefore(sep, w.nextSibling);
    }

    insertSepAfterHref("/writing");
    insertSepAfterHref("/videos");
    insertSepAfterHref("/training");

    var mouseX = Infinity;
    var hoveredSlot = null;
    var rafId = 0;
    var reduced = prefersReducedMotion();
    var coarse = prefersCoarsePointer();

    window.addEventListener(
      "resize",
      function () {
        ICON_SIZE = iconSizePx();
        if (!slots.length) return;
        slots.forEach(function (s) {
          if (mouseX === Infinity || reduced || coarse) {
            s.targetW = ICON_SIZE;
          }
        });
        positionTooltip();
        updateTargets();
      },
      { passive: true }
    );

    function setTooltipForSlot(slot) {
      if (!slot) {
        tooltip.hidden = true;
        hoveredSlot = null;
        return;
      }
      var href = slot.link.getAttribute("href") || "";
      var text = LABELS[href] || slot.link.getAttribute("aria-label") || "";
      tooltipInner.textContent = text;
      tooltip.hidden = !text;
      hoveredSlot = slot;
    }

    function positionTooltip() {
      if (tooltip.hidden || !hoveredSlot) return;
      var iconEl = hoveredSlot.inner;
      var dockRect = nav.getBoundingClientRect();
      var iconRect = iconEl.getBoundingClientRect();
      var x = iconRect.left - dockRect.left + iconRect.width / 2;
      var bottom = dockRect.bottom - iconRect.top + 8;
      tooltip.style.left = x + "px";
      tooltip.style.bottom = bottom + "px";
    }

    function tick() {
      rafId = 0;
      var needsSpring =
        slots.length &&
        slots.some(function (s) {
          return Math.abs(s.targetW - s.currW) > 0.06;
        });

      if (!needsSpring && mouseX === Infinity) return;

      for (var i = 0; i < slots.length; i++) {
        var s = slots[i];
        var diff = s.targetW - s.currW;
        if (Math.abs(diff) > 0.08) {
          s.currW += diff * SPRING;
        } else {
          s.currW = s.targetW;
        }
        var w = Math.round(s.currW * 100) / 100;
        s.wrap.style.setProperty("--slot-w", w + "px");
        s.inner.style.width = w + "px";
        s.inner.style.height = w + "px";
      }
      positionTooltip();
      if (
        slots.some(function (s) {
          return Math.abs(s.targetW - s.currW) > 0.06;
        })
      ) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function scheduleTick() {
      if (rafId) return;
      rafId = requestAnimationFrame(tick);
    }

    function updateTargets() {
      ICON_SIZE = iconSizePx();
      if (reduced || coarse) {
        for (var i = 0; i < slots.length; i++) {
          slots[i].targetW = ICON_SIZE;
        }
        scheduleTick();
        return;
      }

      for (var j = 0; j < slots.length; j++) {
        var s = slots[j];
        var rect = s.wrap.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var d = Math.abs(mouseX - cx);
        var g = gaussianScale(d, MAGNIFICATION, DISTANCE);
        s.targetW = ICON_SIZE * g;
      }
      scheduleTick();
    }

    nav.addEventListener(
      "mousemove",
      function (e) {
        mouseX = e.clientX;
        updateTargets();
      },
      { passive: true }
    );

    nav.addEventListener(
      "mouseleave",
      function (e) {
        var rt = e.relatedTarget;
        if (rt && nav.contains(rt)) return;
        mouseX = Infinity;
        hoveredSlot = null;
        setTooltipForSlot(null);
        updateTargets();
      },
      { passive: true }
    );

    slots.forEach(function (s) {
      s.wrap.addEventListener(
        "mouseenter",
        function () {
          setTooltipForSlot(s);
          positionTooltip();
        },
        { passive: true }
      );
      s.wrap.addEventListener(
        "mouseleave",
        function (e) {
          var rt = e.relatedTarget;
          if (rt && nav.contains(rt)) return;
          setTooltipForSlot(null);
        },
        { passive: true }
      );
      s.link.addEventListener("focus", function () {
        setTooltipForSlot(s);
        positionTooltip();
        scheduleTick();
      });
      s.link.addEventListener("blur", function () {
        setTooltipForSlot(null);
      });
    });

    mouseX = Infinity;
    slots.forEach(function (s) {
      s.currW = ICON_SIZE;
      s.targetW = ICON_SIZE;
      s.wrap.style.setProperty("--slot-w", ICON_SIZE + "px");
      s.inner.style.width = ICON_SIZE + "px";
      s.inner.style.height = ICON_SIZE + "px";
    });
    scheduleTick();
  }

  function boot() {
    initDock(document.querySelector(".sidebar .nav"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
