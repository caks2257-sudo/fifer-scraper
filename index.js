const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] API de Datos Blindada - Operativa");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando infiltración en API para: ${categoryId}`);

  // 🎯 LA VIGA MAESTRA: Usamos la API de búsqueda oficial, pero a través del túnel de ScraperAPI
  const mlApiUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}&limit=3`;
  
  // Usamos premium=true y country_code=cl para que ML crea que es una petición interna de Chile
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(mlApiUrl)}&country_code=cl&premium=true`;

  try {
    const response = await axios.get(tunnelUrl, { 
      timeout: 45000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      }
    });
    
    // Si entramos, Mercado Libre nos devuelve un JSON directo
    const items = response.data.results || [];
    
    const products = items.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      thumbnail: item.thumbnail?.replace("-I.jpg", "-O.jpg") // Alta resolución
    }));

    if (products.length === 0) {
      console.log("⚠️ El túnel se abrió, pero la bóveda de datos está vacía.");
    } else {
      console.log(`✅ [Referidos] ¡ORO CAPTURADO! ${products.length} productos obtenidos vía API.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en el túnel de datos:", err.message);
    
    // Si la API falla, devolvemos un error claro pero no rompemos el servidor
    res.status(500).json({ 
      error: "Error de conexión blindada", 
      details: err.message,
      suggestion: "Mercado Libre está bajo mantenimiento o el bloqueo es total. Reintenta en 5 min."
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Motor en puerto ${PORT}`);
});