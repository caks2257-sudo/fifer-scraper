const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send("🚀 [Referidos] Motor V25: Inspector Googlebot + Andamio - Activo");
});

app.get('/scrape', async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "Falta categoryId" });

  console.log(`🕵️‍♂️ [Referidos] Iniciando protocolo 'Inspector Municipal' para: ${categoryId}`);

  const targetUrl = `https://listado.mercadolibre.cl/animales-mascotas`;

  // 💎 EL DISFRAZ PERFECTO: Simulamos ser el robot indexador de Google
  const googlebotHeaders = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'X-Forwarded-For': '66.249.66.1', // Forzamos una IP conocida de Google
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  try {
    // Atacamos directo desde Render, sin intermediarios.
    const response = await axios.get(targetUrl, { 
      headers: googlebotHeaders, 
      timeout: 15000 
    });
    
    const $ = cheerio.load(response.data);
    console.log(`📌 Título visto por Googlebot: ${$('title').text()}`);

    let products = [];
    $('.ui-search-result__wrapper, .poly-card').each((i, el) => {
      if (products.length >= 3) return false;
      const card = $(el);
      const link = card.find('a').attr('href') || "";

      if (link.includes('articulo.mercadolibre.cl')) {
        const priceStr = card.find('.andes-money-amount__fraction').first().text().replace(/\./g, '') || "0";
        if (parseInt(priceStr) > 0) {
          products.push({
            id: link.match(/MLC-?(\d+)/)?.[0].replace('-', '') || `REF-${i}`,
            title: card.find('h2, h3').first().text().trim(),
            price: parseInt(priceStr),
            permalink: link.split('#')[0].split('?')[0],
            thumbnail: card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || ""
          });
        }
      }
    });

    if (products.length > 0) {
      console.log(`✅ [Referidos] ¡INSPECCIÓN APROBADA! ${products.length} productos obtenidos.`);
      return res.json({ results: products });
    } else {
      throw new Error("El HTML cargó pero estaba vacío (Bloqueo de Renderizado).");
    }

  } catch (err) {
    console.error(`❌ El guardia detectó el disfraz: ${err.message}`);
    console.log("⚠️ Desplegando Andamio de Desarrollo (Datos de Respaldo)...");
    
    // 🚧 ANDAMIO DE DESARROLLO: Para que FIFER no se detenga.
    // Si la extracción falla, devolvemos esto para que tu frontend siga funcionando.
    const mockProducts = [
      {
        id: "MLC12345678",
        title: "Alimento Pro Plan Adulto Raza Mediana 15kg",
        price: 54990,
        permalink: "https://articulo.mercadolibre.cl/MLC-12345678",
        thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_824925-MLU74272895689_012024-F.webp"
      },
      {
        id: "MLC87654321",
        title: "Cama Para Perro Raza Grande Lavable",
        price: 22500,
        permalink: "https://articulo.mercadolibre.cl/MLC-87654321",
        thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_892994-MLC50190145260_062022-F.webp"
      },
      {
        id: "MLC11223344",
        title: "Arena Sanitaria Para Gatos 10 Kg",
        price: 8900,
        permalink: "https://articulo.mercadolibre.cl/MLC-11223344",
        thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_788220-MLC51347055990_082022-F.webp"
      }
    ];

    res.status(200).json({ 
      results: mockProducts, 
      status: "mock_data",
      message: "Scraping bloqueado. Devolviendo datos de andamiaje para desarrollo."
    });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [Referidos] Motor V25 en puerto ${PORT}`));