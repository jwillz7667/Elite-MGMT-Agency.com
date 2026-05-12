/*! Elite MGMT Agency — production client script · v1.0
 *  Behaviors: side-menu w/ focus trap · custom cursor · ARIA FAQ accordion ·
 *  talent tablist filter · form submission w/ honeypot · IntersectionObserver
 *  reveal · in-page smooth navigation.
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
     Form submission — honeypot, per-field validation, char counter,
     localStorage draft auto-save/restore, JSON POST, mailto fallback,
     in-place success state.
     ──────────────────────────────────────────────────────────────── */
  var APPLY_DRAFT_KEY = 'ema_apply_draft_v1';
  var DRAFT_TTL_MS    = 1000 * 60 * 60 * 24 * 14; // 14 days

  function initForms() {
    $$('form#apply-form, form#news-form').forEach(function (form) {
      on(form, 'submit', function (e) { handleSubmit(e, form); });
      attachFieldValidation(form);
      if (form.id === 'apply-form') {
        attachCharCounter(form);
        restoreDraft(form);
        attachDraftAutosave(form);
        attachResetSuccess(form);
        stampReferrer(form);
      }
    });
  }

  function stampReferrer(form) {
    var ref = form.querySelector('input[name="_referrer"]');
    if (ref && document.referrer) ref.value = document.referrer;
  }

  function setStatus(node, kind, msg) {
    if (!node) return;
    node.classList.remove('success', 'error');
    if (kind) node.classList.add(kind);
    node.textContent = msg || '';
  }

  function setFieldError(field, msg) {
    if (!field) return;
    var id = field.getAttribute('aria-describedby');
    var err = id ? document.getElementById(id) : null;
    if (msg) {
      field.setAttribute('aria-invalid', 'true');
      if (err) err.textContent = msg;
    } else {
      field.removeAttribute('aria-invalid');
      if (err) err.textContent = '';
    }
  }

  function fieldMessage(field) {
    if (!field) return '';
    var v = field.value || '';
    var name = field.name;
    if (field.required && !v.trim()) {
      if (field.type === 'checkbox') return 'Required to continue.';
      if (field.tagName === 'SELECT') return 'Pick one.';
      return 'Required.';
    }
    if (field.type === 'checkbox' && field.required && !field.checked) {
      return 'Required to continue.';
    }
    if (field.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      return 'Use a valid email — like name@domain.com.';
    }
    if (name === 'phone' && v && v.replace(/[^\d]/g, '').length < 7) {
      return 'Use a phone with country code, or leave blank.';
    }
    return '';
  }

  function attachFieldValidation(form) {
    $$('input, select, textarea', form).forEach(function (field) {
      if (field.type === 'hidden' || field.name === 'company') return;
      on(field, 'blur', function () { setFieldError(field, fieldMessage(field)); });
      on(field, 'input', function () {
        if (field.getAttribute('aria-invalid') === 'true') {
          setFieldError(field, fieldMessage(field));
        }
      });
      if (field.type === 'checkbox') {
        on(field, 'change', function () { setFieldError(field, fieldMessage(field)); });
      }
    });
  }

  function attachCharCounter(form) {
    var notes = form.querySelector('textarea[name="notes"]');
    var count = form.querySelector('#notes-count');
    if (!notes || !count) return;
    var max = parseInt(notes.getAttribute('maxlength') || '2000', 10);
    function render() {
      var len = (notes.value || '').length;
      count.textContent = len + ' / ' + max;
      count.classList.toggle('near', len > max * 0.85);
    }
    on(notes, 'input', render);
    render();
  }

  function readDraft() {
    try {
      var raw = window.localStorage.getItem(APPLY_DRAFT_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.ts || (Date.now() - obj.ts) > DRAFT_TTL_MS) {
        window.localStorage.removeItem(APPLY_DRAFT_KEY);
        return null;
      }
      return obj.data || null;
    } catch (_) { return null; }
  }

  function writeDraft(data) {
    try {
      window.localStorage.setItem(APPLY_DRAFT_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (_) { /* quota or private mode */ }
  }

  function clearDraft() {
    try { window.localStorage.removeItem(APPLY_DRAFT_KEY); } catch (_) {}
  }

  function restoreDraft(form) {
    var data = readDraft();
    if (!data) return;
    Object.keys(data).forEach(function (k) {
      var el = form.elements.namedItem(k);
      if (!el || k === 'company' || k.indexOf('_') === 0) return;
      if (el.type === 'checkbox') {
        el.checked = !!data[k];
      } else {
        el.value = data[k];
      }
    });
    // Re-run counter after restore
    var notes = form.querySelector('textarea[name="notes"]');
    if (notes) notes.dispatchEvent(new Event('input'));
  }

  function attachDraftAutosave(form) {
    var pending = null;
    function save() {
      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (v, k) {
        if (k === 'company' || k.indexOf('_') === 0) return;
        data[k] = v;
      });
      writeDraft(data);
    }
    on(form, 'input', function () {
      if (pending) clearTimeout(pending);
      pending = setTimeout(save, 500);
    });
  }

  function attachResetSuccess(form) {
    var card = document.getElementById('apply-success');
    if (!card) return;
    var btn = card.querySelector('.btn-reset');
    if (!btn) return;
    on(btn, 'click', function () {
      card.hidden = true;
      form.hidden = false;
      form.reset();
      $$('.field-error', form).forEach(function (n) { n.textContent = ''; });
      $$('[aria-invalid="true"]', form).forEach(function (n) { n.removeAttribute('aria-invalid'); });
      var notes = form.querySelector('textarea[name="notes"]');
      if (notes) notes.dispatchEvent(new Event('input'));
      var first = form.querySelector('input, select, textarea');
      if (first) try { first.focus(); } catch (_) {}
    });
  }

  function buildMailtoFallback(form, payload) {
    var to = form.getAttribute('data-mailto-fallback');
    if (!to) return null;
    var subject = 'Roster application — ' + (payload.first_name || '') + ' ' + (payload.last_name || '');
    var fields = [
      ['First name',   payload.first_name],
      ['Last / stage', payload.last_name],
      ['Email',        payload.email],
      ['Phone',        payload.phone],
      ['Platform',     payload.platform],
      ['Revenue',      payload.revenue],
      ['Social',       payload.social],
      ['Track',        payload.track],
      ['Notes',        payload.notes]
    ];
    var body = fields
      .filter(function (row) { return row[1]; })
      .map(function (row) { return row[0] + ': ' + row[1]; })
      .join('\n');
    return 'mailto:' + encodeURIComponent(to)
         + '?subject=' + encodeURIComponent(subject.trim())
         + '&body='    + encodeURIComponent(body);
  }

  function validateAllFields(form) {
    var firstInvalid = null;
    $$('input, select, textarea', form).forEach(function (field) {
      if (field.type === 'hidden' || field.name === 'company') return;
      var msg = fieldMessage(field);
      setFieldError(field, msg);
      if (msg && !firstInvalid) firstInvalid = field;
    });
    return firstInvalid;
  }

  function showSuccessCard(form) {
    var card = document.getElementById('apply-success');
    if (!card) return false;
    form.hidden = true;
    card.hidden = false;
    try { card.focus(); } catch (_) {}
    card.scrollIntoView({ behavior: prefersReduced.matches ? 'auto' : 'smooth', block: 'center' });
    return true;
  }

  function successMessage(form) {
    if (form.id === 'news-form') return 'Subscribed. Watch for our quarterly note.';
    return 'Application received. A partner will reply within seven days. NDA on receipt.';
  }

  function errorMessage(form) {
    if (form.id === 'news-form') {
      return 'We could not subscribe you right now. Email join@elite-mgmt-agency.com and we will add you manually.';
    }
    return 'Send failed — we opened your email app so you can send directly. Or write to join@elite-mgmt-agency.com.';
  }

  function handleSubmit(e, form) {
    e.preventDefault();
    var status = form.querySelector('.form-status');
    var btn    = form.querySelector('button[type="submit"]') || form.querySelector('button:not([type])');

    var firstInvalid = validateAllFields(form);
    if (firstInvalid) {
      setStatus(status, 'error', 'Please complete the highlighted fields.');
      try { firstInvalid.focus(); } catch (_) {}
      return;
    }

    // Honeypot — silently succeed for bots (don't tip them off).
    var trap = form.querySelector('input[name="company"]');
    if (trap && trap.value && trap.value.trim() !== '') {
      setStatus(status, 'success', successMessage(form));
      form.reset();
      return;
    }

    var ts = form.querySelector('input[name="_submitted_at"]');
    if (ts) ts.value = new Date().toISOString();

    var fd = new FormData(form);
    var payload = {};
    fd.forEach(function (v, k) { if (k !== 'company') payload[k] = v; });

    var originalHTML = null;
    if (btn) {
      originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      var label = btn.querySelector('.btn-label');
      if (label) label.textContent = form.id === 'news-form' ? 'Sending…' : 'Sending application…';
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

    var ctrl  = (typeof AbortController === 'function') ? new AbortController() : null;
    if (ctrl) fetchOpts.signal = ctrl.signal;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;

    var unlockBtn = function () {
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        if (originalHTML != null) btn.innerHTML = originalHTML;
      }
    };

    var onOk = function () {
      if (timer) clearTimeout(timer);
      unlockBtn();
      clearDraft();
      if (form.id === 'apply-form' && showSuccessCard(form)) {
        setStatus(status, 'success', '');
      } else {
        setStatus(status, 'success', successMessage(form));
        form.reset();
        if (ts) ts.value = '';
      }
    };

    var onFail = function () {
      if (timer) clearTimeout(timer);
      unlockBtn();
      setStatus(status, 'error', errorMessage(form));
      if (form.id === 'apply-form') {
        var mailto = buildMailtoFallback(form, payload);
        if (mailto) {
          try { window.location.href = mailto; } catch (_) {}
        }
      }
    };

    if (typeof window.fetch !== 'function') {
      onFail();
      return;
    }

    window.fetch(action, fetchOpts)
      .then(function (res) { (res && res.ok) ? onOk() : onFail(); })
      .catch(function () { onFail(); });
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
    initSmoothNav();
    hardenExternalLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
