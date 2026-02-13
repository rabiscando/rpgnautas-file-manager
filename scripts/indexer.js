import { fetchBlob, convertToWebP } from './utils.js';

/**
 * WorldIndexer (Standalone)
 * Scans world data and saves a local index file accessible via HTTP.
 * Cumulative: Preserves data from other worlds on the same instance.
 */
export class WorldIndexer {
  static INDEX_PATH = "modules/rpgnautas-file-manager/data/rpgnautas-index.json";

  static async indexWorld() {
    if (!game.user.isGM) return;

    console.log('RPGNautas File Manager | Starting World Indexing...');
    const fileUsages = [];

    const addUsage = (path, context) => {
      if (!path || typeof path !== 'string' || path.trim() === '' || path.startsWith('http')) return;
      // Filter for potential image/video files
      const p = path.toLowerCase();
      if (!p.match(/\.(png|jpg|jpeg|webp|webm|gif|svg|bmp|tiff)$/)) return;
      fileUsages.push({ path, context });
    };

    // 1. Actors & Items (World)
    for (const actor of game.actors) {
      this.scanDocumentData(actor, `Actor.${actor.name}`, addUsage, "Actor");
    }
    for (const item of game.items) {
      this.scanDocumentData(item, `Item.${item.name}`, addUsage, "Item");
    }

    // 2. Scenes (World)
    for (const scene of game.scenes) {
      this.scanDocumentData(scene, `Scene.${scene.name}`, addUsage, "Scene");
    }

    // 3. Compendiums
    for (const pack of game.packs) {
      if (["Actor", "Item", "Scene", "JournalEntry"].includes(pack.documentName)) {
        if (pack.locked) {
          console.log(`RPGNautas | Skipping locked pack ${pack.collection}`);
          continue;
        }
        try {
            const docs = await pack.getDocuments({ transform: false });
            for (const docData of docs) {
                this.scanDocumentData(docData, `Compendium.${pack.metadata.label}.${docData.name}`, addUsage, pack.documentName);
            }
        } catch (err) {
            console.warn(`RPGNautas | Failed to scan compendium ${pack.metadata.label}`, err);
        }
      }
    }

    // 4. Journals (World)
    for (const journal of game.journal) {
        this.scanDocumentData(journal, `Journal.${journal.name}`, addUsage, "JournalEntry");
    }

    // Aggregate Current World Usage
    const currentWorldFiles = {};
    for (const { path, context } of fileUsages) {
        if (!currentWorldFiles[path]) currentWorldFiles[path] = new Set();
        currentWorldFiles[path].add(context);
    }
    
    const worldFilesClean = {};
    for (const [path, contexts] of Object.entries(currentWorldFiles)) {
        worldFilesClean[path] = Array.from(contexts);
    }

    // SINGLE WORLD INDEX
    const indexData = {
        worldId: game.world.id,
        files: worldFilesClean,
        lastUpdate: Date.now(),
        version: 3
    };

    // Save to local file
    try {
        const json = JSON.stringify(indexData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const file = new File([blob], "rpgnautas-index.json", { type: "application/json" });
        const filePicker = foundry.applications?.apps?.FilePicker?.implementation || FilePicker;
        
        // Ensure directory exists
        try {
            await filePicker.browse("data", "modules/rpgnautas-file-manager/data");
        } catch (e) {
            await filePicker.createDirectory("data", "modules/rpgnautas-file-manager/data");
        }

        await filePicker.upload("data", "modules/rpgnautas-file-manager/data", file, { notify: false });
        console.log(`RPGNautas File Manager | World Index Saved: ${game.world.id}`);
        return indexData;
    } catch (err) {
        console.error("RPGNautas File Manager | Failed to save index:", err);
    }
  }

  /**
   * Scans for broken links that have a WebP counterpart and repairs them.
   */
  static async repairBrokenLinks(onProgress) {
    if (!game.user.isGM) return;
    
    // 1. Ensure index is fresh
    const index = await this.indexWorld();
    if (!index || !index.files) return;

    const toCheck = Object.keys(index.files).filter(path => {
        const p = path.toLowerCase();
        return !p.endsWith('.webp') && !p.endsWith('.svg') && !p.endsWith('.webm');
    });

    if (toCheck.length === 0) {
        ui.notifications.info("RPGNautas: No applicable links to check.");
        return 0;
    }

    console.log(`RPGNautas | Starting link repair for ${toCheck.length} files...`);
    let repairedCount = 0;
    let processed = 0;

    for (const oldPath of toCheck) {
        try {
            // A. Check if file exists (HEAD request)
            const response = await fetch(oldPath, { method: 'HEAD' });
            
            if (!response.ok) {
                // B. Try common shifts (e.g., deadlands/ -> assets/deadlands/)
                let shiftedPath = null;
                if (oldPath.startsWith("deadlands/")) {
                    shiftedPath = oldPath.replace("deadlands/", "assets/deadlands/");
                } else if (!oldPath.startsWith("assets/") && !oldPath.startsWith("modules/") && !oldPath.startsWith("systems/")) {
                    // Try adding assets/ prefix if it's a root-relative path not in core folders
                    shiftedPath = "assets/" + oldPath;
                }

                if (shiftedPath) {
                    const shiftedResponse = await fetch(shiftedPath, { method: 'HEAD' });
                    if (shiftedResponse.ok) {
                        console.log(`RPGNautas | Repairing path shift: ${oldPath} -> ${shiftedPath}`);
                        await this.updateRefsInWorld(oldPath, shiftedPath);
                        repairedCount++;
                        continue; // Successfully shifted
                    }
                }

                // C. Check for WebP version (original and shifted)
                const candidateWebps = [oldPath.replace(/\.[^/.]+$/, ".webp")];
                if (shiftedPath) candidateWebps.push(shiftedPath.replace(/\.[^/.]+$/, ".webp"));
                
                let webpFound = false;
                for (const wp of candidateWebps) {
                    if (wp === oldPath) continue;
                    const webpResponse = await fetch(wp, { method: 'HEAD' });
                    if (webpResponse.ok) {
                        console.log(`RPGNautas | Repairing broken link: ${oldPath} -> ${wp}`);
                        await this.updateRefsInWorld(oldPath, wp);
                        repairedCount++;
                        webpFound = true;
                        break;
                    }
                }

                if (!webpFound && !shiftedPath) {
                    console.warn(`RPGNautas | File ${oldPath} is missing (404) and no safe fallback found. Skipping.`);
                }
            }
        } catch (err) {
            // Probably a network error or CORS issue
            console.error(`RPGNautas | Error checking ${oldPath}:`, err);
        }
        processed++;
        if (onProgress) onProgress(Math.round((processed / toCheck.length) * 100));
    }

    await this.indexWorld(); // Final rescan
    return repairedCount;
  }

  /**
   * Run mass conversion of all indexed files for CURRENT WORLD
   * @param {Function} onProgress - Callback(percent, eta)
   */
  static async runMassConversion(onProgress) {
    if (!game.user.isGM) return;

    // 1. Ensure index is fresh
    const index = await this.indexWorld();
    if (!index || !index.files) return;

    const worldFiles = index.files;
    const toConvert = Object.keys(worldFiles).filter(path => {
        const p = path.toLowerCase();
        return (p.endsWith('.png') || p.endsWith('.jpg') || p.endsWith('.jpeg')) && !p.endsWith('.svg') && !p.endsWith('.webp');
    });

    if (toConvert.length === 0) {
        ui.notifications.info("RPGNautas: No images to convert.");
        return;
    }

    console.log(`RPGNautas | Starting mass conversion of ${toConvert.length} files...`);
    
    let processed = 0;
    const startTime = Date.now();

    for (const oldPath of toConvert) {
        try {
            // A. Download & Convert
            const originalBlob = await fetchBlob(oldPath);
            const fileName = oldPath.split('/').pop();
            const webpFile = await convertToWebP(originalBlob, fileName);

            // B. Upload
            const folder = oldPath.substring(0, oldPath.lastIndexOf('/'));
            await FilePicker.upload("data", folder, webpFile, { notify: false });
            const newPath = folder + "/" + webpFile.name;

            // C. Update all documents in world
            await this.updateRefsInWorld(oldPath, newPath);

            // D. Delete original (Space Saving)
            if (newPath !== oldPath) {
                try {
                    const filePicker = foundry.applications?.apps?.FilePicker?.implementation || FilePicker;
                    const deletionMethod = filePicker.delete || filePicker.deleteFile;
                    if (typeof deletionMethod === "function") {
                        await deletionMethod.call(filePicker, "data", oldPath);
                        console.log(`RPGNAUTAS | Deleted original file: ${oldPath}`);
                    } else {
                        console.warn(`RPGNAUTAS | Deletion API not found. Skipping deletion of ${oldPath}. Manual cleanup required.`);
                    }
                } catch (delErr) {
                    console.warn(`RPGNAUTAS | Could not delete ${oldPath}: ${delErr.message}`);
                }
            }

            processed++;
            
            // D. Progress Calculation
            const percent = Math.round((processed / toConvert.length) * 100);
            const elapsed = Date.now() - startTime;
            const avgTimePerFile = elapsed / processed;
            const remaining = toConvert.length - processed;
            const etaMs = remaining * avgTimePerFile;
            
            const etaStr = this.formatTime(etaMs);
            if (onProgress) onProgress(percent, etaStr, processed, toConvert.length);

        } catch (err) {
            if (err.message && err.message.includes("404")) {
                console.warn(`RPGNautas | Skipping conversion for ${oldPath}: File not found on server.`);
            } else {
                console.error(`RPGNautas | Failed to convert ${oldPath}:`, err);
            }
        }
    }

    // Final rescan to ensure index is correct
    await this.indexWorld();
    ui.notifications.success(game.i18n.localize("RPGNautas.FileManager.Notify.ConversionComplete"));
  }

  /**
   * Identifies and reports on PNG/JPG files that have a .webp counterpart
   * This generates a comprehensive report for manual cleanup since Foundry VTT
   * does not provide a deletion API for security reasons.
   * @param {Function} onProgress 
   */
  static async cleanupOrphanedFiles(onProgress) {
    if (!game.user.isGM) return;

    // 1. Fresh Index (Current World usage)
    const index = await this.indexWorld();
    if (!index || !index.files) return;

    const referencedFiles = Object.keys(index.files);
    
    // 2. Scan Server FileSystem (Physical Files)
    // We scan assets/ and deadlands/ since these are the primary folders
    const rootFolders = ["assets", "deadlands"];
    const physicalFiles = [];
    
    ui.notifications.info("RPGNautas: Scanning server for orphaned files...");
    
    for (const folder of rootFolders) {
        try {
            const folderFiles = await this.browseFileSystemRecursive("data", folder);
            physicalFiles.push(...folderFiles);
        } catch (err) {
            console.warn(`RPGNAUTAS | Could not browse folder ${folder}: ${err.message}`);
        }
    }

    const orphanedFiles = [];
    
    // 3. Identify Orphans (Physical files not in index that have a webp sibling)
    for (const path of physicalFiles) {
        const p = path.toLowerCase();
        // Target: Only original image formats
        if ((p.endsWith('.png') || p.endsWith('.jpg') || p.endsWith('.jpeg')) && !p.endsWith('.webp')) {
            const base = path.substring(0, path.lastIndexOf('.'));
            const webpPath = base + ".webp";
            
            // Criteria for orphan status:
            // 1. The .png is NOT referenced in the world index
            // 2. The .webp counterpart EXISTS physically on the server
            const isReferenced = referencedFiles.includes(path);
            const hasWebpCounterpart = physicalFiles.includes(webpPath);
            
            if (!isReferenced && hasWebpCounterpart) {
                orphanedFiles.push({
                    path: path,
                    webpCounterpart: webpPath,
                    extension: path.substring(path.lastIndexOf('.'))
                });
            }
        }
        
        if (onProgress && orphanedFiles.length % 10 === 0) {
            onProgress(Math.round((physicalFiles.indexOf(path) / physicalFiles.length) * 100));
        }
    }

    if (orphanedFiles.length === 0) {
        ui.notifications.info("RPGNautas: No orphaned images found on server.");
        console.log("✅ RPGNAUTAS | Server is clean! No orphaned files detected.");
        return { orphanedFiles: [], totalFiles: 0, report: null };
    }

    // 4. Generate Comprehensive Report
    const report = {
        timestamp: new Date().toISOString(),
        worldName: game.world.title,
        totalOrphans: orphanedFiles.length,
        orphanedFiles: orphanedFiles,
        instructions: {
            manual: "To delete these files manually, navigate to your Foundry VTT Data folder and remove them using your file manager.",
            dataPath: "Foundry VTT Data folder location varies by OS. Check Foundry's Configuration tab for the exact path.",
            warning: "⚠️ Always backup your data before deleting files!"
        }
    };

    // 5. Display Report in Console
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🧹 RPGNAUTAS FILE MANAGER - ORPHANED FILES REPORT");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`📅 Generated: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`🌍 World: ${game.world.title}`);
    console.log(`📊 Total Orphaned Files: ${orphanedFiles.length}`);
    console.log("───────────────────────────────────────────────────────────");
    console.log("\n📋 ORPHANED FILES LIST:\n");
    
    orphanedFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.path}`);
        console.log(`   ↳ WebP exists: ${file.webpCounterpart}`);
    });
    
    console.log("\n───────────────────────────────────────────────────────────");
    console.log("📖 CLEANUP INSTRUCTIONS:");
    console.log("───────────────────────────────────────────────────────────");
    console.log("⚠️  Foundry VTT does not provide an API to delete files for security reasons.");
    console.log("📂 To clean up these files, you need to delete them manually:");
    console.log("");
    console.log("1. Navigate to your Foundry VTT Data folder");
    console.log("   (Check Configuration > Data Path in Foundry settings)");
    console.log("");
    console.log("2. Locate each file listed above");
    console.log("");
    console.log("3. Delete the original PNG/JPG files");
    console.log("   (The .webp versions will remain and are being used)");
    console.log("");
    console.log("💾 BACKUP REMINDER: Always backup your data before deleting files!");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\n📥 Full report available in variable: window.rpgnautasOrphanReport");
    
    // 6. Store report globally for easy access
    window.rpgnautasOrphanReport = report;
    
    // 7. Show user-friendly notification
    const message = `Found ${orphanedFiles.length} orphaned files. Check console (F12) for detailed report and cleanup instructions.`;
    ui.notifications.warn(message, { permanent: true });
    
    return report;
  }

  /**
   * Recursively browse the filesystem to list all files.
   */
  static async browseFileSystemRecursive(source, target) {
    const filePicker = foundry.applications?.apps?.FilePicker?.implementation || FilePicker;
    const results = [];
    
    const scan = async (path) => {
        try {
            const content = await filePicker.browse(source, path);
            results.push(...content.files);
            for (const dir of content.dirs) {
                await scan(dir);
            }
        } catch (err) {
            console.warn(`RPGNAUTAS | Error scanning ${path}:`, err);
        }
    };
    
    await scan(target);
    return results;
  }

  static formatTime(ms) {
    if (ms < 1000) return "---";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
  }

  /**
   * Search and replace image path in ALL world documents using deep cleaning
   */
  static async updateRefsInWorld(oldPath, newPath) {
    const escapedOld = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`"${escapedOld}"`, 'g'); // Exact match in JSON
    const htmlRegex = new RegExp(escapedOld, 'g');    // Anywhere in strings (HTML)
    const newPathJson = `"${newPath}"`;

    // 1. Actors
    for (const a of game.actors) {
        let str = JSON.stringify(a.toObject());
        if (str.includes(oldPath)) {
            const updatedData = JSON.parse(str.replace(regex, newPathJson).replace(htmlRegex, newPath));
            await a.update(updatedData, { recursive: true });
        }
    }

    // 2. Items
    for (const i of game.items) {
        let str = JSON.stringify(i.toObject());
        if (str.includes(oldPath)) {
            const updatedData = JSON.parse(str.replace(regex, newPathJson).replace(htmlRegex, newPath));
            await i.update(updatedData, { recursive: true });
        }
    }

    // 3. Scenes
    for (const s of game.scenes) {
        let str = JSON.stringify(s.toObject());
        if (str.includes(oldPath)) {
            const updatedData = JSON.parse(str.replace(regex, newPathJson).replace(htmlRegex, newPath));
            await s.update(updatedData, { recursive: true });
        }
    }

    // 4. Journal 
    for (const j of game.journal) {
        let str = JSON.stringify(j.toObject());
        if (str.includes(oldPath)) {
            const updatedData = JSON.parse(str.replace(regex, newPathJson).replace(htmlRegex, newPath));
            await j.update(updatedData, { recursive: true });
        }
    }

    // 5. Cards
    for (const c of game.cards) {
        let str = JSON.stringify(c.toObject());
        if (str.includes(oldPath)) {
            const updatedData = JSON.parse(str.replace(regex, newPathJson).replace(htmlRegex, newPath));
            await c.update(updatedData, { recursive: true });
        }
    }

    // 6. RollTables
    for (const r of game.tables) {
        let str = JSON.stringify(r.toObject());
        if (str.includes(oldPath)) {
            const updatedData = JSON.parse(str.replace(regex, newPathJson).replace(htmlRegex, newPath));
            await r.update(updatedData, { recursive: true });
        }
    }
  }

  /**
   * Universal scanner for raw data or initialized documents
   */
  static scanDocumentData(doc, context, addUsage, type) {
    if (!doc) return;

    // Standard properties
    if (doc.img) addUsage(doc.img, context);

    // Actor / Item specific
    if (type === "Actor" || type === "Item") {
        if (doc.prototypeToken?.texture?.src) addUsage(doc.prototypeToken.texture.src, `${context} (Token)`);
        
        // Deep scan system data (Deadlands assets and other custom fields)
        if (doc.system) this.scanDeep(doc.system, context, addUsage);
        
        // Handle Embedded Items
        if (doc.items && Array.isArray(doc.items)) {
            for (const item of doc.items) {
                this.scanDocumentData(item, `${context}.Item.${item.name}`, addUsage, "Item");
            }
        }
    } 
    // Scene
    else if (type === "Scene") {
        addUsage(doc.background?.src || doc.img, `${context} (Background)`);
        if (doc.tiles) {
            for (const t of doc.tiles) addUsage(t.texture?.src || t.img, `${context}.Tile`);
        }
        if (doc.tokens) {
            for (const t of doc.tokens) addUsage(t.texture?.src || t.img, `${context}.Token.${t.name}`);
        }
        if (doc.foreground) addUsage(doc.foreground, `${context} (Foreground)`);
        
        // Scan other potentially nested scene data
        this.scanDeep(doc.flags || {}, context, addUsage);
    }
    // Journal
    else if (type === "JournalEntry") {
        const pages = doc.pages || [];
        for (const p of pages) {
            if (p.type === 'image') addUsage(p.src, `${context}.${p.name}`);
            else if (p.type === 'text') this.scanHtml(p.text?.content, `${context}.${p.name}`, addUsage);
            else if (p.type === 'video') addUsage(p.src, `${context}.${p.name} (Video)`);
        }
    }
  }

  /**
   * Recursive scanner to find any image-like strings in nested data structures.
   */
  static scanDeep(obj, context, addUsage, depth = 0) {
    if (depth > 10 || !obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'string') {
            const p = val.toLowerCase();
            // Check for image extensions
            if (p.match(/\.(png|jpg|jpeg|webp|webm|gif|svg|bmp|tiff)$/)) {
                addUsage(val, `${context}.${key}`);
            } else if (val.includes('<img') || val.includes('src=')) {
                this.scanHtml(val, `${context}.${key}`, addUsage);
            }
        } else if (val && typeof val === 'object') {
            this.scanDeep(val, context, addUsage, depth + 1);
        }
    }
  }

  static scanHtml(content, context, addUsage) {
    if (!content || typeof content !== 'string') return;
    const imgRegex = /src="([^"]+)"/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      addUsage(match[1], `${context} (HTML)`);
    }
  }
}
