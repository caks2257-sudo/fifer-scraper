const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Rompehielos Anti-Bot V23 - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Lanzando Rompehielos (Antibot) para: ${categoryId}`);

  // Volvemos a la web pública, es la única ruta viable sin Token OAuth
  const targetUrl = `https://listado.mercadolibre.cl/animales-mascotas`;

  // 💣 LA CARGA EXPLOSIVA: antibot=true
  // Esto obliga a ScraperAPI a usar su motor de resolución de CAPTCHAs.
  // Consumirá más créditos de tu plan, pero es la herramienta diseñada para este muro.
  const tunnelUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&antibot=true&premium=true&country_code=cl`;

  try {
    // ⏳ TIEMPO EXTENDIDO: Resolver un CAPTCHA de DataDome toma tiempo. Le damos 60 segundos.
    console.log("⏳ Esperando que ScraperAPI resuelva el CAPTCHA (Puede tardar hasta 60s)...");
    const response = await axios.get(tunnelUrl, { timeout: 60000 });
    
    const html = response.data;
    const $ = cheerio.load(html);

    console.log(`📌 Título tras el muro: ${$('title').text()}`);

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

    if (products.length === 0) {
      console.log("⚠️ El Rompehielos cruzó, pero no vio productos. ML entregó un falso positivo.");
      return res.json({ results: [], status: "empty_shell" });
    }

    console.log(`✅ [Referidos] ¡MURALLA DESTRUIDA! ${products.length} productos obtenidos.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo del Rompehielos:", err.message);
    res.status(500).json({ error: "Tiempo agotado o bloqueo impenetrable", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [Referidos] Motor V23 en puerto ${PORT}`));