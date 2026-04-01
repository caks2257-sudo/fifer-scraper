const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 Servidor Scraper Industrial Activo y Listo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ Iniciando asalto industrial a: ${categoryId}`);

  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  const scraperApiUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=cl&premium=true`;

  try {
    console.log(`🔗 Enviando grúa de ScraperAPI a: ${targetUrl}`);
    const response = await axios.get(scraperApiUrl, { timeout: 90000 }); 
    
    console.log("📄 HTML de la bóveda recibido, extrayendo oro...");
    const $ = cheerio.load(response.data);
    
    const products = [];

    // RED DE ARRASTRE: Buscamos las "cajas" contenedoras de los productos
    $('.ui-search-layout__item, .poly-card').each((i, el) => {
      if (products.length >= 3) return false; // Parar al tener 3

      const card = $(el);
      
      // 1. Buscamos el primer enlace dentro de la caja
      const aTag = card.find('a').first();
      const href = aTag.attr('href') || "";
      if (!href) return true; // Si no hay enlace, pasamos a la siguiente caja
      
      const cleanLink = href.split('#')[0].split('?')[0];

      // 2. Buscamos el Título (ML usa h2 para los títulos de productos)
      const title = card.find('h2.ui-search-item__title, h2.poly-box, h2').first().text().trim() || "Producto ML";

      // 3. Buscamos el Precio
      const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
      
      // 4. Buscamos la Imagen (puede estar en src o data-src si hay lazy load)
      const img = card.find('img').first();
      const imgUrl = img.attr('data-src') || img.attr('src') || "";

      // 5. Intentamos sacar el ID (MLC...), si no lo encontramos, inventamos uno temporal para que no falle tu base de datos
      const idMatch = cleanLink.match(/MLC-?(\d+)/);
      const id = idMatch ? idMatch[0].replace('-', '') : `MLC-${Math.floor(Math.random() * 100000)}`;

      // Solo guardamos si pescamos un precio válido
      if (parseInt(priceStr) > 0) {
        products.push({
          id: id,
          title: title,
          price: parseInt(priceStr),
          permalink: cleanLink,
          thumbnail: imgUrl
        });
      }
    });

    if (products.length === 0) {
      console.log("⚠️ Estamos adentro, pero no encontramos las etiquetas de precio o título. ML cambió el diseño hoy.");
    } else {
      console.log(`✅ ¡ÉXITO MONUMENTAL! ${products.length} productos capturados de la bóveda.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la conexión:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Scraper Industrial en puerto ${PORT}`));