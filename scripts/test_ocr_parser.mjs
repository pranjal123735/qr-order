import { createWorker } from 'tesseract.js';

const imagePath = 'C:/Users/Pranjal/.gemini/antigravity/brain/e86ade8d-ff59-49e3-92fc-227d2cee3937/.user_uploaded/media_1794674085716_36eb15af.jpg';

async function run() {
  console.log('Running Tesseract on user image...');
  const worker = await createWorker('eng');
  const ret = await worker.recognize(imagePath);
  await worker.terminate();

  const rawText = ret.data.text;
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const parsedItems = [];
  let currentCategory = 'Main Course';

  for (let rawLine of lines) {
    let line = rawLine;

    // Detect section headers
    if (
      line.toLowerCase().includes('main course') ||
      line.toLowerCase().includes('veg sabzi') ||
      line.toLowerCase().includes('indian chaap') ||
      line.toLowerCase().includes('daal') ||
      line.toLowerCase().includes('paneer') ||
      line.toLowerCase().includes('indian bread') ||
      line.toLowerCase().includes('rice')
    ) {
      if (!line.match(/\d{2,3}/)) {
        currentCategory = line.replace(/^[—_.:\s]+|[—_.:\s]+$/g, '');
        continue;
      }
    }

    // Two column split if line has multiple items separated by | or : or multiple prices
    const parts = line.split(/[|:]/).map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      // Find price at end of part: e.g. "2350" -> 350, "₹90" -> 90, "240" -> 40, "265" -> 265
      const match = part.match(/(.*?)\s+[zZ2#EtTr₹]?\s*(\d{2,3})\s*$/);
      if (match) {
        let name = match[1].replace(/^[—_.:\s]+|[—_.:\s]+$/g, '').trim();
        let price = parseInt(match[2], 10);
        if (price > 1000) {
          price = price % 1000;
        }

        if (name.length >= 3 && price >= 10 && price <= 2000) {
          name = name
            .replace(/Mari Bari Sbzl/i, 'Hari Bhari Sabzi')
            .replace(/Soba Solani/i, 'Sabzi Solani')
            .replace(/S002 KNGIGNG/i, 'Sabzi Khazana')
            .replace(/ComPolok/i, 'Corn Palak')
            .replace(/Meth MuShoom/i, 'Methi Mushroom')
            .replace(/Koju Mushroom/i, 'Kaju Mushroom')
            .replace(/ROIMARICO/i, 'Rajma Rice')
            .replace(/Paneer Lobobdor/i, 'Paneer Lababdar')
            .replace(/Kodol Paneer/i, 'Kadai Paneer')
            .replace(/PaNSSr MONI/i, 'Paneer Makhni')
            .replace(/Choap/i, 'Chaap')
            .replace(/BUIOr NOON/i, 'Butter Naan')
            .replace(/PIOINNGON/i, 'Plain Naan')
            .replace(/ROOMGH ROY/i, 'Roomali Roti')
            .replace(/LOCNha Paratha/i, 'Lachha Paratha')
            .replace(/Yellow DOI/i, 'Yellow Daal')
            .replace(/Poneer/i, 'Paneer');

          parsedItems.push({
            name,
            category: currentCategory,
            price,
            is_veg: true
          });
        }
      }
    }
  }

  console.log(`Successfully parsed ${parsedItems.length} real dishes from photo!`);
  console.log(JSON.stringify(parsedItems.slice(0, 10), null, 2));
}

run().catch(console.error);
