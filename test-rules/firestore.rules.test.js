import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { beforeAll, afterAll, beforeEach, describe, it } from "vitest";

// Requires the Firestore emulator. Run via `npm run test:rules`, which wraps
// this with `firebase emulators:exec` so FIRESTORE_EMULATOR_HOST is set.

const WISH_LIST_DOC = "shopping/curated-wish-list";
const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const rulesPath = resolve(repoRoot, "firestore.rules");
let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-wishlist",
    firestore: { rules: readFileSync(rulesPath, "utf8") }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("firestore.rules — wish-list document", () => {
  it("denies reads and writes to unauthenticated clients", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, WISH_LIST_DOC)));
    await assertFails(setDoc(doc(db, WISH_LIST_DOC), { state: { items: [] } }));
  });

  it("allows reads and writes for any authenticated (anonymous) user", async () => {
    const db = testEnv.authenticatedContext("anon-uid-123").firestore();
    await assertSucceeds(setDoc(doc(db, WISH_LIST_DOC), { state: { items: [] } }));
    await assertSucceeds(getDoc(doc(db, WISH_LIST_DOC)));
  });
});

describe("firestore.rules — everything else is denied", () => {
  it("denies access to other documents even when authenticated", async () => {
    const db = testEnv.authenticatedContext("anon-uid-123").firestore();
    // A sibling doc under the same collection is not covered by the rule.
    await assertFails(getDoc(doc(db, "shopping/some-other-doc")));
    await assertFails(setDoc(doc(db, "shopping/some-other-doc"), { x: 1 }));
    // An unrelated collection is denied outright.
    await assertFails(getDoc(doc(db, "secrets/admin")));
    await assertFails(setDoc(doc(db, "secrets/admin"), { x: 1 }));
  });
});
