#!/usr/bin/env node
'use strict';

/**
 * Build estático da Passini Distribuidora — sem dependências de runtime.
 *
 * Lê os fragmentos de página em src/pages/**\/*.html (cada um com um
 * comentário <!--META {...}--> na primeira linha), monta o HTML final com
 * head/header/footer/menu-mobile compartilhados, gera uma página por produto
 * a partir de data/produtos.json, copia css/js/data/imagem e gera
 * sitemap.xml + robots.txt em dist/.
 *
 * Uso: node src/build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_PAGES = path.join(__dirname, 'pages');
const DIST = path.join(ROOT, 'dist');
const SITE_URL = process.env.SITE_URL || 'https://www.passinidistribuidora.com.br';

// ---------------------------------------------------------------------------
// Navegação principal (usada para montar o <nav class="site-nav"> e marcar o
// link ativo — evita duplicar o menu em 12+ arquivos).
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  { key: 'index', href: 'index.html', label: 'Início' },
  { key: 'busca', href: 'busca.html', label: 'Encontre sua Peça' },
  { key: 'produtos', href: 'produtos.html', label: 'Produtos' },
  { key: 'oficinas', href: 'oficinas.html', label: 'Para Oficinas' },
  { key: 'clube', href: 'clube.html', label: 'Clube do Especialista' },
  { key: 'unidades', href: 'unidades.html', label: 'Nossas Unidades' },
  { key: 'sobre', href: 'sobre.html', label: 'Sobre a Passini' },
];

// ---------------------------------------------------------------------------
// Templates compartilhados (funções, não arquivos de partial com tokens —
// evita depender de uma engine de template para uma lógica tão pequena).
// ---------------------------------------------------------------------------

function renderHead({ title, description, base, extraHead = '' }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}css/style.css">
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
${extraHead}</head>
<body>
`;
}

function renderHeader(activeKey, base, mainClass = '') {
  const navLinks = NAV_ITEMS.map((item) => {
    const cls = item.key === activeKey ? 'site-nav__link site-nav__link--active' : 'site-nav__link';
    return `      <a href="${base}${item.href}" class="${cls}">${item.label}</a>`;
  }).join('\n');

  return `<a class="skip-link" href="#main">Pular para o conteúdo</a>

<div class="topbar">
  <div class="topbar__inner">
    <div class="topbar__contact">
      <span class="topbar__phone">51 3579 7200</span>
      <span>Atendimento a oficinas, lojas e frotistas</span>
    </div>
    <div class="topbar__links">
      <a href="${base}unidades.html" class="topbar__link">Nossas unidades</a>
      <a href="${base}ia.html" class="topbar__link topbar__link--ia">Passini IA</a>
    </div>
  </div>
</div>

<header class="site-header">
  <div class="site-header__inner">
    <div class="site-header__row">
      <a href="${base}index.html" class="logo">
        <span class="logo__badge">P</span>
        <span class="logo__text">
          <span class="logo__name">PASSINI</span>
          <span class="logo__sub">DISTRIBUIDORA DE PEÇAS</span>
        </span>
      </a>

      <div class="header-actions">
        <div class="header-search">
          <input class="header-search__input" type="text" placeholder="Buscar peça, código ou veículo" id="header-search-input" autocomplete="off">
          <button class="header-search__btn" type="button" aria-label="Buscar peça" id="header-search-btn">⌕</button>
        </div>
        <a href="${base}orcamento.html" class="quote-btn" aria-label="Meu orçamento">
          <span class="quote-btn__icon">▣</span>
          <span class="quote-btn__count" id="header-quote-count" data-cart-count>2</span>
        </a>
        <a href="${base}contato.html" class="btn-specialist">Falar com especialista</a>
      </div>

      <div class="mobile-actions">
        <a href="${base}busca.html" class="mobile-icon-btn" aria-label="Buscar">⌕</a>
        <button class="mobile-menu-btn" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="site-nav">
          <span class="bar"></span><span class="bar bar--mid"></span><span class="bar"></span>
        </button>
      </div>
    </div>

    <nav class="site-nav" id="site-nav">
${navLinks}
      <a href="${base}ia.html" class="site-nav__ia">Passini IA →</a>
    </nav>
  </div>
</header>

<main id="main"${mainClass ? ` class="${mainClass}"` : ''}>
`;
}

function renderFooter(base) {
  return `</main>

<footer class="site-footer">
  <div class="site-footer__inner">
    <div class="footer-grid">
      <div>
        <div class="footer-brand__logo">
          <span class="footer-brand__badge">P</span>
          <span class="logo__text">
            <span class="footer-brand__name">PASSINI</span>
            <span class="footer-brand__sub">DISTRIBUIDORA DE PEÇAS</span>
          </span>
        </div>
        <p class="footer-brand__desc">Distribuidora de auto peças com atendimento especializado a oficinas, lojas e frotistas.</p>
        <div class="footer-brand__phone">51 3579 7200</div>
      </div>
      <div>
        <div class="footer-col__title">Passini</div>
        <div class="footer-col__links">
          <a href="${base}sobre.html">Sobre a Passini</a>
          <a href="${base}unidades.html">Nossas unidades</a>
          <a href="${base}contato.html">Contato</a>
        </div>
      </div>
      <div>
        <div class="footer-col__title">Produtos</div>
        <div class="footer-col__links">
          <a href="${base}produtos.html">Catálogo</a>
          <a href="${base}busca.html">Encontre sua peça</a>
          <a href="${base}busca.html">Busca por veículo</a>
          <a href="${base}ia.html">Passini IA</a>
        </div>
      </div>
      <div>
        <div class="footer-col__title">Para oficinas</div>
        <div class="footer-col__links">
          <a href="${base}oficinas.html">Soluções para oficinas</a>
          <a href="${base}orcamento.html">Solicitar orçamento</a>
          <a href="${base}oficinas.html">Condições comerciais</a>
        </div>
      </div>
      <div>
        <div class="footer-col__title">Conteúdo</div>
        <div class="footer-col__links">
          <a href="${base}clube.html">Clube do Especialista</a>
          <a href="${base}clube.html">Dicas técnicas</a>
          <a href="${base}clube.html">Materiais técnicos</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Passini Distribuidora de Auto Peças. Protótipo de demonstração.</span>
      <div class="footer-bottom__legal">
        <a href="#">Política de privacidade</a>
        <a href="#">Termos de uso</a>
        <a href="#">Instagram</a>
        <a href="#">Facebook</a>
      </div>
    </div>
  </div>
</footer>

<div class="mobile-bottom-nav">
  <a href="${base}busca.html" class="mobile-bottom-nav__btn mobile-bottom-nav__btn--navy">Buscar peça</a>
  <a href="${base}ia.html" class="mobile-bottom-nav__btn mobile-bottom-nav__btn--outline">Passini IA</a>
  <a href="${base}contato.html" class="mobile-bottom-nav__btn mobile-bottom-nav__btn--yellow">WhatsApp</a>
</div>
`;
}

function renderScripts(scripts, base) {
  const all = ['app.js', ...(scripts || [])];
  return all.map((s) => `<script type="module" src="${base}js/${s}"></script>`).join('\n') + '\n';
}

function renderClosing() {
  return `</body>
</html>
`;
}

/**
 * Monta uma página completa a partir do conteúdo (o miolo que vai dentro de
 * <main>) + metadados extraídos do comentário <!--META {...}-->.
 */
function renderPage({ title, description, active, base = '', extraHead = '', scripts = [], mainClass = '' }, bodyContent) {
  return (
    renderHead({ title, description, base, extraHead }) +
    renderHeader(active, base, mainClass) +
    bodyContent.trim() +
    '\n\n' +
    renderFooter(base) +
    renderScripts(scripts, base) +
    renderClosing()
  );
}

// ---------------------------------------------------------------------------
// Utilitários de arquivo
// ---------------------------------------------------------------------------

function readJSON(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(relDistPath, content) {
  const full = path.join(DIST, relDistPath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, 'utf8');
}

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

/** Extrai o comentário <!--META {...}--> do topo de um fragmento de página. */
function parsePageFragment(raw) {
  const match = raw.match(/^\s*<!--META\s*([\s\S]*?)-->\s*/);
  if (!match) {
    throw new Error('Fragmento de página sem comentário <!--META {...}--> no topo.');
  }
  const meta = JSON.parse(match[1]);
  const body = raw.slice(match[0].length);
  return { meta, body };
}

// ---------------------------------------------------------------------------
// Fragmentos de lista/grade reaproveitados por mais de uma página, gerados a
// partir de data/*.json em vez de ficarem hardcoded no HTML (ETAPA 1/4 do
// README — cada categoria/unidade nova vira uma edição de JSON, não de HTML).
// ---------------------------------------------------------------------------

function renderCategoriesGrid(categorias) {
  return categorias
    .map(
      (c) => `      <a href="resultados.html?categoria=${c.id}" class="category-card category-card--full">
        <span class="category-card__initial">${c.inicial}</span>
        <span class="category-card__name--lg">${c.nome}</span>
        <span class="category-card__cta">Ver peças →</span>
      </a>`
    )
    .join('\n');
}

function renderUnitsList(unidades) {
  return unidades
    .map((u, i) => {
      const rows = [
        ['Endereço', u.endereco || 'a confirmar'],
        ['Telefone', u.telefone || 'a confirmar'],
        ['WhatsApp', u.whatsapp || 'a confirmar'],
        ['Horário', u.horario || 'a confirmar'],
      ]
        .map(([label, value]) => `          <div><div class="unit-row__label">${label}</div><div class="unit-row__value">${value}</div></div>`)
        .join('\n');
      const status = u.horario ? 'Aberta hoje' : 'Horário a confirmar';
      return `      <div class="unit-detail">
        <div class="unit-detail__header">
          <div>
            <span class="unit-card__tag">Unidade ${String(i + 1).padStart(2, '0')}</span>
            <h3 class="unit-detail__city">${u.nome}</h3>
          </div>
          <span class="unit-detail__status">${status}</span>
        </div>
        <div class="unit-detail__rows">
${rows}
        </div>
        <div class="unit-detail__actions">
          <a href="contato.html?unidade=${u.id}" class="btn btn--navy">Falar com esta unidade</a>
          <button class="btn btn--outline" type="button" data-unit-directions="${u.id}"${u.coordenadas ? '' : ' disabled'}>Como chegar</button>
        </div>
      </div>`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// 1. Páginas estáticas (a partir de src/pages/*.html)
// ---------------------------------------------------------------------------

function buildStaticPages(categorias, unidades) {
  const files = fs
    .readdirSync(SRC_PAGES)
    .filter((f) => f.endsWith('.html') && f !== 'produto.template.html');
  const generated = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(SRC_PAGES, file), 'utf8');
    const { meta, body } = parsePageFragment(raw);
    const filledBody = body
      .replace('{{CATEGORIES_GRID}}', () => renderCategoriesGrid(categorias))
      .replace('{{UNITS_LIST}}', () => renderUnitsList(unidades));
    const html = renderPage(meta, filledBody);
    writeFile(file, html);
    generated.push({ file, meta });
  }
  return generated;
}

// ---------------------------------------------------------------------------
// 2. Páginas de admin (src/pages/admin/*.html) — base relativo "../"
// ---------------------------------------------------------------------------

function buildAdminPages() {
  const adminDir = path.join(SRC_PAGES, 'admin');
  if (!fs.existsSync(adminDir)) return [];
  const files = fs.readdirSync(adminDir).filter((f) => f.endsWith('.html'));
  const generated = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(adminDir, file), 'utf8');
    const { meta, body } = parsePageFragment(raw);
    meta.base = '../';
    const html = renderPage(meta, body);
    writeFile(`admin/${file}`, html);
    generated.push({ file: `admin/${file}`, meta });
  }
  return generated;
}

// ---------------------------------------------------------------------------
// 3. Páginas de produto (uma por item de data/produtos.json)
// ---------------------------------------------------------------------------

function money(v) {
  if (v == null) return 'Sob consulta';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildProductPages(produtos, categorias, estoque) {
  const templatePath = path.join(SRC_PAGES, 'produto.template.html');
  if (!fs.existsSync(templatePath) || !produtos.length) return [];
  const raw = fs.readFileSync(templatePath, 'utf8');
  const { meta: baseMeta, body: templateBody } = parsePageFragment(raw);
  const categoriaById = Object.fromEntries(categorias.map((c) => [c.id, c]));
  const generated = [];

  for (const produto of produtos) {
    const categoria = categoriaById[produto.categoriaId];
    const relacionados = (produto.relacionados || [])
      .map((id) => produtos.find((p) => p.id === id))
      .filter(Boolean);
    const estoqueDoProduto = estoque.filter((e) => e.produtoId === produto.id);
    const disponivel = estoqueDoProduto.some((e) => e.disponivel);

    const compatRows = produto.compatibilidades
      .map(
        (c) =>
          `        <div class="compat-row"><span class="compat-row__model">${c.marca} ${c.modelo} ${c.motor}</span><span class="compat-row__years">${c.anoInicio}–${c.anoFim}</span></div>`
      )
      .join('\n');

    const relatedCards = relacionados
      .map(
        (r) => `      <a href="${r.slug}.html" class="related-card">
        <div class="related-card__image">foto do produto</div>
        <div class="related-card__body">
          <div class="related-card__marca">${r.marca}</div>
          <div class="related-card__name">${r.nome}</div>
          <div class="related-card__code">${r.codigo}</div>
        </div>
      </a>`
      )
      .join('\n');

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${produto.nome} ${produto.marca}`,
      sku: produto.codigo,
      brand: { '@type': 'Brand', name: produto.marca },
      description: produto.descricao,
      offers: {
        '@type': 'Offer',
        availability: disponivel ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        ...(produto.preco != null ? { price: produto.preco, priceCurrency: 'BRL' } : {}),
      },
    };

    const canonicalUrl = `${SITE_URL}/produto/${produto.slug}.html`;
    const extraHead = `<link rel="canonical" href="${canonicalUrl}">
<meta property="og:type" content="product">
<meta property="og:title" content="${produto.nome} ${produto.marca} | Passini Distribuidora de Peças">
<meta property="og:description" content="${produto.descricao}">
<meta property="og:url" content="${canonicalUrl}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
`;

    const body = templateBody
      .replaceAll('{{PRODUTO_NOME}}', produto.nome)
      .replaceAll('{{PRODUTO_MARCA}}', produto.marca)
      .replaceAll('{{PRODUTO_CODIGO}}', produto.codigo)
      .replaceAll('{{PRODUTO_DESCRICAO}}', produto.descricao)
      .replaceAll('{{PRODUTO_CATEGORIA}}', categoria ? categoria.nome : '')
      .replaceAll('{{PRODUTO_PRECO}}', money(produto.preco))
      .replaceAll('{{PRODUTO_DISPONIBILIDADE}}', disponivel ? 'Em estoque' : 'Sob consulta')
      .replaceAll('{{PRODUTO_ID}}', produto.id)
      .replaceAll('{{COMPAT_ROWS}}', compatRows || '        <div class="compat-row"><span class="compat-row__model">Aplicações a confirmar</span><span class="compat-row__years">—</span></div>')
      .replaceAll('{{RELATED_CARDS}}', relatedCards);

    const meta = {
      ...baseMeta,
      title: `${produto.nome} ${produto.marca} | Passini Distribuidora de Peças`,
      description: `${produto.nome} ${produto.marca} ${produto.codigo}. Consulte disponibilidade e solicite orçamento.`,
      base: '../',
      extraHead,
      active: 'produtos',
    };

    const html = renderPage(meta, body);
    writeFile(`produto/${produto.slug}.html`, html);
    generated.push({ file: `produto/${produto.slug}.html`, meta, produto });
  }

  return generated;
}

// ---------------------------------------------------------------------------
// 4. sitemap.xml / robots.txt
// ---------------------------------------------------------------------------

function buildSitemap(allPages) {
  const urls = allPages
    .filter((p) => !p.file.startsWith('admin/'))
    .map((p) => `  <url><loc>${SITE_URL}/${p.file}</loc></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  writeFile('sitemap.xml', xml);
}

function buildRobots() {
  const txt = `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  writeFile('robots.txt', txt);
}

// ---------------------------------------------------------------------------
// 5. favicon simples (derivado do badge "P" já usado na identidade visual)
// ---------------------------------------------------------------------------

function buildFavicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#072F63"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="800" font-size="36" fill="#F2C200">P</text></svg>`;
  writeFile('favicon.svg', svg);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);

  const categorias = readJSON('data/categorias.json');
  const produtos = readJSON('data/produtos.json');
  const estoque = readJSON('data/estoque.json');
  const unidades = readJSON('data/unidades.json');

  const staticPages = buildStaticPages(categorias, unidades);
  const adminPages = buildAdminPages();
  const productPages = buildProductPages(produtos, categorias, estoque);

  buildSitemap([...staticPages, ...productPages]);
  buildRobots();
  buildFavicon();

  copyRecursive(path.join(ROOT, 'css'), path.join(DIST, 'css'));
  copyRecursive(path.join(ROOT, 'js'), path.join(DIST, 'js'));
  copyRecursive(path.join(ROOT, 'data'), path.join(DIST, 'data'));
  copyRecursive(path.join(ROOT, 'imagem'), path.join(DIST, 'imagem'));

  console.log(`Build concluído: ${staticPages.length} páginas, ${productPages.length} produtos, ${adminPages.length} páginas admin.`);
  console.log(`Saída: ${path.relative(ROOT, DIST)}/`);
}

main();
