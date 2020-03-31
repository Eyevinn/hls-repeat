const HLSRepeatVod = require('../index.js');
const fs = require('fs');

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
    mockVod.load(mockMasterManifest, mockMediaManifest)
    .then(() => {
      const bandwidths = mockVod.getBandwidths();
      bandwidths.map(bw => {
        const manifest = mockVod.getMediaManifest(bw);
        console.log(manifest);
        // expect
      });
      done();
    });
  });
});