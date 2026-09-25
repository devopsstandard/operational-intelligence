/**
 * OmniPulse Market - Local Development & Preview Server
 * Zero-dependency Node.js HTTP server for local hosting of the frontend.
 * Fully supports live Cart drawer, AJAX Cart API, /cart page, and checkout confirmation.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const BASE_DIR = __dirname;
const STATIC_DIR = path.join(BASE_DIR, 'src', 'frontend', 'static');
const TEMPLATES_DIR = path.join(BASE_DIR, 'src', 'frontend', 'templates');
const PRODUCTS_FILE = path.join(BASE_DIR, 'src', 'productcatalogservice', 'products.json');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Currencies and exchange rates relative to USD
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
const CURRENCY_RATES = {
  USD: { rate: 1.0, symbol: '$' },
  EUR: { rate: 0.92, symbol: '€' },
  GBP: { rate: 0.78, symbol: '£' },
  JPY: { rate: 154.2, symbol: '¥' },
  CAD: { rate: 1.36, symbol: '$' }
};

let currentCurrency = 'USD';

// In-memory Cart Store: [{ id, name, picture, priceUsd, quantity }]
let cartItems = [];

// Load products
let productsData = [];
try {
  const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
  productsData = JSON.parse(raw).products || [];
} catch (e) {
  console.warn('Could not read products.json:', e.message);
}

function getProductRawPrice(p) {
  return (p.priceUsd.units || 0) + (p.priceUsd.nanos || 0) / 1e9;
}

function formatAmount(amountInUsd, curr) {
  const rateInfo = CURRENCY_RATES[curr] || CURRENCY_RATES.USD;
  const converted = amountInUsd * rateInfo.rate;
  if (curr === 'JPY') {
    return `${rateInfo.symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${rateInfo.symbol}${converted.toFixed(2)}`;
}

function getCartCalculation() {
  const rateInfo = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.USD;
  let subtotalUsd = 0;
  let totalCount = 0;

  const items = cartItems.map(item => {
    const rawPrice = getProductRawPrice(item);
    const lineTotalUsd = rawPrice * item.quantity;
    subtotalUsd += lineTotalUsd;
    totalCount += item.quantity;

    return {
      id: item.id,
      name: item.name,
      picture: item.picture,
      quantity: item.quantity,
      priceUsd: item.priceUsd,
      priceFormatted: formatAmount(rawPrice, currentCurrency),
      lineTotalFormatted: formatAmount(lineTotalUsd, currentCurrency)
    };
  });

  const shippingUsd = subtotalUsd >= 50 || subtotalUsd === 0 ? 0 : 4.99;
  const totalUsd = subtotalUsd + shippingUsd;

  return {
    items,
    count: totalCount,
    subtotalUsd,
    shippingUsd,
    totalUsd,
    subtotalFormatted: formatAmount(subtotalUsd, currentCurrency),
    shippingFormatted: shippingUsd === 0 ? 'FREE' : formatAmount(shippingUsd, currentCurrency),
    totalFormatted: formatAmount(totalUsd, currentCurrency)
  };
}

function renderHeader(cartCount = 0) {
  const headerTmpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'header.html'), 'utf8');
  const currencyOptions = CURRENCIES.map(c => 
    `<option value="${c}" ${c === currentCurrency ? 'selected="selected"' : ''}>${c}</option>`
  ).join('');

  return headerTmpl
    .replace(/\{\{\s*define\s*"header"\s*\}\}/g, '')
    .replace(/\{\{\s*end\s*\}\}\s*$/g, '')
    .replace(/\{\{\s*\$\.baseUrl\s*\}\}/g, '')
    .replace(/\{\{\s*if\s*\$\.show_currency\s*\}\}([\s\S]*?)\{\{\s*end\s*\}\}/g, (match, p1) => {
      return p1
        .replace(/\{\{\s*renderCurrencyLogo\s*\$\.user_currency\s*\}\}/g, CURRENCY_RATES[currentCurrency].symbol)
        .replace(/\{\{range\s*\$\.currencies\}\}[\s\S]*?\{\{end\}\}/g, currencyOptions);
    })
    .replace(/\{\{\s*if\s*\$\.assistant_enabled\s*\}\}([\s\S]*?)\{\{\s*end\s*\}\}/g, '$1')
    .replace(/\{\{\s*if\s*\$\.cart_size\s*\}\}[\s\S]*?\{\{\s*else\s*\}\}[\s\S]*?\{\{\s*end\s*\}\}/g, cartCount.toString())
    .replace(/\{\{\s*if\s*\$\.cart_size\s*\}\}([\s\S]*?)\{\{\s*end\s*\}\}/g, cartCount > 0 ? `<span class="omni-cart-badge">${cartCount}</span>` : '')
    .replace(/\{\{.*?\}\}/g, '');
}

function renderFooter() {
  const footerTmpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'footer.html'), 'utf8');
  return footerTmpl
    .replace(/\{\{\s*define\s*"footer"\s*\}\}/g, '')
    .replace(/\{\{\s*end\s*\}\}\s*$/g, '')
    .replace(/\{\{\s*\$\.baseUrl\s*\}\}/g, '')
    .replace(/\{\{.*?\}\}/g, '');
}

function renderHomePage() {
  const homeTmpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'home.html'), 'utf8');
  const cartInfo = getCartCalculation();
  const header = renderHeader(cartInfo.count);
  const footer = renderFooter();

  const productCardsHtml = productsData.map(p => {
    const rawPrice = getProductRawPrice(p);
    const priceStr = formatAmount(rawPrice, currentCurrency);
    const cat = (p.categories && p.categories[0]) ? p.categories[0].toUpperCase() : 'VERIFIED QUALITY';
    return `
      <div class="col-12 col-sm-6 col-lg-4 mb-4 product-item-card" data-name="${p.name}">
        <div class="omni-store-card">
          <a href="/product/${p.id}" class="omni-card-media">
            <img loading="lazy" src="${p.picture}" alt="${p.name}" class="omni-card-img">
            <span class="omni-tag-in-stock">In Stock</span>
          </a>
          
          <div class="omni-card-details">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="omni-card-category">${cat}</span>
              <span class="text-warning small font-weight-bold">★★★★★ <span class="text-muted">(4.9)</span></span>
            </div>
            <h3 class="omni-card-title">
              <a href="/product/${p.id}">${p.name}</a>
            </h3>
            
            <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <div class="omni-card-price">${priceStr}</div>
              <button type="button" class="btn omni-add-cart-btn" onclick="addToCart('${p.id}')">
                <span>Add to Bag</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('\n');

  return homeTmpl
    .replace(/\{\{\s*define\s*"home"\s*\}\}/g, '')
    .replace(/\{\{\s*template\s*"header"\s*\.\s*\}\}/g, header)
    .replace(/\{\{\s*range\s*\$\.products\s*\}\}[\s\S]*?\{\{\s*end\s*\}\}/g, productCardsHtml)
    .replace(/\{\{\s*template\s*"footer"\s*\.\s*\}\}/g, footer)
    .replace(/\{\{\s*\$\.baseUrl\s*\}\}/g, '')
    .replace(/\{\{.*?\}\}/g, '');
}

function renderCartPage() {
  const cartTmpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'cart.html'), 'utf8');
  const cartInfo = getCartCalculation();
  const header = renderHeader(cartInfo.count);
  const footer = renderFooter();

  if (cartInfo.items.length === 0) {
    return cartTmpl
      .replace(/\{\{\s*define\s*"cart"\s*\}\}/g, '')
      .replace(/\{\{\s*template\s*"header"\s*\.\s*\}\}/g, header)
      .replace(/\{\{\s*if\s*eq\s*\(len\s*\$\.items\)\s*0\s*\}\}([\s\S]*?)\{\{\s*else\s*\}\}[\s\S]*?\{\{\s*end\s*\}\}/g, '$1')
      .replace(/\{\{\s*template\s*"footer"\s*\.\s*\}\}/g, footer)
      .replace(/\{\{\s*\$\.baseUrl\s*\}\}/g, '')
      .replace(/\{\{.*?\}\}/g, '');
  }

  const itemsHtml = cartInfo.items.map(item => `
    <div class="d-flex align-items-center py-3 border-bottom flex-wrap gap-3">
        <a href="/product/${item.id}" style="width: 80px; height: 80px; flex-shrink: 0;" class="bg-light rounded p-1 d-flex align-items-center justify-content-center">
            <img src="${item.picture}" alt="${item.name}" class="img-fluid rounded" style="max-height: 100%; object-fit: cover;">
        </a>
        <div class="flex-grow-1 ml-3">
            <h5 class="font-weight-bold text-dark m-0 mb-1" style="font-size: 16px;">
                <a href="/product/${item.id}" class="text-dark text-decoration-none">${item.name}</a>
            </h5>
            <div class="small text-muted mb-2">SKU #${item.id}</div>
            <div class="d-flex align-items-center gap-3">
                <span class="small font-weight-bold text-muted">Qty: <strong>${item.quantity}</strong></span>
                <button class="btn btn-sm btn-link text-danger p-0 ml-2" onclick="updateCartItem('${item.id}', -${item.quantity})">Remove</button>
            </div>
        </div>
        <div class="text-right">
            <div class="font-weight-bold text-dark" style="font-size: 17px;">
                ${item.lineTotalFormatted}
            </div>
            <div class="small text-muted">${item.priceFormatted} each</div>
        </div>
    </div>
  `).join('\n');

  let body = cartTmpl
    .replace(/\{\{\s*define\s*"cart"\s*\}\}/g, '')
    .replace(/\{\{\s*template\s*"header"\s*\.\s*\}\}/g, header)
    .replace(/\{\{\s*if\s*eq\s*\(len\s*\$\.items\)\s*0\s*\}\}[\s\S]*?\{\{\s*else\s*\}\}([\s\S]*?)\{\{\s*end\s*\}\}/g, '$1')
    .replace(/\{\{\s*\$\.cart_size\s*\}\}/g, cartInfo.count.toString())
    .replace(/\{\{\s*range\s*\$\.items\s*\}\}[\s\S]*?\{\{\s*end\s*\}\}/g, itemsHtml)
    .replace(/\{\{\s*renderMoney\s*\.subtotal_cost\s*\}\}/g, cartInfo.subtotalFormatted)
    .replace(/\{\{\s*if\s*eq\s*\.shipping_cost\.Units\s*0\s*\}\}[\s\S]*?\{\{\s*else\s*\}\}[\s\S]*?\{\{\s*end\s*\}\}/g, cartInfo.shippingFormatted)
    .replace(/\{\{\s*renderMoney\s*\.total_cost\s*\}\}/g, cartInfo.totalFormatted)
    .replace(/\{\{\s*template\s*"footer"\s*\.\s*\}\}/g, footer)
    .replace(/\{\{\s*\$\.baseUrl\s*\}\}/g, '')
    .replace(/\{\{.*?\}\}/g, '');

  return body;
}

function renderOrderPage(order) {
  const orderTmpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'order.html'), 'utf8');
  const header = renderHeader(0);
  const footer = renderFooter();

  return orderTmpl
    .replace(/\{\{\s*define\s*"order"\s*\}\}/g, '')
    .replace(/\{\{\s*template\s*"header"\s*\.\s*\}\}/g, header)
    .replace(/\{\{\s*\.order\.OrderId\s*\}\}/g, order.orderId)
    .replace(/\{\{\s*\.order\.ShippingTrackingId\s*\}\}/g, order.trackingId)
    .replace(/\{\{\s*renderMoney\s*\.total_paid\s*\}\}/g, order.totalPaid)
    .replace(/\{\{\s*template\s*"footer"\s*\.\s*\}\}/g, footer)
    .replace(/\{\{\s*\$\.baseUrl\s*\}\}/g, '')
    .replace(/\{\{.*?\}\}/g, '');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 1. JSON API: Get Cart
  if (pathname === '/api/cart' && req.method === 'GET') {
    const data = getCartCalculation();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // 2. JSON API: Add Item to Cart
  if (pathname === '/api/cart/add' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const product = productsData.find(p => p.id === payload.id);
        if (product) {
          const qty = parseInt(payload.quantity) || 1;
          const existing = cartItems.find(i => i.id === product.id);
          if (existing) {
            existing.quantity += qty;
          } else {
            cartItems.push({
              id: product.id,
              name: product.name,
              picture: product.picture,
              priceUsd: product.priceUsd,
              quantity: qty
            });
          }
        }
        const data = getCartCalculation();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 3. JSON API: Update Item Quantity
  if (pathname === '/api/cart/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const index = cartItems.findIndex(i => i.id === payload.id);
        if (index !== -1) {
          const delta = parseInt(payload.delta) || 0;
          cartItems[index].quantity += delta;
          if (cartItems[index].quantity <= 0) {
            cartItems.splice(index, 1);
          }
        }
        const data = getCartCalculation();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 4. JSON API: Clear Cart
  if (pathname === '/api/cart/clear' && req.method === 'POST') {
    cartItems = [];
    const data = getCartCalculation();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // 5. Currency Switching
  if (pathname === '/setCurrency' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const chosen = params.get('currency_code');
      if (chosen && CURRENCIES.includes(chosen)) {
        currentCurrency = chosen;
      }
      res.writeHead(302, { Location: req.headers.referer || '/' });
      res.end();
    });
    return;
  }

  // 6. View Cart Page
  if (pathname === '/cart' && req.method === 'GET') {
    try {
      const html = renderCartPage();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error rendering cart: ' + e.message);
    }
    return;
  }

  // 7. Empty Cart Form POST
  if (pathname === '/cart/empty' && req.method === 'POST') {
    cartItems = [];
    res.writeHead(302, { Location: '/cart' });
    res.end();
    return;
  }

  // 8. Checkout Order Form POST
  if (pathname === '/cart/checkout' && req.method === 'POST') {
    const cartInfo = getCartCalculation();
    const orderId = `OMNI-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingId = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const totalPaid = cartInfo.totalFormatted;

    // Clear cart after checkout
    cartItems = [];

    try {
      const html = renderOrderPage({ orderId, trackingId, totalPaid });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error rendering order confirmation: ' + e.message);
    }
    return;
  }

  // 9. Static Assets
  if (pathname.startsWith('/static/')) {
    const relativePath = pathname.replace(/^\/static\//, '');
    const filePath = path.join(STATIC_DIR, relativePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Static asset not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }

  // 10. Homepage
  if (pathname === '/' || pathname === '/index.html') {
    try {
      const html = renderHomePage();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error: ' + e.message);
    }
    return;
  }

  // 11. View Product Page (or redirect to home)
  if (pathname.startsWith('/product/')) {
    res.writeHead(302, { Location: '/#products-grid' });
    res.end();
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Page not found');
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 OmniPulse Market Preview Server is LIVE with Full Cart!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🛒 Cart Endpoint: http://localhost:${PORT}/cart`);
  console.log(`================================================================`);
});
