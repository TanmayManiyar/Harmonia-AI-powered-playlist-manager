import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store';
import { api } from '../../services/api';

let apiPromise: Promise<void> | null = null;

/** Load the YouTube IFrame API exactly once. */
function loadYouTubeApi(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/**
 * PlayerHost — owns the (audio-only, off-screen) YouTube player and bridges
 * the imperative IFrame API to the reactive player store. Rendered once.
 */
export const PlayerHost: React.FC = () => {
  const playerRef = useRef<any>(null);
  const readyRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull primitives we react to
  const current = usePlayerStore((s) => s.queue[s.index] ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const seekTarget = usePlayerStore((s) => s.seekTarget);

  const videoId = current?.youtubeId || '';
  const loadedIdRef = useRef<string>('');

  // Initialise the player once
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || playerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '120',
        width: '200',
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1 },
        events: {
          onReady: () => {
            readyRef.current = true;
            playerRef.current.setVolume(usePlayerStore.getState().volume);
            const state = usePlayerStore.getState();
            const vid = state.queue[state.index]?.youtubeId;
            if (vid && state.isPlaying) {
              playerRef.current.loadVideoById(vid);
              loadedIdRef.current = vid;
            }
          },
          onStateChange: (e: any) => {
            // YT.PlayerState.ENDED === 0
            if (e.data === 0) usePlayerStore.getState().onTrackEnd();
          },
        },
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lazily resolve the current song's video id on play (then persist it)
  const resolvingRef = useRef<string>('');
  useEffect(() => {
    if (!current || current.youtubeId) return;
    if (resolvingRef.current === current.id) return;
    resolvingRef.current = current.id;
    const songId = current.id;
    api
      .resolveSong(current.title, current.artist)
      .then(({ youtubeId }) => {
        const st = usePlayerStore.getState();
        if (st.queue[st.index]?.id !== songId) return; // moved on already
        if (youtubeId) {
          st.resolveCurrent(youtubeId);
          if (st.queuePlaylistId) {
            api.saveSongYoutubeId(st.queuePlaylistId, songId, youtubeId);
            usePlaylistStore.getState().setSongYoutubeId(st.queuePlaylistId, songId, youtubeId);
          }
        } else {
          st.pause(); // nothing found — don't spin through the queue
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.youtubeId]);

  // Load a new video when the current track changes
  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return;
    if (videoId && videoId !== loadedIdRef.current) {
      playerRef.current.loadVideoById(videoId);
      loadedIdRef.current = videoId;
    }
  }, [videoId]);

  // Play / pause
  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return;
    if (!videoId) return;
    if (isPlaying) {
      if (loadedIdRef.current !== videoId) {
        playerRef.current.loadVideoById(videoId);
        loadedIdRef.current = videoId;
      } else {
        playerRef.current.playVideo();
      }
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying, videoId]);

  // Volume
  useEffect(() => {
    if (readyRef.current && playerRef.current) playerRef.current.setVolume(volume);
  }, [volume]);

  // Seek requests
  useEffect(() => {
    if (seekTarget == null) return;
    if (readyRef.current && playerRef.current) playerRef.current.seekTo(seekTarget, true);
    usePlayerStore.getState().clearSeek();
  }, [seekTarget]);

  // Poll progress while playing
  useEffect(() => {
    const id = setInterval(() => {
      const st = usePlayerStore.getState();
      // Sleep timer
      if (st.sleepAt && Date.now() >= st.sleepAt) {
        st.pause();
        st.setSleepTimer(null);
        return;
      }
      if (!readyRef.current || !playerRef.current) return;
      if (!st.isPlaying) return;
      const t = playerRef.current.getCurrentTime?.() ?? 0;
      const d = playerRef.current.getDuration?.() ?? 0;
      st.setProgress(t, d);
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Off-screen but present so playback continues across views
  return (
    <div aria-hidden="true" className="pointer-events-none fixed -left-[9999px] bottom-0 h-[120px] w-[200px] opacity-0">
      <div ref={containerRef} />
    </div>
  );
};
