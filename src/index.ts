import joplin from "api";
import {MenuItemLocation, ToolbarButtonLocation, SettingItemType} from "api/types";
import { makeRequest } from "./getContent";
import { create_notebook_list, get_all_notes, set_sync_dialog_html } from "./util"
import { DEBUG, debug_url, default_sync_intervall, http_options } from "./const";


// This event will be triggered when the user selects a different note
// await joplin.workspace.onNoteSelectionChange(() => {
//     updateTocView();
// });

// // This event will be triggered when the content of the note changes
// // as you also want to update the TOC in this case.
// await joplin.workspace.onNoteChange(() => {
//     updateTocView();
// });

joplin.plugins.register({
    onStart: async function () {

        let notesbooks_map = await create_notebook_list()
        console.info("Starting plugin");
        console.debug("Fund these notebooks:", notesbooks_map);


        const update_note = async (note = null, synced_notes = null) => {
            if(!note) note = await joplin.workspace.selectedNote();
            if(!synced_notes) synced_notes = await joplin.settings.value("joplin_md_pull_sync_notes")

            // Keep in mind that it can be `null` if nothing is currently selected!
            if (note) {
                if(note.id in synced_notes){
                    console.info(`NoteUpdate: Update note ${note.id} with url: ${synced_notes[note.id].url}`);
                    // ToDo: Handle http error
                    let res = (await makeRequest(synced_notes[note.id].url as any, http_options)).toString();
                    // ToDo: Handle Error when note is gone
                    await joplin.data.put(["notes", note.id], null, { body: res })
                }else{
                    console.info('NoteUpdate: Is NOT Synced');
                    alert('This is not a RemoteSyned note!')
                }
            } else {
                console.warn('NoteUpdate: No note is selected');
                alert('Please select a note first')
            }

        }

        let update_notes = async () => {
            const all_notes = await get_all_notes()
            const sync_notes = await joplin.settings.value("joplin_md_pull_sync_notes")
            console.log("All notes ", all_notes)
            console.log("Sync notes ", sync_notes)

            let new_sync_notes_settings = {}
            for (const [key, value] of Object.entries(sync_notes)) {
                if (all_notes.has(key)) {
                    await update_note({id: key}, sync_notes)
                    new_sync_notes_settings = { ...new_sync_notes_settings, [key]: value }
                } else {
                    console.info(`Removing note ${key} form sync_notes_settings`)
                }
            }

            await joplin.settings.setValue('joplin_md_pull_sync_notes', new_sync_notes_settings)
            console.info('updated_sync_note_settings', new_sync_notes_settings);
            console.info("Notes Updated");
        };

        await joplin.commands.register({
            name: "pull_note_now",
            label: "Sync this note now",
            iconName: 'fas fa-arrow-down',
            execute: update_note
        })

        await joplin.commands.register({
            name: "create_pull_note",
            label: "Create new SyncNote",
            iconName: 'fas fa-music',
            execute: async () => {
                const dialog_res = await dialogs.open(new_note_sync_dialog);
                if (dialog_res.id === "ok") {
                    let form_data = dialog_res.formData.sync_note_form
                    console.info(form_data)
                    // ToDo: Handle http error
                    let url = (DEBUG) ? debug_url : form_data.url
                    let res = (await makeRequest(url, http_options)).toString();

                    // Generate title
                    let title = res.split("\n")[0]
                    for (let entry of res.split("\n")) {
                        if (entry.startsWith("#")) {
                            title = entry.replace(/#/g, '')
                            break
                        }
                    }

                    // Create note
                    let post_res = await joplin.data.post(
                        ["notes"],
                        null,
                        { body: res, title: title, parent_id: form_data.notebook || await joplin.settings.value("joplin_md_pull_default_notebook") }
                        );

                        // Add note to joplin_md_pull_sync_notes setting
                        await joplin.settings.setValue(
                            "joplin_md_pull_sync_notes",
                            Object.assign(await joplin.settings.value("joplin_md_pull_sync_notes"), {[post_res.id]: { url: url }})
                            );
                            console.debug(post_res);
                        }
                    },
                });

                // Add the command to the note toolbar
                await joplin.views.toolbarButtons.create(
                    "sync_note_manual",
                    "pull_note_now",
                    ToolbarButtonLocation.NoteToolbar
        );
        // Also add the commands to the menu
        await joplin.views.menuItems.create(
            "new_note_sync_dialog_item_entry",
            "create_pull_note",
            MenuItemLocation.Tools,
            { accelerator: "CmdOrCtrl+Alt+Shift+B" }
            );

            // Settings option
            await joplin.settings.registerSection("joplin_md_pull_setting", {
                label: "RemoteMarkdownSync",
                iconName: 'fas fa-wrench',
            });

            await joplin.settings.registerSettings({
                joplin_md_pull_sync_enabeld: {
                    value: true,
                    type: SettingItemType.Bool,
                    section: "joplin_md_pull_setting",
                    public: true,
                    label: "Enable periodic sync",
                },
            joplin_md_pull_sync_intervall: {
                value: default_sync_intervall,
                type: SettingItemType.Int,
                minimum: 300,
                section: "joplin_md_pull_setting",
                public: true,
                label: "Sync intervall",
            },
            joplin_md_pull_default_notebook: {
                value: Object.keys(notesbooks_map)[0],
                type: SettingItemType.String,
                section: "joplin_md_pull_setting",
                isEnum: true,
                public: true,
                label: "Select default notebook",
                options: notesbooks_map,
            },
            joplin_md_pull_sync_notes: {
                value: {},
                type: SettingItemType.Object,
                section: "joplin_md_pull_setting",
                public: false,
                label: "Select default notebook",
            },
        });

        joplin.settings.onChange(async (event) => {
            notesbooks_map = await create_notebook_list()
            console.debug("Settings changed:", event);
            for (const item of event.keys) {
                switch (item) {
                    case "joplin_md_pull_sync_intervall":
                        if (await joplin.settings.value("joplin_md_pull_sync_enabeld")) {
                            console.debug("Setting new intervall");
                            clearInterval(joplin_md_pull_sync_intervall);
                            interval =
                                Number(await joplin.settings.value("joplin_md_pull_sync_intervall")) ||
                                default_sync_intervall;
                            joplin_md_pull_sync_intervall = setInterval(update_notes, interval);
                        }
                        break;
                    case "joplin_md_pull_sync_enabeld":
                        console.debug("Toggle Sync to: " + await joplin.settings.value("joplin_md_pull_sync_enabeld"));
                        clearInterval(joplin_md_pull_sync_intervall);
                        if (await joplin.settings.value("joplin_md_pull_sync_enabeld")) {
                            interval =
                                Number(await joplin.settings.value("joplin_md_pull_sync_intervall")) ||
                                default_sync_intervall;
                            joplin_md_pull_sync_intervall = setInterval(update_notes, interval);
                        }
                        break;
                    case "joplin_md_pull_default_notebook":
                        console.debug("Setting: " + await joplin.settings.value("joplin_md_pull_default_notebook") + " as the default notebook");
                        await set_sync_dialog_html(new_note_sync_dialog)
                        break;
                    default:
                    // code block
                }
            }
        });

        // Dialogs
        const dialogs = joplin.views.dialogs;
        const new_note_sync_dialog = await dialogs.create("new_note_sync_dialog");
        await set_sync_dialog_html(new_note_sync_dialog)

        let interval = Number(await joplin.settings.value("joplin_md_pull_sync_intervall")) || default_sync_intervall;
        let joplin_md_pull_sync_intervall: NodeJS.Timer ;
        if (await joplin.settings.value("joplin_md_pull_sync_enabeld")) {
            joplin_md_pull_sync_intervall = setInterval(update_notes, interval);
        }

        console.info("Plugin loaded");
    },
});
