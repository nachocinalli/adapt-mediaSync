import Adapt from 'core/js/adapt';
//  import data from 'core/js/data';

import MediaSyncTranscriptView from './MediaSyncTranscriptView';
import MediaSyncChaptersView from './MediaSyncChaptersView';

class MediaSync extends Backbone.Controller {
  initialize() {
    this.listenTo(Adapt, 'app:dataReady', this.onDataReady);
  }

  onDataReady() {
    if (!this.checkIsEnabled()) return;

    this.mediaSyncData = Adapt.course.get('_mediaSync');
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.listenTo(Adapt, {
      'componentView:preRender': this.onComponentViewPreRender
    });
  }

  onComponentViewPreRender(view) {
    const { model } = view;
    if (!this.isMediaComponent(model) || !this.hasSync(model.get('_id'))) return;
    const mediaSyncItem = this.getMediaSyncItem(model.get('_id'));
    const modelMedia = model.get('_media');
    const chapters = mediaSyncItem._chapters || [];

    model.set({
      _media: {
        ...modelMedia,
        chapters
      },
      mediaSyncTranscript: '<div class="media__sync-transcriptcontainer"></div>',
      mediaSyncChapters: '<div class="media__sync-chapterscontainer"></div>'
    });

    this.listenTo(model, 'change:_isReady', this.onComponentViewReady);
  }

  onComponentViewReady(model) {
    const mediaView = Adapt.findViewByModelId(model.get('_id'));

    if (!mediaView) return;
    mediaView.el.classList.add('has-media-sync');
    _.delay(() => {
      this.renderMediaSyncTranscript(mediaView);
      this.renderMediaSyncChapters(mediaView);

      window.dispatchEvent(new Event('resize'));
    }, 500);
  }

  renderMediaSyncTranscript(mediaView) {
    const $mediaSyncTranscript = mediaView.$el.find('.media__sync-transcriptcontainer');
    console.log('$mediaSyncTranscript', $mediaSyncTranscript);
    if (mediaView.$el.find('.media__sync-transcriptcontainer .mediasync__transcript').length === 0) {
      const mediaSyncTranscriptView = new MediaSyncTranscriptView({ model: mediaView.model });
      $mediaSyncTranscript.append(mediaSyncTranscriptView.el);
    }
  }

  renderMediaSyncChapters(mediaView) {
    const $mediaSyncChapters = mediaView.$el.find('.media__sync-chapterscontainer');

    if (mediaView.$el.find('.media__sync-chapterscontainer .mediasync__chapters').length === 0) {
      const mediaSyncChaptersView = new MediaSyncChaptersView({ model: mediaView.model });
      $mediaSyncChapters.append(mediaSyncChaptersView.el);
    }
  }

  checkIsEnabled() {
    const mediaSync = Adapt.course.get('_mediaSync');
    return mediaSync?._isEnabled ?? false;
  }

  isMediaComponent(model) {
    return model.get('_component') === 'media';
  }

  getMediaSyncItem(mediaId) {
    return this.mediaSyncData?._items.find((item) => item._mediaId === mediaId);
  }

  hasSync(mediaId) {
    return this.mediaSyncData?._items.some((item) => item._mediaId === mediaId) ?? false;
  }
}

export default new MediaSync();
