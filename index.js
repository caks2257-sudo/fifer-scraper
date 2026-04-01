const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor Blindado V24 (Asalto Dual) - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando Asalto Dual para: ${categoryId}`);

  // ==========================================
  // PLAN A: API Oficial con Pool Residencial Global
  // ==========================================
  // LA CLAVE: Sin 'country_code'. Usamos la red residencial mundial de ScraperAPI.
  const apiUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}&limit=5`;
  const tunnelApi = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(apiUrl)}&premium=true`;

  try {
    console.log("🚁 [Plan A] Intentando extraer JSON puro vía pool global...");
    // Tiempo corto para que si falla, salte rápido al Plan B
    const responseApi = await axios.get(tunnelApi, { timeout: 20000 });
    
    if (responseApi.data && responseApi.data.results) {
      const products = responseApi.data.results.slice(0, 3).map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        permalink: item.permalink,
        thumbnail: item.thumbnail?.replace("-I.jpg", "-O.jpg")
      }));
      
      if (products.length > 0) {
        console.log(`✅ [Referidos] ¡BÓVEDA API VULNERADA! ${products.length} productos listos.`);
        return res.json({ results: products });
      }
    }
  } catch (errApi) {
    console.log(`⚠️ [Plan A] El guardia bloqueó la API (${errApi.message}). Desplegando El Tanque...`);
  }

  // ==========================================
  // PLAN B: El Tanque (Antibot + Render)
  // ==========================================
  // Si la API falla, atacamos la web forzando CAPTCHA (antibot) y ejecución JS (render)
  const webUrl = `https://listado.mercadolibre.cl/animales-mascotas`;
  const tunnelWeb = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(webUrl)}&premium=true&antibot=true&render=true`;

  try {
    console.log("🚜 [Plan B] Desplegando El Tanque (Render + Antibot)... Puede tardar 60s.");
    const responseWeb = await axios.get(tunnelWeb, { timeout: 70000 });
    const $ = cheerio.load(responseWeb.data);
    
    console.log(`📌 Título tras la demolición visual: ${$('title').text()}`);

    let products = [];
    $('.ui-search-result__wrapper, .poly-card').each((i, el) => {
      if (products.length >= 3) return false;
      const card = $(el);
      const link = card.find('a').attr('href') || "";

      if (link.includes('articulo.mercadolibre.cl')) {
        const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
        if (parseInt(priceStr) > 0) {
          products.push({
            id: link.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `REF-${i}`,
            title: card.find('h2, h3').first().text().trim(),
            price: parseInt(priceStr),
            permalink: link.split('#')[0].split('?')[0],
            thumbnail: card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || ""
          });
        }
      }
    });

    if (products.length > 0) {
      console.log(`✅ [Referidos] ¡TANQUE EXITOSO! ${products.length} productos obtenidos.`);
      return res.json({ results: products });
    } else {
      console.log("❌ [Plan B] El Tanque cruzó, encendió la luz, pero el HTML vino sin datos.");
      return res.status(500).json({ error: "Bloqueo Absoluto", status: "empty_shell" });
    }

  } catch (errWeb) {
    console.error("❌ Fallo general de sistemas:", errWeb.message);
    res.status(500).json({ error: "Colapso Estructural", details: errWeb.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [Referidos] Motor V24 en puerto ${PORT}`));