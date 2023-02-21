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

  load(_injectMasterManifest, _injectMediaManifest, _injectAudioManifest) {
    return new Promise((resolve, reject) => {
      const parser = m3u8.createStream();

      parser.on('m3u', m3u => {
        this.m3u = m3u;
        let mediaManifestPromises = [];
        let audioManifestPromises = [];
        let baseUrl;
        const m = this.masterManifestUri.match(/^(.*)\/.*?$/);
        if (m) {
          baseUrl = m[1] + '/';
        }

        this.audioGroups = {};
        for (let i = 0; i < m3u.items.StreamItem.length; i++) {
          const streamItem = m3u.items.StreamItem[i];
          this.bandwiths.push(streamItem.get('bandwidth'));

          const mediaManifestUrl = url.resolve(baseUrl, streamItem.get('uri'));
          if (!m3u.items.MediaItem.find((mediaItem) => mediaItem.get("type") === "AUDIO" && mediaItem.get("uri") == streamItem.get("uri"))) {
            if (streamItem.get("codecs") !== "mp4a.40.2") {
              mediaManifestPromises.push(this._loadMediaManifest(mediaManifestUrl, streamItem.get("bandwidth"), _injectMediaManifest));
            }
          }

          if (streamItem.attributes.attributes["audio"]) {
            let audioGroupId = streamItem.attributes.attributes["audio"];
            if (!this.audioSegments[audioGroupId]) {
              this.audioSegments[audioGroupId] = {};
            }
            debug(`Lookup media item for '${audioGroupId}'`);


            let audioGroupItems = m3u.items.MediaItem.filter((item) => {
              return item.attributes.attributes.type === "AUDIO" && item.attributes.attributes["group-id"] === audioGroupId;
            });
            // # Find all langs amongst the mediaItems that have this group id.
            // # It extracts each mediaItems language attribute value.
            // # ALSO initialize in this.audioSegments a lang. property whos value is an array [{seg1}, {seg2}, ...].
            let audioLanguages = audioGroupItems.map((item) => {
              let itemLang;
              if (!item.attributes.attributes["language"]) {
                itemLang = item.attributes.attributes["name"];
              } else {
                itemLang = item.attributes.attributes["language"];
              }
              // Initialize lang. in new group.
              if (!this.audioSegments[audioGroupId][itemLang]) {
                this.audioSegments[audioGroupId][itemLang] = [];
              }
              return (item = itemLang);
            });

            // # For each lang, find the lang playlist uri and do _loadAudioManifest() on it.
            for (let j = 0; j < audioLanguages.length; j++) {
              let audioLang = audioLanguages[j];
              let audioUri = audioGroupItems[j].attributes.attributes.uri;
              if (!audioUri) {
                //# if mediaItems dont have uris
                let audioVariant = m3u.items.StreamItem.find((item) => {
                  return !item.attributes.attributes.resolution && item.attributes.attributes["audio"] === audioGroupId;
                });
                if (audioVariant) {
                  audioUri = audioVariant.properties.uri;
                }
              }
              if (audioUri) {
                let audioManifestUrl = url.resolve(baseUrl, audioUri);
                if (!audioGroups[audioGroupId]) {
                  audioGroups[audioGroupId] = {};
                }
                // # Prevents 'loading' an audio track with same GroupID and LANG.
                // # otherwise it just would've loaded OVER the latest occurrent of the LANG in GroupID.
                if (!audioGroups[audioGroupId][audioLang]) {
                  audioGroups[audioGroupId][audioLang] = true;
                  audioManifestPromises.push(this._loadAudioManifest(audioManifestUrl, audioGroupId, audioLang, _injectAudioManifest));
                } else {
                  debug(`Audio manifest for language "${audioLang}" from '${audioGroupId}' in already loaded, skipping`);
                }
              } else {
                debug(`No media item for '${audioGroupId}' in "${audioLang}" was found, skipping`);
              }
            }
          }
        
        
        
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

  getAudioManifest(bw) {
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

  _loadAudioManifest(audioManifestUri, audioGroupId, audioLang, _injectAudioManifest) {
    return new Promise((resolve, reject) => {
      const parser = m3u8.createStream();

      parser.on('m3u', m3u => {
        if (!this.playlists[audioGroupId][audioLang]) {
          this.playlists[audioGroupId] = m3u;
        }

        let playlistItems = this.playlists[audioGroupId][audioLang].items.PlaylistItem;
        playlistItems[0].set('discontinuity', true);
        let repetition = 0;
        while (repetition < this.repetitions - 1) {
          this.playlists[audioGroupId][audioLang].items.PlaylistItem = this.playlists[audioGroupId][audioLang].items.PlaylistItem.concat(playlistItems);
          repetition++;
        }
        resolve();
      });
      parser.on('error', (err) => {
        reject("Failed to parse M3U8: " + err);
      });
      if (!_injectAudioManifest) {
        fetch(audioManifestUri)
        .then(res => {
          res.body.pipe(parser);
        })
        .catch(reject);
      } else {
        _injectAudioManifest(audioGroupId, audioLang).pipe(parser);
      }
    });
  }
}

module.exports = HLSRepeatVod;
