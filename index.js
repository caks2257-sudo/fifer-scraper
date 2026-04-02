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
  res.send("🚀 [FIFER] Motor V37 (Dinámico + Escáner) - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`\n🕵️‍♂️ [FIFER] Nueva orden de trabajo recibida: ${categoryId}`);

  // ==========================================
  // PASO 1: TRADUCTOR DINÁMICO UNIVERSAL
  // ==========================================
  let searchKeyword = categoryId;
  try {
    // Consultamos el diccionario público y gratuito de Mercado Libre
    const catResponse = await axios.get(`https://api.mercadolibre.com/categories/${categoryId}`);
    if (catResponse.data && catResponse.data.name) {
        searchKeyword = catResponse.data.name; // Ej: "Animales y Mascotas"
        console.log(`📘 Traducción oficial obtenida: "${searchKeyword}"`);
    }
  } catch (error) {
    console.log(`⚠️ No se pudo traducir la categoría. Usaremos el ID directo: ${categoryId}`);
  }

  // ==========================================
  // PASO 2: SOLICITUD AL BROKER
  // ==========================================
  const options = {
    method: 'GET',
    url: `https://${RAPIDAPI_HOST}/search`,
    params: { 
      keyword: searchKeyword, // Ahora esto es 100% dinámico para tu frontend
      country: 'CL'
    },
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST
    },
    timeout: 15000 
  };

  try {
    console.log(`🚜 Enviando orden al Broker buscando: "${searchKeyword}"...`);
    const response = await axios.request(options);

    // 🔍 RAYOS X: Imprimimos la estructura exacta que nos mandó el Broker
    console.log("📦 Estructura del paquete recibido:", Object.keys(response.data));
    
    // Adaptador universal súper agresivo
    let rawItems = [];
    if (Array.isArray(response.data)) rawItems = response.data;
    else if (response.data.results) rawItems = response.data.results;
    else if (response.data.search_results) rawItems = response.data.search_results; // Variante común
    else if (response.data.items) rawItems = response.data.items;
    else if (response.data.data) rawItems = response.data.data;
    // Si no es ninguna de esas, tomamos el primer arreglo que encontremos adentro
    else {
        for (let key in response.data) {
            if (Array.isArray(response.data[key]) && response.data[key].length > 0) {
                rawItems = response.data[key];
                console.log(`🔦 ¡Bingo! Los productos estaban escondidos en: "${key}"`);
                break;
            }
        }
    }

    if (rawItems.length === 0) {
       console.log("⚠️ El Broker no envió una lista válida. Mira los Rayos X arriba para ver qué mandó.");
       // Imprimimos un pedazo de lo que mandó para diagnosticar
       console.log("📄 Muestra cruda:", JSON.stringify(response.data).substring(0, 200));
       return res.json({ results: [], status: "empty_from_broker" });
    }

    // Mapeamos los datos al formato FIFER
    const products = rawItems.slice(0, 3).map((item, i) => ({
        id: item.id || item.catalog_product_id || `REF-${i}`,
        title: item.title || item.name || "Producto FIFER",
        price: item.price || item.current_price || 0,
        permalink: item.permalink || item.url || item.link || "",
        thumbnail: item.thumbnail || item.picture || item.image || item.thumbnail_id ? `https://http2.mlstatic.com/D_${item.thumbnail_id}-O.jpg` : ""
    }));

    console.log(`✅ [FIFER] ¡INQUILINOS CONFIRMADOS! ${products.length} productos procesados.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la conexión con el Broker:", err.response?.data || err.message);
    res.status(500).json({ error: "Error del Data Broker" });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor Broker Dinámico en puerto ${PORT}`));