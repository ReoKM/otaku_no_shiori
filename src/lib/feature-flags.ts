/**
 * 機能の表示スイッチ(ファーストリリースで一時的に閉じる導線をここにまとめる)。
 *
 * ここで `false` にした機能は「UIの入口を隠すだけ」で、実装コードは残す。
 * 再開するときはこのファイルの値を `true` に戻すだけで元の導線が復活する。
 * コードを消してはいけない(オーナー指示: キャンペーン・後続リリースで使う)。
 */

/**
 * 「行きたい場所」の「おすすめから探す」導線(S4スポット検索への入口)。
 *
 * ファーストリリースでは追加導線を「追加する」1本に絞るため閉じる。
 * キャンペーンでおすすめスポットを配るときに `true` に戻す。
 * S4画面(`/shiori/[id]/spots/search`)とシードデータはそのまま残している。
 */
export const FEATURE_SPOT_SEED_SEARCH: boolean = false;

/**
 * 共有画像機能(S5 `/shiori/[id]/share`)の導線。
 *
 * ファーストリリースには入れないため一時的に閉じる。
 * 画面本体(`src/components/share/`)・生成Function(`netlify/functions/share-image.mts`)・
 * テンプレート(`src/templates/share-image/`)はすべて残している。
 */
export const FEATURE_SHARE: boolean = false;
