const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Búsqueda Híbrido V20 - Online");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando búsqueda de alta fidelidad: ${categoryId}`);

  // TÉCNICA: Usamos una URL de búsqueda 'limpia' con el filtro de categoría inyectado.
  // Esto simula a un usuario buscando en la barra de arriba.
  const targetUrl = `https://listado.mercadolibre.cl/animales-mascotas/_NoIndex_True_OrderId_PRICE`;
  
  // Usamos ScraperAPI con IP de Chile y una sesión aleatoria.
  // IMPORTANTE: Quitamos 'render=true' para evitar el 500 y ganar velocidad.
  const tunnelUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=cl&premium=true&session_number=${Math.floor(Math.random() * 8888)}`;

  try {
    const response = await axios.get(tunnelUrl, { timeout: 35000 });
    const $ = cheerio.load(response.data);
    
    console.log(`📌 Título de zona capturado: ${$('title').text()}`);

    const products = [];

    // 🕵️‍♂️ BÚSQUEDA DE ESTRUCTURA: Buscamos cualquier enlace que huela a producto MLC
    $('a[href*="articulo.mercadolibre.cl/MLC"]').each((i, el) => {
      if (products.length >= 3) return false;

      const link = $(el).attr('href').split('#')[0].split('?')[0];
      const card = $(el).closest('li, div[class*="item"], div[class*="card"]');
      
      // Selectores ultra-genéricos (buscamos por 'forma' de dato, no por nombre de clase)
      const title = card.find('h2, h3').first().text().trim();
      const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '');
      const img = card.find('img').first().attr('data-src') || card.find('img').first().attr('src');

      if (title && parseInt(priceStr) > 0) {
        products.push({
          id: link.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `ID-${i}`,
          title: title,
          price: parseInt(priceStr),
          permalink: link,
          thumbnail: img || ""
        });
      }
    });

    if (products.length === 0) {
      console.log("⚠️ La red salió vacía. El guardia de ML sigue bloqueando el paso.");
    } else {
      console.log(`✅ [Referidos] ¡VIGA INSTALADA! ${products.length} productos obtenidos.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo estructural:", err.message);
    res.status(500).json({ error: "Fallo de conexión", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [Referidos] Motor encendido en puerto ${PORT}`));