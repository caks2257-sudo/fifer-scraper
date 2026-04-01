const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Sistema de Extracción Operativo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Extrayendo oro de categoría: ${categoryId}`);

  // LA RUTA MAESTRA: Así es como ML identifica las categorías reales
  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  
  // Usamos el túnel de ScraperAPI con renderizado para asegurar que carguen los precios
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&render=true`;

  try {
    const response = await axios.get(scraperApiUrl, { timeout: 70000 });
    const $ = cheerio.load(response.data);
    
    console.log(`📌 Título real capturado: ${$('title').text()}`);

    const products = [];

    // Buscamos cualquier elemento que parezca un producto
    $('.ui-search-result__wrapper, .poly-card, .ui-search-layout__item').each((i, el) => {
      if (products.length >= 3) return false;

      const card = $(el);
      const aTag = card.find('a').first();
      const href = aTag.attr('href') || "";
      if (!href) return true;

      // Selectores simplificados al máximo
      const title = card.find('h1, h2, h3').first().text().trim();
      const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
      const img = card.find('img').first();
      const imgUrl = img.attr('data-src') || img.attr('src') || "";

      if (parseInt(priceStr) > 0) {
        products.push({
          id: href.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `ID-${i}`,
          title: title,
          price: parseInt(priceStr),
          permalink: href.split('#')[0].split('?')[0],
          thumbnail: imgUrl
        });
      }
    });

    console.log(`✅ [Referidos] Éxito: ${products.length} productos extraídos.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la faena:", err.message);
    res.status(500).json({ error: "Error de extracción", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Microservicio en puerto ${PORT}`);
});