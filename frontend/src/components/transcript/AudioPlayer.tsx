'use client';
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  mimeType: string;
  onTimeUpdate?: (time: number) => void;
}

export function AudioPlayer({ src, mimeType, onTimeUpdate }: AudioPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const isVideo = mimeType.startsWith('video/');

  const handleTimeUpdate = () => {
    const t = mediaRef.current?.currentTime ?? 0;
    setCurrentTime(t);
    onTimeUpdate?.(t);
  };

  const seek = (pct: number) => {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = pct * duration;
  };

  const skip = (sec: number) => {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + sec));
  };

  const toggle = () => {
    if (!mediaRef.current) return;
    playing ? mediaRef.current.pause() : mediaRef.current.play();
  };

  return (
    <div className="bg-white rounded-lg border border-border p-4 space-y-3">
      {isVideo && (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          className="w-full rounded-md bg-black max-h-64"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(mediaRef.current?.duration ?? 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}
      {!isVideo && (
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(mediaRef.current?.duration ?? 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {/* Progress bar */}
      <div
        className="h-2 bg-gray-100 rounded-full cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek((e.clientX - rect.left) / rect.width);
        }}
      >
        <div
          className="h-full bg-primary rounded-full relative"
          style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skip(-10)}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="icon" className="h-9 w-9" onClick={toggle}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skip(10)}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => { setMuted(!muted); if (mediaRef.current) mediaRef.current.muted = !muted; }}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
