// ==UserScript==
// @name         Bambi Obeys
// @namespace    BC-Hypnosis
// @version      1.0.1
// @description  Bambi Obeys stable loader for Bondage Club
// @match        https://*.bondageprojects.elementfx.com/R*/*
// @match        https://*.bondage-europe.com/R*/*
// @match        https://*.bondageeurope.com/R*/*
// @match        https://*.bondageprojects.com/R*/*
// @match        https://*.bondage-asia.com/club/R*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/ophielilac/Bambi-obeys/main/Bambi-Obeys.user.js
// @downloadURL  https://raw.githubusercontent.com/ophielilac/Bambi-obeys/main/Bambi-Obeys.user.js
// ==/UserScript==

(function () {
    'use strict';
    
    if (window.__BAMBI_OBEYS_LOADER_RAN__) return;
    window.__BAMBI_OBEYS_LOADER_RAN__ = true;

    const script = document.createElement('script');
    script.language = 'JavaScript';
    script.setAttribute('crossorigin', 'anonymous');
    script.src = `https://ophielilac.github.io/Bambi-obeys/Bambi-Obeys.js?${Date.now()}`;
    document.head.appendChild(script);
})();
