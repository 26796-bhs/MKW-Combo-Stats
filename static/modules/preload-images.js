export function preloadImages(urls, { onProgress } = {}) {
    const unique = [...new Set([...urls].filter(Boolean))];
    const total = unique.length;

    if (total === 0) {
        onProgress?.(0, 0);
        return Promise.resolve();
    }

    let host = document.getElementById("image-preload-host");
    if (!host) {
        host = document.createElement("div");
        host.id = "image-preload-host";
        host.setAttribute("aria-hidden", "true");
        host.style.cssText =
            "position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;";
        document.body.appendChild(host);
    }

    const existing = new Set(
        [...host.querySelectorAll("img")].map((img) => img.src)
    );

    let settled = 0;
    const tick = () => {
        settled += 1;
        onProgress?.(settled, total);
    };

    return new Promise((resolve) => {
        const finishIfDone = () => {
            if (settled >= total) resolve();
        };

        for (const url of unique) {
            const absolute = new URL(url, window.location.href).href;
            let img = [...host.querySelectorAll("img")].find((node) => node.src === absolute);

            if (!img) {
                img = document.createElement("img");
                img.decoding = "async";
                img.loading = "eager";
                img.referrerPolicy = "no-referrer";
                img.alt = "";
                img.src = url;
                host.appendChild(img);
            } else if (existing.has(absolute) && img.complete) {
                tick();
                finishIfDone();
                continue;
            }

            if (img.complete) {
                tick();
                finishIfDone();
            } else {
                img.addEventListener("load", () => {
                    tick();
                    finishIfDone();
                }, { once: true });
                img.addEventListener("error", () => {
                    tick();
                    finishIfDone();
                }, { once: true });
            }
        }
    });
}

export function extractCssUrl(value) {
    if (!value) return null;
    const match = value.trim().match(/^url\(["']?(.+?)["']?\)$/);
    return match ? match[1] : null;
}

export function preloadCssBackgroundUrls(root) {
    const urls = new Set();
    root.querySelectorAll('[style*="--bg-image"], [style*="--imgurl"]').forEach((el) => {
        for (const prop of ["--bg-image", "--imgurl"]) {
            const url = extractCssUrl(el.style.getPropertyValue(prop));
            if (url) urls.add(url);
        }
    });
    root.querySelectorAll("img[src]").forEach((img) => {
        if (img.getAttribute("src")) urls.add(img.getAttribute("src"));
    });
    return preloadImages([...urls]);
}

function updateLoaderProgress(loaded, total) {
    const fill = document.getElementById("asset-loader-fill");
    const label = document.getElementById("asset-loader-percent");
    const bar = document.getElementById("asset-loader-bar");
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 100;
    if (fill) fill.style.width = `${pct}%`;
    if (label) label.textContent = `${pct}%`;
    if (bar) bar.setAttribute("aria-valuenow", String(pct));
}

export function showAssetLoader() {
    const el = document.getElementById("asset-loader");
    if (!el) return;
    el.hidden = false;
    el.classList.remove("asset-loader-cover", "asset-loader-done");
    document.documentElement.classList.add("asset-loading");
    window.__MKW_SHOW_LOADER = true;
}

export function dismissAssetLoader() {
    const el = document.getElementById("asset-loader");
    document.documentElement.classList.remove("asset-loading");
    window.__MKW_SHOW_LOADER = false;
    if (!el || el.hidden) return;

    el.classList.add("asset-loader-done");
    window.setTimeout(() => {
        el.hidden = true;
        el.classList.remove("asset-loader-done", "asset-loader-cover");
    }, 280);
}

export function shouldShowAssetLoader() {
    return Boolean(window.__MKW_SHOW_LOADER);
}

function countIncomplete(urls) {
    let pending = 0;
    for (const url of urls) {
        if (!url) continue;
        const img = new Image();
        img.referrerPolicy = "no-referrer";
        img.src = url;
        if (!img.complete) pending += 1;
    }
    return pending;
}

// Preload the images
export async function preloadUrlsFromJsonElement(el) {
    let urls = [];
    if (el) {
        try {
            urls = JSON.parse(el.textContent);
        } catch (_) {
            urls = [];
        }
    }
    if (!Array.isArray(urls)) urls = [];

    const total = urls.filter(Boolean).length;
    if (total === 0) {
        dismissAssetLoader();
        return;
    }

    const skipCached = document.body.getAttribute("data-preload-skip-cached") === "true";
    const needsLoader = skipCached
        ? (shouldShowAssetLoader() || countIncomplete(urls) > 0)
        : true;

    if (!needsLoader) {
        await preloadImages(urls);
        dismissAssetLoader();
        return;
    }

    showAssetLoader();
    updateLoaderProgress(0, total);

    await preloadImages(urls, {
        onProgress(loaded, t) {
            updateLoaderProgress(loaded, t);
        },
    });

    updateLoaderProgress(total, total);
    dismissAssetLoader();
}
