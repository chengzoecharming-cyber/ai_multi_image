/**
 * Shared background queue for image persistence.
 *
 * Problem: when the gallery scrolls through many old images, each one
 * triggers a /persist-image API call. Without throttling this creates a
 * thundering-herd of full-size image downloads on the server.
 *
 * Solution: a module-level singleton queue with a concurrency limit.
 * Callers fire-and-forget; the queue processes at most MAX_CONCURRENT
 * persist jobs at a time.
 */

const MAX_CONCURRENT = 2;

interface Job {
  taskId: string;
  imageUrl: string;
  onDone?: (data: { localUrl?: string; thumbUrl?: string }) => void;
}

const queue: Job[] = [];
const inFlight = new Set<string>();

function jobKey(job: Job): string {
  return `${job.taskId}:${job.imageUrl}`;
}

async function runNext() {
  if (inFlight.size >= MAX_CONCURRENT) return;
  const job = queue.shift();
  if (!job) return;

  const key = jobKey(job);
  inFlight.add(key);

  try {
    const res = await fetch(`/api/ai-image/tasks/${job.taskId}/persist-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: job.imageUrl }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        localUrl?: string;
        thumbUrl?: string;
      };
      job.onDone?.(data);
    }
  } catch {
    /* ignore background errors */
  } finally {
    inFlight.delete(key);
    // Process next job(s)
    void runNext();
  }
}

export function enqueuePersist(
  taskId: string,
  imageUrl: string,
  onDone?: (data: { localUrl?: string; thumbUrl?: string }) => void
) {
  const job: Job = { taskId, imageUrl, onDone };
  const key = jobKey(job);

  // Already in-flight or queued – skip duplicate
  if (inFlight.has(key)) return;
  if (queue.some((j) => jobKey(j) === key)) return;

  queue.push(job);
  void runNext();
}
