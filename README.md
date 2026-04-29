# hls-repeat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![npm](https://img.shields.io/npm/v/@eyevinn/hls-repeat)](https://www.npmjs.com/package/@eyevinn/hls-repeat) [![Coverage Status](https://coveralls.io/repos/github/Eyevinn/hls-repeat/badge.svg?branch=master)](https://coveralls.io/github/Eyevinn/hls-repeat?branch=master) [![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

Node library to create an HLS VOD by repeating the content of an existing HLS VOD. Supports video, audio, and subtitle tracks.

## Installation

```
npm install --save @eyevinn/hls-repeat
```

Requires Node >= 20.

## Usage

```javascript
const HLSRepeatVod = require('@eyevinn/hls-repeat');

const hlsVod = new HLSRepeatVod('https://example.com/vod/playlist.m3u8', 3);
hlsVod.load().then(() => {
  const bandwidths = hlsVod.getBandwidths();

  // Get video manifest for a specific bandwidth
  const mediaManifest = hlsVod.getMediaManifest(bandwidths[0]);
  console.log(mediaManifest);

  // Get audio manifest (if the source has audio tracks)
  const audioManifest = hlsVod.getAudioManifest('aac', 'en');
  console.log(audioManifest);

  // Get subtitle manifest (if the source has subtitle tracks)
  const subtitleManifest = hlsVod.getSubtitleManifest('text', 'en');
  console.log(subtitleManifest);
});
```

## API

### `new HLSRepeatVod(masterManifestUri, repetitions)`

| Parameter | Type | Description |
|---|---|---|
| `masterManifestUri` | `string` | URL to the HLS master manifest |
| `repetitions` | `number` | Number of times to repeat the content |

### `load()` → `Promise<void>`

Fetches and parses the master manifest and all media/audio/subtitle playlists, then repeats the segments.

### `getBandwidths()` → `number[]`

Returns the list of bandwidths found in the master manifest.

### `getMediaManifest(bandwidth)` → `string`

Returns the repeated video media playlist for the given bandwidth.

### `getAudioManifest(audioGroupId, language)` → `string`

Returns the repeated audio playlist for the given group ID and language. Falls back to the first available group/language if no exact match is found.

### `getSubtitleManifest(subtitleGroupId, language)` → `string | null`

Returns the repeated subtitle playlist for the given group ID and language. Falls back to the first available group/language if no exact match is found. Returns `null` if no subtitle tracks exist.

## How It Works

The library parses the HLS master manifest, loads each variant/track playlist, and concatenates the segment list the specified number of times. A `#EXT-X-DISCONTINUITY` tag is inserted between each repetition.

For example, a single-segment VOD repeated 3 times:

**Input:**
```
#EXTM3U
#EXT-X-TARGETDURATION:3
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:1
#EXTINF:3.000,
segment1_0_av.ts
#EXT-X-ENDLIST
```

**Output:**
```
#EXTM3U
#EXT-X-TARGETDURATION:3
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-DISCONTINUITY
#EXTINF:3.000,
segment1_0_av.ts
#EXT-X-DISCONTINUITY
#EXTINF:3.000,
segment1_0_av.ts
#EXT-X-DISCONTINUITY
#EXTINF:3.000,
segment1_0_av.ts
#EXT-X-ENDLIST
```

The same process is applied to audio and subtitle tracks, ensuring all tracks are repeated the same number of times with proper discontinuity markers.

# Authors

This open source project is maintained by Eyevinn Technology.

## Contributors

- Jonas Rydholm Birme (jonas.birme@eyevinn.se)

## Attributions

<img src="http://ottera.tv/wp-content/uploads/2019/04/Logo-1.png" width="100" title="OTTera logo">

A special thanks to [OTTera](http://ottera.tv) for funding the start of this project. OTTera is a US based company that powers OTT and Linear Video services with over 45 million users worldwide.

# [Contributing](CONTRIBUTING.md)

In addition to contributing code, you can help to triage issues. This can include reproducing bug reports, or asking for vital information such as version numbers or reproduction instructions.

# License (MIT)

Copyright 2020 Eyevinn Technology AB

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
