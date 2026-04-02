const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send("🚀 [FIFER] Motor V42 (Conexión Oficial Directa) - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`\n🕵️‍♂️ [FIFER] Solicitando inquilinos directamente a la Bóveda Oficial: ${categoryId}`);

  try {
    // 💡 LA PUERTA PRINCIPAL: Le pegamos directo a la API pública de ML 
    // sin intermediarios, sin llaves, sin proxies.
    const targetUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}&limit=5`;
    console.log(`🚜 Viajando por la autopista principal: ${targetUrl}`);
    
    // Hacemos la petición como un servidor estándar
    const response = await axios.get(targetUrl);

    if (!response.data || !response.data.results || response.data.results.length === 0) {
        throw new Error("La bóveda oficial respondió, pero la categoría está vacía.");
    }

    // Mapeamos los datos oficiales al formato FIFER
    const products = response.data.results.slice(0, 3).map((item, i) => ({
        id: item.id || `REF-${i}`,
        title: item.title || "Producto FIFER",
        price: item.price || 0,
        permalink: item.permalink || "",
        // La API entrega miniaturas muy pequeñas (-I.jpg). Las cambiamos a alta calidad (-O.jpg)
        thumbnail: item.thumbnail ? item.thumbnail.replace("-I.jpg", "-O.jpg") : ""
    }));

    console.log(`✅ [FIFER] ¡INQUILINOS REALES DESDE LA FUENTE! ${products.length} productos procesados.`);
    return res.json({ results: products, source: "mercadolibre_official" });

  } catch (err) {
    console.error(`⚠️ Bloqueo o falla en la Bóveda (${err.message}). Activando Respaldo Anti-Sísmico...`);
    
    // ==========================================
    // PASO 3: RESPALDO DINÁMICO (ANTI-SÍSMICO)
    // ==========================================
    // Usamos el ID de categoría en el título para que el frontend siga siendo dinámico
    const fallbackProducts = [
      {
        id: `MOCK-1-${categoryId}`,
        title: `Artículo Premium (Cat: ${categoryId})`,
        price: 25990,
        permalink: "https://mercadolibre.cl",
        thumbnail: "https://http2.mlstatic.com/D_824925-MLU74272895689_012024-O.jpg"
      },
      {
        id: `MOCK-2-${categoryId}`,
        title: `Oferta Especial (Cat: ${categoryId})`,
        price: 15500,
        permalink: "https://mercadolibre.cl",
        thumbnail: "https://http2.mlstatic.com/D_892994-MLC50190145260_062022-O.jpg"
      },
      {
        id: `MOCK-3-${categoryId}`,
        title: `Producto Estándar (Cat: ${categoryId})`,
        price: 9900,
        permalink: "https://mercadolibre.cl",
        thumbnail: "https://http2.mlstatic.com/D_788220-MLC51347055990_082022-O.jpg"
      }
    ];

    console.log(`🚧 [FIFER] Inquilinos de respaldo desplegados con éxito.`);
    return res.json({ results: fallbackProducts, source: "fallback_mock" });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor Oficial en puerto ${PORT}`));