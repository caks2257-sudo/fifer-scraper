const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// 🔑 La llave está segura en Render
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
const RAPIDAPI_HOST = 'mercado-libre8.p.rapidapi.com';

// 🧠 DICCIONARIO TRADUCTOR (Código de Categoría -> Búsqueda Humana)
const categoryTranslator = {
  'MLC1071': 'mascotas',
  'MLC1051': 'celulares',
  'MLC1144': 'consolas videojuegos',
  'MLC1648': 'computacion',
  'MLC1574': 'hogar muebles',
  'MLC1430': 'ropa'
};

app.get('/', (req, res) => {
  res.send("🚀 [FIFER] Motor Data Broker V36 (Con Traductor) - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  // Traducimos el código. Si no está en el diccionario, buscamos "productos" por defecto.
  const searchKeyword = categoryTranslator[categoryId] || 'ofertas';

  console.log(`🕵️‍♂️ [FIFER] El frontend pidió ${categoryId}. Buscando la palabra humana: "${searchKeyword}"`);

  const options = {
    method: 'GET',
    url: `https://${RAPIDAPI_HOST}/search`,
    params: { 
      keyword: searchKeyword, // Le pasamos la palabra traducida al broker
      country: 'CL'
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

    let rawItems = [];
    if (response.data && response.data.results) rawItems = response.data.results;
    else if (Array.isArray(response.data)) rawItems = response.data;
    else if (response.data && response.data.data) rawItems = response.data.data;

    if (rawItems.length === 0) {
       console.log("⚠️ El Broker respondió bien, pero no encontró nada para esa palabra.");
       return res.json({ results: [], status: "empty_from_broker" });
    }

    // Mapeamos los datos al formato de FIFER
    const products = rawItems.slice(0, 3).map((item, i) => ({
        id: item.id || item.catalog_product_id || `REF-${i}`,
        title: item.title || item.name || "Producto FIFER",
        price: item.price || 0,
        permalink: item.permalink || item.url || item.link || "",
        thumbnail: item.thumbnail || item.picture || item.image || item.thumbnail_id ? `https://http2.mlstatic.com/D_${item.thumbnail_id}-O.jpg` : ""
    }));

    console.log(`✅ [FIFER] ¡INQUILINOS CONFIRMADOS! ${products.length} productos ("${searchKeyword}") entregados.`);
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