import joplin from "api";
import { http_options, note_marker, sync_note_regex } from "./const";
import { getAllNotes, isValidUrl, patchMDLinks } from "./util";
import { makeRequest } from "./requests";

const md_pic_links_regex = /!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g;
const md_link_regex = /\[([^\[\]]*)\]\((.*?)\)/g;
const html_link_regex = /<img [^>]*src="[^"]*"[^>]*>/g;

// Create a new sync note
export const createNote = async (url: string, notebook: string) => {
  let res = (await makeRequest(url, http_options)).toString();
  console.debug("Made web request");
  let body = await createBody(res, url);
  console.debug("Created Body");
  let title = await createTitle(res);
  console.debug("Created Title");

  let post_res = await joplin.data.post(["notes"], null, {
    body: body,
    title: title,
    parent_id: notebook,
    source_url: url,
  });

  console.debug("New Note", post_res);
  alert("New Sync Note Created");
};

// Generate title
export const createTitle = async (body: string): Promise<string> => {
  let title = body.split("\n")[0];
  for (let entry of body.split("\n")) {
    if (entry.startsWith("#")) {
      title = entry.replace(/#/g, "");
      break;
    }
  }
  return title;
};

export const createBody = async (
  orgBody: string,
  url: string
): Promise<string> => {
  // add marker and check body for relative links
  let remote_sync_footer = "\n_" + note_marker + url + "_\n";
  let body = orgBody + remote_sync_footer;
  let base_url = url.substring(0, url.lastIndexOf("/")) + "/";
  let matches = [];

  matches = body.match(md_pic_links_regex);
  body = patchMDLinks(body, base_url, matches, "](", "http");
  matches = body.match(md_link_regex);
  body = patchMDLinks(body, base_url, matches, "](", "http");
  matches = body.match(html_link_regex);
  body = patchMDLinks(body, base_url, matches, 'src="', "http");

  return body;
};

export const updateNote = async (note) => {
  if (!note) note = await joplin.workspace.selectedNote();

  // Keep in mind that it can be `null` if nothing is currently selected!
  if (note) {
    console.log(note);
    const matches = note.body.match(sync_note_regex);
    if (matches && matches.length > 0 && isValidUrl(note.source_url)) {
      console.debug(`Trying to update note: ${note.title}`);
      let res = (await makeRequest(note.source_url, http_options)).toString();
      let body = await createBody(res, note.source_url);
      let title = await createTitle(res);

      // ToDo: Handle Error when note is gone
      let post_res = await joplin.data.put(["notes", note.id], null, {
        body: body,
      });
      console.debug("Updated Note:", post_res);
    } else {
      console.info("Update Note: Not a sync Note");
      alert("This is not a RemoteSynced note!");
    }
  } else {
    console.warn("NoteUpdate: No note is selected");
    alert("Please select a note first");
  }
};

// Called on each note sync interval to update their content
export const updateNotes = async () => {
  const all_notes = await getAllNotes();

  // ToDo
  // Go through all notes and search for note_marker
  all_notes.forEach(async (note: joplin_note, _key: string) => {
    const matches = note.body.match(sync_note_regex);
    if (matches) {
      await updateNote(note);
    }
    console.log("Matches", matches);
  });
};
