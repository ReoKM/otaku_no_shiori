/**
 * `useObjectUrl.ts`の参照カウント付きURLレジストリ(`createObjectUrlRegistry`)のユニットテスト。
 *
 * `useObjectUrl`本体はブラウザ専用API(`URL.createObjectURL`)とReactのライフサイクル
 * (Strict Modeのeffect二重発火)に依存するため、Node環境のvitestで直接テストできない。
 * そこで、フックの正しさの核心である「参照カウントの増減とrevokeタイミング」を
 * `create`/`revoke`を注入可能な純粋関数として切り出し、ここでテストする。
 *
 * Issue #62の再現シナリオ(React Strict Modeのeffect二重発火: setup→cleanup→setup)を
 * 「acquire→release→acquire」という参照カウント操作の並びとしてテストし、
 * 2回目のacquireがrevoke済みURLを返さず新しいURLを作り直すことを確認する。
 */
import { describe, expect, it, vi } from "vitest";
import { createObjectUrlRegistry } from "./useObjectUrl";

function fakeBlob(): Blob {
  return new Blob(["dummy"], { type: "image/png" });
}

function createFakeProvider() {
  let counter = 0;
  const revoked: string[] = [];
  return {
    revoked,
    provider: {
      create: vi.fn(() => `blob:fake-${(counter += 1)}`),
      revoke: vi.fn((url: string) => {
        revoked.push(url);
      }),
    },
  };
}

describe("createObjectUrlRegistry", () => {
  it("同じBlobを複数回acquireすると同じURLを返し、生成は1回だけ行う", () => {
    const { provider } = createFakeProvider();
    const registry = createObjectUrlRegistry(provider);
    const blob = fakeBlob();

    const url1 = registry.acquire(blob);
    const url2 = registry.acquire(blob);

    expect(url1).toBe(url2);
    expect(provider.create).toHaveBeenCalledTimes(1);
  });

  it("参照カウントが0になるまではrevokeしない", () => {
    const { provider } = createFakeProvider();
    const registry = createObjectUrlRegistry(provider);
    const blob = fakeBlob();

    registry.acquire(blob);
    registry.acquire(blob);
    registry.release(blob);

    expect(provider.revoke).not.toHaveBeenCalled();
    expect(registry.size()).toBe(1);
  });

  it("参照カウントが0になったらrevokeし、レジストリから削除する", () => {
    const { provider } = createFakeProvider();
    const registry = createObjectUrlRegistry(provider);
    const blob = fakeBlob();

    const url = registry.acquire(blob);
    registry.release(blob);

    expect(provider.revoke).toHaveBeenCalledWith(url);
    expect(registry.size()).toBe(0);
  });

  it("Issue #62再現シナリオ(acquire→release→acquire)で、2回目のacquireは新しいURLを作り直す", () => {
    // React Strict Modeのeffect二重発火(setup→cleanup→setup)を模した並び。
    // 修正前の実装(useMemoで生成しeffectはrevokeのみ)だと、この並びで
    // 「revoke済みの1回目のURL」がそのまま使われ続け、<img>がbroken imageになっていた。
    const { provider, revoked } = createFakeProvider();
    const registry = createObjectUrlRegistry(provider);
    const blob = fakeBlob();

    const urlFromMount = registry.acquire(blob); // useStateの初期化
    registry.release(blob); // Strict Modeのcleanup(1回目のsetupに対応)
    const urlFromRemount = registry.acquire(blob); // Strict Modeの2回目のsetup

    expect(revoked).toEqual([urlFromMount]); // 1回目のURLは確かにrevokeされている
    expect(urlFromRemount).not.toBe(urlFromMount); // 2回目は新しいURLが作られる
    expect(registry.size()).toBe(1);

    // 最終的な実マウント後のcleanup(コンポーネントの実際のアンマウント)
    registry.release(blob);
    expect(revoked).toEqual([urlFromMount, urlFromRemount]);
    expect(registry.size()).toBe(0);
  });

  it("異なるBlobは独立して管理される", () => {
    const { provider } = createFakeProvider();
    const registry = createObjectUrlRegistry(provider);
    const blobA = fakeBlob();
    const blobB = fakeBlob();

    const urlA = registry.acquire(blobA);
    const urlB = registry.acquire(blobB);

    expect(urlA).not.toBe(urlB);
    expect(registry.size()).toBe(2);

    registry.release(blobA);
    expect(registry.size()).toBe(1);
  });

  it("登録されていないBlobをreleaseしても何も起きない", () => {
    const { provider } = createFakeProvider();
    const registry = createObjectUrlRegistry(provider);
    const blob = fakeBlob();

    expect(() => registry.release(blob)).not.toThrow();
    expect(provider.revoke).not.toHaveBeenCalled();
  });
});
