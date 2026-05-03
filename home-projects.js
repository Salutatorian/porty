/**
 * Home Projects — data from GET /api/home-projects (see api/home-projects.js).
 */
(function () {
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatStatus(raw) {
    var s = String(raw || "").trim();
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ");
  }

  function formatPriority(p) {
    var x = String(p || "").toLowerCase();
    if (x === "high" || x === "medium" || x === "low") return x;
    return x || "";
  }

  function renderCurrentCards(items) {
    if (!items.length) {
      return '<p class="home-projects-empty">No active projects listed yet.</p>';
    }
    return (
      '<ul class="home-projects-grid" role="list">' +
      items
        .map(function (p) {
          var links = (p.links || [])
            .map(function (L) {
              var href = String(L.href || "#");
              var ext = /^https?:\/\//i.test(href);
              var attrs =
                'class="home-project-link" href="' +
                escapeHtml(href) +
                '"' +
                (ext ? ' target="_blank" rel="noopener noreferrer"' : "");
              return "<a " + attrs + ">" + escapeHtml(L.label) + "</a>";
            })
            .join("");
          var tags = (p.tags || [])
            .map(function (t) {
              return '<span class="home-project-tag">' + escapeHtml(t) + "</span>";
            })
            .join("");
          return (
            '<li class="home-project-card">' +
            '<div class="home-project-card-head">' +
            "<h3 class=\"home-project-title\">" +
            escapeHtml(p.title) +
            "</h3>" +
            (p.status
              ? '<span class="home-project-status">' + escapeHtml(formatStatus(p.status)) + "</span>"
              : "") +
            "</div>" +
            '<p class="home-project-desc">' +
            escapeHtml(p.description) +
            "</p>" +
            (tags ? '<div class="home-project-tags">' + tags + "</div>" : "") +
            (links ? '<div class="home-project-links">' + links + "</div>" : "") +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function renderFutureCards(items) {
    if (!items.length) {
      return '<p class="home-projects-empty">No future ideas listed yet.</p>';
    }
    return (
      '<ul class="home-projects-grid" role="list">' +
      items
        .map(function (p) {
          var pr = formatPriority(p.priority);
          var tags = (p.tags || [])
            .map(function (t) {
              return '<span class="home-project-tag">' + escapeHtml(t) + "</span>";
            })
            .join("");
          return (
            '<li class="home-project-card home-project-card--future">' +
            '<div class="home-project-card-head">' +
            "<h3 class=\"home-project-title\">" +
            escapeHtml(p.title) +
            "</h3>" +
            (pr
              ? '<span class="home-project-priority home-project-priority--' +
                escapeHtml(pr) +
                '">' +
                escapeHtml(pr) +
                "</span>"
              : "") +
            "</div>" +
            '<p class="home-project-desc">' +
            escapeHtml(p.description) +
            "</p>" +
            (tags ? '<div class="home-project-tags">' + tags + "</div>" : "") +
            (p.notes
              ? '<p class="home-project-notes"><span class="home-project-notes-label">Notes</span> ' +
                escapeHtml(p.notes) +
                "</p>"
              : "") +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function initStack(stackEl) {
    if (!stackEl || stackEl.dataset.stackBound === "1") return;
    stackEl.dataset.stackBound = "1";

    var track = stackEl.querySelector(".stack-track");
    var prevBtn = stackEl.querySelector(".stack-prev");
    var nextBtn = stackEl.querySelector(".stack-next");
    if (!track) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll(".stack-card"));
    var n = cards.length;

    function applyLayout() {
      cards.forEach(function (card, i) {
        var depth = Math.min(i, 3);
        var scale = 1 - depth * 0.05;
        var tx = depth * 22;
        var ty = depth * 6;
        var z = 100 - i;
        var op = i < 4 ? 1 : 0;
        var pe = i === 0 ? "auto" : "none";
        card.style.zIndex = String(z);
        card.style.opacity = String(op);
        card.style.pointerEvents = pe;
        card.classList.toggle("is-active", i === 0);
        card.style.setProperty("--stack-tx", tx + "px");
        card.style.setProperty("--stack-ty", ty + "px");
        card.style.setProperty("--stack-scale", String(scale));
        if (i !== 0) {
          card.style.setProperty("--stack-rx", "0deg");
          card.style.setProperty("--stack-ry", "0deg");
        }
      });
    }

    function cycle(direction) {
      if (n < 2) return;
      var leaving = cards[0];
      leaving.classList.add("is-leaving");
      leaving.style.setProperty("--stack-rx", "0deg");
      leaving.style.setProperty("--stack-ry", "0deg");
      leaving.style.setProperty("--stack-tx", direction === "next" ? "-340px" : "340px");
      leaving.style.opacity = "0";

      window.setTimeout(function () {
        if (direction === "next") cards.push(cards.shift());
        else cards.unshift(cards.pop());
        cards.forEach(function (c) { c.classList.remove("is-leaving"); });
        cards.forEach(function (c) { track.appendChild(c); });
        applyLayout();
      }, 320);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { cycle("prev"); });
    if (nextBtn) nextBtn.addEventListener("click", function () { cycle("next"); });

    track.addEventListener("mousemove", function (e) {
      var active = cards[0];
      if (!active || active.classList.contains("is-leaving")) return;
      var r = active.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      active.style.setProperty("--stack-ry", (px * 12).toFixed(2) + "deg");
      active.style.setProperty("--stack-rx", (-py * 12).toFixed(2) + "deg");
    });
    track.addEventListener("mouseleave", function () {
      var active = cards[0];
      if (!active) return;
      active.style.setProperty("--stack-rx", "0deg");
      active.style.setProperty("--stack-ry", "0deg");
    });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") cycle("next");
      else if (e.key === "ArrowLeft") cycle("prev");
    });

    applyLayout();
  }

  function initStacksIn(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll(".stack-carousel").forEach(initStack);
  }

  var lastTab = "current";

  function splitItems(items) {
    var cur = [];
    var fut = [];
    (items || []).forEach(function (p) {
      if (p && p.type === "future") fut.push(p);
      else if (p) cur.push(p);
    });
    return { cur: cur, fut: fut };
  }

  function init() {
    var root = document.getElementById("home-projects-root");
    if (!root) return;

    var panelCurrent = root.querySelector("#home-panel-current");
    var panelFuture = root.querySelector("#home-panel-future");
    var tabs = root.querySelectorAll(".home-projects-tab");
    if (!panelCurrent || !panelFuture) return;

    function setTabVisual(name) {
      lastTab = name;
      var isCurrent = name === "current";
      tabs.forEach(function (btn) {
        var on = btn.getAttribute("data-tab") === name;
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      panelCurrent.hidden = !isCurrent;
      panelFuture.hidden = isCurrent;
    }

    function wireTabsOnce() {
      if (root.dataset.homeProjectsUiBound === "1") return;
      root.dataset.homeProjectsUiBound = "1";
      tabs.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var name = btn.getAttribute("data-tab");
          if (name === "current" || name === "future") setTabVisual(name);
        });
      });
    }

    fetch("/api/home-projects?_=" + Date.now())
      .then(function (r) {
        return r.ok ? r.json() : { items: [] };
      })
      .then(function (data) {
        var items = data.items || [];
        var sp = splitItems(items);
        panelCurrent.innerHTML = renderCurrentCards(sp.cur);
        panelFuture.innerHTML = renderFutureCards(sp.fut);
        wireTabsOnce();
        setTabVisual(lastTab);
      })
      .catch(function () {
        panelCurrent.innerHTML =
          '<p class="home-projects-empty">Could not load projects.</p>';
        panelFuture.innerHTML =
          '<p class="home-projects-empty">Could not load projects.</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  document.addEventListener("pagechange", function (ev) {
    var path = ev.detail && ev.detail.path;
    var home =
      path === "/" ||
      path === "/index.html" ||
      path === "";
    if (!home) return;
    init();
  });
})();
