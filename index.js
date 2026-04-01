const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Escáner de Datos V6 - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Escaneando frecuencia de categoría: ${categoryId}`);

  const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl`;

  try {
    const response = await axios.get(tunnelUrl, { timeout: 45000 });
    const html = response.data;

    // 🔍 BUSCADOR DE FRECUENCIAS: Buscamos cualquier JSON que contenga los resultados
    // ML suele envolver esto en un script que contiene "results":[{
    const regex = /"results":\s*(\[[\s\S]*?\])\s*,\s*"sort"/; 
    const match = html.match(regex);

    if (!match) {
      console.log("⚠️ El escáner no detectó la firma de datos. Probando Plan B...");
      // Plan B: Buscar por el ID de la categoría dentro del HTML
      const fallbackRegex = new RegExp(`"results":\\s*(\\[[\\s\\S]*?${categoryId}[\\s\\S]*?\\])`);
      const secondMatch = html.match(fallbackRegex);
      
      if (!secondMatch) {
         return res.json({ results: [], status: "bloqueado", message: "Escudo impenetrable por ahora" });
      }
      return processResults(JSON.parse(secondMatch[1]), res);
    }

    const results = JSON.parse(match[1]);
    processResults(results, res);

  } catch (err) {
    console.error("❌ Fallo en la excavación:", err.message);
    res.status(500).json({ error: "Error de minería", details: err.message });
  }
});

// Función auxiliar para limpiar y enviar los datos
function processResults(results, res) {
  const top3 = results.slice(0, 3).map(item => ({
    id: item.id,
    title: item.title,
    price: item.price || (item.installments ? item.installments.amount * item.installments.quantity : 0),
    permalink: item.permalink,
    thumbnail: item.thumbnail
  }));

  console.log(`✅ [Referidos] ¡ORO ENCONTRADO! ${top3.length} productos capturados.`);
  res.json({ results: top3 });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] Escáner en puerto ${PORT}`);
});