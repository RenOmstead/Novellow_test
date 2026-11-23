# Novellow room sounds

> **How the files are kept now.** To keep the app light on phones, every
> recording is mono, 32 kHz, 64 kbps. The steady sounds ("beds") are
> trimmed to about 45 seconds. Each short sound ("moment") is cut out
> into its own small file, numbered (`page-1.mp3` … `page-8.mp3`,
> `spoon-1.mp3` … and so on), and listed in `js/sound/soundscape.js`.
> Unpacked for playing, a sound takes about 15 times more memory than
> its file, so long or stereo recordings cost a phone a lot. Encode new
> ones the same way.

Real recordings for the "Sounds of the room" mixer. Put each file in
this folder with **exactly** the name below. A sound shows up in the mixer
as soon as its file is here; until then its slider says "not added yet".

## Beds (play continuously)

A minute or two is plenty. They don't need to loop perfectly, because
Novellow cross-fades them into themselves.

| File | What to look for |
| --- | --- |
| `rain.mp3` | Rain on a window or roof; droplets you can hear, not just hiss |
| `fire.mp3` | A fireplace crackling; wood fire, not a campfire roar |
| `wind.mp3` | Wind around a house on a stormy night; soft, not howling |
| `murmurs.mp3` | A quiet café or library; people talking softly, no clear words, no music |
| `purr.mp3` | A cat purring, close up |
| `clock.mp3` | A real mantel or grandfather clock ticking |
| `crickets.mp3` | Crickets on a summer night |

## Moments (play now and then)

Short clips, a few seconds each. Having 2 or 3 versions keeps them from
sounding repetitive, but 1 works.

| File(s) | What to look for |
| --- | --- |
| `thunder-1.mp3`, `thunder-2.mp3` | Distant thunder rumbling (5–15 seconds) |
| `spoon-1.mp3`, `spoon-2.mp3` | A teaspoon stirring in a china cup, a few clinks |
| `coffee-pour.mp3` | Coffee or tea being poured into a cup |
| `page-1.mp3`, `page-2.mp3`, `page-3.mp3` | A single book page turning |
| `owl.mp3` | An owl hooting once or twice |

## The haunted room

These play in the Haunted Library theme (and anyone can turn them up in
any room from the "Spooky" part of the mixer).

**Beds** (1–2 minutes, steady the whole way through):

| File | What to look for |
| --- | --- |
| `cauldron.mp3` | A thick, slow bubbling pot or cauldron (no music) |
| `haunted-clock.mp3` | A slow, heavy, echoing tick… tock (deeper and slower than `clock.mp3`) |

**Moments** (short clips, a few seconds each; 2–3 versions keep them from repeating):

| File(s) | What to look for |
| --- | --- |
| `howl-1.mp3`, `howl-2.mp3` | A wolf or werewolf howling in the distance (5–10 seconds) |
| `creak-1.mp3`, `creak-2.mp3`, `creak-3.mp3` | A creaking door, a creaking floorboard, a rocking chair (1–4 seconds each) |
| `clock-chime.mp3` | A grandfather clock striking or a single deep bell toll |
| `humming-1.mp3`, `humming-2.mp3` | Eerie humming or a slow music-box lullaby (10–30 seconds) |
| `whisper-1.mp3`, `whisper-2.mp3` | Ghostly whispers with no clear words (3–8 seconds) |
| `raven.mp3` | A raven or crow cawing a few times |

Search ideas: "werewolf howl", "wolf howl distant", "door creak",
"floorboard creak", "rocking chair creak", "grandfather clock chime",
"creepy humming", "music box creepy", "ghost whisper", "cauldron bubbling",
"raven caw".

## Winter and holidays

In the "Winter and holidays" part of the mixer. Beds: `fire-logs.mp3`
(a big log fire), `icy-wind.mp3` (two recordings of winter wind and a
storm, joined into one 30-second loop) and `hail.mp3`. Moments:
`sleigh-bells-1/2`, `chimes-1/2`, `bell-tower-1`, `steam-train-1`,
`christmas-music-1` to `-4` (a music box, "We Wish You a Merry
Christmas" and two short tunes) and `krampus-jingle-1`.

## Trimmed to size

Long recordings are cut down (on MP3 frame boundaries, so the sound
quality is unchanged) to keep the site quick to load on phones:
rain 60 s, fire 100 s, crickets 100 s, clock 60 s, murmurs 100 s,
purr 41 s (its steady middle), wind 37 s, coffee pour 10 s, cauldron
90 s, haunted clock 50 s (12 ticks are looped exactly, so the beat never
slips), clock chime 25 s, creak-2 15 s, creak-3 11 s (its rocking-chair
creaks). Which part of
each recording plays, and how loud, is set in `js/sound/soundscape.js`.

## Tips

- MP3 is best (works in every browser). Keep each file under about 2 MB.
  Beds of 1–2 minutes at 128 kbps are about 1–2 MB.
- Trim any silence at the start of the short clips.
- Only use recordings whose license allows it. Good free sources:
  - Pixabay Sound Effects: free to use, no credit needed.
  - Freesound: filter by the "Creative Commons 0" license.

## Where each recording came from

All of the recordings here come from Pixabay (pixabay.com/sound-effects),
under the Pixabay Content License: free to use in apps and websites, no
credit needed. (Keep new recordings from sources like this, or note
their license and any credit they need below.)

For new recordings, fill this in as you add them, so the credits stay
with the sounds.

| File | Source (link) | License |
| --- | --- | --- |
| All current files | Pixabay Sound Effects | Pixabay Content License (no credit needed) |
| `fire-logs.mp3` | Pixabay: "Firewood Burning Sound" by engyclick (179862), 0–90 s | Pixabay Content License |
| `icy-wind.mp3` | Pixabay: "Freezing Winter Wind" by dragon-studio (499654) and "Winter Storm Ambience" by alex_jauk (283339), joined | Pixabay Content License |
| `hail.mp3` | Pixabay: "Strong Hail Falling Against the Window" by saturn-3-music (116182), 6–96 s | Pixabay Content License |
| `sleigh-bells-1.mp3` | Pixabay: "Sleigh Bells" by missywhimsyart (272151) | Pixabay Content License |
| `sleigh-bells-2.mp3` | Pixabay: "Christmas Sleigh Bells Jingling" by dragon-studio (4518523) | Pixabay Content License |
| `chimes-1.mp3` | Pixabay: "Christmas Chimes Transitions" by djartmusic (264369) | Pixabay Content License |
| `chimes-2.mp3` | Pixabay: "Christmas Whoosh" by djartmusic (275403) | Pixabay Content License |
| `bell-tower-1.mp3` | Pixabay: "Medieval Ding Dong 3" by freesound_community (97308) | Pixabay Content License |
| `steam-train-1.mp3` | Pixabay: "Steam Train at Crossing" by freesound_community (62158) | Pixabay Content License |
| `christmas-music-1.mp3` | Pixabay: "Christmas Miracle Alarm Clock" by lesiakower (451385) | Pixabay Content License |
| `christmas-music-2.mp3` | Pixabay: "We Wish You a Merry Christmas" by mfcc (6329581) | Pixabay Content License |
| `christmas-music-3.mp3` | Pixabay: "Christmas Melody V1" by brg_music (263815) | Pixabay Content License |
| `christmas-music-4.mp3` | Pixabay: "Christmas Intro" by tunetank (483682) | Pixabay Content License |
| `krampus-jingle-1.mp3` | Pixabay: "Evil Jingle (Christmas Horror Trailer, Short 2)" by audioatlant (6357392), 0–24.5 s | Pixabay Content License |
