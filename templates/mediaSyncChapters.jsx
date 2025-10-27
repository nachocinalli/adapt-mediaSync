import React, { useEffect, useState, useRef, useCallback } from 'react';
// import data from 'core/js/data';
import Adapt from 'core/js/adapt';

export default function MediaSyncChapters({ _id }) {
  const [tracks, setTracks] = useState([]);
  const [activeTrack, setActiveTrack] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [visitedChapters, setVisitedChapters] = useState(new Set());
  const [entriesTimes, setEntriesTimes] = useState([]);

  const mediaViewRef = useRef(null);
  const mediaElementRef = useRef(null);
  const playerRef = useRef(null);
  const ariaLabels = Adapt.course.get('_globals')._extensions._mediaSync;

  const initializeTracks = useCallback(() => {
    if (!playerRef.current || !playerRef.current.tracks) return;

    const chapterTracks = playerRef.current.tracks.filter((track) => track.kind === 'chapters');
    setTracks(chapterTracks);

    const defaultTrack = chapterTracks.find((track) => track.mode === 'showing') || chapterTracks[0];

    if (defaultTrack && defaultTrack.mode !== 'showing') {
      defaultTrack.mode = 'showing';
    }
    setActiveTrack(defaultTrack);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const newTime = mediaElementRef.current.currentTime;
    setCurrentTime(newTime);
    setVisitedChapters((prevVisitedChapters) => {
      const newVisitedChapters = new Set(prevVisitedChapters);

      entriesTimes.forEach((entry) => {
        if (newTime > entry.stop) {
          newVisitedChapters.add(entry.start);
        }
      });
      return newVisitedChapters;
    });
  }, [entriesTimes]);

  useEffect(() => {
    mediaViewRef.current = Adapt.findViewByModelId(_id);
    mediaElementRef.current = mediaViewRef.current.mediaElement;
    playerRef.current = mediaElementRef.current.player;

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

  useEffect(() => {
    if (entriesTimes.length) {
      const newChapters = entriesTimes.map((entry, index) => ({
        start: entry.start,
        stop: entry.stop,
        text: activeTrack.entries.text[index]
      }));
      setChapters(newChapters);
    } else {
      setChapters([]);
    }
  }, [entriesTimes, activeTrack]);

  const handleTrackChange = useCallback(
    (track) => {
      if (activeTrack) {
        activeTrack.mode = 'disabled';
      }
      track.mode = 'showing';
      setActiveTrack(track);
      setVisitedChapters(new Set());
    },
    [activeTrack]
  );

  const handleChapterClick = useCallback((time) => {
    if (mediaElementRef.current) {
      if (mediaElementRef.current.paused) mediaElementRef.current.play();
      mediaElementRef.current.currentTime = time;
    }
  }, []);

  return (
    <nav className='mediasync__chapters__nav'>
      {tracks.length > 1 && (
        <ul className='mediasync__chapters-controls'>
          {tracks.map((track, index) => (
            <li key={index} className={`${track === activeTrack ? 'is-active' : ''}`}>
              <button className={'btn-text'} onClick={() => handleTrackChange(track)} aria-label={`${ariaLabels.selectLangLabel} ${track.label}`}>
                {track.label || `${index + 1}`}
              </button>
            </li>
          ))}
        </ul>
      )}
      <ul className='mediasync__chapters-list'>
        {chapters.map((chapter, index) => {
          const isActive = currentTime >= chapter.start && currentTime <= chapter.stop;
          const isVisited = visitedChapters.has(chapter.start);
          return (
            <li key={index} className={isActive ? 'is-active' : isVisited ? 'is-visited' : ''}>
              <button
                className='btn-text'
                onClick={() => handleChapterClick(chapter.start)}
                aria-label={`${ariaLabels.setCurrentTimeLabel}: ${chapter.text}`}
                data-item={index + 1}
              >
                {chapter.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
