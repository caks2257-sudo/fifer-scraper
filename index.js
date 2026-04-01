const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// 🔑 Llave Maestra (En la caja fuerte de Render)
const APIFY_TOKEN = process.env.APIFY_TOKEN; 
const client = new ApifyClient({ token: APIFY_TOKEN });

app.get('/', (req, res) => {
  res.send("🚀 [FIFER] Motor Especialista Saswave V32 - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [FIFER] Contratando Especialista 'Saswave' para: ${categoryId}`);

  try {
    // Limpiamos el ID por si viene como "MLC1071" y forzamos una URL de listado muy natural
    const cleanId = categoryId.replace('MLC', '');
    const targetUrl = `https://listado.mercadolibre.cl/animales-mascotas/_CategoryId_MLC${cleanId}`;

    console.log("🚜 El especialista está perforando el muro de DataDome...");

    // 💡 CAMBIO CRÍTICO: Llamamos al actor de pago-por-resultado que esquiva ML internamente
    const run = await client.actor("saswave/mercadolibre-product-scraper").call({
        startUrls: [{ url: targetUrl }],
        maxItems: 3 // Solo traemos 3 inquilinos para probar rápido
    });

    console.log("📥 Recibiendo informe del especialista...");
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
       console.log("⚠️ El especialista volvió con las manos vacías.");
       return res.json({ results: [], status: "empty" });
    }

    // Adaptamos los resultados al formato exacto que tu plataforma FIFER necesita
    const products = items.slice(0, 3).map((item, i) => ({
        id: item.id || item.itemId || item.productId || `REF-${i}`,
        title: item.title || item.name || "Producto FIFER",
        price: item.price || item.currentPrice || 0,
        permalink: item.url || item.link || targetUrl,
        thumbnail: item.picture || item.thumbnail || item.imageUrl || item.image || ""
    }));

    console.log(`✅ [FIFER] ¡INQUILINOS CONFIRMADOS! ${products.length} productos listos.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en el subcontrato:", err.message);
    res.status(500).json({ error: "Error en la faena", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor V32 en puerto ${PORT}`));