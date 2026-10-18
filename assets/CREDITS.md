# Asset credits

All third-party models are CC0 1.0 (public domain), by Kenney (www.kenney.nl):

- `models/car/` - Kenney Car Kit 3.1 (van, police, firetruck, truck, delivery, taxi). License: models/car/License.txt
- `models/city/` - Kenney City Kit (Commercial) 2.1 (building-a..e, building-skyscraper-a..e). License: models/city/License.txt

Downloaded from opengameart.org mirrors of the official Kenney releases. Attribution is not required but appreciated.
- `models/hero/cockroach.glb` - "Low-poly Humanoid Cockroach" by Gandpop (https://gandpop.itch.io/low-poly-humanoid-cockroach). The creator states: "The asset is free to use. You don't need to credit me, but it is always nice." Credited here anyway. No formal licence file ships with the asset; commercial-use terms are not stated on the page.

- `models/cop/cop.glb` - Kenney Mini Characters 1.0 (character-male-c), CC0. License: models/cop/License.txt. Recoloured khaki with a cap and lathi added in code (src/scene.js).

The fallback inspector, buses, ramps and obstacles are original procedural models in src/models.js. The procedural cockroach in src/models.js is kept as a fallback if the hero model fails to load.

- Posters: no third-party images. When `assets/posters/manifest.json` is empty the game draws original cartoon stand-ins in code (src/posters.js); add your own sketches there to override them.
- Sound: no third-party clips. All effects are synthesized with WebAudio (src/audio.js). `sfx/manifest.json` can still point events at your own files.
- `models/spiderman/spiderman.glb` - Mixamo-rigged Spider-Man GLB supplied by the project owner (run, stand and swing clips). Original author and licence are unverified; check before any public release. Character rights belong to their owners; this is fan satire.
- `models/luffy/luffy.glb` - "one piece bounty rush luffy (2ysl)" by Primalfrom12 (https://sketchfab.com/3d-models/one-piece-bounty-rush-luffy-2ysl-df3410599cc24d5b91e44c86413fc858), CC BY 4.0. Character rights belong to their owners; this is fan satire.
- If those two files are absent, the game falls back to the Kenney Mini Characters rig (CC0) costumed in code (src/characters.js).
