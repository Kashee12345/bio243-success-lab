/* BIO 243 Success Lab: shared page behaviour (quick checks, checklists, notes, progress, book contents). */
(function () {
  "use strict";
  var S = window.S243;
  var L = "ABCDEFGH";

  /* quick checks: <div class="qc" data-c="n"><p class="q"/><ol class="opts"><li/>...</ol><p class="why"/></div> */
  [].forEach.call(document.querySelectorAll(".qc"), function (qc) {
    var c = +qc.getAttribute("data-c"), why = qc.querySelector(".why"), ol = qc.querySelector("ol.opts");
    if (!ol || !why) return;
    var lis = [].slice.call(ol.children);
    lis.forEach(function (li, k) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "opt";
      b.innerHTML = "<b>" + L[k] + "</b><span>" + li.innerHTML + "</span>";
      li.innerHTML = ""; li.appendChild(b);
      b.addEventListener("click", function () {
        var btns = ol.querySelectorAll(".opt");
        [].forEach.call(btns, function (x, j) {
          x.disabled = true;
          if (j === c) x.classList.add("right");
          else if (j === k) x.classList.add("wrong");
          else x.classList.add("dim");
        });
        var good = k === c;
        if (!why.querySelector("strong")) why.insertAdjacentHTML("afterbegin", "<strong></strong>");
        why.querySelector("strong").textContent = good ? "Right" : "Not quite. The answer is " + L[c];
        why.classList.add("on"); why.classList.toggle("bad", !good);
        var again = qc.querySelector(".again");
        if (!again) {
          again = document.createElement("button"); again.type = "button"; again.className = "again";
          again.textContent = "Try again";
          again.style.cssText = "margin-top:10px;background:none;border:0;color:var(--maroon);font-weight:700;cursor:pointer;padding:4px 0";
          qc.appendChild(again);
          again.addEventListener("click", function () {
            [].forEach.call(ol.querySelectorAll(".opt"), function (x) { x.disabled = false; x.className = "opt"; });
            why.classList.remove("on"); again.remove();
          });
        }
      });
    });
  });

  /* checklists with progress */
  [].forEach.call(document.querySelectorAll("[data-checklist]"), function (box) {
    var key = "chk_" + box.getAttribute("data-checklist"), st = S.get(key, {});
    var inputs = box.querySelectorAll("input[type=checkbox]"), bar = box.querySelector(".prog i"), txt = box.querySelector(".progtxt");
    function upd() {
      var n = 0; [].forEach.call(inputs, function (i) { if (i.checked) n++; });
      if (bar) bar.style.width = (inputs.length ? 100 * n / inputs.length : 0) + "%";
      if (txt) txt.textContent = n + " of " + inputs.length + " done" + (n === inputs.length && n ? ". Nice work." : "");
    }
    [].forEach.call(inputs, function (i, k) {
      i.checked = !!st[k];
      i.addEventListener("change", function () { st[k] = i.checked; S.set(key, st); upd(); });
    });
    upd();
  });

  /* saved notes */
  [].forEach.call(document.querySelectorAll("textarea[data-note]"), function (ta) {
    var key = "note_" + ta.getAttribute("data-note"), out = ta.parentNode.querySelector(".saved"), t;
    ta.value = S.get(key, "");
    ta.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { S.set(key, ta.value); if (out) out.textContent = "Saved on this device."; }, 400);
    });
  });

  /* week done */
  [].forEach.call(document.querySelectorAll("[data-done]"), function (b) {
    var n = b.getAttribute("data-done"), done = S.get("done", {});
    function paint() { b.textContent = done[n] ? "Week " + n + " done. Tap to undo." : "Mark week " + n + " done"; b.classList.toggle("ghost", !!done[n]); }
    b.addEventListener("click", function () { done = S.get("done", {}); done[n] = !done[n]; S.set("done", done); paint(); });
    paint();
  });
  [].forEach.call(document.querySelectorAll("[data-wk]"), function (a) {
    if (S.get("done", {})[a.getAttribute("data-wk")]) a.classList.add("isdone");
  });

  /* book contents highlight */
  var toc = document.querySelector(".toc");
  if (toc && "IntersectionObserver" in window) {
    var links = {}; [].forEach.call(toc.querySelectorAll("a[href^='#']"), function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && links[e.target.id]) {
          [].forEach.call(toc.querySelectorAll("a.on"), function (x) { x.classList.remove("on"); });
          links[e.target.id].classList.add("on");
        }
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    Object.keys(links).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
    var det = toc.querySelector("details");
    if (det && window.matchMedia("(min-width:1000px)").matches) det.open = true;
  }
})();
