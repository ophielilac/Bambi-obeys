// ==UserScript==
// @name         Bambi Obeys
// @namespace    BC-Hypnosis
// @version      1.5.2
// @description  Bambi Obeys trigger system for Bondage Club
// @match        https://*.bondageprojects.elementfx.com/R*/*
// @match        https://*.bondage-europe.com/R*/*
// @match        https://*.bondageprojects.com/R*/*
// @match        https://*.bondage-asia.com/club/R*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/ophielilac/Bambi-obeys/main/Bambi-Obeys.user.js
// @downloadURL  https://raw.githubusercontent.com/ophielilac/Bambi-obeys/main/Bambi-Obeys.user.js
// ==/UserScript==

(function () {
    'use strict';

    // =========================================================
    // CONFIG
    // =========================================================

    const BASE_URL =
        "https://ophielilac.github.io/Bambi-obeys/bambi%20triggers/";

    const TRIGGERS = [
        {
            name: "Bambi Focus",
            file: "Bambi Focus.m4a",
            description: "Brings Bambi into a focused state."
        },
        {
            name: "Bambi Freeze",
            file: "Bambi Freeze.m4a",
            description: "Temporarily freezes Bambi in place."
        },
        {
            name: "Bambi Reset",
            file: "Bambi Reset.m4a",
            description: "Returns Bambi toward a neutral state."
        },
        {
            name: "Bambi does as she's told",
            file: "Bambi does as she's told.m4a",
            description: "Reinforces obedient behavior."
        },
        {
            name: "Bambi sleep",
            file: "Bambi sleep.m4a",
            description: "Puts Bambi into the programmed sleep state."
        },
        {
            name: "Bambi wake and obey",
            file: "Bambi wake and obey.m4a",
            description: "Wakes Bambi from the programmed sleep state."
        },
        {
            name: "Blonde Moment",
            file: "Blonde Moment.m4a",
            description: "A temporary blonde-moment trigger."
        },
        {
            name: "Drop for cock",
            file: "Drop for cock.m4a",
            description: "Temporary trigger description."
        },
        {
            name: "Good girl",
            file: "Good girl.m4a",
            description: "Positive reinforcement trigger."
        },
        {
            name: "Safe and Secure",
            file: "Safe and Secure.m4a",
            description: "Reinforces a safe and secure state."
        },
        {
            name: "Snap and forget",
            file: "Snap and forget.m4a",
            description: "Temporary memory-reset trigger."
        },
        {
            name: "Zap cock drain obey",
            file: "Zap cock drain obey.m4a",
            description: "Temporary trigger description."
        },
        {
            name: "Bambi Obey",
            file: "Bambi Obeys.m4a",
            description: "General obedience reinforcement."
        },
        {
            name: "Airhead barbie",
            file: "Airhead barbie.m4a",
            description: "Temporary trigger description."
        },
        {
            name: "Braindead bobblehead",
            file: "Braindead bobblehead.m4a",
            description: "Temporary trigger description."
        },
        {
            name: "Cockblank lovedoll",
            file: "Cockblank lovedoll.m4a",
            description: "Temporary trigger description."
        }
    ];

    const SETTINGS_KEY =
        "bambiObeysSettings_v5";

    const CONNECTIONS_KEY =
        "bambiObeysConnections_v4";

    const PENDING_KEY =
        "bambiObeysPending_v4";

    const SLEEP_KEY =
        "bambiObeysSleep_v2";

    const PROTOCOL =
        "BambiObeysMsg";

    const CONNECT_COMMAND =
        ":Bambi Connect";

    const DISCONNECT_COMMAND =
        ":Bambi Disconnect";

    const DEFAULT_SETTINGS = {
        // Authority
        authorityMode: "connected",
        whitelist: "",

        // General
        acceptIncoming: true,
        autoAcceptConnections: false,

        // Safety
        autoWakeMinutes: 30,
        autoWakeEnabled: true,
        enabledTriggers: {},

        // Audio / limits
        maxSimultaneous: 5,
        secondaryVolume: 0.40,
        fadeInMs: 150,
        fadeOutMs: 300,
        alternateEars: true,
        cooldownMs: 0,
        maxTriggersPerMinute: 30,

        // Labels
        showBambiLabels: true,
        labelOpacity: 0.42,
        labelText: "Bambi",

        // Personal Bambi position
        labelXOffset: 300,
        labelYOffset: -30
    };

    // =========================================================
    // BC MODSDK
    // =========================================================

    let bambiMod = null;

    function registerBambiMod() {
        if (
            typeof bcModSdk === "undefined" ||
            !bcModSdk ||
            typeof bcModSdk.registerMod !== "function"
        ) {
            console.error(
                "Bambi Obeys: BC ModSDK unavailable."
            );

            return false;
        }

        try {
            bambiMod = bcModSdk.registerMod({
                name: "BambiObeys",
                fullName: "Bambi Obeys",
                version: "1.5.2",
                repository:
                    "https://github.com/ophielilac/Bambi-obeys"
            });

            return true;
        } catch (error) {
            console.error(
                "Bambi Obeys: failed to register with ModSDK",
                error
            );

            return false;
        }
    }

    // =========================================================
    // STATE
    // =========================================================

    let settings =
        structuredCloneCompat(
            DEFAULT_SETTINGS
        );

    let selectedTrigger = 0;
    let selectedTarget = "";

    let panelOpen = false;
    let activeTab = "Triggers";

    let targetSelect = null;
    let connectSelect = null;
    let statusText = null;
    let panel = null;
    let container = null;

    let tabs = {};
    let tabContents = {};

    let connectedUsers = new Map();
    let pendingRequests = new Map();
    let bambiPresence = new Map();

    let bambiMessageHookInstalled = false;
    let bambiDrawHookInstalled = false;

    let audioContext = null;

    const audioBuffers = new Map();
    const loadingBuffers = new Map();
    const activeLayers = new Set();

    // =========================================================
    // AUDIO SESSION STATE
    // =========================================================

    // Current BOTH-ear/main track.
    // While this exists, additional triggers use the
    // alternating left/right system.
    let mainAudioLayer = null;

    // Remembers the LAST secondary ear used.
    //
    // -1 = left
    //  1 = right
    //
    // This intentionally survives main-track endings.
    // The next secondary trigger always uses the opposite
    // ear from the last secondary trigger.
    let lastSecondaryPan = 1;

    let lastTriggerTime = 0;
    let triggerHistory = [];

    let sleepState = {
        active: false,
        startedAt: 0
    };

    let sleepTimer = null;

    // =========================================================
    // HELPERS
    // =========================================================

    function structuredCloneCompat(value) {
        try {
            return JSON.parse(
                JSON.stringify(value)
            );
        } catch {
            return Object.assign(
                {},
                value
            );
        }
    }

    function normalizeMemberNumber(value) {
        const n = Number(value);

        return Number.isFinite(n)
            ? n
            : 0;
    }

    function now() {
        return Date.now();
    }

    function triggerIndexByName(name) {
        return TRIGGERS.findIndex(
            trigger =>
                trigger.name.toLowerCase() ===
                name.toLowerCase()
        );
    }

    function getTriggerURL(index) {
        if (!TRIGGERS[index]) {
            return null;
        }

        return (
            BASE_URL +
            encodeURIComponent(
                TRIGGERS[index].file
            )
        );
    }

    // =========================================================
    // STORAGE
    // =========================================================

    function mergeSettings(saved) {
        if (
            !saved ||
            typeof saved !== "object"
        ) {
            return;
        }

        for (
            const [key, value]
            of Object.entries(
                DEFAULT_SETTINGS
            )
        ) {
            if (
                Object.prototype.hasOwnProperty.call(
                    saved,
                    key
                )
            ) {
                if (
                    key === "enabledTriggers" &&
                    value &&
                    typeof value === "object" &&
                    !Array.isArray(value)
                ) {
                    settings.enabledTriggers =
                        Object.assign(
                            {},
                            value,
                            saved.enabledTriggers ||
                                {}
                        );
                } else {
                    settings[key] =
                        saved[key];
                }
            }
        }
    }

    function loadStorage() {
        let savedSettings = null;

        try {
            savedSettings =
                JSON.parse(
                    localStorage.getItem(
                        SETTINGS_KEY
                    )
                );

            mergeSettings(
                savedSettings
            );
        } catch (error) {
            console.error(
                "Bambi Obeys: settings load failed",
                error
            );
        }

        for (
            const trigger
            of TRIGGERS
        ) {
            if (
                !Object.prototype.hasOwnProperty.call(
                    settings.enabledTriggers,
                    trigger.name
                )
            ) {
                settings.enabledTriggers[
                    trigger.name
                ] = true;
            }
        }

        if (
            !savedSettings ||
            !Object.prototype.hasOwnProperty.call(
                savedSettings,
                "labelXOffset"
            )
        ) {
            settings.labelXOffset =
                DEFAULT_SETTINGS.labelXOffset;
        }

        if (
            !savedSettings ||
            !Object.prototype.hasOwnProperty.call(
                savedSettings,
                "labelYOffset"
            )
        ) {
            settings.labelYOffset =
                DEFAULT_SETTINGS.labelYOffset;
        }

        try {
            const saved =
                JSON.parse(
                    localStorage.getItem(
                        CONNECTIONS_KEY
                    )
                );

            if (
                Array.isArray(saved)
            ) {
                connectedUsers.clear();

                for (
                    const entry
                    of saved
                ) {
                    const memberNumber =
                        normalizeMemberNumber(
                            entry?.memberNumber
                        );

                    if (!memberNumber) {
                        continue;
                    }

                    connectedUsers.set(
                        memberNumber,
                        {
                            memberNumber,
                            name:
                                entry.name ||
                                "Unknown"
                        }
                    );
                }
            }
        } catch (error) {
            console.error(
                "Bambi Obeys: connections load failed",
                error
            );
        }

        try {
            const saved =
                JSON.parse(
                    localStorage.getItem(
                        PENDING_KEY
                    )
                );

            if (
                Array.isArray(saved)
            ) {
                pendingRequests.clear();

                for (
                    const entry
                    of saved
                ) {
                    const memberNumber =
                        normalizeMemberNumber(
                            entry?.memberNumber
                        );

                    if (!memberNumber) {
                        continue;
                    }

                    pendingRequests.set(
                        memberNumber,
                        {
                            memberNumber,
                            name:
                                entry.name ||
                                "Unknown"
                        }
                    );
                }
            }
        } catch (error) {
            console.error(
                "Bambi Obeys: pending load failed",
                error
            );
        }

        try {
            const saved =
                JSON.parse(
                    localStorage.getItem(
                        SLEEP_KEY
                    )
                );

            if (
                saved?.active &&
                Number(
                    saved.startedAt
                ) > 0
            ) {
                sleepState.active =
                    true;

                sleepState.startedAt =
                    Number(
                        saved.startedAt
                    );
            }
        } catch (error) {
            console.error(
                "Bambi Obeys: sleep state load failed",
                error
            );
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(
                SETTINGS_KEY,
                JSON.stringify(
                    settings
                )
            );

            if (
                typeof Player !==
                "undefined"
            ) {
                announcePresence();
            }
        } catch (error) {
            console.error(
                "Bambi Obeys: settings save failed",
                error
            );
        }
    }

    function saveConnections() {
        try {
            localStorage.setItem(
                CONNECTIONS_KEY,
                JSON.stringify(
                    [...connectedUsers.values()]
                )
            );
        } catch (error) {
            console.error(
                "Bambi Obeys: connections save failed",
                error
            );
        }
    }

    function savePendingRequests() {
        try {
            localStorage.setItem(
                PENDING_KEY,
                JSON.stringify(
                    [...pendingRequests.values()]
                )
            );
        } catch (error) {
            console.error(
                "Bambi Obeys: pending save failed",
                error
            );
        }
    }

    function saveSleepState() {
        try {
            localStorage.setItem(
                SLEEP_KEY,
                JSON.stringify(
                    sleepState
                )
            );
        } catch (error) {
            console.error(
                "Bambi Obeys: sleep state save failed",
                error
            );
        }
    }

    // =========================================================
    // ROOM DATA
    // =========================================================

    function getRoomCharacters() {
        if (
            typeof ChatRoomData !==
                "undefined" &&
            ChatRoomData &&
            Array.isArray(
                ChatRoomData.Character
            )
        ) {
            return ChatRoomData.Character;
        }

        if (
            typeof ChatRoomCharacter !==
                "undefined" &&
            Array.isArray(
                ChatRoomCharacter
            )
        ) {
            return ChatRoomCharacter;
        }

        return [];
    }

    function isInCurrentRoom(
        memberNumber
    ) {
        const target =
            normalizeMemberNumber(
                memberNumber
            );

        return getRoomCharacters().some(
            character =>
                normalizeMemberNumber(
                    character?.MemberNumber
                ) === target
        );
    }

    function getCharacter(
        memberNumber
    ) {
        const target =
            normalizeMemberNumber(
                memberNumber
            );

        return (
            getRoomCharacters().find(
                character =>
                    normalizeMemberNumber(
                        character?.MemberNumber
                    ) === target
            ) || null
        );
    }

    function getCharacterName(
        memberNumber
    ) {
        const character =
            getCharacter(
                memberNumber
            );

        if (!character) {
            return "Unknown";
        }

        return (
            character.Nickname ||
            character.Name ||
            "Unknown"
        );
    }

    function getFriendNumbers() {
        const result =
            new Set();

        const possibleLists = [
            Player?.FriendList,
            Player?.Friends,
            Player?.FriendNumbers
        ];

        for (
            const list
            of possibleLists
        ) {
            if (!Array.isArray(list)) {
                continue;
            }

            for (
                const entry
                of list
            ) {
                const n =
                    normalizeMemberNumber(
                        typeof entry ===
                            "object"
                            ? entry?.MemberNumber ??
                                  entry?.memberNumber
                            : entry
                    );

                if (n) {
                    result.add(n);
                }
            }
        }

        return result;
    }

    function getOwnerNumber() {
        const candidates = [
            Player?.OwnerNumber,
            Player?.OwnerMemberNumber,
            Player?.Owner?.MemberNumber,
            Player?.Owner
        ];

        for (
            const value
            of candidates
        ) {
            const n =
                normalizeMemberNumber(
                    value
                );

            if (n) {
                return n;
            }
        }

        return 0;
    }

    // =========================================================
    // AUTHORITY
    // =========================================================

    function getWhitelist() {
        return new Set(
            String(
                settings.whitelist ||
                    ""
            )
                .split(",")
                .map(
                    x =>
                        Number(
                            x.trim()
                        )
                )
                .filter(
                    Number.isFinite
                )
                .filter(
                    n => n > 0
                )
        );
    }

    function canUseTrigger(
        memberNumber
    ) {
        const n =
            normalizeMemberNumber(
                memberNumber
            );

        if (!n) {
            return false;
        }

        if (
            getWhitelist().has(
                n
            )
        ) {
            return true;
        }

        switch (
            settings.authorityMode
        ) {
            case "owner":
                return (
                    getOwnerNumber() ===
                    n
                );

            case "friends":
                return getFriendNumbers().has(
                    n
                );

            case "connected":
                return connectedUsers.has(
                    n
                );

            case "anyone":
                return true;

            default:
                return false;
        }
    }

    // =========================================================
    // AUDIO ENGINE
    // =========================================================

    function ensureAudioContext() {
        if (!audioContext) {
            const Ctx =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!Ctx) {
                console.error(
                    "Bambi Obeys: Web Audio API unavailable."
                );

                return null;
            }

            audioContext =
                new Ctx();
        }

        if (
            audioContext.state ===
            "suspended"
        ) {
            audioContext
                .resume()
                .catch(
                    () => {}
                );
        }

        return audioContext;
    }

    function installAudioUnlock() {
        const unlock =
            () => {
                if (!audioContext) {
                    return;
                }

                if (
                    audioContext.state ===
                    "suspended"
                ) {
                    audioContext
                        .resume()
                        .catch(
                            () => {}
                        );
                }
            };

        document.addEventListener(
            "pointerdown",
            unlock,
            {
                passive: true,
                capture: true
            }
        );

        document.addEventListener(
            "keydown",
            unlock,
            {
                passive: true,
                capture: true
            }
        );
    }

    async function loadAudioBuffer(
        index
    ) {
        if (
            audioBuffers.has(index)
        ) {
            return audioBuffers.get(
                index
            );
        }

        if (
            loadingBuffers.has(index)
        ) {
            return loadingBuffers.get(
                index
            );
        }

        const context =
            ensureAudioContext();

        if (!context) {
            return null;
        }

        const promise =
            (async () => {
                try {
                    const response =
                        await fetch(
                            getTriggerURL(
                                index
                            ),
                            {
                                cache:
                                    "default"
                            }
                        );

                    if (!response.ok) {
                        throw new Error(
                            `HTTP ${response.status} while loading ${TRIGGERS[index].file}`
                        );
                    }

                    const arrayBuffer =
                        await response.arrayBuffer();

                    const decoded =
                        await context.decodeAudioData(
                            arrayBuffer
                        );

                    audioBuffers.set(
                        index,
                        decoded
                    );

                    return decoded;
                } catch (error) {
                    console.error(
                        "Bambi Obeys: failed to load audio",
                        TRIGGERS[index]?.name,
                        error
                    );

                    return null;
                } finally {
                    loadingBuffers.delete(
                        index
                    );
                }
            })();

        loadingBuffers.set(
            index,
            promise
        );

        return promise;
    }

    async function playLayer(
        index
    ) {
        const context =
            ensureAudioContext();

        if (!context) {
            return;
        }

        if (!TRIGGERS[index]) {
            return;
        }

        const buffer =
            await loadAudioBuffer(
                index
            );

        if (!buffer) {
            return;
        }

        if (
            activeLayers.size >=
            Math.max(
                1,
                Number(
                    settings.maxSimultaneous
                )
            )
        ) {
            console.log(
                "Bambi Obeys: maximum simultaneous layers reached."
            );

            return;
        }

        const source =
            context.createBufferSource();

        const gain =
            context.createGain();

        const panner =
            context.createStereoPanner();

        source.buffer =
            buffer;

        // =====================================================
        // MAIN VS SECONDARY
        // =====================================================

        const isMain =
            mainAudioLayer === null;

        let pan = 0;

        if (isMain) {
            // Main track is BOTH ears.
            pan = 0;
        } else if (
            settings.alternateEars
        ) {
            // ALWAYS use the opposite ear from
            // the previous secondary trigger.
            pan =
                lastSecondaryPan === -1
                    ? 1
                    : -1;

            // Immediately remember the ear we used.
            lastSecondaryPan =
                pan;
        } else {
            pan = 0;
        }

        gain.gain.value =
            0;

        panner.pan.value =
            pan;

        source.connect(
            gain
        );

        gain.connect(
            panner
        );

        panner.connect(
            context.destination
        );

        const layer = {
            source,
            gain,
            panner,
            index,
            isMain
        };

        activeLayers.add(
            layer
        );

        if (isMain) {
            mainAudioLayer =
                layer;
        }

        const fadeIn =
            Math.max(
                0,
                Number(
                    settings.fadeInMs
                )
            ) / 1000;

        const fadeOut =
            Math.max(
                0,
                Number(
                    settings.fadeOutMs
                )
            ) / 1000;

        const initialGain =
            isMain
                ? 1
                : Math.max(
                      0,
                      Math.min(
                          1,
                          Number(
                              settings.secondaryVolume
                          )
                      )
                  );

        const startTime =
            context.currentTime;

        gain.gain.setValueAtTime(
            0,
            startTime
        );

        gain.gain.linearRampToValueAtTime(
            initialGain,
            startTime +
                Math.max(
                    0.01,
                    fadeIn
                )
        );

        source.onended =
            () => {
                activeLayers.delete(
                    layer
                );

                // Only the MAIN track determines
                // when a BOTH-ear session ends.
                if (
                    mainAudioLayer ===
                    layer
                ) {
                    mainAudioLayer =
                        null;

                    // IMPORTANT:
                    // We DO NOT reset lastSecondaryPan.
                    //
                    // The last secondary ear is remembered
                    // across main-track sessions.
                    console.log(
                        "Bambi Obeys: main track ended. Last secondary ear remembered."
                    );
                }

                try {
                    gain.disconnect();
                    panner.disconnect();
                    source.disconnect();
                } catch {}
            };

        source.start();

        const stopAt =
            startTime +
            Math.max(
                0,
                buffer.duration -
                    Math.max(
                        0.01,
                        fadeOut
                    )
            );

        if (
            fadeOut > 0 &&
            buffer.duration >
                fadeOut
        ) {
            gain.gain.setValueAtTime(
                initialGain,
                stopAt
            );

            gain.gain.linearRampToValueAtTime(
                0,
                stopAt +
                    fadeOut
            );
        }

        let location;

        if (pan === 0) {
            location =
                "both ears";
        } else if (pan < 0) {
            location =
                "left ear";
        } else {
            location =
                "right ear";
        }

        console.log(
            "Bambi Obeys: playing",
            TRIGGERS[index].name,
            `(${location})`,
            isMain
                ? "[MAIN]"
                : "[SECONDARY]",
            !isMain
                ? `next remembered ear: ${
                      lastSecondaryPan === -1
                          ? "left"
                          : "right"
                  }`
                : ""
        );
    }

    function triggerAllowedLocally(
        index
    ) {
        const trigger =
            TRIGGERS[index];

        if (!trigger) {
            return false;
        }

        if (
            settings.enabledTriggers &&
            settings.enabledTriggers[
                trigger.name
            ] === false
        ) {
            return false;
        }

        const cooldown =
            Math.max(
                0,
                Number(
                    settings.cooldownMs
                )
            );

        if (
            cooldown > 0 &&
            now() -
                lastTriggerTime <
                cooldown
        ) {
            return false;
        }

        const minute =
            60 * 1000;

        triggerHistory =
            triggerHistory.filter(
                timestamp =>
                    now() -
                        timestamp <
                    minute
            );

        const limit =
            Math.max(
                1,
                Number(
                    settings.maxTriggersPerMinute
                )
            );

        if (
            triggerHistory.length >=
            limit
        ) {
            return false;
        }

        return true;
    }

    async function playTrigger(
        index,
        options = {}
    ) {
        const trigger =
            TRIGGERS[index];

        if (!trigger) {
            return false;
        }

        if (
            !options.ignoreLocalSafety &&
            !triggerAllowedLocally(
                index
            )
        ) {
            console.log(
                "Bambi Obeys: trigger blocked by local limits/safety:",
                trigger.name
            );

            return false;
        }

        lastTriggerTime =
            now();

        triggerHistory.push(
            lastTriggerTime
        );

        if (
            options.trackSleep !==
            false
        ) {
            const sleepIndex =
                triggerIndexByName(
                    "Bambi sleep"
                );

            const wakeIndex =
                triggerIndexByName(
                    "Bambi wake and obey"
                );

            if (
                index ===
                sleepIndex
            ) {
                startAutoWakeTimer();
            } else if (
                index ===
                wakeIndex
            ) {
                cancelAutoWakeTimer();
            }
        }

        await playLayer(
            index
        );

        return true;
    }

    function stopAllLayers() {
        const context =
            ensureAudioContext();

        if (!context) {
            return;
        }

        const t =
            context.currentTime;

        const fade =
            Math.max(
                0.01,
                Number(
                    settings.fadeOutMs
                ) / 1000
            );

        for (
            const layer
            of [...activeLayers]
        ) {
            try {
                layer.gain.gain.cancelScheduledValues(
                    t
                );

                layer.gain.gain.setValueAtTime(
                    Math.max(
                        0,
                        layer.gain.gain.value
                    ),
                    t
                );

                layer.gain.gain.linearRampToValueAtTime(
                    0,
                    t + fade
                );

                layer.source.stop(
                    t +
                        fade +
                        0.02
                );
            } catch {}
        }

        // Completely end the main session.
        mainAudioLayer =
            null;

        // Intentionally DO NOT reset lastSecondaryPan.
        // The last-used ear must be remembered.
    }

    // =========================================================
    // AUTO WAKE
    // =========================================================

    function startAutoWakeTimer() {
        cancelAutoWakeTimer(
            false
        );

        sleepState.active =
            true;

        sleepState.startedAt =
            now();

        saveSleepState();

        scheduleRemainingWake();
    }

    function cancelAutoWakeTimer(
        save = true
    ) {
        if (sleepTimer) {
            clearTimeout(
                sleepTimer
            );

            sleepTimer =
                null;
        }

        sleepState.active =
            false;

        sleepState.startedAt =
            0;

        if (save) {
            saveSleepState();
        }
    }

    function scheduleRemainingWake() {
        if (sleepTimer) {
            clearTimeout(
                sleepTimer
            );

            sleepTimer =
                null;
        }

        if (
            !sleepState.active ||
            !settings.autoWakeEnabled ||
            Number(
                settings.autoWakeMinutes
            ) <= 0
        ) {
            return;
        }

        const maxMs =
            Math.max(
                0,
                Number(
                    settings.autoWakeMinutes
                )
            ) *
            60 *
            1000;

        const elapsed =
            now() -
            sleepState.startedAt;

        const remaining =
            Math.max(
                0,
                maxMs -
                    elapsed
            );

        if (
            remaining <= 0
        ) {
            performAutoWake();
            return;
        }

        sleepTimer =
            setTimeout(
                performAutoWake,
                remaining
            );
    }

    function performAutoWake() {
        if (
            !sleepState.active
        ) {
            return;
        }

        const wakeIndex =
            triggerIndexByName(
                "Bambi wake and obey"
            );

        sleepState.active =
            false;

        sleepState.startedAt =
            0;

        saveSleepState();

        if (sleepTimer) {
            clearTimeout(
                sleepTimer
            );

            sleepTimer =
                null;
        }

        if (
            wakeIndex >= 0
        ) {
            playTrigger(
                wakeIndex,
                {
                    ignoreLocalSafety:
                        false,

                    trackSleep:
                        false
                }
            );
        }
    }

    // =========================================================
    // NETWORK
    // =========================================================

    function sendWhisper(
        memberNumber,
        content
    ) {
        if (
            typeof ServerSend !==
            "function"
        ) {
            return false;
        }

        try {
            ServerSend(
                "ChatRoomChat",
                {
                    Content:
                        content,

                    Type:
                        "Whisper",

                    Target:
                        normalizeMemberNumber(
                            memberNumber
                        )
                }
            );

            return true;
        } catch (error) {
            console.error(
                "Bambi Obeys: whisper failed",
                error
            );

            return false;
        }
    }

    function sendBambiMessage(
        targetMemberNumber,
        payload
    ) {
        if (
            typeof ServerSend !==
            "function"
        ) {
            return false;
        }

        try {
            const packet = {
                Type:
                    "Hidden",

                Content:
                    PROTOCOL,

                Sender:
                    Player.MemberNumber,

                Dictionary: [
                    {
                        message:
                            payload
                    }
                ]
            };

            const target =
                normalizeMemberNumber(
                    targetMemberNumber
                );

            if (target) {
                packet.Target =
                    target;
            }

            ServerSend(
                "ChatRoomChat",
                packet
            );

            return true;
        } catch (error) {
            console.error(
                "Bambi Obeys: failed to send Bambi packet",
                error
            );

            return false;
        }
    }

    function announcePresence() {
        const myNumber =
            normalizeMemberNumber(
                Player?.MemberNumber
            );

        if (!myNumber) {
            return;
        }

        for (
            const character
            of getRoomCharacters()
        ) {
            const memberNumber =
                normalizeMemberNumber(
                    character?.MemberNumber
                );

            if (
                !memberNumber ||
                memberNumber ===
                    myNumber
            ) {
                continue;
            }

            // Presence is intentionally broadcast.
            // It contains no target and every Bambi
            // client can use the player's position.
            sendBambiMessage(
                null,
                {
                    type:
                        "presence",

                    memberNumber:
                        myNumber,

                    name:
                        Player?.Name ||
                        "Bambi",

                    labelXOffset:
                        Number(
                            settings.labelXOffset
                        ),

                    labelYOffset:
                        Number(
                            settings.labelYOffset
                        )
                }
            );
        }
    }

    function requestConnection(
        memberNumber
    ) {
        const target =
            normalizeMemberNumber(
                memberNumber
            );

        const myNumber =
            normalizeMemberNumber(
                Player?.MemberNumber
            );

        if (!target) {
            return;
        }

        if (
            target ===
            myNumber
        ) {
            setStatus(
                "You cannot connect to yourself."
            );

            return;
        }

        sendWhisper(
            target,
            CONNECT_COMMAND
        );

        setStatus(
            `Connect request sent to ${getCharacterName(target)}`
        );
    }

    function acceptConnection(
        memberNumber
    ) {
        const target =
            normalizeMemberNumber(
                memberNumber
            );

        const myNumber =
            normalizeMemberNumber(
                Player?.MemberNumber
            );

        if (
            !target ||
            target ===
                myNumber
        ) {
            return;
        }

        const name =
            pendingRequests.get(
                target
            )?.name ||
            getCharacterName(
                target
            );

        pendingRequests.delete(
            target
        );

        connectedUsers.set(
            target,
            {
                memberNumber:
                    target,

                name
            }
        );

        savePendingRequests();
        saveConnections();

        // Explicit target.
        sendBambiMessage(
            target,
            {
                type:
                    "connection_accepted",

                targetMemberNumber:
                    target
            }
        );

        refreshAllUI();
    }

    function disconnectUser(
        memberNumber
    ) {
        const target =
            normalizeMemberNumber(
                memberNumber
            );

        const myNumber =
            normalizeMemberNumber(
                Player?.MemberNumber
            );

        if (
            !target ||
            target ===
                myNumber
        ) {
            return;
        }

        connectedUsers.delete(
            target
        );

        saveConnections();

        // Explicit target.
        sendBambiMessage(
            target,
            {
                type:
                    "connection_removed",

                targetMemberNumber:
                    target
            }
        );

        refreshAllUI();
    }

    function sendTriggerToUser(
        memberNumber,
        triggerIndex
    ) {
        const target =
            normalizeMemberNumber(
                memberNumber
            );

        const myNumber =
            normalizeMemberNumber(
                Player?.MemberNumber
            );

        if (!target) {
            return;
        }

        if (
            target ===
            myNumber
        ) {
            setStatus(
                "You cannot send a remote trigger to yourself."
            );

            return;
        }

        if (
            !connectedUsers.has(
                target
            )
        ) {
            setStatus(
                "Target is not connected."
            );

            return;
        }

        if (
            !isInCurrentRoom(
                target
            )
        ) {
            setStatus(
                "Target is not currently in this room."
            );

            return;
        }

        if (
            !TRIGGERS[
                triggerIndex
            ]
        ) {
            return;
        }

        // The target is stored INSIDE the payload.
        // This makes targeting work even if the game's
        // Hidden packet itself reaches everyone.
        sendBambiMessage(
            target,
            {
                type:
                    "trigger",

                trigger:
                    triggerIndex,

                targetMemberNumber:
                    target
            }
        );

        setStatus(
            `Sent "${TRIGGERS[triggerIndex].name}" to ${getCharacterName(target)}`
        );
    }

    // =========================================================
    // TARGET VALIDATION
    // =========================================================

    function packetIsForMe(
        payload
    ) {
        if (
            !payload ||
            typeof payload !==
                "object"
        ) {
            return false;
        }

        // Presence packets are intentionally broadcast.
        if (
            payload.type ===
            "presence"
        ) {
            return true;
        }

        const myNumber =
            normalizeMemberNumber(
                Player?.MemberNumber
            );

        const target =
            normalizeMemberNumber(
                payload.targetMemberNumber
            );

        return (
            target !== 0 &&
            target ===
                myNumber
        );
    }

    // =========================================================
    // BAMBI MESSAGE HANDLING
    // =========================================================

    function handleBambiMessage(
        data
    ) {
        if (
            !data ||
            data.Type !== "Hidden" ||
            data.Content !== PROTOCOL ||
            !Array.isArray(data.Dictionary) ||
            !data.Dictionary[0]
        ) {
            return;
        }

        const payload =
            data.Dictionary[0].message;

        if (
            !payload ||
            typeof payload !== "object"
        ) {
            return;
        }

        const sender =
            normalizeMemberNumber(
                data.Sender
            );

        if (!sender) {
            return;
        }

        const myNumber =
            normalizeMemberNumber(
                Player?.MemberNumber
            );

        // Never process our own packet.
        if (
            sender ===
            myNumber
        ) {
            return;
        }

        // =====================================================
        // PRESENCE
        // =====================================================

        if (
            payload.type ===
            "presence"
        ) {
            let labelXOffset =
                Number(
                    payload.labelXOffset
                );

            let labelYOffset =
                Number(
                    payload.labelYOffset
                );

            if (
                !Number.isFinite(
                    labelXOffset
                )
            ) {
                labelXOffset =
                    300;
            }

            if (
                !Number.isFinite(
                    labelYOffset
                )
            ) {
                labelYOffset =
                    -30;
            }

            bambiPresence.set(
                sender,
                {
                    memberNumber:
                        sender,

                    name:
                        payload.name ||
                        getCharacterName(
                            sender
                        ),

                    labelXOffset:
                        labelXOffset,

                    labelYOffset:
                        labelYOffset,

                    lastSeen:
                        now()
                }
            );

            return;
        }

        // =====================================================
        // TARGETED PACKETS
        // =====================================================

        if (
            !packetIsForMe(
                payload
            )
        ) {
            return;
        }

        // =====================================================
        // CONNECTION ACCEPTED
        // =====================================================

        if (
            payload.type ===
            "connection_accepted"
        ) {
            connectedUsers.set(
                sender,
                {
                    memberNumber:
                        sender,

                    name:
                        getCharacterName(
                            sender
                        )
                }
            );

            saveConnections();

            refreshAllUI();

            return;
        }

        // =====================================================
        // CONNECTION REMOVED
        // =====================================================

        if (
            payload.type ===
            "connection_removed"
        ) {
            connectedUsers.delete(
                sender
            );

            saveConnections();

            refreshAllUI();

            return;
        }

        // =====================================================
        // TRIGGER
        // =====================================================

        if (
            payload.type ===
            "trigger"
        ) {
            if (
                !settings.acceptIncoming
            ) {
                return;
            }

            if (
                !connectedUsers.has(
                    sender
                ) &&
                !canUseTrigger(
                    sender
                )
            ) {
                return;
            }

            const index =
                Number(
                    payload.trigger
                );

            if (
                !Number.isInteger(
                    index
                )
            ) {
                return;
            }

            if (
                !TRIGGERS[index]
            ) {
                return;
            }

            const trigger =
                TRIGGERS[index];

            if (
                settings.enabledTriggers &&
                settings.enabledTriggers[
                    trigger.name
                ] === false
            ) {
                return;
            }

            if (
                !canUseTrigger(
                    sender
                )
            ) {
                return;
            }

            playTrigger(
                index
            );

            return;
        }
    }

    function handleBambiChatMessage(
        data
    ) {
        if (
            !data ||
            (
                data.Type !== "Whisper" &&
                data.Type !== "Chat"
            )
        ) {
            return;
        }

        if (
            typeof data.Content !==
            "string"
        ) {
            return;
        }

        const sender =
            normalizeMemberNumber(
                data.Sender
            );

        if (!sender) {
            return;
        }

        const myNumber =
            normalizeMemberNumber(
                Player?.MemberNumber
            );

        // Ignore our own chat / whisper.
        if (
            sender ===
            myNumber
        ) {
            return;
        }

        const message =
            data.Content.trim();

        // =====================================================
        // CONNECT
        // =====================================================

        if (
            data.Type === "Whisper" &&
            message.toLowerCase() ===
                CONNECT_COMMAND.toLowerCase()
        ) {
            const name =
                getCharacterName(
                    sender
                );

            if (
                settings.autoAcceptConnections
            ) {
                acceptConnection(
                    sender
                );
            } else {
                pendingRequests.set(
                    sender,
                    {
                        memberNumber:
                            sender,

                        name
                    }
                );

                savePendingRequests();

                refreshAllUI();
            }

            return;
        }

        // =====================================================
        // DISCONNECT
        // =====================================================

        if (
            data.Type === "Whisper" &&
            message.toLowerCase() ===
                DISCONNECT_COMMAND.toLowerCase()
        ) {
            disconnectUser(
                sender
            );
        }
    }

    function installBambiMessageHook() {
        if (
            bambiMessageHookInstalled
        ) {
            return true;
        }

        if (
            !bambiMod ||
            typeof bambiMod.hookFunction !==
                "function"
        ) {
            return false;
        }

        try {
            bambiMod.hookFunction(
                "ChatRoomMessage",
                1,
                (args, next) => {
                    const data =
                        args[0];

                    try {
                        handleBambiMessage(
                            data
                        );

                        handleBambiChatMessage(
                            data
                        );
                    } catch (error) {
                        console.error(
                            "Bambi Obeys: message error",
                            error
                        );
                    }

                    return next(
                        args
                    );
                }
            );

            bambiMessageHookInstalled =
                true;

            return true;
        } catch (error) {
            console.error(
                "Bambi Obeys: message hook failed",
                error
            );

            return false;
        }
    }

    // =========================================================
    // BAMBI LABELS
    // =========================================================

    function getMainCanvasContext() {
        try {
            if (
                typeof MainCanvasCtx !==
                    "undefined" &&
                MainCanvasCtx &&
                typeof MainCanvasCtx.fillText ===
                    "function"
            ) {
                return MainCanvasCtx;
            }
        } catch {}

        try {
            if (
                typeof MainCanvas !==
                    "undefined" &&
                MainCanvas
            ) {
                if (
                    typeof MainCanvas.fillText ===
                    "function"
                ) {
                    return MainCanvas;
                }

                if (
                    typeof MainCanvas.getContext ===
                        "function"
                ) {
                    const ctx =
                        MainCanvas.getContext(
                            "2d"
                        );

                    if (
                        ctx &&
                        typeof ctx.fillText ===
                            "function"
                    ) {
                        return ctx;
                    }
                }
            }
        } catch {}

        return null;
    }

    function drawBambiLabel(
        context,
        memberNumber,
        CharX,
        CharY,
        Zoom
    ) {
        if (
            !settings.showBambiLabels
        ) {
            return;
        }

        const normalized =
            normalizeMemberNumber(
                memberNumber
            );

        if (!normalized) {
            return;
        }

        const myNumber =
            normalizeMemberNumber(
                Player?.MemberNumber
            );

        const isMe =
            normalized ===
            myNumber;

        let labelXOffset;
        let labelYOffset;

        if (isMe) {
            labelXOffset =
                Number(
                    settings.labelXOffset
                );

            labelYOffset =
                Number(
                    settings.labelYOffset
                );
        } else {
            const presence =
                bambiPresence.get(
                    normalized
                );

            if (!presence) {
                return;
            }

            if (
                now() -
                    Number(
                        presence.lastSeen
                    ) >
                15000
            ) {
                return;
            }

            if (
                !isInCurrentRoom(
                    normalized
                )
            ) {
                return;
            }

            labelXOffset =
                Number(
                    presence.labelXOffset
                );

            labelYOffset =
                Number(
                    presence.labelYOffset
                );
        }

        if (
            !Number.isFinite(
                labelXOffset
            )
        ) {
            labelXOffset =
                300;
        }

        if (
            !Number.isFinite(
                labelYOffset
            )
        ) {
            labelYOffset =
                -30;
        }

        const x =
            Number(
                CharX
            );

        const y =
            Number(
                CharY
            );

        const zoomValue =
            Number(
                Zoom
            );

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(
                zoomValue
            )
        ) {
            return;
        }

        const oldAlpha =
            context.globalAlpha;

        const oldFillStyle =
            context.fillStyle;

        const oldFont =
            context.font;

        const oldTextAlign =
            context.textAlign;

        const oldTextBaseline =
            context.textBaseline;

        const text =
            String(
                settings.labelText ||
                    "Bambi"
            );

        const alpha =
            Math.max(
                0,
                Math.min(
                    1,
                    Number(
                        settings.labelOpacity
                    )
                )
            );

        try {
            context.save();

            context.globalAlpha =
                alpha;

            context.fillStyle =
                "#ff8fc7";

            context.font =
                "bold 18px Arial";

            context.textAlign =
                "center";

            context.textBaseline =
                "middle";

            const labelX =
                x +
                labelXOffset;

            const labelY =
                y +
                950 *
                    zoomValue +
                labelYOffset;

            if (
                typeof context.shadowColor !==
                    "undefined"
            ) {
                context.shadowColor =
                    "rgba(255,105,180,0.9)";

                context.shadowBlur =
                    4;
            }

            context.fillText(
                text,
                labelX,
                labelY
            );
        } catch (error) {
            console.error(
                "Bambi Obeys: label draw failed",
                error
            );
        } finally {
            try {
                context.restore();
            } catch {}

            try {
                context.globalAlpha =
                    oldAlpha;

                context.fillStyle =
                    oldFillStyle;

                context.font =
                    oldFont;

                context.textAlign =
                    oldTextAlign;

                context.textBaseline =
                    oldTextBaseline;
            } catch {}
        }
    }

    function installBambiLabelHook() {
        if (
            bambiDrawHookInstalled
        ) {
            return true;
        }

        if (
            !bambiMod ||
            typeof bambiMod.hookFunction !==
                "function"
        ) {
            return false;
        }

        try {
            bambiMod.hookFunction(
                "ChatRoomDrawCharacterStatusIcons",
                1,
                (args, next) => {
                    const result =
                        next(args);

                    try {
                        const [
                            C,
                            CharX,
                            CharY,
                            Zoom
                        ] = args;

                        if (
                            !settings.showBambiLabels ||
                            !C ||
                            !C.MemberNumber
                        ) {
                            return result;
                        }

                        const memberNumber =
                            normalizeMemberNumber(
                                C.MemberNumber
                            );

                        if (!memberNumber) {
                            return result;
                        }

                        const context =
                            getMainCanvasContext();

                        if (!context) {
                            return result;
                        }

                        drawBambiLabel(
                            context,
                            memberNumber,
                            CharX,
                            CharY,
                            Zoom
                        );
                    } catch (error) {
                        console.error(
                            "Bambi Obeys: label hook error",
                            error
                        );
                    }

                    return result;
                }
            );

            bambiDrawHookInstalled =
                true;

            return true;
        } catch (error) {
            console.error(
                "Bambi Obeys: failed to hook ChatRoomDrawCharacterStatusIcons",
                error
            );

            return false;
        }
    }

    // =========================================================
    // UI HELPERS
    // =========================================================

    function setStatus(
        text
    ) {
        if (
            statusText
        ) {
            statusText.textContent =
                text;
        }
    }

    function makeButton(
        text,
        onClick,
        accent = false
    ) {
        const button =
            document.createElement(
                "button"
            );

        button.textContent =
            text;

        Object.assign(
            button.style,
            {
                width:
                    "100%",

                padding:
                    "7px",

                marginBottom:
                    "7px",

                cursor:
                    "pointer",

                background:
                    accent
                        ? "#ff4fa3"
                        : "#6b3158",

                color:
                    "#fff",

                border:
                    "1px solid #ff8fc7",

                borderRadius:
                    "5px"
            }
        );

        button.onclick =
            onClick;

        return button;
    }

    function makeCheckbox(
        labelText,
        checked,
        onChange
    ) {
        const row =
            document.createElement(
                "label"
            );

        Object.assign(
            row.style,
            {
                display:
                    "flex",

                alignItems:
                    "center",

                gap:
                    "7px",

                marginBottom:
                    "8px",

                cursor:
                    "pointer"
            }
        );

        const checkbox =
            document.createElement(
                "input"
            );

        checkbox.type =
            "checkbox";

        checkbox.checked =
            checked;

        checkbox.onchange =
            () =>
                onChange(
                    checkbox.checked
                );

        const text =
            document.createElement(
                "span"
            );

        text.textContent =
            labelText;

        row.appendChild(
            checkbox
        );

        row.appendChild(
            text
        );

        return row;
    }

    function makeNumberSlider(
        labelText,
        min,
        max,
        step,
        value,
        format,
        onChange
    ) {
        const wrap =
            document.createElement(
                "div"
            );

        wrap.style.marginBottom =
            "10px";

        const label =
            document.createElement(
                "div"
            );

        Object.assign(
            label.style,
            {
                fontSize:
                    "12px",

                color:
                    "#ffb8d9",

                marginBottom:
                    "4px"
            }
        );

        const valueText =
            document.createElement(
                "span"
            );

        valueText.textContent =
            format(value);

        label.textContent =
            labelText +
            ": ";

        label.appendChild(
            valueText
        );

        const range =
            document.createElement(
                "input"
            );

        range.type =
            "range";

        range.min =
            String(min);

        range.max =
            String(max);

        range.step =
            String(step);

        range.value =
            String(value);

        range.style.width =
            "100%";

        range.oninput =
            () => {
                const numeric =
                    Number(
                        range.value
                    );

                valueText.textContent =
                    format(
                        numeric
                    );

                onChange(
                    numeric
                );
            };

        wrap.appendChild(
            label
        );

        wrap.appendChild(
            range
        );

        return wrap;
    }

    function buildTabButton(
        name
    ) {
        const button =
            document.createElement(
                "button"
            );

        button.textContent =
            name;

        Object.assign(
            button.style,
            {
                flex:
                    "1",

                padding:
                    "7px 4px",

                cursor:
                    "pointer",

                background:
                    "#5b2447",

                color:
                    "#fff",

                border:
                    "1px solid #ff69b4",

                borderRadius:
                    "4px",

                fontSize:
                    "11px"
            }
        );

        button.onclick =
            () =>
                switchTab(
                    name
                );

        tabs[name] =
            button;

        return button;
    }

    function createContentArea() {
        const content =
            document.createElement(
                "div"
            );

        Object.assign(
            content.style,
            {
                maxHeight:
                    "480px",

                overflowY:
                    "auto",

                paddingRight:
                    "3px"
            }
        );

        return content;
    }

    function switchTab(
        name
    ) {
        activeTab =
            name;

        for (
            const [
                tabName,
                button
            ]
            of Object.entries(
                tabs
            )
        ) {
            button.style.background =
                tabName ===
                    activeTab
                    ? "#ff4fa3"
                    : "#5b2447";
        }

        for (
            const [
                tabName,
                content
            ]
            of Object.entries(
                tabContents
            )
        ) {
            content.style.display =
                tabName ===
                    activeTab
                    ? "block"
                    : "none";
        }
    }

    function styleSelect(
        select
    ) {
        Object.assign(
            select.style,
            {
                width:
                    "100%",

                padding:
                    "7px",

                marginBottom:
                    "7px",

                boxSizing:
                    "border-box",

                background:
                    "#fff0f7",

                color:
                    "#48172f",

                border:
                    "1px solid #ff69b4",

                borderRadius:
                    "5px"
            }
        );
    }

    // =========================================================
    // AUTHORITY TAB
    // =========================================================

    function buildAuthorityTab(
        content
    ) {
        const heading =
            document.createElement(
                "div"
            );

        heading.textContent =
            "Who can trigger Bambi";

        heading.style.marginBottom =
            "6px";

        heading.style.fontWeight =
            "bold";

        content.appendChild(
            heading
        );

        const modes = [
            [
                "owner",
                "Owner only"
            ],
            [
                "friends",
                "Friends only"
            ],
            [
                "connected",
                "Anyone connected"
            ],
            [
                "anyone",
                "Anyone"
            ]
        ];

        for (
            const [
                value,
                label
            ]
            of modes
        ) {
            const row =
                document.createElement(
                    "label"
                );

            row.style.display =
                "flex";

            row.style.gap =
                "7px";

            row.style.marginBottom =
                "6px";

            const input =
                document.createElement(
                    "input"
                );

            input.type =
                "radio";

            input.name =
                "bambi-authority";

            input.value =
                value;

            input.checked =
                settings.authorityMode ===
                value;

            input.onchange =
                () => {
                    if (
                        !input.checked
                    ) {
                        return;
                    }

                    settings.authorityMode =
                        value;

                    saveSettings();
                };

            const text =
                document.createElement(
                    "span"
                );

            text.textContent =
                label;

            row.appendChild(
                input
            );

            row.appendChild(
                text
            );

            content.appendChild(
                row
            );
        }

        const whitelistLabel =
            document.createElement(
                "div"
            );

        whitelistLabel.textContent =
            "Whitelist Member IDs";

        Object.assign(
            whitelistLabel.style,
            {
                color:
                    "#ffb8d9",

                fontSize:
                    "12px",

                marginTop:
                    "12px",

                marginBottom:
                    "4px"
            }
        );

        content.appendChild(
            whitelistLabel
        );

        const whitelist =
            document.createElement(
                "textarea"
            );

        whitelist.value =
            settings.whitelist;

        whitelist.placeholder =
            "12345, 67890, 13579";

        Object.assign(
            whitelist.style,
            {
                width:
                    "100%",

                minHeight:
                    "55px",

                boxSizing:
                    "border-box",

                background:
                    "#fff0f7",

                color:
                    "#48172f",

                border:
                    "1px solid #ff69b4",

                borderRadius:
                    "5px",

                padding:
                    "6px",

                resize:
                    "vertical"
            }
        );

        whitelist.onchange =
            () => {
                settings.whitelist =
                    whitelist.value;

                saveSettings();
            };

        content.appendChild(
            whitelist
        );

        content.appendChild(
            document.createElement(
                "hr"
            )
        );

        content.appendChild(
            makeCheckbox(
                "Automatically accept connection requests",
                settings.autoAcceptConnections,
                checked => {
                    settings.autoAcceptConnections =
                        checked;

                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeButton(
                "Disconnect selected user",
                () => {
                    if (
                        selectedTarget
                    ) {
                        disconnectUser(
                            selectedTarget
                        );
                    }
                }
            )
        );

        const note =
            document.createElement(
                "div"
            );

        note.textContent =
            "Whitelist entries override the selected authority mode.";

        Object.assign(
            note.style,
            {
                fontSize:
                    "11px",

                color:
                    "#d994ba",

                marginTop:
                    "8px",

                lineHeight:
                    "1.4"
            }
        );

        content.appendChild(
            note
        );
    }

    // =========================================================
    // TRIGGERS TAB
    // =========================================================

    function buildTriggersTab(
        content
    ) {
        const connectLabel =
            document.createElement(
                "div"
            );

        connectLabel.textContent =
            "Connect to";

        connectLabel.style.color =
            "#ffb8d9";

        connectLabel.style.fontSize =
            "12px";

        connectLabel.style.marginBottom =
            "4px";

        content.appendChild(
            connectLabel
        );

        connectSelect =
            document.createElement(
                "select"
            );

        styleSelect(
            connectSelect
        );

        content.appendChild(
            connectSelect
        );

        content.appendChild(
            makeButton(
                "💗 Send :Bambi Connect",
                () => {
                    if (
                        connectSelect.value
                    ) {
                        requestConnection(
                            connectSelect.value
                        );
                    }
                },
                true
            )
        );

        const pending =
            document.createElement(
                "div"
            );

        pending.id =
            "bambi-pending-area";

        content.appendChild(
            pending
        );

        const sendLabel =
            document.createElement(
                "div"
            );

        sendLabel.textContent =
            "Send to";

        sendLabel.style.color =
            "#ffb8d9";

        sendLabel.style.fontSize =
            "12px";

        sendLabel.style.marginBottom =
            "4px";

        content.appendChild(
            sendLabel
        );

        targetSelect =
            document.createElement(
                "select"
            );

        styleSelect(
            targetSelect
        );

        targetSelect.onchange =
            () => {
                selectedTarget =
                    targetSelect.value;
            };

        content.appendChild(
            targetSelect
        );

        statusText =
            document.createElement(
                "div"
            );

        Object.assign(
            statusText.style,
            {
                fontSize:
                    "11px",

                color:
                    "#ff9bce",

                marginBottom:
                    "8px"
            }
        );

        content.appendChild(
            statusText
        );

        const triggerLabel =
            document.createElement(
                "div"
            );

        triggerLabel.textContent =
            "Trigger";

        triggerLabel.style.color =
            "#ffb8d9";

        triggerLabel.style.fontSize =
            "12px";

        triggerLabel.style.marginBottom =
            "4px";

        content.appendChild(
            triggerLabel
        );

        const triggerSelect =
            document.createElement(
                "select"
            );

        styleSelect(
            triggerSelect
        );

        TRIGGERS.forEach(
            (
                trigger,
                index
            ) => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    index;

                option.textContent =
                    trigger.name;

                triggerSelect.appendChild(
                    option
                );
            }
        );

        triggerSelect.value =
            selectedTrigger;

        const description =
            document.createElement(
                "div"
            );

        Object.assign(
            description.style,
            {
                fontSize:
                    "11px",

                color:
                    "#d994ba",

                lineHeight:
                    "1.4",

                minHeight:
                    "30px",

                marginBottom:
                    "8px"
            }
        );

        function updateDescription() {
            description.textContent =
                TRIGGERS[
                    selectedTrigger
                ]?.description ||
                "";
        }

        triggerSelect.onchange =
            () => {
                selectedTrigger =
                    Number(
                        triggerSelect.value
                    );

                updateDescription();
            };

        content.appendChild(
            triggerSelect
        );

        updateDescription();

        content.appendChild(
            description
        );

        content.appendChild(
            makeButton(
                "▶ Send Trigger",
                () => {
                    if (
                        selectedTarget
                    ) {
                        sendTriggerToUser(
                            selectedTarget,
                            selectedTrigger
                        );
                    }
                },
                true
            )
        );

        content.appendChild(
            makeButton(
                "▶ Test Trigger Locally",
                () => {
                    playTrigger(
                        selectedTrigger
                    );
                }
            )
        );

        content.appendChild(
            makeCheckbox(
                "Accept incoming triggers",
                settings.acceptIncoming,
                checked => {
                    settings.acceptIncoming =
                        checked;

                    saveSettings();
                }
            )
        );
    }

    // =========================================================
    // SAFETY TAB
    // =========================================================

    function buildSafetyTab(
        content
    ) {
        content.appendChild(
            makeCheckbox(
                "Auto wake enabled",
                settings.autoWakeEnabled,
                checked => {
                    settings.autoWakeEnabled =
                        checked;

                    saveSettings();

                    scheduleRemainingWake();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                "Auto wake after sleep",
                0,
                60,
                1,
                settings.autoWakeMinutes,
                value =>
                    value ===
                        0
                        ? "Disabled"
                        : `${value} min`,
                value => {
                    settings.autoWakeMinutes =
                        value;

                    saveSettings();

                    scheduleRemainingWake();
                }
            )
        );

        const explanation =
            document.createElement(
                "div"
            );

        explanation.textContent =
            "0 minutes disables auto wake. The timer survives refreshes.";

        Object.assign(
            explanation.style,
            {
                fontSize:
                    "11px",

                color:
                    "#d994ba",

                lineHeight:
                    "1.4",

                marginBottom:
                    "12px"
            }
        );

        content.appendChild(
            explanation
        );

        const heading =
            document.createElement(
                "div"
            );

        heading.textContent =
            "Trigger safety";

        heading.style.fontWeight =
            "bold";

        heading.style.marginBottom =
            "7px";

        content.appendChild(
            heading
        );

        TRIGGERS.forEach(
            trigger => {
                content.appendChild(
                    makeCheckbox(
                        trigger.name,
                        settings
                            .enabledTriggers[
                            trigger.name
                        ] !== false,
                        checked => {
                            settings
                                .enabledTriggers[
                                trigger.name
                            ] =
                                checked;

                            saveSettings();
                        }
                    )
                );
            }
        );

        content.appendChild(
            makeButton(
                "Stop all currently playing audio",
                stopAllLayers
            )
        );
    }

    // =========================================================
    // LIMITS TAB
    // =========================================================

    function buildLimitsTab(
        content
    ) {
        content.appendChild(
            makeNumberSlider(
                "Maximum simultaneous layers",
                1,
                10,
                1,
                settings.maxSimultaneous,
                value =>
                    `${value}`,
                value => {
                    settings.maxSimultaneous =
                        value;

                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                "Secondary trigger volume",
                10,
                100,
                5,
                Math.round(
                    Number(
                        settings.secondaryVolume
                    ) *
                        100
                ),
                value =>
                    `${value}%`,
                value => {
                    settings.secondaryVolume =
                        value / 100;

                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                "Fade in",
                0,
                1000,
                10,
                settings.fadeInMs,
                value =>
                    `${value} ms`,
                value => {
                    settings.fadeInMs =
                        value;

                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                "Fade out",
                0,
                2000,
                10,
                settings.fadeOutMs,
                value =>
                    `${value} ms`,
                value => {
                    settings.fadeOutMs =
                        value;

                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeCheckbox(
                "Alternate secondary triggers between ears",
                settings.alternateEars,
                checked => {
                    settings.alternateEars =
                        checked;

                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                "Trigger cooldown",
                0,
                5000,
                50,
                settings.cooldownMs,
                value =>
                    value ===
                        0
                        ? "Off"
                        : `${value} ms`,
                value => {
                    settings.cooldownMs =
                        value;

                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                "Maximum triggers per minute",
                1,
                60,
                1,
                settings.maxTriggersPerMinute,
                value =>
                    `${value}`,
                value => {
                    settings.maxTriggersPerMinute =
                        value;

                    saveSettings();
                }
            )
        );

        const labelHeading =
            document.createElement(
                "div"
            );

        labelHeading.textContent =
            "Bambi labels";

        labelHeading.style.fontWeight =
            "bold";

        labelHeading.style.marginTop =
            "8px";

        labelHeading.style.marginBottom =
            "7px";

        content.appendChild(
            labelHeading
        );

        content.appendChild(
            makeCheckbox(
                "Show Bambi labels",
                settings.showBambiLabels,
                checked => {
                    settings.showBambiLabels =
                        checked;

                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                "Label opacity",
                5,
                100,
                5,
                Math.round(
                    Number(
                        settings.labelOpacity
                    ) *
                        100
                ),
                value =>
                    `${value}%`,
                value => {
                    settings.labelOpacity =
                        value / 100;

                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                "Label horizontal offset",
                150,
                450,
                1,
                settings.labelXOffset,
                value =>
                    `${value}px`,
                value => {
                    settings.labelXOffset =
                        value;

                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                "Label vertical offset",
                -180,
                120,
                1,
                settings.labelYOffset,
                value =>
                    `${value}px`,
                value => {
                    settings.labelYOffset =
                        value;

                    saveSettings();
                }
            )
        );

        const labelText =
            document.createElement(
                "input"
            );

        labelText.type =
            "text";

        labelText.value =
            settings.labelText;

        labelText.placeholder =
            "Bambi";

        Object.assign(
            labelText.style,
            {
                width:
                    "100%",

                boxSizing:
                    "border-box",

                padding:
                    "6px",

                marginBottom:
                    "7px",

                background:
                    "#fff0f7",

                color:
                    "#48172f",

                border:
                    "1px solid #ff69b4",

                borderRadius:
                    "5px"
            }
        );

        labelText.onchange =
            () => {
                settings.labelText =
                    labelText.value ||
                    "Bambi";

                saveSettings();
            };

        content.appendChild(
            labelText
        );
    }

    // =========================================================
    // PENDING REQUESTS
    // =========================================================

    function refreshPendingArea() {
        const area =
            document.getElementById(
                "bambi-pending-area"
            );

        if (!area) {
            return;
        }

        area.innerHTML =
            "";

        const requests =
            [...pendingRequests.values()]
                .filter(
                    request =>
                        isInCurrentRoom(
                            request.memberNumber
                        )
                );

        if (
            !requests.length
        ) {
            return;
        }

        const heading =
            document.createElement(
                "div"
            );

        heading.textContent =
            "Connection requests";

        Object.assign(
            heading.style,
            {
                fontSize:
                    "12px",

                color:
                    "#ffb8d9",

                marginBottom:
                    "5px"
            }
        );

        area.appendChild(
            heading
        );

        for (
            const request
            of requests
        ) {
            const row =
                document.createElement(
                    "div"
                );

            Object.assign(
                row.style,
                {
                    display:
                        "flex",

                    gap:
                        "5px",

                    marginBottom:
                        "5px"
                }
            );

            const name =
                document.createElement(
                    "span"
                );

            name.textContent =
                request.name;

            name.style.flex =
                "1";

            const accept =
                document.createElement(
                    "button"
                );

            accept.textContent =
                "Accept";

            accept.onclick =
                () => {
                    acceptConnection(
                        request.memberNumber
                    );
                };

            row.appendChild(
                name
            );

            row.appendChild(
                accept
            );

            area.appendChild(
                row
            );
        }
    }

    function refreshConnectDropdown() {
        if (!connectSelect) {
            return;
        }

        connectSelect.innerHTML =
            "";

        const others =
            getRoomCharacters()
                .filter(
                    character =>
                        normalizeMemberNumber(
                            character?.MemberNumber
                        ) !==
                        normalizeMemberNumber(
                            Player?.MemberNumber
                        )
                )
                .sort(
                    (a, b) =>
                        getCharacterName(
                            a.MemberNumber
                        ).localeCompare(
                            getCharacterName(
                                b.MemberNumber
                            )
                        )
                );

        if (
            !others.length
        ) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                "";

            option.textContent =
                "No one else in room";

            connectSelect.appendChild(
                option
            );

            return;
        }

        for (
            const character
            of others
        ) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                character.MemberNumber;

            option.textContent =
                getCharacterName(
                    character.MemberNumber
                );

            connectSelect.appendChild(
                option
            );
        }
    }

    function refreshTargetDropdown() {
        if (!targetSelect) {
            return;
        }

        targetSelect.innerHTML =
            "";

        const available =
            [
                ...connectedUsers.values()
            ]
                .filter(
                    user =>
                        isInCurrentRoom(
                            user.memberNumber
                        )
                )
                .filter(
                    user =>
                        normalizeMemberNumber(
                            user.memberNumber
                        ) !==
                        normalizeMemberNumber(
                            Player?.MemberNumber
                        )
                )
                .sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name
                        )
                );

        if (
            !available.length
        ) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                "";

            option.textContent =
                "No connected users";

            targetSelect.appendChild(
                option
            );

            selectedTarget =
                "";

            return;
        }

        for (
            const user
            of available
        ) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                user.memberNumber;

            option.textContent =
                user.name;

            targetSelect.appendChild(
                option
            );
        }

        if (
            available.some(
                user =>
                    String(
                        user.memberNumber
                    ) ===
                    String(
                        selectedTarget
                    )
            )
        ) {
            targetSelect.value =
                selectedTarget;
        } else {
            selectedTarget =
                String(
                    available[0]
                        .memberNumber
                );

            targetSelect.value =
                selectedTarget;
        }
    }

    function refreshStatus() {
        if (
            !statusText
        ) {
            return;
        }

        const count =
            [
                ...connectedUsers.values()
            ]
                .filter(
                    user =>
                        isInCurrentRoom(
                            user.memberNumber
                        )
                )
                .filter(
                    user =>
                        normalizeMemberNumber(
                            user.memberNumber
                        ) !==
                        normalizeMemberNumber(
                            Player?.MemberNumber
                        )
                )
                .length;

        statusText.textContent =
            `${count} connected in room`;
    }

    function refreshAllUI() {
        refreshConnectDropdown();
        refreshTargetDropdown();
        refreshPendingArea();
        refreshStatus();
    }

    // =========================================================
    // DRAGGING
    // =========================================================

    function makeDraggable(
        element,
        handle
    ) {
        let dragging =
            false;

        let moved =
            false;

        let offsetX =
            0;

        let offsetY =
            0;

        let startX =
            0;

        let startY =
            0;

        handle.addEventListener(
            "mousedown",
            event => {
                if (
                    event.button !==
                    0
                ) {
                    return;
                }

                const rect =
                    element.getBoundingClientRect();

                offsetX =
                    event.clientX -
                    rect.left;

                offsetY =
                    event.clientY -
                    rect.top;

                startX =
                    event.clientX;

                startY =
                    event.clientY;

                moved =
                    false;

                dragging =
                    true;

                handle.style.cursor =
                    "grabbing";

                document.body.style.userSelect =
                    "none";

                event.preventDefault();
            }
        );

        document.addEventListener(
            "mousemove",
            event => {
                if (!dragging) {
                    return;
                }

                if (
                    Math.abs(
                        event.clientX -
                        startX
                    ) > 5 ||
                    Math.abs(
                        event.clientY -
                        startY
                    ) > 5
                ) {
                    moved =
                        true;
                }

                let left =
                    event.clientX -
                    offsetX;

                let top =
                    event.clientY -
                    offsetY;

                const maxLeft =
                    window.innerWidth -
                    element.offsetWidth;

                const maxTop =
                    window.innerHeight -
                    element.offsetHeight;

                left =
                    Math.max(
                        0,
                        Math.min(
                            left,
                            maxLeft
                        )
                    );

                top =
                    Math.max(
                        0,
                        Math.min(
                            top,
                            maxTop
                        )
                    );

                element.style.left =
                    `${left}px`;

                element.style.top =
                    `${top}px`;

                element.style.right =
                    "auto";

                element.style.bottom =
                    "auto";
            }
        );

        document.addEventListener(
            "mouseup",
            () => {
                if (!dragging) {
                    return;
                }

                dragging =
                    false;

                handle.style.cursor =
                    "grab";

                document.body.style.userSelect =
                    "";

                handle.__bambiMoved =
                    moved;
            }
        );
    }

    // =========================================================
    // UI
    // =========================================================

    function createUI() {
        container =
            document.createElement(
                "div"
            );

        Object.assign(
            container.style,
            {
                position:
                    "fixed",

                left:
                    "20px",

                top:
                    "100px",

                zIndex:
                    "999999",

                fontFamily:
                    "Arial, sans-serif"
            }
        );

        const floatingButton =
            document.createElement(
                "button"
            );

        floatingButton.textContent =
            "B";

        Object.assign(
            floatingButton.style,
            {
                width:
                    "44px",

                height:
                    "44px",

                borderRadius:
                    "50%",

                border:
                    "2px solid #ff8fc7",

                background:
                    "#ff4fa3",

                color:
                    "#fff",

                fontSize:
                    "18px",

                fontWeight:
                    "bold",

                cursor:
                    "grab",

                boxShadow:
                    "0 4px 12px rgba(255, 50, 150, 0.4)"
            }
        );

        floatingButton.title =
            "Bambi Obeys";

        panel =
            document.createElement(
                "div"
            );

        Object.assign(
            panel.style,
            {
                display:
                    "none",

                width:
                    "305px",

                marginTop:
                    "8px",

                background:
                    "#3a1730",

                color:
                    "#fff",

                padding:
                    "12px",

                borderRadius:
                    "10px",

                boxShadow:
                    "0 4px 18px rgba(0,0,0,0.45)",

                border:
                    "1px solid #ff69b4"
            }
        );

        const header =
            document.createElement(
                "div"
            );

        Object.assign(
            header.style,
            {
                display:
                    "flex",

                alignItems:
                    "center",

                justifyContent:
                    "space-between",

                marginBottom:
                    "10px"
            }
        );

        const title =
            document.createElement(
                "span"
            );

        title.textContent =
            "Bambi Obeys";

        Object.assign(
            title.style,
            {
                fontWeight:
                    "bold",

                fontSize:
                    "16px",

                color:
                    "#ff9bce"
            }
        );

        const close =
            document.createElement(
                "button"
            );

        close.textContent =
            "×";

        Object.assign(
            close.style,
            {
                background:
                    "transparent",

                border:
                    "none",

                color:
                    "#ff9bce",

                fontSize:
                    "22px",

                cursor:
                    "pointer"
            }
        );

        close.onclick =
            () => {
                panelOpen =
                    false;

                panel.style.display =
                    "none";
            };

        header.appendChild(
            title
        );

        header.appendChild(
            close
        );

        panel.appendChild(
            header
        );

        const tabBar =
            document.createElement(
                "div"
            );

        Object.assign(
            tabBar.style,
            {
                display:
                    "flex",

                gap:
                    "4px",

                marginBottom:
                    "10px"
            }
        );

        for (
            const name
            of [
                "Authority",
                "Triggers",
                "Safety",
                "Limits"
            ]
        ) {
            tabBar.appendChild(
                buildTabButton(
                    name
                )
            );
        }

        panel.appendChild(
            tabBar
        );

        for (
            const name
            of [
                "Authority",
                "Triggers",
                "Safety",
                "Limits"
            ]
        ) {
            const content =
                createContentArea();

            content.style.display =
                "none";

            tabContents[name] =
                content;

            panel.appendChild(
                content
            );
        }

        buildAuthorityTab(
            tabContents.Authority
        );

        buildTriggersTab(
            tabContents.Triggers
        );

        buildSafetyTab(
            tabContents.Safety
        );

        buildLimitsTab(
            tabContents.Limits
        );

        container.appendChild(
            floatingButton
        );

        container.appendChild(
            panel
        );

        document.body.appendChild(
            container
        );

        makeDraggable(
            container,
            floatingButton
        );

        floatingButton.addEventListener(
            "click",
            () => {
                if (
                    floatingButton.__bambiMoved
                ) {
                    floatingButton.__bambiMoved =
                        false;

                    return;
                }

                panelOpen =
                    !panelOpen;

                panel.style.display =
                    panelOpen
                        ? "block"
                        : "none";
            }
        );

        switchTab(
            activeTab
        );

        refreshAllUI();
    }

    // =========================================================
    // ROOM MAINTENANCE
    // =========================================================

    function refreshRoomData() {
        const currentMembers =
            new Set(
                getRoomCharacters()
                    .map(
                        character =>
                            normalizeMemberNumber(
                                character?.MemberNumber
                            )
                    )
                    .filter(
                        Boolean
                    )
            );

        for (
            const memberNumber
            of bambiPresence.keys()
        ) {
            if (
                !currentMembers.has(
                    memberNumber
                )
            ) {
                bambiPresence.delete(
                    memberNumber
                );
            }
        }

        for (
            const memberNumber
            of connectedUsers.keys()
        ) {
            const user =
                connectedUsers.get(
                    memberNumber
                );

            if (
                currentMembers.has(
                    memberNumber
                )
            ) {
                user.name =
                    getCharacterName(
                        memberNumber
                    );
            }
        }

        saveConnections();

        announcePresence();
        refreshAllUI();
    }

    // =========================================================
    // INITIALIZATION
    // =========================================================

    loadStorage();
    installAudioUnlock();

    const wait =
        setInterval(
            () => {
                if (
                    typeof Player ===
                    "undefined"
                ) {
                    return;
                }

                if (
                    typeof ChatRoomData ===
                    "undefined"
                ) {
                    return;
                }

                if (
                    !registerBambiMod()
                ) {
                    return;
                }

                const messageHookReady =
                    installBambiMessageHook();

                const labelHookReady =
                    installBambiLabelHook();

                if (
                    !messageHookReady ||
                    !labelHookReady
                ) {
                    return;
                }

                clearInterval(
                    wait
                );

                createUI();

                scheduleRemainingWake();

                setTimeout(
                    refreshRoomData,
                    1000
                );

                setInterval(
                    refreshRoomData,
                    5000
                );

                setInterval(
                    () => {
                        const cutoff =
                            now() -
                            15000;

                        for (
                            const [
                                memberNumber,
                                presence
                            ]
                            of bambiPresence
                        ) {
                            if (
                                presence.lastSeen <
                                cutoff
                            ) {
                                bambiPresence.delete(
                                    memberNumber
                                );
                            }
                        }
                    },
                    5000
                );

                console.log(
                    "Bambi Obeys 1.5.2 loaded successfully."
                );
            },
            1000
        );

})();
