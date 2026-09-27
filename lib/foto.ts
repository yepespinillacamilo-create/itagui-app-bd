// Recorta en cuadrado (centrado) y comprime la foto en el navegador antes de subirla.
// Resultado: JPG de 800×800, nítido y liviano (~100-200 KB).
export async function prepararFoto(file: File | Blob, lado = 800): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('No se pudo leer la imagen'));
      i.src = url;
    });
    const min = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - min) / 2;
    const sy = (img.naturalHeight - min) / 2;
    const tam = Math.min(lado, min);
    const canvas = document.createElement('canvas');
    canvas.width = tam; canvas.height = tam;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, min, min, 0, 0, tam, tam);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.88)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
