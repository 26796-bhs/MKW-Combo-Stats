import { get_combo, get_upvotes, upvote_combo, downvote_combo } from "../modules/communication-service.js";
import { preloadUrlsFromJsonElement, setReferrerSafeImage } from "../modules/preload-images.js";

function updateStatsBar(sectionName, statName, floatValue) {
    const percentageString = `${floatValue * 100}%`
    const sections = document.querySelectorAll('.sections .section');

    sections.forEach(section => {
        const sectionTitle = section.querySelector('.section-title')

        if (sectionTitle && sectionTitle.textContent.trim().toUpperCase() === sectionName.toUpperCase()) {
            const statRows = section.querySelectorAll('[class^="section-stats-"]')
            statRows.forEach(row => {
                const subsectionTitle = row.querySelector('.stats-title');
                if (subsectionTitle && subsectionTitle.textContent.trim().toLowerCase() === statName.toLowerCase()) {
                    const progressValueEl = row.querySelector('.stats-progress-value');
                    if (progressValueEl) {
                        progressValueEl.style.setProperty('--value', percentageString)
                    }
                }
            });
        }
    });
}


document.addEventListener("DOMContentLoaded", async function () {
    await preloadUrlsFromJsonElement(document.getElementById("preload-image-urls"));

    const dropdowns = document.querySelectorAll('.dropdown-box');
    const selections = document.querySelectorAll('.selection');
    const charEl = document.querySelector('.selected-character-pfp');
    const vehEl = document.querySelector('.selected-vehicle-pfp');
    const selectedCharacter = [
        charEl,
        document.querySelector('.name-arc-character').querySelector('textPath'),
        charEl?.dataset.hiddenid || '0'
    ]
    const selectedVehicle = [
        vehEl,
        document.querySelector('.name-arc-vehicle').querySelector('textPath'),
        vehEl?.dataset.hiddenid || '0'
    ]

    dropdowns.forEach(function (dropdown) {
        const contentBox = dropdown.querySelector('.dropdown-contentbox');
        if (contentBox) {
            contentBox.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }

        dropdown.addEventListener('click', function (e) {
            // Only toggle when clicking the top 50px of the dropdown
            if (e.offsetY <= 50) {
                const isCollapsed = dropdown.classList.contains('dropdown-collapsed');
                if (isCollapsed) {
                    dropdown.classList.remove('dropdown-collapsed');
                    dropdown.classList.add('dropdown-expanded');
                } else {
                    dropdown.classList.remove('dropdown-expanded');
                    dropdown.classList.add('dropdown-collapsed');
                }
            }
        });
    });


    async function updateStats() {
        const data = await get_combo(selectedCharacter[2], selectedVehicle[2])
        updateStatsBar("SPEED", "On Road", data[0])
        updateStatsBar("SPEED", "Off Road", data[1])
        updateStatsBar("SPEED", "In Water", data[2])
        updateStatsBar("HANDLING", "On Road", data[3])
        updateStatsBar("HANDLING", "Off Road", data[4])
        updateStatsBar("HANDLING", "In Water", data[5])
        updateStatsBar("OTHER", "Accel", data[6])
        updateStatsBar("OTHER", "Turbo", data[7])
        updateStatsBar("OTHER", "Weight", data[8])
        await refreshUpvoteCount()
    }

    const upvoteCountEl = document.getElementById("upvote-count");
    const upvoteCaption = document.getElementById("upvote-caption");
    const upvoteBtn = document.getElementById("upvote-btn");
    const shareBtn = document.getElementById("share-btn");
    let hasVoted = false;

    function hasComboSelected() {
        return selectedCharacter[2] != null
            && selectedCharacter[2] !== ""
            && selectedVehicle[2] != null
            && selectedVehicle[2] !== "";
    }

    function setVoteUi(count, voted) {
        hasVoted = Boolean(voted);
        if (upvoteCountEl) upvoteCountEl.textContent = String(count);
        if (upvoteCaption) upvoteCaption.hidden = !hasComboSelected();
        if (upvoteBtn) upvoteBtn.textContent = hasVoted ? "Downvote" : "Upvote";
    }

    async function refreshUpvoteCount() {
        if (!hasComboSelected()) {
            if (upvoteCaption) upvoteCaption.hidden = true;
            if (upvoteBtn) upvoteBtn.textContent = "Upvote";
            hasVoted = false;
            return;
        }
        const data = await get_upvotes(selectedCharacter[2], selectedVehicle[2]);
        setVoteUi(data.upvotes, data.voted);
    }

    if (upvoteBtn) {
        upvoteBtn.addEventListener("click", async () => {
            if (!hasComboSelected()) return;
            upvoteBtn.disabled = true;
            if (shareBtn) shareBtn.disabled = true;
            try {
                const data = hasVoted
                    ? await downvote_combo(selectedCharacter[2], selectedVehicle[2])
                    : await upvote_combo(selectedCharacter[2], selectedVehicle[2]);
                setVoteUi(data.upvotes, data.voted);
            } catch (err) {
                console.error(err);
            } finally {
                upvoteBtn.disabled = false;
                if (shareBtn) shareBtn.disabled = false;
            }
        });
    }

    selections.forEach(function (selection) {
        const name = selection.querySelector('textPath');
        const isCharacter = selection.closest('#character-dropdown');
        const isVehicle = selection.closest('#vehicle-dropdown');
        const hiddenid = selection.dataset.hiddenid
        const imgUrl = selection.dataset.imgurl
            || selection.querySelector('.selection-pfp-img')?.getAttribute('src')
            || '';
        selection.addEventListener('click', async function () {
            if (isCharacter && selectedCharacter[2] != hiddenid) {
                setReferrerSafeImage(selectedCharacter[0], imgUrl);
                selectedCharacter[0].dataset.imgurl = imgUrl;
                selectedCharacter[0].dataset.hiddenid = hiddenid;
                selectedCharacter[1].textContent = name.textContent
                selectedCharacter[2] = hiddenid
                await updateStats()
            } else if (isVehicle && selectedVehicle[2] != hiddenid) {
                setReferrerSafeImage(selectedVehicle[0], imgUrl);
                selectedVehicle[0].dataset.imgurl = imgUrl;
                selectedVehicle[0].dataset.hiddenid = hiddenid;
                selectedVehicle[1].textContent = name.textContent
                selectedVehicle[2] = hiddenid
                await updateStats()
            }
        })
    })

    await updateStats()

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    function isMobileShareDevice() {
        return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
    }

    const shareStatus = document.getElementById("share-status");
    let shareStatusTimeout = null;

    function showShareStatus(message, isError) {
        if (!shareStatus) return;
        window.clearTimeout(shareStatusTimeout);
        shareStatus.textContent = message;
        shareStatus.classList.toggle("share-status-error", !!isError);
        shareStatus.hidden = false;
        shareStatusTimeout = window.setTimeout(() => {
            shareStatus.hidden = true;
        }, 4000);
    }

    if (shareBtn) {
        shareBtn.addEventListener("click", async () => {
            const card = document.querySelector(".stats-card");
            if (!card || typeof html2canvas !== "function") {
                showShareStatus("Sharing isn't available on this browser.", true);
                return;
            }

            shareBtn.disabled = true;
            if (upvoteBtn) upvoteBtn.disabled = true;
            shareBtn.setAttribute("aria-busy", "true");

            let mount = null;
            try {
                mount = document.createElement("div");
                mount.style.cssText = "position:fixed;left:-10000px;top:0;width:360px;pointer-events:none;opacity:1;";
                const clone = card.cloneNode(true);
                clone.classList.add("stats-card-share-capture");
                clone.style.cssText = [
                    "position:relative",
                    "width:360px",
                    "height:auto",
                    "left:auto",
                    "right:auto",
                    "top:auto",
                    "bottom:auto",
                    "margin:0",
                    "overflow:hidden",
                    "display:flex",
                    "flex-direction:column",
                ].join(";");
                clone.querySelectorAll("#share-btn, #upvote-btn, .split-action, #share-status, .share-status, #upvote-caption, .upvote-caption, .card-actions, .action-btn").forEach((el) => el.remove());

                // Force the same fixed layout for every capture, regardless of the
                // device's own viewport/media-query breakpoint. Without this, a
                // capture taken on a narrow phone screen would use the compact
                // mobile sizing while a desktop capture uses the roomier default
                // sizing, and html2canvas's own layout pass can disagree with
                // whichever one produced the clone, causing overlap/misalignment.
                const header = clone.querySelector(".stats-header");
                if (header) {
                    header.style.cssText += ";height:160px;flex:0 0 auto;";
                }

                clone.querySelectorAll(".selected-pfp").forEach((el) => {
                    el.style.cssText += ";width:95px;height:95px;top:28px;";
                });
                const charPfp = clone.querySelector(".selected-character-pfp");
                if (charPfp) charPfp.style.cssText += ";left:15%;right:auto;";
                const vehPfp = clone.querySelector(".selected-vehicle-pfp");
                if (vehPfp) vehPfp.style.cssText += ";right:15%;left:auto;";

                clone.querySelectorAll(".name-arc").forEach((el) => {
                    el.style.cssText += ";width:175px;top:112px;";
                });
                const charArc = clone.querySelector(".name-arc-character");
                if (charArc) charArc.style.cssText += ";left:calc(15% + 47.5px);right:auto;transform:translateX(-50%);";
                const vehArc = clone.querySelector(".name-arc-vehicle");
                if (vehArc) vehArc.style.cssText += ";right:calc(15% + 47.5px);left:auto;transform:translateX(50%);";

                const eks = clone.querySelector(".eks");
                if (eks) eks.style.cssText += ";top:63px;width:25px;";

                const sections = clone.querySelector(".sections");
                if (sections) {
                    sections.style.overflow = "visible";
                    sections.style.flex = "0 0 auto";
                    sections.style.maxHeight = "none";
                    sections.style.marginBottom = "20px";
                }

                clone.querySelectorAll(".stats-progress-value").forEach((el) => {
                    const value = el.style.getPropertyValue("--value") || getComputedStyle(el).getPropertyValue("--value") || "0%";
                    el.style.width = value.trim() || "0%";
                    el.style.filter = "none";
                    el.style.boxShadow = "none";
                });
                clone.querySelectorAll(".stats-progress-bar").forEach((el) => {
                    el.style.filter = "none";
                    // html2canvas doesn't clip inset box-shadow to border-radius correctly,
                    // leaving a grey rectangular smudge poking past the pill's rounded end.
                    el.style.boxShadow = "none";
                });

                clone.querySelectorAll("img[src]").forEach((img) => {
                    let src = img.getAttribute("src") || "";
                    if (!src) return;
                    if (!src.startsWith("/proxy-image") && !src.startsWith("blob:") && !src.startsWith("data:")) {
                        const absolute = new URL(src, window.location.href).href;
                        img.crossOrigin = "anonymous";
                        img.referrerPolicy = "no-referrer";
                        img.src = `/proxy-image?url=${encodeURIComponent(absolute)}`;
                    }
                });

                // html2canvas doesn't honour `object-fit: cover` on <img> elements
                // (it just stretches the raw image to the box), so swap each pfp
                // over to a plain CSS background-image, which it renders correctly.
                clone.querySelectorAll(".selected-pfp").forEach((el) => {
                    const img = el.querySelector("img.pfp-img");
                    if (img && img.src) {
                        el.style.backgroundImage = `url("${img.src}")`;
                        el.style.backgroundSize = "cover";
                        el.style.backgroundPosition = "top center";
                        el.style.backgroundRepeat = "no-repeat";
                        img.style.display = "none";
                    }
                });

                // The rounded "app card" corners only make sense inside the live UI;
                // a standalone shared image looks cleaner as a plain rectangle.
                const cornerOverride = document.createElement("style");
                cornerOverride.textContent = ".stats-card-share-capture, .stats-card-share-capture::before { border-radius: 0 !important; }";
                mount.appendChild(cornerOverride);

                mount.appendChild(clone);
                document.body.appendChild(mount);

                await Promise.all([...clone.querySelectorAll("img")].map((img) => {
                    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                    return new Promise((resolve) => {
                        img.addEventListener("load", resolve, { once: true });
                        img.addEventListener("error", resolve, { once: true });
                    });
                }));

                if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                }
                // Give the browser a frame to actually paint the newly-loaded
                // fonts/images before html2canvas reads pixel data.
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

                const canvas = await html2canvas(clone, {
                    backgroundColor: "#ffffff",
                    useCORS: true,
                    allowTaint: false,
                    scale: 2,
                    width: 360,
                    windowWidth: 360,
                });

                const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
                if (!blob) throw new Error("Could not create image");

                const charName = selectedCharacter[1]?.textContent?.trim() || "Character";
                const vehName = selectedVehicle[1]?.textContent?.trim() || "Vehicle";
                const filename = `mkw-combo-${charName}-${vehName}.png`.replace(/\s+/g, "-").toLowerCase();
                const file = new File([blob], filename, { type: "image/png" });

                const canFileShare = isMobileShareDevice()
                    && typeof navigator.canShare === "function"
                    && navigator.canShare({ files: [file] });

                if (canFileShare) {
                    try {
                        await navigator.share({
                            title: "MKW Combo Stats",
                            text: `${charName} + ${vehName}`,
                            files: [file],
                        });
                    } catch (shareErr) {
                        if (shareErr?.name !== "AbortError") {
                            downloadBlob(blob, filename);
                            showShareStatus("Couldn't open the share sheet, so the image was downloaded instead.", true);
                        }
                    }
                } else {
                    downloadBlob(blob, filename);
                    showShareStatus("Image downloaded.", false);
                }
            } catch (err) {
                if (err?.name !== "AbortError") {
                    console.error(err);
                    showShareStatus("Couldn't create the share image. Please try again.", true);
                }
            } finally {
                mount?.remove();
                shareBtn.disabled = false;
                shareBtn.removeAttribute("aria-busy");
                if (upvoteBtn) upvoteBtn.disabled = false;
            }
        });
    }
});
