# hls-repeat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Coverage Status](https://coveralls.io/repos/github/Eyevinn/hls-repeat/badge.svg?branch=master)](https://coveralls.io/github/Eyevinn/hls-repeat?branch=master) [![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

Node library to create an HLS by repeating the content of an HLS VOD.

## Installation

```
npm install --save @eyevinn/hls-repeat
```

## Usage

The code below shows an example on how an HLS VOD of three seconds can be repeated into a new VOD of 9 seconds.

```
const hlsVod = new HLSRepeatVod('http://testcontent.eyevinn.technology/slates/ottera/playlist.m3u8', 3);
hlsVod.load()
.then(() => {
  const mediaManifest = hlsVod.getMediaManifest(4928000);
  console.log(mediaManifest);
});
```

What this library does can be illustrated by this simplified example below.

Consider the following:

```
#EXTM3U
#EXT-X-TARGETDURATION:3
#EXT-X-ALLOW-CACHE:YES
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MEDIA-SEQUENCE:1
#EXTINF:3.000,
segment1_0_av.ts
#EXT-X-ENDLIST
```

and with this library we can generate a new VOD by repeating this for example three times. This will result in:

```
#EXTM3U
#EXT-X-TARGETDURATION:3
#EXT-X-ALLOW-CACHE:YES
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
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

# Authors

This open source project is maintained by Eyevinn Technology.

## Contributors

- Jonas Rydholm Birmé (jonas.birme@eyevinn.se)

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