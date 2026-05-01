const preprocessForOcr = (imageBase64: string): Promise<string> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const scale = Math.max(1, Math.min(2.5, 2400 / Math.max(image.width, image.height)));
    const canvas = document.createElement('canvas');
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(imageBase64);
      return;
    }

    ctx.drawImage(image, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const contrasted = gray > 150 ? 255 : gray < 95 ? 0 : gray * 1.25;
      data[i] = contrasted;
      data[i + 1] = contrasted;
      data[i + 2] = contrasted;
    }

    ctx.putImageData(imageData, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  };
  image.onerror = () => reject(new Error('Could not load image for OCR.'));
  image.src = imageBase64;
});

export const extractTextFromImage = async (imageBase64: string) => {
  const { createWorker, PSM } = await import('tesseract.js');
  const preparedImage = await preprocessForOcr(imageBase64);
  const worker = await createWorker('eng');

  try {
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&.,:%()/+- ',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
    });
    const preparedResult = await worker.recognize(preparedImage);
    const originalResult = await worker.recognize(imageBase64);
    const combinedText = `${preparedResult.data.text} ${originalResult.data.text}`;
    return Array.from(new Set(combinedText.split(/\s+/).filter(Boolean))).join(' ').trim();
  } finally {
    await worker.terminate();
  }
};
