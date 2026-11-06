/* ==========================================================================
   M.A Soluções — main.js
   01. Preloader   02. Animações de entrada   03. Header & link ativo
   04. Menu mobile 05. Cursor customizado      06. Circuitos no hero
   07. Trilhas de conexão entre cards
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* 01. Preloader ----------------------------------------------------------
     A porcentagem, a barra e o traço do logo andam juntos. O tempo mínimo
     garante a animação; sem o evento "load" o progresso para em 90%. */
  function initPreloader(onDone) {
    const el = document.getElementById('preloader');
    if (!el) return onDone();

    const count = document.getElementById('preloader-count');
    const bar = document.getElementById('preloader-bar');
    const paths = [...el.querySelectorAll('.preloader__logo path')];
    // Fatia do progresso que cada traço ocupa (M, A, barra do A)
    const segments = [[0, 0.55], [0.55, 0.9], [0.9, 1]];

    const minDuration = reduceMotion ? 300 : 2200;
    const start = performance.now();
    let loaded = document.readyState === 'complete';
    let shown = 0;

    document.body.classList.add('is-locked');
    window.addEventListener('load', () => { loaded = true; }, { once: true });
    setTimeout(() => { loaded = true; }, 7000); // nunca segura o usuário por muito tempo

    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function render(p) {
      count.textContent = `${Math.round(p * 100)}%`;
      bar.style.transform = `scaleX(${p})`;
      paths.forEach((path, i) => {
        const [a, b] = segments[i];
        const local = clamp((p - a) / (b - a), 0, 1);
        path.style.strokeDashoffset = 1 - local;
        path.style.opacity = local > 0 ? 1 : 0; // esconde o ponto da ponta arredondada em 0%
      });
    }

    function frame() {
      const now = performance.now();
      const timeProgress = easeInOut(clamp((now - start) / minDuration, 0, 1));
      const target = loaded ? timeProgress : Math.min(timeProgress, 0.9);
      shown += (target - shown) * 0.2;
      if (target === 1 && shown > 0.995) shown = 1;
      render(shown);

      if (shown < 1) return requestAnimationFrame(frame);

      setTimeout(() => {
        el.classList.add('is-done');
        document.body.classList.remove('is-locked');
        onDone();
        setTimeout(() => el.remove(), 800);
      }, reduceMotion ? 0 : 250);
    }

    requestAnimationFrame(frame);
  }

  /* 02. Animações de entrada (fade + translate) ---------------------------- */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    items.forEach((item) => {
      // O topo do hero já está na tela ao carregar: entra direto, com os atrasos (--d) de cada item
      if (item.closest('.hero__content, .hero__visual')) item.classList.add('is-visible');
      else observer.observe(item);
    });
  }

  /* 03. Header sticky + link ativo ----------------------------------------- */
  function initHeader() {
    const header = document.getElementById('header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!('IntersectionObserver' in window)) return;
    const links = document.querySelectorAll('.nav__link');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('is-current', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section));
  }

  /* 04. Menu mobile -------------------------------------------------------- */
  function initMenu() {
    const burger = document.getElementById('burger');
    const menu = document.getElementById('mobile-menu');
    if (!burger || !menu) return;

    const outside = [document.querySelector('main'), document.querySelector('footer'), document.querySelector('.wa-float')];
    let isOpen = false;
    menu.inert = true;

    function setMenu(open) {
      isOpen = open;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      menu.inert = !open;
      outside.forEach((el) => { if (el) el.inert = open; });
      root.classList.toggle('menu-open', open);
      document.body.classList.toggle('is-locked', open);

      if (open) setTimeout(() => menu.querySelector('a')?.focus({ preventScroll: true }), 350);
    }

    burger.addEventListener('click', () => setMenu(!isOpen));
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        setMenu(false);
        burger.focus();
      }
    });

    window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
      if (e.matches && isOpen) setMenu(false);
    });
  }

  /* 05. Cursor customizado (apenas mouse) ---------------------------------- */
  function initCursor() {
    if (!finePointer || reduceMotion) return;

    const cursor = document.querySelector('.cursor');
    if (!cursor) return;
    const dot = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');
    const label = cursor.querySelector('.cursor__label');

    root.classList.add('has-cursor');

    let x = -100, y = -100, rx = x, ry = y;

    window.addEventListener('mousemove', (e) => {
      x = e.clientX;
      y = e.clientY;
      cursor.classList.add('is-active');
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget) cursor.classList.remove('is-active');
    });

    document.addEventListener('mouseover', (e) => {
      const target = e.target;
      const labelled = target.closest('[data-cursor-label]');
      const interactive = target.closest('a, button');

      label.textContent = labelled ? labelled.dataset.cursorLabel : '';
      cursor.classList.toggle('is-label', Boolean(labelled));
      cursor.classList.toggle('is-hover', Boolean(interactive) && !labelled);
      cursor.classList.toggle('is-dark', Boolean(target.closest('[data-cursor="dark"]')));
    });

    (function loop() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    })();
  }

  /* 06. Circuitos lógicos no hero -------------------------------------------
     Placa de circuito gerada em canvas: trilhas, vias e chips. As trilhas
     acendem em volta do mouse e disparam sinais que correm até os terminais. */
  function initCircuits() {
    const hero = document.querySelector('.hero');
    const canvas = document.getElementById('circuits');
    if (!hero || !canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const CELL = 26;          // tamanho da grade (px)
    const RADIUS = 240;       // raio da luz em volta do cursor
    const MAX_PULSES = 26;
    // 8 direções; índices pares são ortogonais, ímpares diagonais
    const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    const rand = (min, max) => min + Math.random() * (max - min);
    const randInt = (min, max) => Math.floor(rand(min, max + 1));

    const base = document.createElement('canvas');  // trilhas apagadas
    const lit = document.createElement('canvas');   // trilhas acesas (amarelo)
    const spot = document.createElement('canvas');  // recorte circular da luz
    const spotCtx = spot.getContext('2d');

    const pointer = { x: 0, y: 0, sx: 0, sy: 0, glow: 0, last: 0, spawn: 0 };
    let w = 0, h = 0, dpr = 1, traces = [], chips = [], pulses = [];
    let raf = null, visible = true, ambientAt = 0;

    /* Geração da placa ----------------------------------------------------- */
    function build() {
      w = hero.offsetWidth;
      h = hero.offsetHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      [canvas, base, lit].forEach((c) => { c.width = w * dpr; c.height = h * dpr; });
      spot.width = spot.height = RADIUS * 2 * dpr;

      const cols = Math.ceil(w / CELL) + 1;
      const rows = Math.ceil(h / CELL) + 1;
      const used = new Uint8Array(cols * rows);
      const free = (c, r) => c >= 0 && r >= 0 && c < cols && r < rows && !used[r * cols + c];
      const mark = (c, r) => { used[r * cols + c] = 1; };
      traces = [];
      chips = [];
      pulses = [];

      function grow(c, r, dir, origin) {
        const pts = origin ? [origin] : [];
        const max = randInt(5, 16);
        let calm = 2; // passos sem curva logo após sair/virar
        while (pts.length < max && free(c, r)) {
          mark(c, r);
          pts.push([c * CELL, r * CELL]);
          if (--calm < 0 && Math.random() < 0.25) {
            dir = (dir + (Math.random() < 0.5 ? 1 : 7)) % 8;
            calm = 2;
          }
          c += DIRS[dir][0];
          r += DIRS[dir][1];
        }
        if (pts.length < 4) return;

        // Mantém só os cantos e pré-calcula comprimentos
        const corners = pts.filter((p, i) => {
          if (i === 0 || i === pts.length - 1) return true;
          const a = pts[i - 1], b = pts[i + 1];
          return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]);
        });
        const lengths = [0];
        for (let i = 1; i < corners.length; i++) {
          lengths.push(lengths[i - 1] + Math.hypot(corners[i][0] - corners[i - 1][0], corners[i][1] - corners[i - 1][1]));
        }
        traces.push({ pts: corners, lengths, length: lengths[lengths.length - 1], fromChip: Boolean(origin), busy: false });
      }

      // Chips: blocos retangulares com trilhas saindo dos pinos
      const chipCount = clamp(Math.round((cols * rows) / 900), 2, 5);
      for (let tries = 0; chips.length < chipCount && tries < 60; tries++) {
        const cw = randInt(3, 5), ch = randInt(2, 3);
        const c0 = randInt(2, cols - cw - 3), r0 = randInt(2, rows - ch - 3);
        let ok = true;
        for (let r = r0 - 2; r <= r0 + ch + 2 && ok; r++) {
          for (let c = c0 - 2; c <= c0 + cw + 2; c++) if (!free(c, r)) { ok = false; break; }
        }
        if (!ok) continue;
        for (let r = r0; r <= r0 + ch; r++) for (let c = c0; c <= c0 + cw; c++) mark(c, r);
        chips.push({ x: c0 * CELL, y: r0 * CELL, w: cw * CELL, h: ch * CELL });
        for (let c = c0 + 1; c < c0 + cw; c++) {
          grow(c, r0 - 1, 6, [c * CELL, r0 * CELL]);
          grow(c, r0 + ch + 1, 2, [c * CELL, (r0 + ch) * CELL]);
        }
        for (let r = r0 + 1; r < r0 + ch; r++) {
          grow(c0 - 1, r, 4, [c0 * CELL, r * CELL]);
          grow(c0 + cw + 1, r, 0, [(c0 + cw) * CELL, r * CELL]);
        }
      }

      // Trilhas avulsas preenchendo a placa
      const target = Math.round((cols * rows) / 12);
      for (let i = 0; i < target * 4 && traces.length < target; i++) {
        grow(randInt(0, cols - 1), randInt(0, rows - 1), randInt(0, 3) * 2);
      }

      paint(base.getContext('2d'), 'rgba(232, 230, 225, 0.07)', 1);
      paint(lit.getContext('2d'), 'rgba(245, 183, 0, 0.85)', 1.4);
    }

    function paint(c, color, width) {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = width;
      c.lineJoin = 'round';
      c.lineCap = 'round';

      c.beginPath();
      traces.forEach(({ pts }) => {
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      });
      c.stroke();

      // Vias (anéis nas pontas)
      c.beginPath();
      traces.forEach(({ pts, fromChip }) => {
        const end = pts[pts.length - 1];
        c.moveTo(end[0] + 3.5, end[1]);
        c.arc(end[0], end[1], 3.5, 0, Math.PI * 2);
        if (!fromChip) {
          c.moveTo(pts[0][0] + 2.5, pts[0][1]);
          c.arc(pts[0][0], pts[0][1], 2.5, 0, Math.PI * 2);
        }
      });
      c.stroke();

      // Chips com marcação do pino 1
      chips.forEach((chip) => {
        c.beginPath();
        if (c.roundRect) c.roundRect(chip.x, chip.y, chip.w, chip.h, 4);
        else c.rect(chip.x, chip.y, chip.w, chip.h);
        c.stroke();
        c.beginPath();
        c.arc(chip.x + 9, chip.y + 9, 2.5, 0, Math.PI * 2);
        c.fill();
      });
    }

    /* Sinais ---------------------------------------------------------------- */
    function pointAt(trace, d) {
      const { pts, lengths } = trace;
      d = clamp(d, 0, trace.length);
      let i = 1;
      while (i < lengths.length - 1 && lengths[i] < d) i++;
      const t = (d - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
    }

    function spawn(x, y) {
      if (pulses.length >= MAX_PULSES) return;
      const near = [];
      traces.forEach((trace) => {
        if (trace.busy) return;
        const a = trace.pts[0], b = trace.pts[trace.pts.length - 1];
        const da = Math.hypot(a[0] - x, a[1] - y), db = Math.hypot(b[0] - x, b[1] - y);
        if (Math.min(da, db) < RADIUS * 0.7) near.push({ trace, reverse: db < da });
      });
      if (!near.length) return;
      const { trace, reverse } = near[randInt(0, near.length - 1)];
      trace.busy = true;
      // O sinal nasce na ponta mais próxima do cursor e corre para longe dele
      pulses.push({ trace, reverse, d: 0, speed: rand(2.4, 4.4), tail: rand(40, 90) });
    }

    function drawPulse(p) {
      const { trace } = p;
      const head = Math.min(p.d, trace.length);
      const tailStart = Math.max(0, p.d - p.tail);
      const pos = (d) => pointAt(trace, p.reverse ? trace.length - d : d);

      if (tailStart < head) {
        // Rastro: do fim da cauda até a cabeça, passando pelos cantos
        const corners = [];
        trace.lengths.forEach((len, i) => {
          const along = p.reverse ? trace.length - len : len;
          if (along > tailStart && along < head) corners.push([along, trace.pts[i]]);
        });
        corners.sort((a, b) => a[0] - b[0]);
        const points = [pos(tailStart), ...corners.map((c) => c[1]), pos(head)];
        const [tx, ty] = points[0];
        const [hx, hy] = points[points.length - 1];
        const grad = ctx.createLinearGradient(tx, ty, hx, hy);
        grad.addColorStop(0, 'rgba(255, 210, 77, 0)');
        grad.addColorStop(1, 'rgba(255, 210, 77, 0.95)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
        ctx.stroke();
      }

      const [x, y] = pos(head);
      if (p.d <= trace.length) {
        ctx.fillStyle = 'rgba(245, 183, 0, 0.18)';
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe08a';
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      } else {
        // Chegou no terminal: anel que se expande e some
        const k = (p.d - trace.length) / p.tail;
        ctx.strokeStyle = `rgba(245, 183, 0, ${0.9 * (1 - k)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(x, y, 4 + k * 10, 0, Math.PI * 2); ctx.stroke();
      }
    }

    /* Render ---------------------------------------------------------------- */
    function render(now = performance.now()) {
      raf = null;
      pointer.sx += (pointer.x - pointer.sx) * 0.16;
      pointer.sy += (pointer.y - pointer.sy) * 0.16;
      const idle = now - pointer.last > 1000;
      pointer.glow += ((idle ? 0 : 1) - pointer.glow) * (idle ? 0.035 : 0.12);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(base, 0, 0, w, h);

      if (pointer.glow > 0.01) {
        const size = RADIUS * 2;
        const ox = pointer.sx - RADIUS, oy = pointer.sy - RADIUS;
        spotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        spotCtx.globalCompositeOperation = 'source-over';
        spotCtx.clearRect(0, 0, size, size);
        const g = spotCtx.createRadialGradient(RADIUS, RADIUS, 0, RADIUS, RADIUS, RADIUS);
        g.addColorStop(0, `rgba(0, 0, 0, ${pointer.glow})`);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spotCtx.fillStyle = g;
        spotCtx.fillRect(0, 0, size, size);
        spotCtx.globalCompositeOperation = 'source-in';
        spotCtx.drawImage(lit, -ox, -oy, w, h);
        ctx.drawImage(spot, ox, oy, size, size);
      }

      // Sem mouse (toque): sinais aleatórios de vez em quando
      if (!finePointer && traces.length && now - ambientAt > 700) {
        ambientAt = now;
        const start = traces[randInt(0, traces.length - 1)].pts[0];
        spawn(start[0], start[1]);
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.d += p.speed;
        if (p.d > p.trace.length + p.tail) {
          p.trace.busy = false;
          pulses.splice(i, 1);
          continue;
        }
        drawPulse(p);
      }

      if (visible && (pointer.glow > 0.01 || pulses.length || !finePointer)) {
        raf = requestAnimationFrame(render);
      }
    }

    const wake = () => { if (!raf && visible) raf = requestAnimationFrame(render); };

    if (reduceMotion) {
      // Movimento reduzido: só a placa estática, sem luz nem sinais
      const draw = () => { build(); render(); };
      visible = false; // impede o loop
      draw();
      watchSize(draw);
      return;
    }

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      if (pointer.glow < 0.02) { pointer.sx = pointer.x; pointer.sy = pointer.y; }
      pointer.last = performance.now();
      if (pointer.last - pointer.spawn > 70) {
        pointer.spawn = pointer.last;
        spawn(pointer.x, pointer.y);
      }
      wake();
    }, { passive: true });

    // Pausa quando o hero sai da tela
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
      }).observe(hero);
    }

    build();
    render();
    watchSize(() => { build(); render(); });
  }

  /* Bordas dos cards do hero acendem conforme o cursor se aproxima ---------- */
  function initCardGlow() {
    const hero = document.querySelector('.hero');
    const cards = hero ? [...hero.querySelectorAll('.tech-card')] : [];
    if (!cards.length || !finePointer) return;

    const REACH = 220; // distância (px) a partir da qual a borda começa a acender

    hero.addEventListener('pointermove', (e) => {
      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        // Distância do cursor até o retângulo do card (0 quando está dentro)
        const dx = Math.max(-x, 0, x - r.width);
        const dy = Math.max(-y, 0, y - r.height);
        card.style.setProperty('--bx', `${x}px`);
        card.style.setProperty('--by', `${y}px`);
        card.style.setProperty('--glow', (1 - clamp(Math.hypot(dx, dy) / REACH, 0, 1)).toFixed(3));
      });
    }, { passive: true });

    hero.addEventListener('pointerleave', () => cards.forEach((card) => card.style.setProperty('--glow', '0')));
  }

  /* Recria a placa quando o hero muda de tamanho (fontes, imagens, resize) */
  function watchSize(onChange) {
    const hero = document.querySelector('.hero');
    let width = hero.offsetWidth, height = hero.offsetHeight, timer;
    const check = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (hero.offsetWidth === width && hero.offsetHeight === height) return;
        width = hero.offsetWidth;
        height = hero.offsetHeight;
        onChange();
      }, 150);
    };
    if ('ResizeObserver' in window) new ResizeObserver(check).observe(hero);
    else window.addEventListener('resize', check);
  }

  /* 07. Trilhas de conexão entre elementos e cards ----------------------------
     Rotas calculadas a partir da posição real dos cards: título → projeto 1 →
     projeto 2 → projeto 3 → por baixo da faixa → botão do WhatsApp. */
  function initWires() {
    const work = document.querySelector('.work');
    const cta = document.querySelector('.cta');
    const workSvg = work && work.querySelector('.wires');
    const ctaSvg = cta && cta.querySelector('.wires');
    if (!workSvg || !ctaSvg) return;

    const NS = 'http://www.w3.org/2000/svg';
    const TILT = Math.tan((1.5 * Math.PI) / 180); // inclinação da faixa (.marquee)

    // Posição dentro da seção ignorando transforms (as animações de entrada deslocam os itens)
    function box(el, root) {
      let x = 0, y = 0, node = el;
      while (node && node !== root) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
      }
      const w = el.offsetWidth, h = el.offsetHeight;
      return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, bottom: y + h };
    }

    // Caminho ortogonal com cantos chanfrados a 45°, como trilhas de placa
    function route(points, radius = 16) {
      let d = `M${points[0][0]} ${points[0][1]}`;
      for (let i = 1; i < points.length - 1; i++) {
        const [px, py] = points[i - 1], [x, y] = points[i], [nx, ny] = points[i + 1];
        const inLen = Math.hypot(x - px, y - py), outLen = Math.hypot(nx - x, ny - y);
        const c = Math.min(radius, inLen / 2, outLen / 2);
        d += ` L${x - ((x - px) / inLen) * c} ${y - ((y - py) / inLen) * c}`;
        d += ` L${x + ((nx - x) / outLen) * c} ${y + ((ny - y) / outLen) * c}`;
      }
      const [lx, ly] = points[points.length - 1];
      return `${d} L${lx} ${ly}`;
    }

    function node(tag, attrs) {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    }

    // Terminal da trilha: "via" (anel) solto ou "pin" encaixado na borda de um card
    function terminal([x, y], type, horizontal) {
      if (type === 'via') return node('circle', { cx: x, cy: y, r: 4, class: 'wire__via' });
      if (type === 'pin') {
        const [w, h] = horizontal ? [6, 16] : [16, 6];
        return node('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 2, class: 'wire__pin' });
      }
      return null;
    }

    function draw(svg, section, wires) {
      svg.setAttribute('viewBox', `0 0 ${section.offsetWidth} ${section.offsetHeight}`);
      svg.replaceChildren();

      wires.forEach((wire) => {
        // Remove pontos repetidos (segmentos de comprimento zero)
        const pts = wire.points.filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
        if (pts.length < 2) return;

        const d = route(pts);
        const g = node('g', { class: 'wire' });
        g.dataset.link = wire.link || '';
        const base = node('path', { d, class: 'wire__base' });
        g.append(base);

        const first = pts[0], second = pts[1], last = pts[pts.length - 1], beforeLast = pts[pts.length - 2];
        [terminal(first, wire.start, first[1] === second[1]), terminal(last, wire.end, last[1] === beforeLast[1])]
          .forEach((t) => t && g.append(t));
        svg.append(g);

        const len = base.getTotalLength();
        g.style.setProperty('--len', len);

        // Sinal que percorre a trilha
        if (!reduceMotion) {
          const signal = node('path', { d, class: 'wire__signal' });
          const dash = 36;
          signal.style.strokeDasharray = `${dash} ${len + dash}`;
          g.insertBefore(signal, base.nextSibling);
          signal.animate(
            [{ strokeDashoffset: dash }, { strokeDashoffset: -len }],
            { duration: Math.max(1800, len / 0.16), iterations: Infinity, delay: Math.random() * 2500 }
          );
        }
      });
    }

    function workWires() {
      const head = work.querySelector('.work__head');
      const eyebrow = head.querySelector('.eyebrow');
      const intro = head.querySelector('.work__intro');
      const e = box(eyebrow, work), it = box(intro, work), hd = box(head, work);

      // Entra pelo topo da seção (vindo do hero) e liga no traço do eyebrow
      const gx = Math.max(8, Math.round(e.x / 2));
      const wires = [{ points: [[gx, 0], [gx, e.cy], [e.x - 2, e.cy]], start: 'none', end: 'via' }];

      let prev = { x: it.x, y: it.bottom + 20, bottom: hd.bottom, type: 'via', link: '' };
      work.querySelectorAll('.project').forEach((project, i) => {
        const a = box(project, work);
        const m = box(project.querySelector('.project__media'), work);
        const b = box(project.querySelector('.project__body'), work);
        const stacked = b.y >= m.bottom - 1; // mobile: texto abaixo da imagem
        const mid = Math.round((prev.bottom + m.y) / 2);

        wires.push({
          points: [[prev.x, prev.y], [prev.x, mid], [m.cx, mid], [m.cx, m.y]],
          start: prev.type, end: 'pin', link: `${prev.link} ${i}`,
        });
        prev = stacked
          ? { x: m.cx, y: a.bottom + 14, bottom: a.bottom, type: 'via', link: String(i) }
          : { x: m.cx, y: m.bottom, bottom: a.bottom, type: 'pin', link: String(i) };
      });

      // Sai pela base da seção em direção à faixa do CTA
      wires.push({ points: [[prev.x, prev.y], [prev.x, work.offsetHeight]], start: prev.type, end: 'none', link: prev.link });
      return { wires, exitX: prev.x };
    }

    function ctaWires(enterX) {
      const marquee = cta.querySelector('.marquee');
      const side = cta.querySelector('.cta__side');
      const btn = side.querySelector('.btn--lg');
      const mq = box(marquee, cta), sd = box(side, cta), bt = box(btn, cta);
      // Borda da faixa inclinada (sobe para a direita) + translateY(-12px)
      const edge = (x, bottom) => mq.y - 12 + (bottom ? mq.h : 0) + (mq.cx - x) * TILT;

      const x = Math.max(8, Math.round(sd.x - 28));
      return [
        { points: [[enterX, 0], [enterX, edge(enterX, false) + 8]], start: 'none', end: 'none' },
        { points: [[x, edge(x, true) - 8], [x, bt.cy], [bt.x, bt.cy]], start: 'none', end: 'pin' },
      ];
    }

    function render() {
      const { wires, exitX } = workWires();
      draw(workSvg, work, wires);
      draw(ctaSvg, cta, ctaWires(exitX));
    }

    let frame;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(render); };
    render();
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(schedule);
      ro.observe(work);
      ro.observe(cta);
    } else {
      window.addEventListener('resize', schedule);
    }
    if (document.fonts) document.fonts.ready.then(schedule);

    // Desenha as trilhas quando cada seção entra na tela
    if ('IntersectionObserver' in window && !reduceMotion) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-wired');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      io.observe(work);
      io.observe(cta);
    } else {
      work.classList.add('is-wired');
      cta.classList.add('is-wired');
    }

    // Hover num projeto acende as trilhas ligadas a ele
    work.querySelectorAll('.project__media').forEach((media, i) => {
      const toggle = (on) => workSvg.querySelectorAll('.wire').forEach((wire) => {
        if (wire.dataset.link.split(' ').includes(String(i))) wire.classList.toggle('is-hot', on);
      });
      media.addEventListener('pointerenter', () => toggle(true));
      media.addEventListener('pointerleave', () => toggle(false));
      media.addEventListener('focus', () => toggle(true));
      media.addEventListener('blur', () => toggle(false));
    });
  }

  /* Inicialização ---------------------------------------------------------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  initHeader();
  initMenu();
  initCursor();
  initCircuits();
  initCardGlow();
  initWires();
  initPreloader(initReveal);
})();
