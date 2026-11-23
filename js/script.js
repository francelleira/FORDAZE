/* FORDAZE — site behaviour. Sections are initialised independently so a missing block never breaks the rest. */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Sticky nav: solid background after scrolling ---- */
  var nav = $("#nav");
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 40); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  var burger = $("#burger"), menu = $("#menu");
  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  burger.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* ---- Active nav link (only for sections that exist yet) ---- */
  var links = $$(".nav__links a[href^='#']");
  var map = {};
  links.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) map[s.id] = a; });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove("is-active"); l.removeAttribute("aria-current"); });
        // the interior feature belongs to the Services menu item
        var a = map[en.target.id] || (en.target.id === "interior" ? map.services : null);
        if (a) { a.classList.add("is-active"); a.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { spy.observe($("#" + id)); });
    var interior = $("#interior"); if (interior) spy.observe(interior);

    /* ---- Scroll reveal ---- */
    var rv = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); rv.unobserve(en.target); } });
    }, { threshold: .15 });
    $$(".reveal").forEach(function (el) { rv.observe(el); });

    /* ---- Stat counters ---- */
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target, end = parseInt(el.dataset.count, 10) || 0;
        if (reduce || end === 0) { el.textContent = end; return; }
        var start = performance.now(), dur = 1400;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: .6 });
    $$("[data-count]").forEach(function (el) { co.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
    $$("[data-count]").forEach(function (el) { el.textContent = el.dataset.count; });
  }

  /* ---- Services accordion (one open at a time) ---- */
  var btns = $$(".acc__btn");
  btns.forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") === "true";
      btns.forEach(function (o) { o.setAttribute("aria-expanded", "false"); });
      b.setAttribute("aria-expanded", String(!open));
    });
  });

  /* ---- Footer year ---- */
  var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();
})();

/* ==========================================================
   Projects filter + modal, testimonial carousel, quote form
   ========================================================== */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Project filter ---- */
  var chips = $$(".chip"), cards = $$(".proj");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      chips.forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
      cards.forEach(function (p) { p.hidden = !(c.dataset.f === "all" || p.dataset.cat === c.dataset.f); });
    });
  });

  /* ---- Project modal (native <dialog>: focus trap + Esc built in) ---- */
  var modal = $("#modal"), lastBtn = null;
  cards.forEach(function (p) {
    $(".proj__btn", p).addEventListener("click", function (e) {
      lastBtn = e.currentTarget;
      $("#m-img").src = p.dataset.img; $("#m-img").alt = "Placeholder image for " + p.dataset.title;
      $("#m-type").textContent = p.dataset.type; $("#m-title").textContent = p.dataset.title;
      $("#m-desc").textContent = p.dataset.desc; $("#m-services").textContent = p.dataset.services;
      modal.showModal();
    });
  });
  $("#m-close").addEventListener("click", function () { modal.close(); });
  $("#m-cta").addEventListener("click", function () { modal.close(); });
  modal.addEventListener("click", function (e) { if (e.target === modal) modal.close(); });
  modal.addEventListener("close", function () { if (lastBtn) lastBtn.focus(); });

  /* ---- Testimonial carousel ---- */
  var track = $("#carTrack"), slides = $$(".slide", track), idx = 0, timer;
  function go(n) {
    idx = (n + slides.length) % slides.length;
    track.style.transform = "translateX(-" + idx * 100 + "%)";
    $("#carCount").textContent = (idx + 1) + " / " + slides.length;
    slides.forEach(function (s, i) { s.setAttribute("aria-hidden", String(i !== idx)); });
  }
  function auto() { if (!reduce) { clearInterval(timer); timer = setInterval(function () { go(idx + 1); }, 8000); } }
  $("#prev").addEventListener("click", function () { go(idx - 1); auto(); });
  $("#next").addEventListener("click", function () { go(idx + 1); auto(); });
  $("#car").addEventListener("focusin", function () { clearInterval(timer); });
  go(0); auto();

  /* ---- Quote form (front-end only) ---- */
  var form = $("#qform"), btn = $("#qbtn"), ok = $("#qok");
  var rules = {
    name: function (v) { return v.trim() ? "" : "Enter your full name."; },
    email: function (v) { return !v.trim() ? "Enter your email address." : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Enter a valid email, like name@example.com."; },
    phone: function (v) { return !v.trim() ? "Enter your phone number." : /^\+?[\d\s()-]{7,15}$/.test(v.trim()) ? "" : "Enter a valid phone number, digits only."; },
    type: function (v) { return v ? "" : "Select a project type."; },
    location: function (v) { return v.trim() ? "" : "Enter the project location."; },
    service: function (v) { return v ? "" : "Select the service you need."; },
    description: function (v) { return v.trim().length >= 10 ? "" : "Describe your project in at least 10 characters."; }
  };
  function check(el) {
    var rule = rules[el.name]; if (!rule) return true;
    var msg = rule(el.value), box = el.closest(".field");
    box.classList.toggle("is-bad", !!msg);
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    $(".err", box).textContent = msg;
    return !msg;
  }
  $$("input, select, textarea", form).forEach(function (el) {
    el.addEventListener("blur", function () { check(el); });
    el.addEventListener("input", function () { if (el.closest(".is-bad")) check(el); });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault(); ok.hidden = true;
    var bad = $$("input, select, textarea", form).filter(function (el) { return !check(el); });
    if (bad.length) { bad[0].focus(); return; }
    btn.classList.add("is-loading"); btn.disabled = true;
    /* BACKEND HOOK: replace this timeout with fetch("/your-api", { method: "POST", body: new FormData(form) }).
       Files are NOT uploaded by this demo. */
    setTimeout(function () {
      btn.classList.remove("is-loading"); btn.disabled = false;
      form.reset(); ok.hidden = false; ok.focus && ok.setAttribute("tabindex", "-1"); ok.focus();
    }, 1400);
  });
})();
