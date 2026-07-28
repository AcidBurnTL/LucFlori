/* LucFlori — mișcare.
   Dezvăluire la derulare, antet care se strânge, bandă de culoare în mișcare.
   Totul se oprește dacă vizitatorul cere mai puțină mișcare. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 1. dezvăluire la derulare ---------- */
  /* Elementele sunt marcate din JS: fără JS pagina rămâne complet vizibilă. */
  var SELECTORS = [
    ".section-head", ".story > *", ".type", ".fact", ".steps li",
    ".contact-card", ".qa details", ".shots figure", ".contact",
    ".page-head > .wrap > *", ".aside-card", ".facts"
  ].join(",");

  function setupReveal() {
    if (reduce.matches || !("IntersectionObserver" in window)) return;
    var nodes = document.querySelectorAll(SELECTORS);
    if (!nodes.length) return;

    Array.prototype.forEach.call(nodes, function (n) {
      // grupurile își numerotează copiii ca să intre pe rând
      var sibs = n.parentNode ? n.parentNode.children : [];
      var idx = Array.prototype.indexOf.call(sibs, n);
      n.style.setProperty("--i", Math.min(idx, 8));
      n.classList.add("reveal");
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* ---------- 2. antetul se strânge după derulare ---------- */
  function setupHeader() {
    var head = document.querySelector(".site-head");
    if (!head) return;
    var ticking = false;
    function update() {
      head.classList.toggle("is-scrolled", window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- pornire ---------- */
  function start() {
    setupReveal();
    setupHeader();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // dacă vizitatorul schimbă setarea în timpul vizitei, arătăm tot imediat
  if (typeof reduce.addEventListener === "function") {
    reduce.addEventListener("change", function () {
      if (!reduce.matches) return;
      Array.prototype.forEach.call(
        document.querySelectorAll(".reveal"),
        function (n) { n.classList.add("is-in"); }
      );
    });
  }
})();
