export function fileBlob(dataUrl) {
  const [header, body] = String(dataUrl || "").split(",");
  const mime = header.match(/data:(.*?);/)?.[1] || "application/octet-stream";
  const binary = atob(body || "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

export function downloadData(dataUrl, name) {
  const url = URL.createObjectURL(fileBlob(dataUrl));
  const link = document.createElement("a");
  link.href = url;
  link.download = name || "archivo";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
