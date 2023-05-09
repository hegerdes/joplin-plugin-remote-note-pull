# Joplin Plugin Remote Note Pull

[![Plugin Test Build](https://github.com/hegerdes/joplin-plugin-remote-note-pull/actions/workflows/test-compile.yml/badge.svg)](https://github.com/hegerdes/joplin-plugin-remote-note-pull/actions/workflows/test-compile.yml) [![GitHub issues](https://img.shields.io/github/issues/hegerdes/joplin-plugin-remote-note-pull.svg)](https://GitHub.com/hegerdes/joplin-plugin-remote-note-pull/issues/) [![GitHub release](https://img.shields.io/github/release/hegerdes/joplin-plugin-remote-note-pull.svg)](https://GitHub.com/hegerdes/joplin-plugin-remote-note-pull/releases/)

This plugin allows websites to be saved as notes and updated periodically based on the original website URL.

This way you can always work with the latest version of online cheat sheets/websites and docs in your favourite notebook without manually update it by yourself.


## Install
**Official:**
Joplin has a community store with an integrated browser for plugin. This plugin is **not** yet released there. It will be added when its in a stable state. Just search for `remote-note-pull`.

**Manual:**
You can get the latest version like this:
 * Download the latest release from [GitHub Releases](https://github.com/hegerdes/joplin-plugin-remote-note-pull/releases)
 * Extract the archive
 * Open Joplin and open the Settings via the Tools/Options menu
 * Go to Plugins
 * Click *Manage Plugins* and browse to the downloaded release and chose the `.jpl` file  

## Getting Started
After Install you can go to the *Tools* menu. There will be a new option *Create new SyncNote*.

Enter a URL and wait some second. The newly created note will be periodically updated with the URL you entered. The default interval is 30m.  
**NOTE:** Every manual change in the note will be overwritten!

![New Note Option Dialog](docs/images/new_note_dialog.png)

You can change the default interval via the Joplin settings. A new option group will be added on plugin install. It allows you to enable the sync feature, sets the sync interval and the default target notebook.  
With the *DownArrow* Icon in the top left you can also trigger a manual update in any currently selected sync-note.

![Settings Dialog](docs/images/settings.png)


## Develop
Make sure you have nodeJS >= 14 installed

Clone the repo and open it in your favourite editor. The most important files are:

- `/src/index.ts`, which contains the entry point for the plugin source code.
- `/src/manifest.json`, which is the plugin manifest. It contains information such as the plugin a name, version, etc.

See here for information about publishing [Joplin Forum](https://discourse.joplinapp.org/t/plugins-multiple-questions-sharing-publishing-etc/30551)  
For mor€information see [here](https://github.com/laurent22/joplin/tree/dev/packages/generator-joplin#publishing-the-plugin)

## Building the plugin

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can use to distribute the plugin.

To build the plugin, simply run `npm run dist`.

The project is setup to use TypeScript, although you can change the configuration to use plain JavaScript.

You can also use `npm run dev` to build the plugin and open Joplin in dev mode.
