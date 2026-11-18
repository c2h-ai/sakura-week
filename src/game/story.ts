// The story as data. A line is [speaker, text, face?]; speaker null is narration.
// Commands: {bg}, {show, face, pos}, {hide}, {hideAll}, {day}, {goto}, {if: flag, then, else},
// {choice: [{t, h: {who: hearts}, set: [flags], face: {who: face}, reply: [lines], go}]},
// {pick: day} (who to meet after school), {invite: true} (the festival), {ending: id}.
// Heart amounts are the scene's writing; the festival bar is data/config.json confess_threshold.
import type { CastId, Option, SpeakerId, Story } from './types';
/** Each speaker's name: in full on the name tag, short by the hearts. */
export const NAMES: Record<SpeakerId, { full: string; short?: string; cast?: boolean }> = {
  hana: { full: '하나', short: '하나', cast: true },
  serin: { full: '세린 선배', short: '세린', cast: true },
  yuri: { full: '유리', short: '유리', cast: true },
  teacher: { full: '담임 선생님' },
  me: { full: '나' },
};
/** Each speaker's name-tag colour. */
export const COLORS: Record<SpeakerId, string> = { hana: '#e2809a', serin: '#7d63c4', yuri: '#e8962a', teacher: '#7a8a99', me: '#5a7fb5' };
/** Darker ink for small names on the cream hearts panel. */
export const HUD_INK: Record<CastId, string> = { hana: '#a83e5c', serin: '#4f3a96', yuri: '#9a5a08' }; // darker, for small text on cream
/** Each speaker's blip as the letters appear. */
export const VOICES: Record<SpeakerId, { f: number; type: OscillatorType; vol: number }> = { // each speaker's blip as the letters appear
  hana: { f: 560, type: 'sine', vol: 0.09 },
  serin: { f: 360, type: 'triangle', vol: 0.11 },
  yuri: { f: 760, type: 'square', vol: 0.035 },
  teacher: { f: 210, type: 'triangle', vol: 0.1 },
  me: { f: 430, type: 'sine', vol: 0.07 },
};
/** Each day's label and its card. */
export const DAYS: Record<number, { left: string; card: string }> = {
  1: { left: '축제까지 사흘', card: '전학 첫날 · 축제까지 사흘' },
  2: { left: '축제까지 이틀', card: '축제까지 이틀' },
  3: { left: '축제 전날', card: '축제까지 하루' },
  4: { left: '벚꽃 축제', card: '벚꽃 축제의 밤' },
};
/** The four endings. */
export const ENDINGS: Record<string, { title: string; who: string; line: string; bg: string }> = {
  hana: { title: '칠 년 만의 벚꽃', who: '하나 엔딩', line: '타임캡슐 속 편지는, 이제 직접 전해졌다.', bg: 'festival' },
  serin: { title: '회장님의 휴일', who: '세린 엔딩', line: '순찰 완장은 오늘 밤, 주머니 속에.', bg: 'festival' },
  yuri: { title: '시끄러운 고백', who: '유리 엔딩', line: '말린 꽃잎의 소원이 이루어졌다.', bg: 'festival' },
  alone: { title: '혼자 보는 벚꽃', who: '혼자 엔딩', line: '다음 봄에는, 조금 더 용기를.', bg: 'festival' },
};

/** The after-school pick on days 2 and 3. */
export const STORY_PICKS: Record<number, Option[]> = {
  2: [
    { t: '하나를 만나러 교실에 남는다', sub: '교실', go: 'hana2' },
    { t: '세린 선배를 찾아 옥상에 간다', sub: '옥상', go: 'serin2' },
    { t: '유리와 같이 하교한다', sub: '벚꽃길', go: 'yuri2' },
  ],
  3: [
    { t: '하나와 벚꽃길을 걷는다', sub: '벚꽃길', go: 'hana3' },
    { t: '세린 선배를 찾아 옥상에 간다', sub: '옥상', go: 'serin3' },
    { t: '유리의 비밀 장소에 따라간다', sub: '벚꽃길', go: 'yuri3' },
  ],
};
/** The festival invite. */
export const STORY_INVITE: Option[] = [
  { t: '하나에게 같이 걷자고 한다', invite: 'hana' },
  { t: '세린 선배에게 같이 걷자고 한다', invite: 'serin' },
  { t: '유리에게 같이 걷자고 한다', invite: 'yuri' },
  { t: '혼자 걷는다', go: 'alone' },
];

/** The scenes. */
export const STORY: Story = {
  start: [
    { day: 1 },
    { bg: 'road' },
    [null, '전학 첫날. 벚꽃길 끝으로 새 학교가 보인다.'],
    [null, '이번 주 금요일 밤에는 벚꽃 축제가 열린다고 했다. 아는 사람 하나 없는 동네에서.'],
    { show: 'hana', face: 'neutral' },
    ['hana', '…어? 혹시, 너…?'],
    ['hana', '나야, 하나! 초등학교 때 옆집 살던!', 'happy'],
    { choice: [
      { t: '하나! 오랜만이야. 하나도 안 변했네.', h: { hana: 2 }, set: ['hana_remember'], face: { hana: 'shy' },
        reply: [['hana', '정말? 기억해 줬구나… 다행이다.', 'shy']] },
      { t: '…누구였지?', h: { hana: -1 }, set: ['hana_forgot'], face: { hana: 'sad' },
        reply: [['hana', '아… 그렇구나. 벌써 칠 년이니까.', 'sad'], ['hana', '괜찮아! 다시 친해지면 되지.', 'neutral']] },
    ] },
    ['hana', '같은 반이었으면 좋겠다. 가자, 늦겠어!', 'happy'],
    { hide: 'hana' },
    { bg: 'classroom' },
    ['teacher', '자, 오늘 전학 온 친구다. 다들 잘 지내도록.'],
    [null, '어색한 인사를 마치자마자, 교실 문이 벌컥 열렸다.'],
    { show: 'yuri', face: 'happy' },
    ['yuri', '늦었다아—! 앗, 여기 2학년 교실이네? 그리고… 전학생이다! 신기해!', 'happy'],
    ['yuri', '나 1학년 유리! 교실을 잘못 찾아왔는데, 이거 운명인가 봐!'],
    { choice: [
      { t: '운명이면 매일 와도 돼.', h: { yuri: 2 }, set: ['yuri_fate'], face: { yuri: 'shy' },
        reply: [['yuri', '에헤헤… 진짜 매일 온다? 각오해!', 'shy']] },
      { t: '1학년 교실은 아래층이야.', set: ['yuri_cold'], face: { yuri: 'sad' },
        reply: [['yuri', '칫, 친절한 척 차갑네… 기억해 둘 거야!', 'sad']] },
    ] },
    { hide: 'yuri' },
    { show: 'serin', face: 'neutral' },
    ['serin', '실례. 학생회장 서세린이다. 유리, 또 너니.', 'neutral'],
    ['serin', '그리고 전학생. 방과 후에 학생회실로 와. 서류가 있어.'],
    { choice: [
      { t: '네, 꼭 갈게요. 선배.', h: { serin: 1 }, set: ['serin_polite'],
        reply: [['serin', '…착실하네. 좋아.', 'neutral']] },
      { t: '서류보다 선배 이름이 더 궁금했는데요.', h: { serin: 2 }, set: ['serin_bold'], face: { serin: 'shy' },
        reply: [['serin', '…방금 말한 이름이잖아. 이상한 애.', 'shy']] },
    ] },
    { hide: 'serin' },
    [null, '첫날이 정신없이 지나갔다. 축제까지는 이제 이틀.'],
    { goto: 'day2' },
  ],

  day2: [
    { day: 2 },
    { bg: 'classroom' },
    [null, '둘째 날 방과 후. 오늘은 누구를 만나러 갈까?'],
    { pick: 2, prompt: '방과 후, 누구와 시간을 보낼까?' },
  ],
  hana2: [
    { bg: 'classroom' },
    { show: 'hana', face: 'shy' },
    ['hana', '아, 왔어? 일부러 남아 있던 건 아니야. …조금은 맞지만.', 'shy'],
    { if: 'hana_remember',
      then: [['hana', '어제 나 바로 알아봐 준 거, 하루 종일 생각났어.', 'happy']],
      else: [['hana', '어제는 나 못 알아봤지? 그래서 오늘은 꼭 이야기하고 싶었어.', 'neutral']] },
    ['hana', '옛날에 같이 묻었던 타임캡슐, 기억나?', 'neutral'],
    { choice: [
      { t: '물론. 공원 벚나무 아래였지.', h: { hana: 2 }, set: ['hana_capsule'], face: { hana: 'happy' },
        reply: [['hana', '맞아! 고등학생이 되면 같이 파 보자고 약속했잖아.', 'happy']] },
      { t: '그런 게 있었어?', h: { hana: -1 }, face: { hana: 'sad' },
        reply: [['hana', '…그럼 나 혼자만 기억하고 있었네.', 'sad']] },
    ] },
    ['hana', '요즘 도시락을 직접 싸는데… 남은 거, 맛 좀 봐 줄래?', 'neutral'],
    { choice: [
      { t: '맛있다! 매일 먹고 싶어.', h: { hana: 2 }, face: { hana: 'shy' },
        reply: [['hana', '매, 매일?! 그건… 생각해 볼게.', 'shy']] },
      { t: '조금 짜다. 솔직하게 말하면.', h: { hana: 1 }, face: { hana: 'neutral' },
        reply: [['hana', '역시 넌 솔직하구나. 내일은 더 잘할게!', 'happy']] },
    ] },
    [null, '노을이 창문을 물들일 때까지, 둘이서 옛날 이야기를 했다.'],
    { goto: 'day3' },
  ],
  serin2: [
    { bg: 'rooftop' },
    { show: 'serin', face: 'neutral' },
    ['serin', '…여긴 어떻게 알았지. 내가 혼자 쉬는 곳인데.', 'neutral'],
    { if: 'serin_bold',
      then: [['serin', '아, 이름이 더 궁금하다던 그 전학생이구나. …기억하고 있어.', 'shy']],
      else: [['serin', '서류는 잘 받아 갔더군. 착실한 후배.', 'neutral']] },
    ['serin', '축제 준비 때문에 머리가 아파. 회장은 쉬면 안 되거든.', 'sad'],
    { choice: [
      { t: '선배도 쉬어도 돼요. 제가 도울게요.', h: { serin: 2 }, set: ['serin_help'], face: { serin: 'shy' },
        reply: [['serin', '…그런 말, 처음 들어 봐.', 'shy']] },
      { t: '회장이니까 당연히 힘들겠죠.', face: { serin: 'sad' },
        reply: [['serin', '그래. 당연한 거지.', 'sad']] },
    ] },
    ['serin', '…너, 축제엔 누구랑 가?', 'neutral'],
    { choice: [
      { t: '아직 정하지 않았어요.', h: { serin: 1 },
        reply: [['serin', '그래. …그냥 물어본 거야.', 'neutral']] },
      { t: '선배는 누구랑 가요?', h: { serin: 2 }, face: { serin: 'shy' },
        reply: [['serin', '나, 나는 순찰이야! …순찰 중엔 혼자고.', 'shy']] },
    ] },
    [null, '바람이 불 때마다, 선배의 긴 머리가 노을 속에서 흩날렸다.'],
    { goto: 'day3' },
  ],
  yuri2: [
    { bg: 'road' },
    { show: 'yuri', face: 'happy' },
    ['yuri', '선배다! 같이 하교해요! 오늘은 제 비밀 장소 알려 줄게요!', 'happy'],
    { if: 'yuri_fate',
      then: [['yuri', '어제 운명이라고 해 줬잖아요. 그래서 기다렸지!', 'shy']],
      else: [['yuri', '어제 "아래층"이라고 한 거 아직 안 잊었다?', 'sad'], ['yuri', '…그래도 같이 가요!', 'happy']] },
    ['yuri', '짠! 벚꽃잎을 땅에 닿기 전에 잡으면 소원이 이뤄진대요!', 'happy'],
    { choice: [
      { t: '같이 잡아 보자!', h: { yuri: 2 }, set: ['yuri_petal'], face: { yuri: 'happy' },
        reply: [['yuri', '와아, 하나 잡았다! 소원은… 비밀!', 'happy']] },
      { t: '그거 미신이잖아.', h: { yuri: -1 }, face: { yuri: 'sad' },
        reply: [['yuri', '미신이면 어때요… 재미있잖아.', 'sad']] },
    ] },
    ['yuri', '선배는 소원 있어요?', 'neutral'],
    { choice: [
      { t: '축제를 누군가와 같이 보는 거.', h: { yuri: 2 }, face: { yuri: 'shy' },
        reply: [['yuri', '누, 누군가요? …아니, 대답하지 마요!', 'shy']] },
      { t: '시험 잘 보는 거.', face: { yuri: 'neutral' },
        reply: [['yuri', '으, 재미없어! 선배답긴 한데.', 'neutral']] },
    ] },
    [null, '유리는 집 앞까지 쉬지 않고 떠들었다. 이상하게, 시끄럽지 않았다.'],
    { goto: 'day3' },
  ],

  day3: [
    { day: 3 },
    { bg: 'classroom' },
    [null, '셋째 날 점심시간. 묘하게도 세 사람이 동시에 나를 찾아왔다.'],
    { show: 'hana', face: 'shy', pos: 'l' },
    { show: 'serin', face: 'neutral', pos: 'c' },
    { show: 'yuri', face: 'happy', pos: 'r' },
    ['yuri', '선배! 제가 만든 딸기 카레빵 먹어 줘요!', 'happy'],
    ['serin', '전학생, 축제 포스터 붙이는 걸 도와줘. 지금.', 'neutral'],
    ['hana', '…나, 나는 그냥 같이 밥 먹고 싶었는데.', 'shy'],
    { choice: [
      { t: '선배, 포스터 도울게요.', h: { serin: 2, yuri: -1, hana: -1 }, face: { serin: 'happy', yuri: 'sad', hana: 'sad' },
        reply: [['serin', '고마워. 역시 믿을 만해.', 'happy'], ['yuri', '칫… 카레빵은 내가 다 먹을 거야.', 'sad']] },
      { t: '유리 빵부터 먹어 볼게!', h: { yuri: 2, serin: -1, hana: -1 }, face: { yuri: 'happy', serin: 'sad', hana: 'sad' },
        reply: [['yuri', '진짜?! 선배 최고!', 'happy'], ['serin', '…그래. 혼자 하지 뭐.', 'sad']] },
      { t: '하나랑 먹기로 했어. 미안.', h: { hana: 2, serin: -1, yuri: -1 }, face: { hana: 'happy', serin: 'sad', yuri: 'sad' },
        reply: [['hana', '…응! 고마워.', 'happy'], ['yuri', '에— 치사해!', 'sad']] },
    ] },
    { hideAll: true },
    [null, '방과 후. 축제는 내일이다. 오늘은 누구를 만날까?'],
    { pick: 3, prompt: '축제 전날, 누구와 시간을 보낼까?' },
  ],
  hana3: [
    { bg: 'road' },
    { show: 'hana', face: 'shy' },
    ['hana', '내일이 축제네. …있잖아, 하나 물어봐도 돼?', 'shy'],
    { if: 'hana_capsule',
      then: [['hana', '타임캡슐 기억해 준 거, 정말 기뻤어.', 'happy']],
      else: [['hana', '어릴 때 일, 너는 별로 기억 안 나지?', 'sad']] },
    ['hana', '나, 그동안 계속… 너한테 편지를 쓰다가 못 보냈어.', 'shy'],
    { choice: [
      { t: '지금이라도 읽고 싶어.', h: { hana: 3 }, face: { hana: 'shy' },
        reply: [['hana', '안, 안 돼! 내일… 내일 줄게.', 'shy']] },
      { t: '왜 못 보냈어?', h: { hana: 1 }, face: { hana: 'sad' },
        reply: [['hana', '…용기가 없어서. 지금도 없고.', 'sad']] },
    ] },
    { goto: 'day4' },
  ],
  serin3: [
    { bg: 'rooftop' },
    { show: 'serin', face: 'neutral' },
    { if: 'serin_help',
      then: [['serin', '어제 도와준다고 했지. 그 말, 진심이었어?', 'neutral']],
      else: [['serin', '또 왔네. …딱히 기다린 건 아냐.', 'shy']] },
    ['serin', '사실 축제에서 순찰만 돌다 끝나는 게, 매년 싫었어.', 'sad'],
    { choice: [
      { t: '내일은 제가 같이 돌게요.', h: { serin: 3 }, face: { serin: 'shy' },
        reply: [['serin', '…바보. 그런 말 쉽게 하지 마. 믿어 버리니까.', 'shy']] },
      { t: '회장 일이니까 어쩔 수 없죠.', h: { serin: -1 }, face: { serin: 'sad' },
        reply: [['serin', '…그렇지. 알고 있어.', 'sad']] },
    ] },
    { goto: 'day4' },
  ],
  yuri3: [
    { bg: 'road' },
    { show: 'yuri', face: 'neutral' },
    { if: 'yuri_petal',
      then: [['yuri', '어제 잡은 꽃잎, 책에 끼워서 말렸어요! 나중에 보여 줄게요!', 'happy']],
      else: [['yuri', '오늘은 미신 얘기 안 할게요. 흥.', 'sad']] },
    ['yuri', '선배, 사실 나… 이 학교에 친구가 별로 없어요.', 'sad'],
    ['yuri', '다들 내가 너무 시끄럽대요.', 'sad'],
    { choice: [
      { t: '난 네가 시끄러운 거 좋아.', h: { yuri: 3 }, face: { yuri: 'shy' },
        reply: [['yuri', '…진짜요? 그 말, 녹음해 둘걸.', 'shy']] },
      { t: '조금만 조용히 하면 될 거야.', h: { yuri: -1 }, face: { yuri: 'sad' },
        reply: [['yuri', '…그렇죠. 노력해 볼게요.', 'sad']] },
    ] },
    { goto: 'day4' },
  ],

  day4: [
    { day: 4 },
    { bg: 'festival' },
    { hideAll: true },
    [null, '축제의 밤. 등불 아래로 벚꽃잎이 내린다.'],
    [null, '세 사람 모두 이 거리 어딘가에 있을 것이다. 누구에게 같이 걷자고 말할까?'],
    { invite: true, prompt: '축제의 밤, 누구와 걸을까?' },
  ],
  end_hana: [
    { show: 'hana', face: 'shy' },
    ['hana', '…기다렸어. 네가 먼저 말해 주기를.', 'shy'],
    { if: 'hana_capsule',
      then: [['hana', '타임캡슐, 같이 파러 가자. 그 안에… 내 편지도 있어.', 'happy']],
      else: [['hana', '오늘은 옛날 얘기 말고, 지금 얘기를 하고 싶어.', 'neutral']] },
    ['hana', '칠 년 동안 계속 좋아했어. …지금도.', 'shy'],
    ['me', '나도. 이번엔 놓치지 않을게.'],
    { ending: 'hana' },
  ],
  end_serin: [
    { show: 'serin', face: 'shy' },
    ['serin', '순찰은… 부회장한테 맡겼어. 오늘은 너랑 걸을래.', 'shy'],
    { if: 'serin_help',
      then: [['serin', '쉬어도 된다고 처음 말해 준 사람이 너였어.', 'happy']],
      else: [['serin', '이상하지. 회장이 이런 말 하는 거.', 'neutral']] },
    ['serin', '좋아해. …두 번은 말 안 해.', 'shy'],
    ['me', '그럼 제가 두 번 말할게요. 좋아해요, 선배.'],
    { ending: 'serin' },
  ],
  end_yuri: [
    { show: 'yuri', face: 'happy' },
    ['yuri', '선배! 저 부른 거 맞죠?! 맞죠?!', 'happy'],
    { if: 'yuri_petal',
      then: [['yuri', '꽃잎 소원, 사실 선배랑 축제에 오는 거였어요!', 'shy']],
      else: [['yuri', '소원 같은 거 안 빌어도 이뤄지네요.', 'shy']] },
    ['yuri', '좋아해요! 시끄럽게, 엄청 좋아해요!', 'shy'],
    ['me', '응. 시끄럽게 대답할게. 나도 좋아해!'],
    { ending: 'yuri' },
  ],
  decline_hana: [
    { show: 'hana', face: 'sad' },
    ['hana', '…미안. 오늘은 반 친구들이랑 먼저 약속했어.', 'sad'],
    ['hana', '우리, 아직 조금 어색하잖아. 그렇지?', 'neutral'],
    { goto: 'alone' },
  ],
  decline_serin: [
    { show: 'serin', face: 'sad' },
    ['serin', '미안. 순찰 중이야. 회장은 쉴 수 없거든.', 'sad'],
    { goto: 'alone' },
  ],
  decline_yuri: [
    { show: 'yuri', face: 'sad' },
    ['yuri', '에… 선배, 저 별로 안 좋아하는 줄 알았는데요.', 'sad'],
    ['yuri', '오늘은 반 애들이랑 갈게요! …다음엔 일찍 말해 줘요.', 'neutral'],
    { goto: 'alone' },
  ],
  alone: [
    { hideAll: true },
    [null, '혼자 등불길을 걸었다. 벚꽃은 그래도 예뻤다.'],
    [null, '다음 봄에는… 조금 더 용기를 내 보자.'],
    { ending: 'alone' },
  ],
};
