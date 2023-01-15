import joplin from "api";
import {MenuItemLocation, ToolbarButtonLocation, SettingItemType} from "api/types";
import { makeRequest } from "./getContent";

const default_sync_intervall = 5000;
const notes_query_limit = 25
const DEBUG = true;
let http_options = { method: "GET" };
let url = "https://raw.githubusercontent.com/hegerdes/BeeblebroxCTF/master/README.md";

joplin.plugins.register({
    onStart: async function () {

        // Get all Notebooks with id and name
        let create_notebook_list = async () => {
            let folders = await joplin.data.get(["folders"]);
            return folders.items.reduce((obj, item) => Object.assign(obj, { [item.id]: item.title }), {});
        }

        // Create HTML options of notebooks
        let create_notebook_form_option = async () => {
            let default_notebook = await joplin.data.get(["folders", await joplin.settings.value("multiOptionTest")])
            let from_options = `<option value="${default_notebook.id}">${default_notebook.title}</option>` + '\n'
            for (const [key, value] of Object.entries(await create_notebook_list())) {
                if (default_notebook.id === key) continue
                from_options += `<option value="${key}">${value}</option>` + '\n'
            }
            return from_options
        }

        // Get all notes
        let get_all_notes = async () => {
            let notes = new Map<string, Object>()
            let pageNum = 1;
            let data = await joplin.data.get(['notes'], `limit=${notes_query_limit}&page=${pageNum}`)
            data.items.forEach(entry => notes.set(entry.id, entry))
            while (data.has_more) {
                pageNum++
                console.log(`limit=${notes_query_limit}&page=${pageNum}`)
                data = await joplin.data.get(['notes'])
                data.items.forEach(entry => notes.set(entry.id, entry))
            }
            return notes
        }

        // Set dialog HTML
        const set_sync_dialog_html = async (dialog: string) => {
            await dialogs.setHtml(
                dialog,
                `
                <p>Testing dialog with form elements</p>
                <form name="sync_note_form">
                URL: <input type="text" name="url"/>
                <br/>
                <label for="notebook">Choose Notebook:</label>
                <select id="notebook" name="notebook">
                ${await create_notebook_form_option()}
                </select>
                </form>
                `
                );
        }

        let notesbooks_map = await create_notebook_list()
        console.info("Starting plugin");
        console.debug("Fund these notebooks:", notesbooks_map);

        await joplin.commands.register({
            name: "create_pull_note",
            label: "Create new Note Sync",
            iconName: "fas fa-music",
            execute: async () => {
                const dialog_res = await dialogs.open(new_note_sync_dialog);
                if (dialog_res.id === "ok") {
                    let form_data = dialog_res.formData.sync_note_form
                    console.info(form_data)
                    // ToDo: Handle http error
                    let res = (await makeRequest(url, http_options)).toString();
                    let title = res.split("\n")[0]
                    for (const entry of res.split('/n')) {
                        if (entry.startsWith("#")) {
                            title = entry.split('#').join('')
                            break
                        }
                    }
                    var post_res = await joplin.data.post(
                        ["notes"],
                        null,
                        { body: res, title: title, parent_id: form_data.notebook || await joplin.settings.value("multiOptionTest") }
                    );
                    await joplin.settings.setValue(
                        "sync_notes_urls",
                        Object.assign(await joplin.settings.value("sync_notes_urls"), {[post_res.id]: { url: url }})
                    );
                    console.debug(post_res);
                }
            },
        });

        let update_notes = async () => {
            let all_notes = await get_all_notes()
            console.log("All notes ", all_notes)
            console.log("Sync notes ", await joplin.settings.value("sync_notes_urls"))

            let new_sync_notes_settings = {}
            for (const [key, value] of Object.entries(await joplin.settings.value("sync_notes_urls"))) {
                const sync_meta_data: hegerdes_sync_node_setting = value as any
                if (all_notes.has(key)) {
                    new_sync_notes_settings = { ...new_sync_notes_settings, [key]: value }
                    console.info(`Update note ${key}:`, value);
                    // ToDo: Handle http error
                    let res = (await makeRequest(sync_meta_data.url as any, http_options)).toString();
                    // ToDo: Handle Error when note is gone
                    await joplin.data.put(["notes", key], null, { body: res })
                } else {
                    console.info(`Removing note ${key} form sync_notes_settings`)
                }
            }

            await joplin.settings.setValue('sync_notes_urls', new_sync_notes_settings)
            console.info('updated_sync_note_settings', new_sync_notes_settings);
            console.info("Notes Updated");
        };

        // Add the first command to the note toolbar
        await joplin.views.toolbarButtons.create(
            "sync_note_manual",
            "create_pull_note",
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
        await joplin.settings.registerSection("myCustomSection", {
            label: "My Custom Section",
            iconName: "fas fa-music",
        });

        await joplin.settings.registerSettings({
            sync_enabeld: {
                value: true,
                type: SettingItemType.Bool,
                section: "myCustomSection",
                public: true,
                label: "Enable periodic sync",
            },
            sync_intervall: {
                value: default_sync_intervall,
                type: SettingItemType.Int,
                minimum: 300,
                section: "myCustomSection",
                public: true,
                label: "Sync intervall",
            },
            multiOptionTest: {
                value: Object.keys(notesbooks_map)[0],
                type: SettingItemType.String,
                section: "myCustomSection",
                isEnum: true,
                public: true,
                label: "Select default notebook",
                options: notesbooks_map,
            },
            sync_notes_urls: {
                value: {},
                type: SettingItemType.Object,
                section: "myCustomSection",
                public: false,
                label: "Select default notebook",
            },
        });

        joplin.settings.onChange(async (event) => {
            console.debug("Setting change", event);
            for (const item of event.keys) {
                switch (item) {
                    case "sync_intervall":
                        if (await joplin.settings.value("sync_enabeld")) {
                            console.debug("Setting new intervall");
                            clearInterval(sync_intervall);
                            interval =
                                Number(await joplin.settings.value("sync_intervall")) ||
                                default_sync_intervall;
                            sync_intervall = setInterval(update_notes, interval);
                        }
                        break;
                    case "sync_enabeld":
                        console.debug("Toggle Sync");
                        clearInterval(sync_intervall);
                        if (await joplin.settings.value("sync_enabeld")) {
                            interval =
                                Number(await joplin.settings.value("sync_intervall")) ||
                                default_sync_intervall;
                            sync_intervall = setInterval(update_notes, interval);
                        }
                        break;
                    default:
                    // code block
                }
            }
        });

        // Dialogs
        const dialogs = joplin.views.dialogs;
        const new_note_sync_dialog = await dialogs.create("new_note_sync_dialog");
        await dialogs.setFitToContent(new_note_sync_dialog, true);
        await set_sync_dialog_html(new_note_sync_dialog)

        let interval = Number(await joplin.settings.value("sync_intervall")) || default_sync_intervall;
        let sync_intervall;
        if (await joplin.settings.value("sync_enabeld")) {
            sync_intervall = setInterval(update_notes, interval);
        }

        console.info("Plugin loaded");
    },
});
