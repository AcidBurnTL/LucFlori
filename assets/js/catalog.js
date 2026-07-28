/* LucFlori — catalogul de sortiment.
   Filtrare pe tip / culoare / text, starea ținută în adresa paginii (se poate
   trimite ca link), fișă pe cultivar și listă de cerere salvată local.
   Fără dependințe externe, fără pas de build. */
(function () {
  "use strict";

  var D = window.LUCFLORI;
  if (!D) return;

  var STORE = "lucflori:lista";
  var VS = D.varieties;
  var CATS = D.cats;
  var FAMS = D.families;

  var state = { tip: "", culoare: "", q: "", nou: false };
  var picked = load();
  var shown = VS.slice();

  var el = {
    types: document.getElementById("fTypes"),
    colors: document.getElementById("fColors"),
    search: document.getElementById("fSearch"),
    onlyNew: document.getElementById("fNew"),
    onlyNewN: document.getElementById("fNewN"),
    grid: document.getElementById("grid"),
    empty: document.getElementById("empty"),
    count: document.getElementById("mCount"),
    active: document.getElementById("mActive"),
    reset: document.getElementById("mReset"),
    emptyReset: document.getElementById("emptyReset"),
    sheet: document.getElementById("sheet"),
    tray: document.getElementById("tray"),
    trayN: document.getElementById("trayN"),
    trayNames: document.getElementById("trayNames"),
    trayClear: document.getElementById("trayClear"),
    trayMail: document.getElementById("trayMail"),
    year: document.getElementById("year")
  };

  if (el.year) el.year.textContent = String(new Date().getFullYear());

  /* ---------- helpers ---------- */
  function cat(k) { return CATS.filter(function (c) { return c.k === k; })[0] || { label: k, note: "" }; }
  function fam(k) { return FAMS.filter(function (f) { return f.k === k; })[0] || { label: k }; }
  function norm(s) {
    return s.toLowerCase()
      .replace(/ă|â/g, "a").replace(/î/g, "i").replace(/ș|ş/g, "s").replace(/ț|ţ/g, "t");
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(function (s) {
        return VS.some(function (v) { return v.s === s; });
      }) : [];
    } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(picked)); }
    catch (e) { /* memoria locală poate fi blocată — lista rămâne doar în pagină */ }
  }

  /* ---------- filtre ---------- */
  function buildFilters() {
    var byCat = {}, byFam = {};
    VS.forEach(function (v) {
      byCat[v.c] = (byCat[v.c] || 0) + 1;
      byFam[v.f] = (byFam[v.f] || 0) + 1;
    });

    el.types.appendChild(chip("", "Toate", VS.length, "tip"));
    CATS.forEach(function (c) {
      if (byCat[c.k]) el.types.appendChild(chip(c.k, c.label, byCat[c.k], "tip"));
    });

    el.colors.appendChild(chip("", "Toate", VS.length, "culoare"));
    FAMS.forEach(function (f) {
      if (!byFam[f.k]) return;
      var repr = VS.filter(function (v) { return v.f === f.k; })
                   .sort(function (a, b) { return b.h - a.h; })[0];
      el.colors.appendChild(chip(f.k, f.label, byFam[f.k], "culoare", repr ? repr.x : null));
    });
  }

  /* Numărul de pe fiecare buton arată câte rezultate ar da acel buton
     ținând cont de celelalte filtre active — altfel cifrele mint. */
  function facet(group, value) {
    var q = norm(state.q.trim());
    return VS.filter(function (v) {
      var tip = group === "tip" ? value : state.tip;
      var cul = group === "culoare" ? value : state.culoare;
      var nou = group === "nou" ? true : state.nou;
      if (tip && v.c !== tip) return false;
      if (cul && v.f !== cul) return false;
      if (nou && !v.new) return false;
      if (q && norm(v.n).indexOf(q) === -1) return false;
      return true;
    }).length;
  }

  function syncCounts() {
    var all = document.querySelectorAll(".chip[data-group]");
    Array.prototype.forEach.call(all, function (b) {
      var n = facet(b.getAttribute("data-group"), b.getAttribute("data-value"));
      var slot = b.querySelector(".chip__n");
      if (slot) slot.textContent = String(n);
      b.disabled = n === 0 && b.getAttribute("aria-pressed") !== "true";
      b.style.opacity = b.disabled ? "0.4" : "";
    });
    el.onlyNewN.textContent = String(facet("nou", true));
  }

  function chip(value, label, n, group, dot) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.setAttribute("data-group", group);
    b.setAttribute("data-value", value);
    b.setAttribute("aria-pressed", "false");
    if (dot) {
      var i = document.createElement("span");
      i.className = "chip__dot";
      i.style.setProperty("--dot", dot);
      b.appendChild(i);
    }
    b.appendChild(document.createTextNode(label + " "));
    var s = document.createElement("span");
    s.className = "chip__n";
    s.textContent = String(n);
    b.appendChild(s);
    b.addEventListener("click", function () {
      state[group] = state[group] === value ? "" : value;
      apply(true);
    });
    return b;
  }

  function syncChips() {
    var all = document.querySelectorAll(".chip[data-group]");
    Array.prototype.forEach.call(all, function (b) {
      var g = b.getAttribute("data-group");
      var v = b.getAttribute("data-value");
      b.setAttribute("aria-pressed", String(state[g] === v));
    });
    el.onlyNew.setAttribute("aria-pressed", String(state.nou));
  }

  /* ---------- randare ---------- */
  function apply(pushUrl) {
    var q = norm(state.q.trim());
    shown = VS.filter(function (v) {
      if (state.tip && v.c !== state.tip) return false;
      if (state.culoare && v.f !== state.culoare) return false;
      if (state.nou && !v.new) return false;
      if (q && norm(v.n).indexOf(q) === -1) return false;
      return true;
    });

    render();
    syncChips();
    syncCounts();

    el.count.textContent = String(shown.length);
    var bits = [];
    if (state.tip) bits.push(cat(state.tip).label);
    if (state.culoare) bits.push(fam(state.culoare).label.toLowerCase());
    if (state.nou) bits.push("doar NOU");
    if (state.q.trim()) bits.push("„" + state.q.trim() + "”");
    var any = bits.length > 0;
    el.active.hidden = !any;
    el.active.textContent = any ? bits.join(" · ") : "";
    el.reset.hidden = !any;
    el.empty.hidden = shown.length > 0;

    if (pushUrl) writeUrl();
  }

  function render() {
    var frag = document.createDocumentFragment();
    shown.forEach(function (v) {
      var li = document.createElement("li");
      li.className = "card";
      li.style.setProperty("--hue", v.x);
      li.setAttribute("data-slug", v.s);

      var open = document.createElement("button");
      open.type = "button";
      open.className = "card__open";

      var box = document.createElement("span");
      box.className = "card__img";
      var img = document.createElement("img");
      img.src = "assets/img/varieties/" + v.s + ".webp";
      img.srcset = "assets/img/varieties/" + v.s + ".webp 260w, assets/img/varieties/" + v.s + "@2x.webp 520w";
      img.sizes = "(min-width: 48rem) 12rem, 45vw";
      img.width = 260; img.height = 260;
      img.loading = "lazy"; img.decoding = "async";
      img.alt = "Gerbera " + v.n + ", " + fam(v.f).label.toLowerCase();
      box.appendChild(img);
      var hue = document.createElement("span");
      hue.className = "card__hue";
      box.appendChild(hue);
      open.appendChild(box);

      var body = document.createElement("span");
      body.className = "card__body";
      var nm = document.createElement("span");
      nm.className = "card__name";
      nm.setAttribute("translate", "no");   /* „Ice Cream", „Love Me" sunt nume, nu text */
      nm.textContent = v.n;
      var ct = document.createElement("span");
      ct.className = "card__cat";
      ct.textContent = cat(v.c).label;
      body.appendChild(nm); body.appendChild(ct);
      open.appendChild(body);

      open.addEventListener("click", function () { openSheet(v.s); });
      li.appendChild(open);

      if (v.new) {
        var bg = document.createElement("span");
        bg.className = "badge-new";
        bg.textContent = "Nou";
        li.appendChild(bg);
      }

      var pick = document.createElement("button");
      pick.type = "button";
      pick.className = "card__pick";
      pick.setAttribute("aria-pressed", String(picked.indexOf(v.s) > -1));
      pick.setAttribute("aria-label", "Adaugă " + v.n + " în lista de cerere");
      pick.textContent = picked.indexOf(v.s) > -1 ? "✓" : "+";
      pick.addEventListener("click", function () { toggle(v.s); });
      li.appendChild(pick);

      frag.appendChild(li);
    });
    el.grid.replaceChildren(frag);
  }

  /* ---------- adresa paginii ca stare ---------- */
  function readUrl() {
    var p = new URLSearchParams(location.search);
    state.tip = p.get("tip") || "";
    state.culoare = p.get("culoare") || "";
    state.q = p.get("q") || "";
    state.nou = p.get("nou") === "1";
    if (!CATS.some(function (c) { return c.k === state.tip; })) state.tip = "";
    if (!FAMS.some(function (f) { return f.k === state.culoare; })) state.culoare = "";
    el.search.value = state.q;
    return p.get("v") || "";
  }
  function writeUrl() {
    var p = new URLSearchParams();
    if (state.tip) p.set("tip", state.tip);
    if (state.culoare) p.set("culoare", state.culoare);
    if (state.q.trim()) p.set("q", state.q.trim());
    if (state.nou) p.set("nou", "1");
    var qs = p.toString();
    history.replaceState(null, "", qs ? "?" + qs : location.pathname);
  }

  /* ---------- fișa ---------- */
  var sheetSlug = "";
  function openSheet(slug) {
    var v = VS.filter(function (x) { return x.s === slug; })[0];
    if (!v) return;
    sheetSlug = slug;
    var c = cat(v.c);
    document.getElementById("sheetImg").src = "assets/img/varieties/" + v.s + "@2x.webp";
    document.getElementById("sheetImg").alt = "Gerbera " + v.n + ", " + fam(v.f).label.toLowerCase() + ", tip " + c.label;
    document.getElementById("sheetCat").textContent = c.label;
    document.getElementById("sheetName").textContent = v.n;
    document.getElementById("sheetType").textContent = c.label;
    document.getElementById("sheetColor").textContent = fam(v.f).label;
    document.getElementById("sheetSw").style.setProperty("--sw", v.x);
    document.getElementById("sheetNew").textContent = v.new ? "Marcat NOU în planșa de producție" : "În sortimentul curent";
    document.getElementById("sheetNote").textContent = c.note;
    var pk = document.getElementById("sheetPick");
    var isIn = picked.indexOf(slug) > -1;
    pk.setAttribute("aria-pressed", String(isIn));
    pk.textContent = isIn ? "Scoate din listă" : "Adaugă în listă";
    if (typeof el.sheet.showModal === "function" && !el.sheet.open) el.sheet.showModal();
  }
  function step(dir) {
    var i = shown.map(function (v) { return v.s; }).indexOf(sheetSlug);
    if (i === -1) return;
    var j = (i + dir + shown.length) % shown.length;
    openSheet(shown[j].s);
  }

  /* ---------- lista de cerere ---------- */
  function toggle(slug) {
    var i = picked.indexOf(slug);
    if (i > -1) picked.splice(i, 1); else picked.push(slug);
    save();
    syncPicked();
  }
  function syncPicked() {
    var cards = el.grid.querySelectorAll(".card");
    Array.prototype.forEach.call(cards, function (li) {
      var slug = li.getAttribute("data-slug");
      var b = li.querySelector(".card__pick");
      var on = picked.indexOf(slug) > -1;
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? "✓" : "+";
    });
    if (sheetSlug && el.sheet.open) {
      var pk = document.getElementById("sheetPick");
      var isIn = picked.indexOf(sheetSlug) > -1;
      pk.setAttribute("aria-pressed", String(isIn));
      pk.textContent = isIn ? "Scoate din listă" : "Adaugă în listă";
    }
    var names = picked.map(function (s) {
      var v = VS.filter(function (x) { return x.s === s; })[0];
      return v ? v.n + " (" + cat(v.c).label + ")" : s;
    });
    el.trayN.textContent = String(picked.length);
    el.trayNames.textContent = names.join(", ");
    if (picked.length) {
      el.tray.setAttribute("data-open", "");
      document.body.setAttribute("data-tray", "");
    } else {
      el.tray.removeAttribute("data-open");
      document.body.removeAttribute("data-tray");
    }
    var body = "Bună ziua,\n\nAș dori o ofertă pentru următoarele varietăți de gerbera:\n\n"
      + names.map(function (n) { return "— " + n; }).join("\n")
      + "\n\nCantitate estimată: \nData livrării: \nFlorăria / firma: \nTelefon: \n\nMulțumesc.";
    el.trayMail.href = "mailto:lucflor@gmail.com?subject="
      + encodeURIComponent("Cerere ofertă gerbera (" + picked.length + " varietăți)")
      + "&body=" + encodeURIComponent(body);
  }

  /* ---------- pornire ---------- */
  buildFilters();
  var deep = readUrl();
  apply(false);
  syncPicked();
  if (deep) openSheet(deep);

  el.search.addEventListener("input", function () {
    state.q = el.search.value;
    apply(true);
  });
  el.onlyNew.addEventListener("click", function () {
    state.nou = !state.nou;
    apply(true);
  });
  function reset() {
    state = { tip: "", culoare: "", q: "", nou: false };
    el.search.value = "";
    apply(true);
  }
  el.reset.addEventListener("click", reset);
  el.emptyReset.addEventListener("click", reset);
  el.trayClear.addEventListener("click", function () {
    picked = [];
    save();
    syncPicked();
  });
  document.getElementById("sheetPick").addEventListener("click", function () { toggle(sheetSlug); });
  document.getElementById("sheetPrev").addEventListener("click", function () { step(-1); });
  document.getElementById("sheetNext").addEventListener("click", function () { step(1); });
  el.sheet.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  });
})();
