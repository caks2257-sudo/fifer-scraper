const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Infiltración Total - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando escaneo de alta sensibilidad: ${categoryId}`);

  // TÉCNICA: Usamos una URL de búsqueda por palabra clave (mascotas) para evitar bloqueos de categoría
  const targetUrl = `https://listado.mercadolibre.cl/animales-mascotas/_NoIndex_True`;
  
  // Usamos el túnel de ScraperAPI con IP de Chile y sesión persistente (ultra-camuflaje)
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true&session_number=${Math.floor(Math.random() * 1000)}`;

  try {
    const response = await axios.get(scraperApiUrl, { timeout: 40000 });
    const html = response.data;

    // 📸 RADIOGRAFÍA DE SEGURIDAD (Vemos qué nos manda ML realmente)
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    console.log(`📌 Título capturado: ${titleMatch ? titleMatch[1].trim() : "SIN TÍTULO"}`);

    const products = [];
    const seen = new Set();

    // 🕵️‍♂️ BÚSQUEDA POR ADN (REGEX): Buscamos enlaces MLC y precios cercanos
    // Buscamos el patrón: Enlace de producto + algo de texto + un precio
    const productRegex = /https:\/\/articulo\.mercadolibre\.cl\/MLC-(\d+)[\w-]+/g;
    let match;
    
    while ((match = productRegex.exec(html)) !== null && products.length < 3) {
      const fullUrl = match[0];
      if (seen.has(fullUrl)) continue;
      seen.add(fullUrl);

      // Buscamos un precio en las 500 letras siguientes al enlace
      const context = html.substring(match.index, match.index + 1000);
      const priceMatch = context.match(/class="[\w-]*price[\w-]*">[\s\S]*?\$([\d.]+)/) || context.match(/\$\s?([\d.]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/\./g, '')) : 0;

      // Intentamos rescatar un título del contexto (buscamos el texto dentro de un h2 o h3 cercano)
      const titleMatch = context.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i) || context.match(/title="([\s\S]*?)"/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : "Producto Referidos";

      if (price > 0) {
        products.push({
          id: `MLC${match[1]}`,
          title: title.substring(0, 80),
          price: price,
          permalink: fullUrl,
          thumbnail: "" // En este modo, la imagen es secundaria, lo importante es el dato
        });
      }
    }

    if (products.length === 0) {
      console.log("⚠️ La red salió vacía. ML está usando un escudo de invisibilidad total.");
    } else {
      console.log(`✅ [Referidos] ¡ORO ENCONTRADO! ${products.length} productos rescatados.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la inspección:", err.message);
    res.status(500).json({ error: "Error de conexión", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Escáner activo en puerto ${PORT}`);
});