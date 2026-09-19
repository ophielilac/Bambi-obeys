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

    // Targeted Bambi control traffic uses the same AccountBeep/Leash
    // pattern used by LSCG for cross-server commands.
    const CROSS_SERVER_BEEP_TYPE =
        'Leash';

    const BAMBI_BEEP_MARKER =
        true;

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

    function getFriendNumbers() {
        const result = new Set();
        const possibleLists = [
            Player?.FriendList,
            Player?.Friends,
            Player?.FriendNumbers
        ];

        for (const list of possibleLists) {
            if (!Array.isArray(list)) continue;

            for (const entry of list) {
                const n = normalizeMemberNumber(
                    typeof entry === 'object'
                        ? entry?.MemberNumber ?? entry?.memberNumber
                        : entry
                );

                if (n) result.add(n);
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

        for (const value of candidates) {
            const n = normalizeMemberNumber(value);
            if (n) return n;
        }

        return 0;
    }

    function getWhitelist() {
        return new Set(
            String(settings.whitelist || '')
                .split(',')
                .map(item => Number(item.trim()))
                .filter(Number.isFinite)
                .filter(Boolean)
        );
    }

    function setStatus(text) {
        if (statusText) statusText.textContent = text || '';
    }

    // =========================================================
    // STORAGE
    // =========================================================

    function mergeSettings(saved) {
        if (!saved || typeof saved !== 'object') return;

        for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
            if (!Object.prototype.hasOwnProperty.call(saved, key)) continue;

            if (
                key === 'enabledTriggers' &&
                defaultValue &&
                typeof defaultValue === 'object' &&
                !Array.isArray(defaultValue)
            ) {
                settings.enabledTriggers = Object.assign(
                    {},
                    defaultValue,
                    saved.enabledTriggers || {}
                );
            } else {
                settings[key] = saved[key];
            }
        }
    }

    function loadStorage() {
        let savedSettings = null;

        try {
            savedSettings = JSON.parse(
                localStorage.getItem(SETTINGS_KEY)
            );
            mergeSettings(savedSettings);
        } catch (error) {
            console.error('Bambi Obeys: settings load failed', error);
        }

        for (const trigger of TRIGGERS) {
            if (
                !Object.prototype.hasOwnProperty.call(
                    settings.enabledTriggers,
                    trigger.name
                )
            ) {
                settings.enabledTriggers[trigger.name] = true;
            }
        }

        try {
            const saved = JSON.parse(
                localStorage.getItem(CONNECTIONS_KEY)
            );

            if (Array.isArray(saved)) {
                connectedUsers.clear();

                for (const entry of saved) {
                    const memberNumber = normalizeMemberNumber(entry?.memberNumber);
                    if (!memberNumber) continue;

                    connectedUsers.set(memberNumber, {
                        memberNumber,
                        name: entry.name || 'Unknown'
                    });
                }
            }
        } catch (error) {
            console.error('Bambi Obeys: connections load failed', error);
        }

        try {
            const saved = JSON.parse(
                localStorage.getItem(PENDING_KEY)
            );

            if (Array.isArray(saved)) {
                pendingRequests.clear();

                for (const entry of saved) {
                    const memberNumber = normalizeMemberNumber(entry?.memberNumber);
                    if (!memberNumber) continue;

                    pendingRequests.set(memberNumber, {
                        memberNumber,
                        name: entry.name || 'Unknown'
                    });
                }
            }
        } catch (error) {
            console.error('Bambi Obeys: pending load failed', error);
        }

        try {
            const saved = JSON.parse(
                localStorage.getItem(SLEEP_KEY)
            );

            if (saved?.active && Number(saved.startedAt) > 0) {
                sleepState.active = true;
                sleepState.startedAt = Number(saved.startedAt);
            }
        } catch (error) {
            console.error('Bambi Obeys: sleep state load failed', error);
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
            console.error('Bambi Obeys: settings save failed', error);
        }
    }

    function saveConnections() {
        try {
            localStorage.setItem(
                CONNECTIONS_KEY,
                JSON.stringify([...connectedUsers.values()])
            );
        } catch (error) {
            console.error('Bambi Obeys: connections save failed', error);
        }
    }

    function savePendingRequests() {
        try {
            localStorage.setItem(
                PENDING_KEY,
                JSON.stringify([...pendingRequests.values()])
            );
        } catch (error) {
            console.error('Bambi Obeys: pending save failed', error);
        }
    }

    function saveSleepState() {
        try {
            localStorage.setItem(
                SLEEP_KEY,
                JSON.stringify(sleepState)
            );
        } catch (error) {
            console.error('Bambi Obeys: sleep state save failed', error);
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
            console.error(`Bambi Obeys: failed to read ${key}`, error);
            return null;
        }
    }

    function setStoredValue(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Bambi Obeys: failed to save ${key}`, error);
            return false;
        }
    }

    function removeStoredValue(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Bambi Obeys: failed to remove ${key}`, error);
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
            console.error('Bambi Obeys: local chat message failed', error);
            return false;
        }
    }

    function checkVersionUpdate() {
        const previousVersion = getStoredValue(UPDATE_STORAGE_KEY);
        const pendingVersion = getStoredValue(PENDING_UPDATE_KEY);

        // First install: simply remember the currently running version.
        if (!previousVersion) {
            setStoredValue(UPDATE_STORAGE_KEY, BAMBI_VERSION);
            return;
        }

        // The new code is now running. If this version was previously
        // announced as an available update, tell the user the update
        // completed instead of asking them to refresh again.
        if (
            compareVersions(BAMBI_VERSION, previousVersion) > 0 &&
            pendingVersion &&
            compareVersions(BAMBI_VERSION, pendingVersion) >= 0
        ) {
            sendLocalMessage('Update complete! Good girl~');
            removeStoredValue(PENDING_UPDATE_KEY);
            removeStoredValue(UPDATE_NOTIFIED_KEY);
        }

        setStoredValue(UPDATE_STORAGE_KEY, BAMBI_VERSION);
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

            if (compareVersions(latestVersion, BAMBI_VERSION) <= 0) {
                return;
            }

            const notifiedVersion = getStoredValue(UPDATE_NOTIFIED_KEY);

            if (notifiedVersion === latestVersion) return;

            sendLocalMessage(
                "bzzzt Bambi! There's an update! refresh like a good girl~"
            );

            setStoredValue(UPDATE_NOTIFIED_KEY, latestVersion);
            setStoredValue(PENDING_UPDATE_KEY, latestVersion);
        } catch (error) {
            console.debug('Bambi Obeys: version check failed', error);
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
                fullName: PRODUCT_NAME,
                version: BAMBI_VERSION,
                repository: 'https://github.com/ophielilac/Bambi-obeys'
            });

            return true;
        } catch (error) {
            console.error('Bambi Obeys: ModSDK registration failed', error);
            return false;
        }
    }

    // =========================================================
    // AUDIO
    // =========================================================

    function ensureAudioContext() {
        if (audioContext) return audioContext;

        const AudioContextCtor =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextCtor) return null;

        try {
            audioContext = new AudioContextCtor();
            return audioContext;
        } catch (error) {
            console.error('Bambi Obeys: audio context creation failed', error);
            return null;
        }
    }

    function unlockAudio() {
        const context = ensureAudioContext();
        if (!context) return;

        try {
            if (context.state === 'suspended') {
                context.resume().catch(() => {});
            }
        } catch {}
    }

    function installAudioUnlock() {
        const handler = () => unlockAudio();
        document.addEventListener('pointerdown', handler, { passive: true });
        document.addEventListener('keydown', handler, { passive: true });
    }

    async function getAudioBuffer(index) {
        if (audioBuffers.has(index)) {
            return audioBuffers.get(index);
        }

        if (loadingBuffers.has(index)) {
            return loadingBuffers.get(index);
        }

        const url = getTriggerURL(index);
        if (!url) throw new Error('Invalid trigger index');

        const promise = (async () => {
            const response = await fetch(url, { cache: 'force-cache' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.arrayBuffer();
            const context = ensureAudioContext();
            if (!context) throw new Error('Web Audio API unavailable');

            const buffer = await context.decodeAudioData(data.slice(0));
            audioBuffers.set(index, buffer);
            return buffer;
        })();

        loadingBuffers.set(index, promise);

        try {
            return await promise;
        } finally {
            loadingBuffers.delete(index);
        }
    }

    function stopLayer(layer) {
        if (!layer) return;

        try {
            const context = ensureAudioContext();
            if (context) {
                const fade = Math.max(
                    0.01,
                    Number(settings.fadeOutMs) / 1000
                );
                const t = context.currentTime;
                layer.gain.gain.cancelScheduledValues(t);
                layer.gain.gain.setValueAtTime(
                    Math.max(0, Number(layer.gain.gain.value) || 0),
                    t
                );
                layer.gain.gain.linearRampToValueAtTime(0, t + fade);
                layer.source.stop(t + fade + 0.02);
                return;
            }
        } catch {}

        try {
            layer.source.stop();
        } catch {}
    }

    function trimActiveLayersIfNeeded() {
        const limit = Math.max(1, Number(settings.maxSimultaneous) || 1);

        while (activeLayers.size >= limit) {
            const oldest = activeLayers.values().next().value;
            if (!oldest) break;
            stopLayer(oldest);
            activeLayers.delete(oldest);

            if (mainAudioLayer === oldest) {
                mainAudioLayer = null;
            }
        }
    }

    async function playLayer(index) {
        const context = ensureAudioContext();
        if (!context) return false;

        try {
            if (context.state === 'suspended') {
                await context.resume();
            }
        } catch {}

        trimActiveLayersIfNeeded();

        let buffer;
        try {
            buffer = await getAudioBuffer(index);
        } catch (error) {
            console.error(
                'Bambi Obeys: failed to load trigger',
                TRIGGERS[index]?.name,
                error
            );
            return false;
        }

        const source = context.createBufferSource();
        source.buffer = buffer;

        const gain = context.createGain();
        const panner = context.createStereoPanner();

        const isMain = !mainAudioLayer;

        let pan = 0;
        let initialGain = 1;

        if (!isMain) {
            if (settings.alternateEars) {
                lastSecondaryPan = lastSecondaryPan === 1 ? -1 : 1;
                pan = lastSecondaryPan;
            } else {
                pan = 0;
            }

            initialGain = Math.max(
                0,
                Math.min(1, Number(settings.secondaryVolume))
            );
        }

        panner.pan.value = pan;
        source.connect(gain);
        gain.connect(panner);
        panner.connect(context.destination);

        const fadeIn = Math.max(0, Number(settings.fadeInMs) / 1000);
        const fadeOut = Math.max(0, Number(settings.fadeOutMs) / 1000);
        const startTime = context.currentTime;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(
            initialGain,
            startTime + Math.max(0.01, fadeIn)
        );

        const layer = {
            source,
            gain,
            panner,
            index,
            isMain
        };

        activeLayers.add(layer);

        if (isMain) {
            mainAudioLayer = layer;
        }

        source.onended = () => {
            activeLayers.delete(layer);

            if (mainAudioLayer === layer) {
                mainAudioLayer = null;
            }

            try {
                gain.disconnect();
                panner.disconnect();
                source.disconnect();
            } catch {}
        };

        source.start();

        if (fadeOut > 0 && buffer.duration > fadeOut) {
            const stopAt =
                startTime +
                Math.max(0, buffer.duration - fadeOut);

            gain.gain.setValueAtTime(initialGain, stopAt);
            gain.gain.linearRampToValueAtTime(0, stopAt + fadeOut);
        }

        console.log(
            `Bambi Obeys: ${isMain ? 'main' : 'secondary'} trigger`,
            TRIGGERS[index].name,
            isMain ? '' : pan > 0 ? '(right)' : pan < 0 ? '(left)' : '(center)'
        );

        return true;
    }

    function triggerAllowedLocally(index) {
        const trigger = TRIGGERS[index];
        if (!trigger) return false;

        if (
            settings.enabledTriggers &&
            settings.enabledTriggers[trigger.name] === false
        ) {
            return false;
        }

        const cooldown = Math.max(0, Number(settings.cooldownMs) || 0);
        if (cooldown > 0 && now() - lastTriggerTime < cooldown) {
            return false;
        }

        const minute = 60 * 1000;
        triggerHistory = triggerHistory.filter(
            timestamp => now() - timestamp < minute
        );

        const limit = Math.max(
            1,
            Number(settings.maxTriggersPerMinute) || 1
        );

        return triggerHistory.length < limit;
    }

    async function playTrigger(index, options = {}) {
        const trigger = TRIGGERS[index];
        if (!trigger) return false;

        if (
            !options.ignoreLocalSafety &&
            !triggerAllowedLocally(index)
        ) {
            console.log(
                'Bambi Obeys: trigger blocked by local limits/safety:',
                trigger.name
            );
            return false;
        }

        lastTriggerTime = now();
        triggerHistory.push(lastTriggerTime);

        if (options.trackSleep !== false) {
            const sleepIndex = triggerIndexByName('Bambi sleep');
            const wakeIndex = triggerIndexByName('Bambi wake and obey');

            if (index === sleepIndex) {
                startAutoWakeTimer();
            } else if (index === wakeIndex) {
                cancelAutoWakeTimer();
            }
        }

        return playLayer(index);
    }

    function stopAllLayers() {
        const layers = [...activeLayers];
        for (const layer of layers) {
            stopLayer(layer);
        }

        activeLayers.clear();
        mainAudioLayer = null;
        setStatus('Stopped all Bambi audio.');
    }

    // =========================================================
    // AUTO WAKE
    // =========================================================

    function startAutoWakeTimer() {
        cancelAutoWakeTimer(false);

        sleepState.active = true;
        sleepState.startedAt = now();
        saveSleepState();
        scheduleRemainingWake();
    }

    function cancelAutoWakeTimer(save = true) {
        if (sleepTimer) {
            clearTimeout(sleepTimer);
            sleepTimer = null;
        }

        sleepState.active = false;
        sleepState.startedAt = 0;

        if (save) saveSleepState();
    }

    function scheduleRemainingWake() {
        if (sleepTimer) {
            clearTimeout(sleepTimer);
            sleepTimer = null;
        }

        if (
            !sleepState.active ||
            !settings.autoWakeEnabled ||
            Number(settings.autoWakeMinutes) <= 0
        ) {
            return;
        }

        const total = Math.max(
            0,
            Number(settings.autoWakeMinutes)
        ) * 60 * 1000;

        const elapsed = now() - sleepState.startedAt;
        const remaining = Math.max(0, total - elapsed);

        if (remaining <= 0) {
            performAutoWake();
            return;
        }

        sleepTimer = setTimeout(performAutoWake, remaining);
    }

    function performAutoWake() {
        if (!sleepState.active) return;

        const wakeIndex = triggerIndexByName('Bambi wake and obey');

        sleepState.active = false;
        sleepState.startedAt = 0;
        saveSleepState();

        if (sleepTimer) {
            clearTimeout(sleepTimer);
            sleepTimer = null;
        }

        if (wakeIndex >= 0) {
            playTrigger(wakeIndex, {
                ignoreLocalSafety: false,
                trackSleep: false
            });
        }
    }

    // =========================================================
    // AUTHORITY
    // =========================================================

    function canTrigger(senderMemberNumber) {
        const sender = normalizeMemberNumber(senderMemberNumber);
        if (!sender) return false;

        const whitelist = getWhitelist();
        if (whitelist.has(sender)) return true;

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
        if (typeof ServerSend !== 'function') return false;

        try {
            ServerSend('ChatRoomChat', {
                Content: content,
                Type: 'Whisper',
                Target: normalizeMemberNumber(memberNumber)
            });
            return true;
        } catch (error) {
            console.error('Bambi Obeys: whisper failed', error);
            return false;
        }
    }

    function sendBambiAccountMessage(targetMemberNumber, payload) {
        if (typeof ServerSend !== 'function') return false;

        const target = normalizeMemberNumber(targetMemberNumber);
        if (!target) return false;

        try {
            ServerSend('AccountBeep', {
                MemberNumber: target,
                BeepType: CROSS_SERVER_BEEP_TYPE,
                IsSecret: true,
                Message: {
                    ...payload,
                    IsBambiObeys: BAMBI_BEEP_MARKER
                }
            });
            return true;
        } catch (error) {
            console.error('Bambi Obeys: cross-server send failed', error);
            return false;
        }
    }

    function sendBambiRoomMessage(targetMemberNumber, payload) {
        if (typeof ServerSend !== 'function') return false;

        try {
            const packet = {
                Type: 'Hidden',
                Content: PROTOCOL,
                Sender: Player?.MemberNumber,
                Dictionary: [
                    {
                        message: payload
                    }
                ]
            };

            const target = normalizeMemberNumber(targetMemberNumber);
            if (target) packet.Target = target;

            ServerSend('ChatRoomChat', packet);
            return true;
        } catch (error) {
            console.error('Bambi Obeys: room hidden send failed', error);
            return false;
        }
    }

    function sendBambiMessage(targetMemberNumber, payload) {
        const target = normalizeMemberNumber(targetMemberNumber);

        // Targeted control traffic goes through AccountBeep so it can cross
        // America, Europe A, Europe B, and Asia server boundaries.
        if (target) {
            return sendBambiAccountMessage(target, payload);
        }

        // Broadcast/presence packets remain room-local because AccountBeep
        // is inherently targeted to one account.
        return sendBambiRoomMessage(null, payload);
    }

    function announcePresence() {
        const myNumber = normalizeMemberNumber(Player?.MemberNumber);
        if (!myNumber) return;

        sendBambiRoomMessage(null, {
            type: 'presence',
            memberNumber: myNumber,
            name: Player?.Name || 'Bambi',
            labelXOffset: Number(settings.labelXOffset),
            labelYOffset: Number(settings.labelYOffset)
        });
    }

    function requestConnection(memberNumber) {
        const target = normalizeMemberNumber(memberNumber);
        const myNumber = normalizeMemberNumber(Player?.MemberNumber);

        if (!target || target === myNumber) {
            setStatus('You cannot connect to yourself.');
            return;
        }

        if (connectedUsers.has(target)) {
            setStatus(`${getCharacterName(target)} is already connected.`);
            return;
        }

        const sent = sendBambiAccountMessage(target, {
            type: 'connection_request',
            targetMemberNumber: target,
            senderName: Player?.Name || 'Bambi'
        });

        // Keep the old room whisper as a compatibility fallback for old
        // Bambi versions that do not yet understand cross-server beeps.
        if (sent) {
            setStatus(`Connect request sent to ${getCharacterName(target)}`);
        } else if (isInCurrentRoom(target) && sendWhisper(target, CONNECT_COMMAND)) {
            setStatus(`Connect request sent to ${getCharacterName(target)}`);
        } else {
            setStatus('Could not send the connection request.');
        }
    }

    function acceptConnection(memberNumber) {
        const target = normalizeMemberNumber(memberNumber);
        const myNumber = normalizeMemberNumber(Player?.MemberNumber);

        if (!target || target === myNumber) return;

        const name =
            pendingRequests.get(target)?.name ||
            getCharacterName(target);

        pendingRequests.delete(target);
        connectedUsers.set(target, {
            memberNumber: target,
            name
        });

        savePendingRequests();
        saveConnections();

        sendBambiMessage(target, {
            type: 'connection_accepted',
            targetMemberNumber: target,
            senderName: Player?.Name || name || 'Bambi'
        });

        setStatus(`Connected to ${name}.`);
        refreshAllUI();
    }

    function disconnectUser(memberNumber) {
        const target = normalizeMemberNumber(memberNumber);
        const myNumber = normalizeMemberNumber(Player?.MemberNumber);

        if (!target || target === myNumber) return;

        connectedUsers.delete(target);
        saveConnections();

        sendBambiMessage(target, {
            type: 'connection_removed',
            targetMemberNumber: target
        });

        setStatus(`Disconnected from ${getCharacterName(target)}.`);
        refreshAllUI();
    }

    function sendTriggerToUser(memberNumber, triggerIndex) {
        const target = normalizeMemberNumber(memberNumber);
        const myNumber = normalizeMemberNumber(Player?.MemberNumber);

        if (!target) {
            setStatus('Choose a target first.');
            return;
        }

        if (target === myNumber) {
            setStatus('You cannot send a remote trigger to yourself.');
            return;
        }

        if (!connectedUsers.has(target)) {
            setStatus('Target is not connected.');
            return;
        }

        if (!TRIGGERS[triggerIndex]) return;

        if (
            sendBambiAccountMessage(target, {
                type: 'trigger',
                targetMemberNumber: target,
                triggerIndex
            })
        ) {
            setStatus(
                `Sent "${TRIGGERS[triggerIndex].name}" to ${getCharacterName(target)}`
            );
        } else {
            setStatus('Could not send the trigger.');
        }
    }

    function packetIsForMe(payload) {
        if (!payload || typeof payload !== 'object') return false;

        if (payload.type === 'presence') return true;

        const myNumber = normalizeMemberNumber(Player?.MemberNumber);
        const target = normalizeMemberNumber(payload.targetMemberNumber);

        return target !== 0 && target === myNumber;
    }

    // =========================================================
    // MESSAGE HANDLING
    // =========================================================

    function processBambiPayload(senderMemberNumber, payload, senderName = '') {
        if (!payload || typeof payload !== 'object') return false;

        const sender = normalizeMemberNumber(senderMemberNumber);
        if (!sender) return false;

        const myNumber = normalizeMemberNumber(Player?.MemberNumber);
        if (sender === myNumber) return true;

        const resolvedSenderName =
            senderName ||
            payload.senderName ||
            getCharacterName(sender) ||
            'Unknown';

        // ---------------------------------------------------------
        // Presence
        // ---------------------------------------------------------
        if (payload.type === 'presence') {
            let labelXOffset = Number(payload.labelXOffset);
            let labelYOffset = Number(payload.labelYOffset);

            if (!Number.isFinite(labelXOffset)) labelXOffset = 300;
            if (!Number.isFinite(labelYOffset)) labelYOffset = -30;

            bambiPresence.set(sender, {
                memberNumber: sender,
                name: payload.name || resolvedSenderName,
                labelXOffset,
                labelYOffset,
                lastSeen: now()
            });

            return true;
        }

        if (!packetIsForMe(payload)) return true;

        // ---------------------------------------------------------
        // Connection request
        // ---------------------------------------------------------
        if (payload.type === 'connection_request') {
            if (!connectedUsers.has(sender)) {
                pendingRequests.set(sender, {
                    memberNumber: sender,
                    name: resolvedSenderName
                });
                savePendingRequests();
                refreshAllUI();
            }

            if (settings.autoAcceptConnections) {
                acceptConnection(sender);
            } else {
                setStatus(`Connection request from ${resolvedSenderName}.`);
            }

            return true;
        }

        // ---------------------------------------------------------
        // Connection accepted
        // ---------------------------------------------------------
        if (payload.type === 'connection_accepted') {
            const name =
                resolvedSenderName !== 'Unknown'
                    ? resolvedSenderName
                    : getCharacterName(sender);

            connectedUsers.set(sender, {
                memberNumber: sender,
                name
            });

            saveConnections();
            refreshAllUI();
            setStatus(`Connected to ${name}.`);
            return true;
        }

        // ---------------------------------------------------------
        // Connection removed
        // ---------------------------------------------------------
        if (payload.type === 'connection_removed') {
            connectedUsers.delete(sender);
            saveConnections();
            refreshAllUI();
            setStatus(`${resolvedSenderName} disconnected.`);
            return true;
        }

        // ---------------------------------------------------------
        // Trigger
        // ---------------------------------------------------------
        if (payload.type === 'trigger') {
            const index = Number(payload.triggerIndex);
            if (!Number.isInteger(index) || !TRIGGERS[index]) return true;

            if (!settings.acceptIncoming) {
                console.log('Bambi Obeys: incoming triggers are disabled.');
                return true;
            }

            if (!canTrigger(sender)) {
                console.log(
                    'Bambi Obeys: trigger rejected by authority mode:',
                    sender
                );
                return true;
            }

            playTrigger(index);
            return true;
        }

        return true;
    }

    function handleBambiMessage(data) {
        if (
            !data ||
            data.Type !== 'Hidden' ||
            data.Content !== PROTOCOL ||
            !Array.isArray(data.Dictionary) ||
            !data.Dictionary[0]
        ) {
            return;
        }

        const payload = data.Dictionary[0].message;
        processBambiPayload(
            data.Sender,
            payload,
            data.MemberName || ''
        );
    }

    function handleBambiAccountBeep(data) {
        if (!data || data.BeepType !== CROSS_SERVER_BEEP_TYPE) {
            return false;
        }

        const payload = data.Message;
        if (
            !payload ||
            typeof payload !== 'object' ||
            payload.IsBambiObeys !== BAMBI_BEEP_MARKER
        ) {
            return false;
        }

        processBambiPayload(
            data.MemberNumber,
            payload,
            data.MemberName || payload.senderName || ''
        );

        // Consume Bambi's private cross-server beep so it does not appear
        // as an ordinary Bondage Club beep notification.
        return true;
    }

    function handleBambiChatMessage(data) {
        if (!data) return;

        const sender = normalizeMemberNumber(data.Sender);
        if (!sender || sender === normalizeMemberNumber(Player?.MemberNumber)) {
            return;
        }

        const message = String(data.Content || '').trim();
        if (!message) return;

        // Compatibility with older Bambi versions that used ordinary
        // whispers for connection requests/disconnects.
        if (
            data.Type === 'Whisper' &&
            message.toLowerCase() === CONNECT_COMMAND.toLowerCase()
        ) {
            const name = data.MemberName || getCharacterName(sender);

            if (!connectedUsers.has(sender)) {
                pendingRequests.set(sender, {
                    memberNumber: sender,
                    name
                });
                savePendingRequests();
                refreshAllUI();
            }

            if (settings.autoAcceptConnections) {
                acceptConnection(sender);
            } else {
                setStatus(`Connection request from ${name}.`);
            }

            return;
        }

        if (
            data.Type === 'Whisper' &&
            message.toLowerCase() === DISCONNECT_COMMAND.toLowerCase()
        ) {
            connectedUsers.delete(sender);
            saveConnections();
            refreshAllUI();
            return;
        }
    }

    function installChatRoomSyncHook() {
        if (!bambiMod || typeof bambiMod.hookFunction !== 'function') {
            return false;
        }

        if (window.__BAMBI_OBEYS_SYNC_HOOK_INSTALLED__) {
            return true;
        }

        try {
            bambiMod.hookFunction(
                'ChatRoomSync',
                1,
                (args, next) => {
                    const result = next(args);
                    try {
                        setTimeout(() => {
                            announcePresence();
                            refreshRoomData();
                        }, 50);
                    } catch {}
                    return result;
                }
            );

            window.__BAMBI_OBEYS_SYNC_HOOK_INSTALLED__ = true;
            return true;
        } catch (error) {
            console.error('Bambi Obeys: ChatRoomSync hook failed', error);
            return false;
        }
    }

    function installBambiMessageHook() {
        if (bambiMessageHookInstalled) return true;
        if (!bambiMod || typeof bambiMod.hookFunction !== 'function') {
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
                        console.error('Bambi Obeys: message handling failed', error);
                    }

                    return next(args);
                }
            );

            bambiMessageHookInstalled = true;
            return true;
        } catch (error) {
            console.error('Bambi Obeys: ChatRoomMessage hook failed', error);
            return false;
        }
    }

    function installBambiAccountBeepHook() {
        if (!bambiMod || typeof bambiMod.hookFunction !== 'function') {
            return false;
        }

        if (window.__BAMBI_OBEYS_ACCOUNT_BEEP_HOOK_INSTALLED__) {
            return true;
        }

        try {
            bambiMod.hookFunction(
                'ServerAccountBeep',
                10,
                (args, next) => {
                    const data = args[0];

                    try {
                        if (handleBambiAccountBeep(data)) {
                            return;
                        }
                    } catch (error) {
                        console.error(
                            'Bambi Obeys: account beep handling failed',
                            error
                        );
                    }

                    return next(args);
                }
            );

            window.__BAMBI_OBEYS_ACCOUNT_BEEP_HOOK_INSTALLED__ = true;
            return true;
        } catch (error) {
            console.error('Bambi Obeys: ServerAccountBeep hook failed', error);
            return false;
        }
    }

    // =========================================================
    // BAMBI LABELS
    // =========================================================

    function getMainCanvasContext() {
        try {
            if (
                typeof MainCanvasCtx !== 'undefined' &&
                MainCanvasCtx &&
                typeof MainCanvasCtx.fillText === 'function'
            ) {
                return MainCanvasCtx;
            }
        } catch {}

        try {
            if (typeof MainCanvas !== 'undefined' && MainCanvas) {
                if (typeof MainCanvas.fillText === 'function') {
                    return MainCanvas;
                }

                if (typeof MainCanvas.getContext === 'function') {
                    const ctx = MainCanvas.getContext('2d');
                    if (ctx && typeof ctx.fillText === 'function') {
                        return ctx;
                    }
                }
            }
        } catch {}

        return null;
    }

    function drawBambiLabel(context, memberNumber, charX, charY, zoom) {
        if (!settings.showBambiLabels) return;

        const normalized = normalizeMemberNumber(memberNumber);
        if (!normalized) return;

        const myNumber = normalizeMemberNumber(Player?.MemberNumber);
        const isMe = normalized === myNumber;

        let labelXOffset;
        let labelYOffset;

        if (isMe) {
            labelXOffset = Number(settings.labelXOffset);
            labelYOffset = Number(settings.labelYOffset);
        } else {
            const presence = bambiPresence.get(normalized);
            if (!presence) return;

            if (now() - Number(presence.lastSeen) > 15000) return;
            if (!isInCurrentRoom(normalized)) return;

            labelXOffset = Number(presence.labelXOffset);
            labelYOffset = Number(presence.labelYOffset);
        }

        if (!Number.isFinite(labelXOffset)) labelXOffset = 300;
        if (!Number.isFinite(labelYOffset)) labelYOffset = -30;

        const x = Number(charX);
        const y = Number(charY);
        const zoomValue = Number(zoom);

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(zoomValue)
        ) {
            return;
        }

        const text = String(settings.labelText || 'Bambi');
        const alpha = Math.max(
            0,
            Math.min(1, Number(settings.labelOpacity))
        );

        try {
            context.save();
            context.globalAlpha = alpha;
            context.fillStyle = '#ff8fc7';
            context.font = 'bold 18px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            const labelX = x + labelXOffset;
            const labelY = y + 950 * zoomValue + labelYOffset;

            if (typeof context.shadowColor !== 'undefined') {
                context.shadowColor = 'rgba(255,105,180,0.9)';
                context.shadowBlur = 4;
            }

            context.fillText(text, labelX, labelY);
        } catch (error) {
            console.error('Bambi Obeys: label draw failed', error);
        } finally {
            try {
                context.restore();
            } catch {}
        }
    }

    function installBambiLabelHook() {
        if (bambiDrawHookInstalled) return true;
        if (!bambiMod || typeof bambiMod.hookFunction !== 'function') {
            return false;
        }

        try {
            bambiMod.hookFunction(
                'ChatRoomDrawCharacterStatusIcons',
                1,
                (args, next) => {
                    const result = next(args);

                    try {
                        const [C, CharX, CharY, Zoom] = args;
                        if (!settings.showBambiLabels) return result;
                        if (!C?.MemberNumber) return result;

                        const context = getMainCanvasContext();
                        if (!context) return result;

                        drawBambiLabel(
                            context,
                            C.MemberNumber,
                            CharX,
                            CharY,
                            Zoom
                        );
                    } catch (error) {
                        console.error('Bambi Obeys: label hook failed', error);
                    }

                    return result;
                }
            );

            bambiDrawHookInstalled = true;
            return true;
        } catch (error) {
            console.error(
                'Bambi Obeys: ChatRoomDrawCharacterStatusIcons hook failed',
                error
            );
            return false;
        }
    }

    // =========================================================
    // UI HELPERS
    // =========================================================

    function makeButton(label, onClick, primary = false) {
        const button = document.createElement('button');
        button.textContent = label;

        Object.assign(button.style, {
            width: '100%',
            padding: '8px',
            marginBottom: '8px',
            cursor: 'pointer',
            background: primary ? '#ff4fa3' : '#6b3158',
            color: '#fff',
            border: primary
                ? '1px solid #ff8fc7'
                : '1px solid #9d477e',
            borderRadius: '5px',
            fontWeight: primary ? 'bold' : 'normal'
        });

        button.addEventListener('click', event => {
            event.preventDefault();
            onClick();
        });

        return button;
    }

    function makeCheckbox(labelText, checked, onChange) {
        const row = document.createElement('label');
        Object.assign(row.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            marginBottom: '7px',
            cursor: 'pointer'
        });

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = Boolean(checked);

        input.addEventListener('change', () => {
            onChange(input.checked);
        });

        const text = document.createElement('span');
        text.textContent = labelText;

        row.appendChild(input);
        row.appendChild(text);
        return row;
    }

    function makeNumberSlider(
        labelText,
        min,
        max,
        step,
        initial,
        formatValue,
        onChange
    ) {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '12px';

        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px'
        });

        const label = document.createElement('span');
        label.textContent = labelText;
        label.style.color = '#ffb8d9';
        label.style.fontSize = '12px';

        const value = document.createElement('span');
        value.style.color = '#fff';
        value.style.fontSize = '12px';

        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.value = String(initial);
        input.style.width = '100%';

        function updateValue() {
            const numeric = Number(input.value);
            value.textContent = formatValue(numeric);
        }

        input.addEventListener('input', () => {
            const numeric = Number(input.value);
            updateValue();
            onChange(numeric);
        });

        header.appendChild(label);
        header.appendChild(value);
        wrapper.appendChild(header);
        wrapper.appendChild(input);

        updateValue();
        return wrapper;
    }

    function styleSelect(select) {
        Object.assign(select.style, {
            width: '100%',
            padding: '7px',
            marginBottom: '7px',
            boxSizing: 'border-box',
            background: '#fff0f7',
            color: '#48172f',
            border: '1px solid #ff69b4',
            borderRadius: '5px'
        });
    }

    function createContentArea() {
        const content = document.createElement('div');
        Object.assign(content.style, {
            maxHeight: '65vh',
            overflowY: 'auto',
            paddingRight: '3px'
        });
        return content;
    }

    function switchTab(tabName) {
        activeTab = tabName;

        for (const [name, button] of Object.entries(tabs)) {
            button.style.background =
                name === activeTab ? '#ff4fa3' : '#5b2447';
        }

        for (const [name, content] of Object.entries(tabContents)) {
            content.style.display =
                name === activeTab ? 'block' : 'none';
        }
    }

    // =========================================================
    // AUTHORITY TAB
    // =========================================================

    function buildAuthorityTab(content) {
        const heading = document.createElement('div');
        heading.textContent = 'Who can trigger Bambi';
        heading.style.fontWeight = 'bold';
        heading.style.marginBottom = '7px';
        content.appendChild(heading);

        const modes = [
            ['owner', 'Owner only'],
            ['friends', 'Friends only'],
            ['connected', 'Anyone connected'],
            ['anyone', 'Anyone']
        ];

        for (const [value, labelText] of modes) {
            const row = document.createElement('label');
            Object.assign(row.style, {
                display: 'flex',
                gap: '7px',
                marginBottom: '6px'
            });

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'bambi-authority';
            input.value = value;
            input.checked = settings.authorityMode === value;

            input.addEventListener('change', () => {
                if (!input.checked) return;
                settings.authorityMode = value;
                saveSettings();
            });

            const label = document.createElement('span');
            label.textContent = labelText;

            row.appendChild(input);
            row.appendChild(label);
            content.appendChild(row);
        }

        const whitelistLabel = document.createElement('div');
        whitelistLabel.textContent = 'Whitelist Member IDs';
        Object.assign(whitelistLabel.style, {
            color: '#ffb8d9',
            fontSize: '12px',
            marginTop: '12px',
            marginBottom: '4px'
        });
        content.appendChild(whitelistLabel);

        const whitelist = document.createElement('textarea');
        whitelist.value = settings.whitelist;
        whitelist.placeholder = '12345, 67890, 13579';
        Object.assign(whitelist.style, {
            width: '100%',
            minHeight: '55px',
            boxSizing: 'border-box',
            background: '#fff0f7',
            color: '#48172f',
            border: '1px solid #ff69b4',
            borderRadius: '5px',
            padding: '6px',
            resize: 'vertical',
            marginBottom: '10px'
        });

        whitelist.addEventListener('change', () => {
            settings.whitelist = whitelist.value;
            saveSettings();
        });

        content.appendChild(whitelist);
        content.appendChild(document.createElement('hr'));

        content.appendChild(
            makeCheckbox(
                'Automatically accept connection requests',
                settings.autoAcceptConnections,
                checked => {
                    settings.autoAcceptConnections = checked;
                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeButton(
                'Disconnect selected user',
                () => {
                    if (selectedTarget) disconnectUser(selectedTarget);
                },
                false
            )
        );

        const note = document.createElement('div');
        note.textContent =
            'Whitelist entries override the selected authority mode.';
        Object.assign(note.style, {
            fontSize: '11px',
            color: '#d994ba',
            lineHeight: '1.4',
            marginTop: '4px'
        });
        content.appendChild(note);
    }

    // =========================================================
    // TRIGGERS TAB
    // =========================================================

    function buildTriggersTab(content) {
        const connectLabel = document.createElement('div');
        connectLabel.textContent = 'Connect to';
        Object.assign(connectLabel.style, {
            color: '#ffb8d9',
            fontSize: '12px',
            marginBottom: '4px'
        });
        content.appendChild(connectLabel);

        connectSelect = document.createElement('select');
        styleSelect(connectSelect);
        content.appendChild(connectSelect);

        content.appendChild(
            makeButton(
                '💗 Send :Bambi Connect',
                () => {
                    if (connectSelect?.value) {
                        requestConnection(connectSelect.value);
                    }
                },
                true
            )
        );

        const remoteConnectLabel = document.createElement('div');
        remoteConnectLabel.textContent = 'Or enter a Member Number for another server';
        Object.assign(remoteConnectLabel.style, {
            color: '#ffb8d9',
            fontSize: '11px',
            marginTop: '5px',
            marginBottom: '4px'
        });
        content.appendChild(remoteConnectLabel);

        const remoteConnectInput = document.createElement('input');
        remoteConnectInput.type = 'number';
        remoteConnectInput.min = '1';
        remoteConnectInput.placeholder = 'Member Number';
        Object.assign(remoteConnectInput.style, {
            width: '100%',
            padding: '7px',
            marginBottom: '7px',
            boxSizing: 'border-box',
            background: '#fff0f7',
            color: '#48172f',
            border: '1px solid #ff69b4',
            borderRadius: '5px'
        });
        content.appendChild(remoteConnectInput);

        content.appendChild(
            makeButton(
                '🌐 Connect by Member Number',
                () => {
                    const memberNumber = normalizeMemberNumber(remoteConnectInput.value);
                    if (memberNumber) requestConnection(memberNumber);
                },
                false
            )
        );

        const pendingHeading = document.createElement('div');
        pendingHeading.textContent = 'Pending requests';
        pendingHeading.style.fontWeight = 'bold';
        pendingHeading.style.margin = '8px 0 5px';
        content.appendChild(pendingHeading);

        pendingArea = document.createElement('div');
        content.appendChild(pendingArea);

        const targetLabel = document.createElement('div');
        targetLabel.textContent = 'Send to';
        Object.assign(targetLabel.style, {
            color: '#ffb8d9',
            fontSize: '12px',
            marginBottom: '4px',
            marginTop: '8px'
        });
        content.appendChild(targetLabel);

        targetSelect = document.createElement('select');
        styleSelect(targetSelect);

        targetSelect.addEventListener('change', () => {
            selectedTarget = targetSelect.value;
        });

        content.appendChild(targetSelect);

        const triggerLabel = document.createElement('div');
        triggerLabel.textContent = 'Trigger';
        Object.assign(triggerLabel.style, {
            color: '#ffb8d9',
            fontSize: '12px',
            marginBottom: '4px'
        });
        content.appendChild(triggerLabel);

        triggerSelect = document.createElement('select');
        styleSelect(triggerSelect);

        TRIGGERS.forEach((trigger, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.textContent = trigger.name;
            triggerSelect.appendChild(option);
        });

        triggerSelect.addEventListener('change', () => {
            selectedTrigger = Number(triggerSelect.value);
            refreshTriggerDescription();
        });

        content.appendChild(triggerSelect);

        triggerDescription = document.createElement('div');
        Object.assign(triggerDescription.style, {
            fontSize: '11px',
            color: '#d994ba',
            lineHeight: '1.4',
            minHeight: '42px',
            marginBottom: '8px'
        });
        content.appendChild(triggerDescription);

        content.appendChild(
            makeButton(
                '▶ Send Trigger',
                () => {
                    if (selectedTarget) {
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
                '▶ Test Trigger Locally',
                () => playTrigger(selectedTrigger),
                false
            )
        );

        content.appendChild(
            makeCheckbox(
                'Accept incoming triggers',
                settings.acceptIncoming,
                checked => {
                    settings.acceptIncoming = checked;
                    saveSettings();
                }
            )
        );

        refreshTriggerDescription();
    }

    function refreshTriggerDescription() {
        if (!triggerDescription) return;
        triggerDescription.textContent =
            TRIGGERS[selectedTrigger]?.description || '';
    }

    // =========================================================
    // SAFETY TAB
    // =========================================================

    function buildSafetyTab(content) {
        content.appendChild(
            makeCheckbox(
                'Auto wake enabled',
                settings.autoWakeEnabled,
                checked => {
                    settings.autoWakeEnabled = checked;
                    saveSettings();
                    scheduleRemainingWake();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                'Auto wake after sleep',
                0,
                60,
                1,
                settings.autoWakeMinutes,
                value => value === 0 ? 'Disabled' : `${value} min`,
                value => {
                    settings.autoWakeMinutes = value;
                    saveSettings();
                    scheduleRemainingWake();
                }
            )
        );

        const explanation = document.createElement('div');
        explanation.textContent =
            '0 minutes disables auto wake. The timer survives refreshes.';
        Object.assign(explanation.style, {
            fontSize: '11px',
            color: '#d994ba',
            lineHeight: '1.4',
            marginBottom: '12px'
        });
        content.appendChild(explanation);

        const heading = document.createElement('div');
        heading.textContent = 'Trigger safety';
        heading.style.fontWeight = 'bold';
        heading.style.marginBottom = '7px';
        content.appendChild(heading);

        TRIGGERS.forEach(trigger => {
            content.appendChild(
                makeCheckbox(
                    trigger.name,
                    settings.enabledTriggers[trigger.name] !== false,
                    checked => {
                        settings.enabledTriggers[trigger.name] = checked;
                        saveSettings();
                    }
                )
            );
        });

        content.appendChild(
            makeButton(
                'Stop all currently playing audio',
                stopAllLayers,
                false
            )
        );
    }

    // =========================================================
    // LIMITS TAB
    // =========================================================

    function buildLimitsTab(content) {
        content.appendChild(
            makeNumberSlider(
                'Maximum simultaneous layers',
                1,
                10,
                1,
                settings.maxSimultaneous,
                value => `${value}`,
                value => {
                    settings.maxSimultaneous = value;
                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                'Secondary trigger volume',
                10,
                100,
                5,
                Math.round(Number(settings.secondaryVolume) * 100),
                value => `${value}%`,
                value => {
                    settings.secondaryVolume = value / 100;
                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                'Fade in',
                0,
                1000,
                10,
                settings.fadeInMs,
                value => `${value} ms`,
                value => {
                    settings.fadeInMs = value;
                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                'Fade out',
                0,
                2000,
                10,
                settings.fadeOutMs,
                value => `${value} ms`,
                value => {
                    settings.fadeOutMs = value;
                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeCheckbox(
                'Alternate secondary triggers between ears',
                settings.alternateEars,
                checked => {
                    settings.alternateEars = checked;
                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                'Trigger cooldown',
                0,
                5000,
                50,
                settings.cooldownMs,
                value => value === 0 ? 'Disabled' : `${value} ms`,
                value => {
                    settings.cooldownMs = value;
                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                'Maximum triggers per minute',
                1,
                120,
                1,
                settings.maxTriggersPerMinute,
                value => `${value}`,
                value => {
                    settings.maxTriggersPerMinute = value;
                    saveSettings();
                }
            )
        );

        const labelHeading = document.createElement('div');
        labelHeading.textContent = 'Bambi label';
        labelHeading.style.fontWeight = 'bold';
        labelHeading.style.margin = '12px 0 7px';
        content.appendChild(labelHeading);

        content.appendChild(
            makeCheckbox(
                'Show Bambi labels',
                settings.showBambiLabels,
                checked => {
                    settings.showBambiLabels = checked;
                    saveSettings();
                }
            )
        );

        const textLabel = document.createElement('div');
        textLabel.textContent = 'Label text';
        textLabel.style.color = '#ffb8d9';
        textLabel.style.fontSize = '12px';
        textLabel.style.marginBottom = '4px';
        content.appendChild(textLabel);

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = settings.labelText;
        Object.assign(textInput.style, {
            width: '100%',
            boxSizing: 'border-box',
            padding: '7px',
            background: '#fff0f7',
            color: '#48172f',
            border: '1px solid #ff69b4',
            borderRadius: '5px',
            marginBottom: '8px'
        });

        textInput.addEventListener('change', () => {
            settings.labelText = textInput.value || 'Bambi';
            saveSettings();
        });

        content.appendChild(textInput);

        content.appendChild(
            makeNumberSlider(
                'Label opacity',
                0,
                100,
                1,
                Math.round(Number(settings.labelOpacity) * 100),
                value => `${value}%`,
                value => {
                    settings.labelOpacity = value / 100;
                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                'Horizontal label offset',
                -600,
                600,
                5,
                settings.labelXOffset,
                value => `${value}px`,
                value => {
                    settings.labelXOffset = value;
                    saveSettings();
                }
            )
        );

        content.appendChild(
            makeNumberSlider(
                'Vertical label offset',
                -600,
                600,
                5,
                settings.labelYOffset,
                value => `${value}px`,
                value => {
                    settings.labelYOffset = value;
                    saveSettings();
                }
            )
        );
    }

    // =========================================================
    // UI REFRESH
    // =========================================================

    function refreshConnectDropdown() {
        if (!connectSelect) return;

        const oldValue = connectSelect.value;
        connectSelect.innerHTML = '';

        const roomMembers = getRoomCharacters()
            .map(character => ({
                memberNumber: normalizeMemberNumber(character?.MemberNumber),
                name: character?.Nickname || character?.Name || 'Unknown'
            }))
            .filter(entry => entry.memberNumber)
            .filter(entry => {
                return entry.memberNumber !== normalizeMemberNumber(Player?.MemberNumber);
            });

        if (roomMembers.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No other users in room';
            connectSelect.appendChild(option);
            return;
        }

        for (const entry of roomMembers) {
            const option = document.createElement('option');
            option.value = String(entry.memberNumber);
            option.textContent = entry.name;
            connectSelect.appendChild(option);
        }

        if ([...connectSelect.options].some(option => option.value === oldValue)) {
            connectSelect.value = oldValue;
        }
    }

    function refreshTargetDropdown() {
        if (!targetSelect) return;

        const oldValue = selectedTarget;
        targetSelect.innerHTML = '';

        const allConnected = [...connectedUsers.values()]
            .sort((a, b) => String(a.name).localeCompare(String(b.name)));

        if (allConnected.length === 0) {
            selectedTarget = '';
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No connected users';
            targetSelect.appendChild(option);
            return;
        }

        for (const user of allConnected) {
            const option = document.createElement('option');
            const inRoom = isInCurrentRoom(user.memberNumber);
            option.value = String(user.memberNumber);
            option.textContent = `${user.name || getCharacterName(user.memberNumber)}${inRoom ? '' : ' (cross-server)'}`;
            targetSelect.appendChild(option);
        }

        if ([...targetSelect.options].some(option => option.value === oldValue)) {
            targetSelect.value = oldValue;
        } else {
            selectedTarget = targetSelect.value || '';
        }
    }

    function refreshPendingArea() {
        if (!pendingArea) return;

        pendingArea.innerHTML = '';

        if (pendingRequests.size === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'No pending requests.';
            Object.assign(empty.style, {
                color: '#d994ba',
                fontSize: '11px',
                marginBottom: '8px'
            });
            pendingArea.appendChild(empty);
            return;
        }

        for (const request of pendingRequests.values()) {
            const row = document.createElement('div');
            Object.assign(row.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px'
            });

            const text = document.createElement('span');
            text.textContent = request.name || 'Unknown';
            text.style.flex = '1';
            text.style.fontSize = '12px';

            const accept = document.createElement('button');
            accept.textContent = 'Accept';
            Object.assign(accept.style, {
                padding: '4px 7px',
                cursor: 'pointer',
                background: '#ff4fa3',
                color: '#fff',
                border: '1px solid #ff8fc7',
                borderRadius: '4px'
            });

            accept.addEventListener('click', () => {
                acceptConnection(request.memberNumber);
            });

            const reject = document.createElement('button');
            reject.textContent = '×';
            Object.assign(reject.style, {
                padding: '4px 7px',
                cursor: 'pointer',
                background: '#6b3158',
                color: '#fff',
                border: '1px solid #9d477e',
                borderRadius: '4px'
            });

            reject.addEventListener('click', () => {
                pendingRequests.delete(request.memberNumber);
                savePendingRequests();
                refreshPendingArea();
            });

            row.appendChild(text);
            row.appendChild(accept);
            row.appendChild(reject);
            pendingArea.appendChild(row);
        }
    }

    function refreshStatus() {
        if (!statusText) return;

        const total = connectedUsers.size;
        const inRoom = [...connectedUsers.keys()].filter(
            memberNumber => isInCurrentRoom(memberNumber)
        ).length;

        statusText.textContent =
            total === 0
                ? 'No connected users.'
                : `${total} connected${inRoom ? ` (${inRoom} in room)` : ''}`;
    }

    function refreshAllUI() {
        refreshConnectDropdown();
        refreshTargetDropdown();
        refreshPendingArea();
        refreshStatus();
        refreshTriggerDescription();
    }

    // =========================================================
    // DRAGGING
    // =========================================================

    function makeDraggable(element, handle) {
        let dragging = false;
        let moved = false;
        let offsetX = 0;
        let offsetY = 0;
        let startX = 0;
        let startY = 0;

        handle.addEventListener('mousedown', event => {
            if (event.button !== 0) return;

            const rect = element.getBoundingClientRect();
            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;
            startX = event.clientX;
            startY = event.clientY;
            moved = false;
            dragging = true;
            handle.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            event.preventDefault();
        });

        document.addEventListener('mousemove', event => {
            if (!dragging) return;

            if (
                Math.abs(event.clientX - startX) > 5 ||
                Math.abs(event.clientY - startY) > 5
            ) {
                moved = true;
            }

            let left = event.clientX - offsetX;
            let top = event.clientY - offsetY;

            const maxLeft = Math.max(0, window.innerWidth - element.offsetWidth);
            const maxTop = Math.max(0, window.innerHeight - element.offsetHeight);

            left = Math.max(0, Math.min(left, maxLeft));
            top = Math.max(0, Math.min(top, maxTop));

            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
            element.style.right = 'auto';
            element.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (!dragging) return;

            dragging = false;
            handle.style.cursor = 'grab';
            document.body.style.userSelect = '';
            handle.__bambiMoved = moved;
        });
    }

    // =========================================================
    // UI
    // =========================================================

    function createUI() {
        if (container) return;

        container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            left: '20px',
            top: '100px',
            zIndex: '999999',
            fontFamily: 'Arial, sans-serif'
        });

        floatingButton = document.createElement('button');
        floatingButton.textContent = 'B';
        floatingButton.title = `${PRODUCT_NAME} v${BAMBI_VERSION}`;

        Object.assign(floatingButton.style, {
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '2px solid #ff8fc7',
            background: '#ff4fa3',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'grab',
            boxShadow: '0 4px 12px rgba(255, 50, 150, 0.4)'
        });

        panel = document.createElement('div');
        Object.assign(panel.style, {
            display: 'none',
            width: '305px',
            marginTop: '8px',
            background: '#3a1730',
            color: '#fff',
            padding: '12px',
            borderRadius: '10px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
            border: '1px solid #ff69b4',
            boxSizing: 'border-box'
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
        });

        const titleWrap = document.createElement('div');
        Object.assign(titleWrap.style, {
            display: 'flex',
            alignItems: 'baseline',
            gap: '7px'
        });

        const title = document.createElement('span');
        title.textContent = PRODUCT_NAME;
        Object.assign(title.style, {
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#ff9bce'
        });

        // Version is visible in the Club UI whenever the B button is opened.
        versionText = document.createElement('span');
        versionText.textContent = `v${BAMBI_VERSION}`;
        Object.assign(versionText.style, {
            fontSize: '11px',
            color: '#d994ba'
        });

        titleWrap.appendChild(title);
        titleWrap.appendChild(versionText);

        const close = document.createElement('button');
        close.textContent = '×';
        Object.assign(close.style, {
            background: 'transparent',
            border: 'none',
            color: '#ff9bce',
            fontSize: '22px',
            cursor: 'pointer'
        });

        close.addEventListener('click', () => {
            panelOpen = false;
            panel.style.display = 'none';
        });

        header.appendChild(titleWrap);
        header.appendChild(close);
        panel.appendChild(header);

        statusText = document.createElement('div');
        Object.assign(statusText.style, {
            fontSize: '11px',
            color: '#ff9bce',
            marginBottom: '8px'
        });
        panel.appendChild(statusText);

        const tabBar = document.createElement('div');
        Object.assign(tabBar.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            marginBottom: '8px'
        });

        tabs = {};
        tabContents = {};

        for (const name of ['Authority', 'Triggers', 'Safety', 'Limits']) {
            const tabButton = document.createElement('button');
            tabButton.textContent = name;
            Object.assign(tabButton.style, {
                padding: '6px 3px',
                cursor: 'pointer',
                color: '#fff',
                border: '1px solid #ff8fc7',
                borderRadius: '5px',
                background: name === activeTab ? '#ff4fa3' : '#5b2447',
                fontSize: '11px'
            });

            tabButton.addEventListener('click', () => switchTab(name));
            tabs[name] = tabButton;
            tabBar.appendChild(tabButton);
        }

        panel.appendChild(tabBar);

        for (const name of ['Authority', 'Triggers', 'Safety', 'Limits']) {
            const content = createContentArea();
            content.style.display = name === activeTab ? 'block' : 'none';
            tabContents[name] = content;
            panel.appendChild(content);
        }

        buildAuthorityTab(tabContents.Authority);
        buildTriggersTab(tabContents.Triggers);
        buildSafetyTab(tabContents.Safety);
        buildLimitsTab(tabContents.Limits);

        container.appendChild(floatingButton);
        container.appendChild(panel);
        document.body.appendChild(container);

        makeDraggable(container, floatingButton);

        floatingButton.addEventListener('click', () => {
            if (floatingButton.__bambiMoved) {
                floatingButton.__bambiMoved = false;
                return;
            }

            panelOpen = !panelOpen;
            panel.style.display = panelOpen ? 'block' : 'none';
        });

        switchTab(activeTab);
        refreshAllUI();
    }

    // =========================================================
    // ROOM MAINTENANCE
    // =========================================================

    function refreshRoomData() {
        const currentMembers = new Set(
            getRoomCharacters()
                .map(character => normalizeMemberNumber(character?.MemberNumber))
                .filter(Boolean)
        );

        for (const memberNumber of bambiPresence.keys()) {
            if (!currentMembers.has(memberNumber)) {
                bambiPresence.delete(memberNumber);
            }
        }

        for (const [memberNumber, user] of connectedUsers) {
            if (currentMembers.has(memberNumber)) {
                user.name = getCharacterName(memberNumber);
            }
        }

        for (const [memberNumber, user] of pendingRequests) {
            if (currentMembers.has(memberNumber)) {
                user.name = getCharacterName(memberNumber);
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
    const initInterval = setInterval(() => {
        initAttempts += 1;

        if (
            typeof Player === 'undefined' ||
            typeof ChatRoomData === 'undefined'
        ) {
            if (initAttempts > 1200) clearInterval(initInterval);
            return;
        }

        if (!registerBambiMod()) {
            if (initAttempts > 1200) clearInterval(initInterval);
            return;
        }

        installBambiMessageHook();
        installChatRoomSyncHook();
        installBambiLabelHook();
        installBambiAccountBeepHook();

        if (!bambiMessageHookInstalled || !bambiDrawHookInstalled || !window.__BAMBI_OBEYS_SYNC_HOOK_INSTALLED__ || !window.__BAMBI_OBEYS_ACCOUNT_BEEP_HOOK_INSTALLED__) {
            if (initAttempts > 1200) clearInterval(initInterval);
            return;
        }

        clearInterval(initInterval);

        createUI();
        scheduleRemainingWake();
        checkVersionUpdate();

        setTimeout(() => {
            checkForNewVersion();
        }, 1500);

        setInterval(() => {
            checkForNewVersion();
        }, 5 * 60 * 1000);

        setTimeout(refreshRoomData, 1000);
        setInterval(refreshRoomData, 5000);

        setInterval(() => {
            const cutoff = now() - 15000;

            for (const [memberNumber, presence] of bambiPresence) {
                if (Number(presence.lastSeen) < cutoff) {
                    bambiPresence.delete(memberNumber);
                }
            }
        }, 5000);

        announcePresence();

        console.log(
            `${PRODUCT_NAME} v${BAMBI_VERSION} loaded.`
        );
    }, 100);
})();
