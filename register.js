/**
 * register.js
 * -----------------------------------------------------------------------
 * IMPORTANT — set this to your deployed Google Apps Script Web App URL
 * (see Code.gs + README.md for deployment steps).
 * -----------------------------------------------------------------------
 */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8-Rc0JxZ45oF6nyM4HLiVDDuDlmNgf7Jlai2Y2FhM_CNhNIv3k8qi_r0hHAxzCz2f/exec";

const MAX_TEAMMATES = 5; // supports team sizes up to 6 (leader + 5 teammates)

(function () {
  "use strict";

  window.addEventListener("load", () => {
    document.getElementById("loader")?.classList.add("hidden");
  });

  const form = document.getElementById("regForm");
  if (!form) return;

  /* --------------------------------------------------- Resolve event */
  const params = new URLSearchParams(window.location.search);
  const eventParam = params.get("event");
  const event = typeof findEvent === "function"
    ? findEvent(eventParam) || findEvent("connexion26")
    : null;

  if (!event) {
    form.innerHTML = `
      <div class="text-center py-10">
        <i class="fa-solid fa-triangle-exclamation text-3xl text-amber-400 mb-4"></i>
        <h2 class="font-display text-xl font-bold mb-2">We couldn't find that event</h2>
        <p class="text-sm text-[var(--text-dim)] mb-6">Pick an event from the homepage and we'll bring you right back here.</p>
        <a href="index.html" class="btn btn-primary">Browse Events</a>
      </div>`;
    document.querySelector(".flex.items-center.gap-2.mb-10")?.remove();
    document.getElementById("eventSummary")?.remove();
    return;
  }

  const isTeamEvent = !!event.teamEvent;
  const teamMin = event.teamMin || 2;
  const teamMax = Math.min(event.teamMax || 2, MAX_TEAMMATES + 1);

  const band = BANDS[event.band];
  const eventIdInput = document.getElementById("eventId");
  const evBadge = document.getElementById("evBadge");
  const evName = document.getElementById("evName");
  const evTagline = document.getElementById("evTagline");
  const evDescription = document.getElementById("evDescription");
  const evMeta = document.getElementById("evMeta");
  const evThumbWrap = document.getElementById("evThumbWrap");
  const eventDisplay = document.getElementById("eventDisplay");

  if (eventIdInput) eventIdInput.value = event.id;
  if (evBadge) {
    evBadge.textContent = band.label;
    evBadge.style.setProperty("--c", band.hue);
  }
  if (evName) evName.textContent = event.name;
  if (evTagline) evTagline.textContent = event.tagline;
  if (evDescription) evDescription.textContent = event.description;
  if (evMeta) evMeta.innerHTML = `
    <span><i class="fa-regular fa-calendar mr-1.5"></i>${formatDate(event.date)}</span>
    <span><i class="fa-regular fa-clock mr-1.5"></i>${event.time}</span>
    <span><i class="fa-solid fa-location-dot mr-1.5"></i>${event.venue}</span>`;
  if (evThumbWrap) evThumbWrap.outerHTML = `<img src="${event.image}" alt="${event.name}" class="w-16 h-16 rounded-2xl object-cover shrink-0">`;
  if (eventDisplay) eventDisplay.value = `${event.name} — ${formatDate(event.date)}, ${event.time}`;

  /* ------------------------------------------------- Closed check */
  checkEventStatus();
  async function checkEventStatus() {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("YOUR_DEPLOYMENT_ID")) return;
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=eventStatus`);
      const data = await res.json();
      const statuses = data.statuses || {};
      if (statuses[event.id]) showClosedState();
    } catch (err) {
      console.error("Could not verify registration status:", err);
    }
  }

  function showClosedState() {
    form.innerHTML = `
      <div class="text-center py-10">
        <i class="fa-solid fa-lock text-3xl text-red-400 mb-4"></i>
        <h2 class="font-display text-xl font-bold mb-2">Registration closed</h2>
        <p class="text-sm text-[var(--text-dim)] mb-6">Registration for ${event.name} is now closed. Check the homepage for other open events.</p>
        <a href="index.html" class="btn btn-primary">Browse Events</a>
      </div>`;
    document.querySelector(".flex.items-center.gap-2.mb-10")?.remove();
  }

  /* ------------------------------------------------------- Team step */
  const soloNotice = document.getElementById("soloNotice");
  const teamFields = document.getElementById("teamFields");
  const teamStepSubtitle = document.getElementById("teamStepSubtitle");
  const participantsSelect = document.getElementById("participantsSelect");
  const teammatesContainer = document.getElementById("teammatesContainer");

  if (isTeamEvent) {
    soloNotice?.classList.add("hidden");
    teamFields?.classList.remove("hidden");
    if (teamStepSubtitle) {
      teamStepSubtitle.textContent = teamMin === teamMax
        ? `This is a group event — exactly ${teamMax} members per team.`
        : `This is a group event — between ${teamMin} and ${teamMax} members per team.`;
    }
    if (participantsSelect) {
      participantsSelect.innerHTML = "";
      for (let n = teamMin; n <= teamMax; n++) {
        const opt = document.createElement("option");
        opt.value = String(n);
        opt.textContent = `${n} (you + ${n - 1} teammate${n - 1 === 1 ? "" : "s"})`;
        participantsSelect.appendChild(opt);
      }
      participantsSelect.value = String(teamMin);
      renderTeammateFields(teamMin);
      participantsSelect.addEventListener("change", () => {
        renderTeammateFields(Number(participantsSelect.value));
      });
    }
  } else {
    teamFields?.classList.add("hidden");
    soloNotice?.classList.remove("hidden");
    if (teamStepSubtitle) teamStepSubtitle.textContent = "No teammate details needed for this event.";
  }

  function renderTeammateFields(participantCount) {
    if (!teammatesContainer) return;
    const teammateCount = Math.max(0, participantCount - 1);
    teammatesContainer.innerHTML = "";
    for (let i = 2; i <= teammateCount + 1; i++) {
      const block = document.createElement("div");
      block.className = "rounded-2xl p-5";
      block.style.background = "var(--bg-elev)";
      block.style.border = "1px solid var(--line)";
      block.innerHTML = `
        <h3 class="font-display font-semibold text-sm mb-4">Teammate ${i}</h3>
        <div class="grid sm:grid-cols-3 gap-5">
          <div class="field sm:col-span-1">
            <label>Name <span class="req">*</span></label>
            <input type="text" name="teammate${i}Name" required placeholder="Full name">
            <div class="field-error"></div>
          </div>
          <div class="field sm:col-span-1">
            <label>Roll number <span class="req">*</span></label>
            <input type="text" name="teammate${i}Roll" required placeholder="e.g. 21CS046">
            <div class="field-error"></div>
          </div>
          <div class="field sm:col-span-1">
            <label>Mobile number <span class="req">*</span></label>
            <input type="tel" name="teammate${i}Mobile" required placeholder="10-digit mobile number" maxlength="10">
            <div class="field-error"></div>
          </div>
        </div>`;
      teammatesContainer.appendChild(block);
    }
  }

  /* ------------------------------------------------------------ Steps */
  const steps = [...form.querySelectorAll(".form-step")];
  const dots = [...document.querySelectorAll(".step-dot")];
  const lines = [...document.querySelectorAll(".step-line")];
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");
  let current = 1;

  function goTo(step) {
    steps.forEach((s) => s.classList.toggle("hidden", Number(s.dataset.step) !== step));
    dots.forEach((d) => {
      const n = Number(d.dataset.step);
      d.classList.toggle("active", n === step);
      d.classList.toggle("done", n < step);
      d.textContent = n < step ? "✓" : n;
    });
    lines.forEach((l) => l.classList.toggle("done", Number(l.dataset.line) < step));
    prevBtn?.classList.toggle("hidden", step === 1);
    nextBtn?.classList.toggle("hidden", step === steps.length);
    submitBtn?.classList.toggle("hidden", step !== steps.length);
    if (step === steps.length) buildReview();
    current = step;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  nextBtn?.addEventListener("click", () => {
    if (validateStep(current)) goTo(current + 1);
  });
  prevBtn?.addEventListener("click", () => goTo(current - 1));

  /* -------------------------------------------------------- Validation */
  function validateStep(step) {
    let ok = true;
    const scope = steps.find((s) => Number(s.dataset.step) === step);
    if (!scope) return false;
    scope.querySelectorAll("input[required], select[required]").forEach((el) => {
      // Skip fields inside hidden containers (e.g. team fields on a solo event)
      if (el.closest(".hidden")) return;

      const errBox = el.closest(".field")?.querySelector(".field-error");
      let msg = "";

      if (el.type === "checkbox") {
        if (!el.checked) msg = "Please accept the terms to continue.";
      } else if (el.type === "file") {
        if (!el.files || !el.files.length) {
          msg = "Please upload your ID card photo.";
        } else if (el.files[0].size > 5 * 1024 * 1024) {
          msg = "File is too large — max 5MB.";
        }
      } else {
        const val = el.value.trim();
        if (!val) {
          msg = "This field is required.";
        } else if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          msg = "Enter a valid email address.";
        } else if (el.type === "tel" && !/^[6-9]\d{9}$/.test(val)) {
          msg = "Enter a valid 10-digit mobile number.";
        }
      }

      el.classList.toggle("invalid", !!msg);
      if (errBox) errBox.textContent = msg;
      if (msg) ok = false;
    });

    const terms = document.getElementById("termsCheck");
    if (terms && step === 3) {
      const termsErr = terms.closest("section")?.querySelector(".field-error");
      if (!terms.checked) {
        if (termsErr) termsErr.textContent = "Please accept the terms to continue.";
        ok = false;
      } else if (termsErr) {
        termsErr.textContent = "";
      }
    }
    return ok;
  }

  /* ------------------------------------------------------------ Upload */
  const dropZone = document.getElementById("dropZone");
  const idUpload = document.getElementById("idUpload");
  const dropLabel = document.getElementById("dropLabel");
  if (dropZone && idUpload) {
    dropZone.addEventListener("click", () => idUpload.click());
    ["dragover", "dragleave", "drop"].forEach((evt) =>
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.classList.toggle("drag", evt === "dragover");
        if (evt === "drop") {
          const file = e.dataTransfer?.files?.[0];
          if (file) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            idUpload.files = dataTransfer.files;
            updateDropLabel();
          }
        }
      })
    );
  }
  idUpload?.addEventListener("change", updateDropLabel);
  function updateDropLabel() {
    const f = idUpload?.files?.[0];
    if (dropLabel) {
      dropLabel.textContent = f ? `Selected: ${f.name}` : "Click to upload, or drag your ID card photo here (image, max 5MB)";
    }
  }

  /* ------------------------------------------------------------ Review */
  function buildReview() {
    const fd = new FormData(form);
    const rows = [
      ["Name", fd.get("fullName")],
      ["Roll number", fd.get("rollNumber")],
      ["Class / Section", `${fd.get("className") || ""} · ${fd.get("section") || ""}`],
      ["Mobile", fd.get("mobile")],
      ["Email", fd.get("email")],
    ];
    if (isTeamEvent) {
      const count = Number(participantsSelect?.value || teamMin);
      rows.push(["Participants", count]);
      for (let i = 2; i <= count; i++) {
        rows.push([`Teammate ${i}`, `${fd.get(`teammate${i}Name`) || ""} · ${fd.get(`teammate${i}Roll`) || ""} · ${fd.get(`teammate${i}Mobile`) || ""}`]);
      }
    }
    const reviewCard = document.getElementById("reviewCard");
    if (reviewCard) {
      reviewCard.innerHTML = rows
        .map(([k, v]) => `<div class="flex justify-between gap-4"><span class="text-[var(--text-dim)]">${k}</span><span class="font-medium text-right">${v || "—"}</span></div>`)
        .join("");
    }
  }

  /* --------------------------------------------------- File -> base64 */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1] || "");
      reader.onerror = () => reject(new Error("Could not read the uploaded file."));
      reader.readAsDataURL(file);
    });
  }

  /* ------------------------------------------------------------ Submit */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    submitBtn.disabled = true;
    const submitLabel = document.getElementById("submitLabel");
    if (submitLabel) submitLabel.innerHTML = `<span class="spinner"></span> Submitting…`;
    const submitOverlay = document.getElementById("submitOverlay");
    submitOverlay?.classList.remove("hidden");

    try {
      const fd = new FormData(form);
      const idFile = idUpload?.files?.[0];
      const idPhotoBase64 = idFile ? await fileToBase64(idFile) : "";

      const participantCount = isTeamEvent ? Number(participantsSelect?.value || teamMin) : 1;
      const teammates = [];
      if (isTeamEvent) {
        for (let i = 2; i <= participantCount; i++) {
          teammates.push({
            name: fd.get(`teammate${i}Name`) || "",
            rollNumber: fd.get(`teammate${i}Roll`) || "",
            mobile: fd.get(`teammate${i}Mobile`) || "",
          });
        }
      }

      const payload = {
        eventId: event.id,
        eventName: event.name,
        band: event.band,
        fullName: fd.get("fullName"),
        rollNumber: fd.get("rollNumber"),
        className: fd.get("className"),
        section: fd.get("section"),
        mobile: fd.get("mobile"),
        email: fd.get("email"),
        isTeamEvent: isTeamEvent ? "Yes" : "No",
        participants: participantCount,
        teammates,
        idPhoto: {
          fileName: idFile ? idFile.name : "",
          mimeType: idFile ? idFile.type : "",
          data: idPhotoBase64,
        },
      };

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, error: text };
      }

      if (!res.ok || !data.success) {
        const errMsg = data.error || `Registration failed (${res.status})`;
        throw new Error(errMsg);
      }

      const regId = data.registrationId || generateFallbackId(event.id);
      const q = new URLSearchParams({
        regId,
        name: payload.fullName,
        event: event.name,
        date: formatDate(event.date),
        time: event.time,
        venue: event.venue,
      });
      const successUrl = new URL("success.html", window.location.href);
      successUrl.search = q.toString();
      window.location.href = successUrl.href;
    } catch (err) {
      console.error("Registration submit error:", err);
      submitOverlay?.classList.add("hidden");
      submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = "Submit Registration";
      const message = err.message || "Something went wrong. Please try again.";
      window.showToast?.(message, "error") ||
        alert(message);
    }
  });

  function generateFallbackId(eventId) {
    const prefix = eventId.slice(0, 3).toUpperCase();
    return `SPEC26-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  goTo(1);
})();
