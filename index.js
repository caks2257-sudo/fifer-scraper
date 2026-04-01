const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Escáner SEO de Alta Precisión - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Escaneando datos SEO para: ${categoryId}`);

  // Usamos la URL de categoría oficial
  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  
  // Usamos ScraperAPI estándar (rápido) pero con IP de Chile
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl`;

  try {
    const response = await axios.get(scraperApiUrl, { timeout: 45000 });
    const $ = cheerio.load(response.data);
    
    let products = [];

    // 🕵️‍♂️ BUSQUEDA POR DUCTOS (JSON-LD): 
    // Buscamos los scripts que ML le manda a Google
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const jsonData = JSON.parse($(el).html());
        
        // Buscamos dentro del objeto de ML el "itemListElement"
        if (jsonData.itemListElement) {
          jsonData.itemListElement.slice(0, 3).forEach((item, index) => {
            const detail = item.item || {};
            products.push({
              id: detail.url?.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `REF-${index}`,
              title: detail.name || "Producto",
              price: detail.offers?.price || 0,
              permalink: detail.url || targetUrl,
              thumbnail: detail.image || ""
            });
          });
        }
      } catch (e) {
        // Si un bloque falla, seguimos al siguiente
      }
    });

    // PLAN B: Si Google no nos salvó, usamos el selector de emergencia para las nuevas tarjetas "Poly"
    if (products.length === 0) {
      console.log("⚠️ SEO no encontrado, activando Plan B (Selectores de Emergencia)");
      $('.poly-card, .ui-search-result').each((i, el) => {
        if (products.length >= 3) return false;
        const card = $(el);
        products.push({
          id: card.find('a').attr('href')?.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `ID-${i}`,
          title: card.find('h2').text().trim(),
          price: parseInt(card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '')) || 0,
          permalink: card.find('a').attr('href'),
          thumbnail: card.find('img').attr('data-src') || card.find('img').attr('src')
        });
      });
    }

    console.log(`✅ [Referidos] ¡BINGO! ${products.length} productos rescatados.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la inspección:", err.message);
    res.status(500).json({ error: "Fallo de conexión", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Escáner en puerto ${PORT}`);
});