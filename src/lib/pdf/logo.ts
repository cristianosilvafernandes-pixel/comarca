/** Escala (mm) preservando proporção, limitada por largura e altura máximas. */
export function computeLogoDims(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  if (naturalW <= 0 || naturalH <= 0) return { w: 0, h: 0 };
  const ratio = naturalW / naturalH;
  let h = maxH;
  let w = h * ratio;
  if (w > maxW) {
    w = maxW;
    h = w / ratio;
  }
  return { w, h };
}

/**
 * Carrega uma imagem (URL pública) e devolve PNG dataURL + dimensões naturais.
 * Normaliza qualquer formato para PNG (seguro no jsPDF addImage) e contorna CORS
 * via canvas. Devolve null em qualquer falha (CORS, rede, canvas tainted).
 * Browser-only.
 */
export async function loadLogoPng(
  url: string,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("logo load failed"));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return {
      dataUrl: canvas.toDataURL("image/png"),
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  } catch {
    return null;
  }
}
