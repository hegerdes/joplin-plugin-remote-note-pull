export const default_sync_interval = 1800000;
export const notes_query_limit = 25;
export const DEBUG = true;
export const http_options = { method: "GET" };
export const debug_url =
  "https://raw.githubusercontent.com/hegerdes/BeeblebroxCTF/master/README.md";
export const note_marker =
  "This note is synced via the remote-pull plugin from this website: ";
export const sync_note_regex =
  /.*This note is synced via the remote-pull plugin.*/g;
