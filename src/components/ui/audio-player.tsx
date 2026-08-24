'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from './button';

interface AudioPlayerProps {
  src?: string;
  title?: string;
  durationInSeconds?: number;
  className?: string;
}

export function AudioPlayer({ src, title, durationInSeconds, className = '' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationInSeconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (durationInSeconds && durationInSeconds > 0) {
      setDuration(durationInSeconds);
    }
  }, [durationInSeconds]);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio playback error:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && (!duration || duration === 0)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const speed = parseFloat(e.target.value);
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  return (
    <div
      className={`bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm ${className}`}
      role="region"
      aria-label={title ? `Audio player for ${title}` : 'Audio player'}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {title && (
        <div className="text-sm font-semibold text-slate-800 truncate" id="audio-title">
          {title}
        </div>
      )}

      {/* Primary Player Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={togglePlayPause}
          className="h-10 w-10 rounded-full border-green-600 text-green-700 hover:bg-green-50 shrink-0 focus:ring-2 focus:ring-green-500"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>

        {/* Reset / Restart */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0"
          aria-label="Restart audio from beginning"
          title="Restart"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Scrub Bar */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-slate-500 w-10 text-right font-mono">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleScrub}
            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Seek audio position slider"
            aria-valuemin={0}
            aria-valuemax={duration || 100}
            aria-valuenow={currentTime}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          />
          <span className="text-xs text-slate-500 w-10 font-mono">
            {formatTime(duration)}
          </span>
        </div>

        {/* Playback Speed Control */}
        <div className="flex items-center gap-1 shrink-0">
          <label htmlFor="playback-speed" className="sr-only">
            Playback Speed
          </label>
          <select
            id="playback-speed"
            value={playbackSpeed}
            onChange={handleSpeedChange}
            className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
            aria-label="Playback speed selector"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
        </div>

        {/* Mute Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0"
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
