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
  res.send("🚀 [FIFER] Motor de Extracción Apify V28 (Modo Sigilo) - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [FIFER] Solicitando inquilinos vía Apify Sigilo para: ${categoryId}`);

  try {
    console.log("🚜 Petición de alta velocidad en proceso...");
    
    // 💡 CAMBIO CRÍTICO: Usamos cheerio-scraper. Es 10x más rápido y evade ciertos bloqueos visuales.
    const run = await client.actor("apify/cheerio-scraper").call({
        startUrls: [{ url: `https://listado.mercadolibre.cl/_CategoryId_${categoryId}` }],
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"], 
        pageFunction: `
            async function pageFunction(context) {
                const { $ } = context;
                // 📷 TELEMETRÍA: Capturamos el título para saber qué vio Apify realmente
                const pageTitle = $('title').text() || "Sin Título";
                const products = [];
                
                // Selectores ultra-amplios para abarcar cualquier rediseño de ML
                $('.ui-search-result__wrapper, .poly-card, .ui-search-layout__item').each((i, el) => {
                    if (products.length >= 3) return false; 
                    const card = $(el);
                    const link = card.find('a').attr('href') || "";
                    
                    if (link.includes('articulo.mercadolibre.cl')) {
                        const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\\./g, '');
                        const img = card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || "";
                        
                        products.push({
                            id: link.match(/MLC-?(\\d+)/)?.[0].replace('-', '') || \`REF-\${i}\`,
                            title: card.find('h2, h3').first().text().trim() || "Producto FIFER",
                            price: parseInt(priceStr) || 0,
                            permalink: link.split('#')[0].split('?')[0],
                            thumbnail: img
                        });
                    }
                });
                
                // Devolvemos un objeto estructurado para el diagnóstico
                return {
                    title: pageTitle,
                    productsFound: products.length,
                    products: products
                };
            }
        `
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const data = items.length > 0 ? items[0] : null;

    if (!data || data.productsFound === 0) {
       // 🚨 Aquí leemos las cámaras de seguridad
       const tituloVisto = data ? data.title : "Desconocido";
       console.log(`⚠️ Terreno vacío. Título capturado por Apify: "${tituloVisto}"`);
       return res.json({ results: [], status: "blocked", view: tituloVisto });
    }

    console.log(`✅ [FIFER] ¡INQUILINOS CONFIRMADOS! ${data.productsFound} productos obtenidos del mall: "${data.title}"`);
    res.json({ results: data.products });

  } catch (err) {
    console.error("❌ Fallo en la maquinaria profunda:", err.message);
    res.status(500).json({ error: "Error en la faena", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor Apify V28 en puerto ${PORT}`));