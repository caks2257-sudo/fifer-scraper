// IMPORTAMOS EL CAMUFLAJE
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const express = require('express');
// ... (deja el resto de tu código exactamente igual hacia abajo)
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
const PORT = process.env.PORT || 3000;

// 1. RUTA RAÍZ: Fundamental para que Render sepa que el servidor está vivo (Health Check)
app.get('/', (req, res) => {
  res.send("🚀 Servidor Scraper Activo y Esperando Órdenes");
});

// Función para simular que un humano baja por la página (Scrolleo)
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 100;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ Iniciando asalto de precisión en: ${categoryId}`);
  
  let browser;
  try {
    // 2. BANDERAS DE NUBE: Añadimos parámetros críticos para evitar que Render se quede sin memoria RAM
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // <--- EVITA CRASHES DE MEMORIA EN RENDER
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // 3. CAMUFLAJE AVANZADO: Le decimos a ML que nuestro navegador está configurado en Español Chile
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8'
    });
    
    // Disfraz de Chrome real actualizado
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    const url = `https://listado.mercadolibre.cl/_CategoryId_${categoryId}`;
    console.log(`🔗 Navegando a: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Bajamos por la página para activar el Lazy Load de ML
    console.log("🖱️ Haciendo scroll para cargar imágenes y productos...");
    await autoScroll(page);

    // EXTRACCIÓN CON BISTURÍ DE CIRUJANO
    const products = await page.evaluate(() => {
      // Buscamos cualquier link que contenga un ID de MLC
      const links = Array.from(document.querySelectorAll('a'))
        .filter(a => a.href.includes('articulo.mercadolibre.cl/MLC'));

      const results = [];
      const seen = new Set();

      for (const a of links) {
        if (results.length >= 3) break;

        const cleanLink = a.href.split('#')[0].split('?')[0];
        if (seen.has(cleanLink)) continue;
        seen.add(cleanLink);

        // Subimos al contenedor padre para buscar el precio y título
        // ML usa estructuras complejas, buscamos el ancestro más común
        const card = a.closest('.ui-search-result__wrapper') || a.closest('.poly-card') || a.parentElement;
        
        const title = card.querySelector('h2, h3, .ui-search-item__title')?.innerText.trim() || "Producto ML";
        const priceStr = card.querySelector('.andes-money-amount__fraction')?.innerText.replace(/\./g, '') || "0";
        const img = card.querySelector('img');
        
        results.push({
          id: cleanLink.match(/MLC-?(\d+)/)?.[0].replace('-', '') || "MLC-TEMP",
          title: title,
          price: parseInt(priceStr),
          permalink: cleanLink,
          thumbnail: img?.getAttribute('data-src') || img?.src || ""
        });
      }
      return results;
    });

    await browser.close();

    if (products.length === 0) {
      console.log("⚠️ No se pillaron productos. Probablemente ML nos tiró un reto de seguridad.");
    } else {
      console.log(`✅ ¡CONQUISTA! ${products.length} productos reales capturados.`);
    }
    
    res.json({ results: products });

  } catch (err) {
    if (browser) await browser.close();
    console.error("❌ Fallo en la matriz:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Scraper de Guerrilla en puerto ${PORT}`));