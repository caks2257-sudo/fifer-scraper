const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000; // Ajustado al puerto de Render

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] API Blindada y Lista");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Extrayendo categoría: ${categoryId}`);

  // La URL oficial de ML, pero la pasaremos por el túnel de ScraperAPI
  const mlTargetUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}`;
  const scraperApiUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(mlTargetUrl)}&country_code=cl`;

  try {
    const response = await axios.get(scraperApiUrl);
    
    // Si la respuesta es exitosa, mapeamos los 3 primeros
    const items = response.data.results || [];
    const top3 = items.slice(0, 3).map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      thumbnail: item.thumbnail
    }));

    console.log(`✅ [Referidos] Éxito: ${top3.length} productos capturados.`);
    res.json({ results: top3 });

  } catch (err) {
    console.error("❌ Error en túnel blindado:", err.message);
    res.status(500).json({ error: "Error de conexión blindada", detail: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [Referidos] Motor encendido en puerto ${PORT}`));