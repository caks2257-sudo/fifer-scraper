const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Navegación Interna - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Accediendo por el ducto de navegación: ${categoryId}`);

  // 💎 LA LLAVE MAESTRA: Este es el endpoint interno que usa ML para cargar resultados
  const targetUrl = `https://www.mercadolibre.cl/navigation/search-results?category=${categoryId}`;
  
  // Usamos ScraperAPI como túnel simple (sin renderizado para que sea indetectable)
  // Forzamos IP de Chile para que no pida selección de país
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true`;

  try {
    const response = await axios.get(tunnelUrl, { 
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Simulamos ser una petición interna de su web
      }
    });
    
    // ML en este endpoint devuelve un JSON gigante con toda la estructura de la página
    const searchData = response.data;
    const results = searchData.results || [];

    const products = results.slice(0, 3).map(item => ({
      id: item.id,
      title: item.title?.name || item.title || "Producto Referidos",
      price: item.price?.amount || item.price || 0,
      permalink: item.permalink,
      thumbnail: item.thumbnail
    }));

    if (products.length === 0) {
      console.log("⚠️ El ducto está seco. ML detectó el movimiento.");
      // Plan C: Si el JSON interno falla, devolvemos un mensaje de "obra en pausa"
      return res.json({ 
        results: [], 
        status: "under_construction", 
        message: "ML aplicó bloqueo de región IP. Reintenta en 15 minutos." 
      });
    }

    console.log(`✅ [Referidos] ¡INFILTRACIÓN EXITOSA! ${products.length} productos en el saco.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en el ducto:", err.message);
    res.status(500).json({ error: "Error de conexión interna", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [Referidos] Escáner V19 en puerto ${PORT}`));