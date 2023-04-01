import joplin from "api";
import {
  MenuItemLocation,
  SettingItemType,
  ToolbarButtonLocation,
} from "api/types";
import { default_sync_interval } from "./const";
import { createNotebookList, setDialogHTML } from "./util";
import { updateNotes } from "./notes";

let newNoteDialog;
let joplin_md_pull_sync_interval: NodeJS.Timer;
let interval;

export const createSettings = async () => {
  let notesbooks_map = await createNotebookList();
  await joplin.settings.registerSettings({
    joplin_md_pull_sync_enabeld: {
      value: true,
      type: SettingItemType.Bool,
      section: "joplin_md_pull_setting",
      public: true,
      label: "Enable periodic sync",
    },
    joplin_md_pull_sync_interval: {
      value: default_sync_interval,
      type: SettingItemType.Int,
      minimum: 300,
      section: "joplin_md_pull_setting",
      public: true,
      label: "Sync interval",
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
  });

  interval =
    Number(await joplin.settings.value("joplin_md_pull_sync_interval")) ||
    default_sync_interval;
  if (await joplin.settings.value("joplin_md_pull_sync_enabeld")) {
    joplin_md_pull_sync_interval = setInterval(updateNotes, interval);
  }
};

export const createButtons = async () => {
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
    iconName: "fas fa-wrench",
  });
};

// Dialogs
export const getNoteDialog = async () => {
  if (!newNoteDialog) {
    let dialogs = joplin.views.dialogs;
    newNoteDialog = await dialogs.create("new_note_sync_dialog");
    await setDialogHTML(newNoteDialog);
  }
  return newNoteDialog;
};

export const updateSettings = async (event) => {
  console.debug("Settings changed:", event);
  for (const item of event.keys) {
    switch (item) {
      case "joplin_md_pull_sync_interval":
        if (await joplin.settings.value("joplin_md_pull_sync_enabeld")) {
          console.debug("Setting new interval");
          clearInterval(joplin_md_pull_sync_interval);
          interval =
            Number(
              await joplin.settings.value("joplin_md_pull_sync_interval")
            ) || default_sync_interval;
          joplin_md_pull_sync_interval = setInterval(updateNotes, interval);
        }
        break;
      case "joplin_md_pull_sync_enabeld":
        console.debug(
          "Toggle Sync to: " +
            (await joplin.settings.value("joplin_md_pull_sync_enabeld"))
        );
        clearInterval(joplin_md_pull_sync_interval);
        if (await joplin.settings.value("joplin_md_pull_sync_enabeld")) {
          interval =
            Number(
              await joplin.settings.value("joplin_md_pull_sync_interval")
            ) || default_sync_interval;
          joplin_md_pull_sync_interval = setInterval(updateNotes, interval);
        }
        break;
      case "joplin_md_pull_default_notebook":
        console.debug(
          "Setting: " +
            (await joplin.settings.value("joplin_md_pull_default_notebook")) +
            " as the default notebook"
        );
        await setDialogHTML(newNoteDialog);
        break;
      default:
    }
  }
};
