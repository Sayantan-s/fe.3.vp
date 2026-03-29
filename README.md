## Features

- Headless Version of the Video Player with exposed hooks for playback panel (easily customisable)
- Bg Swatch for each easy bg switch
- Easy aspect ratio switch for horizontal and vertical videos (hard coded to horizontal in Player.Canvas)
- **Word-highlight & video sync** — each transcript word carries `{ start, end }` timestamps. A binary search (`findWordAtTime`, O(log n)) maps the current playback time to the active word index. `useSyncExternalStore` ensures re-renders fire only when the index changes, not on every ~4 Hz time tick. Clicking a word calls `store.seek(word.start)` to jump the video. `useAutoScroll` keeps the current word centred, pausing for 3 s when the user manually scrolls. Skipped words are auto-seeked past during playback using a 250 ms lookahead buffer.
- **Big Transcript Rendering** - solved for 20K words

## Patterns

- Peformance pattern for segregating actions and state into different context for unneccessary re-renders.
- debounced sliders/randers for unwanted state updates

## Drawbacks

- Transcript could have been a dumb component too. (part of design system)
- Buttons of Undo Skip Should have been a part of design-system atoms
- Keyboard accessiblity for the player.
- Mobile Friendliness
- Transcript streaming for words from api.
- Transcript Scroll area effect of fade (could have been more aesthetic)
- Folder structure
- panel's loading state, to be more granular
