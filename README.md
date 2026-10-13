# PinRoulette

PinRoulette is a small image roulette web app. It loads every image from `data/images`, places them around a circular wheel, spins on click, shows the selected image in a large modal, and removes that image from the remaining selection pool.

## Features

- Automatically reads images from `data/images`
- Supports common image formats like PNG, JPG, JPEG, GIF, SVG, WEBP, and AVIF
- Serves sound files from `data/sounds`
- Plays looping background music after the first user interaction
- Plays a spin sound during the 10-second roulette animation
- Circular image roulette layout
- Click either the `Start` button or the red center button to spin
- Shows the selected image in a modal
- Removes selected images until the wheel is done
- Reset button restores all images

## Requirements

- Node.js

## Run Locally

Double-click:

```text
Start PinRoulette.bat
```

Or run from the terminal:

```bash
npm start
```

Then open:

```text
http://localhost:5173
```

## Add Images

Place image files inside:

```text
data/images
```

Restart the server after adding or removing files so the app can reload the image list.

## Add Sounds

Place sound files inside:

```text
data/sounds
```

The app currently expects these files:

```text
data/sounds/BG.mp3    Background music
data/sounds/spin.mp3  Spin sound effect
```

Supported served audio formats include MP3, OGG, WAV, and M4A.

## Project Structure

```text
PinRoulette/
  data/images/          Image files used by the roulette
  data/sounds/          Sound files used by the roulette
  public/               Frontend HTML, CSS, and JavaScript
  server.js             Local Node.js static server, image API, and sound server
  package.json          npm start script
  Start PinRoulette.bat Windows double-click launcher
```
