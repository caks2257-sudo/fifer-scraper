const express = require('express');
const cors = require('cors');
const axios = require('axios'); // La única herramienta que necesitamos

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send("🚀 Servidor Conectado a la Autopista Oficial de ML");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ Usando la puerta trasera oficial para la categoría: ${categoryId}`);

  // LA AUTOPISTA SECRETA: Sin bloqueos, sin captchas, puro JSON
  const mlApiUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}`;

  try {
    const response = await axios.get(mlApiUrl);
    const items = response.data.results;

    // Tomamos solo los primeros 3 productos y los moldeamos a tu gusto
    const top3 = items.slice(0, 3).map(item => ({
      id: item.id, // Viene perfecto, ej: MLC12345678
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      thumbnail: item.thumbnail
    }));

    console.log(`✅ ¡ÉXITO ROTUNDO! ${top3.length} productos obtenidos en milisegundos.`);
    res.json({ results: top3 });

  } catch (err) {
    console.error("❌ Fallo en la conexión directa:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 API Oficial en puerto ${PORT}`));