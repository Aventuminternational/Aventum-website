/* Aventum International — site behaviour */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ------------------------------------------------------------------
     Language
     ------------------------------------------------------------------ */
  var META = {
    en: {
      title: document.title,
      description: (document.querySelector('meta[name="description"]') || {}).content || ''
    },
    cn: {
      title: 'Aventum International | 巴西 ICUMSA 45 白砂糖经纪 · 对接中国进口商',
      description: 'Aventum International 总部位于阿姆斯特丹，为中国进口商对接巴西 ICUMSA 45 精制白砂糖供应商。标准条款为巴西港口 FOB，亦可按需报指定目的港 CIF 价格。'
    }
  };
  // Privacy page provides its own titles
  if (document.body.dataset.titleCn) {
    META.cn.title = document.body.dataset.titleCn;
    META.cn.description = document.body.dataset.descriptionCn || META.cn.description;
  }

  var MSG = {
    en: {
      sending: 'Sending…',
      success: 'Thank you, your enquiry has been sent. We will reply within 48 hours.',
      error: 'Something went wrong. Please try again, or email us at <a href="mailto:info@aventuminternational.com">info@aventuminternational.com</a>.',
      required: 'Please fill in your name and a valid email address.',
      openMenu: 'Open menu',
      closeMenu: 'Close menu'
    },
    cn: {
      sending: '正在发送…',
      success: '感谢您的询价，我们已收到，将在 48 小时内回复。',
      error: '发送失败。请重试，或直接发送邮件至 <a href="mailto:info@aventuminternational.com">info@aventuminternational.com</a>。',
      required: '请填写您的姓名和有效的电子邮箱地址。',
      openMenu: '打开菜单',
      closeMenu: '关闭菜单'
    }
  };

  function currentLang() { return root.lang === 'zh-CN' ? 'cn' : 'en'; }

  function setLang(lang) {
    var isCn = lang === 'cn';
    root.lang = isCn ? 'zh-CN' : 'en';

    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    document.querySelectorAll('[data-ph-en]').forEach(function (el) {
      el.placeholder = el.dataset['ph' + (isCn ? 'Cn' : 'En')];
    });
    document.querySelectorAll('[data-aria-en]').forEach(function (el) {
      el.setAttribute('aria-label', el.dataset['aria' + (isCn ? 'Cn' : 'En')]);
    });
    document.querySelectorAll('[data-alt-en]').forEach(function (el) {
      el.alt = el.dataset['alt' + (isCn ? 'Cn' : 'En')];
    });
    document.querySelectorAll('option[data-en]').forEach(function (el) {
      el.textContent = el.dataset[isCn ? 'cn' : 'en'];
    });
    document.querySelectorAll('[data-href-cn]').forEach(function (el) {
      if (!el.dataset.hrefEn) el.dataset.hrefEn = el.getAttribute('href');
      el.setAttribute('href', isCn ? el.dataset.hrefCn : el.dataset.hrefEn);
    });

    document.title = META[lang].title;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.content = META[lang].description;

    var langField = document.getElementById('f-language');
    if (langField) langField.value = isCn ? 'zh-CN' : 'en';

    var toggle = document.getElementById('menu-toggle');
    if (toggle) toggle.setAttribute('aria-label', MSG[lang][toggle.getAttribute('aria-expanded') === 'true' ? 'closeMenu' : 'openMenu']);

    try { localStorage.setItem('aventum-lang', lang); } catch (e) {}
    try {
      var url = new URL(location.href);
      if (isCn) url.searchParams.set('lang', 'zh'); else url.searchParams.delete('lang');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) {}

    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }
  window.setLang = setLang;

  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang); });
  });
  setLang(currentLang());

  /* ------------------------------------------------------------------
     Header: scrolled state, mobile menu, active section
     ------------------------------------------------------------------ */
  var header = document.getElementById('site-header');
  var backTop = document.getElementById('back-to-top');
  var forceSolid = header && header.hasAttribute('data-solid');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', forceSolid || y > 40);
    if (backTop) backTop.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var skip = document.querySelector('.brand');
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  var toggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', MSG[currentLang()][open ? 'closeMenu' : 'openMenu']);
    header.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () {
        menu.classList.add('is-open');
        var first = menu.querySelector('a');
        if (first) first.focus();
      });
    } else {
      menu.classList.remove('is-open');
      setTimeout(function () { if (toggle.getAttribute('aria-expanded') === 'false') menu.hidden = true; }, 260);
    }
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080 && toggle.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }

  // Highlight the nav item of the section in view
  var navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
  if (hasIO && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = byId[en.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { navObs.observe(s); });
  }

  /* ------------------------------------------------------------------
     Hero video: two clips alternate; skipped for reduced motion / data saver
     ------------------------------------------------------------------ */
  var video = document.getElementById('hero-video');
  var saveData = navigator.connection && navigator.connection.saveData;
  if (video && !reduceMotion && !saveData) {
    var sources = (video.dataset.sources || '').split(',');
    var idx = 0, heroVisible = true;
    var play = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
    video.muted = true;
    video.src = sources[0];
    video.preload = 'auto';
    play();
    video.addEventListener('ended', function () {
      idx = (idx + 1) % sources.length;
      video.src = sources[idx];
      play();
    });
    // Some mobile browsers only allow playback after a user gesture
    ['touchstart', 'click'].forEach(function (evt) {
      document.addEventListener(evt, function () { if (video.paused && heroVisible) play(); }, { once: true, passive: true });
    });
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) play(); else video.pause();
      }).observe(video);
    }
  }

  /* ------------------------------------------------------------------
     Scroll reveal + count-up
     ------------------------------------------------------------------ */
  var reveals = document.querySelectorAll('.reveal');
  if (hasIO && !reduceMotion) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); revObs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  if (hasIO && !reduceMotion) {
    var cntObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cntObs.unobserve(en.target);
        var el = en.target, target = parseInt(el.dataset.count, 10), t0 = performance.now();
        (function tick(now) {
          var p = Math.min((now - t0) / 1600, 1);
          el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = '0'; cntObs.observe(el); });
  }

  /* ------------------------------------------------------------------
     Route map (canvas): hubs with radar pulses, sea route drawn along
     the Cape of Good Hope, dotted coordination lines from Amsterdam.
     ------------------------------------------------------------------ */
  (function () {
    var frame = document.getElementById('map-frame');
    var canvas = document.getElementById('map-canvas');
    var replayBtn = document.getElementById('map-replay');
    if (!frame || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');

    var GREEN = '50,255,100';
    // Positions as fractions of the map image (1661 × 866)
    var HUBS = {
      br: { p: [0.322, 0.700], en: ['Brazil', 'Santos / Paranaguá'], cn: ['巴西', '桑托斯 / 巴拉那瓜'], pos: 'left' },
      am: { p: [0.469, 0.218], en: ['Amsterdam', 'Aventum International'], cn: ['阿姆斯特丹', 'Aventum International'], pos: 'left' },
      ch: { p: [0.822, 0.360], en: ['China', 'Destination port'], cn: ['中国', '目的港'], pos: 'right' }
    };
    var ROUTE = [[0.322, 0.700], [0.40, 0.790], [0.515, 0.872], [0.62, 0.800], [0.715, 0.672], [0.778, 0.598], [0.816, 0.530], [0.838, 0.445], [0.836, 0.395], [0.822, 0.360]];

    var W = 0, H = 0, dpr = 1, path = [], total = 0;
    var running = false, rafId = 0, rings = { br: [], am: [], ch: [] };

    function catmull(pts, segs) {
      var out = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        for (var t = 0; t < 1; t += 1 / segs) {
          var t2 = t * t, t3 = t2 * t;
          out.push([
            0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
            0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
          ]);
        }
      }
      out.push(pts[pts.length - 1]);
      return out;
    }

    function resize() {
      var r = frame.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      path = catmull(ROUTE, 24).map(function (q) { return [q[0] * W, q[1] * H]; });
      total = 0;
      for (var i = 1; i < path.length; i++) total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    }

    function pointAt(frac) { // point at a fraction of the route length
      var target = frac * total, acc = 0;
      for (var i = 1; i < path.length; i++) {
        var seg = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
        if (acc + seg >= target) {
          var k = seg ? (target - acc) / seg : 0;
          return { i: i, x: path[i - 1][0] + (path[i][0] - path[i - 1][0]) * k, y: path[i - 1][1] + (path[i][1] - path[i - 1][1]) * k };
        }
        acc += seg;
      }
      var last = path[path.length - 1];
      return { i: path.length - 1, x: last[0], y: last[1] };
    }

    function ease(t) { t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, 3); }
    function hubXY(k) { return [HUBS[k].p[0] * W, HUBS[k].p[1] * H]; }

    function drawLabel(k, alpha) {
      if (alpha <= 0) return;
      var h = HUBS[k], xy = hubXY(k), lang = currentLang();
      var small = W < 560;
      var fs1 = Math.round(Math.max(11, Math.min(15, W * 0.0135)));
      var fs2 = Math.round(fs1 * 0.82);
      var family = '"DM Sans","PingFang SC","Microsoft YaHei",system-ui,sans-serif';
      var l1 = h[lang][0], l2 = small ? '' : h[lang][1];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '600 ' + fs1 + 'px ' + family;
      var w1 = ctx.measureText(l1).width;
      ctx.font = '400 ' + fs2 + 'px ' + family;
      var w2 = l2 ? ctx.measureText(l2).width : 0;
      var pad = small ? 6 : 9;
      var bw = Math.max(w1, w2) + pad * 2;
      var bh = l2 ? fs1 + fs2 + pad * 2 + 4 : fs1 + pad * 2;
      var gap = small ? 10 : 16;
      var pos = small && k === 'ch' ? 'top' : h.pos;
      var bx, by;
      if (pos === 'left') { bx = xy[0] - bw - gap; by = xy[1] - bh / 2; }
      else if (pos === 'right') { bx = xy[0] + gap; by = xy[1] - bh / 2; }
      else { bx = xy[0] - bw / 2; by = xy[1] - bh - gap; }
      bx = Math.max(4, Math.min(W - bw - 4, bx));
      by = Math.max(4, Math.min(H - bh - 4, by));
      ctx.fillStyle = 'rgba(8,8,8,.88)';
      ctx.strokeStyle = 'rgba(' + GREEN + ',.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 6); else ctx.rect(bx, by, bw, bh);
      ctx.fill(); ctx.stroke();
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#fff';
      ctx.font = '600 ' + fs1 + 'px ' + family;
      ctx.fillText(l1, bx + pad, by + pad + fs1 * 0.9);
      if (l2) {
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.font = '400 ' + fs2 + 'px ' + family;
        ctx.fillText(l2, bx + pad, by + pad + fs1 + 4 + fs2 * 0.9);
      }
      ctx.restore();
    }

    function drawDot(k, alpha) {
      var xy = hubXY(k);
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(xy[0], xy[1], 11, 0, Math.PI * 2); ctx.fillStyle = 'rgba(' + GREEN + ',.14)'; ctx.fill();
      ctx.beginPath(); ctx.arc(xy[0], xy[1], 4.5, 0, Math.PI * 2); ctx.fillStyle = 'rgb(' + GREEN + ')'; ctx.fill();
      ctx.restore();
    }

    function drawCoord(from, to, prog) {
      if (prog <= 0) return;
      var a = hubXY(from), b = hubXY(to);
      var mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - H * 0.06;
      ctx.save();
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,.45)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      var steps = 40, n = Math.round(steps * prog);
      for (var i = 0; i <= n; i++) {
        var t = i / steps;
        var x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mx + t * t * b[0];
        var y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * my + t * t * b[1];
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawRoute(prog) {
      if (prog <= 0) return;
      var end = pointAt(prog);
      ctx.save();
      ctx.strokeStyle = 'rgba(' + GREEN + ',.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (var i = 1; i < end.i; i++) ctx.lineTo(path[i][0], path[i][1]);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.restore();
      return end;
    }

    function drawShip(frac) {
      var p = pointAt(frac);
      ctx.save();
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
      g.addColorStop(0, 'rgba(' + GREEN + ',.55)'); g.addColorStop(1, 'rgba(' + GREEN + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Timeline (ms)
    var T = { labels: 300, labelDur: 900, radar: 500, coord: 900, coordDur: 1400, route: 1300, routeDur: 3200, calm: 4800, calmDur: 3000, ship: 4700, shipLoop: 7000 };

    function render(e) {
      ctx.clearRect(0, 0, W, H);
      var labelA = ease((e - T.labels) / T.labelDur);
      var calm = ease((e - T.calm) / T.calmDur);
      var scale = Math.max(0.45, Math.min(1, W / 1100));
      var interval = 420 + calm * 680, maxR = (54 - calm * 22) * scale, dur = 1800 + calm * 900, baseA = 0.75 - calm * 0.33;

      if (e > T.radar) {
        Object.keys(rings).forEach(function (k) {
          var list = rings[k], last = list.length ? list[list.length - 1].t : -1e9;
          if (e - last > interval) list.push({ t: e, dur: dur, maxR: maxR, a: baseA });
          rings[k] = list.filter(function (r) { return e - r.t < r.dur; });
        });
      }
      Object.keys(rings).forEach(function (k) {
        var xy = hubXY(k);
        rings[k].forEach(function (r) {
          var age = (e - r.t) / r.dur;
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 7 + age * r.maxR, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(' + GREEN + ',' + ((1 - age) * r.a).toFixed(3) + ')';
          ctx.lineWidth = 1.3; ctx.stroke();
        });
      });

      var cp = ease((e - T.coord) / T.coordDur);
      drawCoord('am', 'br', cp);
      drawCoord('am', 'ch', cp);
      drawRoute(ease((e - T.route) / T.routeDur));
      if (e > T.ship) drawShip(((e - T.ship) % T.shipLoop) / T.shipLoop);

      if (labelA > 0) { drawDot('br', labelA); drawDot('am', labelA); drawDot('ch', labelA); }
      drawLabel('br', labelA); drawLabel('am', labelA); drawLabel('ch', labelA);

      if (replayBtn && e > T.calm && !replayBtn.classList.contains('is-visible')) replayBtn.classList.add('is-visible');
    }

    // Elapsed time only advances while the map is on screen, so it resumes where it left off
    var elapsed = 0, lastTs = null;
    function loop(ts) {
      if (!running) return;
      if (lastTs !== null) elapsed += Math.min(ts - lastTs, 100);
      lastTs = ts;
      render(elapsed);
      rafId = requestAnimationFrame(loop);
    }
    function start(fromZero) {
      if (fromZero) { elapsed = 0; rings = { br: [], am: [], ch: [] }; if (replayBtn) replayBtn.classList.remove('is-visible'); }
      if (running) return;
      running = true; lastTs = null; rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false; cancelAnimationFrame(rafId);
    }

    function drawStatic() { // reduced motion: final state, no animation
      rings = { br: [], am: [], ch: [] };
      ctx.clearRect(0, 0, W, H);
      drawCoord('am', 'br', 1); drawCoord('am', 'ch', 1); drawRoute(1);
      ['br', 'am', 'ch'].forEach(function (k) { drawDot(k, 1); drawLabel(k, 1); });
    }

    resize();
    var started = false;
    window.addEventListener('resize', function () { resize(); if (reduceMotion) drawStatic(); });
    document.addEventListener('langchange', function () {
      if (reduceMotion || !hasIO) drawStatic();
      else if (started && !running) render(elapsed);
    });
    var img = frame.querySelector('img');
    if (img && !img.complete) img.addEventListener('load', function () { resize(); if (reduceMotion) drawStatic(); });

    if (reduceMotion || !hasIO) { drawStatic(); return; }

    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { resize(); if (!started) { started = true; start(true); } else start(false); }
      else stop();
    }, { threshold: 0.35 }).observe(frame);

    if (replayBtn) replayBtn.addEventListener('click', function () { stop(); start(true); });
  })();

  /* ------------------------------------------------------------------
     Contact form (Formspree, posted with fetch; action URL is the single source)
     ------------------------------------------------------------------ */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var btn = document.getElementById('form-submit');
    var btnHTML = btn.innerHTML;
    var showStatus = function (type, html) {
      status.className = 'form-status is-' + type;
      status.innerHTML = html;
      status.setAttribute('role', type === 'error' ? 'alert' : 'status');
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lang = currentLang();
      var name = form.elements.name, email = form.elements.email;
      var invalid = [name, email].filter(function (el) { return !el.value.trim() || !el.checkValidity(); });
      [name, email].forEach(function (el) { el.setAttribute('aria-invalid', String(invalid.indexOf(el) > -1)); });
      if (invalid.length) { showStatus('error', MSG[lang].required); invalid[0].focus(); return; }

      btn.disabled = true;
      btn.textContent = MSG[lang].sending;
      status.className = 'form-status';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.reset();
          setLang(currentLang()); // restores translated option labels + language field after reset
          showStatus('success', MSG[lang].success);
        })
        .catch(function () { showStatus('error', MSG[lang].error); })
        .then(function () { btn.disabled = false; btn.innerHTML = btnHTML; });
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
