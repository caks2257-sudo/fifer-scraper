const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Búsqueda por Patrones - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando caza de patrones para: ${categoryId}`);

  // URL de categoría oficial
  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  
  // Usamos el túnel premium de ScraperAPI para saltar el bloqueo inicial
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true`;

  try {
    const response = await axios.get(tunnelUrl, { timeout: 45000 });
    const html = response.data;

    // 🕵️‍♂️ CAZA DE PATRONES: Buscamos cualquier JSON que contenga "results" y IDs de Mercado Libre
    // Esta Regex busca la estructura de datos sin importar cómo se llame la variable
    const regex = /"results":\s*(\[{"id":"MLC[\s\S]*?}\])\s*/;
    const match = html.match(regex);

    if (!match) {
      console.log("⚠️ Patrón principal no encontrado. Probando escaneo de emergencia...");
      // Plan de Emergencia: Buscar cualquier rastro de objetos con precio y título
      const emergencyRegex = /{"id":"MLC[\s\S]*?"title":"[\s\S]*?"price":\d+[\s\S]*?}/g;
      const matches = html.match(emergencyRegex);
      
      if (!matches || matches.length === 0) {
        return res.json({ results: [], message: "ML cambió el blindaje. Reintentando con nueva frecuencia..." });
      }

      // Limpiamos los hallazgos de emergencia
      const emergencyResults = matches.slice(0, 3).map(m => JSON.parse(m));
      return sendResults(emergencyResults, res);
    }

    const results = JSON.parse(match[1]);
    sendResults(results, res);

  } catch (err) {
    console.error("❌ Fallo en la faena:", err.message);
    res.status(500).json({ error: "Error de red en Referidos", details: err.message });
  }
});

function sendResults(results, res) {
  const top3 = results.slice(0, 3).map(item => ({
    id: item.id,
    title: item.title,
    price: item.price,
    permalink: item.permalink || `https://articulo.mercadolibre.cl/${item.id}`,
    thumbnail: item.thumbnail || item.image || ""
  }));

  console.log(`✅ [Referidos] ¡ORO CAPTURADO! ${top3.length} productos en el JSON.`);
  res.json({ results: top3 });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Escáner en puerto ${PORT}`);
});