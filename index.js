const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Minería de Datos - Online");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Minando datos de la categoría: ${categoryId}`);

  // URL de la web normal, que es más "permisiva" que la API oficial
  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  
  // Túnel estándar de ScraperAPI (rápido y estable)
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl`;

  try {
    const response = await axios.get(tunnelUrl, { timeout: 45000 });
    const html = response.data;

    // ⛏️ MINERÍA: Buscamos el objeto JSON que ML esconde en el código para cargar sus productos
    const jsonKey = 'window.__PRELOADED_STATE__ = ';
    const startIndex = html.indexOf(jsonKey);
    
    if (startIndex === -1) {
      console.log("⚠️ No se encontró el bloque de datos. ML aplicó un escudo de fase.");
      return res.json({ results: [], message: "Escudo detectado. Intenta de nuevo en unos segundos." });
    }

    // Extraemos y limpiamos el JSON del código fuente
    const dataPart = html.substring(startIndex + jsonKey.length);
    const endIndex = dataPart.indexOf(';</script>');
    const rawJson = dataPart.substring(0, endIndex);
    const fullData = JSON.parse(rawJson);

    // Navegamos por el laberinto del JSON interno de ML para sacar el Top 3
    const results = fullData.initialState.results || [];
    
    const top3 = results.slice(0, 3).map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      thumbnail: item.thumbnail
    }));

    console.log(`✅ [Referidos] ¡MINA ENCONTRADA! ${top3.length} productos extraídos.`);
    res.json({ results: top3 });

  } catch (err) {
    console.error("❌ Fallo en la excavación:", err.message);
    res.status(500).json({ error: "Error de minería", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Escáner activo en puerto ${PORT}`);
});