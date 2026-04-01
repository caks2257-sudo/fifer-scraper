const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Infiltración Silenciosa - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando infiltración en categoría: ${categoryId}`);

  // URL de categoría pura
  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  
  // 💡 CAMBIO TÁCTICO: Quitamos 'render=true' y 'device_type'. 
  // Queremos que ML piense que somos un servidor de Google indexando contenido.
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true`;

  try {
    const response = await axios.get(scraperApiUrl, { 
      timeout: 30000,
      headers: { 'Accept-Encoding': 'gzip, deflate, br' } 
    });
    
    const $ = cheerio.load(response.data);
    const products = [];
    const seenLinks = new Set();

    console.log(`📌 Título de la página: ${$('title').text()}`);

    // 🕵️‍♂️ BÚSQUEDA POR ADN: Buscamos enlaces que contengan 'articulo.mercadolibre.cl/MLC'
    $('a').each((i, el) => {
      if (products.length >= 3) return false;

      const href = $(el).attr('href') || "";
      if (href.includes('articulo.mercadolibre.cl/MLC')) {
        const cleanLink = href.split('#')[0].split('?')[0];
        
        if (seenLinks.has(cleanLink)) return;
        seenLinks.add(cleanLink);

        // Subimos al contenedor para buscar el precio y título
        const container = $(el).closest('li, div[class*="item"], div[class*="card"]');
        
        const title = container.find('h1, h2, h3').first().text().trim() || "Producto Referidos";
        const priceStr = container.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
        const img = container.find('img').first().attr('data-src') || container.find('img').first().attr('src');

        if (parseInt(priceStr) > 0 || title !== "Producto Referidos") {
          products.push({
            id: cleanLink.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `MLC-${i}`,
            title: title,
            price: parseInt(priceStr),
            permalink: cleanLink,
            thumbnail: img || ""
          });
        }
      }
    });

    console.log(`✅ [Referidos] Operación terminada. Encontrados: ${products.length}`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la infiltración:", err.message);
    res.status(500).json({ error: "Error de red", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Servidor en puerto ${PORT}`);
});