import { CHARACTERS } from "./characters.js";

function freezeChoices(choices) {
  return Object.freeze(choices.map((choice) => Object.freeze(choice)));
}

function freezeEvents(events) {
  return Object.freeze(
    events.map((event) =>
      Object.freeze({
        ...event,
        choices: freezeChoices(event.choices),
      })
    )
  );
}

export const DATE_EVENTS = Object.freeze({
  ichika: freezeEvents([
    {
      id: "ichika-book-cafe",
      place: "街角の書店と喫茶店",
      title: "ゆっくり選ぶ休日",
      summary: "本を眺めてから、静かな喫茶店で同じテーブルを囲むデート。",
      intro:
        "{{name}}、今日は急ぐ予定はない。キミが気になるものを、好きなだけ見ていこう。私は隣にいる。",
      choices: [
        {
          id: "pick-together",
          label: "一緒に読む本を選ぶ",
          response:
            "「いいな。じゃあ一冊ずつ選ぼう。帰ってから同じところで笑えたら、それも楽しそうだ」一歌はそう言って、当然のように帰宅後の時間まで二人分で考えている。",
        },
        {
          id: "coffee-longer",
          label: "もう少し喫茶店で話す",
          response:
            "「もちろん。今日はキミと過ごすために空けた日だ。時間ならまだある」一歌は柔らかく笑い、席を立つ理由など最初からないように向き直った。",
        },
      ],
    },
    {
      id: "ichika-riverside",
      place: "川沿いの遊歩道",
      title: "夕方までの散歩",
      summary: "無理のない距離を歩き、景色を見ながらのんびり過ごすデート。",
      intro:
        "{{name}}、疲れたらすぐ休もう。目的地を決めなくてもいい。キミと歩ければ、それで十分だ。",
      choices: [
        {
          id: "bench",
          label: "ベンチで景色を見る",
          response:
            "「ここにしよう」一歌は隣を空けて座り、「こういう何も決めない時間も、私はかなり好きだ。キミとならな」と静かに付け足した。",
        },
        {
          id: "take-photo",
          label: "二人の記念写真を撮る",
          response:
            "一歌は少し照れながらも断らない。「あとで私にも送ってくれ。……キミと出かけた日の写真は、ちゃんと残しておきたい」",
        },
      ],
    },
  ]),
  chihaya: freezeEvents([
    {
      id: "chihaya-market",
      place: "週末マーケット",
      title: "気ままな買い物",
      summary: "屋台や小さな店を見て回り、気になったものを一緒に選ぶデート。",
      intro:
        "{{name}}、今日は仕事の段取りも予定表もなしや。あんたが気になったとこ、片っ端から見てこ。",
      choices: [
        {
          id: "snack",
          label: "気になる屋台に寄る",
          response:
            "「せやろ、そこ気になっててん」千隼は嬉しそうに隣へ並ぶ。「半分こしよ。あんたと食べるんやったら、たぶん何でも当たりや」",
        },
        {
          id: "gift",
          label: "おそろいの小物を見る",
          response:
            "「……おそろい？」一瞬だけ目を丸くした千隼は、すぐに笑う。「ええやん。普段使えるやつにしよ。毎日目に入る方が、ウチは嬉しいし」",
        },
      ],
    },
    {
      id: "chihaya-night-view",
      place: "展望フロア",
      title: "街の灯りを見る夜",
      summary: "静かな高層階から街を眺め、ゆっくり話すデート。",
      intro:
        "{{name}}、ほら、ここやったら落ち着いて話せる。せっかくの休みやし、今日はウチがあんたを独り占めしたい気分や。",
      choices: [
        {
          id: "future",
          label: "次の休日の話をする",
          response:
            "「もう次の話するん？」と言いながら、千隼はすぐ予定を考え始める。「まあええけど。次も、その次も、あんたとの予定やったら入れたいし」",
        },
        {
          id: "stay",
          label: "もう少し景色を眺める",
          response:
            "「ええよ。帰る時間は逃げへん」千隼は肩を寄せ、「こうして隣におるん、ウチはかなり好きやで」と素直に言った。",
        },
      ],
    },
  ]),
  uryu: freezeEvents([
    {
      id: "uryu-aquarium",
      place: "水族館",
      title: "静かな青の中で",
      summary: "照明の落ち着いた館内を、自分たちのペースで巡るデート。",
      intro:
        "{{name}}、順路どおりじゃなくてもいいわ。あなたが見たいところから行きましょう。今日は私も急ぐ理由がないもの。",
      choices: [
        {
          id: "favorite",
          label: "好きな展示を教え合う",
          response:
            "雨流は少し考えてから展示を指す。「私はこれ。……あなたが何を好きか知れる方が、展示そのものより楽しみかもしれないわね」",
        },
        {
          id: "bench",
          label: "大水槽の前で休む",
          response:
            "「いいわよ」雨流は隣に座り、青い光の中で小さく笑う。「予定を詰めない休日も悪くないわ。あなたが隣にいるなら、なおさら」",
        },
      ],
    },
    {
      id: "uryu-garden",
      place: "植物園",
      title: "温室を歩く午後",
      summary: "季節の植物を眺めながら、穏やかに歩くデート。",
      intro:
        "{{name}}、畑とはまた違うでしょう。気になる植物があったら教えて。あなたが立ち止まるところ、私もちゃんと見たいから。",
      choices: [
        {
          id: "flower",
          label: "気に入った花を見つける",
          response:
            "「覚えておくわ」雨流はさらりと言う。「次に似た花を見かけた時、あなたを思い出せるでしょう。そういうの、私は嫌いじゃないの」",
        },
        {
          id: "tea",
          label: "温室カフェで休む",
          response:
            "「賛成。あなた、そろそろ休みたそうな顔をしてたもの」雨流は先に席を探し、「一緒にいる時くらい、無理を見逃すつもりはないわ」と穏やかに続けた。",
        },
      ],
    },
  ]),
  shuka: freezeEvents([
    {
      id: "shuka-food-street",
      place: "商店街の食べ歩き",
      title: "腹いっぱいの休日",
      summary: "気になる店を巡って、おいしいものを一緒に楽しむデート。",
      intro:
        "{{name}}、今日は細けえ予定なしだ！ 腹減ったら食う、面白そうなら寄る。それで十分だろ。アタシはお前と一緒なら何でも楽しいしな！",
      choices: [
        {
          id: "share",
          label: "一つ買って半分こする",
          response:
            "「おう、半分こな！」朱夏は豪快に笑う。「こういうのは二人で食う方がうまい。次の店も一緒に決めようぜ！」",
        },
        {
          id: "souvenir",
          label: "帰ってから食べる物も買う",
          response:
            "「それいいな！」朱夏はすぐ頷く。「帰った後までデートの続きってことだろ？ 最高じゃねえか。ちゃんと二人分買って帰ろうぜ！」",
        },
      ],
    },
    {
      id: "shuka-seaside",
      place: "海辺の公園",
      title: "風に当たる一日",
      summary: "海を眺め、ベンチや芝生でのんびり過ごすデート。",
      intro:
        "{{name}}、いい風だな！ 今日はどこまで行くかなんて決めなくていい。お前が帰りたくなるまで、アタシが付き合う！",
      choices: [
        {
          id: "walk",
          label: "海沿いをもう少し歩く",
          response:
            "「おう！」朱夏は嬉しそうに歩幅を合わせる。「こうやってお前の隣歩いてんの、アタシかなり好きなんだよな。旅してても結局、帰って会いたくなるし」",
        },
        {
          id: "rest",
          label: "芝生でのんびりする",
          response:
            "「いいじゃねえか。何もしねえのも休日だ！」朱夏は笑って腰を下ろし、「お前と一緒なら、こういう時間が一番ぜいたくかもしれねえな」と言った。",
        },
      ],
    },
  ]),
});

export function getDateEventsForCharacter(characterKey) {
  if (!CHARACTERS[characterKey]) return [];
  return DATE_EVENTS[characterKey] ?? [];
}

export function getDateEvent(characterKey, eventId) {
  return (
    getDateEventsForCharacter(characterKey).find((event) => event.id === eventId) ??
    null
  );
}

export function getDateChoice(dateEvent, choiceId) {
  return dateEvent?.choices?.find((choice) => choice.id === choiceId) ?? null;
}
