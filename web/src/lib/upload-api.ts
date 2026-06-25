import { api } from './api-client';

export interface UploadResult {
  url: string;
  key: string;
}

// Upload 1 file qua POST /uploads (multipart, field 'file').
// Dùng api.post: axios tự nhận diện FormData và set Content-Type multipart + boundary,
// đồng thời tái sử dụng base URL + Authorization + refresh-token của api-client.
export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  return api.post<UploadResult>('/uploads', form);
}
