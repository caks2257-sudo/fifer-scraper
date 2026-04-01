const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const SCRAPER_API_KEY = 'f4857937a4e4a88c33bb055d85f48fa2';

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Suplantación iOS V22 - Online");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando protocolo de Suplantación de App para: ${categoryId}`);

  // La bóveda de datos puros
  const mlApiUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}&limit=5`;
  
  // 💎 EL UNIFORME FALSO: Cabeceras exactas de la App oficial de Mercado Libre en iPhone
  const mobileHeaders = {
    'User-Agent': 'MercadoLibre/12.30.0 (iPhone; iOS 16.0.2; Scale/3.00)',
    'X-Platform': 'IOS',
    'Accept': 'application/json',
    // Falsificamos una IP residencial de Chile por si ML revisa la cabecera de origen
    'X-Forwarded-For': `186.10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` 
  };

  try {
    // ⚔️ INTENTO 1: Ataque Directo (A veces DataDome deja pasar servidores si usan este User-Agent)
    console.log("🚁 Intento 1: Conexión directa camuflada como App de iPhone...");
    const directResponse = await axios.get(mlApiUrl, { headers: mobileHeaders, timeout: 10000 });
    return processData(directResponse.data, res, "Conexión Directa");

  } catch (err1) {
    console.log(`⚠️ Intento 1 falló (${err1.response?.status || err1.message}). Activando Túnel de Respaldo...`);
    
    try {
      // ⚔️ INTENTO 2: ScraperAPI en modo "Pasarela"
      // keep_headers=true es vital: le dice a ScraperAPI que no borre nuestro uniforme falso
      const tunnelUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(mlApiUrl)}&keep_headers=true`;
      
      const tunnelResponse = await axios.get(tunnelUrl, { headers: mobileHeaders, timeout: 35000 });
      return processData(tunnelResponse.data, res, "Túnel ScraperAPI + iOS");

    } catch (err2) {
      console.error("❌ Colapso total:", err2.message);
      return res.status(500).json({ 
        error: "Bloqueo definitivo de DataDome", 
        details: "Mercado Libre cerró la bóveda. Se requiere volver a instalar Puppeteer para saltar el CAPTCHA."
      });
    }
  }
});

// Función constructora para limpiar los datos antes de entregarlos
function processData(data, res, source) {
  const results = data.results || [];
  const products = results.slice(0, 3).map(item => ({
    id: item.id,
    title: item.title,
    price: item.price,
    permalink: item.permalink,
    thumbnail: item.thumbnail?.replace("-I.jpg", "-O.jpg") // Convertimos la foto a alta resolución
  }));
  
  if (products.length === 0) {
    console.log(`⚠️ La bóveda se abrió vía ${source}, pero estaba vacía.`);
    return res.json({ results: [] });
  }

  console.log(`✅ [Referidos] ¡BÓVEDA ABIERTA vía ${source}! ${products.length} productos obtenidos.`);
  res.json({ results: products });
}

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [Referidos] Motor V22 en puerto ${PORT}`));