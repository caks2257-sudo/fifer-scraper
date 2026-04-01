const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Extracción Forense V17 - Online");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando peritaje de alta visibilidad: ${categoryId}`);

  // URL de búsqueda directa, evitamos el ID técnico para no levantar sospechas
  const targetUrl = `https://listado.mercadolibre.cl/mascotas`;
  
  // 💎 LA LLAVE MAESTRA:
  // render=true + wait_until (espera a que el JS termine) 
  // + premium (IP residencial chilena)
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true&render=true&wait_until=networkidle0`;

  try {
    // Aumentamos el timeout a 90 segundos porque esta carga es pesada
    const response = await axios.get(scraperApiUrl, { timeout: 90000 });
    const $ = cheerio.load(response.data);
    
    console.log(`📌 Título capturado: ${$('title').text()}`);

    const products = [];

    // Buscamos en cualquier contenedor de producto (clásico o nuevo)
    $('.ui-search-result__wrapper, .poly-card, .ui-search-layout__item').each((i, el) => {
      if (products.length >= 3) return false;

      const card = $(el);
      const link = card.find('a').attr('href') || "";
      
      // Solo si es un link de producto real
      if (link.includes('articulo.mercadolibre.cl')) {
        const title = card.find('h1, h2, h3').first().text().trim();
        const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
        const img = card.find('img').first().attr('data-src') || card.find('img').first().attr('src');

        products.push({
          id: link.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `REF-${i}`,
          title: title,
          price: parseInt(priceStr),
          permalink: link.split('#')[0].split('?')[0],
          thumbnail: img || ""
        });
      }
    });

    if (products.length === 0) {
      console.log("⚠️ El peritaje no encontró productos. ML entregó un cascarón.");
    } else {
      console.log(`✅ [Referidos] ¡Viga instalada! ${products.length} productos obtenidos.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Error en la faena:", err.message);
    res.status(500).json({ error: "Fallo de conexión profunda", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Escáner V17 operativo en puerto ${PORT}`);
});