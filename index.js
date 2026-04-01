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
  res.send("🚀 [FIFER] Motor Híbrido API+Apify V31 - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [FIFER] Perforación directa a la bóveda JSON para: ${categoryId}`);

  try {
    // 💡 CAMBIO CRÍTICO: Atacamos la API Oficial pública, NO la página web visual
    const targetUrl = `https://api.mercadolibre.com/sites/MLC/search?category=${categoryId}&limit=5`;

    console.log("🚜 Enviando retroexcavadora por túnel residencial a la API...");

    // Usamos el scraper rápido (cheerio) pero configurado para leer JSON
    const run = await client.actor("apify/cheerio-scraper").call({
        startUrls: [{ url: targetUrl }],
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"],
        additionalMimeTypes: ["application/json"], // Le decimos que no espere HTML
        pageFunction: `
            async function pageFunction(context) {
                const { json, body } = context;
                
                // Aseguramos la captura de los datos puros
                let data = json;
                if (!data && body) {
                    try { data = JSON.parse(body.toString()); } catch(e) {}
                }

                if (!data || !data.results) {
                    return { productsFound: 0, products: [], raw: body ? body.toString().substring(0, 100) : "Vacío" };
                }

                // Mapeamos los datos limpios para tu App FIFER
                const products = data.results.slice(0, 3).map((item, i) => ({
                    id: item.id || \`REF-\${i}\`,
                    title: item.title || "Producto FIFER",
                    price: item.price || 0,
                    permalink: item.permalink || "",
                    thumbnail: item.thumbnail ? item.thumbnail.replace("-I.jpg", "-O.jpg") : ""
                }));

                return { productsFound: products.length, products: products };
            }
        `
    });

    console.log("📥 Analizando botín del túnel...");
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const data = items.length > 0 ? items[0] : null;

    if (!data || data.productsFound === 0) {
       console.log(`⚠️ La bóveda respondió, pero sin productos. Raw: ${data ? data.raw : "N/A"}`);
       return res.json({ results: [], status: "blocked_or_empty" });
    }

    console.log(`✅ [FIFER] ¡INQUILINOS CONFIRMADOS! ${data.productsFound} productos obtenidos.`);
    res.json({ results: data.products });

  } catch (err) {
    console.error("❌ Fallo en la perforación:", err.message);
    res.status(500).json({ error: "Error en la faena", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor V31 en puerto ${PORT}`));