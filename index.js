const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Sistema de Auto-Parsing Industrial - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Solicitando extracción automática para: ${categoryId}`);

  // URL de la categoría
  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  
  // 🔑 LA LLAVE MAESTRA: autoparse=true
  // Esto le dice a ScraperAPI que ellos hagan el scraping por nosotros y nos den JSON
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&autoparse=true&country_code=cl`;

  try {
    const response = await axios.get(scraperApiUrl, { timeout: 60000 });
    
    // ScraperAPI nos devuelve un objeto llamado 'all_products' o similar
    const rawProducts = response.data.results || response.data.all_products || [];
    
    const products = rawProducts.slice(0, 3).map(item => ({
      id: item.id || `MLC-${Math.floor(Math.random() * 100000)}`,
      title: item.name || item.title || "Producto Referidos",
      price: item.price || 0,
      permalink: item.url || item.link || targetUrl,
      thumbnail: item.image || item.thumbnail || ""
    }));

    console.log(`✅ [Referidos] ¡BINGO! ${products.length} productos obtenidos automáticamente.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la extracción automática:", err.message);
    res.status(500).json({ 
      error: "Error de auto-parsing", 
      details: "Mercado Libre bloqueó incluso el parsing automático. Reintentar en unos minutos." 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Motor en puerto ${PORT}`);
});