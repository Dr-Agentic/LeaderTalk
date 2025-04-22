import { apiRequest } from "./queryClient";

/**
 * Updates all leader images to use the clean SVG files without names
 */
export async function updateLeaderImagesToCleanVersion() {
  try {
    const response = await apiRequest('POST', '/api/admin/update-leader-images');
    
    if (response.ok) {
      const result = await response.json();
      console.log('Leader images updated successfully:', result);
      return {
        success: true,
        message: `Updated ${result.updatedLeaders?.length || 0} leader images`
      };
    } else {
      console.error('Failed to update leader images:', response.statusText);
      return {
        success: false,
        message: `Failed to update leader images: ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('Error updating leader images:', error);
    return {
      success: false,
      message: `Error updating leader images: ${error.message || 'Unknown error'}`
    };
  }
}