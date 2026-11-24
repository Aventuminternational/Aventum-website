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
      title: 'Aventum International | 巴西 ICUMSA 45 白砂糖经纪',
      description: 'Aventum International 总部位于阿姆斯特丹，为中国及其他市场的进口商对接巴西 ICUMSA 45 精制白砂糖供应商。标准条款为巴西港口 FOB，亦可按需报指定目的港 CIF 价格。'
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

  var langLock = root.hasAttribute('data-lang-lock');

  function setLang(lang) {
    // The static Chinese page (/zh/) only contains Chinese text: switching to English opens the main page
    if (langLock && lang !== 'cn') { location.href = '/?lang=en' + location.hash; return; }
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
    if (!langLock) try {
      var url = new URL(location.href);
      if (isCn) url.searchParams.set('lang', 'zh'); else url.searchParams.delete('lang');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) {}

    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }
  window.setLang = setLang;

  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!langLock && b.dataset.lang === 'cn' && document.body.hasAttribute('data-zh-page')) {
        location.href = '/zh/' + location.hash; return;
      }
      setLang(b.dataset.lang);
    });
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
  var media = document.getElementById('hero-media');
  var vids = media ? media.querySelectorAll('.hero-video') : [];
  var saveData = navigator.connection && navigator.connection.saveData;
  if (vids.length === 2 && !reduceMotion && !saveData) {
    var sources = (media.dataset.sources || '').split(',');
    var FADE = 1.6; // seconds, matches the CSS opacity transition
    var cur = 0, clip = 0, fading = false, heroVisible = true;
    var play = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    var load = function (v, src) { if (v.getAttribute('src') !== src) { v.src = src; v.preload = 'auto'; } };

    var crossfade = function () {
      if (fading) return;
      fading = true;
      var from = vids[cur], to = vids[1 - cur];
      try { to.currentTime = 0; } catch (e) {}
      play(to);
      to.classList.add('is-active');
      from.classList.remove('is-active');
      setTimeout(function () {
        from.pause();
        clip = (clip + 1) % sources.length;
        cur = 1 - cur;
        load(from, sources[(clip + 1) % sources.length]); // preload the clip after next
        fading = false;
      }, FADE * 1000);
    };

    Array.prototype.forEach.call(vids, function (v) {
      v.muted = true;
      v.addEventListener('timeupdate', function () {
        if (v === vids[cur] && v.duration && v.duration - v.currentTime < FADE + 0.15) crossfade();
      });
      v.addEventListener('ended', function () { if (v === vids[cur]) crossfade(); });
    });
    load(vids[0], sources[0]);
    load(vids[1], sources[1 % sources.length]);
    play(vids[0]);

    // Some mobile browsers only allow playback after a user gesture
    ['touchstart', 'click'].forEach(function (evt) {
      document.addEventListener(evt, function () { if (vids[cur].paused && heroVisible) play(vids[cur]); }, { once: true, passive: true });
    });
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) play(vids[cur]); else vids[cur].pause();
      }).observe(media);
    }
  }

  // Hero content eases out as the page scrolls
  var heroContent = document.querySelector('.hero-content');
  if (heroContent && !reduceMotion) {
    var ticking = false;
    var onScroll = function () {
      ticking = false;
      var h = window.innerHeight || 1;
      var p = Math.min(Math.max(window.scrollY / (h * 0.7), 0), 1);
      heroContent.style.opacity = String(1 - p * 0.85);
      heroContent.style.transform = p ? 'translate3d(0,' + (p * -40).toFixed(1) + 'px,0)' : '';
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Scroll reveal + count-up
     ------------------------------------------------------------------ */
  var reveals = document.querySelectorAll('.reveal, .photo-band');
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
     Voyage map (canvas): dot-matrix world map built from the land
     silhouette, sea route via the Cape of Good Hope and Malacca, a ship
     that lights up the coast it passes, coordination arcs from Amsterdam.
     The stage list under the map follows the ship.
     ------------------------------------------------------------------ */
  (function () {
    var frame = document.getElementById('map-frame');
    var canvas = document.getElementById('map-canvas');
    var img = document.getElementById('map-img');
    var replayBtn = document.getElementById('map-replay');
    var steps = Array.prototype.slice.call(document.querySelectorAll('#voyage-steps li'));
    if (!frame || !canvas || !canvas.getContext || !img) return;
    var ctx = canvas.getContext('2d');

    var IMG_ASPECT = 1661 / 866;
    var G = '50,255,100';
    var HUBS = {
      br: { p: [0.322, 0.700], en: ['Brazil', 'Santos · Paranaguá'], cn: ['巴西', '桑托斯 · 巴拉那瓜'], side: 'left' },
      am: { p: [0.469, 0.218], en: ['Amsterdam', 'Aventum International'], cn: ['阿姆斯特丹', 'Aventum International'], side: 'top' },
      ch: { p: [0.822, 0.360], en: ['China', 'Destination port'], cn: ['中国', '目的港'], side: 'right' }
    };
    var WAYPOINTS = [
      { p: [0.515, 0.872], at: 0.36, en: 'Cape of Good Hope', cn: '好望角' },
      { p: [0.778, 0.598], at: 0.72, en: 'Strait of Malacca', cn: '马六甲海峡' }
    ];
    var ROUTE = [[0.322, 0.700], [0.40, 0.790], [0.515, 0.872], [0.62, 0.800], [0.715, 0.672], [0.778, 0.598], [0.816, 0.530], [0.838, 0.445], [0.836, 0.395], [0.822, 0.360]];

    var TRAVEL = 10000, HOLD = 3200, FADE = 900;
    var W = 0, H = 0, dpr = 1, u0 = 0, uw = 1, spacing = 7;
    var dots = [], path = [], cum = [], total = 0, staticLayer = null, alpha = null, AW = 0, AH = 0;
    var running = false, visible = false, rafId = 0, startTs = 0, pausedAt = 0, done = false;
    var font = getComputedStyle(document.body).fontFamily;
    var mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

    function lang() { return document.documentElement.lang === 'zh-CN' ? 'cn' : 'en'; }
    function X(u) { return (u - u0) / uw * W; }
    function Y(v) { return v * H; }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

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

    // Land mask sampled once from the silhouette image
    function buildAlpha() {
      AW = 900; AH = Math.round(AW / IMG_ASPECT);
      var c = document.createElement('canvas'); c.width = AW; c.height = AH;
      var x = c.getContext('2d');
      x.drawImage(img, 0, 0, AW, AH);
      try { alpha = x.getImageData(0, 0, AW, AH).data; } catch (e) { alpha = null; }
    }
    function land(u, v) {
      if (!alpha || u < 0 || u > 1 || v < 0 || v > 1) return false;
      var i = ((Math.min(AH - 1, Math.floor(v * AH)) * AW) + Math.min(AW - 1, Math.floor(u * AW))) * 4 + 3;
      return alpha[i] > 90;
    }

    function resize() {
      var r = frame.getBoundingClientRect();
      if (!r.width) return;
      W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      // Narrow frames show the part of the map that holds the route
      var a = W / H;
      uw = Math.min(1, a / IMG_ASPECT);
      u0 = Math.min(Math.max(0.585 - uw / 2, 0), 1 - uw);
      spacing = Math.max(4.5, Math.min(8, W / 165));

      path = catmull(ROUTE, 24).map(function (p) { return [X(p[0]), Y(p[1])]; });
      cum = [0]; total = 0;
      for (var i = 1; i < path.length; i++) {
        total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
        cum.push(total);
      }

      dots = [];
      if (alpha) {
        for (var y = spacing / 2; y < H; y += spacing) {
          for (var x = spacing / 2; x < W; x += spacing) {
            if (land(u0 + x / W * uw, y / H)) dots.push(x, y);
          }
        }
      }
      staticLayer = document.createElement('canvas');
      staticLayer.width = canvas.width; staticLayer.height = canvas.height;
      var s = staticLayer.getContext('2d');
      s.setTransform(dpr, 0, 0, dpr, 0, 0);
      var rad = spacing * 0.24;
      for (var k = 0; k < dots.length; k += 2) {
        // dots fade slightly towards the edges for depth
        var dx = (dots[k] / W - 0.55), dy = (dots[k + 1] / H - 0.45);
        var fall = Math.max(0.35, 1 - Math.sqrt(dx * dx + dy * dy) * 0.9);
        s.fillStyle = 'rgba(255,255,255,' + (0.2 * fall).toFixed(3) + ')';
        s.beginPath(); s.arc(dots[k], dots[k + 1], rad, 0, 6.2832); s.fill();
      }
      if (dots.length) frame.classList.add('has-dots');
      if (!running) draw(done || reduceMotion ? 1 : 0, 0, performance.now());
    }

    function pointAt(d) {
      if (d <= 0) return path[0];
      if (d >= total) return path[path.length - 1];
      var lo = 0, hi = cum.length - 1;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cum[mid] < d) lo = mid; else hi = mid; }
      var f = (d - cum[lo]) / (cum[hi] - cum[lo] || 1);
      return [path[lo][0] + (path[hi][0] - path[lo][0]) * f, path[lo][1] + (path[hi][1] - path[lo][1]) * f];
    }

    function strokeRoute(upTo) {
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (var i = 1; i < path.length && cum[i] <= upTo; i++) ctx.lineTo(path[i][0], path[i][1]);
      var e = pointAt(upTo); ctx.lineTo(e[0], e[1]);
    }

    function label(x, y, title, sub, side, a) {
      var fs = W < 520 ? 11 : 13;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = '600 ' + fs + 'px ' + font;
      var tw = ctx.measureText(title).width;
      ctx.font = (fs - 3) + 'px ' + mono;
      var sw = sub ? ctx.measureText(sub.toUpperCase()).width : 0;
      var bw = Math.max(tw, sw), gap = 14, lx, ly;
      if (side === 'left') { lx = x - gap - bw; ly = y + 4; }
      else if (side === 'right') { lx = x + gap; ly = y + 4; }
      else { lx = x - bw / 2; ly = y - gap - (sub ? fs + 2 : 0); }
      // flip to the other side when a label would run off the canvas
      if (side === 'right' && lx + bw > W - 8) lx = x - gap - bw;
      if (side === 'left' && lx < 8) lx = x + gap;
      lx = Math.max(8, Math.min(W - bw - 8, lx));
      ly = Math.max(fs + 6, Math.min(H - (sub ? fs + 4 : 4), ly));
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = '600 ' + fs + 'px ' + font;
      ctx.fillText(title, lx, ly);
      if (sub) {
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.font = (fs - 3) + 'px ' + mono;
        ctx.fillText(sub.toUpperCase(), lx, ly + fs + 1);
      }
      ctx.restore();
    }

    function hub(key, now, color, a) {
      var h = HUBS[key], x = X(h.p[0]), y = Y(h.p[1]);
      var ph = ((now / 2600) + (key === 'ch' ? 0.5 : key === 'am' ? 0.25 : 0)) % 1;
      ctx.save();
      ctx.globalAlpha = a;
      if (!reduceMotion) {
        ctx.strokeStyle = 'rgba(' + color + ',' + (0.5 * (1 - ph)).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, 5 + ph * 22, 0, 6.2832); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(' + color + ',.18)';
      ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgb(' + color + ')';
      ctx.beginPath(); ctx.arc(x, y, 3.6, 0, 6.2832); ctx.fill();
      ctx.restore();
      var t = h[lang()];
      label(x, y, t[0], t[1], h.side, a);
    }

    function arc(from, to, now, a) {
      var x1 = X(from[0]), y1 = Y(from[1]), x2 = X(to[0]), y2 = Y(to[1]);
      var cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.18;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.setLineDash([3, 6]);
      ctx.lineDashOffset = reduceMotion ? 0 : -now / 60;
      ctx.strokeStyle = 'rgba(255,255,255,.32)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
      ctx.restore();
    }

    // p: route progress 0..1, fade: 0..1 fade-out of the travelled line
    function draw(p, fade, now) {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (staticLayer) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(staticLayer, 0, 0); ctx.restore(); }

      var head = pointAt(p * total), lineA = 1 - fade;

      // coast lit up around the ship
      if (p > 0 && p < 1 && dots.length) {
        var R = spacing * 9, rad = spacing * 0.3;
        for (var k = 0; k < dots.length; k += 2) {
          var dx = dots[k] - head[0], dy = dots[k + 1] - head[1];
          if (dx > R || dx < -R || dy > R || dy < -R) continue;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d > R) continue;
          ctx.fillStyle = 'rgba(' + G + ',' + (0.75 * (1 - d / R)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(dots[k], dots[k + 1], rad, 0, 6.2832); ctx.fill();
        }
      }

      arc(HUBS.am.p, HUBS.br.p, now, 1);
      arc(HUBS.am.p, HUBS.ch.p, now, 1);

      // full route, faint
      ctx.save();
      ctx.setLineDash([1.5, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,.22)';
      ctx.lineWidth = 1.2;
      strokeRoute(total);
      ctx.stroke();
      ctx.restore();

      // travelled route
      if (p > 0 && lineA > 0) {
        var grad = ctx.createLinearGradient(path[0][0], path[0][1], head[0], head[1]);
        grad.addColorStop(0, 'rgba(' + G + ',.15)');
        grad.addColorStop(1, 'rgba(' + G + ',1)');
        ctx.save();
        ctx.globalAlpha = lineA;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(' + G + ',.12)'; ctx.lineWidth = 7;
        strokeRoute(p * total); ctx.stroke();
        ctx.strokeStyle = grad; ctx.lineWidth = 2;
        strokeRoute(p * total); ctx.stroke();
        ctx.restore();
      }

      // waypoints
      WAYPOINTS.forEach(function (w) {
        var wa = Math.max(0, Math.min(1, (p - w.at) / 0.06)) * lineA;
        if (reduceMotion) wa = 1;
        if (wa <= 0) return;
        var x = X(w.p[0]), y = Y(w.p[1]);
        ctx.save();
        ctx.globalAlpha = wa;
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1;
        var below = y + 34 < H, dir = below ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(x, y + 5 * dir); ctx.lineTo(x, y + 14 * dir); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.font = (W < 520 ? 8 : 10) + 'px ' + mono;
        var t = w[lang()].toUpperCase(), tw = ctx.measureText(t).width;
        ctx.fillText(t, Math.max(6, Math.min(W - tw - 6, x - tw / 2)), below ? y + 26 : y - 19);
        ctx.restore();
      });

      hub('am', now, '255,255,255', 1);
      hub('br', now, G, 1);
      hub('ch', now, G, 1);

      // ship
      if (p > 0 && p < 1) {
        var g = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 22);
        g.addColorStop(0, 'rgba(' + G + ',.55)'); g.addColorStop(1, 'rgba(' + G + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(head[0], head[1], 22, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#eafff0';
        ctx.beginPath(); ctx.arc(head[0], head[1], 3.2, 0, 6.2832); ctx.fill();
      }

      // stage list
      var cur = -1;
      steps.forEach(function (li, i) {
        var on = p >= parseFloat(li.dataset.at || 0) && (p > 0 || i === 0) && lineA > 0.2;
        li.classList.toggle('is-active', on);
        if (on) cur = i;
      });
      steps.forEach(function (li, i) { li.classList.toggle('is-current', i === cur); });
    }

    function loop(now) {
      if (!running) return;
      var t = now - startTs, p, fade = 0;
      if (t < TRAVEL) p = ease(t / TRAVEL);
      else if (t < TRAVEL + HOLD) { p = 1; if (!done) { done = true; if (replayBtn) replayBtn.classList.add('is-visible'); } }
      else if (t < TRAVEL + HOLD + FADE) { p = 1; fade = (t - TRAVEL - HOLD) / FADE; }
      else { startTs = now; p = 0; }
      draw(p, fade, now);
      rafId = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reduceMotion) return;
      running = true;
      var now = performance.now();
      startTs = pausedAt ? now - pausedAt : now;
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      if (!running) return;
      running = false;
      pausedAt = performance.now() - startTs;
      cancelAnimationFrame(rafId);
    }

    function init() {
      buildAlpha();
      resize();
      if (reduceMotion) { draw(1, 0, 0); steps.forEach(function (li) { li.classList.add('is-active'); }); return; }
      if (hasIO) {
        new IntersectionObserver(function (en) {
          visible = en[0].isIntersecting;
          if (visible) start(); else stop();
        }, { threshold: 0.25 }).observe(frame);
      } else start();
    }

    if (img.complete && img.naturalWidth) init();
    else img.addEventListener('load', init, { once: true });

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    document.addEventListener('langchange', function () { if (!running) draw(done || reduceMotion ? 1 : 0, 0, performance.now()); });
    if (replayBtn) replayBtn.addEventListener('click', function () { pausedAt = 0; startTs = performance.now(); if (!running && visible) start(); });
  })();

  /* ------------------------------------------------------------------
     Process timeline: the line fills as you scroll through the steps
     ------------------------------------------------------------------ */
  (function () {
    var tl = document.getElementById('timeline');
    if (!tl) return;
    var items = tl.querySelectorAll('.tl-step');
    if (reduceMotion) { tl.style.setProperty('--tl-progress', 1); items.forEach(function (s) { s.classList.add('is-passed'); }); return; }
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight, mark = vh * 0.62, r = tl.getBoundingClientRect();
      var p = Math.min(Math.max((mark - r.top) / r.height, 0), 1);
      tl.style.setProperty('--tl-progress', p.toFixed(4));
      items.forEach(function (s) { s.classList.toggle('is-passed', s.getBoundingClientRect().top + 40 < mark); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* Product links preselect the product in the enquiry form */
  document.querySelectorAll('[data-product]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.getElementById('f-product');
      if (sel) sel.value = a.dataset.product;
    });
  });


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
