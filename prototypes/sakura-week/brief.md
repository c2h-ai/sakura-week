# Game Brief: 벚꽃 축제까지 사흘 (Sakura Week)

## In your words
미연시 게임 만들어줘.
2. 그림: 그림은 코덱스 cli를 사용하면 돼.

**Pitch:** 전학 온 첫 주, 벚꽃 축제까지 남은 사흘 동안 누구와 방과 후를 보낼지 고르고, 건넨 말 한마디 한마디가 세 사람의 마음을 움직인다. *(provisional)*

**Genre:** 미연시 (연애 시뮬레이션 비주얼 노벨)

**Controls:** 클릭/스페이스로 다음 대사, 클릭/숫자키로 선택지, L 로그, Esc 일시정지·저장 *(guessed)*

**Question:** 선택한 대사에 상대가 바로 반응하는 짧은 연애 장면이 "다시 해서 다른 엔딩을 보고 싶다"를 만드는가? *(guessed)*

**Hooks:** 하트 3개가 실시간으로 오르내리고, 앞에서 한 말을 캐릭터가 나중에 기억해서 꺼낸다. *(inferred (strong))*

**Intent:** soft or no failure *(provisional)*

## Look and references
- Look: 수채풍 애니메이션 셀화. 부드러운 파스텔 배경(교실·옥상·벚꽃길·축제 야경) 위에 허리 위 캐릭터 일러스트, 표정 3~4종(기본·웃음·부끄러움·시무룩). 팔레트: 벚꽃 분홍(하트·강조), 크림(대사창), 저녁 남색(축제 밤). 시그니처: 화면 위로 천천히 흩날리는 꽃잎. 이미지는 **Codex CLI로 생성**해 `assets/`에 넣는다. every figure drawn, no emoji, no plain circles. *(provisional; 생성 도구는 you said)*
- References: Doki Doki Literature Club 초반(학교 연애물 구성), Monster Prom(누구와 시간을 보낼지 고르는 구조) *(guessed)*
- View: 2D · Camera: static, 장면마다 배경이 바뀜

## First minute
제목 화면에서 시작을 누르면 벚꽃길 배경에 첫 대사가 한 글자씩 나온다. 담임이 반을 소개하며 세 사람이 차례로 등장하고, 첫 선택지(소꿉친구에게 "오랜만이야" / "누구…였지?")를 고르면 즉시 얼굴이 바뀌고 하트가 흔들리며 다음 대사가 그 말에 답한다. 이어서 방과 후 화면에서 세 사람 중 한 명을 고른다.

## Challenge
게임 오버는 없다. 2일차부터 한 사람을 꾸준히 만나지 않으면 하트가 축제 고백 기준에 못 미친다. 3일차엔 한 사람에게 좋은 말이 다른 사람에겐 서운한 말이 되는 선택지가 나온다. 마지막 날 하트가 기준을 넘은 사람만 고백을 받아준다. *(provisional)*

## Core loop
- 대사를 읽고 선택지를 고른다 → 상대의 하트·표정이 즉시 바뀐다
- 하루가 끝나면 방과 후 함께할 사람을 고른다 → 그 사람 장면이 열린다
- 축제 날 쌓인 하트와 기억된 선택으로 엔딩이 정해진다 → 엔딩 이름과 "엔딩 n/4" 표시, 처음부터 다시

## Goal & fail state
- 목표: 축제 밤 원하는 상대와 이어지기 *(provisional)*
- 실패 없음: 하트가 모자라면 "혼자 보는 벚꽃" 엔딩 *(provisional)*

## Features
- [x] 공략 대상 3명(상냥한 소꿉친구, 쿨한 선배, 엉뚱한 후배), 각자 하트와 표정 3~4종 *(provisional)*
- [x] 1일차 소개 → 2~3일차 방과 후 선택(3명 × 2일) → 4일차 축제 *(provisional)*
- [x] 선택이 기억됨: 앞에서 한 말을 뒤 장면에서 캐릭터가 꺼낸다
- [x] 엔딩 4개(캐릭터별 3 + 혼자 1), 엔딩 화면에 이름과 "n/4"
- [x] 읽기 화면: 글자 속도 설정, L 로그, 이름표, 캐릭터별 대사 블립 소리
- [x] 선택지마다 자동 저장, 일시정지에서 저장·이어하기
- [x] Codex CLI로 만든 배경 4장, 캐릭터 3명 표정 일러스트

## Your systems
- 그림은 코덱스 cli로 생성 · in the slice

## Keep
-

## Avoid
-

## Out of scope
- 나눠졌다 합쳐지는 루트 분기: add it as a feature
- 여러 챕터와 전체 캐릭터: grow it
- 이미 읽은 대사 스킵 키: change it after play
- CG 갤러리와 엔딩 차트: grow it

## Build order
1. 1~4일차를 처음부터 엔딩까지 플레이 가능한 한 판 (임시 그림 → Codex 그림 교체)
2. 기억되는 선택과 3일차 갈등 선택지
3. 저장·로그·속도 설정

---
**Kill condition:** 선택지를 골라도 상대 반응이 밋밋해서 두 번째 플레이가 당기지 않으면. *(guessed)*

**Who it's for / what they feel:** 가볍게 설렘을 느끼고 싶은 연애물 팬, 15분 한 판. *(guessed)*

**Games you love / don't:** *(guessed)* 위 References 참고
