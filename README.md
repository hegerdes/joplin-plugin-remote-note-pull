# Joplin Plugin Remote Note Pull

[![Plugin Test Build](https://github.com/hegerdes/joplin-plugin-remote-note-pull/actions/workflows/Plugin-Test.yml/badge.svg)](https://github.com/hegerdes/joplin-plugin-remote-note-pull/actions/workflows/Plugin-Test.yml) [![Create Release](https://github.com/hegerdes/joplin-plugin-remote-note-pull/actions/workflows/Release.yml/badge.svg?event=release)](https://github.com/hegerdes/joplin-plugin-remote-note-pull/actions/workflows/Release.yml)

This plugin allows you to add notes from websites that will be periodically updated form the original website URL.

This way you will always have the latest version of online cheat sheets/websites and docs in your favourite notebook without having to update it yourself.


## Install
**Official:**
Joplin has an integrated plugin browser for plugins in a comunity store. This plugin is **not** yet in that sore. It will be added at a given time. Just search for `remote-note-pull`.

**Manual:**
You can get the latest version like this:
 * Download the latest release from [GitHub Releases](https://github.com/hegerdes/joplin-plugin-remote-note-pull/releases)
 * Extract the archive
 * Open Joplin and open the Settings via the Tools/Options menu
 * Go to Plugins
 * Click *Manage Plugins* and browse to the downloaded release and chose the `.jpl` file  

## Getting Started
After Install you can go to the *Tools* menu. There will be a new option *Create new SyncNote*.

Enter a URL and wait some second. The newly created note will be periodically updated form the URL you entered. The default interval is 30m.  
**NOTE:** Every manual change in the note will be overwritten!

![New Note Option Dialog](docs/images/new_note_dialog.png)

You can change the default interval via the Joplin settings. A new option group was added on plugin install. It allows you to enable the sync feature, set the sync interval and the default target notebook.

![Settings Dialog](docs/images/settings.png)


## Develop
Make sure you have nodeJS >= 14 installed

Clone the repo and open it in your favourite editor. The main files you will want to look at are:

- `/src/index.ts`, which contains the entry point for the plugin source code.
- `/src/manifest.json`, which is the plugin manifest. It contains information such as the plugin a name, version, etc.

## Building the plugin

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can use to distribute the plugin.

To build the plugin, simply run `npm run dist`.

The project is setup to use TypeScript, although you can change the configuration to use plain JavaScript.

Your can also use `npm run dev` to build the plugin and open Joplin in dev mode.
