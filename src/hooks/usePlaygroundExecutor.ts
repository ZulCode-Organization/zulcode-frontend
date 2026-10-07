"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { IframeExecutor } from "@/lib/playground/iframe-executor";

export function usePlaygroundExecutor() {
  const [executor] = useState(() => new IframeExecutor());
  const snapshot = useSyncExternalStore(executor.subscribe, executor.getSnapshot, executor.getSnapshot);
  useEffect(() => executor.connect(), [executor]);
  return {
    ...snapshot,
    run: executor.run,
    stop: executor.stop,
    reset: executor.reset,
    clearLogs: executor.clearLogs,
    bindFrame: executor.bindFrame,
    onFrameLoad: executor.onFrameLoad,
  };
}
