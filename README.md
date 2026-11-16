# Gully Cricket

Dopahar ke 3 baje, gully mein match. A one-player street cricket game for phones: bat or bowl a 5-over match between two apartment blocks, with a milk crate for a wicket.

Plain HTML canvas and JavaScript. No build step, no dependencies.

## Play locally

```bash
python -m http.server 8123
```

Then open http://localhost:8123. On a phone on the same Wi-Fi, use the PC's address in place of `localhost`.

## Test

```bash
node test.js
```

## Files

- `index.html` - the page, name box and mute button
- `game.js` - drawing, input, sound and the match flow
- `logic.js` - the rules (shot outcomes, AI batter, innings, who won), covered by `test.js`
- `sw.js`, `manifest.json`, `icon-*.png` - home-screen install and offline play (needs HTTPS)

## Deploy

It is a static site. Any static host works with no settings: no build command, output directory is the repo root.
