const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// 🔑 La llave está segura en Render
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
const RAPIDAPI_HOST = 'mercado-libre8.p.rapidapi.com';

app.get('/', (req, res) => {
  res.send("🚀 [FIFER] Motor Data Broker V35 (Parámetros Corregidos) - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [FIFER] Solicitando inquilinos al Broker para: ${categoryId}`);

  // Configuramos la petición con los parámetros EXACTOS que pide este broker
  const options = {
    method: 'GET',
    url: `https://${RAPIDAPI_HOST}/search`,
    params: { 
      keyword: categoryId, // Aquí está la corrección
      country: 'CL'        // Agregamos el país obligatorio
    },
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST
    },
    timeout: 15000 
  };

  try {
    console.log("🚜 El Broker está extrayendo los datos...");
    const response = await axios.request(options);

    // Adaptador universal para leer la estructura del broker
    let rawItems = [];
    if (response.data && response.data.results) rawItems = response.data.results;
    else if (Array.isArray(response.data)) rawItems = response.data;
    else if (response.data && response.data.data) rawItems = response.data.data;
    else if (response.data && response.data.items) rawItems = response.data.items;

    if (rawItems.length === 0) {
       console.log("⚠️ El Broker respondió bien, pero la lista venía vacía.");
       return res.json({ results: [], status: "empty_from_broker", raw: response.data });
    }

    // Mapeamos los datos al formato de FIFER
    const products = rawItems.slice(0, 3).map((item, i) => ({
        id: item.id || item.catalog_product_id || `REF-${i}`,
        title: item.title || item.name || "Producto FIFER",
        price: item.price || 0,
        permalink: item.permalink || item.url || item.link || "",
        thumbnail: item.thumbnail || item.picture || item.image || ""
    }));

    console.log(`✅ [FIFER] ¡INQUILINOS CONFIRMADOS! ${products.length} productos entregados.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la conexión con el Broker:", err.response?.data || err.message);
    res.status(500).json({ 
        error: "Error del Data Broker", 
        details: err.response?.data || err.message 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor Broker en puerto ${PORT}`));