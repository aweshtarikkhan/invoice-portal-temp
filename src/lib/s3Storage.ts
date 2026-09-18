/**
 * Upload a file directly to AWS S3 using a presigned URL from the backend
 */
export async function uploadToS3(file: File, folder: string = 'uploads'): Promise<string> {
  const backendUrl = import.meta.env.VITE_WHATSAPP_SERVICE_URL || '/api';
  
  // 1. Request presigned URL from backend
  const presignedRes = await fetch(`${backendUrl}/storage/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      folder
    })
  });

  if (!presignedRes.ok) {
    const err = await presignedRes.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get S3 upload URL');
  }

  const { uploadUrl, publicUrl } = await presignedRes.json();

  // 2. Directly upload the binary file to S3
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  });

  if (!uploadRes.ok) {
    throw new Error(`S3 upload failed with status ${uploadRes.status}`);
  }

  return publicUrl;
}
