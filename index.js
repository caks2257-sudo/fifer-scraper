const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 Servidor Scraper Industrial (ScraperAPI) Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ Iniciando asalto industrial a: ${categoryId}`);

  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;

  // QUITAMOS render=true (ML ya trae datos en HTML puro) y AÑADIMOS premium=true
  const scraperApiUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true`;

  try {
    console.log(`🔗 Enviando grúa de ScraperAPI a: ${targetUrl}`);
    
    const response = await axios.get(scraperApiUrl, { timeout: 60000 }); 
    
    console.log("📄 HTML recibido, analizando datos...");
    const $ = cheerio.load(response.data);
    
    // 📌 EL CHIVATO: Imprimimos el título de la página vista
    const pageTitle = $('title').text();
    console.log(`📌 Título de la página vista por ScraperAPI: ${pageTitle}`);

    const products = [];
    const seen = new Set();

    // Búsqueda tipo bulldozer: Buscamos TODOS los enlaces de artículos MLC
    $('a[href*="articulo.mercadolibre.cl/MLC"]').each((i, el) => {
      if (products.length >= 3) return false; // Parar al tener 3

      const href = $(el).attr('href');
      const cleanLink = href.split('#')[0].split('?')[0];
      
      if (seen.has(cleanLink)) return true;
      seen.add(cleanLink);

      // Subimos al contenedor de la tarjeta (buscamos cualquier 'li' o 'div' contenedor)
      const card = $(el).closest('li, .poly-card, .ui-search-layout__item');
      
      // Extracción agresiva
      let title = card.find('h2, h3').first().text().trim();
      if (!title) title = $(el).text().trim() || "Producto ML"; // Plan B para el título

      const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
      const imgUrl = card.find('img').attr('data-src') || card.find('img').attr('src') || "";

      // Solo guardamos si logramos pescar un precio o título válido
      if (title !== "Producto ML" || parseInt(priceStr) > 0) {
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
      console.log("⚠️ ScraperAPI pasó, pero la red salió vacía. Revisa el Título impreso arriba.");
    } else {
      console.log(`✅ ¡ÉXITO INDUSTRIAL! ${products.length} productos capturados.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la conexión:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Scraper Industrial en puerto ${PORT}`));