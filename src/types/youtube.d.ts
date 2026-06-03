// Minimal ambient typings for the YouTube IFrame Player API.
export {};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}
