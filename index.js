const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor de Proxies Públicos V21 - Online");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando Operación Puente Aéreo para: ${categoryId}`);

  // LA BÓVEDA: API Oficial de ML (Datos puros, sin HTML, sin Datadome pesado)
  const mlApiUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}&limit=5`;

  // 🚁 LOS HELICÓPTEROS: 3 proxies públicos diferentes para evadir el bloqueo a Render
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(mlApiUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(mlApiUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(mlApiUrl)}`
  ];

  for (const proxy of proxies) {
    const proxyName = proxy.split('/')[2]; // Sacamos el nombre para el log
    try {
      console.log(`🚁 Intentando infiltración vía: ${proxyName}...`);
      
      // Hacemos la petición a través del helicóptero actual
      const response = await axios.get(proxy, { timeout: 15000 });
      
      // Si la API oficial nos responde con la lista de productos...
      if (response.data && response.data.results && response.data.results.length > 0) {
        
        const products = response.data.results.slice(0, 3).map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          permalink: item.permalink,
          thumbnail: item.thumbnail.replace("-I.jpg", "-O.jpg") // Mejoramos la calidad de la imagen
        }));

        console.log(`✅ [Referidos] ¡ÉXITO TOTAL! Datos rescatados gracias a ${proxyName}`);
        return res.json({ results: products });
      }
    } catch (err) {
      console.log(`⚠️ Helicóptero ${proxyName} derribado (Bloqueado). Saltando al siguiente...`);
    }
  }

  // Si llegamos aquí, los 3 proxies fallaron (muy raro)
  console.log("❌ Operación abortada. Todos los puentes aéreos fallaron.");
  res.status(500).json({ 
    error: "Bloqueo estructural masivo", 
    details: "Mercado Libre bloqueó incluso los servidores puente públicos." 
  });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [Referidos] Motor encendido en puerto ${PORT}`));