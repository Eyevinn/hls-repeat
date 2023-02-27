const HLSRepeatVod = require('../index.js');
const fs = require('fs');
const Readable = require('stream').Readable;

describe("HLSRepeatVod", () => {
  let mockMasterManifest;
  let mockMediaManifest;

  beforeEach(() => {
    mockMasterManifest = () => {
      return fs.createReadStream('testvectors/hls1/master.m3u8')
    };
    mockMediaManifest = (bw) => {
      const bwmap = {
        4497000: "0",
        2497000: "1"
      }
      return fs.createReadStream(`testvectors/hls1/index_${bwmap[bw]}_av.m3u8`);
    };
  });

  it("can create a 9 seconds long HLS by repeating a 3 sec HLS three times", done => {
    const mockVod = new HLSRepeatVod('http://mock.com/mock.m3u8', 3, {});

    // An example on how it can be initiated from a string instead of URL
    const masterManifest = fs.readFileSync('testvectors/hls1/master.m3u8', 'utf8');
    let masterManifestStream = new Readable();
    masterManifestStream.push(masterManifest);
    masterManifestStream.push(null);

    mockVod.load(() => { return masterManifestStream }, mockMediaManifest)
    .then(() => {
      const bandwidths = mockVod.getBandwidths();
      bandwidths.map(bw => {
        const manifest = mockVod.getMediaManifest(bw);
        const lines = manifest.split("\n");
        expect(lines[9].match(/segment1_\d+_av.ts/)).not.toBeNull();
        expect(lines[10]).toEqual('#EXT-X-DISCONTINUITY');
        expect(lines[12].match(/segment1_\d+_av.ts/)).not.toBeNull();
        expect(lines[13]).toEqual('#EXT-X-DISCONTINUITY');
        expect(lines[15].match(/segment1_\d+_av.ts/)).not.toBeNull();
      });
      done();
    });
  });

  it("can create a audio manifest", done => {
    const mockVod = new HLSRepeatVod('http://mock.com/mock.m3u8', 3, {});

    // An example on how it can be initiated from a string instead of URL
    const masterManifest = fs.readFileSync('testvectors/hls_demuxed/master.m3u8', 'utf8');
    const mediaManifest = fs.readFileSync('testvectors/hls_demuxed/8850073.m3u8', 'utf8');
    const audioManifest = fs.readFileSync('testvectors/hls_demuxed/aac-en.m3u8', 'utf8');
    let masterManifestStream = new Readable();
    masterManifestStream.push(masterManifest);
    masterManifestStream.push(null);

    let mediaManifestStream = new Readable();
    mediaManifestStream.push(mediaManifest);
    mediaManifestStream.push(null);

    let audioManifestStream = new Readable();
    audioManifestStream.push(audioManifest);
    audioManifestStream.push(null);

    mockVod.load(() => { return masterManifestStream }, () => { return mediaManifestStream }, () => { return audioManifestStream })
    .then(() => {
        const manifest = mockVod.getAudioManifest("aac","en");
        const lines = manifest.split("\n");
        expect(lines[76].match(/seg_en_\d+.ts/)).not.toBeNull();
        expect(lines[77]).toEqual('#EXT-X-DISCONTINUITY');
        expect(lines[78].match("#EXT-X-CUE-OUT:DURATION=15.120000000000001")).not.toBeNull();
        expect(lines[84].match("#EXT-X-CUE-IN")).not.toBeNull();
        expect(lines[147].match(/seg_en_\d+.ts/)).not.toBeNull();
        expect(lines[148]).toEqual('#EXT-X-DISCONTINUITY');
        expect(lines[149].match("#EXT-X-CUE-OUT:DURATION=15.120000000000001")).not.toBeNull();
        expect(lines[155].match("#EXT-X-CUE-IN")).not.toBeNull();
        expect(lines[218].match(/seg_en_\d+.ts/)).not.toBeNull();
      done();
    });
  });


  it("can repeat a cmaf audio manifest", done => {
    const mockVod = new HLSRepeatVod('http://mock.com/mock.m3u8', 3, {});

    // An example on how it can be initiated from a string instead of URL
    const masterManifest = fs.readFileSync('testvectors/hls_demuxed_cmaf/master.m3u8', 'utf8');
    const mediaManifest = (bw) => { 
      const bwmap = {
        454000: "0",
        984000: "1",
        1726000: "2",
        2786000: "3",
        3846000: "4",
      }
      return fs.createReadStream(`testvectors/hls_demuxed_cmaf/level_${bwmap[bw]}.m3u8`);
    };
    const audioManifest = fs.readFileSync('testvectors/hls_demuxed_cmaf/audio.m3u8');
    let masterManifestStream = new Readable();
    masterManifestStream.push(masterManifest);
    masterManifestStream.push(null);

    let audioManifestStream = new Readable();
    audioManifestStream.push(audioManifest);
    audioManifestStream.push(null);

    mockVod.load(() => { return masterManifestStream }, mediaManifest, () => { return audioManifestStream })
    .then(() => {
        const manifest = mockVod.getAudioManifest("audio-aacl-128","Svenska");
        const lines = manifest.split("\n");
        expect(lines[27].match("hls/4fef8b00-6d0b-11ed-89b6-2b1a288899a0_20356478-audio=128000-104")).not.toBeNull();
        expect(lines[28].match(`#EXT-X-MAP:URI="https://vod.streaming.a2d.tv/a07ff4eb-6770-4805-a0ad-a4d1b127880d/4fef8b00-6d0b-11ed-89b6-2b1a288899a0_20356478.ism/hls/4fef8b00-6d0b-11ed-89b6-2b1a288899a0_20356478-audio=128000.m4s"`)).not.toBeNull();
        expect(lines[29]).toEqual('#EXT-X-DISCONTINUITY');
        expect(lines[47].match("hls/4fef8b00-6d0b-11ed-89b6-2b1a288899a0_20356478-audio=128000-104")).not.toBeNull();
        expect(lines[28].match(`#EXT-X-MAP:URI="https://vod.streaming.a2d.tv/a07ff4eb-6770-4805-a0ad-a4d1b127880d/4fef8b00-6d0b-11ed-89b6-2b1a288899a0_20356478.ism/hls/4fef8b00-6d0b-11ed-89b6-2b1a288899a0_20356478-audio=128000.m4s"`)).not.toBeNull();
        expect(lines[49]).toEqual('#EXT-X-DISCONTINUITY');
        expect(lines[67].match("hls/4fef8b00-6d0b-11ed-89b6-2b1a288899a0_20356478-audio=128000-104")).not.toBeNull();
      done();
    });
  });

  it("can generate HLS from a downloaded HLS", done => {
    const hlsVod = new HLSRepeatVod('http://testcontent.eyevinn.technology/slates/ottera/playlist.m3u8', 3);
    hlsVod.load()
    .then(() => {
      const bandwidths = hlsVod.getBandwidths();
      bandwidths.map(bw => {
        const manifest = hlsVod.getMediaManifest(bw);
        expect(manifest).not.toBe('');
      });
      done();
    });
  });
});