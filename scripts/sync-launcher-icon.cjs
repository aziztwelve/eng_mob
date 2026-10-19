// Derive Android launcher layers from the approved final artwork.
// Run before regenerating Android resources if the final artwork changes.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

async function main() {
  const root = path.resolve(__dirname, '..');
  const source = path.join(root, 'store-assets/final-icon/lingoiq-icon-1024-appstore.png');
  const assets = path.join(root, 'assets/images');
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 1024 || info.height !== 1024) throw new Error('Expected 1024px final icon');

  // This approved artwork has a dark green background and two bright green inks.
  // Retain those inks; the background becomes a separate adaptive layer.
  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, (data[i + 1] - 60) / 40)));
  }
  const size = 542;
  const inset = (1024 - size) / 2;
  // Keep the entire speech bubble, including its tail, inside Android's safe circle.
  const foreground = await sharp(data, { raw: info }).resize(size, size)
    .extend({ top: inset, bottom: inset, left: inset, right: inset, background: '#00000000' })
    .png().toBuffer();
  await fs.writeFile(path.join(assets, 'android-icon-foreground.png'), foreground);
  await sharp(source).extract({ left: 0, top: 0, width: 1, height: 1024 })
    .resize(1024, 1024, { fit: 'fill' }).png().toFile(path.join(assets, 'android-icon-background.png'));
  const mono = await sharp(foreground).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < mono.data.length; i += 4) mono.data[i] = mono.data[i + 1] = mono.data[i + 2] = 255;
  await sharp(mono.data, { raw: mono.info }).png().toFile(path.join(assets, 'android-icon-monochrome.png'));
  await fs.copyFile(source, path.join(assets, 'icon.png'));

  // Sync only launcher resources, without prebuild changing other native settings.
  const icons = require('@expo/prebuild-config/build/plugins/icons/withAndroidIcons');
  const config = require('../app.json').expo;
  await icons.setIconAsync(root, {
    icon: config.android.adaptiveIcon.foregroundImage,
    backgroundImage: config.android.adaptiveIcon.backgroundImage,
    backgroundColor: config.android.adaptiveIcon.backgroundColor,
    monochromeImage: config.android.adaptiveIcon.monochromeImage,
    isAdaptive: true,
  });
  // Legacy square launchers can use the original, without adaptive safe-area padding.
  for (const { folderName, scale } of Object.values(icons.dpiValues)) {
    await sharp(source).resize(48 * scale, 48 * scale).webp({ lossless: true })
      .toFile(path.join(root, 'android/app/src/main/res', folderName, 'ic_launcher.webp'));
  }
  console.log('Final LingoIQ artwork synced to Android launcher resources.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
