// WebAudio synthesis for EMBERSECT

let audioCtx = null;
let masterGain = null;
let muted = false;
let ambientTimer = null;

export function initAudio() {
  if (audioCtx) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(audioCtx.destination);
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    startAmbientMusic();
  } catch (e) {
    console.warn('WebAudio not supported or blocked', e);
  }
}

export function toggleAudioMute() {
  muted = !muted;
  if (masterGain && audioCtx) {
    masterGain.gain.value = muted ? 0.0 : 0.4;
  }
  return muted;
}

export function isAudioMuted() {
  return muted;
}

// Helper: white noise buffer for whooshes/crackles
function createNoiseBuffer(duration = 0.5) {
  if (!audioCtx) return null;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// 1. Sword-qi slash: filtered noise whoosh with pitch sweep
export function playSwordSlash() {
  if (!audioCtx || muted) return;
  try {
    const noise = audioCtx.createBufferSource();
    noise.buffer = createNoiseBuffer(0.25);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, audioCtx.currentTime + 0.2);
    filter.Q.value = 3;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.24);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start();
    noise.stop(audioCtx.currentTime + 0.25);
  } catch (e) {}
}

// 2. Talisman detonation: low thump + crackle
export function playTalismanDetonate() {
  if (!audioCtx || muted) return;
  try {
    // Thump
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.7, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);

    // Crackle noise
    const noise = audioCtx.createBufferSource();
    noise.buffer = createNoiseBuffer(0.2);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    const nGain = audioCtx.createGain();
    nGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(masterGain);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.2);
  } catch (e) {}
}

// 3. Demon death: descending ghostly wail
export function playDemonDeath() {
  if (!audioCtx || muted) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {}
}

// 4. Realm-up: bright rising pentatonic chime (guqin pluck)
export function playRealmUp() {
  if (!audioCtx || muted) return;
  try {
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const t = audioCtx.currentTime + idx * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.5, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch (e) {}
}

// 5. Breakthrough: deep gong + rising shimmer
export function playBreakthrough() {
  if (!audioCtx || muted) return;
  try {
    // Gong low
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 1.2);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);

    // Shimmer
    playRealmUp();
  } catch (e) {}
}

// 6. Wisp collect: soft bell ping
export function playWispCollect() {
  if (!audioCtx || muted) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {}
}

// 7. Wisp reaching altar: warm healing chime
export function playWispAltar() {
  if (!audioCtx || muted) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
    osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.3); // E5

    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {}
}

// 8. Wave clear / night clear jingle
export function playWaveClear() {
  if (!audioCtx || muted) return;
  try {
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const t = audioCtx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch (e) {}
}

export function playNightClear() {
  if (!audioCtx || muted) return;
  try {
    const notes = [392, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
    notes.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const t = audioCtx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch (e) {}
}

// 9. Altar hit: harsh dissonant thud
export function playAltarHit() {
  if (!audioCtx || muted) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 0.35);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    gain.gain.setValueAtTime(0.7, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {}
}

// 10. Boss alarm: two-tone low horn
export function playBossAlarm() {
  if (!audioCtx || muted) return;
  try {
    [150, 110].forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      const t = audioCtx.currentTime + i * 0.3;
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch (e) {}
}

// 11. Ambient music loop: slow pentatonic plucks over low drone
function startAmbientMusic() {
  if (ambientTimer) return;
  // Play a soft ambient note every 6 seconds
  ambientTimer = setInterval(() => {
    if (!audioCtx || muted) return;
    try {
      const drone = audioCtx.createOscillator();
      const dGain = audioCtx.createGain();
      drone.type = 'sine';
      drone.frequency.value = 130.81; // C3 drone
      dGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      dGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 2.0);
      dGain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 5.0);
      drone.connect(dGain);
      dGain.connect(masterGain);
      drone.start();
      drone.stop(audioCtx.currentTime + 5.0);

      // Pentatonic pluck (C4, D4, G4, A4)
      const pent = [261.63, 293.66, 392.00, 440.00];
      const freq = pent[Math.floor(Math.random() * pent.length)];
      const pluck = audioCtx.createOscillator();
      const pGain = audioCtx.createGain();
      pluck.type = 'triangle';
      pluck.frequency.value = freq;
      pGain.gain.setValueAtTime(0.15, audioCtx.currentTime + 1.0);
      pGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.5);
      pluck.connect(pGain);
      pGain.connect(masterGain);
      pluck.start(audioCtx.currentTime + 1.0);
      pluck.stop(audioCtx.currentTime + 3.5);
    } catch (e) {}
  }, 6000);
}
