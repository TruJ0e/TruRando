const OCR_PATHS = {
  worker: new URL('../vendor/tesseract/worker.min.js', import.meta.url).href,
  core: new URL('../vendor/tesseract/core', import.meta.url).href.replace(/\/$/, ''),
  lang: new URL('../vendor/tesseract/lang', import.meta.url).href.replace(/\/$/, '')
};

const MAX_IMAGE_EDGE = 2600;
const MIN_IMAGE_EDGE = 1400;

export function extractNamesFromText(text) {
  return text
    .replace(/\f/g, '\n')
    .split(/\r?\n/)
    .map((line) => line
      .replace(/^\s*(?:[•·▪●◦*-]|\d{1,3}[.)-])\s*/, '')
      .replace(/\s+/g, ' ')
      .trim())
    .filter((line) => /[A-Za-zÀ-ÖØ-öø-ÿ]/u.test(line))
    .filter((line) => line.length >= 2)
    .filter((line) => !/^(name|student|students|roster|class|period|group|topic)s?\b[:\s-]*$/i.test(line));
}

async function imageFileToCanvas(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file such as PNG, JPG, HEIC, or WEBP supported by your browser.');
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  try {
    const longestEdge = Math.max(bitmap.width, bitmap.height);
    let scale = 1;

    if (longestEdge > MAX_IMAGE_EDGE) {
      scale = MAX_IMAGE_EDGE / longestEdge;
    } else if (longestEdge < MIN_IMAGE_EDGE) {
      scale = Math.min(2, MIN_IMAGE_EDGE / longestEdge);
    }

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Your browser could not prepare the image for OCR.');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    return canvas;
  } finally {
    bitmap.close();
  }
}

function formatProgress(message) {
  const status = String(message.status || '').replaceAll('_', ' ');
  if (!status) return 'Reading image locally…';

  if (typeof message.progress === 'number' && message.progress > 0 && message.progress <= 1) {
    return `${status.charAt(0).toUpperCase()}${status.slice(1)} ${Math.round(message.progress * 100)}%`;
  }

  return `${status.charAt(0).toUpperCase()}${status.slice(1)}…`;
}

export async function extractNamesFromImage(file, onProgress = () => {}) {
  if (!window.Tesseract?.createWorker) {
    throw new Error('Local OCR files are not available in this build. Run the TruRando build step before deployment.');
  }

  const canvas = await imageFileToCanvas(file);
  let worker;

  try {
    onProgress('Loading local OCR engine…');

    worker = await window.Tesseract.createWorker('eng', 1, {
      workerPath: OCR_PATHS.worker,
      corePath: OCR_PATHS.core,
      langPath: OCR_PATHS.lang,
      cacheMethod: 'none',
      gzip: true,
      workerBlobURL: false,
      logger: (message) => onProgress(formatProgress(message))
    });

    await worker.setParameters({
      preserve_interword_spaces: '1',
      user_defined_dpi: '300'
    });

    onProgress('Recognizing names locally…');
    const { data } = await worker.recognize(canvas, { rotateAuto: true });
    const names = extractNamesFromText(data.text || '');

    if (!names.length) {
      throw new Error('No readable names were found. Try a clearer, straighter, higher-contrast photo.');
    }

    return names;
  } finally {
    if (worker) await worker.terminate();
    canvas.width = 1;
    canvas.height = 1;
  }
}
