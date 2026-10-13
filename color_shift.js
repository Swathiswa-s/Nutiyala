const sharp = require('sharp');
const path = require('path');

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;
  h = ((h % 360) + 360) % 360;
  h /= 360;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

async function processDressVariants() {
  const inputPath = path.join(__dirname, 'assets', 'model-maroon.jpg');
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  
  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const emeraldData = Buffer.from(data);
  const navyData = Buffer.from(data);

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pixelIndex = i / channels;
    const y = Math.floor(pixelIndex / width);
    const x = pixelIndex % width;

    // Skip head/face region and delicate hands region
    const isHead = (y < height * 0.25 && x > width * 0.32 && x < width * 0.68);
    const isHands = (y > height * 0.46 && y < height * 0.56 && x > width * 0.45 && x < width * 0.62);

    if (!isHead && !isHands) {
      const [h, s, l] = rgbToHsl(r, g, b);
      
      // Maroon fabric hue: 320 to 360 and 0 to 25
      // Saturation is moderate to high (> 0.18), Lightness is dark to medium (< 0.60)
      const isFabric = (h >= 320 || h <= 25) && s > 0.18 && l < 0.62;

      if (isFabric) {
        // Emerald Green: target hue ~150-160
        const [er, eg, eb] = hslToRgb(152, Math.min(1, s * 1.1), l * 0.95);
        emeraldData[i] = er;
        emeraldData[i + 1] = eg;
        emeraldData[i + 2] = eb;

        // Navy Blue: target hue ~220-225
        const [nr, ng, nb] = hslToRgb(222, Math.min(1, s * 1.2), l * 0.92);
        navyData[i] = nr;
        navyData[i + 1] = ng;
        navyData[i + 2] = nb;
      }
    }
  }

  await sharp(emeraldData, { raw: { width, height, channels } })
    .jpeg({ quality: 95 })
    .toFile(path.join(__dirname, 'assets', 'model-emerald.jpg'));

  await sharp(navyData, { raw: { width, height, channels } })
    .jpeg({ quality: 95 })
    .toFile(path.join(__dirname, 'assets', 'model-navy.jpg'));

  console.log('Processed HSL fabric replacement successfully!');
}

processDressVariants().catch(console.error);
