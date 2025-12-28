import { Suspense } from "react";
import NewSnapshotClient from "./NewSnapshotClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <NewSnapshotClient />
    </Suspense>
  );
}
