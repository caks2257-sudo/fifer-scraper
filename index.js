const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Infiltración V16 - Blindaje Total");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Operación de alta presión para: ${categoryId}`);

  // TÉCNICA: URL de búsqueda directa con parámetros de orden (más natural que la categoría pura)
  const targetUrl = `https://listado.mercadolibre.cl/animales-mascotas/_OrderId_PRICE_NoIndex_True`;
  
  // ACTIVAMOS: render=true + session_number (para que ScraperAPI simule un navegador real con JS)
  // Esto es vital para saltar el popup de "Elegir Comuna"
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true&render=true&session_number=${Math.floor(Math.random() * 5000)}`;

  try {
    const response = await axios.get(tunnelUrl, { timeout: 60000 });
    const html = response.data;

    // 🕵️‍♂️ BÚSQUEDA POR ADN: Buscamos el JSON oculto que ML siempre carga al final
    // Es el único dato que no pueden ocultar porque es el que usa su propia web para mostrar la grilla
    const regex = /"results":\s*(\[{"id":"MLC[\s\S]*?}\])\s*/;
    const match = html.match(regex);

    if (!match) {
      console.log("⚠️ Escudo activo. ML no entregó el JSON de resultados.");
      // Enviamos el título para saber en qué habitación estamos atrapados
      const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "Sin Título";
      return res.json({ results: [], status: "blocked", location: title });
    }

    const rawResults = JSON.parse(match[1]);
    const top3 = rawResults.slice(0, 3).map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      thumbnail: item.thumbnail
    }));

    console.log(`✅ [Referidos] ¡INFILTRACIÓN EXITOSA! ${top3.length} productos capturados.`);
    res.json({ results: top3 });

  } catch (err) {
    console.error("❌ Fallo en el túnel:", err.message);
    res.status(500).json({ error: "Error de conexión", detail: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Referidos] API encendida en puerto ${PORT}`);
});