const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// 🔑 La llave sigue segura en la caja fuerte de Render
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
const RAPIDAPI_HOST = 'mercado-libre7.p.rapidapi.com';

app.get('/', (req, res) => {
  res.send("🚀 [FIFER] Motor Premium V41 (Con Sello JSON) - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`\n🕵️‍♂️ [FIFER] Orden recibida para la cuadrilla Premium: ${categoryId}`);

  // ==========================================
  // PASO 1: TRADUCTOR DINÁMICO
  // ==========================================
  let searchKeyword = categoryId;
  try {
    const catResponse = await axios.get(`https://api.mercadolibre.com/categories/${categoryId}`);
    if (catResponse.data && catResponse.data.name) {
        searchKeyword = catResponse.data.name; 
        console.log(`📘 Traducción oficial: "${searchKeyword}"`);
    }
  } catch (error) {
    console.log(`⚠️ No se pudo traducir. Usando ID: ${categoryId}`);
  }

  // ==========================================
  // PASO 2: SOLICITUD AL BROKER PREMIUM
  // ==========================================
  const options = {
    method: 'GET',
    url: `https://${RAPIDAPI_HOST}/listings_for_search`, 
    params: { 
      query: searchKeyword, // Parámetro estándar
      site: 'MLC' // Código de Mercado Libre Chile
    },
    headers: { 
      'x-rapidapi-key': RAPIDAPI_KEY, 
      'x-rapidapi-host': RAPIDAPI_HOST,
      'Content-Type': 'application/json', // 💡 EL SELLO QUE FALTABA
      'Accept': 'application/json'
    },
    timeout: 25000 
  };

  try {
    console.log(`🚜 Broker Premium buscando: "${searchKeyword}"...`);
    const response = await axios.request(options);

    console.log("📦 Rayos X - Estructura recibida:", Object.keys(response.data));

    if (response.data && response.data.status === 'error') {
        throw new Error(`El Broker falló internamente: ${response.data.message}`);
    }

    // Buscamos la lista de productos
    let rawItems = [];
    if (Array.isArray(response.data)) rawItems = response.data;
    else if (response.data.results) rawItems = response.data.results;
    else if (response.data.search_results) rawItems = response.data.search_results;
    else if (response.data.data) rawItems = response.data.data;
    else if (response.data.items) rawItems = response.data.items;

    if (rawItems.length === 0) throw new Error("Broker no entregó productos.");

    const products = rawItems.slice(0, 3).map((item, i) => ({
        id: item.id || item.catalog_product_id || `REF-${i}`,
        title: item.title || item.name || `Producto FIFER (${searchKeyword})`,
        price: item.price || item.current_price || 0,
        permalink: item.permalink || item.url || item.link || "",
        thumbnail: item.thumbnail || item.picture || item.image || "https://http2.mlstatic.com/D_824925-MLU74272895689_012024-O.jpg"
    }));

    console.log(`✅ [FIFER] ¡INQUILINOS REALES! ${products.length} productos procesados.`);
    return res.json({ results: products, source: "rapidapi" });

  } catch (err) {
    console.error(`⚠️ Falla técnica (${err.message}). Activando Respaldo...`);
    
    // ==========================================
    // PASO 3: RESPALDO DINÁMICO (ANTI-SÍSMICO)
    // ==========================================
    const fallbackProducts = [
      {
        id: `MOCK-1-${categoryId}`,
        title: `${searchKeyword} - Artículo Premium`,
        price: 25990,
        permalink: "https://mercadolibre.cl",
        thumbnail: "https://http2.mlstatic.com/D_824925-MLU74272895689_012024-O.jpg"
      },
      {
        id: `MOCK-2-${categoryId}`,
        title: `${searchKeyword} - Oferta Especial`,
        price: 15500,
        permalink: "https://mercadolibre.cl",
        thumbnail: "https://http2.mlstatic.com/D_892994-MLC50190145260_062022-O.jpg"
      },
      {
        id: `MOCK-3-${categoryId}`,
        title: `${searchKeyword} - Producto Estándar`,
        price: 9900,
        permalink: "https://mercadolibre.cl",
        thumbnail: "https://http2.mlstatic.com/D_788220-MLC51347055990_082022-O.jpg"
      }
    ];

    console.log(`🚧 [FIFER] Inquilinos de respaldo (${searchKeyword}) desplegados.`);
    return res.json({ results: fallbackProducts, source: "fallback_mock" });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor Premium V41 en puerto ${PORT}`));