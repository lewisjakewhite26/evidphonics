export type YearGroup = 'reception' | 'year1-2'
export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
export type ActivityType =
  | 'speedySounds'
  | 'soundBlender'
  | 'trickyTrap'
  | 'missingSound'
  | 'rhymeTime'
  | 'soundSort'
  | 'alienOrReal'
  | 'writeIt'
  | 'quickReview'
  | 'missingWord'
  | 'oddOneOut'
  | 'wordBuilder'
  | 'wordChanger'
  | 'wordSplitter'
  | 'meaningMatch'
  | 'rootHunt'

export interface Grapheme {
  grapheme: string
  keyword: string
  audioUrl?: string
}

export interface WordSegment {
  grapheme: string
  audioUrl?: string
  isSilent?: boolean
  isSplitDigraphStart?: boolean
  splitDigraphWith?: number
}

export interface BlendWord {
  word: string
  audioUrl?: string
  segments: WordSegment[]
}

export interface TrickyWord {
  word: string
  trickyLetters: number[]
  explanation: string
  audioUrl?: string
}

export interface MissingSoundWord {
  word: string
  display: string
  missingPhoneme: string
  options: string[]
  correctIndex: number
}

export interface AnchorWord {
  id: string
  word: string
  sound: string
  audioUrl?: string
}

export interface SortWord {
  word: string
  audioUrl?: string
  correctAnchorId: string
}

export interface DictationSentence {
  text: string
  audioUrl?: string
  targetSounds: string[]
  trickyWords: string[]
  checklist: string[]
}

export interface SpeedySoundsData {
  id: string
  type: 'speedySounds'
  title: string
  emoji: string
  instruction: string
  graphemes: Grapheme[]
}

export interface SoundBlenderData {
  id: string
  type: 'soundBlender'
  title: string
  emoji: string
  instruction: string
  words: BlendWord[]
}

export interface TrickyTrapData {
  id: string
  type: 'trickyTrap'
  title: string
  emoji: string
  instruction: string
  words: TrickyWord[]
}

export interface MissingSoundData {
  id: string
  type: 'missingSound'
  title: string
  emoji: string
  instruction: string
  words: MissingSoundWord[]
}

export interface RhymeTimeData {
  id: string
  type: 'rhymeTime'
  title: 'Rhyme Time'
  emoji: '🎵'
  instruction: string
  pairs: Array<{
    word1: string
    word2: string
    rhymes: boolean
  }>
}

export interface SoundSortData {
  id: string
  type: 'soundSort'
  title: string
  emoji: string
  instruction: string
  anchorWords: AnchorWord[]
  sortWords: SortWord[]
}

export interface AlienOrRealData {
  id: string
  type: 'alienOrReal'
  title: string
  emoji: string
  instruction: string
  words: { word: string; isReal: boolean; audioUrl?: string }[]
}

export interface WriteItData {
  id: string
  type: 'writeIt'
  title: string
  emoji: string
  instruction: string
  sentences: DictationSentence[]
}

export interface QuickReviewData {
  id: string
  type: 'quickReview'
  title: string
  emoji: string
  instruction: string
  words: string[]
}

export interface MissingWordData {
  id: string
  type: 'missingWord'
  title: string
  emoji: string
  instruction: string
  sentences: {
    text: string
    missingWord: string
    missingIndex: number
    options: string[]
    audioUrl?: string
  }[]
}

export interface OddOneOutData {
  id: string
  type: 'oddOneOut'
  title: string
  emoji: string
  instruction: string
  sets: {
    words: string[]
    oddOneOut: number
    explanation: string
  }[]
}

export interface WordBuilderData {
  id: string
  type: 'wordBuilder'
  title: string
  emoji: string
  instruction: string
  words: {
    word: string
    graphemes: string[]
    distractors: string[]
  }[]
}

export interface WordChangerStep {
  root: string
  prefix?: string
  suffix?: string
  result: string
  meaningHint: string
}

export interface WordChangerData {
  id: string
  type: 'wordChanger'
  title: 'Word Changer'
  emoji: '🔄'
  instruction: string
  steps: WordChangerStep[]
}

export interface WordSplitterItem {
  word: string
  morphemes: string[]
  /** Same length as `morphemes` when present; drives prefix / root / suffix colours */
  morphemeRoles?: ('prefix' | 'root' | 'suffix')[]
}

export interface WordSplitterData {
  id: string
  type: 'wordSplitter'
  title: 'Word Splitter'
  emoji: '✂️'
  instruction: string
  items: WordSplitterItem[]
}

export interface MeaningMatchPair {
  affix: string
  meaning: string
  examples: string[]
}

export interface MeaningMatchData {
  id: string
  type: 'meaningMatch'
  title: 'Meaning Match'
  emoji: '🧩'
  instruction: string
  pairs: MeaningMatchPair[]
}

export interface RootHuntItem {
  word: string
  root: string
  rootStart: number
  rootEnd: number
  /** Two incorrect root choices shown with the correct root */
  distractorRoots: [string, string]
}

export interface RootHuntData {
  id: string
  type: 'rootHunt'
  title: 'Root Hunt'
  emoji: '🔍'
  instruction: string
  items: RootHuntItem[]
}

export type Activity =
  | SpeedySoundsData
  | SoundBlenderData
  | TrickyTrapData
  | MissingSoundData
  | RhymeTimeData
  | SoundSortData
  | AlienOrRealData
  | WriteItData
  | QuickReviewData
  | MissingWordData
  | OddOneOutData
  | WordBuilderData
  | WordChangerData
  | WordSplitterData
  | MeaningMatchData
  | RootHuntData

export interface LessonData {
  id: string
  yearGroup: YearGroup
  phase: number
  week: number
  day: DayName
  weekFocus: string
  dayFocus: string
  termName: string
  availableActivities: ActivityType[]
  activities: Activity[]
}

export interface GraphemeMissingWordSentence {
  text: string
  missingWord: string
  missingIndex: number
  options: string[]
}

export interface GraphemeOddOneOutSet {
  words: string[]
  oddOneOut: number
  explanation: string
}

export interface GraphemeWriteItSentence {
  text: string
  targetSounds: string[]
  trickyWords: string[]
}

export interface TrickyWordEntry {
  word: string
  trickyLetters: number[]
  explanation: string
}

export interface GraphemePinnedContent {
  blendWords?: string[]
  alienOrRealWords?: { word: string; isReal: boolean }[]
  missingWordSentences?: GraphemeMissingWordSentence[]
  oddOneOutSets?: GraphemeOddOneOutSet[]
  wordBuilderWords?: string[]
  writeItSentences?: GraphemeWriteItSentence[]
  trickyWords?: TrickyWordEntry[]
  quickReviewWords?: string[]
  speedyRevisionGraphemes?: string[]
  /** Override generated Missing Sound activity */
  missingSoundWords?: MissingSoundWord[]
  /** Override generated Rhyme Time pairs */
  rhymeTimePairs?: Array<{ word1: string; word2: string; rhymes: boolean }>
}

export interface GraphemeData {
  grapheme: string
  keyword: string
  phase: number
  /** Morpheme entries use a reduced activity set in the lesson engine. */
  type?: 'grapheme' | 'morpheme'
  words: string[]
  alienWords: string[]
  segments: Record<string, string[]>
  /** Morpheme chunks per word (orthographic join equals spelling). Optional; wordSplitter falls back to `segments`. */
  morphemes?: Record<string, string[]>
  /** Base/root string per word for morphology activities. Optional; rootHunt falls back to affix stripping. */
  roots?: Record<string, string>
  sortPair: string
  relatedGraphemes: string[]
  missingWordSentences: GraphemeMissingWordSentence[]
  oddOneOutSets: GraphemeOddOneOutSet[]
  writeItSentences: GraphemeWriteItSentence[]
  trickyWords: TrickyWordEntry[]
  pinned: GraphemePinnedContent | null
}

/** One segment in the curriculum path (shown as “Phase · Step” in the UI). */
export interface WeekMeta {
  /** Global curriculum slot 1–80 (stable id; used by getLesson). */
  week: number
  /** 1-based position within this phase, in global week order. */
  stepInPhase: number
  focus: string
  termName: string
  termNumber: number
  phase: number
}

/** Rows in placeholder files before `stepInPhase` is attached in `all-weeks`. */
export type WeekMetaInput = Omit<WeekMeta, 'stepInPhase'>

export interface AppState {
  selectedStepId: number | null
  selectedGrapheme: string | null
  selectedDay: DayName | null
  selectedActivities: ActivityType[]
}

export interface TermGroup {
  termNumber: number
  termName: string
  steps: WeekMeta[]
}
