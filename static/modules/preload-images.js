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

    let settled = 0;
    const tick = () => {
        settled += 1;
        onProgress?.(settled, total);
    };

    const waitFor = (img) =>
        new Promise((resolve) => {
            const done = () => {
                if (typeof img.decode === "function") {
                    img.decode().then(resolve, resolve);
                } else {
                    resolve();
                }
            };

            if (img.complete && img.naturalWidth > 0) {
                done();
                return;
            }
            if (img.complete && img.naturalWidth === 0) {
                resolve();
                return;
            }

            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", resolve, { once: true });
        });

    return Promise.all(
        unique.map(async (url) => {
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
            }

            await waitFor(img);
            tick();
        })
    ).then(() => undefined);
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

export function setReferrerSafeImage(el, url) {
    if (!el) return;

    if (el.tagName === "IMG") {
        if (url) {
            el.referrerPolicy = "no-referrer";
            el.src = url;
            el.hidden = false;
        } else {
            el.removeAttribute("src");
            el.hidden = true;
        }
        return;
    }

    let img = el.querySelector(":scope > img.pfp-img, :scope > img.selection-pfp-img, :scope > img.combo-pfp-img");
    if (!img) {
        img = document.createElement("img");
        img.className = el.classList.contains("selection-pfp")
            ? "selection-pfp-img"
            : el.classList.contains("combo-pfp")
                ? "combo-pfp-img"
                : "pfp-img";
        img.alt = "";
        img.decoding = "async";
        img.loading = "eager";
        img.referrerPolicy = "no-referrer";
        el.prepend(img);
    }

    if (url) {
        img.src = url;
        img.hidden = false;
        el.style.setProperty("--imgurl", `url("${url}")`);
        el.style.setProperty("--bg-image", `url("${url}")`);
        el.classList.add("has-image");
    } else {
        img.removeAttribute("src");
        img.hidden = true;
        el.style.removeProperty("--imgurl");
        el.style.removeProperty("--bg-image");
        el.classList.remove("has-image");
    }
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
        if (!img.complete || img.naturalWidth === 0) pending += 1;
    }
    return pending;
}

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
