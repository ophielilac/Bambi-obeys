// ==UserScript==
// @name         Bambi Obeys
// @namespace    BC-Hypnosis
// @version      1.0.1
// @description  Bambi Obeys stable loader for Bondage Club
// @match        https://bondageprojects.elementfx.com/*
// @match        https://*.bondageprojects.elementfx.com/*
// @match        https://bondage-europe.com/*
// @match        https://*.bondage-europe.com/*
// @match        https://bondageprojects.com/*
// @match        https://*.bondageprojects.com/*
// @match        https://bondage-asia.com/*
// @match        https://*.bondage-asia.com/*
// @grant        GM_addElement
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/ophielilac/Bambi-obeys/main/Bambi-Obeys.user.js
// @downloadURL  https://raw.githubusercontent.com/ophielilac/Bambi-obeys/main/Bambi-Obeys.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Prevent duplicate loading.
    if (window.__BAMBI_OBEYS_LOADER_RAN__) return;
    window.__BAMBI_OBEYS_LOADER_RAN__ = true;

    // Always request the newest hosted Bambi Obeys core.
    const coreURL =
        `https://ophielilac.github.io/Bambi-obeys/Bambi-Obeys.js?${Date.now()}`;

    // GM_addElement is used instead of document.createElement().
    // This is important for Bondage Club hosts that use CSP restrictions.
    const script = GM_addElement('script', {
        src: coreURL,
        type: 'text/javascript',
        crossorigin: 'anonymous'
    });

    if (!script) {
        console.error(
            'Bambi Obeys: failed to inject the hosted core.'
        );
    }
})();
