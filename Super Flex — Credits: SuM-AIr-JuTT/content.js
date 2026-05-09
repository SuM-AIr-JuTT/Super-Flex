async function DarkModeMainFunction(enable) {
  const topLeftDivId = "jugadu-top-left-overlay";

  if (!document.getElementById("jugadu-dark-style")) {
    const style = document.createElement("style");
    style.id = "jugadu-dark-style";
    style.textContent = `
      body.jugadu-dark-mode,
      body.jugadu-dark-mode div,
      body.jugadu-dark-mode section,
      body.jugadu-dark-mode header,
      body.jugadu-dark-mode main,
      body.jugadu-dark-mode footer,
      body.jugadu-dark-mode table,
      body.jugadu-dark-mode tbody,
      body.jugadu-dark-mode tr,
      body.jugadu-dark-mode td,
      body.jugadu-dark-mode th,
      body.jugadu-dark-mode input,
      body.jugadu-dark-mode select,
      body.jugadu-dark-mode textarea,
      body.jugadu-dark-mode .card,
      body.jugadu-dark-mode .panel,
      body.jugadu-dark-mode .panel-body {
        background-color: #121212 !important;
        color: #e0e0e0 !important;
        border-color: #333 !important;
      }
      body.jugadu-dark-mode a { color: #bb86fc !important; }
      body.jugadu-dark-mode .btn { background-color: #333 !important; color: #fff !important; }
    `;
    document.head.appendChild(style);
  }

  if (enable === true) {
    document.body.classList.add("jugadu-dark-mode");
    if (!document.getElementById(topLeftDivId)) {
      const d = document.createElement('div');
      d.id = topLeftDivId;
      Object.assign(d.style, { position: 'fixed', top: '0', left: '0', width: '300px', height: '80px', backgroundColor: '#000', zIndex: '9999', pointerEvents: 'none' });
      document.body.appendChild(d);
    }
  } else if (enable === false) {
    document.body.classList.remove("jugadu-dark-mode");
    document.getElementById(topLeftDivId)?.remove();
  } else {
    const isDark = document.body.classList.toggle("jugadu-dark-mode");
    if (isDark) {
      if (!document.getElementById(topLeftDivId)) {
        const d = document.createElement('div');
        d.id = topLeftDivId;
        Object.assign(d.style, { position: 'fixed', top: '0', left: '0', width: '300px', height: '80px', backgroundColor: '#000', zIndex: '9999', pointerEvents: 'none' });
        document.body.appendChild(d);
      }
    } else {
      document.getElementById(topLeftDivId)?.remove();
    }
  }
}

(async () => {
  const result = await chrome.storage.local.get("darkMode");
  if (result.darkMode) DarkModeMainFunction(true);
})();
