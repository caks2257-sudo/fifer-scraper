const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// 🔑 Tu Llave Maestra de Apify
const const APIFY_TOKEN = process.env.APIFY_TOKEN; 
const client = new ApifyClient({ token: APIFY_TOKEN });

app.get('/', (req, res) => {
  res.send("🚀 [FIFER] Motor de Extracción Apify V27 - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [FIFER] Solicitando inquilinos vía Apify para: ${categoryId}`);

  try {
    console.log("🚜 Retroexcavadora trabajando (puede tardar 10-30 segundos)...");
    
    // Configuramos la tarea para el Web Scraper de Apify
    const run = await client.actor("apify/web-scraper").call({
        startUrls: [{ url: `https://listado.mercadolibre.cl/_CategoryId_${categoryId}` }],
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"], // 🛡️ Esto es lo que rompe el bloqueo de Mercado Libre
        pageFunction: `
            async function pageFunction(context) {
                const $ = context.jQuery;
                const products = [];
                // Buscamos los contenedores de ML
                $('.ui-search-result__wrapper, .poly-card').each((i, el) => {
                    if (products.length >= 3) return false; // Solo traemos 3 para probar
                    const card = $(el);
                    const link = card.find('a').attr('href') || "";
                    if (link.includes('articulo.mercadolibre.cl')) {
                        const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\\./g, '');
                        products.push({
                            id: link.match(/MLC-?(\\d+)/)?.[0].replace('-', '') || \`REF-\${i}\`,
                            title: card.find('h2, h3').first().text().trim(),
                            price: parseInt(priceStr) || 0,
                            permalink: link.split('#')[0].split('?')[0],
                            thumbnail: card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || ""
                        });
                    }
                });
                return products;
            }
        `
    });

    console.log("📥 Descargando resultados desde Apify...");
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const products = items.length > 0 ? items[0] : [];

    if (products.length === 0) {
       console.log("⚠️ La faena terminó pero el terreno estaba vacío (Posible captcha duro).");
       return res.json({ results: [] });
    }

    console.log(`✅ [FIFER] ¡INQUILINOS CONFIRMADOS! ${products.length} productos listos para la app.`);
    res.json({ results: products });

  } catch (err) {
    console.error("❌ Fallo en la maquinaria:", err.message);
    res.status(500).json({ error: "Error en la faena", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor Apify en puerto ${PORT}`));