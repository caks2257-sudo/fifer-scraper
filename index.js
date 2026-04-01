const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Sistema de Extracción V7 - Nivel Industrial");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando extracción de alta precisión: ${categoryId}`);

  // URL de categoría oficial
  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  
  // CONFIGURACIÓN TÁCTICA: 
  // 1. Forzamos un User-Agent de móvil (iPhone)
  // 2. Usamos IPs residenciales premium de Chile
  // 3. Activamos render=true para que el JS se ejecute sí o sí
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true&render=true&device_type=mobile`;

  try {
    const response = await axios.get(scraperApiUrl, { timeout: 80000 });
    const $ = cheerio.load(response.data);
    
    console.log(`📌 Título capturado: ${$('title').text()}`);

    const products = [];

    // ESTRATEGIA: Buscamos cualquier enlace que sea un producto MLC
    // y extraemos la información de su "caja" contenedora más cercana.
    $('a[href*="articulo.mercadolibre.cl/MLC"]').each((i, el) => {
      if (products.length >= 3) return false;

      const link = $(el).attr('href');
      const container = $(el).closest('div, li, section'); // Buscamos la caja del producto
      
      // Intentamos pescar el precio (buscamos números con puntos o formatos de precio)
      let priceText = container.find('[class*="price"], [class*="money"], [class*="amount"]').text();
      let cleanPrice = priceText.replace(/\D/g, ''); // Quitamos todo lo que no sea número

      // Si no hay precio en la caja, buscamos en el texto del enlace (a veces viene ahí)
      if (!cleanPrice || cleanPrice === "0") {
          cleanPrice = container.text().match(/\$\s?(\d+[\d\.]*)/)?.[1]?.replace(/\./g, '') || "0";
      }

      const title = container.find('h1, h2, h3, [class*="title"]').first().text().trim();
      const img = container.find('img').first().attr('src') || container.find('img').first().attr('data-src');

      if (parseInt(cleanPrice) > 500) { // Filtro para evitar basura o precios mal leídos
        products.push({
          id: link.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `ID-${i}`,
          title: title || "Producto Referidos",
          price: parseInt(cleanPrice),
          permalink: link.split('#')[0].split('?')[0],
          thumbnail: img || ""
        });
      }
    });

    if (products.length === 0) {
      console.log("⚠️ La red salió vacía. ML está usando un diseño fantasma.");
    } else {
      console.log(`✅ [Referidos] ¡ÉXITO! ${products.length} productos capturados.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la obra:", err.message);
    res.status(500).json({ error: "Fallo técnico", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Servidor en puerto ${PORT}`);
});