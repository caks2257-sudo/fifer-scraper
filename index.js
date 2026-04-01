const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Infiltración Orgánica - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando búsqueda orgánica para: ${categoryId}`);

  // URL de búsqueda humana (más segura que la de categoría pura)
  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  
  // CONFIGURACIÓN: Sin renderizado (para evitar el 500) y con IP de Chile
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&device_type=mobile`;

  try {
    const response = await axios.get(scraperApiUrl, { timeout: 30000 });
    const $ = cheerio.load(response.data);
    const products = [];

    // 🕵️‍♂️ BÚSQUEDA DE ALTO ESPECTRO:
    // Buscamos cualquier enlace que lleve a un producto MLC
    $('a[href*="articulo.mercadolibre.cl/MLC"]').each((i, el) => {
      if (products.length >= 3) return false;

      const link = $(el).attr('href').split('#')[0].split('?')[0];
      const container = $(el).closest('li, div[class*="item"], div[class*="card"]');
      
      // Buscamos el Título (h2 o h3)
      const title = container.find('h2, h3').first().text().trim();
      
      // Buscamos el Precio (el número con clase "fraction")
      const priceText = container.find('.andes-money-amount__fraction').first().text().replace(/\./g, '');
      const price = parseInt(priceText) || 0;

      // Buscamos la Imagen
      const img = container.find('img').first().attr('data-src') || container.find('img').first().attr('src');

      if (title && price > 0) {
        products.push({
          id: link.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `REF-${i}`,
          title: title,
          price: price,
          permalink: link,
          thumbnail: img || ""
        });
      }
    });

    if (products.length === 0) {
      console.log("⚠️ La red salió vacía. Probando Plan B: Búsqueda de JSON en bruto...");
      // Si Cheerio falla, buscamos el JSON oculto en el HTML con Regex
      const regex = /"results":\s*(\[{"id":"MLC[\s\S]*?}\])/;
      const match = response.data.match(regex);
      if (match) {
        const rawResults = JSON.parse(match[1]);
        rawResults.slice(0, 3).forEach(item => {
          products.push({
            id: item.id,
            title: item.title,
            price: item.price,
            permalink: item.permalink,
            thumbnail: item.thumbnail
          });
        });
      }
    }

    console.log(`✅ [Referidos] Éxito: ${products.length} productos rescatados.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la obra:", err.message);
    res.status(500).json({ error: "Fallo de conexión", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Escáner en puerto ${PORT}`);
});