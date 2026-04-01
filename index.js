const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// 🔑 Credenciales Oficiales de FIFER (ML Developer)
const APP_ID = '5164271441652076';
const SECRET = 'FD7eRrXg3UM12QKxAgr9sqA8ZGlt3nXc';

// Memoria caché para el pase VIP
let accessToken = null;
let tokenExpiration = 0;

// Función para obtener o renovar las llaves del edificio
async function getAccessToken() {
  // Si tenemos un token válido, lo reusamos (es más rápido)
  if (accessToken && Date.now() < tokenExpiration) {
    return accessToken;
  }
  
  console.log("🔑 Solicitando nuevo pase VIP a Mercado Libre...");
  try {
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', null, {
      params: {
        grant_type: 'client_credentials',
        client_id: APP_ID,
        client_secret: SECRET
      }
    });
    
    accessToken = response.data.access_token;
    // El token dura 6 horas, le restamos 5 minutos por seguridad
    tokenExpiration = Date.now() + (response.data.expires_in - 300) * 1000; 
    console.log("✅ Pase VIP obtenido exitosamente.");
    return accessToken;
  } catch (error) {
    console.error("❌ Error obteniendo el pase VIP:", error.response?.data || error.message);
    throw new Error("No se pudo obtener el token de Mercado Libre");
  }
}

app.get('/', (req, res) => {
  res.send("🚀 [FIFER] Motor Oficial ML Developer V26 - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [FIFER] Entrando por la puerta principal para: ${categoryId}`);

  try {
    // 1. Conseguimos el pase VIP
    const token = await getAccessToken();

    // 2. Llamada a la API oficial con nuestra credencial
    const mlApiUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}&limit=5`;
    
    const response = await axios.get(mlApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}` // Mostramos la placa al guardia
      },
      timeout: 15000
    });

    const rawResults = response.data.results || [];
    
    // 3. Limpiamos los datos para entregarlos a tu app
    const products = rawResults.slice(0, 3).map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      thumbnail: item.thumbnail?.replace("-I.jpg", "-O.jpg") // Alta calidad
    }));

    if (products.length === 0) {
       console.log("⚠️ Búsqueda exitosa, pero la categoría no tiene inquilinos.");
       return res.json({ results: [], status: "empty" });
    }

    console.log(`✅ [FIFER] ¡INQUILINOS CONFIRMADOS! ${products.length} productos obtenidos.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la extracción oficial:", err.response?.data || err.message);
    res.status(500).json({ 
      error: "Colapso en la API Oficial", 
      details: err.response?.data || err.message 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor Oficial en puerto ${PORT}`));