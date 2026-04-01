const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] API Blindada y Lista");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Extrayendo categoría: ${categoryId}`);

  // Usamos la URL de la web normal, que ScraperAPI maneja mucho mejor
  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  
  // Túnel básico: Sin renderizado (más rápido) y con IP de Chile
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl`;

  try {
    const response = await axios.get(scraperApiUrl, { timeout: 40000 });
    const $ = cheerio.load(response.data);
    const products = [];

    // Buscamos cualquier elemento que parezca una tarjeta de producto
    $('.ui-search-result__wrapper, .poly-card, .ui-search-layout__item').each((i, el) => {
      if (products.length >= 3) return false;

      const card = $(el);
      const aTag = card.find('a').first();
      const href = aTag.attr('href') || "";
      
      // Selectores ultra-flexibles para el Título y Precio
      const title = card.find('h2').first().text().trim() || "Producto";
      const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
      const img = card.find('img').first();
      const imgUrl = img.attr('data-src') || img.attr('src') || "";

      if (parseInt(priceStr) > 0) {
        products.push({
          id: href.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `MLC-${Math.floor(Math.random()*1000)}`,
          title: title,
          price: parseInt(priceStr),
          permalink: href.split('#')[0].split('?')[0],
          thumbnail: imgUrl
        });
      }
    });

    console.log(`✅ [Referidos] ${products.length} productos obtenidos.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en el túnel:", err.message);
    res.status(500).json({ error: "Error de conexión", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Motor en puerto ${PORT}`);
});