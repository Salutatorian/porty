(function () {
  if (window.__PORTY_GITHUB_CONTRIB_INIT__) return;
  window.__PORTY_GITHUB_CONTRIB_INIT__ = true;

  function formatDate(iso) {
    var d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function formatCount(count) {
    return count + (count === 1 ? " contribution" : " contributions");
  }

  function monthShortFromDate(iso) {
    var d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });
  }

  function positionTooltip(tooltip, clientX, clientY) {
    if (!tooltip) return;
    var pad = 10;
    var tw = tooltip.offsetWidth;
    var th = tooltip.offsetHeight;
    var left = clientX - tw / 2;
    var top = clientY - th - 12;
    if (top < pad) top = clientY + 14;
    left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - th - pad));
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }

  function showTooltip(tooltip, text, clientX, clientY) {
    if (!tooltip) return;
    tooltip.textContent = text;
    tooltip.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        positionTooltip(tooltip, clientX, clientY);
      });
    });
  }

  function hideTooltip(tooltip) {
    if (!tooltip) return;
    tooltip.hidden = true;
  }

  function renderMonths(monthRow, weeks) {
    if (!monthRow) return;
    monthRow.innerHTML = "";
    monthRow.style.setProperty("--weeks", String(weeks.length));
    var prevYm = "";
    for (var w = 0; w < weeks.length; w++) {
      var day = weeks[w] && weeks[w][0];
      if (!day || !day.date) continue;
      var ym = day.date.slice(0, 7);
      if (ym === prevYm) continue;
      prevYm = ym;
      var el = document.createElement("span");
      el.className = "github-contrib-month";
      el.style.gridColumn = String(w + 1);
      el.textContent = monthShortFromDate(day.date);
      monthRow.appendChild(el);
    }
  }

  function renderContrib(data, grid, monthRow, stat, tooltip) {
    if (!grid) return;
    grid.innerHTML = "";

    var weeks = data.weeks || [];
    grid.style.setProperty("--weeks", String(weeks.length));
    renderMonths(monthRow, weeks);

    for (var w = 0; w < weeks.length; w++) {
      var week = weeks[w];
      for (var d = 0; d < week.length; d++) {
        var day = week[d];
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "github-cell level-" + (day.level || 0);
        btn.setAttribute("aria-label", formatCount(day.count) + " on " + formatDate(day.date));
        btn.dataset.date = day.date;
        btn.dataset.count = String(day.count);
        btn.style.gridColumn = String(w + 1);
        btn.style.gridRow = String(d + 1);

        btn.addEventListener("mouseenter", function (e) {
          var count = Number(e.currentTarget.dataset.count || 0);
          var date = e.currentTarget.dataset.date || "";
          showTooltip(tooltip, formatCount(count) + " on " + formatDate(date), e.clientX, e.clientY);
        });
        btn.addEventListener("mousemove", function (e) {
          var count = Number(e.currentTarget.dataset.count || 0);
          var date = e.currentTarget.dataset.date || "";
          showTooltip(tooltip, formatCount(count) + " on " + formatDate(date), e.clientX, e.clientY);
        });
        btn.addEventListener("mouseleave", function () {
          hideTooltip(tooltip);
        });
        btn.addEventListener("focus", function (e) {
          var count = Number(e.currentTarget.dataset.count || 0);
          var date = e.currentTarget.dataset.date || "";
          var r = e.currentTarget.getBoundingClientRect();
          showTooltip(tooltip, formatCount(count) + " on " + formatDate(date), r.left + r.width / 2, r.top + r.height / 2);
        });
        btn.addEventListener("blur", function () {
          hideTooltip(tooltip);
        });
        grid.appendChild(btn);
      }
    }

    if (stat) {
      if (data.range === "calendar" && data.year != null) {
        stat.textContent =
          data.total +
          " contributions in " +
          data.year +
          " on GitHub";
      } else {
        stat.textContent =
          data.total +
          " contributions in the last year on GitHub";
      }
    }
  }

  function initGithubContrib() {
    var grid = document.getElementById("github-contrib-grid");
    if (!grid || grid.dataset.loaded === "1") return;
    var monthRow = document.getElementById("github-contrib-months");
    var stat = document.getElementById("github-contrib-stat");
    var tooltip = document.getElementById("github-contrib-tooltip");
    if (tooltip && tooltip.parentNode !== document.body) {
      document.body.appendChild(tooltip);
    }
    fetch("/api/github-contributions?user=" + encodeURIComponent(user) + "&range=rolling")
      .then(function (r) {
        if (!r.ok) throw new Error("Failed request");
        return r.json();
      })
      .then(function (data) {
        grid.dataset.loaded = "1";
        renderContrib(data, grid, monthRow, stat, tooltip);
      })
      .catch(function () {
        if (stat) stat.textContent = "Could not load contributions right now.";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGithubContrib);
  } else {
    initGithubContrib();
  }
  window.addEventListener("pagechange", function () {
    var grid = document.getElementById("github-contrib-grid");
    if (grid) {
      grid.dataset.loaded = "";
      initGithubContrib();
    }
  });
})();
