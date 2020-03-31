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