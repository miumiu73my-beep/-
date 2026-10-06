export const DEFAULT_CHARACTER_KEY = "ichika";

export const CHARACTER_KEYS = Object.freeze([
  "ichika",
  "chihaya",
  "uryu",
  "shuka",
]);

export const CHARACTERS = Object.freeze({
  ichika: Object.freeze({
    key: "ichika",
    name: "一歌",
    fullName: "桐城一歌",
    receiverName: "海",
    mark: "一",
    portraitSrc: "./assets/characters/portraits/ichika.svg",
    chibiSrc: "./assets/characters/chibi/ichika.svg",
    dialogue: Object.freeze({
      lab: "{{name}}、焦らなくていい。キミのペースで、一つずつ確かめていこう。",
      field: "{{name}}、大丈夫だ。今日できる分だけ、一緒に畑を見よう。",
      home: "おかえり、{{name}}。キミが戻ってくるなら、私はいつもここにいる。",
    }),
  }),
  chihaya: Object.freeze({
    key: "chihaya",
    name: "千隼",
    fullName: "鳴海千隼",
    receiverName: "真琴",
    mark: "千",
    portraitSrc: "./assets/characters/portraits/chihaya.svg",
    chibiSrc: "./assets/characters/chibi/chihaya.svg",
    dialogue: Object.freeze({
      lab: "{{name}}、せや、ひとつずつでええ。分かったことから畑に返してこ。",
      field: "{{name}}、急がんでええよ。あんたの畑や、好きな順で育てたらええ。",
      home: "おかえり、{{name}}。今日は何する？ まあ、何もせん日があってもええけどな。",
    }),
  }),
  uryu: Object.freeze({
    key: "uryu",
    name: "雨流",
    fullName: "勅使河原雨流",
    receiverName: "みう",
    mark: "雨",
    portraitSrc: "./assets/characters/portraits/uryu.svg",
    chibiSrc: "./assets/characters/chibi/uryu.svg",
    dialogue: Object.freeze({
      lab: "{{name}}、必要なところから確認しましょう。無理に全部覚える必要はないわ。",
      field: "{{name}}、順調ね。今日はここまで、という決め方でも十分よ。",
      home: "戻ったのね、{{name}}。予定はあなたが決めて。私はちゃんと付き合うから。",
    }),
  }),
  shuka: Object.freeze({
    key: "shuka",
    name: "朱夏",
    fullName: "柏朱夏",
    receiverName: "小夜",
    mark: "朱",
    portraitSrc: "./assets/characters/portraits/shuka.svg",
    chibiSrc: "./assets/characters/chibi/shuka.svg",
    dialogue: Object.freeze({
      lab: "{{name}}、おう！ 覚えたことを畑で試しゃいい。細けえことは気にすんな！",
      field: "{{name}}、おう、いい畑じゃねえか！ のんびりでも育つんだから気楽にいこうぜ！",
      home: "おかえり、{{name}}！ まずゆっくりしろ。遊ぶのはそれからでも遅くねえ！",
    }),
  }),
});

export function getCharacter(characterKey) {
  return CHARACTERS[characterKey] ?? null;
}

export function getFavoriteCharacter(saveData) {
  const selected = getCharacter(saveData?.player?.favoriteCharacter);
  return selected ?? CHARACTERS[DEFAULT_CHARACTER_KEY];
}

export function getCharacterDialogue(character, screenKey) {
  if (!character) return "";
  return character.dialogue?.[screenKey] ?? character.dialogue?.home ?? "";
}
