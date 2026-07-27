// Skidded from stack overflow
export function preloadImages(urls) { //cus why not
    const unique = [...new Set([...urls].filter(Boolean))];
    if (unique.length === 0) return;

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

    for (const url of unique) {
        const absolute = new URL(url, window.location.href).href;
        if (existing.has(absolute)) continue;
        const img = document.createElement("img");
        img.src = url;
        img.decoding = "async";
        img.loading = "eager";
        img.referrerPolicy = "no-referrer";
        img.alt = "";
        host.appendChild(img);
    }
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
    preloadImages(urls);
    return urls;
}

export function preloadUrlsFromJsonElement(el) {
    if (!el) return;
    try {
        preloadImages(JSON.parse(el.textContent));
    } catch (_) {
    }
}
