#!/usr/bin/env python3
"""Synthesize an original lo-fi music bed for a reel.

Everything is generated from sine waves and noise, so there is no sample or
third-party recording in it and no license to clear.

Usage: python3 tools/music/lofi.py out.wav

The track is 16 bars at 96 BPM = 40 s. Each 5 s reel scene is exactly 2 bars,
so every scene cut lands on a downbeat.
  bars 1-2   intro: piano chords + clock tick (scene 1, the hook)
  bars 3-8   A minor groove, a little tense (scenes 2-4, the problem)
  bars 9-15  C major, lighter, with a melody (scenes 5-7, what to do)
  bar  16    final chord rings out, fade over the last 2 s (scene 8)
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 16
DUR = BARS * BAR
N = int(round(DUR * SR))
rng = np.random.default_rng(7)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def at(bar, beat=1.0):
    """Time in seconds of a 1-based bar and beat."""
    return (bar - 1) * BAR + (beat - 1) * BEAT


def _mag(n, fn):
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1e-6
    return fn(f)


def lowpass(x, fc, order=2):
    X = np.fft.rfft(x, axis=-1)
    X *= _mag(x.shape[-1], lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))
    return np.fft.irfft(X, x.shape[-1], axis=-1)


def highpass(x, fc, order=2):
    X = np.fft.rfft(x, axis=-1)
    X *= _mag(x.shape[-1], lambda f: 1 / np.sqrt(1 + (fc / f) ** (2 * order)))
    return np.fft.irfft(X, x.shape[-1], axis=-1)


def add(bus, t0, sig, gain=1.0, pan=0.0):
    """Mix a mono signal into a stereo bus at time t0 (s), equal-power pan -1..1."""
    i = int(round(t0 * SR))
    if i >= bus.shape[1]:
        return
    sig = sig[: bus.shape[1] - i]
    a = (pan + 1) * np.pi / 4
    bus[0, i : i + len(sig)] += sig * gain * np.cos(a)
    bus[1, i : i + len(sig)] += sig * gain * np.sin(a)


# ---------- instruments ----------

def epiano(freq, dur, vel=0.8, decay=1.6, index=1.5, tail=1.2):
    """Two-operator FM electric piano with a little tape wobble."""
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    wobble = 1 + 0.0016 * np.sin(2 * np.pi * 0.55 * t + rng.uniform(0, 6.28))
    ph = 2 * np.pi * freq * np.cumsum(wobble) / SR
    idx = index * vel * np.exp(-t / 0.3) + 0.45
    tone = np.sin(ph + idx * np.sin(ph))
    tine = 0.08 * vel * np.sin(4 * ph) * np.exp(-t / 0.05)
    env = (1 - np.exp(-t / 0.004)) * np.exp(-t / decay)
    r0 = int(dur * SR)
    env[r0:] *= np.exp(-(t[r0:] - dur) / 0.22)
    return (tone * env + tine * (1 - np.exp(-t / 0.002))) * vel / np.sqrt(freq / 261.6) ** 0.5


def bass(freq, dur, vel=0.8):
    n = int((dur + 0.3) * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    tone = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph) + 0.05 * np.sin(4 * ph)
    env = (1 - np.exp(-t / 0.01)) * np.exp(-t / 1.2)
    r0 = int(dur * SR)
    env[r0:] *= np.exp(-(t[r0:] - dur) / 0.06)
    return np.tanh(1.3 * tone * env) * vel


def kick(vel=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 52 + 80 * np.exp(-t / 0.032)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    click = lowpass(rng.standard_normal(n), 3000) * np.exp(-t / 0.003) * 0.25
    return (body + click) * vel


def snare(vel=1.0):
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.045) * 0.55
    noise = lowpass(highpass(rng.standard_normal(n), 900), 5000) * np.exp(-t / 0.1)
    return (tone + 0.8 * noise) * vel


def hat(vel=1.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    return highpass(rng.standard_normal(n), 6000, 3) * np.exp(-t / 0.016) * vel


def tick(vel=1.0):
    """Soft clock tick for the intro."""
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    blip = np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.006)
    noise = highpass(rng.standard_normal(n), 3000) * np.exp(-t / 0.003)
    return (0.6 * blip + 0.4 * noise) * vel


HATS = [hat() for _ in range(6)]
SNARES = [snare() for _ in range(3)]
KICK = kick()

# ---------- score ----------
# Rootless jazz voicings keep the chords soft and close together.
A_MIN = [  # bar: (bass midi, chord midi notes)
    ("Am9", 45, [60, 64, 67, 71]),
    ("Fmaj9", 41, [57, 60, 64, 67]),
    ("Dm9", 38, [53, 57, 60, 64]),
    ("E7", 40, None),  # sus4 then b9, see below
]
E7SUS = [57, 59, 62, 64]
E7B9 = [56, 59, 62, 65]
C_MAJ = [
    ("Fmaj9", 41, [57, 60, 64, 67]),
    ("G9", 43, [59, 62, 65, 69]),
    ("Cmaj9", 36, [59, 62, 64, 67]),
    ("Am9", 45, [60, 64, 67, 71]),
]

bars = []  # (bar, name, bass, chord, section)
for b in range(1, 9):
    name, bs, ch = A_MIN[(b - 1) % 4]
    bars.append((b, name, bs, ch, "A"))
for b in range(9, 17):
    name, bs, ch = C_MAJ[(b - 9) % 4]
    if b == 15 or b == 16:
        name, bs, ch = C_MAJ[2]
    bars.append((b, name, bs, ch, "B"))

SWING = 0.08 * BEAT  # offbeat 8ths land a bit late


def strum(bus, t0, notes, dur, vel, **kw):
    for k, m in enumerate(notes):
        v = vel * rng.uniform(0.92, 1.04)
        add(bus, t0 + k * 0.014, epiano(hz(m), dur, v, **kw), 0.2, pan=-0.25 + 0.17 * k)


keysA = np.zeros((2, N))
keysB = np.zeros((2, N))
low = np.zeros((2, N))
drums = np.zeros((2, N))
lead = np.zeros((2, N))
kick_times = []

for b, name, bs, ch, sec in bars:
    keys = keysA if sec == "A" else keysB
    # piano comping
    if b <= 2:
        strum(keys, at(b), ch, 3.7 * BEAT, 0.8)
    elif name == "E7":
        strum(keys, at(b), E7SUS, 1.9 * BEAT, 0.8)
        strum(keys, at(b, 3), E7B9, 1.9 * BEAT if b != 8 else 2.0 * BEAT, 0.75)
    elif b == 16:
        strum(keys, at(b), ch, 4 * BEAT, 0.8, decay=2.4, tail=2.0)
    else:
        strum(keys, at(b), ch, 2.3 * BEAT, 0.8)
        strum(keys, at(b, 3.5) + SWING, ch, 1.3 * BEAT, 0.5)

    # bass
    if b <= 2:
        add(low, at(b), bass(hz(bs), 3.8 * BEAT, 0.45), 0.28)
    elif b == 16:
        add(low, at(b), bass(hz(bs), 3.5 * BEAT, 0.7), 0.28)
    else:
        add(low, at(b), bass(hz(bs), 1.7 * BEAT, 0.8), 0.28)
        add(low, at(b, 3.5) + SWING, bass(hz(bs), 0.8 * BEAT, 0.6), 0.28)
        if b != 8:
            add(low, at(b, 4.5) + SWING, bass(hz(bs + 12 if bs < 40 else bs + 7), 0.4 * BEAT, 0.45), 0.28)

    # intro clock tick, scene 1 only
    if b <= 2:
        for q in range(4):
            add(drums, at(b, 1 + q), tick(0.5 if q % 2 else 0.65), 0.22, pan=0.3)
            add(drums, at(b, 1.5 + q) + SWING, tick(0.25), 0.22, pan=0.3)

    # drums: bars 3-15, break on the last beat of bar 8
    if 3 <= b <= 15:
        stop = 4 if b == 8 else 5  # beats before which drums play
        for beat, v in [(1, 1.0), (2.75, 0.45), (3.5, 0.75)]:
            if beat < stop and not (beat == 2.75 and b % 2 == 0):
                tk = at(b, beat) + (SWING if beat == 3.5 else 0)
                add(drums, tk, KICK, 0.45 * v)
                kick_times.append(tk)
        for beat in (2, 4):
            if beat < stop:
                add(drums, at(b, beat), SNARES[rng.integers(3)], 0.22, pan=0.05)
        for e in range(8):
            beat = 1 + e / 2
            if beat < stop:
                tk = at(b, beat) + (SWING if e % 2 else 0)
                add(drums, tk, HATS[rng.integers(6)], 0.2 if e % 2 else 0.28, pan=0.35)
    if b == 16:
        add(drums, at(b), KICK, 0.4)
        kick_times.append(at(b))

# melody for the lighter half (scenes 5-8), one octave above middle C
MELODY = {
    9: [(1, 72), (2.5, 69), (3.5, 67)],
    10: [(1, 71), (2.5, 74)],
    11: [(1, 76), (2.5, 74), (3.5, 72)],
    12: [(1, 71), (2.5, 69), (3.5, 67)],
    13: [(1, 69), (2, 72), (3, 76)],
    14: [(1, 74), (2.5, 71), (3.5, 69)],
    15: [(1, 67), (2.5, 72), (3.5, 74)],
    16: [(1, 76)],
}
for b, notes in MELODY.items():
    for beat, m in notes:
        tk = at(b, beat) + (SWING if beat % 1 else 0)
        d = 3 * BEAT if b == 16 else 0.9 * BEAT
        add(lead, tk, epiano(hz(m), d, 0.7, decay=0.7, index=0.9, tail=1.0), 0.4, pan=0.3)

# ---------- mix ----------
t = np.arange(N) / SR

# sidechain pump: keys and bass dip a little under each kick
duck = np.ones(N)
for tk in kick_times:
    i = int(tk * SR)
    seg = t[i:] - tk
    duck[i:] -= 0.28 * np.exp(-seg / 0.13)
duck = np.clip(duck, 0.6, 1)

# slow tremolo on the keys, half-note rate
trem = 1 + 0.12 * np.sin(2 * np.pi * (BPM / 60 / 2) * t)
keys = lowpass(keysA, 3000) + lowpass(keysB, 4200)
keys[0] *= trem
keys[1] *= 2 - trem
keys *= duck
low = lowpass(low, 600) * duck
lead = lowpass(lead, 4200)
drums = lowpass(drums, 9000)


def reverb(x, tau=0.32, length=1.6, mix=1.0):
    n = int(length * SR)
    ti = np.arange(n) / SR
    out = np.zeros((2, x.shape[1] + n))
    size = 1 << int(np.ceil(np.log2(x.shape[1] + n)))
    for c in range(2):
        ir = lowpass(rng.standard_normal(n), 4500) * np.exp(-ti / tau)
        ir[: int(0.012 * SR)] = 0  # short pre-delay
        ir /= np.sqrt(np.sum(ir ** 2))
        y = np.fft.irfft(np.fft.rfft(x[c], size) * np.fft.rfft(ir, size), size)
        out[c] = y[: x.shape[1] + n]
    return out[:, : x.shape[1]] * mix


wet = reverb(keys * 0.3 + lead * 0.45 + drums * 0.08)

# vinyl: quiet hiss plus sparse crackle
hiss = lowpass(highpass(rng.standard_normal((2, N)), 700), 5000) * 0.004
crackle = np.zeros((2, N))
for _ in range(int(DUR * 7)):
    i = rng.integers(N - 200)
    c = rng.integers(2)
    crackle[c, i : i + 30] += rng.standard_normal(30) * np.exp(-np.arange(30) / 5) * rng.uniform(0.005, 0.03)
crackle = highpass(crackle, 1500)

mix = keys + low + drums * 1.0 + lead + wet + hiss + crackle

# master: gentle warmth, edges, fades
mix = highpass(mix, 40, 3)
mix = np.tanh(mix * 1.3) / 1.3
mix = lowpass(mix, 11000, 1)
fade_in = np.minimum(t / 0.03, 1)
fade_out = np.where(t > DUR - 2, 0.5 * (1 + np.cos(np.pi * (t - (DUR - 2)) / 2)), 1)
mix *= fade_in * fade_out
mix *= 0.76 / np.max(np.abs(mix))  # about -14 LUFS, the level Instagram plays at

out = sys.argv[1] if len(sys.argv) > 1 else "lofi.wav"
pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {out}: {DUR:.2f}s, {BPM} BPM, {BARS} bars")
