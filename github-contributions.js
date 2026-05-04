(function () {
  if (window.__PORTY_GITHUB_CONTRIB_INIT__) return;
  window.__PORTY_GITHUB_CONTRIB_INIT__ = true;

  /** Set to false to silence temporary contribution-fetch debug logs */
  var GH_CONTRIB_DEBUG = false;

  var requestGeneration = 0;

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

  function renderMonths(monthRow, weeks, data) {
    if (!monthRow) return;
    monthRow.innerHTML = "";
    monthRow.style.setProperty("--weeks", String(weeks.length));
    var prevYm = "";
    var calendarY =
      data && data.range === "calendar" && data.year != null
        ? String(data.year)
        : "";
    for (var w = 0; w < weeks.length; w++) {
      var day = weeks[w] && weeks[w][0];
      if (!day || !day.date) continue;
      if (calendarY && day.date.slice(0, 4) !== calendarY) continue;
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
    renderMonths(monthRow, weeks, data);

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

    var user = (grid.getAttribute("data-user") || "Salutatorian").trim();
    if (!user) user = "Salutatorian";

    var calendarYear =
      Number(grid.getAttribute("data-calendar-year")) || new Date().getUTCFullYear();

    var myGen = ++requestGeneration;

    async function loadContributions() {
      var success = false;
      try {
        /* Calendar-year grid so month strip reads Jan → Dec (GitHub’s weeks for Jan 1–Dec 31 UTC). */
        var url =
          "/api/github-contributions?username=" +
          encodeURIComponent(user) +
          "&range=calendar&year=" +
          encodeURIComponent(String(calendarYear));

        if (GH_CONTRIB_DEBUG) {
          console.log("[github-contrib debug] GET", url);
        }

        var res = await fetch(url);

        if (GH_CONTRIB_DEBUG) {
          console.log(
            "[github-contrib debug] response status:",
            res.status,
            res.statusText
          );
        }

        if (myGen !== requestGeneration) return;

        if (!res.ok) {
          var errBody = await res.text();
          var errMsg = "HTTP " + res.status;
          try {
            var ep = JSON.parse(errBody);
            if (ep && ep.error) errMsg = ep.error;
            if (ep && ep.details) errMsg = errMsg + (ep.error ? " — " : ": ") + ep.details;
            if (GH_CONTRIB_DEBUG) {
              console.error("[github-contrib debug] API error body:", ep);
            }
          } catch (e) {
            if (GH_CONTRIB_DEBUG) {
              console.error("[github-contrib debug] error text:", errBody.slice(0, 300));
            }
            if (errBody) errMsg = errMsg + " — " + errBody.slice(0, 200);
          }
          throw new Error(errMsg);
        }

        var data = await res.json();

        if (GH_CONTRIB_DEBUG) {
          console.log("[github-contrib debug] response data:", {
            total: data.total,
            totalContributions: data.totalContributions,
            weekColumns: data.weeks && data.weeks.length,
            user: data.user,
          });
        }

        if (myGen !== requestGeneration) return;

        if (
          data.error &&
          (!data.weeks || !Array.isArray(data.weeks) || data.weeks.length === 0)
        ) {
          throw new Error(data.error || "API returned an error");
        }

        grid.dataset.loaded = "1";
        renderContrib(data, grid, monthRow, stat, tooltip);
        success = true;
      } catch (err) {
        console.error("Failed to load GitHub contributions:", err);
        if (myGen !== requestGeneration) return;

        var brief =
          err && err.message
            ? String(err.message).slice(0, 220)
            : "Could not load GitHub contributions.";
        if (stat) stat.textContent = brief;
        if (grid) {
          grid.innerHTML = "";
          grid.dataset.loaded = "1";
        }
        if (monthRow) monthRow.innerHTML = "";
      } finally {
        if (myGen !== requestGeneration) return;

        if (
          !success &&
          stat &&
          stat.textContent.indexOf("Loading contributions") !== -1
        ) {
          stat.textContent = "Could not load GitHub contributions.";
        }
      }
    }

    loadContributions();
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
