const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send("🚀 API de Referidos - Conexión ML Oficial");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Accediendo a categoría: ${categoryId}`);

  const mlApiUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}`;

  try {
    // 🛡️ AGREGAMOS HEADERS: Esto evita el Error 403
    const response = await axios.get(mlApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const items = response.data.results;

    // Mapeamos los 3 mejores productos
    const top3 = items.slice(0, 3).map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      thumbnail: item.thumbnail
    }));

    console.log(`✅ [Referidos] ${top3.length} productos obtenidos con éxito.`);
    res.json({ results: top3 });

  } catch (err) {
    // Si ML se pone terco, imprimimos el error real para debuguear
    console.error("❌ Error en la conexión oficial:", err.response ? err.response.status : err.message);
    res.status(500).json({ 
      error: "Error al conectar con ML", 
      details: err.message,
      status: err.response ? err.response.status : null 
    });
  }
});

app.listen(PORT, () => console.log(`🚀 API Referidos activa en puerto ${PORT}`));