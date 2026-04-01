const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Sistema de Emergencia V18 - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando maniobra de emergencia para: ${categoryId}`);

  // URL de búsqueda común, suele tener la "DOM" de Mercado Libre menos estricta
  const targetUrl = `https://listado.mercadolibre.cl/animales-mascotas`;
  
  // 💡 CAMBIO CRÍTICO: 
  // Quitamos 'render=true' para evitar el Error 500.
  // Usamos 'premium=true' para IPs residenciales chilenas.
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true&session_number=${Math.floor(Math.random() * 9999)}`;

  try {
    const response = await axios.get(tunnelUrl, { timeout: 35000 });
    const $ = cheerio.load(response.data);
    const html = response.data;
    
    console.log(`📌 Título capturado: ${$('title').text()}`);

    let products = [];

    // MODO 1: Escaneo de etiquetas HTML (Cheerio)
    $('.ui-search-result__wrapper, .poly-card, .ui-search-layout__item').each((i, el) => {
      if (products.length >= 3) return false;
      const card = $(el);
      const link = card.find('a').attr('href') || "";
      
      if (link.includes('articulo.mercadolibre.cl')) {
        const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
        if (parseInt(priceStr) > 0) {
          products.push({
            id: link.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `REF-${i}`,
            title: card.find('h2, h3').first().text().trim() || "Producto Referidos",
            price: parseInt(priceStr),
            permalink: link.split('#')[0].split('?')[0],
            thumbnail: card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || ""
          });
        }
      }
    });

    // MODO 2: Plan B (Si el HTML vino vacío, buscamos el JSON oculto con Regex)
    if (products.length === 0) {
      console.log("⚠️ HTML visual vacío, activando escáner de código fuente...");
      const regex = /"results":\s*(\[{"id":"MLC[\s\S]*?}\])\s*/;
      const match = html.match(regex);
      if (match) {
        const raw = JSON.parse(match[1]);
        products = raw.slice(0, 3).map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          permalink: item.permalink,
          thumbnail: item.thumbnail
        }));
      }
    }

    console.log(`✅ [Referidos] ¡Operación terminada! ${products.length} productos en el saco.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Error estructural:", err.message);
    res.status(500).json({ error: "Colapso de red en Referidos", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [Referidos] Motor en puerto ${PORT}`));