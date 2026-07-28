/* LucFlori — pagina principală.
   Construiește „peretele de culori" din datele sortimentului și animă
   graficul de suprafață. Fără dependințe externe. */
(function () {
  "use strict";

  var data = window.LUCFLORI;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  if (!data || !Array.isArray(data.varieties)) return;

  /* --- peretele: toate capetele florale, ordonate după nuanță ---------- */
  var wall = document.getElementById("wall");
  if (wall) {
    var byHue = data.varieties.slice().sort(function (a, b) {
      // roșu la roșu: nuanțele de peste 300° stau lângă cele mici
      var ha = a.h >= 300 ? a.h - 360 : a.h;
      var hb = b.h >= 300 ? b.h - 360 : b.h;
      return ha - hb;
    });

    var frag = document.createDocumentFragment();
    byHue.forEach(function (v, i) {
      var a = document.createElement("a");
      a.className = "wall__cell";
      a.href = "catalog.html?v=" + encodeURIComponent(v.s);
      a.style.setProperty("--cell", v.x);
      a.style.setProperty("--d", reduce ? "0ms" : (i * 11) + "ms");
      a.setAttribute("data-name", v.n);
      a.setAttribute("data-cat", catLabel(v.c));

      var img = document.createElement("img");
      img.src = "assets/img/varieties/" + v.s + ".webp";
      img.width = 260;
      img.height = 260;
      img.loading = i < 24 ? "eager" : "lazy";
      img.decoding = "async";
      img.alt = "";
      a.appendChild(img);

      var sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = v.n + ", " + catLabel(v.c);
      a.appendChild(sr);

      frag.appendChild(a);
    });
    wall.appendChild(frag);

    /* eticheta care urmărește capul floral aflat sub cursor */
    var tag = document.createElement("span");
    tag.className = "wall__tag";
    tag.setAttribute("translate", "no");
    tag.setAttribute("aria-hidden", "true");
    wall.parentNode.appendChild(tag);

    var showTag = function (cell) {
      var r = cell.getBoundingClientRect();
      var host = wall.parentNode.getBoundingClientRect();
      var b = document.createElement("b");
      b.textContent = cell.getAttribute("data-cat");
      tag.replaceChildren(document.createTextNode(cell.getAttribute("data-name") + " "), b);
      tag.style.left = (r.left - host.left + r.width / 2) + "px";
      tag.style.top = (r.top - host.top) + "px";
      tag.setAttribute("data-on", "");
    };
    var hideTag = function () { tag.removeAttribute("data-on"); };

    wall.addEventListener("mouseover", function (e) {
      var cell = e.target.closest(".wall__cell");
      if (cell) showTag(cell);
    });
    wall.addEventListener("focusin", function (e) {
      var cell = e.target.closest(".wall__cell");
      if (cell) showTag(cell);
    });
    wall.addEventListener("mouseleave", hideTag);
    wall.addEventListener("focusout", hideTag);

    /* bara de nuanțe = gradient din culorile reale ale sortimentului */
    var rail = document.getElementById("hueRail");
    if (rail) {
      var stops = byHue.filter(function (_, i) { return i % 3 === 0; })
                       .map(function (v) { return v.x; });
      rail.style.setProperty("--hue-rail", "linear-gradient(90deg," + stops.join(",") + ")");
    }
  }

  /* --- graficul de suprafață: pornește când intră în ecran ------------- */
  var growth = document.getElementById("growth");
  if (growth) {
    var rows = growth.querySelectorAll(".growth__row");
    if (reduce || !("IntersectionObserver" in window)) {
      rows.forEach(function (r) { r.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          Array.prototype.forEach.call(rows, function (r, i) {
            setTimeout(function () { r.classList.add("is-in"); }, i * 130);
          });
          io.disconnect();
        });
      }, { threshold: 0.35 });
      io.observe(growth);
    }
  }

  function catLabel(key) {
    var c = (data.cats || []).filter(function (x) { return x.k === key; })[0];
    return c ? c.label : key;
  }
})();
