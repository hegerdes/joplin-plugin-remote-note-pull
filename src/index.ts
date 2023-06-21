import joplin from "api";
import { createNotebookList, registerCommands } from "./util";
import {
  createButtons,
  createSettings,
  getNoteDialog,
  updateSettings,
} from "./ui";

joplin.plugins.register({
  onStart: async function () {
    console.info("Starting plugin");

    await registerCommands();
    console.debug("Commands registered");
    await createSettings();
    console.debug("Settings created");
    await createButtons();
    console.debug("Buttons created");
    await getNoteDialog();
    console.debug("Dialogs created");

    const notebooks_map = await createNotebookList();
    console.debug("Fund these notebooks:", notebooks_map);

    // When settings change
    joplin.settings.onChange(updateSettings);

    // // This event will be triggered when the content of the note changes
    // await joplin.workspace.onNoteChange(async () => {
    //   await setDialogHTML(await getNoteDialog());
    // });

    // // This event will be triggered when the user selects a different note
    // await joplin.workspace.onNoteSelectionChange(async () => {
    //   await setDialogHTML(await getNoteDialog());
    // });

    console.info("Plugin loaded");
  },
});
