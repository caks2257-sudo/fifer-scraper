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
  res.send("🚀 [FIFER] Motor Especialista V29 - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [FIFER] Contratando Subcontratista (epctex) para: ${categoryId}`);

  try {
    // Limpiamos el ID por si viene como "MLC1071" y armamos la URL directa
    const cleanId = categoryId.replace('MLC', '');
    const targetUrl = `https://listado.mercadolibre.cl/MLC${cleanId}`;

    console.log("🚜 El especialista está en terreno (puede tardar 15-40 segundos)...");

    // 💡 CAMBIO CRÍTICO: Llamamos al scraper especializado en Mercado Libre
    const run = await client.actor("epctex/mercadolibre-scraper").call({
        startUrls: [{ url: targetUrl }],
        maxItems: 3, // Solo pedimos 3 para que sea rápido y barato
        proxy: { useApifyProxy: true }
    });

    console.log("📥 Recibiendo informe del especialista...");
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
       console.log("⚠️ El subcontratista volvió con las manos vacías.");
       return res.json({ results: [], status: "empty" });
    }

    // Adaptamos el formato del especialista a lo que tu aplicación FIFER necesita
    const products = items.map((item, i) => ({
        id: item.id || `REF-${i}`,
        title: item.title || item.name || "Producto FIFER",
        price: item.price || 0,
        permalink: item.url || item.link,
        thumbnail: item.picture || item.thumbnail || item.imageUrl || ""
    }));

    console.log(`✅ [FIFER] ¡INQUILINOS CONFIRMADOS! ${products.length} productos instalados.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en el subcontrato:", err.message);
    res.status(500).json({ error: "Error en la faena", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor Especialista en puerto ${PORT}`));