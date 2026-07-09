---
name: seed-spot
description: スポットを調査して seeds/ 形式のシードデータ(出典付きJSON)を生成する。特集・エリアのスポットデータ作成時に使う。
---

# seed-spot — シードスポットデータ生成

## 役割1行

指定された特集・エリアのスポットを調査し、出典付きJSONを作る。

## 成果物

- `seeds/spots/<特集名またはエリア名>.json`
- 調査サマリ(除外したスポットと理由を含む)

## 完了条件

- [ ] 全スポットに `refs`(出典)が1件以上ある
- [ ] `description` にオタク文脈(なぜ聖地か・何ゆかりか)がある
- [ ] 除外ルール(spot-researcherの表)に反するスポットがない
- [ ] `map_query` がGoogleマップで目的地にヒットする

## 手順

1. 対象(特集名・エリア・目標件数)を確認する。不明ならPMのIssueを読む
2. 一次情報(公式サイト・公式SNS・自治体観光ページ)から調査する
3. スポットごとに下のスキーマでJSONエントリを書く
4. `.claude/agents/spot-researcher.md` の除外ルールを適用する
5. 迷惑リスクがあるスポットに `caution` を書く
6. 調査サマリ(採用数・カテゴリ内訳・除外数と理由)を添えて出力する

## JSONスキーマ

```json
{
  "spots": [
    {
      "name": "○○神社",
      "description": "『作品名』第3話の舞台。ファンの絵馬奉納が多い。",
      "category": "seichi",
      "area": "神奈川県横浜市",
      "map_query": "○○神社 横浜",
      "source": "seed",
      "caution": "住宅街のため早朝・夜間の訪問と大声は控える",
      "refs": ["https://example.com/official-page"]
    }
  ]
}
```

`category`: `venue` / `seichi` / `food` / `goods` / `other`

## やらないこと

- 出典なしのスポット追加
- 憶測での `description` 記述
- 個人宅・私有地・立入禁止場所の掲載
- スキーマの変更(変更が必要なら backend-dev にIssueで依頼)

## 出力例

入力: `/seed-spot ひなたフェス会場周辺 20件`
出力: `seeds/spots/hinatafes-2026.json`(20件、全件出典付き、caution 3件)+ 調査サマリ「調査24件→採用20・除外4(私有地1・出典不足2・立入禁止1)」。
