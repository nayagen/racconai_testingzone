// RaccoonAI page script: AI-dispatcher stage: the live 2GIS map under the route (index.html).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }
  var isDark = R.isDark, twoGisTiles = R.twoGisTiles, root = R.root;

  /* ---------- AI-dispatcher stage: the live 2GIS map under the route ----------
     The stage overlay is drawn in a 1020 x 500 crop (x 550, y 280) of the Platform backdrop images/platform/map-almaty.webp,
     whose pixels GEO ties to Web Mercator (the same fit as the Platform's live map). A hidden Leaflet map is set so that crop
     lands where the overlay's preserveAspectRatio "xMinYMid slice" puts it, its 2GIS tiles (the Platform's layer, night
     recolour included) load, and the whole view is then flattened into one canvas and the map discarded: the stage map never
     pans, so it costs one bitmap instead of a Leaflet map with a layer per tile. It is rebuilt only when the stage's size or
     the theme changes. It starts when the stage comes near; if the tiles fail, the static crop simply stays. */
  var stageMap = document.querySelector(".stage-map");
  if (stageMap && window.L && L.GridLayer) {
    (function () {
      var GEO = { a: 3497284.9656436485, bx: -2495094.399519851, by: -1281326.2418159847 };
      var Z0 = Math.log(GEO.a / 256) / Math.LN2;
      var CROP = { x: 550, y: 280, w: 1020, h: 500 };
      var flat = document.createElement("canvas");
      flat.className = "stage-map-flat";
      flat.setAttribute("aria-hidden", "true");
      stageMap.insertBefore(flat, stageMap.querySelector(".map-credit"));
      var building = null, built = "";

      var build = function () {
        var w = stageMap.clientWidth, h = stageMap.clientHeight;
        var key = w + "x" + h + (isDark() ? "d" : "l");
        if (!w || !h || key === built) { return; }
        if (building) { building.cancel(); }
        var live = document.createElement("div");
        live.className = "stage-map-live";
        stageMap.insertBefore(live, flat);
        var map = L.map(live, {
          zoomSnap: 0, attributionControl: false, zoomControl: false, dragging: false, touchZoom: false, doubleClickZoom: false,
          scrollWheelZoom: false, boxZoom: false, keyboard: false, inertia: false, zoomAnimation: false, fadeAnimation: false
        });
        var k = Math.max(w / CROP.w, h / CROP.h);
        var c = map.unproject(L.point(CROP.x + w / 2 / k - GEO.bx, CROP.y + CROP.h / 2 - GEO.by), Z0);
        map.setView(c, Z0 + Math.log(k) / Math.LN2, { animate: false });
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        var tiles = new (twoGisTiles().Tiles)({ maxZoom: 18, keepBuffer: 0, hd: dpr > 1 }).addTo(map);
        var job = {
          cancel: function () {
            if (job.done) { return; }
            job.done = true; clearTimeout(job.timer); map.remove(); live.remove();
            if (building === job) { building = null; }
          }
        };
        building = job;
        job.timer = setTimeout(job.cancel, 15000); // offline or blocked: keep what is shown (the static crop, or the last view)
        tiles.on("load", function () {
          var box = live.getBoundingClientRect(), ok = 0;
          var cv = document.createElement("canvas");
          cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
          var ctx = cv.getContext("2d");
          ctx.scale(dpr, dpr);
          Object.keys(tiles._tiles).forEach(function (t) {
            var el = tiles._tiles[t].el;
            if (!el._src) { return; }
            var r = el.getBoundingClientRect();
            ctx.drawImage(el, r.left - box.left, r.top - box.top, r.width, r.height);
            ok++;
          });
          setTimeout(job.cancel, 0); // Leaflet still touches the map after its "load" handlers return
          if (!ok) { return; }
          flat.width = cv.width; flat.height = cv.height;
          flat.getContext("2d").drawImage(cv, 0, 0);
          built = key;
          stageMap.classList.add("is-live");
        });
      };

      var start = function () {
        build();
        var rt = null;
        var later = function () { clearTimeout(rt); rt = setTimeout(build, 250); };
        if ("ResizeObserver" in window) { new ResizeObserver(later).observe(stageMap); } else { window.addEventListener("resize", later); }
        new MutationObserver(build).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
      };
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { io.disconnect(); start(); }
        }, { rootMargin: "600px 0px" });
        io.observe(stageMap);
      } else { start(); }
    })();
  }
})(window.Raccoon);
