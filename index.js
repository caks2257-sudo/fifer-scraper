const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// 🔑 TU LLAVE MAESTRA DE SCRAPERAPI
const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 Servidor Scraper Industrial (ScraperAPI) Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ Iniciando asalto industrial a: ${categoryId}`);

  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;

  // Configuración de ScraperAPI: Renderizamos el JS y simulamos estar en Chile (country_code=cl)
  const scraperApiUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=cl`;

  try {
    console.log(`🔗 Enviando grúa de ScraperAPI a: ${targetUrl}`);
    
    // Le damos hasta 60 segundos porque ScraperAPI a veces tarda en burlar los CAPTCHAs
    const response = await axios.get(scraperApiUrl, { timeout: 60000 }); 
    
    console.log("📄 HTML recibido, analizando datos...");
    const $ = cheerio.load(response.data);
    
    const products = [];
    const seen = new Set();

    $('a').each((i, el) => {
      if (products.length >= 3) return false; // Rompe el ciclo si ya tenemos 3

      const href = $(el).attr('href');
      if (href && href.includes('articulo.mercadolibre.cl/MLC')) {
        const cleanLink = href.split('#')[0].split('?')[0];
        if (seen.has(cleanLink)) return true; // Continúa al siguiente si está repetido
        seen.add(cleanLink);

        // Buscamos el contenedor padre del producto
        const card = $(el).closest('.ui-search-result__wrapper, .poly-card, .ui-search-layout__item');
        if (card.length === 0) return true;

        const title = card.find('h2, h3, .ui-search-item__title').first().text().trim() || "Producto ML";
        const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
        const img = card.find('img').first();
        const imgUrl = img.attr('data-src') || img.attr('src') || "";

        products.push({
          id: cleanLink.match(/MLC-?(\d+)/)?.[0].replace('-', '') || "MLC-TEMP",
          title: title,
          price: parseInt(priceStr) || 0,
          permalink: cleanLink,
          thumbnail: imgUrl
        });
      }
    });

    if (products.length === 0) {
      console.log("⚠️ ScraperAPI pasó, pero no logramos leer los productos. ML pudo haber cambiado su estructura.");
    } else {
      console.log(`✅ ¡ÉXITO INDUSTRIAL! ${products.length} productos capturados de forma segura.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la conexión con ScraperAPI:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Scraper Industrial en puerto ${PORT}`));