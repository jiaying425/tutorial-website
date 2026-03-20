/* =================================================================
   Ye Alin — Artist Website
   JS: Parallax · Scroll Reveal · Counter · Gallery Filter · Lightbox
   ================================================================= */

(function () {
  'use strict';

  /* ── Utilities ─────────────────────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* ── DOM refs ───────────────────────────────────────────────── */
  const navbar          = qs('#navbar');
  const navToggle       = qs('#navToggle');
  const navLinks        = qs('#navLinks');
  const parallaxBg      = qs('#parallaxBg');
  const parallaxQuoteBg = qs('#parallaxQuoteBg');
  const galleryGrid     = qs('#galleryGrid');
  const lightbox        = qs('#lightbox');
  const lightboxImg     = qs('#lightboxImg');
  const lightboxCaption = qs('#lightboxCaption');
  const lightboxClose   = qs('#lightboxClose');
  const lightboxBdrop   = qs('#lightboxBackdrop');
  const yearEl          = qs('#year');

  /* ── Constants ─────────────────────────────────────────────── */
  /* Matches the CSS .lightbox transition-duration */
  var LIGHTBOX_TRANSITION_MS = 350;

  /* ── Footer year ────────────────────────────────────────────── */
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Respect reduced‑motion preference ─────────────────────── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================================================================
     NAVBAR — scroll state
     ================================================================ */
  function updateNavbar() {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  updateNavbar();

  /* ── Mobile nav toggle ──────────────────────────────────────── */
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });

    /* Close nav when a link is clicked */
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ================================================================
     PARALLAX
     ================================================================ */
  function applyParallax() {
    if (prefersReduced) return;
    const scrollY = window.scrollY;

    /* Hero parallax — moves slightly slower than scroll */
    if (parallaxBg) {
      const heroEl = qs('#hero');
      if (heroEl) {
        const heroH = heroEl.offsetHeight;
        const offset = Math.min(scrollY * 0.35, heroH * 0.35);
        parallaxBg.style.transform = 'translateY(' + offset + 'px)';
      }
    }

    /* Quote section parallax */
    if (parallaxQuoteBg) {
      const quoteEl = qs('#parallaxQuote');
      if (quoteEl) {
        const rect = quoteEl.getBoundingClientRect();
        const offset = rect.top * 0.3;
        parallaxQuoteBg.style.transform = 'translateY(' + offset + 'px)';
      }
    }
  }

  /* ================================================================
     SCROLL REVEAL  (IntersectionObserver)
     ================================================================ */
  var revealObserver = null;

  if (!prefersReduced && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    qsa('.reveal-fade, .reveal-slide-up, .reveal-slide-left, .reveal-slide-right')
      .forEach(function (el) { revealObserver.observe(el); });
  } else {
    /* Fallback: show everything immediately */
    qsa('.reveal-fade, .reveal-slide-up, .reveal-slide-left, .reveal-slide-right')
      .forEach(function (el) { el.classList.add('visible'); });
  }

  /* ================================================================
     ANIMATED COUNTERS
     ================================================================ */
  var countersStarted = false;

  function easeOutQuad(t) { return t * (2 - t); }

  function animateCounter(el, target, duration) {
    var start = null;
    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      el.textContent = Math.floor(easeOutQuad(progress) * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function startCounters() {
    if (countersStarted) return;
    countersStarted = true;
    qsa('.stat-number').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10) || 0;
      if (prefersReduced) {
        el.textContent = target;
      } else {
        animateCounter(el, target, 1800);
      }
    });
  }

  var statsBanner = qs('.stats-banner');
  if (statsBanner && 'IntersectionObserver' in window) {
    var statsObserver = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          startCounters();
          statsObserver.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    statsObserver.observe(statsBanner);
  }

  /* ================================================================
     GALLERY FILTER
     ================================================================ */
  var filterBtns = qsa('.filter-btn');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      /* Update active button */
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      /* Filter cards */
      qsa('.gallery-card').forEach(function (card) {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ================================================================
     LIGHTBOX
     ================================================================ */
  function openLightbox(src, caption) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.textContent = caption || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    /* Clear src to cancel any in-flight request */
    setTimeout(function () {
      lightboxImg.src = '';
    }, LIGHTBOX_TRANSITION_MS);
  }

  /* Attach click to gallery overlay icons */
  if (galleryGrid) {
    galleryGrid.addEventListener('click', function (e) {
      var overlay = e.target.closest('.gallery-overlay');
      if (!overlay) return;
      var card = overlay.closest('.gallery-card');
      if (!card) return;
      var img = card.querySelector('img');
      var title = card.querySelector('h3');
      if (img) {
        openLightbox(img.src, title ? title.textContent : '');
      }
    });
  }

  if (lightboxClose)   lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBdrop)   lightboxBdrop.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  /* ================================================================
     SMOOTH ANCHOR SCROLL (for browsers that don't support CSS)
     ================================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ================================================================
     UNIFIED SCROLL HANDLER (throttled)
     ================================================================ */
  var ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateNavbar();
        applyParallax();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* Initial render */
  applyParallax();

})();
