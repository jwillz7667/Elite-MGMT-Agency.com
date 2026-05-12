/*! Elite MGMT Agency — production client script · v1.0
 *  Behaviors: side-menu w/ focus trap · custom cursor · ARIA FAQ accordion ·
 *  talent tablist filter · form submission w/ honeypot · IntersectionObserver
 *  reveal · GMT clock · in-page smooth navigation.
 *
 *  No dependencies. Defer-loaded. IIFE-scoped. Defensive throughout.
 *  © Elite MGMT Agency, Inc.
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────────────
     Utilities — DOM query, listener binding, media-query gating.
     Defensive: never throw if a hook is missing.
     ──────────────────────────────────────────────────────────────── */
  var docEl = document.documentElement;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    var list = (root || document).querySelectorAll(sel);
    return Array.prototype.slice.call(list);
  }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }
  function mq(q) {
    return (typeof window.matchMedia === 'function')
      ? window.matchMedia(q)
      : { matches: false, addEventListener: function () {}, addListener: function () {} };
  }

  var prefersReduced = mq('(prefers-reduced-motion: reduce)');
  var hoverCapable   = mq('(hover: hover) and (pointer: fine)');
  var supportsInert  = 'inert' in HTMLElement.prototype;

  /* ──────────────────────────────────────────────────────────────────
     Side menu — drawer pattern with focus trap, scroll lock, Esc-close,
     overlay-click-close, and inert-on-main for assistive tech.
     ──────────────────────────────────────────────────────────────── */
  function initSideMenu() {
    var menu     = $('#side-menu');
    var trigger  = $('.menu-trigger');
    var closeBtn = $('.menu-close');
    var overlay  = $('.menu-overlay');
    var main     = $('#main');
    if (!menu || !trigger) return;

    var lastFocus = null;
    var isOpen    = false;
    var hideTimer = null;

    function visible(el) {
      return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
    }

    function focusables() {
      var sel = 'a[href], button:not([disabled]), input:not([disabled]),'
              + 'select:not([disabled]), textarea:not([disabled]),'
              + '[tabindex]:not([tabindex="-1"])';
      return $$(sel, menu).filter(visible);
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      lastFocus = document.activeElement;
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');

      if (overlay) {
        overlay.hidden = false;
        // next frame so the opacity transition runs
        requestAnimationFrame(function () { overlay.classList.add('show'); });
      }
      document.body.classList.add('menu-open');
      docEl.classList.add('menu-open');
      if (main && supportsInert) main.inert = true;

      requestAnimationFrame(function () {
        var f = focusables();
        var target = f[0] || menu;
        try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      });
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;

      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');

      if (overlay) {
        overlay.classList.remove('show');
        hideTimer = setTimeout(function () { overlay.hidden = true; }, 450);
      }
      document.body.classList.remove('menu-open');
      docEl.classList.remove('menu-open');
      if (main && supportsInert) main.inert = false;

      if (lastFocus && typeof lastFocus.focus === 'function') {
        try { lastFocus.focus({ preventScroll: true }); } catch (_) { lastFocus.focus(); }
      }
    }

    function toggle() { isOpen ? close() : open(); }

    on(trigger,  'click', toggle);
    on(closeBtn, 'click', close);
    on(overlay,  'click', close);

    on(document, 'keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' && e.keyCode !== 9) return;

      var f = focusables();
      if (!f.length) return;
      var first = f[0];
      var last  = f[f.length - 1];
      var active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !menu.contains(active)) {
          e.preventDefault();
          try { last.focus({ preventScroll: true }); } catch (_) { last.focus(); }
        }
      } else {
        if (active === last) {
          e.preventDefault();
          try { first.focus({ preventScroll: true }); } catch (_) { first.focus(); }
        }
      }
    });

    // Auto-close on in-menu link click; runs before document-level smooth-nav
    // delegator (direct handlers fire before delegated ones in capture-less mode)
    $$('a[href]', menu).forEach(function (a) {
      on(a, 'click', function () { close(); });
    });

    // Expose for other modules
    window.__emaMenu = { open: open, close: close, isOpen: function () { return isOpen; } };
  }

  /* ──────────────────────────────────────────────────────────────────
     Custom cursor — pointer-only, hover-capable, motion-respecting.
     ──────────────────────────────────────────────────────────────── */
  function initCustomCursor() {
    var cursor = $('.cursor');
    if (!cursor) return;
    if (!hoverCapable.matches || prefersReduced.matches) {
      cursor.style.display = 'none';
      return;
    }

    var hoverSel = 'a, button, [role="button"], input, select, textarea, label, '
                 + '.chip, .faq-q, [data-cursor="hover"]';

    on(document, 'pointermove', function (e) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    }, { passive: true });

    on(document, 'pointerover', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest(hoverSel)) cursor.classList.add('hover');
    }, { passive: true });

    on(document, 'pointerout', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest(hoverSel)) cursor.classList.remove('hover');
    }, { passive: true });

    on(document, 'mouseleave', function () { cursor.style.opacity = '0'; });
    on(document, 'mouseenter', function () { cursor.style.opacity = '1'; });
  }

  /* ──────────────────────────────────────────────────────────────────
     FAQ accordion — ARIA-driven, single-open, button-based triggers.
     ──────────────────────────────────────────────────────────────── */
  function initFAQ() {
    var items = $$('.faq-item');
    if (!items.length) return;

    items.forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      if (!btn) return;
      on(btn, 'click', function () {
        var willOpen = btn.getAttribute('aria-expanded') !== 'true';
        // Single-open behavior — collapse all peers first
        items.forEach(function (other) {
          var ob = other.querySelector('.faq-q');
          if (!ob) return;
          ob.setAttribute('aria-expanded', 'false');
          other.classList.remove('open');
        });
        if (willOpen) {
          btn.setAttribute('aria-expanded', 'true');
          item.classList.add('open');
        }
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────────
     Talent filter — ARIA tablist with arrow-key navigation. Cards
     dim via data-filtered attribute (CSS handles the visual).
     ──────────────────────────────────────────────────────────────── */
  function initTalentFilter() {
    var tablist = $('.talent-filters');
    var chips   = $$('.talent-filters .chip');
    var cards   = $$('.talent-card');
    var count   = $('.talent-foot .count');
    if (!chips.length || !cards.length) return;

    var TOTAL = 42; // canonical roster size shown in copy

    function matches(card, filter) {
      if (filter === 'all') return true;
      var tracks = (card.getAttribute('data-track') || '').toLowerCase().split(/\s+/);
      return tracks.indexOf(filter) !== -1;
    }

    function apply(filter) {
      var visibleCount = 0;
      cards.forEach(function (card) {
        var ok = matches(card, filter);
        if (ok) {
          card.removeAttribute('data-filtered');
          visibleCount++;
        } else {
          card.setAttribute('data-filtered', 'true');
        }
      });
      if (count) {
        count.textContent = filter === 'all'
          ? 'Showing ' + visibleCount + ' of ' + TOTAL + ' creators · names anonymized'
          : 'Showing ' + visibleCount + ' of ' + TOTAL + ' · filter: ' + filter;
      }
    }

    function select(chip) {
      chips.forEach(function (c) {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
        c.setAttribute('tabindex', '-1');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');
      chip.setAttribute('tabindex', '0');
      apply(chip.getAttribute('data-filter') || 'all');
    }

    chips.forEach(function (chip) {
      // Initial roving tabindex
      if (chip.getAttribute('aria-selected') !== 'true') chip.setAttribute('tabindex', '-1');
      else chip.setAttribute('tabindex', '0');
      on(chip, 'click', function () { select(chip); });
    });

    on(tablist, 'keydown', function (e) {
      var i = chips.indexOf(document.activeElement);
      if (i < 0) return;
      var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowDown') {
        e.preventDefault();
        var next = chips[(i + 1) % chips.length];
        next.focus(); select(next);
      } else if (k === 'ArrowLeft' || k === 'ArrowUp') {
        e.preventDefault();
        var prev = chips[(i - 1 + chips.length) % chips.length];
        prev.focus(); select(prev);
      } else if (k === 'Home') {
        e.preventDefault();
        chips[0].focus(); select(chips[0]);
      } else if (k === 'End') {
        e.preventDefault();
        var lastChip = chips[chips.length - 1];
        lastChip.focus(); select(lastChip);
      }
    });
  }

  /* ──────────────────────────────────────────────────────────────────
     Form submission — honeypot validation, native checkValidity, JSON
     POST to declared action URL, graceful degradation to email fallback.
     ──────────────────────────────────────────────────────────────── */
  function initForms() {
    $$('form#apply-form, form#news-form').forEach(function (form) {
      on(form, 'submit', function (e) { handleSubmit(e, form); });
    });
  }

  function setStatus(node, kind, msg) {
    if (!node) return;
    node.classList.remove('success', 'error');
    if (kind) node.classList.add(kind);
    node.textContent = msg || '';
  }

  function successMessage(form) {
    if (form.id === 'news-form') {
      return 'Subscribed. Watch for our quarterly note.';
    }
    return 'Application received. A partner will reply within seven days. NDA on receipt.';
  }

  function errorMessage(form) {
    if (form.id === 'news-form') {
      return 'We could not subscribe you right now. Email join@elite-mgmt-agency.com and we will add you manually.';
    }
    return 'Your application did not send. Email join@elite-mgmt-agency.com and we will follow up directly.';
  }

  function handleSubmit(e, form) {
    e.preventDefault();
    var status = form.querySelector('.form-status');
    var btn    = form.querySelector('button[type="submit"]') || form.querySelector('button:not([type])');

    // Native validation — uses browser tooltips for missing required fields.
    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
      setStatus(status, 'error', 'Please complete the required fields.');
      if (typeof form.reportValidity === 'function') form.reportValidity();
      return;
    }

    // Honeypot — silently succeed for bots (don't tip them off).
    var trap = form.querySelector('input[name="company"]');
    if (trap && trap.value && trap.value.trim() !== '') {
      setStatus(status, 'success', successMessage(form));
      form.reset();
      return;
    }

    // Time-stamp submission
    var ts = form.querySelector('input[name="_submitted_at"]');
    if (ts) ts.value = new Date().toISOString();

    // Build payload — exclude honeypot.
    var fd = new FormData(form);
    var payload = {};
    fd.forEach(function (v, k) { if (k !== 'company') payload[k] = v; });

    // Lock the submit button.
    var originalHTML = null;
    if (btn) {
      originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.innerHTML = form.id === 'news-form' ? 'Sending…' : 'Sending application…';
    }
    setStatus(status, '', 'Sending…');

    var action = form.getAttribute('action') || '/';
    var method = (form.getAttribute('method') || 'POST').toUpperCase();

    var fetchOpts = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json'
      },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    };

    // 15s submission timeout via AbortController
    var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
    if (ctrl) fetchOpts.signal = ctrl.signal;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;

    var done = function (ok) {
      if (timer) clearTimeout(timer);
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        if (originalHTML != null) btn.innerHTML = originalHTML;
      }
      if (ok) {
        setStatus(status, 'success', successMessage(form));
        form.reset();
        // Re-stamp the timestamp on the next submit
        if (ts) ts.value = '';
      } else {
        setStatus(status, 'error', errorMessage(form));
      }
    };

    if (typeof window.fetch !== 'function') {
      // Browser without fetch — fail gracefully to email fallback.
      done(false);
      return;
    }

    window.fetch(action, fetchOpts)
      .then(function (res) { done(!!res && res.ok); })
      .catch(function () { done(false); });
  }

  /* ──────────────────────────────────────────────────────────────────
     Reveal — IntersectionObserver, one-shot unobserve.
     ──────────────────────────────────────────────────────────────── */
  function initReveal() {
    var els = $$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || prefersReduced.matches) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ──────────────────────────────────────────────────────────────────
     GMT clock — updates [data-clock] elements at 30s cadence.
     ──────────────────────────────────────────────────────────────── */
  function initClock() {
    var nodes = $$('[data-clock]');
    if (!nodes.length) return;

    function render() {
      var d = new Date();
      var hh = String(d.getUTCHours()).padStart(2, '0');
      var mm = String(d.getUTCMinutes()).padStart(2, '0');
      var text = hh + ':' + mm + ' GMT';
      nodes.forEach(function (n) { n.textContent = text; });
    }

    render();
    // Align next tick to the next minute boundary so display is always fresh
    var now = new Date();
    var msToNextMinute = (60 - now.getUTCSeconds()) * 1000 - now.getUTCMilliseconds();
    setTimeout(function () {
      render();
      setInterval(render, 60 * 1000);
    }, msToNextMinute);
  }

  /* ──────────────────────────────────────────────────────────────────
     Smooth in-page navigation — delegates clicks on anchor links,
     respects prefers-reduced-motion, manages focus for a11y, and
     keeps history clean via replaceState.
     ──────────────────────────────────────────────────────────────── */
  function initSmoothNav() {
    on(document, 'click', function (e) {
      // Bypass if modifier keys are pressed (let browser handle new tab, etc.)
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== undefined && e.button !== 0) return;

      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';

      // Only same-page hash links
      if (href.charAt(0) !== '#' || href.length < 2) return;
      var id = href.slice(1);
      var target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      var behavior = prefersReduced.matches ? 'auto' : 'smooth';
      try {
        target.scrollIntoView({ behavior: behavior, block: 'start' });
      } catch (_) {
        target.scrollIntoView();
      }

      // Move focus for assistive tech without scrolling twice
      var hadTabindex = target.hasAttribute('tabindex');
      if (!hadTabindex) target.setAttribute('tabindex', '-1');
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      if (!hadTabindex) {
        target.addEventListener('blur', function strip() {
          target.removeAttribute('tabindex');
          target.removeEventListener('blur', strip);
        });
      }

      // Clean URL without polluting history
      try { history.replaceState(null, '', '#' + id); } catch (_) { /* SecurityError in some sandboxes */ }
    });
  }

  /* ──────────────────────────────────────────────────────────────────
     External link hygiene — set rel="noopener" on target="_blank"
     anchors that the author forgot. Cheap defense-in-depth.
     ──────────────────────────────────────────────────────────────── */
  function hardenExternalLinks() {
    $$('a[target="_blank"]').forEach(function (a) {
      var rel = (a.getAttribute('rel') || '').toLowerCase();
      if (rel.indexOf('noopener') === -1) {
        a.setAttribute('rel', (rel + ' noopener').trim());
      }
    });
  }

  /* ──────────────────────────────────────────────────────────────────
     Boot
     ──────────────────────────────────────────────────────────────── */
  function boot() {
    initSideMenu();
    initCustomCursor();
    initFAQ();
    initTalentFilter();
    initForms();
    initReveal();
    initClock();
    initSmoothNav();
    hardenExternalLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
