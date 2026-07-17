/* ============================================================
   DALI COIFFURE — script partagé
   Zéro dépendance · transform/opacity uniquement
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. Voile de transition entre pages
     View Transitions API si dispo, sinon voile cuivre maison
  ---------------------------------------------------------- */
  var veil = document.querySelector('.veil');
  var supportsVT = !!document.startViewTransition;

  if (veil && !reduceMotion && !supportsVT) {
    // Entrée : le voile se retire
    requestAnimationFrame(function () {
      veil.classList.add('is-entering');
    });

    // Sortie : voile avant navigation interne
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#' || link.target === '_blank') return;
      if (/^(tel:|mailto:|http)/.test(href)) return;

      e.preventDefault();
      veil.classList.remove('is-entering');
      veil.classList.add('is-leaving');
      setTimeout(function () { window.location.href = href; }, 430);
    });

    // Retour via bfcache : retirer le voile
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) {
        veil.classList.remove('is-leaving');
        veil.classList.add('is-entering');
      }
    });
  } else if (veil) {
    veil.style.display = 'none';
  }

  /* ----------------------------------------------------------
     2. Header : se masque en descendant, réapparaît en montant
  ---------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 30);
      if (y > lastY && y > 140 && !document.body.classList.contains('nav-open')) {
        header.classList.add('is-hidden');
      } else if (y < lastY - 4 || y <= 140) {
        header.classList.remove('is-hidden');
      }
    }
    updateParallax(y);
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  /* ----------------------------------------------------------
     3. Menu burger plein écran
  ---------------------------------------------------------- */
  var burger = document.querySelector('.burger');
  var navOverlay = document.querySelector('.nav-overlay');

  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (navOverlay) navOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setNav(!document.body.classList.contains('nav-open'));
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.body.classList.contains('nav-open')) {
        setNav(false);
        if (burger) burger.focus();
      }
      closeLightbox();
    }
  });

  if (navOverlay) {
    navOverlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });
  }

  /* ----------------------------------------------------------
     4. Curseur personnalisé (desktop, pointeur fin)
  ---------------------------------------------------------- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduceMotion) {
    var dot = document.createElement('div');
    var ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    dot.setAttribute('aria-hidden', 'true');
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add('has-cursor');

    var mx = -100, my = -100, rx = -100, ry = -100;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = 'translate(' + (mx - 3.5) + 'px,' + (my - 3.5) + 'px)';
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.13;
      ry += (my - ry) * 0.13;
      ring.style.transform = 'translate(' + (rx - 19) + 'px,' + (ry - 19) + 'px)';
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a, button, input, textarea, .g-item')) {
        ring.classList.add('is-active');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('a, button, input, textarea, .g-item')) {
        ring.classList.remove('is-active');
      }
    });
  }

  /* ----------------------------------------------------------
     5. Hero : entrée lettre par lettre
  ---------------------------------------------------------- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text);
    var i = 0;
    text.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      if (ch === ' ') {
        span.innerHTML = '&nbsp;';
      } else {
        span.textContent = ch;
        span.className = 'char';
        span.style.setProperty('--i', i++);
      }
      el.appendChild(span);
    });
  });

  /* ----------------------------------------------------------
     6. Révélations au scroll (IntersectionObserver)
  ---------------------------------------------------------- */
  var revealTargets = document.querySelectorAll('.reveal, .curtain, .menu-item, .signature-line');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (t) { io.observe(t); });
  } else {
    revealTargets.forEach(function (t) { t.classList.add('is-visible'); });
  }

  /* ----------------------------------------------------------
     7. Parallaxe léger (data-parallax="vitesse")
  ---------------------------------------------------------- */
  var parallaxEls = [];
  document.querySelectorAll('[data-parallax]').forEach(function (el) {
    parallaxEls.push({ el: el, speed: parseFloat(el.dataset.parallax) || 0.15 });
  });

  function updateParallax(y) {
    if (reduceMotion) return;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (p) {
      var rect = p.el.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      var offset = (rect.top + rect.height / 2 - vh / 2) * p.speed;
      p.el.style.transform = 'translateY(' + (-offset).toFixed(1) + 'px)';
    });
  }
  updateParallax(window.scrollY);

  /* ----------------------------------------------------------
     8. Lightbox (galerie)
  ---------------------------------------------------------- */
  var lightbox = document.querySelector('.lightbox');
  var lightboxContent = lightbox ? lightbox.querySelector('.lightbox-content') : null;
  var lightboxCaption = lightbox ? lightbox.querySelector('.lightbox-caption') : null;
  var lastFocused = null;

  function openLightbox(item) {
    if (!lightbox || !lightboxContent) return;
    lastFocused = item;
    var ph = item.querySelector('.g-ph');
    lightboxContent.innerHTML = '';
    if (ph) {
      var clone = ph.cloneNode(true);
      lightboxContent.appendChild(clone);
    }
    if (lightboxCaption) {
      lightboxCaption.textContent = item.getAttribute('data-caption') || '';
    }
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var closeBtn = lightbox.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('.g-item').forEach(function (item) {
    item.addEventListener('click', function () { openLightbox(item); });
  });

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.closest('.lightbox-close')) {
        closeLightbox();
      }
    });
  }

  /* ----------------------------------------------------------
     9. Formulaire de contact → mailto: (fallback sans backend)
  ---------------------------------------------------------- */
  var form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('#f-name') || {}).value || '';
      var phone = (form.querySelector('#f-phone') || {}).value || '';
      var msg = (form.querySelector('#f-msg') || {}).value || '';
      var body = 'Nom : ' + name + '\nTéléphone : ' + phone + '\n\n' + msg;
      window.location.href = 'mailto:dalicoiffure57@gmail.com'
        + '?subject=' + encodeURIComponent('Demande de rendez-vous — ' + name)
        + '&body=' + encodeURIComponent(body);
    });
  }

  /* ----------------------------------------------------------
     10. Année courante dans le footer
  ---------------------------------------------------------- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
