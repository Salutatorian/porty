export const ADMIN_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export const ADMIN_MAX_UPLOAD_LABEL = "100 MB";

export function isWithinAdminUploadLimit(bytes: number) {
  return bytes > 0 && bytes <= ADMIN_MAX_UPLOAD_BYTES;
}

export function adminUploadLimitError(fileName: string) {
  return `"${fileName}" is too large. Maximum upload size is ${ADMIN_MAX_UPLOAD_LABEL}.`;
}
