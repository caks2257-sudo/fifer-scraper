const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send("🚀 Servidor Scraper Sigiloso Activo");
});

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 100;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ Iniciando asalto sigiloso a: ${categoryId}`);
  
  let browser;
  try {
    // ⚙️ BANDERAS DE EXTREMO AHORRO DE MEMORIA RAM
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process' // <--- MAGIA PARA SERVIDORES DE 512MB
      ]
    });

    const page = await browser.newPage();

    // 🛡️ BLOQUEO DE IMÁGENES Y CSS (Ahorra un 80% de RAM y carga rapidísimo)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Camuflaje de idioma
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8'
    });
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    const url = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
    console.log(`🔗 Navegando ligero a: ${url}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log("🖱️ Scroll fantasma...");
    await autoScroll(page);

    const products = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'))
        .filter(a => a.href.includes('articulo.mercadolibre.cl/MLC'));

      const results = [];
      const seen = new Set();

      for (const a of links) {
        if (results.length >= 3) break;

        const cleanLink = a.href.split('#')[0].split('?')[0];
        if (seen.has(cleanLink)) continue;
        seen.add(cleanLink);

        const card = a.closest('.ui-search-result__wrapper') || a.closest('.poly-card') || a.parentElement;
        
        const title = card.querySelector('h2, h3, .ui-search-item__title')?.innerText.trim() || "Producto ML";
        const priceStr = card.querySelector('.andes-money-amount__fraction')?.innerText.replace(/\./g, '') || "0";
        // Buscamos la imagen aunque nosotros no la hayamos renderizado visualmente
        const img = card.querySelector('img');
        
        results.push({
          id: cleanLink.match(/MLC-?(\d+)/)?.[0].replace('-', '') || "MLC-TEMP",
          title: title,
          price: parseInt(priceStr),
          permalink: cleanLink,
          thumbnail: img?.getAttribute('data-src') || img?.src || ""
        });
      }
      return results;
    });

    await browser.close();

    if (products.length === 0) {
      console.log("⚠️ El escudo de Mercado Libre resistió. No hay productos.");
    } else {
      console.log(`✅ ¡ÉXITO! ${products.length} productos capturados.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    if (browser) await browser.close();
    console.error("❌ Colapso controlado:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Scraper Ligero en puerto ${PORT}`));