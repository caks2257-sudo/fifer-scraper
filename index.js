const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 Servidor Scraper Industrial (Forense) Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ Iniciando asalto industrial a: ${categoryId}`);

  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;

  // LA COMBINACIÓN NUCLEAR: render=true (para ejecutar JS) + premium=true (IPs residenciales reales)
  const scraperApiUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=cl&premium=true`;

  try {
    console.log(`🔗 Enviando grúa de ScraperAPI a: ${targetUrl}`);
    
    // Le damos hasta 90 segundos, el renderizado premium toma su tiempo
    const response = await axios.get(scraperApiUrl, { timeout: 90000 }); 
    
    console.log("📄 HTML recibido, analizando datos...");
    
    // 📸 FOTO FORENSE: Imprimimos los primeros 500 caracteres de lo que nos mandó ML
    console.log("📸 RADIOGRAFÍA DEL HTML RECIBIDO:");
    console.log(response.data.substring(0, 500));
    console.log("-----------------------------------");

    const $ = cheerio.load(response.data);
    const pageTitle = $('title').text();
    console.log(`📌 Título de la página: ${pageTitle}`);

    const products = [];
    const seen = new Set();

    $('a[href*="articulo.mercadolibre.cl/MLC"]').each((i, el) => {
      if (products.length >= 3) return false;

      const href = $(el).attr('href');
      const cleanLink = href.split('#')[0].split('?')[0];
      
      if (seen.has(cleanLink)) return true;
      seen.add(cleanLink);

      const card = $(el).closest('li, .poly-card, .ui-search-layout__item, .ui-search-result__wrapper');
      
      let title = card.find('h2, h3').first().text().trim();
      if (!title) title = $(el).text().trim() || "Producto ML";

      const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
      const imgUrl = card.find('img').attr('data-src') || card.find('img').attr('src') || "";

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
      console.log("⚠️ La red salió vacía. Revisa la radiografía del HTML para ver qué nos bloqueó.");
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