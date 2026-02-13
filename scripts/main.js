import { FileManagerAPI } from './api.js';
import { WorldIndexer } from './indexer.js';
import { convertToWebP } from './utils.js';

const MODULE_ID = 'rpgnautas-file-manager';

Hooks.once('init', () => {
    console.log('RPGNautas File Manager | Initializing Standalone v2.0.6...');
    console.log(`RPGNautas File Manager | Language detected: ${game.i18n.lang}`);

    // Simplified: No more multi-instance settings

    // Menu
    game.settings.registerMenu(MODULE_ID, 'indexManagement', {
        name: 'RPGNautas.FileManager.Config.Title',
        label: 'RPGNautas.FileManager.Config.Title',
        hint: 'RPGNautas.FileManager.Config.IndexHint',
        icon: 'fas fa-search',
        type: IndexManagementConfig,
        restricted: true
    });

    // Register Hooks
    const isV13 = (game.version || game.data.version).startsWith('13');
    
    if (typeof libWrapper === 'function') {
        registerWrappers(isV13);
    } else {
        console.warn('RPGNautas File Manager | libWrapper not found!');
    }

    // EXPOSE API
    game.modules.get(MODULE_ID).api = {
        WorldIndexer,
        FileManagerAPI
    };
});

Hooks.once('ready', async () => {
    if (!game.user.isGM) return;
    // Auto rescanning on startup (slightly delayed)
    setTimeout(() => WorldIndexer.indexWorld(), 10000);
});

function registerWrappers(isV13) {
    // UPLOAD: Convert/Validate
    const filePicker = foundry.applications?.apps?.FilePicker?.implementation || FilePicker;
    libWrapper.register(MODULE_ID, 'FilePicker.upload', async function (wrapper, source, path, file, arg5, arg6) {
        const body = isV13 ? arg5 : {};
        const options = isV13 ? arg6 : arg5;

        // VIDEO: Restrictions removed per user request.
        
        // IMAGE: Convert to WebP if appropriate
        if (file.type?.startsWith('image/') && 
            file.type !== 'image/webp' && 
            file.type !== 'image/svg+xml' && 
            !file.name.endsWith('.webp') && 
            !file.name.endsWith('.svg')) {
            try {
                ui.notifications.info(game.i18n.localize("RPGNautas.FileManager.Notify.Converting"));
                file = await convertToWebP(file, file.name);
            } catch (err) {
                console.error("RPGNautas | Conversion error:", err);
            }
        }
        
        return isV13 ? wrapper(source, path, file, body, options) : wrapper(source, path, file, options);
    }, 'WRAPPER');

    // DELETE: Protection
    const canWrapDelete = typeof filePicker.prototype._onDelete === 'function';
    if (canWrapDelete) {
        libWrapper.register(MODULE_ID, 'FilePicker.prototype._onDelete', async function (wrapper, event) {
            event.preventDefault();
            const file = event.currentTarget.dataset.path;
            if (!file) return wrapper(event);

            ui.notifications.info(game.i18n.localize("RPGNautas.FileManager.Notify.CheckingUsage"));
            const checkResult = await FileManagerAPI.checkFiles([file]);
            const fileData = checkResult[file];

            if (fileData && fileData.used) {
                let content = `<p><strong>${game.i18n.localize("RPGNautas.FileManager.Dialog.SafetyBlockTitle")}!</strong> ${game.i18n.localize("RPGNautas.FileManager.Dialog.SafetyBlockMsg")}</p><ul>`;
                for (const usage of fileData.locations) {
                    content += `<li>${usage}</li>`;
                }
                content += `</ul>`;
                new Dialog({ 
                    title: game.i18n.localize("RPGNautas.FileManager.Dialog.SafetyBlockTitle"), 
                    content, 
                    buttons: { ok: { label: "OK" } } 
                }).render(true);
                return false;
            }

            return wrapper(event);
        }, 'MIXED');
    }
}

/**
 * UI for manual indexing and mass conversion
 */
class IndexManagementConfig extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "rpgnautas-index-mgmt",
            title: game.i18n.localize("RPGNautas.FileManager.Config.Title"),
            template: "modules/rpgnautas-file-manager/templates/index-config.html",
            width: 450
        });
    }
    getData() {
        return {};
    }
    activateListeners(html) {
        super.activateListeners(html);
        
        // Scan Button
        html.find('button[name="scan"]').click(async (ev) => {
            ev.preventDefault();
            ui.notifications.info(game.i18n.localize("RPGNautas.FileManager.Notify.Scanning"));
            await WorldIndexer.indexWorld();
            ui.notifications.success(game.i18n.localize("RPGNautas.FileManager.Notify.IndexUpdated"));
        });

        // Repair Links Button
        html.find('button[name="repairLinks"]').click(async (ev) => {
            ev.preventDefault();
            new Dialog({
                title: game.i18n.localize("RPGNautas.FileManager.Dialog.ConfirmRepairTitle"),
                content: `<p>${game.i18n.localize("RPGNautas.FileManager.Dialog.ConfirmRepairMsg")}</p>`,
                buttons: {
                    yes: {
                        label: "Reparar",
                        callback: async () => {
                            ui.notifications.info(game.i18n.localize("RPGNautas.FileManager.Notify.Repairing"));
                            const count = await WorldIndexer.repairBrokenLinks();
                            ui.notifications.success(game.i18n.format("RPGNautas.FileManager.Notify.RepairComplete", { count }));
                        }
                    },
                    no: { label: "Cancelar" }
                }
            }).render(true);
        });

        // Mass Convert Button
        html.find('button[name="massConvert"]').click(async (ev) => {
            ev.preventDefault();
            
            new Dialog({
                title: game.i18n.localize("RPGNautas.FileManager.Dialog.ConfirmMassConvertTitle"),
                content: `<p>${game.i18n.localize("RPGNautas.FileManager.Dialog.ConfirmMassConvertMsg")}</p>`,
                buttons: {
                    yes: {
                        label: "Convereter",
                        callback: async () => {
                            const progressDiv = html.find('#mass-convert-progress');
                            const statusText = progressDiv.find('.conversion-status');
                            const etaText = progressDiv.find('.conversion-eta');
                            const bar = progressDiv.find('.bar');
                            
                            progressDiv.show();
                            ev.currentTarget.disabled = true;

                            await WorldIndexer.runMassConversion((percent, eta, processed, total) => {
                                statusText.text(game.i18n.format("RPGNautas.FileManager.Progress.Converting", { current: processed, total, percent }));
                                etaText.text(game.i18n.format("RPGNautas.FileManager.Progress.EstimatedTime", { time: eta }));
                                bar.css('width', `${percent}%`);
                            });
                            
                            ev.currentTarget.disabled = false;
                        }
                    },
                    no: { label: "Cancelar" }
                }
            }).render(true);
        });


    }
    async _updateObject(event, formData) {
        // No settings to save anymore
    }
}
