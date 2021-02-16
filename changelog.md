## Elemental 4.4.1 (2021-02-15)

hotpatch to fix #82

## Elemental 4.4.0 (2021-02-15)

## Engine
- Supports element searching
- Fix some css bugs causing dark themes to break menus (white on white text)

## Elemental 4.3.1 (2021-01-25)

## Engine
- Fix the unsupported browser message

## Elemental 4 Server
- Log voting errors

## Elemental 4.3.0 (2021-01-02)

## Engine
- Show the comment authors instead of the hardcoded string "Error"

## Main Game
- Decode comment authors correctly. (@Nv7-GitHub)

## Other APIs
- Nv7 Server: Better Anarchy Support

## Elemental 4.2.3 (2020-12-12)

## Engine
- Try to fix the Store API but I don't think it is truly fixed yet.
- Fix combination sorter from changing ids that start with numbers (@Nv7-GitHub)
- Remove Elemental 5 Official as a built in server as it has slow response times, you can still add it manually.

## Other APIs
- Nv7 Server: Bug Fixes

## Elemental 4.2.2 (2020-12-08)

## Engine
- Fix HTML injection on element comments (@veprogames)
- Fix p5.js backgrounds from not working under certain cases. (@davecaruso)

## New DLC
- Theme: Neon (@veprogames)
- Theme: Snow (@veprogames)

## Elemental 4.2.1 (2020-12-04)
Fixes some minor bugs in some of 4.2

## Engine
- Bug: Changelog was not exported.
- Bug: Did not wait for the service worker to initialize before using it.
- Bug: Queue error causing ChunkedStores to fail.

## Elemental 4.2.0 (2020-12-04)
Fixes some major bugs and adding the first version of the recipe trees! Big thanks to Zelo(@Zolo101) for helping out.

## Main Game
- Bug: Entries that were added on the server during the client's load were ignored. (@davecaruso)

## Engine
- IndexedDB calls are now proxied through a service worker and using a different framework, so they should hopefully never fail. (@davecaruso)
- Element Recipe Trees now are rendered (@Zolo101) 
- Changed the text on the autoplay dialog. (@davecaruso)
- Bug: Crash due to theme not loaded. (@davecaruso)

## New DLC
- Theme: Inverted Colors (@dugo3number2)

## Other APIs
- Nv7 Server: Various bug fixes. (@Nv7-GitHub)

## Elemental 4.1.1 (2020-11-26)
### Engine
- Element save files are not written during loading. This is unneeded since your save file would already exist with the same element list, or be the default. (@davecaruso)</li>

### Other APIs
- Nv7 Server: Fix a caching issue with combinations (@Nv7-GitHub)

## Elemental 4.1.0 (2020-11-26)
### Main Game
- You can now change your username after it has been set, and also backup your login token. (@davecaruso)
- Offline mode provided you have loaded the database once. (#25, @davecaruso)
- Socket Reconnecting code, may be buggy. (@davecaruso)
- Debug console command `repair()` to trigger a database redownload. [TEMP FIX #17] (@davecaruso)

### Engine
- Scrollbar for recent element creations. (@Zolo101)
- Server-specific options now show up if defined. (@davecaruso)
- Bug: If an API fails to load, it will force you to the No Server screen. (@davecaruso)
- Bug: Null Server no longer tracks statistics. (@davecaruso)
- Bug: Current server was not always saved in config. (#24 @davecaruso)
- Optimizations in the loading process. (@davecaruso)
- Support for Offline Mode on supported APIs. (#25 @davecaruso)
- Typo: Element Info say "Uses" instead of "Usages" (#26 @davecaruso)

### Other APIs
- Nv7 Server: Security fixes, and many optimizations. (@Nv7-GitHub)

### API Features
- `loading` and `reloadSelf` UI functions. (@davecaruso)
- `internal:blank` server is now available, this is a joke idea for the `https://zero.elemental4.net` server. (@davecaruso)

## Elemental 4.0.1 (2020-11-21)
- Refactored and split up complex chunks of code (@Nv7-GitHub)
- Bug: Made it so the Recent Additions menu clears when changing APIs
- Bug: Element Info closes on any click on firefox (@Nubo318)
- Bug: Elemental Reborn: Certain combinations were not sorted, causing missing elements (@JohnSmith777779)
- Bug: Elemental 4 API: If a recipe for a starter element exists, the game will crash when looking up it's element tree. (@JohnSmith777779)
- Bug: Text fields in a dark theme would not use a light text color (@Filip9696)
- Bug: P5js backgrounds would not load (@davecaruso)

## Elemental 4.0.0 (2020-11-19)

- Completely overhauled all client code, which is now based on Elemental Lite.
- New color system with Saturation and Lightness sliders.
- Voting logic updated.

## Old Elemental 4 v1.2
- Custom Themes via URLs
- Built-in Dark Theme
- Sound related fixes
- Behind the scenes stuff to make the game work better.

## Old Elemental 4 v1.1
- Fixed the "Corner Bug"
- Added sounds
- Custom Sound Packs via URLs

## Old Elemental 4 v1.0
- Initial Functioning Game
