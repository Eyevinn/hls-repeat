const m3u8 = require('@eyevinn/m3u8');
const url = require('url');
const fetch = require('node-fetch');

class HLSRepeatVod {
  constructor(vodManifestUri, repetitions, options) {
    this.masterManifestUri = vodManifestUri;
    this.playlists = {};
    this.repetitions = repetitions;
    this.bandwiths = [];
    this.audioSegments = {};
    this.subtitleSegments = {};
  }

  load(_injectMasterManifest, _injectMediaManifest, _injectAudioManifest, _injectSubtitleManifest) {
    return new Promise((resolve, reject) => {
      const parser = m3u8.createStream();

      parser.on('m3u', m3u => {
        this.m3u = m3u;
        let mediaManifestPromises = [];
        let audioManifestPromises = [];
        let subtitleManifestPromises = [];
        let audioGroups = {};
        let subtitleGroups = {};
        let baseUrl;
        const m = this.masterManifestUri.match(/^(.*)\/.*?$/);
        if (m) {
          baseUrl = m[1] + '/';
        }

        for (let i = 0; i < m3u.items.StreamItem.length; i++) {
          const streamItem = m3u.items.StreamItem[i];
          this.bandwiths.push(streamItem.get('bandwidth'));

          const mediaManifestUrl = url.resolve(baseUrl, streamItem.get('uri'));
          if (!m3u.items.MediaItem.find((mediaItem) => mediaItem.get("type") === "AUDIO" && mediaItem.get("uri") == streamItem.get("uri"))) {
            mediaManifestPromises.push(this._loadMediaManifest(mediaManifestUrl, streamItem.get("bandwidth"), _injectMediaManifest));
          }

          if (streamItem.attributes.attributes["audio"]) {
            let audioGroupId = streamItem.attributes.attributes["audio"];
            if (!this.audioSegments[audioGroupId]) {
              this.audioSegments[audioGroupId] = {};
            }

            let audioGroupItems = m3u.items.MediaItem.filter((item) => {
              return item.attributes.attributes.type === "AUDIO" && item.attributes.attributes["group-id"] === audioGroupId;
            });
            let audioLanguages = audioGroupItems.map((item) => {
              let itemLang;
              if (!item.attributes.attributes["language"]) {
                itemLang = item.attributes.attributes["name"];
              } else {
                itemLang = item.attributes.attributes["language"];
              }
              if (!this.audioSegments[audioGroupId][itemLang]) {
                this.audioSegments[audioGroupId][itemLang] = [];
              }
              return (item = itemLang);
            });

            for (let j = 0; j < audioLanguages.length; j++) {
              let audioLang = audioLanguages[j];
              let audioUri = audioGroupItems[j].attributes.attributes.uri
              if (!audioUri) {
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
                if (!audioGroups[audioGroupId][audioLang]) {
                  audioGroups[audioGroupId][audioLang] = true;
                  audioManifestPromises.push(this._loadAudioManifest(audioManifestUrl, audioGroupId, audioLang, _injectAudioManifest));
                }
              }
            }
          }

          if (streamItem.attributes.attributes["subtitles"]) {
            let subtitleGroupId = streamItem.attributes.attributes["subtitles"];
            if (!this.subtitleSegments[subtitleGroupId]) {
              this.subtitleSegments[subtitleGroupId] = {};
            }

            let subtitleGroupItems = m3u.items.MediaItem.filter((item) => {
              return item.attributes.attributes.type === "SUBTITLES" && item.attributes.attributes["group-id"] === subtitleGroupId;
            });
            
            let subtitleLanguages = subtitleGroupItems.map((item) => {
              let itemLang;
              if (!item.attributes.attributes["language"]) {
                itemLang = item.attributes.attributes["name"];
              } else {
                itemLang = item.attributes.attributes["language"];
              }
              if (!this.subtitleSegments[subtitleGroupId][itemLang]) {
                this.subtitleSegments[subtitleGroupId][itemLang] = [];
              }
              return (item = itemLang);
            });

            for (let j = 0; j < subtitleLanguages.length; j++) {
              let subtitleLang = subtitleLanguages[j];
              let subtitleUri = subtitleGroupItems[j].attributes.attributes.uri;
              
              if (subtitleUri) {
                let subtitleManifestUrl = url.resolve(baseUrl, subtitleUri);
                if (!subtitleGroups[subtitleGroupId]) {
                  subtitleGroups[subtitleGroupId] = {};
                }
                
                if (!subtitleGroups[subtitleGroupId][subtitleLang]) {
                  subtitleGroups[subtitleGroupId][subtitleLang] = true;
                  subtitleManifestPromises.push(this._loadSubtitleManifest(subtitleManifestUrl, subtitleGroupId, subtitleLang, _injectSubtitleManifest));
                }
              }
            }
          }
        }
        Promise.all(mediaManifestPromises.concat(audioManifestPromises).concat(subtitleManifestPromises))
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

  getAudioManifest(audioGroupId, lang) {
    if (!this.audioSegments[audioGroupId]) {
      const keygroup = Object.keys(this.audioSegments)
      const audioSegementsGroup = this.audioSegments[keygroup[0]]
      if (!audioSegementsGroup[lang]) {
        const keylang = Object.keys(audioSegementsGroup)
        return audioSegementsGroup[keylang[0]].toString();
      }
      return audioSegementsGroup[lang].toString();
    } else if (!this.audioSegments[audioGroupId][lang]) {
      const keylang = Object.keys(this.audioSegments[audioGroupId])
      return this.audioSegments[audioGroupId][keylang[0]].toString();
    }
    return this.audioSegments[audioGroupId][lang].toString();
  }

  getSubtitleManifest(subtitleGroupId, lang) {
    if (!this.subtitleSegments[subtitleGroupId]) {
      const keygroup = Object.keys(this.subtitleSegments);
      if (keygroup.length === 0) {
        return null;
      }
      const subtitleSegmentsGroup = this.subtitleSegments[keygroup[0]];
      if (!subtitleSegmentsGroup[lang]) {
        const keylang = Object.keys(subtitleSegmentsGroup);
        if (keylang.length === 0) {
          return null;
        }
        return subtitleSegmentsGroup[keylang[0]].toString();
      }
      return subtitleSegmentsGroup[lang].toString();
    } else if (!this.subtitleSegments[subtitleGroupId][lang]) {
      const keylang = Object.keys(this.subtitleSegments[subtitleGroupId]);
      if (keylang.length === 0) {
        return null;
      }
      return this.subtitleSegments[subtitleGroupId][keylang[0]].toString();
    }
    return this.subtitleSegments[subtitleGroupId][lang].toString();
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
        if (!this.audioSegments[audioGroupId][audioLang].length) {
          this.audioSegments[audioGroupId][audioLang] = m3u;
        }

        let playlistItems = this.audioSegments[audioGroupId][audioLang].items.PlaylistItem;
        playlistItems[0].set('discontinuity', true);
        let repetition = 0;
        while (repetition < this.repetitions - 1) {
          this.audioSegments[audioGroupId][audioLang].items.PlaylistItem = this.audioSegments[audioGroupId][audioLang].items.PlaylistItem.concat(playlistItems);
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

  _loadSubtitleManifest(subtitleManifestUri, subtitleGroupId, subtitleLang, _injectSubtitleManifest) {
    return new Promise((resolve, reject) => {
      const parser = m3u8.createStream();

      parser.on('m3u', m3u => {
        if (!this.subtitleSegments[subtitleGroupId][subtitleLang].length) {
          this.subtitleSegments[subtitleGroupId][subtitleLang] = m3u;
        }

        let playlistItems = this.subtitleSegments[subtitleGroupId][subtitleLang].items.PlaylistItem;
        playlistItems[0].set('discontinuity', true);
        let repetition = 0;
        while (repetition < this.repetitions - 1) {
          this.subtitleSegments[subtitleGroupId][subtitleLang].items.PlaylistItem = this.subtitleSegments[subtitleGroupId][subtitleLang].items.PlaylistItem.concat(playlistItems);
          repetition++;
        }
        resolve();
      });
      parser.on('error', (err) => {
        reject("Failed to parse M3U8: " + err);
      });
      if (!_injectSubtitleManifest) {
        fetch(subtitleManifestUri)
          .then(res => {
            res.body.pipe(parser);
          })
          .catch(reject);
      } else {
        _injectSubtitleManifest(subtitleGroupId, subtitleLang).pipe(parser);
      }
    });
  }
}

module.exports = HLSRepeatVod;
