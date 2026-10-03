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

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    var list = (root || document).querySelectorAll(sel);
    return Array.prototype.slice.call(list);
  }
  function on(el, ev, fn, opts) {
    if (el) el.addEventListener(ev, fn, opts);
  }
  function mq(q) {
    return typeof window.matchMedia === 'function'
      ? window.matchMedia(q)
      : { matches: false, addEventListener: function () {}, addListener: function () {} };
  }

  var prefersReduced = mq('(prefers-reduced-motion: reduce)');
  var hoverCapable = mq('(hover: hover) and (pointer: fine)');
  var supportsInert = 'inert' in HTMLElement.prototype;

  /* ──────────────────────────────────────────────────────────────────
     Side menu — drawer pattern with focus trap, scroll lock, Esc-close,
     overlay-click-close, and inert-on-main for assistive tech.
     ──────────────────────────────────────────────────────────────── */
  function initSideMenu() {
    var menu = $('#side-menu');
    var trigger = $('.menu-trigger');
    var closeBtn = $('.menu-close');
    var overlay = $('.menu-overlay');
    var main = $('#main');
    if (!menu || !trigger) return;

    menu.inert = true;
    var lastFocus = null;
    var isOpen = false;
    var hideTimer = null;

    function visible(el) {
      return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
    }

    function focusables() {
      var sel =
        'a[href], button:not([disabled]), input:not([disabled]),' +
        'select:not([disabled]), textarea:not([disabled]),' +
        '[tabindex]:not([tabindex="-1"])';
      return $$(sel, menu).filter(visible);
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      lastFocus = document.activeElement;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }

      menu.inert = false;
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');

      if (overlay) {
        overlay.hidden = false;
        // next frame so the opacity transition runs
        requestAnimationFrame(function () {
          overlay.classList.add('show');
        });
      }
      document.body.classList.add('menu-open');
      docEl.classList.add('menu-open');
      if (main && supportsInert) main.inert = true;

      requestAnimationFrame(function () {
        var f = focusables();
        var target = f[0] || menu;
        try {
          target.focus({ preventScroll: true });
        } catch (_) {
          target.focus();
        }
      });
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;

      menu.inert = true;
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');

      if (overlay) {
        overlay.classList.remove('show');
        hideTimer = setTimeout(function () {
          overlay.hidden = true;
        }, 450);
      }
      document.body.classList.remove('menu-open');
      docEl.classList.remove('menu-open');
      if (main && supportsInert) main.inert = false;

      if (lastFocus && typeof lastFocus.focus === 'function') {
        try {
          lastFocus.focus({ preventScroll: true });
        } catch (_) {
          lastFocus.focus();
        }
      }
    }

    function toggle() {
      isOpen ? close() : open();
    }

    on(trigger, 'click', toggle);
    on(closeBtn, 'click', close);
    on(overlay, 'click', close);

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
      var last = f[f.length - 1];
      var active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !menu.contains(active)) {
          e.preventDefault();
          try {
            last.focus({ preventScroll: true });
          } catch (_) {
            last.focus();
          }
        }
      } else {
        if (active === last) {
          e.preventDefault();
          try {
            first.focus({ preventScroll: true });
          } catch (_) {
            first.focus();
          }
        }
      }
    });

    // Auto-close on in-menu link click; runs before document-level smooth-nav
    // delegator (direct handlers fire before delegated ones in capture-less mode)
    $$('a[href]', menu).forEach(function (a) {
      on(a, 'click', function () {
        close();
      });
    });

    // Expose for other modules
    window.__emaMenu = {
      open: open,
      close: close,
      isOpen: function () {
        return isOpen;
      },
    };
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

    var hoverSel =
      'a, button, [role="button"], input, select, textarea, label, ' +
      '.chip, .faq-q, [data-cursor="hover"]';

    on(
      document,
      'pointermove',
      function (e) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      },
      { passive: true }
    );

    on(
      document,
      'pointerover',
      function (e) {
        var t = e.target;
        if (t && t.closest && t.closest(hoverSel)) cursor.classList.add('hover');
      },
      { passive: true }
    );

    on(
      document,
      'pointerout',
      function (e) {
        var t = e.target;
        if (t && t.closest && t.closest(hoverSel)) cursor.classList.remove('hover');
      },
      { passive: true }
    );

    on(document, 'mouseleave', function () {
      cursor.style.opacity = '0';
    });
    on(document, 'mouseenter', function () {
      cursor.style.opacity = '1';
    });
  }

  /* ──────────────────────────────────────────────────────────────────
     FAQ accordion — ARIA-driven, single-open, button-based triggers.
     ──────────────────────────────────────────────────────────────── */
  function initFAQ() {
    var items = $$('.faq-item');
    if (!items.length) return;

    items.forEach(function (item) {
      var btn = item.querySelector('button.faq-q[aria-controls]');
      if (!btn) return;
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      panel.hidden = btn.getAttribute('aria-expanded') !== 'true';
      on(btn, 'click', function () {
        var willOpen = btn.getAttribute('aria-expanded') !== 'true';
        // Single-open behavior — collapse all peers first
        items.forEach(function (other) {
          var ob = other.querySelector('button.faq-q[aria-controls]');
          if (!ob) return;
          ob.setAttribute('aria-expanded', 'false');
          other.classList.remove('open');
          var otherPanel = document.getElementById(ob.getAttribute('aria-controls'));
          if (otherPanel) otherPanel.hidden = true;
        });
        if (willOpen) {
          btn.setAttribute('aria-expanded', 'true');
          item.classList.add('open');
          if (panel) panel.hidden = false;
        }
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────────
     Talent filter — pressed buttons with arrow-key navigation.
     Nonmatching cards leave both the visual and accessibility trees.
     ──────────────────────────────────────────────────────────────── */
  function initTalentFilter() {
    var tablist = $('.talent-filters');
    var chips = $$('.talent-filters .chip');
    var cards = $$('.talent-card');
    var count = $('.talent-foot .count');
    if (!chips.length || !cards.length) return;

    var TOTAL = cards.length;

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
          card.hidden = false;
          visibleCount++;
        } else {
          card.hidden = true;
        }
      });
      if (count) {
        count.textContent =
          filter === 'all'
            ? 'Showing ' + visibleCount + ' of ' + TOTAL + ' featured profiles · names anonymized'
            : 'Showing ' + visibleCount + ' of ' + TOTAL + ' · filter: ' + filter;
      }
    }

    function select(chip) {
      chips.forEach(function (c) {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
        c.setAttribute('tabindex', '-1');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      chip.setAttribute('tabindex', '0');
      apply(chip.getAttribute('data-filter') || 'all');
    }

    chips.forEach(function (chip) {
      // Initial roving tabindex
      if (chip.getAttribute('aria-pressed') !== 'true') chip.setAttribute('tabindex', '-1');
      else chip.setAttribute('tabindex', '0');
      on(chip, 'click', function () {
        select(chip);
      });
    });

    on(tablist, 'keydown', function (e) {
      var i = chips.indexOf(document.activeElement);
      if (i < 0) return;
      var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowDown') {
        e.preventDefault();
        var next = chips[(i + 1) % chips.length];
        next.focus();
        select(next);
      } else if (k === 'ArrowLeft' || k === 'ArrowUp') {
        e.preventDefault();
        var prev = chips[(i - 1 + chips.length) % chips.length];
        prev.focus();
        select(prev);
      } else if (k === 'Home') {
        e.preventDefault();
        chips[0].focus();
        select(chips[0]);
      } else if (k === 'End') {
        e.preventDefault();
        var lastChip = chips[chips.length - 1];
        lastChip.focus();
        select(lastChip);
      }
    });
  }

  /* Forms prepare email drafts locally. A user sends the message in their email
     app; never claim delivery without a server acknowledgement. */
  function initForms() {
    // Remove sensitive drafts saved by older versions on a shared device.
    try {
      window.localStorage.removeItem('ema_apply_draft_v1');
    } catch (_) {
      /* Storage or focus may be unavailable in this browser. */
    }
    $$('form#apply-form, form#news-form').forEach(function (form) {
      on(form, 'submit', function (event) {
        prepareEmail(event, form);
      });
      $$('input, select, textarea', form).forEach(function (field) {
        if (field.type === 'hidden' || field.name === 'company') return;
        on(field, 'blur', function () {
          setFieldError(field, fieldMessage(field));
        });
        on(field, 'input', function () {
          if (field.getAttribute('aria-invalid') === 'true') {
            setFieldError(field, fieldMessage(field));
          }
        });
      });
    });
    var notes = $('#apply-form textarea[name="notes"]');
    var count = $('#notes-count');
    on(notes, 'input', function () {
      if (count) count.textContent = notes.value.length + ' / ' + notes.maxLength;
    });
    var card = $('#apply-success');
    var form = $('#apply-form');
    on($('#edit-application'), 'click', function () {
      if (!card || !form) return;
      card.hidden = true;
      form.hidden = false;
      var first = form.querySelector('input:not([type="hidden"]):not([name="company"])');
      if (first) first.focus();
    });
    on($('#copy-application'), 'click', function () {
      var text = $('#application-email-text');
      var status = $('#application-copy-status');
      if (!text) return;
      if (!navigator.clipboard || !window.isSecureContext) {
        text.focus();
        text.select();
        setStatus(status, '', 'Select and copy the application text above.');
        return;
      }
      navigator.clipboard
        .writeText(text.value)
        .then(function () {
          setStatus(
            status,
            'success',
            'Copied. Paste into an email and send it to join@elite-mgmt-agency.com.'
          );
        })
        .catch(function () {
          text.focus();
          text.select();
          setStatus(
            status,
            'error',
            'Clipboard access was unavailable. Copy the selected text manually.'
          );
        });
    });
  }

  function setStatus(node, kind, message) {
    if (!node) return;
    node.classList.remove('success', 'error');
    if (kind) node.classList.add(kind);
    node.textContent = message || '';
  }

  function setFieldError(field, message) {
    if (!field) return;
    var ids = (field.getAttribute('aria-describedby') || '').split(/\s+/);
    var error = ids
      .map(function (id) {
        return document.getElementById(id);
      })
      .find(function (node) {
        return node && node.classList.contains('field-error');
      });
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    if (error) error.textContent = message || '';
  }

  function fieldMessage(field) {
    if (field.disabled || field.type === 'hidden' || field.name === 'company') return '';
    if (field.type === 'checkbox') {
      return field.required && !field.checked ? 'Required to continue.' : '';
    }
    var value = field.value.trim();
    if (field.required && !value) return 'Required.';
    if (!field.validity.valid) return field.validationMessage;
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Use a valid email address.';
    }
    if (field.name === 'phone' && value && value.replace(/\D/g, '').length < 7) {
      return 'Include a country code, or leave blank.';
    }
    return '';
  }

  function prepareEmail(event, form) {
    event.preventDefault();
    var status = form.querySelector('.form-status');
    var firstInvalid = null;
    $$('input, select, textarea', form).forEach(function (field) {
      var message = fieldMessage(field);
      setFieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      setStatus(status, 'error', 'Please complete the highlighted fields.');
      firstInvalid.focus();
      return;
    }
    var trap = form.querySelector('[name="company"]');
    if (trap && trap.value) return;
    var data = {};
    new FormData(form).forEach(function (value, key) {
      data[key] = String(value).trim();
    });
    var application = form.id === 'apply-form';
    var recipient = form.getAttribute('data-mailto-fallback');
    if (!recipient) {
      setStatus(status, 'error', 'Please use the email contact link below.');
      return;
    }
    var subject = application
      ? 'Roster application — ' + data.first_name + ' ' + data.last_name
      : 'Request journal updates';
    var fields = application
      ? [
          ['First name', data.first_name],
          ['Last or stage name', data.last_name],
          ['Email', data.email],
          ['Phone', data.phone],
          ['Platform', data.platform],
          ['Monthly revenue range', data.revenue],
          ['Social', data.social],
          ['Track', data.track],
          ['Goals', data.notes],
          ['Consent', 'I confirm I am 18+ and have read the privacy policy and terms.'],
        ]
      : [
          ['Email', data.email],
          ['Request', 'Please add me to journal updates.'],
        ];
    var body = fields
      .filter(function (row) {
        return row[1];
      })
      .map(function (row) {
        return row[0] + ': ' + row[1];
      })
      .join('\n\n');
    var mailto =
      'mailto:' +
      recipient +
      '?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body);
    if (application) {
      var card = $('#apply-success');
      var link = $('#application-email-link');
      var text = $('#application-email-text');
      if (!card || !link || !text) return;
      text.value = body;
      // Long mailto URLs are unreliable across clients; copy remains available.
      link.href =
        mailto.length <= 7000
          ? mailto
          : 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject);
      setStatus(
        $('#application-copy-status'),
        '',
        mailto.length > 7000 ? 'Copy the application text into your email draft.' : ''
      );
      form.hidden = true;
      card.hidden = false;
      card.focus({ preventScroll: true });
      card.scrollIntoView({
        behavior: prefersReduced.matches ? 'auto' : 'smooth',
        block: 'center',
      });
    } else {
      setStatus(
        status,
        '',
        'Your request has not been sent. Open an email draft and press Send in your email app. '
      );
      var requestLink = document.createElement('a');
      requestLink.href = mailto;
      requestLink.textContent = 'Open email draft';
      status.appendChild(requestLink);
    }
  }

  /* ──────────────────────────────────────────────────────────────────
     Reveal — IntersectionObserver, one-shot unobserve.
     ──────────────────────────────────────────────────────────────── */
  function initReveal() {
    var els = $$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || prefersReduced.matches) {
      els.forEach(function (el) {
        el.classList.add('in');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
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
      try {
        target.focus({ preventScroll: true });
      } catch (_) {
        target.focus();
      }
      if (!hadTabindex) {
        target.addEventListener('blur', function strip() {
          target.removeAttribute('tabindex');
          target.removeEventListener('blur', strip);
        });
      }

      // Clean URL without polluting history
      try {
        history.replaceState(null, '', '#' + id);
      } catch (_) {
        /* SecurityError in some sandboxes */
      }
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
