const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// 🔑 Las llaves oficiales de la bóveda
const ML_APP_ID = process.env.ML_APP_ID;
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const ML_REFRESH_TOKEN = process.env.ML_REFRESH_TOKEN;

// 🧠 Gestor de Credenciales en Memoria
let currentAccessToken = null;
let tokenExpirationTime = 0;

// Función inteligente para obtener o renovar el Pase VIP
async function getValidAccessToken() {
    const now = Date.now();
    // Si tenemos un token y aún le quedan más de 5 minutos de vida, lo usamos
    if (currentAccessToken && now < tokenExpirationTime - 300000) {
        return currentAccessToken;
    }

    console.log("🔄 [SISTEMA] Pase VIP vencido o inexistente. Generando uno nuevo...");
    
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', ML_APP_ID);
    params.append('client_secret', ML_CLIENT_SECRET);
    params.append('refresh_token', ML_REFRESH_TOKEN);

    try {
        const response = await axios.post('https://api.mercadolibre.com/oauth/token', params, {
            headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }
        });
        
        currentAccessToken = response.data.access_token;
        // Mercado Libre da tokens por 6 horas (21600 segundos). Lo guardamos.
        tokenExpirationTime = now + (response.data.expires_in * 1000); 
        console.log("✅ [SISTEMA] Nuevo Pase VIP obtenido con éxito.");
        return currentAccessToken;
    } catch (error) {
        console.error("❌ Fallo crítico al renovar el Pase VIP:", error.response?.data || error.message);
        throw new Error("No se pudo renovar el token de Mercado Libre.");
    }
}

app.get('/', (req, res) => {
  res.send("🚀 [FIFER] Motor V44 (Conexión Oficial Autenticada OAuth 2.0) - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`\n🕵️‍♂️ [FIFER] Accediendo a la Bóveda Oficial para: ${categoryId}`);

  try {
    // 1. Conseguimos el pase vigente
    const accessToken = await getValidAccessToken();

    // 2. Entramos por la puerta principal, mostrando nuestra credencial
    const targetUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}&limit=5`;
    const response = await axios.get(targetUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}` // 💡 EL PASE VIP
        }
    });

    if (!response.data || !response.data.results || response.data.results.length === 0) {
        throw new Error("La categoría está vacía en la API oficial.");
    }

    // 3. Mapeamos al formato FIFER
    const products = response.data.results.slice(0, 3).map((item, i) => ({
        id: item.id || `REF-${i}`,
        title: item.title || "Producto FIFER",
        price: item.price || 0,
        permalink: item.permalink || "",
        thumbnail: item.thumbnail ? item.thumbnail.replace("-I.jpg", "-O.jpg") : ""
    }));

    console.log(`✅ [FIFER] ¡INQUILINOS OFICIALES EXTRAÍDOS! ${products.length} productos listos.`);
    return res.json({ results: products, source: "mercadolibre_official_auth" });

  } catch (err) {
    console.error(`⚠️ Falla en la operación oficial (${err.message}). Activando Sistema Anti-Sísmico...`);
    
    // El respaldo inquebrantable
    const fallbackProducts = [
      { id: `MOCK-1-${categoryId}`, title: `Artículo Premium (${categoryId})`, price: 25990, permalink: "https://mercadolibre.cl", thumbnail: "https://http2.mlstatic.com/D_824925-MLU74272895689_012024-O.jpg" },
      { id: `MOCK-2-${categoryId}`, title: `Oferta Especial (${categoryId})`, price: 15500, permalink: "https://mercadolibre.cl", thumbnail: "https://http2.mlstatic.com/D_892994-MLC50190145260_062022-O.jpg" },
      { id: `MOCK-3-${categoryId}`, title: `Producto Estándar (${categoryId})`, price: 9900, permalink: "https://mercadolibre.cl", thumbnail: "https://http2.mlstatic.com/D_788220-MLC51347055990_082022-O.jpg" }
    ];
    return res.json({ results: fallbackProducts, source: "fallback_mock" });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor Oficial en puerto ${PORT}`));