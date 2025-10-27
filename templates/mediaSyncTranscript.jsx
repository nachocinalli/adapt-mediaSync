import React, { useEffect, useState, useCallback, useRef } from 'react';
// import data from 'core/js/data';
import Adapt from 'core/js/adapt';

export default function MediaSyncTranscript({ _id }) {
  const [tracks, setTracks] = useState([]);
  const [activeTrack, setActiveTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [visitedTimes, setVisitedTimes] = useState(new Set());
  const [entriesTimes, setEntriesTimes] = useState([]);

  const mediaViewRef = useRef(null);
  const mediaElementRef = useRef(null);
  const playerRef = useRef(null);
  const ariaLabels = Adapt.course.get('_globals')._extensions._mediaSync;

  const initializeTracks = useCallback(() => {
    console.log('initializeTracks', playerRef.current);
    if (!playerRef.current?.tracks) return;

    const subtitlesTracks = playerRef.current.tracks.filter((track) => track.kind === 'subtitles');
    setTracks(subtitlesTracks);

    const defaultTrack = subtitlesTracks.find((track) => track.mode === 'showing') || subtitlesTracks[0];
    if (defaultTrack) {
      if (defaultTrack.mode !== 'showing') {
        defaultTrack.mode = 'showing';
      }
      setActiveTrack(defaultTrack);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const newTime = mediaElementRef.current.currentTime;
    setCurrentTime(newTime);
    setVisitedTimes((prevVisitedTimes) => {
      const newVisitedTimes = new Set(prevVisitedTimes);
      entriesTimes.forEach((entry) => {
        if (newTime > entry.stop) {
          newVisitedTimes.add(entry.start);
        }
      });
      return newVisitedTimes;
    });
  }, [entriesTimes]);

  useEffect(() => {
    mediaViewRef.current = Adapt.findViewByModelId(_id);
    mediaElementRef.current = mediaViewRef.current.mediaElement;
    playerRef.current = mediaElementRef.current.player;
    console.log('mediaViewRef.current.mediaElement', mediaViewRef.current.mediaElement);
    // console.log('mediaElementRef', mediaElementRef);
    mediaElementRef.current.addEventListener('timeupdate', handleTimeUpdate);

    initializeTracks();

    return () => {
      mediaElementRef.current.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [_id, initializeTracks, handleTimeUpdate]);

  useEffect(() => {
    if (activeTrack?.entries?.times) {
      setEntriesTimes(activeTrack.entries.times);
    } else {
      setEntriesTimes([]);
    }
  }, [activeTrack?.entries?.times]);

  const handleTrackChange = useCallback(
    (track) => {
      if (activeTrack) activeTrack.mode = 'disabled';
      track.mode = 'showing';
      setActiveTrack(track);
      setVisitedTimes(new Set());
    },
    [activeTrack]
  );

  const handleCuePointClick = useCallback((time) => {
    if (mediaElementRef.current) {
      if (mediaElementRef.current.paused) mediaElementRef.current.play();
      mediaElementRef.current.setCurrentTime(time);
    }
  }, []);

  const renderTrackContent = useCallback(() => {
    console.log('renderTrackContent', activeTrack);
    if (!activeTrack?.entries) return null;
    const { text, times } = activeTrack.entries;
    if (!text || !times) return null;
    return times.map((entry, index) => {
      const isActive = currentTime >= entry.start && currentTime <= entry.stop;
      const isVisited = visitedTimes.has(entry.start);

      return (
        <p key={index} className={isActive ? 'is-active' : isVisited ? 'is-visited' : ''}>
          <button onClick={() => handleCuePointClick(entry.start)} aria-label={`${ariaLabels.setCurrentTimeLabel} ${text[index]}`}>
            <span className='icon icon-video-play' data-item={index + 1}></span>
          </button>
          {text[index]}
        </p>
      );
    });
  }, [activeTrack, currentTime, visitedTimes, handleCuePointClick, ariaLabels.setCurrentTimeLabel]);

  return (
    <div className='mediasync__transcript__inner'>
      {tracks.length > 1 && (
        <ul className='mediasync__transcript-controls'>
          {tracks.map((track, index) => (
            <li key={index} className={track === activeTrack ? 'is-active' : ''}>
              <button
                className='btn-text'
                onClick={() => handleTrackChange(track)}
                aria-label={`${ariaLabels.selectLangLabel} ${track.srclang || `${index + 1}`}`}
              >
                {track.srclang || `Track ${index + 1}`}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className='mediasync__transcript-tracks'>{renderTrackContent()}</div>
    </div>
  );
}
