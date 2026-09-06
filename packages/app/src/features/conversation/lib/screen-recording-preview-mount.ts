export function mountPreviewCanvas(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  className: string,
) {
  if (canvas.parentElement === host) {
    canvas.className = className;
    return;
  }
  host.replaceChildren();
  canvas.className = className;
  canvas.setAttribute("data-screen-recording-preview", "");
  host.appendChild(canvas);
}

let compositorCanvasHost: HTMLDivElement | null = null;

function ensureCompositorCanvasHost(): HTMLDivElement {
  if (!compositorCanvasHost) {
    compositorCanvasHost = document.createElement("div");
    compositorCanvasHost.setAttribute("data-screen-recording-compositor-mount", "");
    compositorCanvasHost.style.cssText =
      "position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(compositorCanvasHost);
  }
  return compositorCanvasHost;
}

/** Keeps the live compositor canvas in the DOM while MediaRecorder is running. */
export function mountCompositorCanvas(canvas: HTMLCanvasElement) {
  const host = ensureCompositorCanvasHost();
  if (canvas.parentElement === host) return;
  host.replaceChildren();
  host.appendChild(canvas);
}

export function clearCompositorCanvasMount() {
  compositorCanvasHost?.replaceChildren();
}

export function createDisplayCanvas(className: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.className = className;
  canvas.setAttribute("data-screen-recording-preview-mirror", "");
  return canvas;
}

export function startPreviewMirror(
  source: () => HTMLCanvasElement | null,
  target: HTMLCanvasElement,
  intervalMs = 100,
): () => void {
  const timer = setInterval(() => {
    const live = source();
    if (!live?.width || !live.height) return;
    if (target.width !== live.width || target.height !== live.height) {
      target.width = live.width;
      target.height = live.height;
    }
    const ctx = target.getContext("2d");
    if (ctx) ctx.drawImage(live, 0, 0);
  }, intervalMs);

  return () => clearInterval(timer);
}
