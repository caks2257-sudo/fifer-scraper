const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Extracción Híbrido - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Operación de búsqueda internacional: ${categoryId}`);

  // Usamos una URL de búsqueda por palabra clave, que es más "permisiva" que la de categoría
  const targetUrl = `https://listado.mercadolibre.cl/mascotas-${categoryId}`;
  
  // CAMBIO TÁCTICO: country_code=us (IP de EE.UU.) + render=false (para evitar detección de headless)
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=us&premium=true`;

  try {
    const response = await axios.get(scraperApiUrl, { timeout: 45000 });
    const $ = cheerio.load(response.data);
    
    console.log(`📌 Título capturado en la bóveda: ${$('title').text()}`);

    const products = [];

    // 🕵️‍♂️ MÉTODO DE EXTRACCIÓN POR PROXIMIDAD (EL MÁS FUERTE)
    // Buscamos todos los enlaces de productos
    $('a[href*="articulo.mercadolibre.cl/MLC"]').each((i, el) => {
      if (products.length >= 3) return false;

      const link = $(el).attr('href');
      const cleanLink = link.split('#')[0].split('?')[0];

      // Buscamos el contenedor más cercano que tenga un precio
      const parent = $(el).closest('div, li, section');
      
      // Buscamos el precio con una expresión regular sobre el texto del contenedor
      const text = parent.text();
      const priceMatch = text.match(/\$\s?(\d+[\d\.]*)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/\./g, '')) : 0;

      // Buscamos el título (suele ser el texto del enlace o un H2/H3 cercano)
      let title = $(el).find('h1, h2, h3').text().trim() || $(el).text().trim();
      if (title.length < 5) title = parent.find('h2, h3').first().text().trim();

      // Buscamos la imagen
      const img = parent.find('img').first().attr('data-src') || parent.find('img').first().attr('src');

      if (price > 0 && title.length > 5) {
        products.push({
          id: cleanLink.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `REF-${i}`,
          title: title.substring(0, 100),
          price: price,
          permalink: cleanLink,
          thumbnail: img || ""
        });
      }
    });

    console.log(`✅ [Referidos] Finalizado: ${products.length} productos rescatados.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en el túnel:", err.message);
    res.status(500).json({ error: "Error de conexión", detail: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Escáner en puerto ${PORT}`);
});