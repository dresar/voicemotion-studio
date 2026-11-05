"use client";

import { ProtectedPage } from "@/components/layout/ProtectedPage";
import { WorkspaceView } from "@/components/workspace/WorkspaceView";

export default function WorkspacePage() {
  return (
    <ProtectedPage>
      <WorkspaceView />
    </ProtectedPage>
  );
}
