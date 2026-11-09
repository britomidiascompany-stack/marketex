(() => {
  const ORIG = new Set(['CONJ01', 'CONJ02', 'CONJ03', 'CONJ04']);
  const NOVOS = new Set(['CONJ TOP', 'CONJ14', 'CONJ13', 'CONJ15']);
  const grupo = (s) => ORIG.has(s) ? 'orig' : NOVOS.has(s) ? 'novo' : 'teste';
  const QUEDA = '2026-10-29';
  const FIMQ = '2026-11-05';
  const MUDA = '2026-11-06';
  const POS = '2026-11-07';
  const FIM = '2026-11-08';
  const MOMENTOS = [
    { id: 'a', a: '2026-10-22', b: '2026-10-28' },
    { id: 'b', a: '2026-10-30', b: FIMQ },
    { id: 'c', a: POS, b: FIM },
  ];
  const BASE = { preset: 'tudo', start: '2026-10-01', end: FIM, conj: 'todos', fmt: 'todos', metrica: 'cpf', corte: 2.5, minv: 10, busca: '', ord: 'cpf', dir: 'asc' };
  const PRESETS = { tudo: ['2026-10-01', FIM], antes: ['2026-10-01', '2026-10-28'], depois: [QUEDA, FIMQ], mudou: [POS, FIM], d14: ['2026-10-26', FIM], d7: ['2026-11-02', FIM], inicio: ['2026-09-28', FIM] };
  const P = () => ({ ...BASE, ...dash.params() });
  const num = (v, d = 0) => v == null || !isFinite(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const brl = (v, d = 2) => v == null || !isFinite(v) ? '—' : 'R$ ' + num(v, d);
  const pct = (v, d = 1) => v == null || !isFinite(v) ? '—' : num(v, d) + '%';
  const FMT = { cpf: brl, cpv: brl, cpm: brl, spend: (v) => brl(v, 0), fol: (v) => num(v), vf: pct, ctr: (v) => pct(v, 2) };
  const BOM = { cpf: -1, cpv: -1, cpm: -1, vf: 1, ctr: 1, fol: 1, spend: 0 };
  const CAMPOS = ['spend', 'imp', 'clk', 'link', 'vis', 'fol', 'save', 'thru', 'v25', 'v95'];
  const soma = (rows) => {
    const s = Object.fromEntries(CAMPOS.map((k) => [k, 0]));
    for (const r of rows) for (const k of CAMPOS) s[k] += +r[k] || 0;
    s.cpf = s.fol ? s.spend / s.fol : null;
    s.cpv = s.vis ? s.spend / s.vis : null;
    s.vf = s.vis ? 100 * s.fol / s.vis : null;
    s.cpm = s.imp ? 1000 * s.spend / s.imp : null;
    s.ctr = s.imp ? 100 * s.clk / s.imp : null;
    return s;
  };
  const seguro = (u) => (/^https:\/\/www\.instagram\.com\//.test(u || '') ? u : '');
  const noConj = (set, c) => c === 'todos' || (c === 'orig' && grupo(set) === 'orig') || (c === 'novos' && grupo(set) === 'novo') || (c === 'teste' && grupo(set) === 'teste') || c === set;
  const pil = (t) => t === 'Teste' ? 'bad' : t === 'Original' ? 'ok' : 'neu';
  const dados = () => {
    const a = dash.data('anuncio_dia');
    const m = dash.data('anuncios');
    if (a.status !== 'ok' || m.status !== 'ok') return null;
    const meta = new Map();
    for (const x of m.data) if (!meta.has(x.post)) meta.set(x.post, x);
    return { rows: a.data, meta };
  };
  const posDados = () => { const a = dash.data('posicionamento_dia'); return a.status === 'ok' ? a.data : null; };
  const filtra = (d, { periodo = true, a, b } = {}) => {
    const p = P();
    const ini = a ?? p.start;
    const fim = b ?? p.end;
    return d.rows.filter((r) => (!periodo || (r.d >= ini && r.d <= fim)) && noConj(r.set, p.conj) && (p.fmt === 'todos' || d.meta.get(r.post)?.formato === p.fmt));
  };
  const porPost = (d, rows) => {
    const g = d3.group(rows, (r) => r.post);
    return [...g].map(([post, rs]) => {
      const s = soma(rs);
      const m = d.meta.get(post) || {};
      const sets = [...new Set(rs.filter((r) => +r.spend > 0).map((r) => r.set.replace('CONJ', '').trim()))].sort();
      return { post, titulo: m.titulo || '', formato: m.formato || '', tema: m.tema || '', sets: sets.join(', '), ...s, url: seguro(m.link) };
    }).filter((x) => x.spend > 0);
  };
  const grupos = (lista) => {
    const p = P();
    const corte = +p.corte;
    const minv = +p.minv;
    const out = { best: [], worst: [], low: [] };
    for (const x of lista) {
      if (x.spend < minv) out.low.push(x);
      else if (x.cpf != null && x.cpf <= corte) out.best.push(x);
      else out.worst.push(x);
    }
    return out;
  };
  const ordena = (l) => {
    const p = P();
    const k = p.ord;
    const f = p.dir === 'asc' ? 1 : -1;
    return [...l].sort((a, b) => {
      const x = a[k] ?? Infinity;
      const y = b[k] ?? Infinity;
      return (x - y) * f;
    });
  };
  const celula = (tr, txt, cls) => { const td = tr.insertCell(); td.textContent = txt; if (cls) td.className = cls; return td; };
  const negrito = (tr, txt) => { const td = tr.insertCell(); const b = document.createElement('b'); b.textContent = txt; td.append(b); return td; };
  const ancora = (txt, u) => { const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'bm-link'; a.textContent = txt; return a; };
  const linkCel = (tr, u, txt = 'Ver post ↗') => { const td = tr.insertCell(); if (u) td.append(ancora(txt, u)); else td.textContent = '—'; return td; };
  const pilula = (td, txt, cls) => { const s = document.createElement('span'); s.className = 'bm-pill ' + cls; s.textContent = txt; td.append(s); };
  const vazio = (el, t = '—') => { el.replaceChildren(); el.textContent = t; };
  const tip = (el) => { const t = document.createElement('div'); t.className = 'bm-tip'; t.hidden = true; el.append(t); return t; };
  const mostra = (t, el, x, y, linhas) => {
    t.replaceChildren(...linhas.map((l, i) => { const d = document.createElement('div'); if (i === 0) { const b = document.createElement('b'); b.textContent = l; d.append(b); } else d.textContent = l; return d; }));
    t.hidden = false;
    const w = t.offsetWidth; const W = el.clientWidth;
    t.style.left = Math.max(0, Math.min(W - w, x + 12)) + 'px';
    t.style.top = Math.max(0, y - 10) + 'px';
  };
  const svg = (el, w, h) => d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${w} ${h}`).attr('role', 'img');
  const dt = (s) => s.slice(8) + '/' + s.slice(5, 7);
  const nDias = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5) + 1;

  const cpfEntre = (el, a, b) => { const d = dados(); if (!d) return vazio(el); el.textContent = brl(soma(d.rows.filter((r) => r.d >= a && r.d <= b)).cpf); };
  for (const mo of MOMENTOS) dash.draw('h-' + mo.id, (el) => cpfEntre(el, mo.a, mo.b));

  dash.draw('f-conj', (sel) => {
    const c = dash.data('conjuntos');
    const ops = [new Option('Todos', 'todos'), new Option('Originais (01 a 04)', 'orig'), new Option('Novos (TOP, 13, 14 e 15)', 'novos'), new Option('Testes (05 a 12)', 'teste')];
    if (c.status === 'ok') for (const x of c.data) ops.push(new Option(x.set, x.set));
    sel.replaceChildren(...ops);
    sel.value = P().conj;
  });

  dash.draw('kpi', (el) => { const d = dados(); if (!d) return vazio(el); const k = el.dataset.k; el.textContent = FMT[k](soma(filtra(d))[k]); });
  dash.draw('kpid', (el) => {
    const d = dados();
    el.className = 'd';
    if (!d) return vazio(el, '');
    const k = el.dataset.k;
    const p = P();
    const dias = nDias(p.start, p.end);
    const fimAnt = new Date(Date.parse(p.start) - 864e5).toISOString().slice(0, 10);
    const iniAnt = new Date(Date.parse(p.start) - dias * 864e5).toISOString().slice(0, 10);
    if (iniAnt < '2026-09-28') return vazio(el, '');
    const now = soma(filtra(d))[k];
    const ant = soma(filtra(d, { a: iniAnt, b: fimAnt }))[k];
    if (now == null || ant == null || !ant) return vazio(el, '');
    const v = 100 * (now - ant) / ant;
    el.textContent = (v > 0 ? '+' : '') + num(v, 0) + '% contra os ' + dias + ' dias anteriores';
    if (BOM[k]) el.classList.add(v * BOM[k] > 0 ? 'down' : 'up');
  });

  const GR = [
    { n: 'Total', c: 'var(--bm-roxo)', w: 2.6, f: () => true },
    { n: 'Originais', c: 'var(--bm-light)', w: 2, f: (r) => grupo(r.set) === 'orig' },
    { n: 'Novos', c: 'var(--bm-good)', w: 2, f: (r) => grupo(r.set) === 'novo' },
    { n: 'Testes', c: 'var(--bm-bad)', w: 1.6, f: (r) => grupo(r.set) === 'teste' },
  ];
  const linhas = (el, rows, k) => {
    const dias = [...new Set(rows.map((r) => r.d))].sort();
    if (dias.length < 2) return vazio(el, 'Escolha um período maior para ver a evolução.');
    const serie = (f) => dias.map((x) => ({ d: x, v: soma(rows.filter((r) => r.d === x && f(r)))[k] }));
    const S = GR.map((s) => ({ ...s, pts: serie(s.f) })).filter((s) => s.pts.some((x) => x.v));
    const W = Math.max(320, el.clientWidth); const H = 320;
    const m = { l: 62, r: 14, t: 12, b: 26 };
    const xs = d3.scalePoint(dias, [m.l, W - m.r]);
    const main = S.filter((s) => s.n !== 'Testes').flatMap((s) => s.pts.map((x) => x.v ?? 0));
    const teto = k === 'cpf' ? Math.max(3, d3.max(main) * 1.15) : d3.max(S.flatMap((s) => s.pts.map((x) => x.v ?? 0))) * 1.1;
    const y = d3.scaleLinear([0, teto || 1], [H - m.b, m.t]).nice();
    const g = svg(el, W, H);
    const faixa = (a, b, cor) => {
      const d0 = dias.find((x) => x >= a);
      const d1 = [...dias].reverse().find((x) => x <= b);
      if (!d0 || !d1 || d0 > d1) return;
      const x1 = d1 === dias[dias.length - 1] ? W - m.r : xs(d1);
      g.append('rect').attr('x', xs(d0)).attr('y', m.t).attr('width', Math.max(4, x1 - xs(d0))).attr('height', H - m.b - m.t).attr('fill', cor).attr('fill-opacity', .08);
    };
    faixa(QUEDA, FIMQ, 'var(--bm-bad)');
    faixa(MUDA, FIM, 'var(--bm-good)');
    for (const t of y.ticks(5)) {
      g.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t)).attr('stroke', 'var(--cds-chart-grid, var(--color-border-line))');
      g.append('text').attr('x', m.l - 6).attr('y', y(t) + 4).attr('text-anchor', 'end').text(FMT[k](t));
    }
    const passo = Math.ceil(dias.length / Math.max(4, Math.floor(W / 70)));
    dias.forEach((x, i) => { if (i % passo === 0) g.append('text').attr('x', xs(x)).attr('y', H - 8).attr('text-anchor', 'middle').text(dt(x)); });
    const lin = d3.line().defined((x) => x.v != null && x.v <= y.domain()[1]).x((x) => xs(x.d)).y((x) => y(x.v));
    for (const s of [...S].reverse()) g.append('path').attr('d', lin(s.pts)).attr('fill', 'none').attr('stroke', s.c).attr('stroke-width', s.w).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
    const t = tip(el);
    const regua = g.append('line').attr('y1', m.t).attr('y2', H - m.b).attr('stroke', 'var(--cds-chart-axis, var(--color-border-line))').attr('opacity', 0);
    g.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('mousemove', (ev) => {
        const [mx, my] = d3.pointer(ev);
        const i = d3.bisectCenter(dias.map((x) => xs(x)), mx);
        const x = dias[i];
        regua.attr('x1', xs(x)).attr('x2', xs(x)).attr('opacity', 1);
        const esc = el.clientWidth / W;
        mostra(t, el, xs(x) * esc, my * esc, [dt(x), ...S.map((s) => s.n + ': ' + FMT[k](s.pts[i].v))]);
      }).on('mouseleave', () => { t.hidden = true; regua.attr('opacity', 0); });
  };
  dash.draw('c-diario', (el) => { el.replaceChildren(); const d = dados(); if (!d) return vazio(el); linhas(el, filtra(d), P().metrica); });
  dash.draw('c-mudou', (el) => { el.replaceChildren(); const d = dados(); if (!d) return vazio(el); linhas(el, d.rows.filter((r) => r.d >= MOMENTOS[0].a && r.d <= FIM), 'cpf'); });

  const momento = (d, pr, mo) => {
    const s = soma(d.rows.filter((r) => r.d >= mo.a && r.d <= mo.b));
    const n = nDias(mo.a, mo.b);
    const ps = pr ? pr.filter((r) => r.d >= mo.a && r.d <= mo.b) : [];
    const st = soma(ps.filter((r) => r.pos === 'Stories IG'));
    const tot = d3.sum(ps, (r) => +r.spend);
    return { ...s, fpd: s.fol / n, spd: s.spend / n, st: tot ? 100 * st.spend / tot : null, stcpf: st.cpf };
  };
  dash.draw('m-cpf', (el) => { const d = dados(); if (!d) return vazio(el); el.textContent = brl(momento(d, null, MOMENTOS.find((x) => x.id === el.dataset.p)).cpf); });
  const LINHAS_M = [
    ['Custo por seguidor', 'cpf', (v) => brl(v), -1],
    ['Seguidores por dia', 'fpd', (v) => num(v), 1],
    ['Investimento por dia', 'spd', (v) => brl(v, 0), 0],
    ['Visita que vira seguidor', 'vf', (v) => pct(v), 1],
    ['Custo por visita', 'cpv', (v) => brl(v), -1],
    ['CPM', 'cpm', (v) => brl(v), 0],
    ['Verba no Stories do Instagram', 'st', (v) => pct(v), 1],
    ['Custo por seguidor no Stories', 'stcpf', (v) => brl(v), -1],
  ];
  dash.draw('tb-m', (el) => {
    el.replaceChildren();
    const d = dados();
    const pr = posDados();
    if (!d || !pr) return;
    const M = MOMENTOS.map((mo) => momento(d, pr, mo));
    for (const [n, k, f, bom] of LINHAS_M) {
      const tr = el.insertRow();
      negrito(tr, n);
      M.forEach((x, i) => (i === 2 ? negrito : celula)(tr, f(x[k])));
      const b = M[1][k];
      const c = M[2][k];
      const td = tr.insertCell();
      if (b == null || c == null || !b) { td.textContent = '—'; continue; }
      const pp = k === 'vf' || k === 'st';
      const v = pp ? c - b : 100 * (c - b) / b;
      const txt = (v > 0 ? '+' : '') + num(v, 0) + (pp ? ' p.p.' : '%');
      if (bom) pilula(td, txt, v * bom > 0 ? 'ok' : 'bad'); else td.textContent = txt;
    }
  });
  dash.draw('tb-mset', (el) => {
    el.replaceChildren();
    const d = dados();
    const pr = posDados();
    const c = dash.data('conjuntos');
    if (!d || !pr || c.status !== 'ok') return;
    const rs = d.rows.filter((r) => r.d >= POS && r.d <= FIM);
    const tot = d3.sum(rs, (r) => +r.spend) || 1;
    const info = new Map(c.data.map((x) => [x.set, x]));
    const l = [...d3.group(rs, (r) => r.set)].map(([set, v]) => {
      const s = soma(v);
      const ps = pr.filter((r) => r.set === set && r.d >= POS && r.d <= FIM);
      const pt = d3.sum(ps, (r) => +r.spend);
      const st = d3.sum(ps.filter((r) => r.pos === 'Stories IG'), (r) => +r.spend);
      const t = d3.rollups(v, (q) => d3.sum(q, (r) => +r.spend), (r) => r.post).sort((a, b) => b[1] - a[1])[0];
      return { set, ...s, share: 100 * s.spend / tot, st: pt ? 100 * st / pt : null, princ: t ? t[0] + ' (' + pct(100 * t[1] / s.spend, 0) + ')' : '—', princLink: t ? seguro(d.meta.get(t[0])?.link) : '' };
    }).filter((x) => x.spend > 0).sort((a, b) => (a.cpf ?? 99) - (b.cpf ?? 99));
    for (const x of l) {
      const k = info.get(x.set) || {};
      const tr = el.insertRow();
      negrito(tr, x.set);
      pilula(tr.insertCell(), k.tipo || '—', pil(k.tipo));
      celula(tr, k.orcamento != null ? brl(+k.orcamento, +k.orcamento % 1 ? 2 : 0) : '—');
      celula(tr, brl(x.spend, 0)); celula(tr, pct(x.share, 0)); celula(tr, num(x.fol)); negrito(tr, brl(x.cpf)); celula(tr, pct(x.vf, 0)); celula(tr, pct(x.st, 0)); linkCel(tr, x.princLink, x.princ);
    }
  });
  dash.draw('tb-mads', (el) => {
    el.replaceChildren();
    const d = dados();
    if (!d) return;
    const rs = d.rows.filter((r) => r.d >= POS && r.d <= FIM);
    const l = [...d3.group(rs, (r) => r.set + '|' + r.post)].map(([k, v]) => {
      const [set, post] = k.split('|');
      const m = d.meta.get(post) || {};
      return { set, post, titulo: m.titulo || '', url: seguro(m.link), ...soma(v) };
    }).filter((x) => x.spend >= 5).sort((a, b) => (a.cpf ?? 99) - (b.cpf ?? 99));
    for (const x of l) {
      const tr = el.insertRow();
      negrito(tr, x.post.replace('POST', '')); linkCel(tr, x.url); celula(tr, x.titulo, 'w'); celula(tr, x.set);
      celula(tr, brl(x.spend)); celula(tr, num(x.fol)); negrito(tr, x.cpf == null ? 'sem seguidor' : brl(x.cpf)); celula(tr, pct(x.vf, 0));
    }
  });
  dash.draw('passos', (el) => {
    el.replaceChildren();
    const a = dash.data('passos');
    if (a.status !== 'ok') return vazio(el);
    for (const x of [...a.data].sort((p, q) => p.ordem - q.ordem)) {
      const c = document.createElement('article'); c.className = 'bm-a';
      const h = document.createElement('h3'); h.textContent = x.ordem + '. ' + x.passo + ' ';
      const s = document.createElement('span'); s.className = 'bm-pill neu'; s.textContent = x.status;
      const t = document.createElement('p'); t.textContent = x.motivo;
      const q = document.createElement('p'); q.textContent = 'Quando: ' + x.quando;
      c.append(h, s, t, q); el.append(c);
    }
  });

  dash.draw('achados', (el) => {
    el.replaceChildren();
    const a = dash.data('achados');
    if (a.status !== 'ok') return vazio(el);
    for (const x of [...a.data].sort((p, q) => p.ordem - q.ordem)) {
      const c = document.createElement('article'); c.className = 'bm-a ' + x.nivel;
      const h = document.createElement('h3'); h.textContent = x.area + ' ';
      const s = document.createElement('span'); s.className = 'bm-pill ' + x.nivel; s.textContent = x.veredito;
      const t = document.createElement('p'); t.textContent = x.texto;
      c.append(h, s, t); el.append(c);
    }
  });

  dash.draw('c-conc', (el) => {
    el.replaceChildren();
    const d = dados();
    if (!d) return vazio(el);
    const l = porPost(d, filtra(d)).sort((a, b) => b.spend - a.spend);
    const total = d3.sum(l, (x) => x.spend);
    if (!total) return vazio(el, 'Sem gasto neste filtro.');
    const top = l.slice(0, 7);
    const resto = l.slice(7);
    const lin = top.map((x) => ({ n: x.post, v: x.spend, t: x.titulo, u: x.url }));
    if (resto.length) lin.push({ n: resto.length + ' outros', v: d3.sum(resto, (x) => x.spend), t: 'Demais criativos do filtro' });
    const W = Math.max(300, el.clientWidth); const H = lin.length * 30 + 8;
    const x = d3.scaleLinear([0, d3.max(lin, (q) => q.v)], [84, W - 74]);
    const g = svg(el, W, H);
    const t = tip(el);
    lin.forEach((q, i) => {
      const y = i * 30 + 4;
      g.append('text').attr('x', 78).attr('y', y + 15).attr('text-anchor', 'end').text(q.n);
      const alvo = q.u ? g.append('a').attr('href', q.u).attr('target', '_blank').attr('rel', 'noopener noreferrer') : g;
      alvo.append('rect').attr('x', 84).attr('y', y).attr('height', 22).attr('rx', 5).attr('width', Math.max(2, x(q.v) - 84)).attr('fill', i < 3 ? 'var(--bm-roxo)' : 'var(--bm-mid)')
        .on('mousemove', (ev) => { const [a, b] = d3.pointer(ev, el); mostra(t, el, a, b, [q.n, q.t.slice(0, 54), brl(q.v, 0) + ' · ' + pct(100 * q.v / total)]); }).on('mouseleave', () => { t.hidden = true; });
      g.append('text').attr('class', 's').attr('x', x(q.v) + 6).attr('y', y + 15).text(pct(100 * q.v / total, 0));
    });
  });

  dash.draw('c-tema', (el) => {
    el.replaceChildren();
    const d = dados();
    if (!d) return vazio(el);
    const rows = filtra(d);
    const lin = (f) => [...d3.group(rows, (r) => f(d.meta.get(r.post)))].map(([n, rs]) => ({ n, ...soma(rs) })).filter((x) => x.n && x.spend > 0).sort((a, b) => b.spend - a.spend);
    const A = [...lin((m) => m?.formato), ...lin((m) => m?.tema)];
    if (!A.length) return vazio(el, 'Sem gasto neste filtro.');
    const W = Math.max(300, el.clientWidth); const H = A.length * 30 + 8;
    const esq = Math.min(W * .52, 240);
    const x = d3.scaleLinear([0, Math.max(10, d3.max(A, (q) => Math.min(q.cpf ?? 0, 10)))], [esq, W - 60]);
    const g = svg(el, W, H);
    const t = tip(el);
    A.forEach((q, i) => {
      const y = i * 30 + 4;
      g.append('text').attr('x', esq - 6).attr('y', y + 15).attr('text-anchor', 'end').text(q.n.length > 34 ? q.n.slice(0, 33) + '…' : q.n);
      g.append('rect').attr('x', esq).attr('y', y).attr('height', 22).attr('rx', 5).attr('width', Math.max(2, x(Math.min(q.cpf ?? 0, 10)) - esq)).attr('fill', (q.cpf ?? 99) <= 2.5 ? 'var(--bm-roxo)' : 'var(--bm-bad)')
        .on('mousemove', (ev) => { const [a, b] = d3.pointer(ev, el); mostra(t, el, a, b, [q.n, brl(q.spend, 0) + ' investidos', num(q.fol) + ' seguidores']); }).on('mouseleave', () => { t.hidden = true; });
      g.append('text').attr('class', 's').attr('x', x(Math.min(q.cpf ?? 0, 10)) + 6).attr('y', y + 15).text(brl(q.cpf));
    });
  });

  const buscaOk = (x) => { const b = (P().busca || '').toLowerCase().trim(); return !b || (x.post + ' ' + x.titulo).toLowerCase().includes(b); };
  dash.draw('c-mapa', (el) => {
    el.replaceChildren();
    const d = dados();
    if (!d) return vazio(el);
    const l = porPost(d, filtra(d)).filter(buscaOk);
    const G = grupos(l);
    const pts = l.filter((x) => x.cpf != null);
    if (!pts.length) return vazio(el, 'Sem criativos com seguidor neste filtro.');
    const W = Math.max(320, el.clientWidth); const H = 320;
    const m = { l: 62, r: 16, t: 12, b: 34 };
    const x = d3.scaleLog([Math.max(.5, d3.min(pts, (q) => q.spend)), d3.max(pts, (q) => q.spend) * 1.2], [m.l, W - m.r]);
    const y = d3.scaleLog([Math.min(.4, d3.min(pts, (q) => q.cpf)), Math.max(10, d3.max(pts, (q) => q.cpf) * 1.2)], [H - m.b, m.t]);
    const g = svg(el, W, H);
    for (const t of [.5, 1, 2.5, 5, 10, 25].filter((q) => q >= y.domain()[0] && q <= y.domain()[1])) {
      g.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t)).attr('stroke', 'var(--cds-chart-grid, var(--color-border-line))');
      g.append('text').attr('x', m.l - 6).attr('y', y(t) + 4).attr('text-anchor', 'end').text(brl(t));
    }
    for (const t of [1, 10, 100, 1000].filter((q) => q >= x.domain()[0] && q <= x.domain()[1])) g.append('text').attr('x', x(t)).attr('y', H - 16).attr('text-anchor', 'middle').text(brl(t, 0));
    g.append('text').attr('x', (m.l + W - m.r) / 2).attr('y', H - 2).attr('text-anchor', 'middle').text('Gasto no período');
    const cor = (q) => G.best.includes(q) ? 'var(--bm-good)' : G.worst.includes(q) ? 'var(--bm-bad)' : 'var(--bm-mid)';
    const t = tip(el);
    for (const q of pts) {
      const alvo = q.url ? g.append('a').attr('href', q.url).attr('target', '_blank').attr('rel', 'noopener noreferrer') : g;
      alvo.append('circle').attr('cx', x(q.spend)).attr('cy', y(q.cpf)).attr('r', 3 + Math.sqrt(q.fol) / 8).attr('fill', cor(q)).attr('fill-opacity', .72).attr('stroke', 'var(--color-panel)')
        .on('mousemove', (ev) => { const [a, b] = d3.pointer(ev, el); mostra(t, el, a, b, [q.post + ' · ' + q.formato, q.titulo.slice(0, 54), brl(q.cpf) + ' por seguidor', brl(q.spend) + ' · ' + num(q.fol) + ' seguidores']); }).on('mouseleave', () => { t.hidden = true; });
    }
  });

  dash.draw('n-g', (el) => { const d = dados(); if (!d) return vazio(el, ''); el.textContent = num(grupos(porPost(d, filtra(d)).filter(buscaOk))[el.dataset.g].length); });
  dash.draw('tb-g', (el) => {
    el.replaceChildren();
    const d = dados();
    if (!d) return;
    for (const x of ordena(grupos(porPost(d, filtra(d)).filter(buscaOk))[el.dataset.g])) {
      const tr = el.insertRow();
      celula(tr, x.post.replace('POST', '')); linkCel(tr, x.url); celula(tr, x.titulo, 'w'); celula(tr, x.tema, 'w'); celula(tr, x.formato); celula(tr, x.sets);
      celula(tr, brl(x.spend)); celula(tr, num(x.fol)); negrito(tr, x.cpf == null ? 'sem seguidor' : brl(x.cpf)); celula(tr, pct(x.vf, 0)); celula(tr, brl(x.cpv)); celula(tr, pct(x.ctr));
    }
  });

  const porConj = (d) => {
    const p = P();
    const rows = d.rows.filter((r) => r.d >= p.start && r.d <= p.end && (p.fmt === 'todos' || d.meta.get(r.post)?.formato === p.fmt));
    return [...d3.group(rows, (r) => r.set)].map(([set, rs]) => {
      const t = d3.rollups(rs, (v) => d3.sum(v, (r) => +r.spend), (r) => r.post).sort((a, b) => b[1] - a[1])[0];
      const s = soma(rs);
      return { set, ...s, princ: t ? t[0] + ' (' + pct(100 * t[1] / s.spend, 0) + ')' : '—', princLink: t ? seguro(d.meta.get(t[0])?.link) : '' };
    }).filter((x) => x.spend > 0).sort((a, b) => a.set.localeCompare(b.set));
  };
  const COR = { orig: 'var(--bm-roxo)', novo: 'var(--bm-good)', teste: 'var(--bm-bad)' };
  dash.draw('c-vf', (el) => {
    el.replaceChildren();
    const d = dados();
    if (!d) return vazio(el);
    const l = porConj(d).filter((x) => x.vf != null);
    if (!l.length) return vazio(el, 'Sem dados neste filtro.');
    const W = Math.max(320, el.clientWidth); const H = 240;
    const m = { l: 40, r: 8, t: 20, b: 26 };
    const x = d3.scaleBand(l.map((q) => q.set), [m.l, W - m.r]).padding(.26);
    const y = d3.scaleLinear([0, Math.max(50, d3.max(l, (q) => q.vf) * 1.1)], [H - m.b, m.t]);
    const g = svg(el, W, H);
    for (const t of y.ticks(4)) {
      g.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t)).attr('stroke', 'var(--cds-chart-grid, var(--color-border-line))');
      g.append('text').attr('x', m.l - 5).attr('y', y(t) + 4).attr('text-anchor', 'end').text(t + '%');
    }
    for (const q of l) {
      g.append('rect').attr('x', x(q.set)).attr('y', y(q.vf)).attr('width', x.bandwidth()).attr('height', y(0) - y(q.vf)).attr('rx', 4).attr('fill', COR[grupo(q.set)]);
      g.append('text').attr('class', 's').attr('x', x(q.set) + x.bandwidth() / 2).attr('y', y(q.vf) - 5).attr('text-anchor', 'middle').text(pct(q.vf, 0));
      g.append('text').attr('x', x(q.set) + x.bandwidth() / 2).attr('y', H - 8).attr('text-anchor', 'middle').text(q.set.replace('CONJ', '').trim());
    }
  });
  dash.draw('tb-sets', (el) => {
    el.replaceChildren();
    const d = dados();
    const c = dash.data('conjuntos');
    if (!d || c.status !== 'ok') return;
    const mapa = new Map(porConj(d).map((x) => [x.set, x]));
    for (const k of c.data) {
      const x = mapa.get(k.set);
      const tr = el.insertRow();
      negrito(tr, k.set);
      pilula(tr.insertCell(), k.tipo, pil(k.tipo));
      celula(tr, k.status); celula(tr, brl(+k.orcamento, +k.orcamento % 1 ? 2 : 0)); celula(tr, k.meta);
      celula(tr, brl(x?.spend, 0)); celula(tr, x ? num(x.fol) : '—'); negrito(tr, brl(x?.cpf)); celula(tr, pct(x?.vf)); celula(tr, brl(x?.cpv)); celula(tr, brl(x?.cpm)); linkCel(tr, x?.princLink, x?.princ ?? '—');
    }
  });

  const PRINC = ['Stories IG', 'Reels IG', 'Feed IG'];
  const posFiltra = () => {
    const a = posDados();
    if (!a) return null;
    const p = P();
    return a.filter((r) => noConj(r.set, p.conj));
  };
  dash.draw('c-pos', (el) => {
    el.replaceChildren();
    const r0 = posFiltra();
    if (!r0) return vazio(el);
    const p = P();
    const rows = r0.filter((r) => r.d >= p.start && r.d <= p.end);
    const dias = [...new Set(rows.map((r) => r.d))].sort();
    if (!dias.length) return vazio(el, 'Sem dados neste filtro.');
    const W = Math.max(320, el.clientWidth); const H = 320;
    const m = { l: 42, r: 8, t: 8, b: 24 };
    const x = d3.scaleBand(dias, [m.l, W - m.r]).padding(.12);
    const y = d3.scaleLinear([0, 100], [H - m.b, m.t]);
    const g = svg(el, W, H);
    for (const t of [0, 50, 100]) g.append('text').attr('x', m.l - 6).attr('y', y(t) + 4).attr('text-anchor', 'end').text(t + '%');
    const cores = { 'Stories IG': 'var(--bm-roxo)', 'Reels IG': 'var(--bm-light)', 'Feed IG': 'var(--bm-mid)', Outros: 'var(--color-border-line)' };
    const t = tip(el);
    const passo = Math.ceil(dias.length / Math.max(4, Math.floor(W / 70)));
    dias.forEach((di, i) => {
      const rs = rows.filter((r) => r.d === di);
      const tot = d3.sum(rs, (r) => +r.spend) || 1;
      let acc = 0;
      const lin = [dt(di)];
      for (const c of [...PRINC, 'Outros']) {
        const v = d3.sum(rs.filter((r) => c === 'Outros' ? !PRINC.includes(r.pos) : r.pos === c), (r) => +r.spend);
        const pc = 100 * v / tot;
        lin.push(c + ': ' + pct(pc, 0));
        g.append('rect').attr('x', x(di)).attr('width', x.bandwidth()).attr('y', y(acc + pc)).attr('height', y(acc) - y(acc + pc)).attr('fill', cores[c])
          .on('mousemove', (ev) => { const [a, b] = d3.pointer(ev, el); mostra(t, el, a, b, lin); }).on('mouseleave', () => { t.hidden = true; });
        acc += pc;
      }
      if (i % passo === 0) g.append('text').attr('x', x(di) + x.bandwidth() / 2).attr('y', H - 7).attr('text-anchor', 'middle').text(dt(di));
    });
  });
  dash.draw('tb-pos', (el) => {
    el.replaceChildren();
    const r0 = posFiltra();
    if (!r0) return;
    const p = P();
    const rows = r0.filter((r) => r.d >= p.start && r.d <= p.end);
    const tot = d3.sum(rows, (r) => +r.spend) || 1;
    const l = [...d3.group(rows, (r) => r.pos)].map(([n, rs]) => ({ n, ...soma(rs) })).sort((a, b) => b.spend - a.spend);
    for (const x of l) {
      const tr = el.insertRow();
      negrito(tr, x.n); celula(tr, pct(100 * x.spend / tot)); celula(tr, brl(x.spend, 0)); celula(tr, num(x.fol)); negrito(tr, brl(x.cpf)); celula(tr, brl(x.cpv)); celula(tr, pct(x.vf)); celula(tr, brl(x.cpm));
    }
  });

  dash.draw('tb-pub', (el) => {
    el.replaceChildren();
    const a = dash.data('publico_semana');
    if (a.status !== 'ok') return;
    const lin = [];
    for (const dim of ['idade', 'genero']) {
      const rs = a.data.filter((r) => r.dim === dim && r.val !== 'Não informado');
      for (const [val, v] of d3.group(rs, (r) => r.val)) {
        const A = soma(v.filter((r) => r.d < QUEDA));
        const B = soma(v.filter((r) => r.d === QUEDA));
        const C = soma(v.filter((r) => r.d > QUEDA));
        lin.push({ val, A, B, C });
      }
    }
    for (const x of lin) {
      const tr = el.insertRow();
      negrito(tr, x.val); celula(tr, brl(x.A.spend, 0)); negrito(tr, brl(x.A.cpf)); celula(tr, brl(x.B.spend, 0)); negrito(tr, brl(x.B.cpf)); celula(tr, brl(x.C.spend, 0)); negrito(tr, brl(x.C.cpf));
      celula(tr, x.B.cpf && x.C.cpf ? (x.C.cpf > x.B.cpf ? '+' : '') + num(100 * (x.C.cpf - x.B.cpf) / x.B.cpf, 0) + '%' : '—');
    }
  });

  dash.draw('tb-top', (el) => {
    el.replaceChildren();
    const t = dash.data('conj_top');
    const d = dados();
    if (!d || t.status !== 'ok') return;
    const l = new Map(porPost(d, d.rows).map((x) => [x.post, x]));
    const noTop = new Map(porPost(d, d.rows.filter((r) => r.set === 'CONJ TOP')).map((x) => [x.post, x]));
    for (const k of [...t.data].sort((p, q) => p.ordem - q.ordem)) {
      const x = l.get(k.post);
      const z = noTop.get(k.post);
      const tr = el.insertRow();
      celula(tr, num(+k.ordem)); negrito(tr, k.post.replace('POST', '')); linkCel(tr, x?.url); celula(tr, x?.titulo ?? '', 'w'); celula(tr, x?.formato ?? ''); celula(tr, x?.sets ?? '');
      celula(tr, brl(x?.spend)); celula(tr, x ? num(x.fol) : '—'); negrito(tr, brl(x?.cpf));
      celula(tr, brl(z?.spend)); negrito(tr, z ? (z.cpf == null ? 'sem seguidor' : brl(z.cpf)) : '—'); celula(tr, k.obs || '', 'w');
    }
  });

  const Q = (s) => [...document.querySelectorAll(s)];
  const abre = (id) => {
    for (const s of Q('.bm-sec')) s.hidden = s.id !== id;
    for (const b of Q('.bm-tab')) b.setAttribute('aria-selected', String(b.dataset.tab === id));
    dash.setLink(id);
  };
  for (const b of Q('.bm-tab')) b.addEventListener('click', () => abre(b.dataset.tab));
  const alvo = location.hash.slice(1);
  if (Q('.bm-sec').some((s) => s.id === alvo)) abre(alvo);
  const ouve = (sel, ev, fn) => { for (const e of Q(sel)) e.addEventListener(ev, () => fn(e)); };
  ouve('#f-preset', 'change', (e) => { const r = PRESETS[e.value]; dash.setParams(r ? { preset: e.value, start: r[0], end: r[1] } : { preset: 'custom' }); });
  ouve('#f-start', 'change', (e) => { if (e.value && e.validity.valid) dash.setParams({ start: e.value, preset: 'custom' }); });
  ouve('#f-end', 'change', (e) => { if (e.value && e.validity.valid) dash.setParams({ end: e.value, preset: 'custom' }); });
  ouve('#f-conj', 'change', (e) => dash.setParams({ conj: e.value }));
  ouve('#f-fmt', 'change', (e) => dash.setParams({ fmt: e.value }));
  ouve('#f-metrica', 'change', (e) => dash.setParams({ metrica: e.value }));
  ouve('#f-corte', 'change', (e) => { if (e.value && e.validity.valid) dash.setParams({ corte: +e.value }); });
  ouve('#f-minv', 'change', (e) => { if (e.value !== '' && e.validity.valid) dash.setParams({ minv: +e.value }); });
  ouve('#f-busca', 'input', (e) => dash.setParams({ busca: e.value }));
  ouve('#f-reset', 'click', () => dash.resetParams());
  ouve('.bm-sort', 'click', (e) => { const p = P(); const k = e.dataset.o; dash.setParams({ ord: k, dir: p.ord === k && p.dir === 'asc' ? 'desc' : 'asc' }); });
  dash.onData(() => {
    const p = P();
    const pares = { '#f-preset': p.preset, '#f-start': p.start, '#f-end': p.end, '#f-fmt': p.fmt, '#f-metrica': p.metrica, '#f-corte': p.corte, '#f-minv': p.minv, '#f-busca': p.busca };
    for (const [s, v] of Object.entries(pares)) for (const e of Q(s)) if (e !== document.activeElement) e.value = v;
    for (const b of Q('.bm-sort')) b.setAttribute('aria-pressed', String(b.dataset.o === p.ord));
  });
})();
