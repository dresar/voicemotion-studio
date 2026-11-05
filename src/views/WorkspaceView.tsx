"use client";

import { ProtectedPage } from "@/components/layout/ProtectedPage";
import { WorkspaceView as WorkspaceStudio } from "@/components/workspace/WorkspaceView";

export default function WorkspaceView() {
  return (
    <ProtectedPage>
      <WorkspaceStudio />
    </ProtectedPage>
  );
}

