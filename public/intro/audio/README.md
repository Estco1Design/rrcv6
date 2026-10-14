# Recorded sound — not yet supplied

`manifest.json` is deliberately empty. The interface disables sound until all four
recordings are provided; no generated noise, unrelated effects or music are used.

Required original recordings, or licensed recordings whose redistribution is allowed:
- hinge: quiet opening friction, approximately 0.15 seconds;
- close: soft metal blade contact, approximately 0.08 seconds;
- cut: dry suiting-fabric cut, approximately 0.23 seconds;
- rustle: short edge separation, approximately 0.6 seconds.

Place recordings here (OGG or MP3) and retain source URL, author, licence and licence
text. Set manifest keys `hinge`, `close`, `cut`, `rustle` to `/intro/audio/<filename>`.
Test the actual recordings for synchronisation, clipping and perceived loudness.
Sound only loads after an explicit click; the animation works in silence. Four
closing cues follow the same 0.425-second stroke schedule as blade geometry.
