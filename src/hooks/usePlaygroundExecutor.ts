"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { IframeExecutor } from "@/lib/playground/iframe-executor";
import { PythonExecutor } from "@/lib/playground/python-executor";

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

/** O executor de Python (Pyodide, no próprio aparelho), no mesmo formato do de HTML/JS. */
export function usePythonExecutor() {
  const [executor] = useState(() => new PythonExecutor());
  const snapshot = useSyncExternalStore(executor.subscribe, executor.getSnapshot, executor.getSnapshot);
  useEffect(() => executor.dispose, [executor]);
  return {
    ...snapshot,
    run: executor.run,
    stop: executor.stop,
    clearLogs: executor.clearLogs,
    preparar: executor.preparar,
  };
}
