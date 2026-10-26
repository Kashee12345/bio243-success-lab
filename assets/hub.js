/* Course hub home page behavior: preview clips, rails, course search. Built by hubtools/build_hubs.py. */
(function () {
  "use strict";
  var doc = document;

  /* ---------- preview clips: play only while in view; posters only for reduced motion or slow / Save-Data ---------- */
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var slow = !!(conn && (conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType || "")));
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var vids = [].slice.call(doc.querySelectorAll("video[data-src]"));
  function load(v) {
    if (v.dataset.loaded) return;
    v.dataset.loaded = "1";
    /* WebM (smaller) where the browser plays VP9, otherwise the H.264 MP4 */
    var wm = v.dataset.webm && v.canPlayType && v.canPlayType('video/webm; codecs="vp9"');
    v.src = wm ? v.dataset.webm : v.dataset.src;
    v.addEventListener("playing", function () { v.classList.add("on"); });
  }
  function play(v) {
    load(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  if (!slow && !still && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && e.intersectionRatio > 0.35) play(v);
        else if (!v.paused) v.pause();
      });
    }, { threshold: [0, 0.35, 0.7] });
    vids.forEach(function (v) { io.observe(v); });
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) vids.forEach(function (v) { if (!v.paused) v.pause(); });
    });
  }

  /* ---------- rails: previous / next buttons ---------- */
  [].forEach.call(doc.querySelectorAll("[data-rail]"), function (box) {
    var rail = doc.getElementById(box.getAttribute("data-rail"));
    if (!rail) return;
    [].forEach.call(box.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () {
        var card = rail.querySelector("li");
        var step = card ? card.getBoundingClientRect().width + 16 : 280;
        rail.scrollBy({ left: (b.getAttribute("data-dir") === "prev" ? -1 : 1) * step * 2, behavior: still ? "auto" : "smooth" });
      });
    });
  });

  /* ---------- course-only search over this hub's own pages, tools and topics ---------- */
  var IDX = window.HUB_INDEX || [];
  var input = doc.getElementById("hq"), box = doc.getElementById("hres"), form = doc.getElementById("hform");
  if (input && box) {
    var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " "); };
    IDX.forEach(function (r) { r._t = norm(r.t + " " + (r.a || "")); r._h = norm([r.t, r.a, r.s, r.k].join(" ")); });
    var sel = -1, shown = [];
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var run = function () {
      var q = norm(input.value).trim();
      if (q.length < 2) { box.classList.remove("on"); input.setAttribute("aria-expanded", "false"); shown = []; return; }
      var words = q.split(/\s+/);
      var scored = [];
      IDX.forEach(function (r) {
        var sc = 0;
        for (var i = 0; i < words.length; i++) {
          var w = words[i];
          if (r._h.indexOf(w) < 0) return;
          sc += r._t.indexOf(w) === 0 ? 6 : (r._t.indexOf(" " + w) >= 0 ? 4 : (r._t.indexOf(w) >= 0 ? 3 : 1));
        }
        sc += (r.w || 0);
        scored.push([sc, r]);
      });
      scored.sort(function (a, b) { return b[0] - a[0]; });
      shown = scored.slice(0, 12).map(function (x) { return x[1]; });
      sel = -1;
      if (!shown.length) {
        box.innerHTML = '<div class="none">Nothing in this course matches “' + esc(input.value) + '”. Try a body system or a disease name.</div>';
      } else {
        box.innerHTML = shown.map(function (r, i) {
          return '<a role="option" id="hr' + i + '" href="' + esc(r.u) + '"' + (r.x ? ' target="_blank" rel="noopener"' : "") + '><span class="rk">' + esc(r.c) + '</span><span><span class="rtt">' + esc(r.t) + '</span>' + (r.s ? '<span class="rss">' + esc(r.s) + "</span>" : "") + "</span></a>";
        }).join("");
      }
      box.classList.add("on");
      input.setAttribute("aria-expanded", "true");
    };
    var mark = function () {
      [].forEach.call(box.querySelectorAll("a"), function (a, i) { a.setAttribute("aria-selected", i === sel ? "true" : "false"); });
      if (sel >= 0) { input.setAttribute("aria-activedescendant", "hr" + sel); var a = doc.getElementById("hr" + sel); if (a) a.scrollIntoView({ block: "nearest" }); }
      else input.removeAttribute("aria-activedescendant");
    };
    input.addEventListener("input", run);
    input.addEventListener("focus", function () { if (input.value.trim().length > 1) run(); });
    input.addEventListener("keydown", function (e) {
      if (!shown.length) return;
      if (e.key === "ArrowDown") { sel = Math.min(sel + 1, shown.length - 1); mark(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(sel - 1, -1); mark(); e.preventDefault(); }
      else if (e.key === "Escape") { box.classList.remove("on"); input.setAttribute("aria-expanded", "false"); }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      run();
      var r = shown[sel >= 0 ? sel : 0];
      if (r) { if (r.x) window.open(r.u, "_blank", "noopener"); else location.href = r.u; }
    });
    doc.addEventListener("click", function (e) { if (!e.target.closest || !e.target.closest(".hsearch")) { box.classList.remove("on"); input.setAttribute("aria-expanded", "false"); } });
    [].forEach.call(doc.querySelectorAll("[data-q]"), function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); input.value = a.getAttribute("data-q"); input.focus(); run(); });
    });
  }
})();
