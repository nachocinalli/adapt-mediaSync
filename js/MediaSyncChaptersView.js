import React from 'react';
import ReactDOM from 'react-dom';
import { templates } from 'core/js/reactHelpers';

class MediaSyncChaptersView extends Backbone.View {
  className() {
    return ['mediasync__chapters'].filter(Boolean).join(' ');
  }

  initialize() {
    this.render();
  }

  render() {
    ReactDOM.render(<templates.mediaSyncChapters {...this.model.toJSON()} />, this.el);
  }
}

export default MediaSyncChaptersView;
