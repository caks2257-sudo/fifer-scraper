const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// 🔑 Las llaves de la Bóveda Oficial
const ML_APP_ID = process.env.ML_APP_ID;
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const ML_REFRESH_TOKEN = process.env.ML_REFRESH_TOKEN;
// 🚇 La llave del Túnel Residencial
const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY; 

let currentAccessToken = null;
let tokenExpirationTime = 0;

// Renovación inteligente del Token Oficial
async function getValidAccessToken() {
    const now = Date.now();
    if (currentAccessToken && now < tokenExpirationTime - 300000) {
        return currentAccessToken;
    }
    console.log("🔄 [SISTEMA] Renovando Pase VIP de Mercado Libre...");
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', ML_APP_ID);
    params.append('client_secret', ML_CLIENT_SECRET);
    params.append('refresh_token', ML_REFRESH_TOKEN);

    const response = await axios.post('https://api.mercadolibre.com/oauth/token', params, {
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }
    });
    currentAccessToken = response.data.access_token;
    tokenExpirationTime = now + (response.data.expires_in * 1000); 
    console.log("✅ [SISTEMA] Pase VIP oficial validado.");
    return currentAccessToken;
}

app.get('/', (req, res) => res.send("🚀 [FIFER] Motor V45 (Token Oficial + ScraperAPI) - Activo"));

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`\n🕵️‍♂️ [FIFER] Extracción REAL en proceso para la categoría: ${categoryId}`);

  try {
    const accessToken = await getValidAccessToken();
    const targetUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}&limit=5`;
    
    // 💡 LA PERFORADORA: Usamos la API Oficial, pero viajando por una IP de casa real
    const proxyUrl = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&keep_headers=true`;

    console.log(`🚜 Cruzando el escudo de DataDome... (puede tardar 5-15s)`);
    
    const response = await axios.get(proxyUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`, // Tu credencial oficial humana
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', // Disfraz de navegador
            'Accept': 'application/json'
        },
        timeout: 30000 // Le damos tiempo al túnel de hacer su trabajo
    });

    if (!response.data || !response.data.results) {
        throw new Error("El túnel funcionó pero Mercado Libre no devolvió productos.");
    }

    // Mapeamos los datos puramente reales
    const products = response.data.results.slice(0, 3).map((item, i) => ({
        id: item.id || `REF-${i}`,
        title: item.title || "Producto FIFER",
        price: item.price || 0,
        permalink: item.permalink || "",
        thumbnail: item.thumbnail ? item.thumbnail.replace("-I.jpg", "-O.jpg") : ""
    }));

    console.log(`✅ [FIFER] ¡ÉXITO ROTUNDO! ${products.length} productos 100% REALES extraídos de la bóveda.`);
    return res.json({ results: products, source: "real_ml_api_proxied" });

  } catch (err) {
    // ⚠️ ELIMINAMOS LOS ANDAMIOS. SI FALLA, QUEREMOS VER LA VERDAD EN LA CONSOLA.
    console.error(`❌ FALLA TÉCNICA CRÍTICA:`, err.response?.data || err.message);
    return res.status(500).json({ 
        error: "Fallo en la extracción real. Revisa el log de Render.", 
        details: err.response?.data || err.message 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor V45 Definitivo en puerto ${PORT}`));