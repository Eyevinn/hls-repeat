const m3u8 = require('@eyevinn/m3u8');
const url = require('url');
const fetch = require('node-fetch');

class HLSRepeatVod {
  constructor(vodManifestUri, repetitions, options) {
    this.masterManifestUri = vodManifestUri;
    this.playlists = {};
    this.repetitions = repetitions;
    this.bandwiths = [];
  }

  load(_injectMasterManifest, _injectMediaManifest) {
    return new Promise((resolve, reject) => {
      const parser = m3u8.createStream();

      parser.on('m3u', m3u => {
        this.m3u = m3u;
        let mediaManifestPromises = [];
        let baseUrl;
        const m = this.masterManifestUri.match(/^(.*)\/.*?$/);
        if (m) {
          baseUrl = m[1] + '/';
        }
        for (let i = 0; i < m3u.items.StreamItem.length; i++) {
          const streamItem = m3u.items.StreamItem[i];
          this.bandwiths.push(streamItem.get('bandwidth'));

          const mediaManifestUrl = url.resolve(baseUrl, streamItem.get('uri'));
          mediaManifestPromises.push(this._loadMediaManifest(mediaManifestUrl, streamItem.get('bandwidth'), _injectMediaManifest));
        }
        Promise.all(mediaManifestPromises)
        .then(resolve)
        .catch(reject);
      });
      parser.on('error', (err) => {
        reject("Failed to parse M3U8: " + err);
      });
      if (!_injectMasterManifest) {
        fetch(this.masterManifestUri)
        .then(res => {
          res.body.pipe(parser);
        })
        .catch(reject);
      } else {
        _injectMasterManifest().pipe(parser);
      }
    });  
  }

  getBandwidths() {
    return this.bandwiths;
  }

  getMediaManifest(bw) {
    return this.playlists[bw].toString();
  }

  _loadMediaManifest(mediaManifestUri, bandwidth, _injectMediaManifest) {
    return new Promise((resolve, reject) => {
      const parser = m3u8.createStream();

      parser.on('m3u', m3u => {
        if (!this.playlists[bandwidth]) {
          this.playlists[bandwidth] = m3u;
        }

        let playlistItems = this.playlists[bandwidth].items.PlaylistItem;
        playlistItems[0].set('discontinuity', true);
        let repetition = 0;
        while (repetition < this.repetitions - 1) {
          this.playlists[bandwidth].items.PlaylistItem = this.playlists[bandwidth].items.PlaylistItem.concat(playlistItems);
          repetition++;
        }
        resolve();
      });
      parser.on('error', (err) => {
        reject("Failed to parse M3U8: " + err);
      });
      if (!_injectMediaManifest) {
        fetch(mediaManifestUri)
        .then(res => {
          res.body.pipe(parser);
        })
        .catch(reject);
      } else {
        _injectMediaManifest(bandwidth).pipe(parser);
      }
    });
  }
}

module.exports = HLSRepeatVod;
