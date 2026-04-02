const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// 🔑 Extraemos tus credenciales de la caja fuerte
const ML_APP_ID = process.env.ML_APP_ID;
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const REDIRECT_URI = 'https://api-fifer-scraper.onrender.com/callback';

// 🏢 LA PUERTA DE ENTRADA: Te mostrará el link oficial para firmar
app.get('/', (req, res) => {
  const authUrl = `https://auth.mercadolibre.cl/authorization?response_type=code&client_id=${ML_APP_ID}&redirect_uri=${REDIRECT_URI}`;
  res.send(`
    <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
      <h1>🚀 [FIFER] Oficina de Trámites Oficiales</h1>
      <p>Haz clic en el botón de abajo para ir a Mercado Libre, iniciar sesión y autorizar tu aplicación.</p>
      <br>
      <a href="${authUrl}" style="background-color: #2b3bda; color: white; padding: 15px 30px; text-decoration: none; font-size: 18px; border-radius: 5px; font-weight: bold;">
        👉 SACAR PERMISO EN MERCADO LIBRE
      </a>
    </div>
  `);
});

// 📝 LA VENTANILLA DE RECEPCIÓN: Mercado libre nos mandará aquí el código
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("⚠️ No se recibió ningún código de autorización de Mercado Libre.");

  console.log(`\n🕵️‍♂️ [FIFER] Código temporal recibido. Intercambiando por Pases VIP...`);

  try {
    // Armamos el papeleo oficial para pedir el Token
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', ML_APP_ID);
    params.append('client_secret', ML_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    // Enviamos el papeleo a la bóveda
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', params, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token } = response.data;
    console.log("✅ [FIFER] ¡TRÁMITE EXITOSO! Tokens generados.");
    
    // Te mostramos el premio en pantalla
    res.send(`
      <div style="font-family: sans-serif; padding: 40px;">
        <h1 style="color: green;">🎉 ¡Permiso Municipal Aprobado!</h1>
        <p>Copia el código que está abajo <b>(El REFRESH_TOKEN)</b>. Es la llave maestra que usaremos para que el servidor nunca más pierda la conexión.</p>
        <pre style="background: #eee; padding: 20px; font-size: 16px; border-radius: 5px; overflow-wrap: break-word;">${refresh_token}</pre>
        <p><i>Nota: Ya puedes cerrar esta ventana y volver al chat conmigo.</i></p>
      </div>
    `);

  } catch (error) {
    console.error("❌ Fallo en el trámite:", error.response?.data || error.message);
    res.send(`<h3 style="color:red;">❌ Error al canjear el código. Mira el log en Render.</h3>`);
  }
});

// Dejamos tu endpoint de scrape con el andamio por si acaso
app.get('/scrape', (req, res) => {
    res.json({ results: [], status: "tramite_en_proceso" });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Oficina V43 en puerto ${PORT}`));