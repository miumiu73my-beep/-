const TRACK_ROOT = "./assets/bgm/";

export const BGM_TRACKS = Object.freeze({
  title: { file: "bgm_title.mp3", label: "タイトル" },
  home: { file: "bgm_home.mp3", label: "自宅" },
  farm: { file: "bgm_farm.mp3", label: "畑" },
  laboratory: { file: "bgm_laboratory.mp3", label: "研究所" },
  field: { file: "bgm_field.mp3", label: "探索" },
  event: { file: "bgm_event.mp3", label: "イベント" },
});

const SCREEN_TRACKS = Object.freeze({
  title: "title",
  home: "home",
  field: "farm",
  lab: "laboratory",
  exploration: "field",
  event: "event",
});

export function resolveBgmTrack(screenKey, dateSession = null) {
  if (screenKey === "home" && dateSession?.eventId) return "event";
  return SCREEN_TRACKS[screenKey] ?? null;
}

function clampVolume(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0.5;
}

// HTMLAudioElementを一つだけ使い、画面更新時に同じ曲を再起動しない。
export function createBgmPlayer(onChange = () => {}) {
  const audio = new Audio();
  audio.loop = true;
  audio.preload = "none";

  let enabled = false;
  let activated = false; // iOS/Safariではユーザーの明示的な操作まで再生しない
  let volume = 0.5;
  let desiredKey = null;
  let currentKey = null;
  let status = "off";
  let playId = 0;
  let fadeFrame = null;

  const getState = () => ({ enabled, volume, trackKey: desiredKey, status });
  const notify = () => onChange(getState());

  function cancelFade() {
    if (fadeFrame !== null) {
      cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }
  }

  function fadeIn() {
    cancelFade();
    const startedAt = performance.now();
    audio.volume = 0;

    function tick(now) {
      if (!enabled || status !== "playing") {
        fadeFrame = null;
        return;
      }

      const progress = Math.min(1, Math.max(0, (now - startedAt) / 600));
      audio.volume = volume * progress;

      if (progress < 1) {
        fadeFrame = requestAnimationFrame(tick);
      } else {
        fadeFrame = null;
      }
    }

    fadeFrame = requestAnimationFrame(tick);
  }

  function reportPlayFailure(error, key, attemptId) {
    if (attemptId !== playId || key !== desiredKey) return;

    cancelFade();
    if (audio.error || error?.name === "NotSupportedError") {
      status = "missing";
    } else if (error?.name === "NotAllowedError") {
      status = "blocked";
    } else {
      status = "error";
    }
    notify();
  }

  function attemptPlay(forceRetry = false) {
    if (
      !enabled ||
      !activated ||
      !desiredKey ||
      document.visibilityState === "hidden"
    ) return;

    const key = desiredKey;

    if (key === currentKey) {
      if (status === "playing" && !audio.paused) return;
      if (!forceRetry && ["missing", "blocked", "error"].includes(status)) {
        return;
      }
    }

    const attemptId = ++playId;
    cancelFade();

    if (key !== currentKey) {
      audio.pause();
      currentKey = key;
      audio.src = new URL(TRACK_ROOT + BGM_TRACKS[key].file, document.baseURI).href;
      audio.load();
    }

    audio.volume = 0;
    status = "loading";
    notify();

    try {
      // play()はユーザー操作のコールスタック内で呼ぶ。非同期fade待ちはしない。
      Promise.resolve(audio.play()).then(
        () => {
          if (attemptId !== playId || key !== desiredKey || !enabled) return;
          status = "playing";
          fadeIn();
          notify();
        },
        (error) => reportPlayFailure(error, key, attemptId)
      );
    } catch (error) {
      reportPlayFailure(error, key, attemptId);
    }
  }

  audio.addEventListener("error", () => {
    if (!enabled || currentKey !== desiredKey) return;
    cancelFade();
    status = "missing";
    notify();
  });

  function setScene(screenKey, dateSession = null) {
    const key = resolveBgmTrack(screenKey, dateSession);
    if (key === desiredKey) return;

    desiredKey = key;

    if (!key) {
      ++playId;
      cancelFade();
      audio.pause();
      currentKey = null;
      status = enabled ? "ready" : "off";
      notify();
    } else if (enabled && activated) {
      attemptPlay();
    } else {
      notify();
    }
  }

  // セーブからの復元時はON設定でも再生せず、iOS等の自動再生制限を尊重する。
  function applyPreferences(settings = {}) {
    ++playId;
    cancelFade();
    audio.pause();
    enabled = settings.bgmEnabled === true;
    volume = clampVolume(settings.bgmVolume);
    activated = false;
    desiredKey = null;
    currentKey = null;
    status = enabled ? "ready" : "off";
    notify();
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    activated = true;

    if (!enabled) {
      ++playId;
      cancelFade();
      audio.pause();
      status = "off";
      notify();
      return;
    }

    if (!desiredKey) {
      status = "ready";
      notify();
    } else {
      attemptPlay(true);
    }
  }

  function resume() {
    enabled = true;
    activated = true;
    attemptPlay(true);
  }

  function changeVolume(value) {
    volume = clampVolume(value);

    if (status === "playing") {
      cancelFade();
      audio.volume = volume;
    }
    notify();
  }

  function pauseForBackground() {
    if (!enabled || !activated) return;
    ++playId;
    cancelFade();
    audio.pause();
    status = "paused";
    notify();
  }

  function resumeFromBackground() {
    if (enabled && activated && status === "paused") {
      attemptPlay(true);
    }
  }

  return {
    getState,
    setScene,
    applyPreferences,
    setEnabled,
    resume,
    changeVolume,
    pauseForBackground,
    resumeFromBackground,
  };
}
