import { useEffect, useMemo, useRef, useState } from "react";
import { Player, Dom, Module, Effect, Webcam } from "@banuba/webar";

import dataUrl from "@banuba/webar/BanubaSDK.data?url";
import wasmUrl from "@banuba/webar/BanubaSDK.wasm?url";
import simdUrl from "@banuba/webar/BanubaSDK.simd.wasm?url";

// Benuba Module (Я использовал только FaceTracker)
import faceTrackerZip from "@banuba/webar/face_tracker.zip?url";
// My Effects (Создать свой эффект --> https://studio.banuba.com/)
import sberEffect from "../effects/effect_sber.zip";

export default function BanubaFaceTracker() {
  const containerRef = useRef(null);
  const photoCanvasRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [canDownload, setCanDownload] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [showConsent, setShowConsent] = useState(true);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [warming, setWarming] = useState(false);
  const [warmed, setWarmed] = useState(false);

  const token = useMemo(() => import.meta.env.VITE_BANUBA_TOKEN || "", []);

  const playerRef = useRef(null);
  const webcamRef = useRef(null);
  const warmupPromiseRef = useRef(null);
  const warmupContainerRef = useRef(null);

  // Preload+Prefetch тяжёлых файлов (WASM/DATA/SIMD/модуль/эффект)
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const urls = [dataUrl, wasmUrl, simdUrl, faceTrackerZip, sberEffect];
    const links = [];
    urls.forEach((href) => {
      const preload = document.createElement("link");
      preload.rel = "preload";
      preload.as = "fetch";
      preload.href = href;

      try {
        if ("fetchPriority" in preload) preload.fetchPriority = "high";
      } catch {}
      if (href.endsWith(".wasm")) preload.type = "application/wasm";
      document.head.appendChild(preload);
      links.push(preload);

      const prefetch = document.createElement("link");
      prefetch.rel = "prefetch";
      prefetch.as = "fetch";
      prefetch.href = href;
      document.head.appendChild(prefetch);
      links.push(prefetch);
    });
    return () => {
      links.forEach((l) => l.parentNode && l.parentNode.removeChild(l));
    };
  }, []);

  useEffect(
    () => () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    },
    [downloadUrl]
  );

  async function warmupPlayer() {
    if (playerRef.current) return;
    if (warmupPromiseRef.current) return warmupPromiseRef.current;
    setWarming(true);
    warmupPromiseRef.current = (async () => {
      const player = await Player.create({
        clientToken: token,
        locateFile: {
          "BanubaSDK.data": dataUrl,
          "BanubaSDK.wasm": wasmUrl,
          "BanubaSDK.simd.wasm": simdUrl,
        },
      });
      playerRef.current = player;
      await player.addModule(new Module(faceTrackerZip));
      await player.applyEffect(new Effect(sberEffect));
      if (typeof document !== "undefined" && !warmupContainerRef.current) {
        const warm = document.createElement("div");
        warm.style.cssText =
          "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;";
        document.body.appendChild(warm);
        warmupContainerRef.current = warm;
        try {
          Dom.render(player, warm);
        } catch {}
      }
      setWarmed(true);
    })();
    try {
      await warmupPromiseRef.current;
    } finally {
      setWarming(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    warmupPlayer().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (bootAttempt === 0) return;
    let canceled = false;

    async function boot() {
      setLoading(true);
      setError("");
      setRunning(false);
      setCanDownload(false);

      if (!token) {
        setError("Не найден токен Banuba. Добавьте VITE_BANUBA_TOKEN в .env.");
        setLoading(false);
        setShowConsent(true);
        return;
      }

      try {
        if (!playerRef.current) {
          await warmupPlayer();
        }
        if (canceled) return;
        const player = playerRef.current;

        const webcam = new Webcam({
          width: 1280,
          height: 720,
          facingMode: "user",
          audio: false,
        });
        webcamRef.current = webcam;
        await webcam.start();
        await player.use(webcam);

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          Dom.render(player, containerRef.current);
        }

        await player.play();
        if (canceled) return;
        player.setVolume?.(0);

        setRunning(true);
        setLoading(false);
        setShowConsent(false);

        if (
          warmupContainerRef.current &&
          warmupContainerRef.current.parentNode
        ) {
          warmupContainerRef.current.parentNode.removeChild(
            warmupContainerRef.current
          );
          warmupContainerRef.current = null;
        }
      } catch (e) {
        console.error("Banuba: ошибка инициализации", e);
        if (canceled) return;
        setError(
          "Не удалось инициализировать камеру или SDK. Проверьте разрешения и токен."
        );
        setLoading(false);
        setRunning(false);
        setShowConsent(true);

        try {
          playerRef.current?.stop?.();
          playerRef.current?.dispose?.();
        } catch {}
        try {
          webcamRef.current?.stop?.();
        } catch {}
        playerRef.current = null;
        webcamRef.current = null;
      }
    }

    boot();
    return () => {
      canceled = true;
      try {
        playerRef.current?.stop?.();
        playerRef.current?.dispose?.();
      } catch {}
      try {
        webcamRef.current?.stop?.();
      } catch {}
      playerRef.current = null;
      webcamRef.current = null;
      if (warmupContainerRef.current && warmupContainerRef.current.parentNode) {
        warmupContainerRef.current.parentNode.removeChild(
          warmupContainerRef.current
        );
        warmupContainerRef.current = null;
      }
    };
  }, [bootAttempt, token]);

  async function handleCapture() {
    if (!running) return;
    try {
      const outCanvas = photoCanvasRef.current;
      if (!outCanvas || !containerRef.current) return;
      const ctx = outCanvas.getContext("2d");
      const banubaCanvas = containerRef.current.querySelector("canvas");
      if (!banubaCanvas) {
        alert("Не удалось найти canvas с изображением камеры.");
        return;
      }
      outCanvas.width = banubaCanvas.width;
      outCanvas.height = banubaCanvas.height;
      ctx.drawImage(banubaCanvas, 0, 0);

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl("");
      }

      const blob = await new Promise((resolve, reject) => {
        try {
          outCanvas.toBlob((result) => {
            if (result) resolve(result);
            else reject(new Error("Не удалось экспортировать изображение."));
          }, "image/png");
        } catch (err) {
          reject(err);
        }
      });

      const objectUrl = URL.createObjectURL(blob);
      setDownloadUrl(objectUrl);
      setCanDownload(true);
    } catch (e) {
      console.error("Ошибка сохранения снимка", e);
    }
  }

  function handleDownload() {
    if (!downloadUrl) return;
    const link = document.createElement("a");
    const supportsDownload = "download" in HTMLAnchorElement.prototype;
    if (supportsDownload) {
      link.href = downloadUrl;
      link.download = `photo-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (navigator.canShare && navigator.canShare({ url: downloadUrl })) {
      navigator.share({ url: downloadUrl }).catch(() => {
        window.open(downloadUrl, "_blank", "noopener");
      });
    } else {
      window.open(downloadUrl, "_blank", "noopener");
    }
  }

  function handleRequestAccess() {
    if (loading) return;
    setShowConsent(false);
    setError("");
    setBootAttempt((prev) => prev + 1);
  }

  return (
    <div className="relative w-full overflow-hidden rounded-md full-screen-adjusted">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 text-white text-lg">
          Идёт инициализация камеры...
        </div>
      )}

      {!showConsent && !!error && (
        <div className="absolute inset-x-0 top-0 z-30 p-3 text-center bg-amber-500/20 text-amber-200">
          {error}
        </div>
      )}

      <div id="webar-app" ref={containerRef} className="w-full h-full" />

      <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center gap-4">
        <button
          onClick={handleCapture}
          disabled={!running}
          className="w-20 h-20 rounded-full border-[5px] border-white bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.4)] disabled:opacity-40"
          aria-label="Сделать фото"
        />

        <button
          onClick={handleDownload}
          style={{ display: canDownload ? "inline-flex" : "none" }}
          className="px-6 py-3 rounded-lg font-semibold text-lg bg-emerald-500 text-white"
        >
          Скачать
        </button>
      </div>

      <canvas ref={photoCanvasRef} className="hidden" />

      {showConsent && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 px-4">
          <div className="w-full max-w-sm rounded-xl bg-neutral-900 p-6 text-center shadow-2xl">
            <h2 className="text-xl font-semibold text-white">
              Разрешите доступ к камере
            </h2>
            <p className="mt-3 text-sm text-neutral-300">
              Чтобы запустить отслеживание лица, нам нужно ваше разрешение.
              Нажмите кнопку и подтвердите запрос браузера.
            </p>
            <button
              onClick={handleRequestAccess}
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-emerald-500 px-5 py-3 text-base font-medium text-white hover:bg-emerald-400 disabled:opacity-40"
            >
              {loading ? "Запрос доступа..." : "Разрешить камеру"}
            </button>
            {!!error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
