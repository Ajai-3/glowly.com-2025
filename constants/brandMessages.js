// ========================================================================================
// BRAND CONSTANT MESSAGES
// ========================================================================================

export const BRAND_MESSAGES = {
  BRAND_NAME_REQUIRED: "Brand name is required.",
  IMAGE_REQUIRED: "Image is required.",
  BRAND_EXISTS: "Brand with this name already exists.",
  BRAND_ADDED: "Brand added successfully!",
  BRAND_ADD_ERROR: "An error occurred while adding the brand.",
  BRAND_NOT_FOUND: "Brand not found.",
  BRAND_UPDATED: "Brand updated successfully!",
  SERVER_ERROR: "Server Error",
  BRAND_TOGGLED: (name, isListed) => 
    `Brand "${name}" has been ${isListed ? "listed" : "unlisted"} successfully.`,
  RENDER_PAGE_ERROR: "An error occurred while rendering the brands page.",
  LOAD_PAGE_ERROR: "An error occurred while loading the add brand page."
};
