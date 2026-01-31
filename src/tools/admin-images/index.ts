/**
 * Ghost Admin API Images tools.
 *
 * Provides tools for uploading images via the Ghost Admin API.
 */

export {
  executeAdminUploadImage,
  TOOL_NAME as ADMIN_UPLOAD_IMAGE_TOOL_NAME,
  TOOL_DESCRIPTION as ADMIN_UPLOAD_IMAGE_TOOL_DESCRIPTION,
} from './upload-image.js';

export {
  AdminUploadImageInputSchema,
  ImagePurposeSchema,
  type AdminUploadImageInput,
  type ImagePurpose,
} from './schemas.js';
