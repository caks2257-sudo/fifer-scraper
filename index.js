const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// 🔑 Tu llave de ScraperAPI
const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Datos Blindado - Online");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Pidiendo datos oficiales para categoría: ${categoryId}`);

  // LLAMADA A LA API OFICIAL A TRAVÉS DEL TÚNEL DE SCRAPERAPI
  // Usamos premium=true para asegurar IPs residenciales de Chile
  const mlApiUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}`;
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(mlApiUrl)}&country_code=cl&premium=true`;

  try {
    const response = await axios.get(tunnelUrl, { timeout: 60000 });
    
    // Mercado Libre nos devuelve un JSON directo aquí
    const rawItems = response.data.results || [];
    
    // Mapeamos los 3 productos con el formato que necesita Referidos
    const products = rawItems.slice(0, 3).map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      thumbnail: item.thumbnail.replace("-I.jpg", "-O.jpg") // Mejora la calidad de la foto
    }));

    console.log(`✅ [Referidos] Éxito: ${products.length} productos obtenidos vía túnel.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en el túnel de datos:", err.message);
    res.status(500).json({ 
      error: "Error de conexión con la bóveda", 
      details: err.message 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] API activa en puerto ${PORT}`);
});