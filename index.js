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

let currentAccessToken = null;
let tokenExpirationTime = 0;

// Renovación inteligente del Pase VIP
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

app.get('/', (req, res) => res.send("🚀 [FIFER] Motor V50 (Enterprise Auth) - Activo"));

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`\n🕵️‍♂️ [FIFER] Extracción REAL en proceso para: ${categoryId}`);

  try {
    const accessToken = await getValidAccessToken();
    const targetUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}&limit=5`;
    
    console.log(`🚜 Entrando por la Bóveda Oficial con Credenciales Enterprise...`);
    
    const response = await axios.get(targetUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`, 
            // 💡 EL TRAJE DE ETIQUETA: Cumplimos la norma de identidad de ML
            'User-Agent': 'FIFER-App/1.0 (contacto@abkupfer.cl)', 
            'Accept': 'application/json'
        }
    });

    if (!response.data || !response.data.results) {
        throw new Error("La bóveda oficial respondió, pero no entregó productos.");
    }

    const products = response.data.results.slice(0, 3).map((item, i) => ({
        id: item.id || `REF-${i}`,
        title: item.title || "Producto FIFER",
        price: item.price || 0,
        permalink: item.permalink || "",
        thumbnail: item.thumbnail ? item.thumbnail.replace("-I.jpg", "-O.jpg") : ""
    }));

    console.log(`✅ [FIFER] ¡ÉXITO ROTUNDO! ${products.length} Inquilinos Reales extraídos de la bóveda.`);
    return res.json({ results: products, source: "ml_enterprise_auth" });

  } catch (err) {
    console.error(`❌ FALLA TÉCNICA CRÍTICA:`, err.response?.data || err.message);
    return res.status(500).json({ 
        error: "Fallo en la extracción real.", 
        details: err.response?.data || err.message 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor V50 en puerto ${PORT}`));