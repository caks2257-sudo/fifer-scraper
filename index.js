const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Puente de Datos API - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Solicitando puente de datos para: ${categoryId}`);

  // URL de la API oficial de Mercado Libre
  const mlApiUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}`;
  
  // Pasamos la API oficial por el túnel de ScraperAPI para ocultar a Render
  // Usamos premium=true para que ML crea que es un usuario real en Chile
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(mlApiUrl)}&country_code=cl&premium=true`;

  try {
    const response = await axios.get(tunnelUrl, { timeout: 45000 });
    
    // Si entramos, ML nos devuelve un JSON directamente
    const rawItems = response.data.results || [];
    
    const products = rawItems.slice(0, 3).map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      thumbnail: item.thumbnail?.replace("-I.jpg", "-O.jpg") // Alta calidad
    }));

    if (products.length === 0) {
      console.log("⚠️ El túnel funcionó pero la categoría no devolvió productos.");
    } else {
      console.log(`✅ [Referidos] ¡BINGO! ${products.length} productos obtenidos vía API Blindada.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en el puente de datos:", err.message);
    res.status(500).json({ 
      error: "Error de conexión", 
      message: "ML sigue bloqueando el acceso. Intentando maniobra de emergencia...",
      details: err.message 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Puente activo en puerto ${PORT}`);
});