# The values' notes

What `prototypes/sakura-week/config.js` said beside its values, kept here because `data/config.json`
holds no comments. The values themselves are in `data/config.json`.

- `seed`: every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
---- Reading ----
- `text_speed`: letters per second at "보통"
- `blip_every`: letters between voice blips
- `daycard_time`: seconds the day card stays
---- Hearts (the challenge) ----
- `heart_max`: points for a full row of hearts
- `confess_threshold`: points needed for a festival yes
- `heart_shake_time`: seconds a changed row shakes
---- Look ----
- `petal_count`: falling petals on screen
- `petal_fall`: petal fall speed, px per second
