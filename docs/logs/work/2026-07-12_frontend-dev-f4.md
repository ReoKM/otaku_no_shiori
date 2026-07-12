# frontend-dev 作業ログ(F4旅程専用。タスク#9との競合回避のため専用ファイル。呼び出し元把握済み)

## 13:10 W2タスク#8 F4実装: 旅程機能(Issue #40)
- Goal: S3c(旅程タブ)の旅程セクションがゲスト保存で動く(追加・編集・削除・並べ替え・日付変更・Googleマップリンク)PRが1本出ている
- 結果: 達成
- やったこと:
  - `docs/design/screens/S3c_旅程スポット.md`(レビュー反映済み最新版)・`docs/01_service_spec.md`・`docs/plans/2026-W29.md`タスク#8を確認
  - `origin/w2-integration`から`w2/task8-f4-itinerary`ブランチを作成し実装
  - 純粋関数を`src/lib/`に切り出しユニットテストを付けた:
    - `itinerary-days.ts`(`buildItineraryDayList`/`formatDayLabel`/`groupEntriesByDay`。start_date〜end_dateから日リストを生成、null・不正データ時は`null`を返す)
    - `itinerary-sort.ts`(`canMoveUpInDay`/`canMoveDownInDay`/`moveEntryInDay`/`sameDayIdsExcluding`/`computeDayChangePlan`。同日内並べ替え・日付変更時のsort_order再割当ロジック)
    - `itinerary-validation.ts`(タイトルのtrim検証、文字数上限定数)
    - 3ファイル合計33件のテスト、全件パス
  - コンポーネントを`src/components/itinerary/`に実装:
    - `ItineraryTab`(セグメントコントロールの器。しおりのstart_date/end_dateを取得し日リストを構築)
    - `SegmentedControl`(「旅程」/「行きたい場所」の2ボタン切替)
    - `ItinerarySection`(旅程セクション本体。CRUD・並べ替え・日付変更・フォールバックの状態管理)
    - `DayBlock`/`EntryRow`/`EntryRowSortMode`/`EmptyDay`/`AddEntryForm`/`ItineraryToolbar`/`ItineraryFallback`/`ItinerarySkeleton`
    - `SpotsPlaceholder`(F5用の最小プレースホルダー。タスク#9がそのまま置き換えられる構造)
  - `src/app/shiori/[id]/itinerary/page.tsx`をComingSoonから`ItineraryTab`に置き換え
  - `npm run lint && npm run typecheck && npm test`全通過(14ファイル141テスト)
  - `npm run build`成功、Playwright(Chromium)でdevサーバーを実際に操作して一連のフロー(しおり作成→旅程タブ→予定追加→Googleマップリンクの実URL確認→2件目追加→並べ替え(上下矢印)→編集+日付変更プルダウンで別日へ移動→sort_order再割当確認→2段階削除確認→行きたい場所セグメントのプレースホルダー表示→リロード後のゲスト保存永続化確認)を375px幅で目視確認。日程null(イレギュラーデータ)のフォールバック表示・並べ替えボタン非表示・編集時の日付プルダウン非表示も別途確認
  - 検証中に見つけたテストスクリプト側の不具合(削除確認ボタンのアクセシブルネームが日またぎで重複し誤って隣接日の行をクリックしていた)は原因を切り分け、アプリ側には実装バグが無いことを確認した上でスクリプトを修正して再検証した
- できていないこと: なし(スコープどおり旅程セクションのみ実装。スポットセクションはタスク#9)
- 不明点・仮置き:
  - 文字数上限(タイトル30文字/場所名50文字/メモ100文字)はS3c仕様の「不明点・仮置き」欄の記載どおりそのまま採用(仕様側で仮置き済み、実装側での追加判断なし)
  - 日程null(フォールバック)時は「並べ替え」ボタン自体を非表示にし、予定追加も提供しない(仕様「編集は他項目のみ可能」の記述に沿い、削除・編集(日付変更を除く)のみ可能とした。日ブロックが無く並べ替え・追加先の日を定義できないための実装裁量。イレギュラーなデータ・将来の仕様変更のための防御分岐であり通常は発生しない)
  - Toolbarの並べ替えボタン表示条件・件数表示・削除/追加フォームの文言・レイアウトはS3a/S3b(持ち物/TODO)の既存パターンをそのまま踏襲した
- 成果物: PR #57(base=`w2-integration`)
