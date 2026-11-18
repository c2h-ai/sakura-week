// PROTOTYPE - NOT FOR PRODUCTION
// Question: 선택한 대사에 상대가 바로 반응하는 짧은 연애 장면이 다시 해서 다른 엔딩을 보고 싶다를 만드는가?
// Date: 2026-11-18
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
window.CONFIG = {
  seed: 1, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },
  // ---- Reading ----
  text_speed: { value: 38, min: 10, max: 120, step: 2 },      // letters per second at "보통"
  blip_every: { value: 2, min: 1, max: 6, step: 1 },          // letters between voice blips
  daycard_time: { value: 1.8, min: 0.5, max: 4, step: 0.1 },  // seconds the day card stays
  // ---- Hearts (the challenge) ----
  heart_max: { value: 12, min: 6, max: 20, step: 1 },         // points for a full row of hearts
  confess_threshold: { value: 9, min: 1, max: 20, step: 1 },  // points needed for a festival yes
  heart_shake_time: { value: 0.6, min: 0.1, max: 2, step: 0.1 }, // seconds a changed row shakes
  // ---- Look ----
  petal_count: { value: 34, min: 0, max: 120, step: 2 },      // falling petals on screen
  petal_fall: { value: 38, min: 5, max: 150, step: 1 },       // petal fall speed, px per second
  sprite_height: { value: 650, min: 450, max: 720, step: 10 },// character height on screen, px
  fade_time: { value: 0.35, min: 0.05, max: 1.5, step: 0.05 },// seconds a character fades in
};
