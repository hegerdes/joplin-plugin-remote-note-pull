import joplin from "api";
import { notes_query_limit } from "./const";

const dialogs = joplin.views.dialogs;
// Set dialog HTML
export const set_sync_dialog_html = async (dialog: string) => {
  await dialogs.setFitToContent(dialog, true);
  await dialogs.setHtml(
    dialog,
    `
        <p>Please enter the URL which the newly created note will be synced with:</p>
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
};

// Get all Notebooks with id and name
export const create_notebook_list = async () => {
  let folders = await joplin.data.get(["folders"]);
  return folders.items.reduce(
    (obj, item) => Object.assign(obj, { [item.id]: item.title }),
    {}
  );
};

// Create HTML options of notebooks
export const create_notebook_form_option = async () => {
  let default_notebook = await joplin.data.get([
    "folders",
    await joplin.settings.value("joplin_md_pull_default_notebook"),
  ]);
  let from_options =
    `<option value="${default_notebook.id}">${default_notebook.title}</option>` +
    "\n";
  for (const [key, value] of Object.entries(await create_notebook_list())) {
    if (default_notebook.id === key) continue;
    from_options += `<option value="${key}">${value}</option>` + "\n";
  }
  return from_options;
};

// Get all notes
export const get_all_notes = async () => {
  let notes = new Map<string, Object>();
  let pageNum = 1;
  let data = await joplin.data.get(
    ["notes"],
    `limit=${notes_query_limit}&page=${pageNum}`
  );
  data.items.forEach((entry) => notes.set(entry.id, entry));
  while (data.has_more) {
    pageNum++;
    console.log(`limit=${notes_query_limit}&page=${pageNum}`);
    data = await joplin.data.get(["notes"]);
    data.items.forEach((entry) => notes.set(entry.id, entry));
  }
  return notes;
};
