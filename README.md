A Node library to create an HLS by repeating the content of an HLS VOD.

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

## Example

```
$ npm install --save @eyevinn/hls-repeat
```

```
const hlsVod = new HLSRepeatVod('http://testcontent.eyevinn.technology/slates/ottera/playlist.m3u8', 3);
hlsVod.load()
.then(() => {
  const mediaManifest = hlsVod.getMediaManifest(4928000);
  console.log(mediaManifest);
});
```

## License (MIT)

Copyright 2020 Eyevinn Technology AB

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.