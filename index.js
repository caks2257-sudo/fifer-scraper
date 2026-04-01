const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] API Blindada V5 - Operativa");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Intento de extracción profunda: ${categoryId}`);

  // URL de búsqueda directa, suele ser más "limpia" para el scraper
  const targetUrl = `https://listado.mercadolibre.cl/${categoryId}`;
  
  // ACTIVAMOS render=true para que cargue los precios dinámicos
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&render=true`;

  try {
    const response = await axios.get(scraperApiUrl, { timeout: 60000 });
    const $ = cheerio.load(response.data);
    
    // Diagnóstico en consola
    console.log(`📌 Título de página capturado: ${$('title').text()}`);

    const products = [];
    
    // RED DE ARRASTRE: Buscamos en todos los contenedores posibles de ML (clásico, poly, móvil)
    const selectors = [
      '.ui-search-result__wrapper', 
      '.poly-card', 
      '.ui-search-layout__item',
      '.ui-search-result',
      'li[class*="search-layout__item"]'
    ];

    $(selectors.join(', ')).each((i, el) => {
      if (products.length >= 3) return false;

      const card = $(el);
      
      // Buscamos el link (indispensable)
      const aTag = card.find('a[href*="articulo.mercadolibre.cl/MLC"]').first();
      const href = aTag.attr('href') || card.find('a').first().attr('href') || "";
      if (!href) return true;

      // Buscamos el Título (en cualquier h1, h2 o h3)
      const title = card.find('h1, h2, h3, .ui-search-item__title, .poly-component__title').first().text().trim();
      
      // Buscamos el Precio (el número grande)
      const priceStr = card.find('.andes-money-amount__fraction, .price-tag-fraction').first().text().replace(/\./g, '') || "0";
      
      // Buscamos la Imagen
      const img = card.find('img').first();
      const imgUrl = img.attr('data-src') || img.attr('src') || "";

      if (title && parseInt(priceStr) > 0) {
        products.push({
          id: href.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `MLC-${i}`,
          title: title,
          price: parseInt(priceStr),
          permalink: href.split('#')[0].split('?')[0],
          thumbnail: imgUrl
        });
      }
    });

    console.log(`✅ [Referidos] Resultado final: ${products.length} productos.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en el túnel:", err.message);
    res.status(500).json({ error: "Fallo de extracción", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [Referidos] Motor en puerto ${PORT}`));