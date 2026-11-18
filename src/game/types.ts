// The story's and the game state's types. No browser in here: Vitest reads it in Node.

/** The three people the player can grow close to. */
export type CastId = 'hana' | 'serin' | 'yuri';
/** Everyone who can speak a line; narration has no speaker (null). */
export type SpeakerId = CastId | 'teacher' | 'me';
/** A character's expression, one picture each. */
export type Face = 'neutral' | 'happy' | 'shy' | 'sad';
/** Where a character stands: left, centre or right. */
export type Pos = 'l' | 'c' | 'r';
/** Hearts for each of the cast. */
export type Hearts = Record<CastId, number>;

/** A line to read: speaker (null for narration), text, and the face the speaker turns to. */
export type Line = [SpeakerId | null, string, Face?];

/** One answer in a choice. */
export interface Option {
  /** What the button says. */
  t: string;
  /** A small place name on the right of the button. */
  sub?: string;
  /** Hearts it gives or takes. */
  h?: Partial<Hearts>;
  /** Flags the story remembers from now on. */
  set?: string[];
  /** Faces that change at once. */
  face?: Partial<Record<CastId, Face>>;
  /** Lines that answer the choice before the story goes on. */
  reply?: Line[];
  /** A scene to jump to. */
  go?: string;
  /** Ask this person to the festival: the hearts decide the answer. */
  invite?: CastId;
}

/** A story command; a scene is a list of lines and commands. */
export interface Command {
  bg?: string;
  show?: CastId;
  face?: Face;
  pos?: Pos;
  hide?: CastId;
  hideAll?: boolean;
  day?: number;
  goto?: string;
  if?: string;
  then?: Item[];
  else?: Item[];
  choice?: Option[];
  pick?: number;
  invite?: boolean;
  prompt?: string;
  ending?: string;
}

/** One entry of a scene. */
export type Item = Line | Command;
/** The whole story: named scenes. */
export type Story = Record<string, Item[]>;
/** A path into the story (scene name, then indexes and keys) and the next entry to run there. */
export interface Frame {
  path: (string | number)[];
  i: number;
}

/** A character on screen. */
export interface Shown {
  id: CastId;
  face: Face;
  pos: Pos;
  /** Fade-in, 0 to 1. */
  a: number;
  /** The little hop when the face changes, 1 down to 0. */
  bounce: number;
}

/** A heart change floating beside its row. */
export interface HeartFx {
  id: CastId;
  d: number;
  t: number;
}

/** The game's state, as window.game.state shows it. */
export interface State {
  t: number;
  frames: Frame[];
  hearts: Hearts;
  flags: string[];
  met: CastId[];
  bg: string;
  shown: Shown[];
  day: number;
  card: { day: number; t: number } | null;
  line: { who: SpeakerId | null; text: string } | null;
  reveal: number;
  blipAt?: number;
  choice: { path: (string | number)[] } | null;
  sel: number;
  log: { who: SpeakerId | null; text: string }[];
  fx: HeartFx[];
  ending: string | null;
  score: number;
  gained: string;
}
