/**
 * Training profile — premium dashboard powered by /api/training (Strava).
 * Falls back to placeholder data if the API is unreachable so the layout still demos.
 */
(function () {
  // Consistent sport palette (matches sport card accents).
  // cycling: blue · running: green · swimming: purple
  var SPORT = {
    cycling: {
      solid: "#4a90e2",
      fill: "rgba(74, 144, 226, 0.28)",
      edge: "rgba(74, 144, 226, 0.9)",
    },
    running: {
      solid: "#5bbf6c",
      fill: "rgba(91, 191, 108, 0.28)",
      edge: "rgba(91, 191, 108, 0.9)",
    },
    swimming: {
      solid: "#9b7dd8",
      fill: "rgba(155, 125, 216, 0.28)",
      edge: "rgba(155, 125, 216, 0.9)",
    },
  };

  var state = {
    weeks: [],
    weekLabels: [],
    totals: null,
    consistencyData: [],
    consistencyCols: 53,
    consistencyDays: 365,
    trainingDays: 0,
    restDays: 0,
    longestStreak: 0,
    currentStreak: 0,
    highlights: null,
    consistencyStart: "",
    consistencyEnd: "",
  };
  var chartInstances = [];
  var defaultConsistencyHint =
    "Rows are Sun–Sat; columns are weeks. Hover or tap a square for that day’s date.";

  // ---------------- helpers ----------------

  function formatHours(h) {
    if (!h || h < 0) h = 0;
    var hours = Math.floor(h);
    var mins = Math.round((h - hours) * 60);
    if (hours === 0) return mins + "m";
    return hours + "h " + (mins > 0 ? mins + "m" : "");
  }

  function formatInt(n) {
    return Math.round(n || 0).toLocaleString("en-US");
  }

  function formatMiles(n) {
    return formatInt(n) + " mi";
  }

  function formatDays(n) {
    var v = Math.round(n || 0);
    return v + (v === 1 ? " day" : " days");
  }

  function formatYards(miles) {
    // Swim distances shown as yards (swim pool convention)
    var yards = (miles || 0) * 1760;
    return formatInt(yards) + " yd";
  }

  function formatDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function inferConsistencyRangeIso() {
    var days = state.consistencyDays || 365;
    var end = new Date();
    var start = new Date();
    start.setDate(start.getDate() - (days - 1));
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }

  function addDaysIso(isoYmd, n) {
    var t = Date.parse(isoYmd + "T12:00:00.000Z");
    if (isNaN(t)) return isoYmd;
    return new Date(t + n * 86400000).toISOString().slice(0, 10);
  }

  function formatHeatmapDay(isoYmd) {
    var t = Date.parse(isoYmd + "T12:00:00.000Z");
    if (isNaN(t)) return "—";
    return new Date(t).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function utcTodayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  /** 0 Sun … 6 Sat (UTC calendar for ISO Y-M-D) */
  function utcWeekdaySun0(isoYmd) {
    var t = Date.parse(isoYmd + "T12:00:00.000Z");
    if (isNaN(t)) return 0;
    return new Date(t).getUTCDay();
  }

  function consistencyLevelLabel(level) {
    if (!level) return "Rest (no logged time)";
    if (level === 1) return "Training · light (under 20 min)";
    if (level === 2) return "Training · moderate (20–44 min)";
    if (level === 3) return "Training · solid (45–89 min)";
    return "Training · long (90+ min)";
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  // Animated count-up; respects reduced-motion.
  function animateValue(el, to, formatter, duration) {
    if (!el) return;
    var from = 0;
    var d = duration == null ? 900 : duration;
    if (prefersReducedMotion() || d <= 0) {
      el.textContent = formatter(to);
      return;
    }
    var start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / d);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatter(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function formatterFor(name) {
    if (name === "hoursMin") return formatHours;
    if (name === "miles") return formatMiles;
    if (name === "int") return formatInt;
    if (name === "days") return formatDays;
    return formatInt;
  }

  // ---------------- WHOOP (recovery) ----------------

  var whoopState = {
    enabled: false,
    message: "",
    range: "all",
    rangeDays: 365,
    fetchedAt: "",
    latest: null,
    series: [],
    sleep: null,
    cycle: null,
  };

  function buildPlaceholderWhoop() {
    var series = [];
    for (var i = 0; i < 12; i++) {
      series.push({
        date: addDaysIso(utcTodayIso(), -(11 - i)),
        score: 38 + ((i * 17) % 45),
      });
    }
    return {
      enabled: true,
      range: getActiveRange(),
      rangeDays: 365,
      latest: {
        date: utcTodayIso(),
        recoveryScore: 64,
        restingHeartRate: 58,
        hrvRmssd: 41.2,
      },
      series: series,
      sleep: {
        wakeDate: utcTodayIso(),
        performancePct: 92,
        efficiencyPct: 88.5,
        estimatedHours: 7.2,
        nap: false,
      },
      cycle: { day: utcTodayIso(), strain: 12.4, avgHr: 118 },
    };
  }

  function setWhoopNotice(visible, message) {
    var el =
      typeof document !== "undefined" &&
      document.getElementById &&
      document.getElementById("whoop-api-notice");
    if (!el) return;
    if (!visible) {
      el.setAttribute("hidden", "");
      el.textContent = "";
      return;
    }
    var t = message || "";
    if (t.length > 280) t = t.slice(0, 277) + "…";
    el.removeAttribute("hidden");
    el.textContent = t;
  }

  function setWhoopData(data) {
    whoopState.enabled = !!data.enabled;
    whoopState.message = typeof data.message === "string" ? data.message : "";
    whoopState.range = data.range || getActiveRange();
    whoopState.fetchedAt = typeof data.fetchedAt === "string" ? data.fetchedAt : "";
    whoopState.series = Array.isArray(data.series) ? data.series : [];
    whoopState.sleep = data.sleep || null;
    whoopState.cycle = data.cycle || null;
  }

  function renderWhoop() {
    var scoreEl = document.getElementById("whoop-score");
    var dateEl = document.getElementById("whoop-recovery-date");
    var meter = document.getElementById("whoop-score-meter");
    var hrvEl = document.getElementById("whoop-hrv");
    var rhrEl = document.getElementById("whoop-rhr");
    var sleepEl = document.getElementById("whoop-sleep");
    var sleepSubEl = document.getElementById("whoop-sleep-sub");
    var strainEl = document.getElementById("whoop-strain");
    var trend = document.getElementById("whoop-trend-bars");

    var L = whoopState.latest;
    var sl = whoopState.sleep;
    var cy = whoopState.cycle;

    if (scoreEl)
      scoreEl.textContent =
        L && L.recoveryScore != null ? formatInt(L.recoveryScore) : "—";

    if (dateEl)
      dateEl.textContent =
        L && L.date
          ? formatHeatmapDay(L.date + "T12:00:00.000Z")
          : "no scored recovery";

    if (meter) {
      var w = L && L.recoveryScore != null ? Math.min(100, Math.max(0, L.recoveryScore)) : 0;
      meter.style.width = w + "%";
    }

    if (hrvEl)
      hrvEl.textContent =
        L && L.hrvRmssd != null ? String(L.hrvRmssd) : "—";

    if (rhrEl)
      rhrEl.textContent =
        L && L.restingHeartRate != null ? formatInt(L.restingHeartRate) : "—";

    if (sleepEl) {
      if (sl && sl.performancePct != null) {
        sleepEl.textContent = formatInt(sl.performancePct);
      } else {
        sleepEl.textContent = "—";
      }
    }
    if (sleepSubEl) {
      sleepSubEl.textContent =
        sl && sl.estimatedHours != null ? sl.estimatedHours + " h sleep" : "%";
    }

    if (strainEl)
      strainEl.textContent =
        cy && cy.strain != null ? String(cy.strain) : "—";

    if (trend) {
      trend.innerHTML = "";
      var s = whoopState.series.slice();
      s.forEach(function (row) {
        var bar = document.createElement("div");
        bar.className = "whoop-trend-bar";
        var sc = typeof row.score === "number" ? row.score : 0;
        var h = Math.max(6, Math.round((Math.min(100, sc) / 100) * 52));
        bar.style.height = h + "px";
        bar.setAttribute("role", "img");
        bar.setAttribute("aria-label", "Recovery " + sc + " on " + row.date);
        bar.setAttribute(
          "title",
          formatHeatmapDay(row.date + "T12:00:00.000Z") + " · recovery " + sc
        );
        trend.appendChild(bar);
      });

      while (trend.children.length < 14) {
        var pad = document.createElement("span");
        pad.className = "whoop-trend-placeholder";
        pad.setAttribute("aria-hidden", "true");
        trend.appendChild(pad);
      }
    }
  }

  function fetchWhoop(range) {
    var url =
      window.location.origin +
      "/api/whoop?range=" +
      encodeURIComponent(range || getActiveRange()) +
      "&_=" +
      Date.now();
    fetch(url)
      .then(function (r) {
        return r.text().then(function (text) {
          var parsed = {};
          try {
            parsed = text ? JSON.parse(text) : {};
          } catch (e4) {
            parsed = {};
          }
          if (!r.ok || whoopHadErrorPayload(parsed)) {
            setWhoopNotice(
              true,
              "demo data · WHOOP unavailable (" +
                (parsed.message || parsed.error || r.status || "?") +
                ")."
            );
            setWhoopData(buildPlaceholderWhoop());
            renderWhoop();
            return;
          }
          if (!parsed.enabled) {
            setWhoopNotice(true, "demo data · " + (parsed.message || "Configure WHOOP_* env."));
            setWhoopData(buildPlaceholderWhoop());
            renderWhoop();
            return;
          }
          setWhoopNotice(false);
          setWhoopData(parsed);
          renderWhoop();
        });
      })
      .catch(function () {
        setWhoopNotice(true, "demo data · WHOOP network error.");
        setWhoopData(buildPlaceholderWhoop());
        renderWhoop();
      });
  }

  function whoopHadErrorPayload(j) {
    return j && j.error && !j.enabled;
  }

  // ---------------- placeholder ----------------

  function buildPlaceholderData() {
    var weeks = [];
    var labels = [];
    for (var w = 11; w >= 0; w--) {
      var d = new Date();
      d.setDate(d.getDate() - w * 7);
      var start = new Date(d);
      start.setDate(start.getDate() - start.getDay());
      var label = "W" + (start.getMonth() + 1) + "/" + start.getDate();
      labels.push(label);
      weeks.push({
        weekLabel: label,
        cyclingHours: 3 + Math.random() * 4,
        runningHours: 1.5 + Math.random() * 2.5,
        swimmingHours: 0.5 + Math.random() * 1.5,
        cyclingMiles: 60 + Math.random() * 80,
        runningMiles: 15 + Math.random() * 25,
        swimmingMiles: 1 + Math.random() * 3,
        cyclingSessions: Math.floor(2 + Math.random() * 3),
        runningSessions: Math.floor(1 + Math.random() * 2),
        swimmingSessions: Math.floor(0 + Math.random() * 2),
      });
    }
    var totals = {
      cyclingHours: 0, runningHours: 0, swimmingHours: 0, totalHours: 0,
      cyclingMiles: 0, runningMiles: 0, swimmingMiles: 0, totalMiles: 0,
      cyclingSessions: 0, runningSessions: 0, swimmingSessions: 0, totalSessions: 0,
      weeksCount: weeks.length,
    };
    weeks.forEach(function (row) {
      totals.cyclingHours += row.cyclingHours;
      totals.runningHours += row.runningHours;
      totals.swimmingHours += row.swimmingHours;
      totals.cyclingMiles += row.cyclingMiles;
      totals.runningMiles += row.runningMiles;
      totals.swimmingMiles += row.swimmingMiles;
      totals.cyclingSessions += row.cyclingSessions;
      totals.runningSessions += row.runningSessions;
      totals.swimmingSessions += row.swimmingSessions;
    });
    totals.totalHours = totals.cyclingHours + totals.runningHours + totals.swimmingHours;
    totals.totalMiles = totals.cyclingMiles + totals.runningMiles + totals.swimmingMiles;
    totals.totalSessions = totals.cyclingSessions + totals.runningSessions + totals.swimmingSessions;

    var cons = [];
    for (var i = 0; i < 365; i++) {
      var r = Math.random();
      if (r < 0.25) cons.push(0);
      else if (r < 0.6) cons.push(1);
      else if (r < 0.85) cons.push(2);
      else if (r < 0.95) cons.push(3);
      else cons.push(4);
    }
    var trainingDays = cons.filter(function (v) { return v > 0; }).length;
    var endIso = new Date().toISOString().slice(0, 10);
    var startIso = addDaysIso(endIso, -364);
    return {
      weeks: weeks,
      weekLabels: labels,
      totals: totals,
      consistencyData: cons,
      consistencyCols: 53,
      consistencyDays: 365,
      consistencyStart: startIso,
      consistencyEnd: endIso,
      trainingDays: trainingDays,
      restDays: 365 - trainingDays,
      longestStreak: 12,
      currentStreak: 3,
      highlights: {
        longestRide: { distanceMi: 58.2, hours: 3.4, date: "2026-04-12", name: "Long Sunday ride" },
        longestRun: { distanceMi: 16.1, hours: 2.2, date: "2026-03-22", name: "Half-marathon build" },
        longestSwim: { distanceMi: 1.5, hours: 0.9, date: "2026-02-18", name: "Pool set" },
        biggestWeek: { hours: 14.8, weekLabel: labels[labels.length - 2] },
        lastActivity: { date: new Date().toISOString(), sport: "cycling", distanceMi: 24.4, hours: 1.3, name: "Easy ride" },
      },
    };
  }

  function setData(data) {
    state.weeks = data.weeks || [];
    state.weekLabels = data.weekLabels || [];
    state.totals = data.totals || { cyclingHours: 0, runningHours: 0, swimmingHours: 0, totalHours: 0, totalMiles: 0, weeksCount: 0 };
    state.consistencyData = data.consistencyData || [];
    state.consistencyDays = data.consistencyDays || state.consistencyData.length;
    state.consistencyCols = data.consistencyCols != null ? data.consistencyCols : Math.ceil(state.consistencyDays / 7);
    state.trainingDays = data.trainingDays || 0;
    state.restDays = data.restDays != null ? data.restDays : Math.max(0, state.consistencyDays - state.trainingDays);
    state.longestStreak = data.longestStreak || 0;
    state.currentStreak = data.currentStreak || 0;
    state.highlights = data.highlights || null;
    state.consistencyStart = data.consistencyStart || "";
    state.consistencyEnd = data.consistencyEnd || "";
    if (!state.consistencyStart || !state.consistencyEnd) {
      var inferred = inferConsistencyRangeIso();
      if (!state.consistencyStart) state.consistencyStart = inferred.start;
      if (!state.consistencyEnd) state.consistencyEnd = inferred.end;
    }
  }

  // ---------------- renderers ----------------

  function renderHero() {
    var totals = state.totals || {};
    var map = {
      totalHours: totals.totalHours || 0,
      totalMiles: totals.totalMiles || 0,
      trainingDays: state.trainingDays,
      currentStreak: state.currentStreak,
    };
    var els = document.querySelectorAll("#training-hero-stats .training-hero-stat");
    els.forEach(function (el) {
      var stat = el.getAttribute("data-stat");
      var valueEl = el.querySelector(".training-hero-stat-value");
      if (!valueEl || !(stat in map)) return;
      var fmtName = valueEl.getAttribute("data-format") || "int";
      animateValue(valueEl, map[stat], formatterFor(fmtName));
    });
  }

  function renderSportCards() {
    var totals = state.totals || {};
    var weeks = Math.max(1, totals.weeksCount || state.weeks.length || 1);
    var sports = ["cycling", "running", "swimming"];
    sports.forEach(function (sport) {
      var card = document.querySelector('.sport-card[data-sport="' + sport + '"]');
      if (!card) return;
      var hours = totals[sport + "Hours"] || 0;
      var miles = totals[sport + "Miles"] || 0;
      var sessions = totals[sport + "Sessions"] || 0;
      var avg = hours / weeks;
      var primary = card.querySelector('[data-sport-field="hours"]');
      if (primary) primary.textContent = formatHours(hours);
      var milesEl = card.querySelector('[data-sport-field="miles"]');
      if (milesEl) milesEl.textContent = formatMiles(miles);
      var yardsEl = card.querySelector('[data-sport-field="yards"]');
      if (yardsEl) yardsEl.textContent = formatYards(miles);
      var sessEl = card.querySelector('[data-sport-field="sessions"]');
      if (sessEl) sessEl.textContent = formatInt(sessions);
      var avgEl = card.querySelector('[data-sport-field="avg"]');
      if (avgEl) avgEl.textContent = formatHours(avg);
    });
  }

  function renderConsistency() {
    var grid = document.getElementById("consistency-grid");
    var focusEl = document.getElementById("consistency-focus");
    var monthsEl = document.getElementById("consistency-months");
    var chart = document.getElementById("consistency-chart");

    function setFocus(html) {
      if (focusEl) focusEl.innerHTML = html;
    }

    if (grid) {
      var n = state.consistencyDays;
      var startIso = state.consistencyStart || inferConsistencyRangeIso().start;
      var todayIso = utcTodayIso();
      var cellPx = typeof window !== "undefined" && window.innerWidth < 641 ? 6 : 12;
      var gapPx = cellPx <= 6 ? 2 : 3;

      if (chart) {
        chart.style.setProperty("--consistency-cell", cellPx + "px");
        chart.style.setProperty("--consistency-gap", gapPx + "px");
      }

      var startDow = utcWeekdaySun0(startIso);
      var gridSunday = addDaysIso(startIso, -startDow);
      var totalSlots = startDow + n;
      var cols = Math.ceil(totalSlots / 7);

      grid.style.gridTemplateColumns = "repeat(" + cols + ", " + cellPx + "px)";
      grid.innerHTML = "";

      if (monthsEl) {
        monthsEl.style.gridTemplateColumns = "repeat(" + cols + ", " + cellPx + "px)";
        monthsEl.innerHTML = "";
        var lastM = -1;
        for (var mc = 0; mc < cols; mc++) {
          var weekSunIso = addDaysIso(gridSunday, mc * 7);
          var mT = Date.parse(weekSunIso + "T12:00:00.000Z");
          var monthIdx = new Date(mT).getUTCMonth();
          var lab = document.createElement("span");
          lab.className = "consistency-month-label";
          if (monthIdx !== lastM) {
            lab.textContent = new Date(mT).toLocaleDateString("en-US", {
              month: "short",
              timeZone: "UTC",
            });
            lastM = monthIdx;
          }
          monthsEl.appendChild(lab);
        }
      }

      grid.setAttribute(
        "aria-label",
        "Training time by day, " + formatHeatmapDay(startIso) + " through " + formatHeatmapDay(state.consistencyEnd || utcTodayIso())
      );

      for (var c = 0; c < cols; c++) {
        for (var r = 0; r < 7; r++) {
          var slot = c * 7 + r;
          var dateIso = addDaysIso(gridSunday, slot);
          var dataIdx = slot - startDow;
          var inRange = dataIdx >= 0 && dataIdx < n;
          var level = inRange ? state.consistencyData[dataIdx] : 0;

          var cell = document.createElement("div");
          cell.className = "consistency-cell consistency-cell--level-" + (level || 0);
          if (!inRange) cell.className += " consistency-cell--outside";

          if (inRange && dateIso === todayIso) cell.className += " consistency-cell--today";

          var labelText = inRange
            ? consistencyLevelLabel(level || 0)
            : "Outside chart range";

          cell.setAttribute("data-date", dateIso);
          cell.setAttribute(
            "title",
            formatHeatmapDay(dateIso) + " · " + (inRange ? labelText : "outside chart range")
          );

          (function (iso, inR, trainLbl) {
            function show() {
              if (!inR) {
                setFocus(
                  "<strong>" +
                    formatHeatmapDay(iso) +
                    "</strong> · week padding (not part of the training window)"
                );
                return;
              }
              var line =
                "<strong>" +
                formatHeatmapDay(iso) +
                "</strong> · " +
                trainLbl +
                (iso === utcTodayIso() ? " · today" : "");
              setFocus(line);
            }
            cell.addEventListener("mouseenter", show);
            cell.addEventListener("click", show);
          })(dateIso, inRange, labelText);

          grid.appendChild(cell);
        }
      }

      if (chart && focusEl && !grid.dataset.behaviorWired) {
        grid.dataset.behaviorWired = "1";
        chart.addEventListener("mouseleave", function () {
          setFocus(defaultConsistencyHint);
        });
      }
    }

    if (focusEl && !focusEl.dataset.seeded) {
      focusEl.dataset.seeded = "1";
      setFocus(defaultConsistencyHint);
    }

    var cur = document.getElementById("cons-current");
    if (cur) cur.textContent = formatDays(state.currentStreak);
    var lng = document.getElementById("cons-longest");
    if (lng) lng.textContent = formatDays(state.longestStreak);
    var tr = document.getElementById("cons-training");
    if (tr) tr.textContent = formatInt(state.trainingDays);
    var rs = document.getElementById("cons-rest");
    if (rs) rs.textContent = formatInt(state.restDays);
  }

  function renderHighlights() {
    var container = document.getElementById("highlights-grid");
    if (!container) return;
    var h = state.highlights || {};
    var cards = [];

    if (h.biggestWeek) {
      cards.push({
        eyebrow: "biggest week",
        primary: formatHours(h.biggestWeek.hours),
        meta: h.biggestWeek.weekLabel || "",
        accent: "mixed",
      });
    }
    if (h.longestRide) {
      cards.push({
        eyebrow: "longest ride",
        primary: (h.longestRide.distanceMi).toFixed(1) + " mi",
        meta: formatDate(h.longestRide.date) + (h.longestRide.name ? " · " + h.longestRide.name : ""),
        accent: "cycling",
      });
    }
    if (h.longestRun) {
      cards.push({
        eyebrow: "longest run",
        primary: (h.longestRun.distanceMi).toFixed(1) + " mi",
        meta: formatDate(h.longestRun.date) + (h.longestRun.name ? " · " + h.longestRun.name : ""),
        accent: "running",
      });
    }
    if (h.longestSwim) {
      cards.push({
        eyebrow: "longest swim",
        primary: formatInt(h.longestSwim.distanceMi * 1760) + " yd",
        meta: formatDate(h.longestSwim.date) + (h.longestSwim.name ? " · " + h.longestSwim.name : ""),
        accent: "swimming",
      });
    }
    if (h.lastActivity) {
      cards.push({
        eyebrow: "last activity",
        primary: (h.lastActivity.distanceMi).toFixed(1) + " mi",
        meta: formatDate(h.lastActivity.date) + " · " + h.lastActivity.sport,
        accent: h.lastActivity.sport || "mixed",
      });
    }

    container.innerHTML = cards
      .map(function (c) {
        return (
          '<article class="highlight-card highlight-card--' + c.accent + '">' +
          '<p class="highlight-card-eyebrow font-dot">' + c.eyebrow + "</p>" +
          '<p class="highlight-card-primary">' + c.primary + "</p>" +
          '<p class="highlight-card-meta">' + (c.meta || "") + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function destroyCharts() {
    chartInstances.forEach(function (ch) { if (ch) ch.destroy(); });
    chartInstances = [];
  }

  function renderMainChart() {
    var canvas = document.getElementById("chart-training-trends");
    if (!canvas || typeof Chart === "undefined") return;

    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    var gridColor = isDark ? "rgba(180, 200, 230, 0.06)" : "rgba(20, 40, 80, 0.06)";
    var textColor = isDark ? "rgba(220, 230, 245, 0.55)" : "rgba(30, 40, 60, 0.55)";
    var isMobile = window.innerWidth < 641;

    var avgH = state.totals.totalHours / Math.max(1, state.totals.weeksCount || state.weeks.length || 1);
    var summary = document.getElementById("training-trends-summary");
    if (summary) {
      summary.textContent =
        "avg " + formatHours(avgH) + " / week · " + formatHours(state.totals.totalHours || 0) + " total";
    }

    function dataset(label, key, color) {
      return {
        label: label,
        data: state.weeks.map(function (w) { return w[key]; }),
        backgroundColor: color.fill,
        borderColor: color.edge,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.35,
        stack: "load",
      };
    }

    chartInstances.push(
      new Chart(canvas, {
        type: "line",
        data: {
          labels: state.weekLabels,
          datasets: [
            dataset("Cycling", "cyclingHours", SPORT.cycling),
            dataset("Running", "runningHours", SPORT.running),
            dataset("Swimming", "swimmingHours", SPORT.swimming),
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                color: textColor,
                font: { size: isMobile ? 10 : 11 },
                padding: isMobile ? 8 : 14,
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true,
                pointStyle: "circle",
              },
            },
            tooltip: {
              backgroundColor: isDark ? "rgba(10, 16, 28, 0.95)" : "rgba(255,255,255,0.96)",
              titleColor: isDark ? "#eef2f7" : "#111",
              bodyColor: isDark ? "#c9d4e2" : "#333",
              borderColor: isDark ? "rgba(160,190,220,0.18)" : "rgba(0,0,0,0.08)",
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: function (ctx) {
                  return ctx.dataset.label + ": " + formatHours(ctx.parsed.y);
                },
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              grid: { color: gridColor, drawBorder: false },
              ticks: {
                color: textColor,
                maxTicksLimit: isMobile ? 6 : 12,
                font: { size: isMobile ? 9 : 10 },
              },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: { color: gridColor, drawBorder: false },
              ticks: {
                color: textColor,
                font: { size: isMobile ? 9 : 10 },
                callback: function (v) { return v + "h"; },
              },
            },
          },
        },
      })
    );
  }

  // ---------------- boot ----------------

  function renderAll() {
    renderHero();
    renderSportCards();
    renderConsistency();
    renderHighlights();
    destroyCharts();
    renderMainChart();
  }

  function getActiveRange() {
    var btn = document.querySelector(".training-filter.active");
    return (btn && btn.getAttribute("data-range")) || "all";
  }

  function setTrainingApiNotice(visible, message) {
    var el =
      typeof document !== "undefined" &&
      document.getElementById &&
      document.getElementById("training-api-notice");
    if (!el) return;
    if (!visible) {
      el.setAttribute("hidden", "");
      el.textContent = "";
      return;
    }
    var t = message || "";
    if (t.length > 280) t = t.slice(0, 277) + "…";
    el.removeAttribute("hidden");
    el.textContent =
      "demo data · " +
      (t ? t : "/api/training unreachable — configure Strava env or redeploy.");
  }

  function fetchAndRender(range) {
    var r = range || getActiveRange();
    fetchWhoop(r);

    var url =
      window.location.origin +
      "/api/training" +
      (r ? "?range=" + encodeURIComponent(r) : "");
    fetch(url)
      .then(function (resp) {
        return resp.text().then(function (text) {
          if (!resp.ok) {
            var detail = "";
            try {
              var j = JSON.parse(text);
              if (j && typeof j.error === "string") detail = j.error.trim();
            } catch (e) {
              detail = "";
            }
            setTrainingApiNotice(
              true,
              detail || "Could not load Strava (“" + resp.status + "”)."
            );
            setData(buildPlaceholderData());
            renderAll();
            return;
          }
          try {
            setData(JSON.parse(text));
            setTrainingApiNotice(false);
            renderAll();
          } catch (e2) {
            setTrainingApiNotice(true, "Invalid JSON from training API.");
            setData(buildPlaceholderData());
            renderAll();
          }
        });
      })
      .catch(function () {
        setTrainingApiNotice(true, "Network error while loading /api/training.");
        setData(buildPlaceholderData());
        renderAll();
      });
  }

  function wireFilters() {
    var buttons = document.querySelectorAll(".training-filter");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        fetchAndRender(btn.getAttribute("data-range"));
      });
    });
  }

  function boot() {
    wireFilters();
    fetchAndRender(getActiveRange());
  }

  function bootWhenReady() {
    if (typeof Chart !== "undefined") {
      boot();
      return;
    }
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    s.onload = boot;
    s.onerror = function () {
      setTrainingApiNotice(true, "Chart library failed to load.");
      setData(buildPlaceholderData());
      renderAll();
      fetchWhoop(getActiveRange());
    };
    document.head.appendChild(s);
  }

  window.addEventListener("themechange", function () {
    destroyCharts();
    renderMainChart();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootWhenReady);
  } else {
    bootWhenReady();
  }
})();
