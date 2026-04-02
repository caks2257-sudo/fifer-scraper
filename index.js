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

app.get('/', (req, res) => res.send("🚀 [FIFER] Bóveda de Llaves V49 - Activa"));

// 💡 NUEVO ENDPOINT: Solo entrega el token al frontend
app.get('/get-token', async (req, res) => {
  try {
    const token = await getValidAccessToken();
    res.json({ access_token: token });
  } catch (err) {
    console.error("❌ Error generando llave:", err.message);
    res.status(500).json({ error: "Fallo en la bóveda de llaves." });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Bóveda V49 en puerto ${PORT}`));