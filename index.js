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
  res.send("🚀 [FIFER] Motor Puppeteer Stealth V30 - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [FIFER] Lanzando Navegador Blindado para: ${categoryId}`);

  try {
    // Armamos la URL exacta con el filtro de categoría oculto
    const targetUrl = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;

    console.log("🚜 Encendiendo Chrome con Evasión DataDome (Puede tardar 20-40s)...");

    // 💡 CAMBIO CRÍTICO: Usamos el Puppeteer Scraper oficial de Apify.
    // Levanta un navegador Chrome real y ejecuta código directo en la página web.
    const run = await client.actor("apify/puppeteer-scraper").call({
        startUrls: [{ url: targetUrl }],
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"],
        pageFunction: `
            async function pageFunction(context) {
                const { page, log } = context;
                
                log.info("⏳ Esperando que Mercado Libre cargue visualmente...");
                
                // Le damos hasta 15 segundos para que la página dibuje las tarjetas de productos.
                // Esto evita que saquemos el JSON mientras la página sigue en blanco.
                await page.waitForSelector('.ui-search-result__wrapper, .poly-card', { timeout: 15000 })
                    .catch(() => log.warning("⚠️ Tiempo agotado. Las tarjetas no aparecieron."));

                // Extraemos los datos inyectando JS directo en el navegador
                const data = await page.evaluate(() => {
                    const products = [];
                    const title = document.title || "Sin título";
                    
                    const cards = document.querySelectorAll('.ui-search-result__wrapper, .poly-card');
                    
                    const limit = Math.min(cards.length, 3);
                    for(let i = 0; i < limit; i++) {
                        const card = cards[i];
                        const linkEl = card.querySelector('a');
                        const link = linkEl ? linkEl.href : "";
                        
                        if (link.includes('articulo.mercadolibre.cl')) {
                            const titleEl = card.querySelector('h2, h3');
                            const priceEl = card.querySelector('.andes-money-amount__fraction');
                            const imgEl = card.querySelector('img');
                            
                            const priceStr = priceEl ? priceEl.innerText.replace(/\\./g, '') : "0";
                            const imgUrl = imgEl ? (imgEl.getAttribute('data-src') || imgEl.src) : "";
                            
                            // Rescatamos el ID del enlace
                            const idMatch = link.match(/MLC-?(\\d+)/);
                            const idStr = idMatch ? idMatch[0].replace('-', '') : \`REF-\${i}\`;
                            
                            products.push({
                                id: idStr,
                                title: titleEl ? titleEl.innerText.trim() : "Producto FIFER",
                                price: parseInt(priceStr) || 0,
                                permalink: link.split('#')[0].split('?')[0],
                                thumbnail: imgUrl
                            });
                        }
                    }
                    
                    return {
                        title: title,
                        productsFound: products.length,
                        products: products
                    };
                });
                
                return data;
            }
        `
    });

    console.log("📥 Analizando resultados del navegador...");
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const data = items.length > 0 ? items[0] : null;

    if (!data || data.productsFound === 0) {
       const tituloVisto = data ? data.title : "Desconocido";
       console.log(`⚠️ El navegador cruzó pero no encontró tarjetas. Título visto: "${tituloVisto}"`);
       return res.json({ results: [], status: "blocked", view: tituloVisto });
    }

    console.log(`✅ [FIFER] ¡INQUILINOS CONFIRMADOS! ${data.productsFound} productos obtenidos del mall: "${data.title}"`);
    res.json({ results: data.products });

  } catch (err) {
    console.error("❌ Fallo en el navegador blindado:", err.message);
    res.status(500).json({ error: "Error en la faena", details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [FIFER] Motor V30 en puerto ${PORT}`));