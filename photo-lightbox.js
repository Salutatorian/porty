(function () {
  var photos = [];

  function removeAllOverlays() {
    document.querySelectorAll(".photo-lightbox-overlay").forEach(function (el) {
      el.remove();
    });
    document.body.classList.remove("photo-lightbox-open");
  }

  function closeLightbox() {
    removeAllOverlays();
    if (typeof history !== "undefined" && history.replaceState) {
      var u = window.location.href.split("#")[0];
      if (window.location.hash) history.replaceState(null, "", u);
    }
  }

  function openLightbox(photo) {
    if (!photo || !photo.src) return;
    closeLightbox();
    var overlay = document.createElement("div");
    overlay.className = "photo-lightbox-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Photo viewer");
    overlay.tabIndex = -1;
    var caption = [photo.title, photo.meta, photo.caption].filter(Boolean).join(" · ");
    overlay.innerHTML =
      '<div class="photo-lightbox-backdrop" aria-hidden="true"></div>' +
      '<div class="photo-lightbox-content">' +
      '  <button type="button" class="photo-lightbox-close" aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
      '  <img src="' + (photo.src || "").replace(/"/g, "&quot;") + '" alt="' + (photo.alt || photo.title || "").replace(/"/g, "&quot;") + '" class="photo-lightbox-img" />' +
      (caption ? '<div class="photo-lightbox-caption">' + caption.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div>' : '') +
      '</div>';
    document.body.appendChild(overlay);
    document.body.classList.add("photo-lightbox-open");

    overlay.addEventListener("click", function (e) {
      if (e.target.closest(".photo-lightbox-close")) {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (!e.target.closest(".photo-lightbox-content")) {
        closeLightbox();
      }
    });
    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      }
    });
    requestAnimationFrame(function () {
      try {
        overlay.focus({ preventScroll: true });
      } catch (x) {}
    });
  }

  window.openPhotoLightbox = function (idOrIndex) {
    var p = null;
    if (typeof idOrIndex === "string") {
      p = photos.find(function (x) {
        return String(x.id) === String(idOrIndex);
      });
    } else if (typeof idOrIndex === "number" && photos[idOrIndex]) {
      p = photos[idOrIndex];
    }
    if (p) openLightbox(p);
  };

  function bindGrid() {
    var grid = document.getElementById("photos-grid");
    if (!grid || grid.dataset.photoLightboxBound) return;
    grid.dataset.photoLightboxBound = "1";
    grid.addEventListener("click", function (e) {
      var polaroid = e.target.closest(".polaroid");
      if (!polaroid) return;
      e.preventDefault();
      var img = polaroid.querySelector("img");
      var id = polaroid.getAttribute("data-photo-id");
      var src = img ? img.getAttribute("src") : "";
      var titleEl = polaroid.querySelector(".polaroid-title");
      var metaEl = polaroid.querySelector(".polaroid-meta");
      var capEl = polaroid.querySelector(".polaroid-caption");
      var title = titleEl ? titleEl.textContent : "";
      var meta = metaEl ? metaEl.textContent : "";
      var caption = capEl ? capEl.textContent : "";
      openLightbox({
        id: id,
        src: src,
        title: title,
        meta: meta,
        caption: caption,
        alt: img ? img.getAttribute("alt") : "",
      });
    });
  }

  function initLightbox() {
    bindGrid();
    fetch("/api/photos")
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .catch(function () {
        return [];
      })
      .then(function (list) {
        photos = list || [];
        var hash = (window.location.hash || "").replace(/^#/, "");
        var match = hash.match(/^photo[=:-]?(.+)$/i);
        if (match) {
          var id = decodeURIComponent(match[1]);
          setTimeout(function () {
            openPhotoLightbox(id);
          }, 200);
        }
      });
  }

  if (!window.__photoLightboxReady) {
    window.__photoLightboxReady = true;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initLightbox);
    } else {
      initLightbox();
    }
    window.addEventListener("pagechange", initLightbox);
  } else {
    initLightbox();
  }
})();
