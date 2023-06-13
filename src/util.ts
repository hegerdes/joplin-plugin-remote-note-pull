import joplin from "api";
import { notes_query_limit } from "./const";
import { getNoteDialog } from "./ui";
import { createNote, updateNote } from "./notes";

const dialogs = joplin.views.dialogs;

// Set dialog HTML
export const setDialogHTML = async (dialog: string) => {
  // await dialogs.setFitToContent(dialog, true);
  await dialogs.setHtml(
    dialog,
    `
        <p>Please enter the URL which the newly created note will be synced with:</p>
        <form name="sync_note_form">
        URL: <input type="text" name="url"/>
        <br/>
        <label for="notebook">Choose Notebook:</label>
        <select id="notebook" name="notebook">
        ${await createNotebookFormOptions()}
        </select>
        </form>
    `
  );
};

// Get all Notebooks with id and name
export const createNotebookList = async () => {
  let folders = await joplin.data.get(["folders"]);
  return folders.items.reduce(
    (obj, item) => Object.assign(obj, { [item.id]: item.title }),
    {}
  );
};

// Create HTML options of notebooks
export const createNotebookFormOptions = async () => {
  let default_notebook = await joplin.data.get([
    "folders",
    await joplin.settings.value("joplin_md_pull_default_notebook"),
  ]);
  let from_options =
    `<option value="${default_notebook.id}">${default_notebook.title}</option>` +
    "\n";
  for (const [key, value] of Object.entries(await createNotebookList())) {
    if (default_notebook.id === key) continue;
    from_options += `<option value="${key}">${value}</option>` + "\n";
  }
  return from_options;
};

// Get all notes
export const getAllNotes = async (): Promise<Map<String, Object>> => {
  let notes = new Map<string, Object>();
  let pageNum = 1;
  let query_fields = ["id", "title", "body", "source_url"];
  let data = await joplin.data.get(["notes"], {
    fields: query_fields,
    limit: notes_query_limit,
    page: pageNum,
  });
  data.items.forEach((entry) => notes.set(entry.id, entry));
  while (data.has_more) {
    pageNum++;
    let data = await joplin.data.get(["notes"], {
      fields: query_fields,
      limit: notes_query_limit,
      page: pageNum,
    });
    data.items.forEach((entry) => notes.set(entry.id, entry));
  }
  return notes;
};

export const registerCommands = async () => {
  await joplin.commands.register({
    name: "pull_note_now",
    label: "Sync this note now",
    iconName: "fas fa-arrow-down",
    execute: updateNote,
  });

  await joplin.commands.register({
    name: "create_pull_note",
    label: "Create new SyncNote",
    iconName: "fas fa-music",
    execute: async () => {
      const dialog_res = await dialogs.open(await getNoteDialog());
      if (dialog_res.id === "ok") {
        let form_data = dialog_res.formData.sync_note_form;
        console.info("Submitted form:", form_data);
        // ToDo: Handle http error
        // let url = (DEBUG) ? debug_url : form_data.url
        await createNote(form_data.url, form_data.notebook);
      }
    },
  });
};
// Patches the synced note for relative links and pictures to ensure
// proper display in joplin
export const patchMDLinks = (
  payload: string,
  base_url: string,
  matches: string[],
  splitter: string,
  stater: string
): string => {
  if (matches) {
    for (let match of matches) {
      let splitted = match.trim().split(splitter);
      if (splitted.length == 2 && !splitted[1].startsWith(stater)) {
        payload = payload.replace(
          match,
          splitted[0] + splitter + base_url + splitted[1]
        );
      }
    }
  }
  return payload;
};

export const isValidUrl = (urlString: string): boolean => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

export const sleep = (sek: number) => {
  return new Promise(resolve => setTimeout(resolve, sek * 1000));
}
