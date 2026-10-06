import { MAX_RESEARCH_BONUS } from "./quality.js";

export const COURSE_REVIEW_BONUS = 0.01;

export const RESEARCH_COURSES = Object.freeze(
  [
    {
      id: "soil-basics",
      title: "土づくり入門",
      description: "土の状態と根の育ち方を知る基礎講座です。",
      bonus: 0.08,
    },
    {
      id: "season-cycle",
      title: "季節と野菜",
      description: "旬と季節の変化を、栽培の見方として整理します。",
      bonus: 0.08,
    },
    {
      id: "water-balance",
      title: "水やりの見極め",
      description: "水分と成長の関係を学び、畑を見る目を養います。",
      bonus: 0.08,
    },
    {
      id: "harvest-quality",
      title: "収穫と品質",
      description: "収穫時の観察から、野菜の品質を考える講座です。",
      bonus: 0.08,
    },
  ].map((course) => Object.freeze(course))
);

export const LIBRARY_TOPICS = Object.freeze(
  [
    {
      id: "field-notes",
      title: "畑の観察記録",
      description: "これまでの栽培記録を読み返して、気づきを増やします。",
      bonus: 0.02,
    },
    {
      id: "vegetable-encyclopedia",
      title: "野菜図鑑",
      description: "野菜ごとの特徴をゆっくり調べます。",
      bonus: 0.02,
    },
    {
      id: "research-journal",
      title: "研究紀要",
      description: "研究所に残る短い報告を読み、知識を積み重ねます。",
      bonus: 0.02,
    },
  ].map((topic) => Object.freeze(topic))
);

export const LAB_CHARACTERS = Object.freeze({
  ichika: Object.freeze({
    key: "ichika",
    name: "一歌",
    mark: "一",
    dialogue: "焦らなくていい。キミのペースで、一つずつ確かめていこう。",
  }),
  chihaya: Object.freeze({
    key: "chihaya",
    name: "千隼",
    mark: "千",
    dialogue: "せや、ひとつずつでええ。分かったことから畑に返してこ。",
  }),
  uryu: Object.freeze({
    key: "uryu",
    name: "雨流",
    mark: "雨",
    dialogue: "必要なところから確認しましょう。無理に全部覚える必要はないわ。",
  }),
  shuka: Object.freeze({
    key: "shuka",
    name: "朱夏",
    mark: "朱",
    dialogue: "おう！ 覚えたことを畑で試しゃいい。細けえことは気にすんな！",
  }),
});

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function roundBonus(value) {
  return Math.round(nonNegativeNumber(value) * 100) / 100;
}

function addResearchBonus(saveData, requestedBonus) {
  const before = Math.min(
    MAX_RESEARCH_BONUS,
    roundBonus(saveData?.quality?.researchBonus)
  );
  const after = Math.min(
    MAX_RESEARCH_BONUS,
    roundBonus(before + requestedBonus)
  );

  saveData.quality.researchBonus = after;
  return roundBonus(after - before);
}

function ensureResearchData(saveData) {
  if (!saveData || typeof saveData !== "object") return false;

  saveData.player ??= {};
  saveData.quality ??= {};
  saveData.research ??= {};

  if (!Array.isArray(saveData.research.completedCourses)) {
    saveData.research.completedCourses = [];
  }

  if (!Array.isArray(saveData.research.studyRecords)) {
    saveData.research.studyRecords = [];
  }

  saveData.quality.researchBonus = Math.min(
    MAX_RESEARCH_BONUS,
    roundBonus(saveData.quality.researchBonus)
  );

  return true;
}

export function getResearchCourse(courseId) {
  return RESEARCH_COURSES.find((course) => course.id === courseId) ?? null;
}

export function getLibraryTopic(topicId) {
  return LIBRARY_TOPICS.find((topic) => topic.id === topicId) ?? null;
}

export function getLabCharacter(characterKey) {
  return LAB_CHARACTERS[characterKey] ?? null;
}

export function getCompletedCourseIds(saveData) {
  return new Set(
    Array.isArray(saveData?.research?.completedCourses)
      ? saveData.research.completedCourses
      : []
  );
}

export function countStudySessions(saveData, topicId = null) {
  const records = Array.isArray(saveData?.research?.studyRecords)
    ? saveData.research.studyRecords
    : [];

  if (!topicId) return records.length;

  return records.filter((record) => record?.topicId === topicId).length;
}

export function applyResearchAction(
  saveData,
  { action, id = null, now = new Date() } = {}
) {
  if (!ensureResearchData(saveData)) {
    return { changed: false, message: "研究所のデータを読み込めませんでした。" };
  }

  if (action === "course") {
    const course = getResearchCourse(id);

    if (!course) {
      return { changed: false, message: "その講座はまだ開講されていません。" };
    }

    const firstCompletion = !saveData.research.completedCourses.includes(course.id);
    const requestedBonus = firstCompletion ? course.bonus : COURSE_REVIEW_BONUS;
    const appliedBonus = addResearchBonus(saveData, requestedBonus);

    if (firstCompletion) {
      saveData.research.completedCourses.push(course.id);
    }

    if (!firstCompletion && appliedBonus <= 0) {
      return {
        changed: false,
        message: `研究補正は上限の+${MAX_RESEARCH_BONUS.toFixed(2)}です。講座はいつでも復習できます。`,
      };
    }

    const actionLabel = firstCompletion ? "受講" : "復習";
    const capText =
      saveData.quality.researchBonus >= MAX_RESEARCH_BONUS
        ? "（研究補正は上限に達しました）"
        : "";

    return {
      changed: firstCompletion || appliedBonus > 0,
      message: `${course.title}を${actionLabel}しました。研究補正 +${appliedBonus.toFixed(2)}${capText}`,
    };
  }

  if (action === "study") {
    const topic = getLibraryTopic(id);

    if (!topic) {
      return { changed: false, message: "その資料はまだ図書室にありません。" };
    }

    if (saveData.quality.researchBonus >= MAX_RESEARCH_BONUS) {
      return {
        changed: false,
        message: `研究補正は上限の+${MAX_RESEARCH_BONUS.toFixed(2)}です。図書室はいつでも読み返せます。`,
      };
    }

    const studiedAt =
      now instanceof Date && Number.isFinite(now.getTime())
        ? now.toISOString()
        : new Date().toISOString();
    const appliedBonus = addResearchBonus(saveData, topic.bonus);

    saveData.research.studyRecords.push({
      topicId: topic.id,
      studiedAt,
      bonus: appliedBonus,
    });

    const capText =
      saveData.quality.researchBonus >= MAX_RESEARCH_BONUS
        ? "（研究補正は上限に達しました）"
        : "";

    return {
      changed: appliedBonus > 0,
      message: `${topic.title}を読みました。研究補正 +${appliedBonus.toFixed(2)}${capText}`,
    };
  }

  if (action === "character") {
    const character = getLabCharacter(id);

    if (!character) {
      return { changed: false, message: "そのキャラクターは選べません。" };
    }

    if (saveData.player.favoriteCharacter === character.key) {
      return {
        changed: false,
        message: `${character.name}はすでに固定表示されています。`,
      };
    }

    saveData.player.favoriteCharacter = character.key;

    return {
      changed: true,
      message: `研究所の固定キャラを${character.name}にしました。`,
    };
  }

  return { changed: false, message: "研究所で行うことを選んでください。" };
}
