export async function extractTextFromImage(
  image: string,
  signal?: AbortSignal,
) {
  let worker:
    Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | undefined;
  let ended = false;
  let rejectStop: (reason: Error) => void = () => {};
  const stopped = new Promise<never>((_, reject) => {
    rejectStop = reject;
  });
  const stop = (reason: Error) => {
    ended = true;
    void worker?.terminate();
    rejectStop(reason);
  };
  const abort = () => stop(new DOMException("Cancelled", "AbortError"));
  const timer = setTimeout(
    () => stop(new Error("Label reading timed out.")),
    40000,
  );
  signal?.addEventListener("abort", abort, { once: true });
  const recognize = async () => {
    const { createWorker } = await import("tesseract.js");
    if (ended) return "";
    worker = await createWorker("eng");
    if (ended) {
      await worker.terminate();
      return "";
    }
    return (await worker.recognize(image)).data.text.trim();
  };
  try {
    if (signal?.aborted) abort();
    return await Promise.race([recognize(), stopped]);
  } finally {
    ended = true;
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    void worker?.terminate();
  }
}
