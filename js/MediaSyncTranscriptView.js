import React from 'react';
import ReactDOM from 'react-dom';
import { templates } from 'core/js/reactHelpers';

class MediaSyncTranscriptView extends Backbone.View {
  className() {
    return ['mediasync__transcript'].filter(Boolean).join(' ');
  }

  initialize() {
    this.render();
  }

  render() {
    console.log('render', this.model);
    ReactDOM.render(<templates.mediaSyncTranscript {...this.model.toJSON()} />, this.el);
  }
}

export default MediaSyncTranscriptView;
