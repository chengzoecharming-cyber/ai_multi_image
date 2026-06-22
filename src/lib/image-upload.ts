export interface UploadedImage {
  url: string;
  name: string;
  size: number;
  type: string;
}

interface UploadImageOptions {
  endpoint?: string;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const OPTIMIZE_ABOVE_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2048;
const WEBP_QUALITY = 0.86;

function replaceExtension(fileName: string, extension: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return `${base}${extension}`;
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = objectUrl;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function optimizeImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  try {
    const img = await loadImage(file);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
    if (scale === 1 && file.size <= OPTIMIZE_ABOVE_BYTES) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], replaceExtension(file.name, ".webp"), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export async function uploadImageFile(file: File, options: UploadImageOptions = {}): Promise<{ data: UploadedImage }> {
  const endpoint = options.endpoint || "/api/upload";
  const uploadFile = await optimizeImageFile(file);

  if (uploadFile.size > MAX_UPLOAD_BYTES) {
    throw new Error("图片大小不能超过 10MB，请压缩后再上传");
  }

  const formData = new FormData();
  formData.append("file", uploadFile);

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `上传失败 (${res.status})`);
  }
  if (!data?.data?.url) {
    throw new Error("上传失败：服务器未返回图片地址");
  }
  return data;
}
