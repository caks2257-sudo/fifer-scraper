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
  res.send("🚀 [FIFER] Motor V39 (Ajuste de Tuercas: 30s) - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`\n🕵️‍♂️ [FIFER] Orden recibida: ${categoryId}`);

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
  // PASO 2: SOLICITUD AL BROKER
  // ==========================================
  const options = {
    method: 'GET',
    url: `https://${RAPIDAPI_HOST}/search`,
    params: { keyword: searchKeyword, country: 'CL' },
    headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST },
    timeout: 30000 // 🔧 AJUSTE DE TUERCAS: Le damos hasta 30 segundos al Broker
  };

  try {
    console.log(`🚜 Broker buscando: "${searchKeyword}" (Esperando hasta 30s)...`);
    const response = await axios.request(options);

    if (response.data && response.data.status === 'error') {
        throw new Error(`El Broker falló internamente: ${response.data.message}`);
    }

    let rawItems = [];
    if (Array.isArray(response.data)) rawItems = response.data;
    else if (response.data.results) rawItems = response.data.results;
    else if (response.data.search_results) rawItems = response.data.search_results;
    else if (response.data.data) rawItems = response.data.data;

    if (rawItems.length === 0) throw new Error("Broker no entregó productos.");

    const products = rawItems.slice(0, 3).map((item, i) => ({
        id: item.id || `REF-${i}`,
        title: item.title || item.name || `Producto FIFER (${searchKeyword})`,
        price: item.price || item.current_price || 0,
        permalink: item.permalink || item.url || "",
        thumbnail: item.thumbnail || item.picture || item.image || "https://http2.mlstatic.com/D_824925-MLU74272895689_012024-O.jpg"
    }));

    console.log(`✅ [FIFER] ¡INQUILINOS REALES! ${products.length} productos procesados.`);
    return res.json({ results: products, source: "rapidapi" });

  } catch (err) {
    console.error(`⚠️ Caída del Broker (${err.message}). Activando Generador de Respaldo...`);
    
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

    console.log(`🚧 [FIFER] Inquilinos de respaldo (${searchKeyword}) desplegados con éxito.`);
    return res.json({ results: fallbackProducts, source: "fallback_mock" });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor Anti-Sísmico en puerto ${PORT}`));