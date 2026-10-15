# Custom sound effects

Drop audio files in this folder (mp3, ogg, wav or m4a; lowercase names with letters, digits, `-` or `_`)
and list them in `manifest.json` under the game event that should trigger them. If an event has several
files, one is picked at random. Events with no files keep the built-in chiptune beep.

Events: start (run begins), chai (chai pickup), witness (witness pickup), stumble (hit, and each lathi
swing on the game-over screen), caught (detained), revive (WiFi revive), power (power-up used / tutorial card).

Example:
    { "chai": ["chai-sip.mp3"], "caught": ["caught-1.mp3", "caught-2.mp3"] }

Keep clips short (under ~3 seconds) and small (under ~100 KB each) so phones load them fast.
Only use audio you have the rights to use. Recordings of real people's voices are fine for satire only if they are
genuine, attributable recordings; do not use AI voice clones presented as the real person.
