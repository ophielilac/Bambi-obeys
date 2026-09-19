(function () {
    'use strict';

    if (window.__BAMBI_OBEYS_CORE_LOADED__) return;
    window.__BAMBI_OBEYS_CORE_LOADED__ = true;

    // =========================================================
    // CONFIG
    // =========================================================

    const BAMBI_VERSION = '1.5.9';
    const PRODUCT_NAME = 'Bambi Obeys';

    const BASE_URL =
        'https://ophielilac.github.io/Bambi-obeys/bambi%20triggers/';

    const UPDATE_STORAGE_KEY =
        'bambiObeysLastSeenVersion_v1';

    const UPDATE_NOTIFIED_KEY =
        'bambiObeysUpdateNotifiedVersion_v1';

    const PENDING_UPDATE_KEY =
        'bambiObeysPendingUpdateVersion_v1';

    const UPDATE_CHECK_URL =
        'https://ophielilac.github.io/Bambi-obeys/Bambi-Obeys.js';

    const SETTINGS_KEY =
        'bambiObeysSettings_v5';

    const CONNECTIONS_KEY =
        'bambiObeysConnections_v4';

    const PENDING_KEY =
        'bambiObeysPending_v4';

    const SLEEP_KEY =
        'bambiObeysSleep_v2';

    const PROTOCOL =
        'BambiObeysMsg';

    const CONNECT_COMMAND =
        ':Bambi Connect';

    const DISCONNECT_COMMAND =
        ':Bambi Disconnect';

    const TRIGGERS = [
        {
            name: 'Bambi Focus',
            file: 'Bambi Focus.m4a',
            description: 'Causes Bambi to pay attention to what she is supposed to be doing.'
        },
        {
            name: 'Bambi Freeze',
            file: 'Bambi Freeze.m4a',
            description: 'Deepens trance, blanks mind, and erases all thought. Ensures acceptance and amnesia of further suggestions.'
        },
        {
            name: 'Bambi Reset',
            file: 'Bambi Reset.m4a',
            description: 'Memory wipe and replacement. Self-acceptance and belief that everything conditioned has always been that way.'
        },
        {
            name: "Bambi does as she's told",
            file: "Bambi does as she's told.m4a",
            description: 'Instant obedience override. Causes automatic mindless compliance with the last command given until fully carried out.'
        },
        {
            name: 'Bambi sleep',
            file: 'Bambi sleep.m4a',
            description: 'Instant deep trance trigger..'
        },
        {
            name: 'Bambi wake and obey',
            file: 'Bambi wake and obey.m4a',
            description: 'Wakes Bambi from sleep, waiting for her next command with perfect posture.'
        },
        {
            name: 'Blonde Moment',
            file: 'Blonde moment.m4a',
            description: 'Dumb-down trigger causing IQ drop and loss of thought, replaced with ditzy airhead confusion.'
        },
        {
            name: 'Drop for cock',
            file: 'Drop for cock.m4a',
            description: 'Legs buckle, body drops to its knees, mind goes blank, and mouth opens.'
        },
        {
            name: 'Good girl',
            file: 'Good girl.m4a',
            description: 'Causes feelings of happiness, euphoria, and pleasure.'
        },
        {
            name: 'Safe and Secure',
            file: 'Safe and Secure.m4a',
            description: 'Reinforces a safe and secure state.'
        },
        {
            name: 'Snap and forget',
            file: 'Snap and forget.m4a',
            description: 'Reinforces feelings of comfort and acceptance for all conditioning.'
        },
        {
            name: 'Zap cock drain obey',
            file: 'Zap cock drain obey.m4a',
            description: 'Silences the mental monologue by plugging it with cock. Overwhelms with feelings of sucking cock inside the mind.'
        },
        {
            name: 'Bambi Obeys',
            file: 'Bambi Obeys.m4a',
            description: 'Affirms your understanding, acceptance, and readiness to embody your commands, reinforcing your devotion.'
        },
        {
            name: 'Airhead barbie',
            file: 'Airhead barbie.m4a',
            description: 'Activates bimbo mental dumb-down level #1; obedient, intelligence restricted, easily confused, small and simple bimbo-voiced thoughts only, fixation on cock and appearance.'
        },
        {
            name: 'Braindead bobblehead',
            file: 'Braindead bobblehead.m4a',
            description: 'Activates bimbo mental dumb-down level #2; relaxation, completely and permanent thoughtless confusion, any attempt to think immediately shut down by mental windshield wipers, instinctively bobs blankly on cock.'
        },
        {
            name: 'Cockblank lovedoll',
            file: 'Cockblank lovedoll.m4a',
            description: 'Activates bimbo mental dumb-down level #3; shuts off all awareness, becoming a silicone sexdoll, feeling only tits and holes, rendered immobile, passive and compliant with limbs positioned to allow easy access and use.'
        }
    ];

    const DEFAULT_SETTINGS = {
        // Authority
        authorityMode: 'connected',
        whitelist: '',

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
        labelText: 'Bambi',
        labelXOffset: 300,
        labelYOffset: -30
    };

    // =========================================================
    // STATE
    // =========================================================

    let settings = clone(DEFAULT_SETTINGS);

    let selectedTrigger = 0;
    let selectedTarget = '';
    let panelOpen = false;
    let activeTab = 'Triggers';

    let container = null;
    let panel = null;
    let floatingButton = null;
    let tabs = {};
    let tabContents = {};
    let versionText = null;
    let statusText = null;
    let connectSelect = null;
    let targetSelect = null;
    let pendingArea = null;
    let triggerSelect = null;
    let triggerDescription = null;

    const connectedUsers = new Map();
    const pendingRequests = new Map();
    const bambiPresence = new Map();

    let bambiMod = null;
    let bambiMessageHookInstalled = false;
    let bambiDrawHookInstalled = false;

    let audioContext = null;
    const audioBuffers = new Map();
    const loadingBuffers = new Map();
    const activeLayers = new Set();

    // One BOTH-ear/main track at a time.
    let mainAudioLayer = null;

    // -1 = left, +1 = right. Persists after the main track ends.
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

    function clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch {
            return Object.assign({}, value);
        }
    }

    function now() {
        return Date.now();
    }

    function normalizeMemberNumber(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }

    function triggerIndexByName(name) {
        const wanted = String(name || '').toLowerCase();

        return TRIGGERS.findIndex(
            trigger => trigger.name.toLowerCase() === wanted
        );
    }

    function getTriggerURL(index) {
        if (!TRIGGERS[index]) return null;

        return BASE_URL + encodeURIComponent(TRIGGERS[index].file);
    }

    function getRoomCharacters() {
        try {
            if (
                typeof ChatRoomData !== 'undefined' &&
                ChatRoomData &&
                Array.isArray(ChatRoomData.Character)
            ) {
                return ChatRoomData.Character;
            }
        } catch {}

        try {
            if (
                typeof ChatRoomCharacter !== 'undefined' &&
                Array.isArray(ChatRoomCharacter)
            ) {
                return ChatRoomCharacter;
            }
        } catch {}

        return [];
    }

    function getCharacter(memberNumber) {
        const target = normalizeMemberNumber(memberNumber);

        if (!target) return null;

        return getRoomCharacters().find(character => {
            return normalizeMemberNumber(character?.MemberNumber) === target;
        }) || null;
    }

    function getCharacterName(memberNumber) {
        const character = getCharacter(memberNumber);

        if (!character) return 'Unknown';

        return character.Nickname || character.Name || 'Unknown';
    }

    function isInCurrentRoom(memberNumber) {
        const target = normalizeMemberNumber(memberNumber);

        if (!target) return false;

        return getRoomCharacters().some(character => {
            return normalizeMemberNumber(character?.MemberNumber) === target;
        });
    }

    function getOwnerNumber() {
        try {
            const owner = Number(Player?.OwnerNumber);

            if (Number.isFinite(owner) && owner > 0) {
                return owner;
            }
        } catch {}

        return 0;
    }

    function getFriendNumbers() {
        const result = new Set();

        try {
            if (Array.isArray(Player?.FriendList)) {
                for (const number of Player.FriendList) {
                    const normalized = normalizeMemberNumber(number);

                    if (normalized) {
                        result.add(normalized);
                    }
                }
            }
        } catch {}

        return result;
    }

    function getWhitelist() {
        const result = new Set();

        String(settings.whitelist || '')
            .split(/[\s,;]+/)
            .map(value => normalizeMemberNumber(value))
            .filter(Boolean)
            .forEach(value => result.add(value));

        return result;
    }

    function getSetting(key, fallback) {
        return settings[key] ?? fallback;
    }

    function setStatus(message) {
        if (statusText) {
            statusText.textContent = message || '';
        }
    }

    // =========================================================
    // STORAGE
    // =========================================================

    function loadStorage() {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);

            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);

                settings = Object.assign(
                    clone(DEFAULT_SETTINGS),
                    parsed || {}
                );
            }
        } catch (error) {
            console.error(
                'Bambi Obeys: settings load failed',
                error
            );

            settings = clone(DEFAULT_SETTINGS);
        }

        try {
            const savedConnections =
                localStorage.getItem(CONNECTIONS_KEY);

            if (savedConnections) {
                const parsed = JSON.parse(savedConnections);

                if (Array.isArray(parsed)) {
                    connectedUsers.clear();

                    for (const entry of parsed) {
                        const memberNumber =
                            normalizeMemberNumber(entry?.memberNumber);

                        if (memberNumber) {
                            connectedUsers.set(
                                memberNumber,
                                {
                                    memberNumber,
                                    name: entry.name || 'Unknown'
                                }
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.error(
                'Bambi Obeys: connections load failed',
                error
            );
        }

        try {
            const savedPending =
                localStorage.getItem(PENDING_KEY);

            if (savedPending) {
                const parsed = JSON.parse(savedPending);

                if (Array.isArray(parsed)) {
                    pendingRequests.clear();

                    for (const entry of parsed) {
                        const memberNumber =
                            normalizeMemberNumber(entry?.memberNumber);

                        if (memberNumber) {
                            pendingRequests.set(
                                memberNumber,
                                {
                                    memberNumber,
                                    name: entry.name || 'Unknown'
                                }
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.error(
                'Bambi Obeys: pending load failed',
                error
            );
        }

        try {
            const savedSleep =
                localStorage.getItem(SLEEP_KEY);

            if (savedSleep) {
                const parsed = JSON.parse(savedSleep);

                if (parsed && typeof parsed === 'object') {
                    sleepState = Object.assign(
                        {
                            active: false,
                            startedAt: 0
                        },
                        parsed
                    );
                }
            }
        } catch (error) {
            console.error(
                'Bambi Obeys: sleep state load failed',
                error
            );
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(
                SETTINGS_KEY,
                JSON.stringify(settings)
            );

            announcePresence();
        } catch (error) {
            console.error(
                'Bambi Obeys: settings save failed',
                error
            );
        }
    }

    function saveConnections() {
        try {
            localStorage.setItem(
                CONNECTIONS_KEY,
                JSON.stringify([...connectedUsers.values()])
            );
        } catch (error) {
            console.error(
                'Bambi Obeys: connections save failed',
                error
            );
        }
    }

    function savePendingRequests() {
        try {
            localStorage.setItem(
                PENDING_KEY,
                JSON.stringify([...pendingRequests.values()])
            );
        } catch (error) {
            console.error(
                'Bambi Obeys: pending save failed',
                error
            );
        }
    }

    function saveSleepState() {
        try {
            localStorage.setItem(
                SLEEP_KEY,
                JSON.stringify(sleepState)
            );
        } catch (error) {
            console.error(
                'Bambi Obeys: sleep state save failed',
                error
            );
        }
    }

    // =========================================================
    // VERSION / UPDATE NOTIFICATIONS
    // =========================================================

    function compareVersions(a, b) {
        const left = String(a || '')
            .replace(/^v/i, '')
            .split('.')
            .map(part => parseInt(part, 10) || 0);

        const right = String(b || '')
            .replace(/^v/i, '')
            .split('.')
            .map(part => parseInt(part, 10) || 0);

        const length = Math.max(left.length, right.length);

        for (let i = 0; i < length; i += 1) {
            const l = left[i] || 0;
            const r = right[i] || 0;

            if (l > r) return 1;
            if (l < r) return -1;
        }

        return 0;
    }

    function getStoredValue(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(
                `Bambi Obeys: failed to read ${key}`,
                error
            );

            return null;
        }
    }

    function setStoredValue(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(
                `Bambi Obeys: failed to save ${key}`,
                error
            );

            return false;
        }
    }

    function removeStoredValue(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(
                `Bambi Obeys: failed to remove ${key}`,
                error
            );
        }
    }

    function sendLocalMessage(message) {
        if (typeof ChatRoomSendLocal !== 'function') {
            console.log(`Bambi Obeys: ${message}`);
            return false;
        }

        try {
            const isLightTheme =
                typeof Player !== 'undefined' &&
                Player?.ChatSettings?.ColorTheme?.includes('Light');

            const backgroundColor = isLightTheme
                ? '#D7F6E9'
                : '#23523E';

            const escaped = String(message)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            ChatRoomSendLocal(
                `<div style='background-color:${backgroundColor};'>${escaped}</div>`
            );

            return true;
        } catch (error) {
            console.error(
                'Bambi Obeys: local chat message failed',
                error
            );

            return false;
        }
    }

    function checkVersionUpdate() {
        const previousVersion =
            getStoredValue(UPDATE_STORAGE_KEY);

        const pendingVersion =
            getStoredValue(PENDING_UPDATE_KEY);

        // First install: simply remember the currently running version.
        if (!previousVersion) {
            setStoredValue(
                UPDATE_STORAGE_KEY,
                BAMBI_VERSION
            );

            return;
        }

        // The new code is now running.
        // If this version was previously announced as an available
        // update, tell the user that the update completed.
        if (
            compareVersions(
                BAMBI_VERSION,
                previousVersion
            ) > 0 &&
            pendingVersion &&
            compareVersions(
                BAMBI_VERSION,
                pendingVersion
            ) >= 0
        ) {
            sendLocalMessage(
                'Update complete! Good girl~'
            );

            removeStoredValue(
                PENDING_UPDATE_KEY
            );

            removeStoredValue(
                UPDATE_NOTIFIED_KEY
            );
        }

        setStoredValue(
            UPDATE_STORAGE_KEY,
            BAMBI_VERSION
        );
    }

    async function checkForNewVersion() {
        try {
            const response = await fetch(
                `${UPDATE_CHECK_URL}?versionCheck=${Date.now()}`,
                {
                    cache: 'no-store',
                    credentials: 'omit'
                }
            );

            if (!response.ok) return;

            const source = await response.text();

            const match = source.match(
                /const\s+BAMBI_VERSION\s*=\s*['"]([^'"]+)['"]/i
            );

            if (!match) return;

            const latestVersion = match[1];

            if (
                compareVersions(
                    latestVersion,
                    BAMBI_VERSION
                ) <= 0
            ) {
                return;
            }

            const notifiedVersion =
                getStoredValue(
                    UPDATE_NOTIFIED_KEY
                );

            if (notifiedVersion === latestVersion) {
                return;
            }

            sendLocalMessage(
                "bzzzt Bambi! There's an update! refresh like a good girl~"
            );

            setStoredValue(
                UPDATE_NOTIFIED_KEY,
                latestVersion
            );

            setStoredValue(
                PENDING_UPDATE_KEY,
                latestVersion
            );
        } catch (error) {
            console.debug(
                'Bambi Obeys: version check failed',
                error
            );
        }
    }

    // =========================================================
    // BC MODSDK
    // =========================================================

    function registerBambiMod() {
        if (
            typeof bcModSdk === 'undefined' ||
            !bcModSdk ||
            typeof bcModSdk.registerMod !== 'function'
        ) {
            return false;
        }

        if (bambiMod) return true;

        try {
            bambiMod = bcModSdk.registerMod({
                name: 'BambiObeys',
                fullName: 'Bambi Obeys',
                version: BAMBI_VERSION,
                repository:
                    'https://github.com/ophielilac/Bambi-obeys'
            });

            return Boolean(bambiMod);
        } catch (error) {
            console.error(
                'Bambi Obeys: ModSDK registration failed',
                error
            );

            return false;
        }
    }

    // =========================================================
    // AUDIO
    // =========================================================

    function ensureAudioContext() {
        if (audioContext) {
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
            }

            return audioContext;
        }

        try {
            audioContext =
                new (window.AudioContext ||
                    window.webkitAudioContext)();

            return audioContext;
        } catch (error) {
            console.error(
                'Bambi Obeys: AudioContext creation failed',
                error
            );

            return null;
        }
    }

    function installAudioUnlock() {
        const unlock = () => {
            const context = ensureAudioContext();

            if (context?.state === 'suspended') {
                context.resume().catch(() => {});
            }
        };

        document.addEventListener(
            'click',
            unlock,
            {
                passive: true
            }
        );

        document.addEventListener(
            'keydown',
            unlock,
            {
                passive: true
            }
        );
    }

    async function loadAudioBuffer(index) {
        if (audioBuffers.has(index)) {
            return audioBuffers.get(index);
        }

        if (loadingBuffers.has(index)) {
            return loadingBuffers.get(index);
        }

        const url = getTriggerURL(index);

        if (!url) return null;

        const context = ensureAudioContext();

        if (!context) return null;

        const promise = (async () => {
            try {
                const response = await fetch(
                    url,
                    {
                        cache: 'force-cache'
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}`
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
                    'Bambi Obeys: audio load failed',
                    TRIGGERS[index]?.name,
                    error
                );

                return null;
            } finally {
                loadingBuffers.delete(index);
            }
        })();

        loadingBuffers.set(index, promise);

        return promise;
    }

    function applyFade(gainNode, from, to, duration) {
        const context = ensureAudioContext();

        if (!context || !gainNode) return;

        const start = context.currentTime;

        gainNode.gain.cancelScheduledValues(start);
        gainNode.gain.setValueAtTime(from, start);

        if (duration <= 0) {
            gainNode.gain.setValueAtTime(
                to,
                start
            );

            return;
        }

        gainNode.gain.linearRampToValueAtTime(
            to,
            start + duration / 1000
        );
    }

    function stopLayer(layer, fadeOutMs) {
        if (!layer || layer.stopped) return;

        layer.stopped = true;

        const context = audioContext;

        if (!context) {
            try {
                layer.source.stop();
            } catch {}

            activeLayers.delete(layer);

            if (layer.isMain && mainAudioLayer === layer) {
                mainAudioLayer = null;
            }

            return;
        }

        const duration = Math.max(
            0,
            Number(fadeOutMs) || 0
        );

        try {
            applyFade(
                layer.gain,
                layer.gain.gain.value,
                0,
                duration
            );

            layer.source.stop(
                context.currentTime +
                duration / 1000
            );
        } catch {}

        setTimeout(
            () => {
                activeLayers.delete(layer);

                if (
                    layer.isMain &&
                    mainAudioLayer === layer
                ) {
                    mainAudioLayer = null;
                }
            },
            duration + 50
        );
    }

    function stopAllAudio() {
        for (const layer of [...activeLayers]) {
            stopLayer(
                layer,
                settings.fadeOutMs
            );
        }

        activeLayers.clear();
        mainAudioLayer = null;
    }

    async function playTrigger(index) {
        const trigger = TRIGGERS[index];

        if (!trigger) return false;

        const context = ensureAudioContext();

        if (!context) return false;

        if (context.state === 'suspended') {
            try {
                await context.resume();
            } catch {}
        }

        const buffer =
            await loadAudioBuffer(index);

        if (!buffer) return false;

        // -----------------------------------------------------
        // Limits / cooldown
        // -----------------------------------------------------

        const currentTime = now();

        if (
            settings.cooldownMs > 0 &&
            currentTime - lastTriggerTime <
                settings.cooldownMs
        ) {
            return false;
        }

        const minuteAgo =
            currentTime - 60000;

        triggerHistory =
            triggerHistory.filter(
                timestamp => timestamp >= minuteAgo
            );

        if (
            settings.maxTriggersPerMinute > 0 &&
            triggerHistory.length >=
                settings.maxTriggersPerMinute
        ) {
            return false;
        }

        lastTriggerTime = currentTime;
        triggerHistory.push(currentTime);

        // -----------------------------------------------------
        // Decide whether this is the main track or a secondary
        // -----------------------------------------------------

        const isMain =
            mainAudioLayer === null;

        if (
            activeLayers.size >=
            Number(settings.maxSimultaneous)
        ) {
            if (!isMain) {
                return false;
            }

            const oldest =
                [...activeLayers][0];

            if (oldest) {
                stopLayer(
                    oldest,
                    settings.fadeOutMs
                );
            }
        }

        const source =
            context.createBufferSource();

        source.buffer = buffer;

        const gain =
            context.createGain();

        const finalGain =
            isMain
                ? 1
                : Number(settings.secondaryVolume);

        gain.gain.setValueAtTime(
            0,
            context.currentTime
        );

        source.connect(gain);

        let output = gain;
        let panner = null;

        if (!isMain && settings.alternateEars) {
            if (lastSecondaryPan >= 0) {
                lastSecondaryPan = -1;
            } else {
                lastSecondaryPan = 1;
            }

            panner =
                context.createStereoPanner();

            panner.pan.setValueAtTime(
                lastSecondaryPan,
                context.currentTime
            );

            gain.connect(panner);

            output = panner;
        }

        output.connect(
            context.destination
        );

        const layer = {
            source,
            gain,
            panner,
            isMain,
            stopped: false
        };

        activeLayers.add(layer);

        if (isMain) {
            mainAudioLayer = layer;
        }

        const fadeIn =
            Math.max(
                0,
                Number(settings.fadeInMs) || 0
            );

        applyFade(
            gain,
            0,
            finalGain,
            fadeIn
        );

        source.onended = () => {
            activeLayers.delete(layer);

            if (
                layer.isMain &&
                mainAudioLayer === layer
            ) {
                mainAudioLayer = null;
            }
        };

        try {
            source.start();
            return true;
        } catch (error) {
            activeLayers.delete(layer);

            if (
                layer.isMain &&
                mainAudioLayer === layer
            ) {
                mainAudioLayer = null;
            }

            console.error(
                'Bambi Obeys: audio playback failed',
                error
            );

            return false;
        }
    }

    // =========================================================
    // SLEEP / AUTO WAKE
    // =========================================================

    function cancelSleepTimer() {
        if (sleepTimer) {
            clearTimeout(sleepTimer);
            sleepTimer = null;
        }
    }

    function setSleepState(active) {
        sleepState.active = Boolean(active);
        sleepState.startedAt =
            active ? now() : 0;

        saveSleepState();
        scheduleRemainingWake();
    }

    function scheduleRemainingWake() {
        cancelSleepTimer();

        if (
            !settings.autoWakeEnabled ||
            !settings.autoWakeMinutes ||
            settings.autoWakeMinutes <= 0 ||
            !sleepState.active ||
            !sleepState.startedAt
        ) {
            return;
        }

        const duration =
            Number(settings.autoWakeMinutes) *
            60 *
            1000;

        const elapsed =
            now() - Number(
                sleepState.startedAt
            );

        const remaining =
            duration - elapsed;

        if (remaining <= 0) {
            setSleepState(false);

            const wakeIndex =
                triggerIndexByName(
                    'Bambi wake and obey'
                );

            if (wakeIndex >= 0) {
                playTrigger(wakeIndex);
            }

            return;
        }

        sleepTimer = setTimeout(
            () => {
                sleepTimer = null;

                if (!sleepState.active) {
                    return;
                }

                setSleepState(false);

                const wakeIndex =
                    triggerIndexByName(
                        'Bambi wake and obey'
                    );

                if (wakeIndex >= 0) {
                    playTrigger(wakeIndex);
                }
            },
            remaining
        );
    }

    // =========================================================
    // AUTHORITY
    // =========================================================

    function canTrigger(senderMemberNumber) {
        const sender =
            normalizeMemberNumber(
                senderMemberNumber
            );

        if (!sender) return false;

        const whitelist =
            getWhitelist();

        if (whitelist.has(sender)) {
            return true;
        }

        switch (settings.authorityMode) {
            case 'owner':
                return sender === getOwnerNumber();

            case 'friends':
                return getFriendNumbers().has(sender);

            case 'connected':
                return connectedUsers.has(sender);

            case 'anyone':
                return true;

            default:
                return connectedUsers.has(sender);
        }
    }

    // =========================================================
    // NETWORK
    // =========================================================

    function sendWhisper(memberNumber, content) {
        if (typeof ServerSend !== 'function') {
            return false;
        }

        try {
            ServerSend(
                'ChatRoomChat',
                {
                    Content: content,
                    Type: 'Whisper',
                    Target:
                        normalizeMemberNumber(
                            memberNumber
                        )
                }
            );

            return true;
        } catch (error) {
            console.error(
                'Bambi Obeys: whisper failed',
                error
            );

            return false;
        }
    }

    function sendBambiMessage(
        targetMemberNumber,
        payload
    ) {
        if (typeof ServerSend !== 'function') {
            return false;
        }

        try {
            const packet = {
                Type: 'Hidden',
                Content: PROTOCOL,
                Sender:
                    Player?.MemberNumber,
                Dictionary: [
                    {
                        message: payload
                    }
                ]
            };

            const target =
                normalizeMemberNumber(
                    targetMemberNumber
                );

            if (target) {
                packet.Target = target;
            }

            ServerSend(
                'ChatRoomChat',
                packet
            );

            return true;
        } catch (error) {
            console.error(
                'Bambi Obeys: hidden send failed',
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

        if (!myNumber) return;

        sendBambiMessage(
            null,
            {
                type: 'presence',
                version: BAMBI_VERSION,
                name: Player?.Nickname ||
                    Player?.Name ||
                    'Bambi'
            }
        );
    }

    function sendConnectionRequest(
        memberNumber
    ) {
        const target =
            normalizeMemberNumber(
                memberNumber
            );

        if (!target) return false;

        return sendWhisper(
            target,
            CONNECT_COMMAND
        );
    }

    function disconnectUser(memberNumber) {
        const target =
            normalizeMemberNumber(
                memberNumber
            );

        if (!target) return false;

        sendWhisper(
            target,
            DISCONNECT_COMMAND
        );

        connectedUsers.delete(target);
        saveConnections();

        refreshAllUI();

        return true;
    }

    function acceptConnection(memberNumber) {
        const target =
            normalizeMemberNumber(
                memberNumber
            );

        if (!target) return false;

        const name =
            getCharacterName(target);

        connectedUsers.set(
            target,
            {
                memberNumber: target,
                name
            }
        );

        pendingRequests.delete(target);

        saveConnections();
        savePendingRequests();

        sendBambiMessage(
            target,
            {
                type: 'connectionAccepted',
                targetMemberNumber: target,
                targetName: name
            }
        );

        refreshAllUI();

        setStatus(
            `Connected to ${name}.`
        );

        return true;
    }

    // =========================================================
    // BAMBI MESSAGES
    // =========================================================

    function handleBambiMessage(data) {
        if (!data) return;

        if (
            data.Type !== 'Hidden' ||
            data.Content !== PROTOCOL
        ) {
            return;
        }

        const sender =
            normalizeMemberNumber(
                data.Sender
            );

        if (!sender) return;

        if (
            sender ===
            normalizeMemberNumber(
                Player?.MemberNumber
            )
        ) {
            return;
        }

        let payload =
            data.Dictionary?.[0]?.message;

        if (!payload) return;

        if (
            typeof payload === 'string'
        ) {
            try {
                payload = JSON.parse(payload);
            } catch {
                return;
            }
        }

        if (
            !payload ||
            typeof payload !== 'object'
        ) {
            return;
        }

        // -----------------------------------------------------
        // Presence
        // -----------------------------------------------------

        if (payload.type === 'presence') {
            bambiPresence.set(
                sender,
                {
                    memberNumber: sender,
                    name:
                        payload.name ||
                        getCharacterName(sender),
                    version:
                        payload.version ||
                        'unknown',
                    lastSeen: now()
                }
            );

            refreshAllUI();
            return;
        }

        // -----------------------------------------------------
        // Connection accepted
        // -----------------------------------------------------

        if (
            payload.type ===
            'connectionAccepted'
        ) {
            const target =
                normalizeMemberNumber(
                    payload.targetMemberNumber
                );

            if (
                target ===
                normalizeMemberNumber(
                    Player?.MemberNumber
                )
            ) {
                connectedUsers.set(
                    sender,
                    {
                        memberNumber: sender,
                        name:
                            payload.targetName ||
                            getCharacterName(sender)
                    }
                );

                saveConnections();
                refreshAllUI();

                setStatus(
                    `Connected to ${getCharacterName(sender)}.`
                );
            }

            return;
        }

        // -----------------------------------------------------
        // Connection request
        // -----------------------------------------------------

        if (
            payload.type ===
            'connectionRequest'
        ) {
            const target =
                normalizeMemberNumber(
                    payload.targetMemberNumber
                );

            if (
                target !==
                normalizeMemberNumber(
                    Player?.MemberNumber
                )
            ) {
                return;
            }

            const name =
                getCharacterName(sender);

            pendingRequests.set(
                sender,
                {
                    memberNumber: sender,
                    name
                }
            );

            savePendingRequests();
            refreshAllUI();

            if (
                settings.autoAcceptConnections
            ) {
                acceptConnection(sender);
            } else {
                setStatus(
                    `Connection request from ${name}.`
                );
            }

            return;
        }

        // -----------------------------------------------------
        // Disconnect
        // -----------------------------------------------------

        if (
            payload.type ===
            'disconnect'
        ) {
            connectedUsers.delete(sender);
            saveConnections();
            refreshAllUI();
            return;
        }

        // -----------------------------------------------------
        // Trigger
        // -----------------------------------------------------

        if (payload.type === 'trigger') {
            const index =
                Number(
                    payload.triggerIndex
                );

            if (
                !Number.isInteger(index) ||
                !TRIGGERS[index]
            ) {
                return;
            }

            if (
                !settings.acceptIncoming
            ) {
                console.log(
                    'Bambi Obeys: incoming triggers are disabled.'
                );

                return;
            }

            if (!canTrigger(sender)) {
                console.log(
                    'Bambi Obeys: trigger rejected by authority mode:',
                    sender
                );

                return;
            }

            playTrigger(index);
            return;
        }
    }

    function handleBambiChatMessage(data) {
        if (!data) return;

        const sender =
            normalizeMemberNumber(
                data.Sender
            );

        if (
            !sender ||
            sender ===
                normalizeMemberNumber(
                    Player?.MemberNumber
                )
        ) {
            return;
        }

        const message =
            String(
                data.Content || ''
            ).trim();

        if (!message) return;

        // Connection requests are ordinary whispers.
        if (
            data.Type === 'Whisper' &&
            message.toLowerCase() ===
                CONNECT_COMMAND.toLowerCase()
        ) {
            const name =
                getCharacterName(sender);

            if (!connectedUsers.has(sender)) {
                pendingRequests.set(
                    sender,
                    {
                        memberNumber: sender,
                        name
                    }
                );

                savePendingRequests();
                refreshAllUI();
            }

            if (
                settings.autoAcceptConnections
            ) {
                acceptConnection(sender);
            } else {
                setStatus(
                    `Connection request from ${name}.`
                );
            }

            return;
        }

        if (
            data.Type === 'Whisper' &&
            message.toLowerCase() ===
                DISCONNECT_COMMAND.toLowerCase()
        ) {
            connectedUsers.delete(sender);

            saveConnections();
            refreshAllUI();

            return;
        }
    }

    function installChatRoomSyncHook() {
        if (
            !bambiMod ||
            typeof bambiMod.hookFunction !==
                'function'
        ) {
            return false;
        }

        if (
            window.__BAMBI_OBEYS_SYNC_HOOK_INSTALLED__
        ) {
            return true;
        }

        try {
            bambiMod.hookFunction(
                'ChatRoomSync',
                1,
                (args, next) => {
                    const result =
                        next(args);

                    try {
                        setTimeout(
                            () => {
                                announcePresence();
                                refreshRoomData();
                            },
                            50
                        );
                    } catch {}

                    return result;
                }
            );

            window.__BAMBI_OBEYS_SYNC_HOOK_INSTALLED__ =
                true;

            return true;
        } catch (error) {
            console.error(
                'Bambi Obeys: ChatRoomSync hook failed',
                error
            );

            return false;
        }
    }

    function installBambiMessageHook() {
        if (bambiMessageHookInstalled) {
            return true;
        }

        if (
            !bambiMod ||
            typeof bambiMod.hookFunction !==
                'function'
        ) {
            return false;
        }

        try {
            bambiMod.hookFunction(
                'ChatRoomMessage',
                1,
                (args, next) => {
                    const data = args[0];

                    try {
                        handleBambiMessage(data);
                        handleBambiChatMessage(data);
                    } catch (error) {
                        console.error(
                            'Bambi Obeys: message handling failed',
                            error
                        );
                    }

                    return next(args);
                }
            );

            bambiMessageHookInstalled = true;

            return true;
        } catch (error) {
            console.error(
                'Bambi Obeys: ChatRoomMessage hook failed',
                error
            );

            return false;
        }
    }

    // =========================================================
    // LABELS
    // =========================================================

    function getMainCanvasContext() {
        try {
            if (
                typeof MainCanvasCtx !==
                    'undefined' &&
                MainCanvasCtx &&
                typeof MainCanvasCtx.fillText ===
                    'function'
            ) {
                return MainCanvasCtx;
            }
        } catch {}

        try {
            if (
                typeof MainCanvas !==
                    'undefined' &&
                MainCanvas
            ) {
                return MainCanvas.getContext(
                    '2d'
                );
            }
        } catch {}

        return null;
    }

    function installBambiLabelHook() {
        if (bambiDrawHookInstalled) {
            return true;
        }

        if (
            !bambiMod ||
            typeof bambiMod.hookFunction !==
                'function'
        ) {
            return false;
        }

        try {
            bambiMod.hookFunction(
                'ChatRoomDrawCharacterStatusIcons',
                1,
                (args, next) => {
                    const result =
                        next(args);

                    try {
                        if (
                            !settings.showBambiLabels
                        ) {
                            return result;
                        }

                        const [
                            C,
                            CharX,
                            CharY,
                            Zoom
                        ] = args;

                        if (!C) {
                            return result;
                        }

                        const memberNumber =
                            normalizeMemberNumber(
                                C.MemberNumber
                            );

                        if (!memberNumber) {
                            return result;
                        }

                        if (
                            !bambiPresence.has(
                                memberNumber
                            )
                        ) {
                            return result;
                        }

                        if (
                            memberNumber ===
                            normalizeMemberNumber(
                                Player?.MemberNumber
                            )
                        ) {
                            return result;
                        }

                        const ctx =
                            getMainCanvasContext();

                        if (!ctx) {
                            return result;
                        }

                        const text =
                            String(
                                settings.labelText ||
                                'Bambi'
                            );

                        const x =
                            Number(CharX) +
                            Number(
                                settings.labelXOffset
                            ) *
                                Number(Zoom || 1);

                        const y =
                            Number(CharY) +
                            Number(
                                settings.labelYOffset
                            ) *
                                Number(Zoom || 1);

                        ctx.save();

                        ctx.globalAlpha =
                            Math.max(
                                0,
                                Math.min(
                                    1,
                                    Number(
                                        settings.labelOpacity
                                    )
                                )
                            );

                        ctx.font =
                            `${Math.max(
                                10,
                                18 *
                                    Number(
                                        Zoom || 1
                                    )
                            )}px Arial`;

                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        ctx.fillStyle =
                            '#ff69b4';

                        ctx.strokeStyle =
                            '#3a1730';

                        ctx.lineWidth =
                            4 *
                            Number(
                                Zoom || 1
                            );

                        ctx.strokeText(
                            text,
                            x,
                            y
                        );

                        ctx.fillText(
                            text,
                            x,
                            y
                        );

                        ctx.restore();
                    } catch (error) {
                        console.debug(
                            'Bambi Obeys: label draw failed',
                            error
                        );
                    }

                    return result;
                }
            );

            bambiDrawHookInstalled = true;

            return true;
        } catch (error) {
            console.error(
                'Bambi Obeys: label hook failed',
                error
            );

            return false;
        }
    }

    // =========================================================
    // TRIGGER SENDING
    // =========================================================

    function sendTrigger(
        targetMemberNumber,
        index
    ) {
        const target =
            normalizeMemberNumber(
                targetMemberNumber
            );

        const triggerIndex =
            Number(index);

        if (
            !target ||
            !Number.isInteger(
                triggerIndex
            ) ||
            !TRIGGERS[triggerIndex]
        ) {
            return false;
        }

        if (!isInCurrentRoom(target)) {
            setStatus(
                'That person is not in the current room.'
            );

            return false;
        }

        if (
            settings.authorityMode ===
                'owner' &&
            target !== getOwnerNumber()
        ) {
            // Sending is controlled by the sender's
            // chosen target and not the receiver's authority.
        }

        sendBambiMessage(
            target,
            {
                type: 'trigger',
                triggerIndex,
                triggerName:
                    TRIGGERS[triggerIndex].name,
                targetMemberNumber: target
            }
        );

        setStatus(
            `Sent "${TRIGGERS[triggerIndex].name}" to ${getCharacterName(target)}.`
        );

        return true;
    }

    // =========================================================
    // CONNECTION REQUESTS
    // =========================================================

    function requestConnection(
        memberNumber
    ) {
        const target =
            normalizeMemberNumber(
                memberNumber
            );

        if (!target) return false;

        if (!isInCurrentRoom(target)) {
            setStatus(
                'That person is not in the current room.'
            );

            return false;
        }

        sendWhisper(
            target,
            CONNECT_COMMAND
        );

        setStatus(
            `Connection request sent to ${getCharacterName(target)}.`
        );

        return true;
    }

    // =========================================================
    // UI HELPERS
    // =========================================================

    function createContentArea() {
        const content =
            document.createElement('div');

        Object.assign(
            content.style,
            {
                maxHeight: '420px',
                overflowY: 'auto',
                paddingRight: '2px'
            }
        );

        return content;
    }

    function createLabel(text) {
        const label =
            document.createElement('div');

        label.textContent = text;

        Object.assign(
            label.style,
            {
                fontSize: '11px',
                marginTop: '7px',
                marginBottom: '3px',
                color: '#ffb6d9'
            }
        );

        return label;
    }

    function createSelect() {
        const select =
            document.createElement('select');

        Object.assign(
            select.style,
            {
                width: '100%',
                boxSizing: 'border-box',
                padding: '5px',
                background: '#5b2447',
                color: '#fff',
                border: '1px solid #ff8fc7',
                borderRadius: '5px',
                fontSize: '11px'
            }
        );

        return select;
    }

    function createButton(
        text,
        callback
    ) {
        const button =
            document.createElement('button');

        button.textContent = text;

        Object.assign(
            button.style,
            {
                width: '100%',
                padding: '6px',
                marginTop: '5px',
                cursor: 'pointer',
                background: '#ff4fa3',
                color: '#fff',
                border: '1px solid #ff8fc7',
                borderRadius: '5px',
                fontSize: '11px'
            }
        );

        button.addEventListener(
            'click',
            callback
        );

        return button;
    }

    function createCheckbox(
        labelText,
        checked,
        callback
    ) {
        const wrapper =
            document.createElement('label');

        Object.assign(
            wrapper.style,
            {
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                marginTop: '6px',
                cursor: 'pointer'
            }
        );

        const input =
            document.createElement('input');

        input.type = 'checkbox';
        input.checked = Boolean(
            checked
        );

        input.addEventListener(
            'change',
            () => callback(
                input.checked
            )
        );

        const text =
            document.createElement('span');

        text.textContent = labelText;

        wrapper.appendChild(input);
        wrapper.appendChild(text);

        return wrapper;
    }

    function createNumberInput(
        value,
        min,
        max,
        step,
        callback
    ) {
        const input =
            document.createElement('input');

        input.type = 'number';
        input.value = value;
        input.min = min;
        input.max = max;
        input.step = step;

        Object.assign(
            input.style,
            {
                width: '100%',
                boxSizing: 'border-box',
                padding: '5px',
                background: '#5b2447',
                color: '#fff',
                border: '1px solid #ff8fc7',
                borderRadius: '5px',
                fontSize: '11px'
            }
        );

        input.addEventListener(
            'change',
            () => {
                const parsed =
                    Number(input.value);

                if (
                    Number.isFinite(parsed)
                ) {
                    callback(parsed);
                }
            }
        );

        return input;
    }

    function createRangeInput(
        value,
        min,
        max,
        step,
        callback
    ) {
        const input =
            document.createElement('input');

        input.type = 'range';
        input.value = value;
        input.min = min;
        input.max = max;
        input.step = step;

        Object.assign(
            input.style,
            {
                width: '100%'
            }
        );

        input.addEventListener(
            'input',
            () => {
                callback(
                    Number(input.value)
                );
            }
        );

        return input;
    }

    // =========================================================
    // UI TABS
    // =========================================================

    function switchTab(name) {
        activeTab = name;

        for (const tabName of Object.keys(tabs)) {
            tabs[tabName].style.background =
                tabName === name
                    ? '#ff4fa3'
                    : '#5b2447';
        }

        for (
            const contentName of Object.keys(
                tabContents
            )
        ) {
            tabContents[
                contentName
            ].style.display =
                contentName === name
                    ? 'block'
                    : 'none';
        }

        refreshAllUI();
    }

    // =========================================================
    // AUTHORITY TAB
    // =========================================================

    function buildAuthorityTab(container) {
        container.innerHTML = '';

        container.appendChild(
            createLabel(
                'Who can control Bambi'
            )
        );

        const authoritySelect =
            createSelect();

        const modes = [
            ['owner', 'Owner only'],
            ['friends', 'Friends only'],
            ['connected', 'Connected users'],
            ['anyone', 'Anyone'],
            ['whitelist', 'Whitelist only']
        ];

        for (const [value, text] of modes) {
            const option =
                document.createElement('option');

            option.value = value;
            option.textContent = text;

            authoritySelect.appendChild(
                option
            );
        }

        authoritySelect.value =
            settings.authorityMode;

        authoritySelect.addEventListener(
            'change',
            () => {
                settings.authorityMode =
                    authoritySelect.value;

                saveSettings();
                refreshAllUI();
            }
        );

        container.appendChild(
            authoritySelect
        );

        container.appendChild(
            createLabel(
                'Whitelist member numbers'
            )
        );

        const whitelistInput =
            document.createElement('textarea');

        whitelistInput.value =
            settings.whitelist || '';

        whitelistInput.placeholder =
            '12345, 67890';

        Object.assign(
            whitelistInput.style,
            {
                width: '100%',
                minHeight: '45px',
                boxSizing: 'border-box',
                resize: 'vertical',
                padding: '5px',
                background: '#5b2447',
                color: '#fff',
                border: '1px solid #ff8fc7',
                borderRadius: '5px',
                fontSize: '11px'
            }
        );

        whitelistInput.addEventListener(
            'change',
            () => {
                settings.whitelist =
                    whitelistInput.value;

                saveSettings();
                refreshAllUI();
            }
        );

        container.appendChild(
            whitelistInput
        );

        container.appendChild(
            createCheckbox(
                'Accept incoming triggers',
                settings.acceptIncoming,
                checked => {
                    settings.acceptIncoming =
                        checked;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createCheckbox(
                'Auto accept connection requests',
                settings.autoAcceptConnections,
                checked => {
                    settings.autoAcceptConnections =
                        checked;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createLabel(
                'Connected users'
            )
        );

        const connectionList =
            document.createElement('div');

        connectionList.dataset.bambi =
            'connection-list';

        container.appendChild(
            connectionList
        );

        const disconnectButton =
            createButton(
                'Disconnect selected',
                () => {
                    const target =
                        normalizeMemberNumber(
                            targetSelect?.value
                        );

                    if (target) {
                        disconnectUser(target);
                    }
                }
            );

        container.appendChild(
            disconnectButton
        );
    }

    // =========================================================
    // TRIGGERS TAB
    // =========================================================

    function buildTriggersTab(container) {
        container.innerHTML = '';

        container.appendChild(
            createLabel(
                'Connect to'
            )
        );

        connectSelect =
            createSelect();

        connectSelect.addEventListener(
            'change',
            () => {
                const target =
                    normalizeMemberNumber(
                        connectSelect.value
                    );

                if (target) {
                    requestConnection(target);
                }

                connectSelect.value = '';
            }
        );

        const emptyOption =
            document.createElement('option');

        emptyOption.value = '';
        emptyOption.textContent =
            'Select someone...';

        connectSelect.appendChild(
            emptyOption
        );

        container.appendChild(
            connectSelect
        );

        pendingArea =
            document.createElement('div');

        container.appendChild(
            pendingArea
        );

        container.appendChild(
            createLabel(
                'Send trigger to'
            )
        );

        targetSelect =
            createSelect();

        targetSelect.addEventListener(
            'change',
            () => {
                selectedTarget =
                    targetSelect.value;
            }
        );

        container.appendChild(
            targetSelect
        );

        container.appendChild(
            createLabel(
                'Trigger'
            )
        );

        triggerSelect =
            createSelect();

        for (
            let index = 0;
            index < TRIGGERS.length;
            index += 1
        ) {
            const trigger =
                TRIGGERS[index];

            const option =
                document.createElement('option');

            option.value =
                String(index);

            option.textContent =
                trigger.name;

            triggerSelect.appendChild(
                option
            );
        }

        triggerSelect.value =
            String(selectedTrigger);

        triggerSelect.addEventListener(
            'change',
            () => {
                selectedTrigger =
                    Number(
                        triggerSelect.value
                    );

                updateTriggerDescription();
            }
        );

        container.appendChild(
            triggerSelect
        );

        triggerDescription =
            document.createElement('div');

        Object.assign(
            triggerDescription.style,
            {
                fontSize: '10px',
                color: '#e8bfd5',
                marginTop: '6px',
                lineHeight: '1.35'
            }
        );

        container.appendChild(
            triggerDescription
        );

        container.appendChild(
            createButton(
                'Send trigger',
                () => {
                    const target =
                        normalizeMemberNumber(
                            targetSelect?.value
                        );

                    if (!target) {
                        setStatus(
                            'Select someone first.'
                        );

                        return;
                    }

                    sendTrigger(
                        target,
                        selectedTrigger
                    );
                }
            )
        );

        container.appendChild(
            createButton(
                'Local test',
                () => {
                    playTrigger(
                        selectedTrigger
                    );
                }
            )
        );

        container.appendChild(
            createCheckbox(
                'Accept incoming triggers',
                settings.acceptIncoming,
                checked => {
                    settings.acceptIncoming =
                        checked;

                    saveSettings();
                }
            )
        );
    }

    function updateTriggerDescription() {
        if (!triggerDescription) {
            return;
        }

        const trigger =
            TRIGGERS[selectedTrigger];

        triggerDescription.textContent =
            trigger
                ? trigger.description
                : '';
    }

    // =========================================================
    // SAFETY TAB
    // =========================================================

    function buildSafetyTab(container) {
        container.innerHTML = '';

        container.appendChild(
            createCheckbox(
                'Enable auto wake',
                settings.autoWakeEnabled,
                checked => {
                    settings.autoWakeEnabled =
                        checked;

                    saveSettings();
                    scheduleRemainingWake();
                }
            )
        );

        container.appendChild(
            createLabel(
                'Auto wake after minutes'
            )
        );

        const wakeInput =
            createNumberInput(
                settings.autoWakeMinutes,
                0,
                60,
                1,
                value => {
                    settings.autoWakeMinutes =
                        value;

                    saveSettings();
                    scheduleRemainingWake();
                }
            );

        container.appendChild(
            wakeInput
        );

        container.appendChild(
            createLabel(
                'Enabled incoming triggers'
            )
        );

        for (
            let index = 0;
            index < TRIGGERS.length;
            index += 1
        ) {
            const trigger =
                TRIGGERS[index];

            const enabled =
                settings.enabledTriggers?.[
                    trigger.name
                ] !== false;

            container.appendChild(
                createCheckbox(
                    trigger.name,
                    enabled,
                    checked => {
                        if (
                            !settings.enabledTriggers
                        ) {
                            settings.enabledTriggers =
                                {};
                        }

                        settings.enabledTriggers[
                            trigger.name
                        ] = checked;

                        saveSettings();
                    }
                )
            );
        }

        container.appendChild(
            createButton(
                'Stop all active audio',
                () => {
                    stopAllAudio();
                    setStatus(
                        'All Bambi audio stopped.'
                    );
                }
            )
        );
    }

    // =========================================================
    // LIMITS TAB
    // =========================================================

    function buildLimitsTab(container) {
        container.innerHTML = '';

        container.appendChild(
            createLabel(
                'Maximum simultaneous audio layers'
            )
        );

        container.appendChild(
            createNumberInput(
                settings.maxSimultaneous,
                1,
                20,
                1,
                value => {
                    settings.maxSimultaneous =
                        value;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createLabel(
                'Secondary layer volume'
            )
        );

        const secondaryVolume =
            createRangeInput(
                settings.secondaryVolume,
                0,
                1,
                0.01,
                value => {
                    settings.secondaryVolume =
                        value;

                    saveSettings();
                }
            );

        container.appendChild(
            secondaryVolume
        );

        container.appendChild(
            createLabel(
                'Fade in (ms)'
            )
        );

        container.appendChild(
            createNumberInput(
                settings.fadeInMs,
                0,
                5000,
                10,
                value => {
                    settings.fadeInMs =
                        value;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createLabel(
                'Fade out (ms)'
            )
        );

        container.appendChild(
            createNumberInput(
                settings.fadeOutMs,
                0,
                5000,
                10,
                value => {
                    settings.fadeOutMs =
                        value;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createCheckbox(
                'Alternate secondary ears',
                settings.alternateEars,
                checked => {
                    settings.alternateEars =
                        checked;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createLabel(
                'Trigger cooldown (ms)'
            )
        );

        container.appendChild(
            createNumberInput(
                settings.cooldownMs,
                0,
                60000,
                50,
                value => {
                    settings.cooldownMs =
                        value;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createLabel(
                'Maximum triggers per minute'
            )
        );

        container.appendChild(
            createNumberInput(
                settings.maxTriggersPerMinute,
                0,
                300,
                1,
                value => {
                    settings.maxTriggersPerMinute =
                        value;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createLabel(
                'Bambi labels'
            )
        );

        container.appendChild(
            createCheckbox(
                'Show Bambi labels',
                settings.showBambiLabels,
                checked => {
                    settings.showBambiLabels =
                        checked;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createLabel(
                'Label opacity'
            )
        );

        container.appendChild(
            createRangeInput(
                settings.labelOpacity,
                0,
                1,
                0.01,
                value => {
                    settings.labelOpacity =
                        value;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createLabel(
                'Label text'
            )
        );

        const labelTextInput =
            document.createElement('input');

        labelTextInput.type = 'text';
        labelTextInput.value =
            settings.labelText;

        Object.assign(
            labelTextInput.style,
            {
                width: '100%',
                boxSizing: 'border-box',
                padding: '5px',
                background: '#5b2447',
                color: '#fff',
                border: '1px solid #ff8fc7',
                borderRadius: '5px',
                fontSize: '11px'
            }
        );

        labelTextInput.addEventListener(
            'change',
            () => {
                settings.labelText =
                    labelTextInput.value;

                saveSettings();
            }
        );

        container.appendChild(
            labelTextInput
        );

        container.appendChild(
            createLabel(
                'Horizontal offset'
            )
        );

        container.appendChild(
            createNumberInput(
                settings.labelXOffset,
                -1000,
                1000,
                1,
                value => {
                    settings.labelXOffset =
                        value;

                    saveSettings();
                }
            )
        );

        container.appendChild(
            createLabel(
                'Vertical offset'
            )
        );

        container.appendChild(
            createNumberInput(
                settings.labelYOffset,
                -1000,
                1000,
                1,
                value => {
                    settings.labelYOffset =
                        value;

                    saveSettings();
                }
            )
        );
    }

    // =========================================================
    // UI REFRESH
    // =========================================================

    function refreshConnectSelect() {
        if (!connectSelect) return;

        const current =
            connectSelect.value;

        connectSelect.innerHTML = '';

        const emptyOption =
            document.createElement('option');

        emptyOption.value = '';
        emptyOption.textContent =
            'Select someone...';

        connectSelect.appendChild(
            emptyOption
        );

        const currentMembers =
            getRoomCharacters()
                .map(character => ({
                    memberNumber:
                        normalizeMemberNumber(
                            character?.MemberNumber
                        ),
                    name:
                        character?.Nickname ||
                        character?.Name ||
                        'Unknown'
                }))
                .filter(
                    entry =>
                        entry.memberNumber &&
                        entry.memberNumber !==
                            normalizeMemberNumber(
                                Player?.MemberNumber
                            ) &&
                        !connectedUsers.has(
                            entry.memberNumber
                        )
                );

        for (const entry of currentMembers) {
            const option =
                document.createElement('option');

            option.value =
                String(
                    entry.memberNumber
                );

            option.textContent =
                `${entry.name} (${entry.memberNumber})`;

            connectSelect.appendChild(
                option
            );
        }

        if (
            [...connectSelect.options].some(
                option =>
                    option.value === current
            )
        ) {
            connectSelect.value =
                current;
        }
    }

    function refreshTargetSelect() {
        if (!targetSelect) return;

        const current =
            targetSelect.value ||
            selectedTarget;

        targetSelect.innerHTML = '';

        const emptyOption =
            document.createElement('option');

        emptyOption.value = '';
        emptyOption.textContent =
            'Select connected user...';

        targetSelect.appendChild(
            emptyOption
        );

        for (
            const [
                memberNumber,
                user
            ] of connectedUsers
        ) {
            if (
                !isInCurrentRoom(
                    memberNumber
                )
            ) {
                continue;
            }

            const option =
                document.createElement('option');

            option.value =
                String(memberNumber);

            option.textContent =
                `${user.name || getCharacterName(memberNumber)} (${memberNumber})`;

            targetSelect.appendChild(
                option
            );
        }

        if (
            [...targetSelect.options].some(
                option =>
                    option.value === current
            )
        ) {
            targetSelect.value =
                current;
        } else {
            selectedTarget = '';
        }
    }

    function refreshPendingArea() {
        if (!pendingArea) return;

        pendingArea.innerHTML = '';

        if (!pendingRequests.size) {
            return;
        }

        pendingArea.appendChild(
            createLabel(
                'Pending requests'
            )
        );

        for (
            const [
                memberNumber,
                request
            ] of pendingRequests
        ) {
            const row =
                document.createElement('div');

            Object.assign(
                row.style,
                {
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                    marginTop: '4px'
                }
            );

            const text =
                document.createElement('span');

            text.textContent =
                `${request.name} (${memberNumber})`;

            text.style.flex = '1';
            text.style.fontSize = '10px';

            const accept =
                document.createElement('button');

            accept.textContent =
                'Accept';

            Object.assign(
                accept.style,
                {
                    background: '#ff4fa3',
                    color: '#fff',
                    border: '1px solid #ff8fc7',
                    borderRadius: '4px',
                    padding: '4px',
                    cursor: 'pointer',
                    fontSize: '10px'
                }
            );

            accept.addEventListener(
                'click',
                () => {
                    acceptConnection(
                        memberNumber
                    );
                }
            );

            row.appendChild(text);
            row.appendChild(accept);

            pendingArea.appendChild(row);
        }
    }

    function refreshConnectionList() {
        if (!panel) return;

        const list =
            panel.querySelector(
                '[data-bambi="connection-list"]'
            );

        if (!list) return;

        list.innerHTML = '';

        if (!connectedUsers.size) {
            const empty =
                document.createElement('div');

            empty.textContent =
                'No connected users.';

            empty.style.fontSize =
                '10px';

            empty.style.color =
                '#d8b3c8';

            list.appendChild(empty);

            return;
        }

        for (
            const [
                memberNumber,
                user
            ] of connectedUsers
        ) {
            const row =
                document.createElement('div');

            row.textContent =
                `${user.name || getCharacterName(memberNumber)} (${memberNumber})`;

            Object.assign(
                row.style,
                {
                    fontSize: '10px',
                    padding: '3px 0',
                    color:
                        isInCurrentRoom(
                            memberNumber
                        )
                            ? '#fff'
                            : '#a98a9b'
                }
            );

            list.appendChild(row);
        }
    }

    function refreshAllUI() {
        refreshConnectSelect();
        refreshTargetSelect();
        refreshPendingArea();
        refreshConnectionList();
        updateTriggerDescription();

        if (versionText) {
            versionText.textContent =
                `v${BAMBI_VERSION}`;
        }

        if (statusText && !statusText.textContent) {
            statusText.textContent =
                `Bambi Obeys v${BAMBI_VERSION}`;
        }
    }

    // =========================================================
    // DRAGGING
    // =========================================================

    function makeDraggable(
        element,
        handle
    ) {
        let dragging = false;
        let moved = false;
        let offsetX = 0;
        let offsetY = 0;
        let startX = 0;
        let startY = 0;

        handle.addEventListener(
            'mousedown',
            event => {
                if (event.button !== 0) {
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

                moved = false;
                dragging = true;

                handle.style.cursor =
                    'grabbing';

                document.body.style.userSelect =
                    'none';

                event.preventDefault();
            }
        );

        document.addEventListener(
            'mousemove',
            event => {
                if (!dragging) return;

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
                    moved = true;
                }

                let left =
                    event.clientX -
                    offsetX;

                let top =
                    event.clientY -
                    offsetY;

                const maxLeft =
                    Math.max(
                        0,
                        window.innerWidth -
                            element.offsetWidth
                    );

                const maxTop =
                    Math.max(
                        0,
                        window.innerHeight -
                            element.offsetHeight
                    );

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
                    'auto';

                element.style.bottom =
                    'auto';
            }
        );

        document.addEventListener(
            'mouseup',
            () => {
                if (!dragging) return;

                dragging = false;

                handle.style.cursor =
                    'grab';

                document.body.style.userSelect =
                    '';

                handle.__bambiMoved =
                    moved;
            }
        );
    }

    // =========================================================
    // UI
    // =========================================================

    function createUI() {
        if (container) return;

        container =
            document.createElement('div');

        Object.assign(
            container.style,
            {
                position: 'fixed',
                left: '20px',
                top: '100px',
                zIndex: '999999',
                fontFamily:
                    'Arial, sans-serif'
            }
        );

        floatingButton =
            document.createElement('button');

        floatingButton.textContent =
            'B';

        floatingButton.title =
            `${PRODUCT_NAME} v${BAMBI_VERSION}`;

        Object.assign(
            floatingButton.style,
            {
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border:
                    '2px solid #ff8fc7',
                background:
                    '#ff4fa3',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'grab',
                boxShadow:
                    '0 4px 12px rgba(255, 50, 150, 0.4)'
            }
        );

        panel =
            document.createElement('div');

        Object.assign(
            panel.style,
            {
                display: 'none',
                width: '305px',
                marginTop: '8px',
                background: '#3a1730',
                color: '#fff',
                padding: '12px',
                borderRadius: '10px',
                boxShadow:
                    '0 4px 18px rgba(0,0,0,0.45)',
                border:
                    '1px solid #ff69b4',
                boxSizing: 'border-box'
            }
        );

        const header =
            document.createElement('div');

        Object.assign(
            header.style,
            {
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                    'space-between',
                marginBottom: '10px'
            }
        );

        const titleWrap =
            document.createElement('div');

        Object.assign(
            titleWrap.style,
            {
                display: 'flex',
                alignItems:
                    'baseline',
                gap: '7px'
            }
        );

        const title =
            document.createElement('span');

        title.textContent =
            PRODUCT_NAME;

        Object.assign(
            title.style,
            {
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#ff9bce'
            }
        );

        // Version is visible in the Club UI
        // whenever the B button is opened.
        versionText =
            document.createElement('span');

        versionText.textContent =
            `v${BAMBI_VERSION}`;

        Object.assign(
            versionText.style,
            {
                fontSize: '11px',
                color: '#d994ba'
            }
        );

        titleWrap.appendChild(title);
        titleWrap.appendChild(
            versionText
        );

        const close =
            document.createElement('button');

        close.textContent = '×';

        Object.assign(
            close.style,
            {
                background:
                    'transparent',
                border: 'none',
                color: '#ff9bce',
                fontSize: '22px',
                cursor: 'pointer'
            }
        );

        close.addEventListener(
            'click',
            () => {
                panelOpen = false;
                panel.style.display =
                    'none';
            }
        );

        header.appendChild(
            titleWrap
        );

        header.appendChild(
            close
        );

        panel.appendChild(
            header
        );

        statusText =
            document.createElement('div');

        Object.assign(
            statusText.style,
            {
                fontSize: '11px',
                color: '#ff9bce',
                marginBottom: '8px'
            }
        );

        panel.appendChild(
            statusText
        );

        const tabBar =
            document.createElement('div');

        Object.assign(
            tabBar.style,
            {
                display: 'grid',
                gridTemplateColumns:
                    'repeat(4, 1fr)',
                gap: '4px',
                marginBottom: '8px'
            }
        );

        tabs = {};
        tabContents = {};

        for (
            const name of [
                'Authority',
                'Triggers',
                'Safety',
                'Limits'
            ]
        ) {
            const tabButton =
                document.createElement('button');

            tabButton.textContent =
                name;

            Object.assign(
                tabButton.style,
                {
                    padding: '6px 3px',
                    cursor: 'pointer',
                    color: '#fff',
                    border:
                        '1px solid #ff8fc7',
                    borderRadius: '5px',
                    background:
                        name === activeTab
                            ? '#ff4fa3'
                            : '#5b2447',
                    fontSize: '11px'
                }
            );

            tabButton.addEventListener(
                'click',
                () => switchTab(name)
            );

            tabs[name] =
                tabButton;

            tabBar.appendChild(
                tabButton
            );
        }

        panel.appendChild(
            tabBar
        );

        for (
            const name of [
                'Authority',
                'Triggers',
                'Safety',
                'Limits'
            ]
        ) {
            const content =
                createContentArea();

            content.style.display =
                name === activeTab
                    ? 'block'
                    : 'none';

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
            'click',
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
                        ? 'block'
                        : 'none';
            }
        );

        switchTab(activeTab);
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
                    .filter(Boolean)
            );

        for (
            const memberNumber of
                bambiPresence.keys()
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
            const [
                memberNumber,
                user
            ] of connectedUsers
        ) {
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

        for (
            const [
                memberNumber,
                user
            ] of pendingRequests
        ) {
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
    // INIT
    // =========================================================

    loadStorage();
    installAudioUnlock();

    let initAttempts = 0;

    const initInterval =
        setInterval(
            () => {
                initAttempts += 1;

                if (
                    typeof Player ===
                        'undefined' ||
                    typeof ChatRoomData ===
                        'undefined'
                ) {
                    if (
                        initAttempts >
                        1200
                    ) {
                        clearInterval(
                            initInterval
                        );
                    }

                    return;
                }

                if (!registerBambiMod()) {
                    if (
                        initAttempts >
                        1200
                    ) {
                        clearInterval(
                            initInterval
                        );
                    }

                    return;
                }

                installBambiMessageHook();
                installChatRoomSyncHook();
                installBambiLabelHook();

                if (
                    !bambiMessageHookInstalled ||
                    !bambiDrawHookInstalled ||
                    !window.__BAMBI_OBEYS_SYNC_HOOK_INSTALLED__
                ) {
                    if (
                        initAttempts >
                        1200
                    ) {
                        clearInterval(
                            initInterval
                        );
                    }

                    return;
                }

                clearInterval(
                    initInterval
                );

                createUI();
                scheduleRemainingWake();

                // Handles the "Update complete!" message
                // after a refresh into a newly downloaded build.
                checkVersionUpdate();

                // Check for a newer hosted build while the
                // current build is still running. This means
                // the user gets the refresh instruction BEFORE
                // loading the new version.
                setTimeout(
                    () => {
                        checkForNewVersion();
                    },
                    1500
                );

                // Keep checking periodically while the Club
                // page remains open.
                setInterval(
                    () => {
                        checkForNewVersion();
                    },
                    5 * 60 * 1000
                );

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
                            now() - 15000;

                        for (
                            const [
                                memberNumber,
                                presence
                            ] of bambiPresence
                        ) {
                            if (
                                Number(
                                    presence.lastSeen
                                ) < cutoff
                            ) {
                                bambiPresence.delete(
                                    memberNumber
                                );
                            }
                        }
                    },
                    5000
                );

                announcePresence();

                console.log(
                    `${PRODUCT_NAME} v${BAMBI_VERSION} loaded.`
                );
            },
            100
        );
})();
