const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Infiltración Orgánica V15 - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando búsqueda orgánica para: ${categoryId}`);

  // TÉCNICA: Usamos una URL de búsqueda común. ML sospecha menos de las búsquedas que de las categorías.
  const targetUrl = `https://listado.mercadolibre.cl/perros-mascotas/_NoIndex_True`;
  
  // Usamos el túnel de ScraperAPI pero forzamos el modo "Premium" con IP residencial de Chile.
  // Añadimos un número de sesión aleatorio para que ML crea que es un usuario nuevo cada vez.
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true&session_number=${Math.floor(Math.random() * 9999)}`;

  try {
    const response = await axios.get(tunnelUrl, { 
      timeout: 40000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    const html = response.data;
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    console.log(`📌 Título capturado: ${titleMatch ? titleMatch[1].trim() : "VACÍO"}`);

    const products = [];
    const seen = new Set();

    // 🕵️‍♂️ BÚSQUEDA POR ADN (REGEX): Buscamos el patrón de productos MLC
    // Buscamos cualquier enlace que empiece con articulo.mercadolibre.cl/MLC-
    const productRegex = /https:\/\/articulo\.mercadolibre\.cl\/MLC-(\d+)[^"]+/g;
    let match;

    while ((match = productRegex.exec(html)) !== null && products.length < 3) {
      const fullUrl = match[0].split('#')[0].split('?')[0];
      if (seen.has(fullUrl)) continue;
      seen.add(fullUrl);

      // Buscamos un precio en el texto cercano (buscamos el signo $ y números)
      const context = html.substring(match.index, match.index + 1500);
      const priceMatch = context.match(/\$\s?([\d.]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/\./g, '')) : 0;

      // Intentamos rescatar un título de las etiquetas alt de las imágenes o h2
      const titleMatch = context.match(/alt="([^"]+)"/i) || context.match(/>([^<]{10,80})<\/h[23]>/i);
      const title = titleMatch ? titleMatch[1].trim() : "Producto Referidos";

      if (price > 1000) { // Filtramos basura
        products.push({
          id: `MLC${match[1]}`,
          title: title,
          price: price,
          permalink: fullUrl,
          thumbnail: "" 
        });
      }
    }

    console.log(`✅ [Referidos] Resultado de la operación: ${products.length} productos.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la inspección:", err.message);
    res.status(500).json({ error: "Fallo de red en Referidos", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Escáner V15 encendido en puerto ${PORT}`);
});