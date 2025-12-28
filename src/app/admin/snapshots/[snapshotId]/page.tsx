import SnapshotEditorClient from "./SnapshotEditorClient";

export default function Page({ params }: { params: { snapshotId: string } }) {
  return <SnapshotEditorClient snapshotId={params.snapshotId} />;
}
