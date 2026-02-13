/**
 * FileManagerAPI (Standalone P2P)
 */
export class FileManagerAPI {
  /**
   * Check if files are used across multiple instances and worlds
   * @param {string[]} filePaths - List of relative paths to check
   * @returns {Promise<Object>} Map of filePath -> usage data
   */
  static async checkFiles(filePaths) {
    const results = {};
    for (const path of filePaths) {
        results[path] = { used: false, locations: [] };
    }

    // Single World mode: Only check local index
    const indexPath = "modules/rpgnautas-file-manager/data/rpgnautas-index.json";
    
    try {
        const response = await fetch("/" + indexPath + "?t=" + Date.now(), { cache: 'no-store' });
        if (!response.ok) return results;
        
        const indexData = await response.json();
        const files = indexData.files || {};

        for (const path of filePaths) {
            if (files[path]) {
                results[path].used = true;
                results[path].locations = files[path];
            }
        }
    } catch (err) {
        console.warn(`RPGNautas File Manager | Failed to read local index:`, err);
    }

    return results;
  }
}
