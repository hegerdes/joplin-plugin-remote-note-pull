import joplin from "api";
import { http_options } from "./const";
import { patchMDLinks } from "./util";
import { makeRequest } from "./getContent";

const md_pic_links_regex = /!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g
const md_link_regex = /\[([^\[\]]*)\]\((.*?)\)/g
const html_link_regex = /<img [^>]*src="[^"]*"[^>]*>/g
const note_marker = 'This note is synced via the remote-pull plugin from this website: '


export const createNote = async (url: string, notebook: string) => {
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
        let remote_sync_footer = '\n_' + note_marker + url + '_\n'
        let body = res + remote_sync_footer
        let base_url = url.substring(0, url.lastIndexOf('/')) + '/'
        let matches = []

        matches = body.match(md_pic_links_regex)
        body = patchMDLinks(body, base_url, matches, '](', 'http')
        matches = body.match(md_link_regex)
        body = patchMDLinks(body, base_url, matches, '](', 'http')
        matches = body.match(html_link_regex)
        body = patchMDLinks(body, base_url, matches, 'src="', 'http')

        let post_res = await joplin.data.post(
            ["notes"],
            null,
            {
                body: body,
                title: title,
                parent_id: notebook || await joplin.settings.value("joplin_md_pull_default_notebook"),
                source_url: url
            }
            );

            console.debug('New Note', post_res);
}