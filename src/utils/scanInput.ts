export function validBarcode(value: string) {
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return false;
  const digits = value.split("").map(Number);
  const check = digits.pop();
  const sum = digits
    .reverse()
    .reduce((total, digit, index) => total + digit * (index % 2 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === check;
}
export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export async function validateLabelFile(file: File) {
  if (
    file.size > MAX_FILE_BYTES ||
    file.size === 0 ||
    !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
      file.type,
    )
  )
    return false;
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = String.fromCharCode(...bytes);
  return file.type === "application/pdf"
    ? ascii.startsWith("%PDF-")
    : file.type === "image/jpeg"
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : file.type === "image/png"
        ? bytes[0] === 137 && ascii.slice(1, 4) === "PNG"
        : ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP";
}
export const readLabelFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(file);
  });
export const preparePhoto = (url: string) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("The image could not be opened."));
    img.onload = () => {
      if (!img.width || !img.height || img.width * img.height > 40000000) {
        reject(new Error("Image dimensions are too large."));
        return;
      }
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Image processing is unavailable."));
        return;
      }
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = url;
  });
