import joplin from "api";
import {http_options, note_marker, owner_repo, sync_note_regex} from "./const";
import { getAllNotes, isValidUrl, patchMDLinks, sleep } from "./util";
import { makeRequest } from "./requests";

const md_pic_links_regex = /!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g;
const md_link_regex = /\[([^[\]]*)\]\((.*?)\)/g;
const html_link_regex = /<img [^>]*src="[^"]*"[^>]*>/g;

// Create a new sync note
export const createNote = async (url: string, notebook: string) => {
  try {
    const res = (await makeRequest(url, http_options)).toString();
    console.debug("Made web request");
    const body = await createBody(res, url);
    console.debug("Created Body");
    const title = await createTitle(res);
    console.debug("Created Title");

    const post_res = await joplin.data.post(["notes"], null, {
      body: body,
      title: title,
      parent_id: notebook,
      source_url: url,
    });

    console.debug("New Note", post_res);
    alert("New Sync Note Created");
  } catch (err) {
    console.error("Error while creating note: ", err);
    alert(
      `Unable to create new note!\nError: ${err.message}\n\nIf this is a issue with the plugin feel free to open a issue on: ${owner_repo}`
    );
  }
};

// Generate title
export const createTitle = async (body: string): Promise<string> => {
  let title = body.split("\n")[0];
  for (const entry of body.split("\n")) {
    if (entry.startsWith("#")) {
      title = entry.replace(/#/g, "");
      break;
    }
  }
  return title;
};

// Generate body
export const createBody = async (orgBody: string, url: string): Promise<string> => {
  // add marker and check body for relative links
  const remote_sync_footer = "\n*" + note_marker + url + "*\n";
  let body = orgBody + remote_sync_footer;
  const base_url = url.substring(0, url.lastIndexOf("/")) + "/";
  let matches = [];

  matches = body.match(md_pic_links_regex);
  body = patchMDLinks(body, base_url, matches, "](", "http");
  matches = body.match(md_link_regex);
  body = patchMDLinks(body, base_url, matches, "](", "http");
  matches = body.match(html_link_regex);
  body = patchMDLinks(body, base_url, matches, 'src="', "http");

  return body;
};

export const updateNote = async (note: JoplinNote, batch = false) => {
  try {
    if (!note) note = await joplin.workspace.selectedNote();

    // Keep in mind that it can be `null` if nothing is currently selected!
    if (note) {
      const matches = note.body.match(sync_note_regex);
      if (matches && matches.length > 0 && isValidUrl(note.source_url)) {
        console.debug(`Updating note: ${note.id} - ${note.title}`);
        console.debug("Regex matches, tying to update note ", note.title, matches);
        const res = (await makeRequest(note.source_url, http_options)).toString();
        const body = await createBody(res, note.source_url);

        // ToDo: Handle Error when note is gone
        const post_res = await joplin.data.put(["notes", note.id], null, {
          body: body,
        });
        console.debug("Updated Note:", post_res);
        if (!batch) alert(`Note ${note.title} updated!`);
      } else {
        console.info("Update Note: Not a sync Note");
        if (!batch) alert("This is not a RemoteSynced note!");
      }
    } else {
      console.warn("NoteUpdate: No note is selected");
      alert("Please select a note first");
    }
  } catch (err) {
    console.error("Error while updating note: ", err);
    alert(
      `Unable to create new note!\nError: ${err.message}\n\nIf this is a issue with the plugin feel free to open a issue on: ${owner_repo}`
    );
  }
};

// Called on each note sync interval to update their content
export const updateNotes = async () => {
  const all_notes = await getAllNotes();

  // Go through all notes and search for note_marker
  console.debug(`Will iterate through ${all_notes.size} notes and update every sync note`)
  all_notes.forEach(async (note: JoplinNote, _key: string) => {
      if(isValidUrl(note.source_url)){
        await updateNote(note, true);
        await sleep(5);
      }
    });
    console.debug("Update done")
};
