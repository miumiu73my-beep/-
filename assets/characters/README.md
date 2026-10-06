# STEP 15 production visual assets

STEP 15では本番画像を使用しています。旧STEP 10の仮SVGは使用しません。

## 背景
- 研究所: `assets/backgrounds/lab.webp`
- 畑: `assets/backgrounds/field.webp`
- 自宅: `assets/backgrounds/home.webp`

## 通常立ち絵・表情差分
`assets/characters/portraits.webp` は **4列 × 4行** の透過アトラスです。

- 列: 通常 / 笑顔 / 心配 / 照れ
- 行: 一歌 / 千隼 / 雨流 / 朱夏

`screens/characters.js` が表情を選択し、`assets/step10.css` がアトラスの該当セルを表示します。

## 畑用ちびキャラ
`assets/characters/chibi-atlas.webp` は **3列 × 16行** の歩行アトラスです。

- 列: 歩行3コマ
- 各キャラ4行: 前 / 後ろ / 右 / 左
- キャラ順: 一歌 / 千隼 / 雨流 / 朱夏

畑では3コマの歩行アニメーションと4方向の向きを切り替えながら移動します。

## 運用
キャラクター画像と背景画像は分離して管理します。本番素材を更新する場合は、上記WebPのアトラス配置を維持して差し替えてください。
