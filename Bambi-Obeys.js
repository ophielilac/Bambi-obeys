(function () {
    'use strict';

    if (window.__BAMBI_OBEYS_CORE_LOADED__) return;
    window.__BAMBI_OBEYS_CORE_LOADED__ = true;


    // CONFIG

    const BAMBI_VERSION = '1.6.4';
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
        'bambiObeysSettings_v6';

    const LEGACY_SETTINGS_KEY =
        'bambiObeysSettings_v5';

    const SLEEP_KEY =
        'bambiObeysSleep_v3';

    const LEGACY_SLEEP_KEY =
        'bambiObeysSleep_v2';

    const CHAT_FORGET_KEY =
        'bambiObeysChatForget_v1';

    const PROTOCOL =
        'BambiObeysMsg';

    // Targeted Bambi control traffic uses the same AccountBeep/Leash
    const CROSS_SERVER_BEEP_TYPE =
        'Leash';

    const BAMBI_BEEP_MARKER =
        true;

    const BCX_ACCESS_LEVEL = {
        self: 0,
        clubowner: 1,
        owner: 2,
        lover: 3,
        mistress: 4,
        whitelist: 5,
        friend: 6,
        public: 7
    };

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
        authorityMode: 'owner',
        whitelist: '',

        // Incoming / range
        acceptIncoming: true,
        outOfRoomTriggers: true,

        // Limits / safety
        autoWakeMinutes: 30,
        autoWakeEnabled: true,
        enabledTriggers: {},

        // Audio
        maxSimultaneous: 5,
        secondaryVolume: 0.40,
        fadeInMs: 150,
        fadeOutMs: 300,
        alternateEars: true,
        cooldownMs: 0,
        maxTriggersPerMinute: 30,

        // Customization
        showBambiLabels: true,
        labelOpacity: 0.42,
        labelText: 'Bambi',
        labelXOffset: 300,
        labelYOffset: -30
    };


    // STATE


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
    let targetSelect = null;
    let targetMemberInput = null;
    let triggerSelect = null;
    let triggerDescription = null;
    let authorityRoleStatus = null;
    let whitelistInput = null;
    let whitelistLabelElement = null;

    const bambiPresence = new Map();
    const pendingTriggerRequests = new Map();

    let bambiMod = null;
    let bambiMessageHookInstalled = false;
    let bambiDrawHookInstalled = false;
    let bambiSleepHooksInstalled = false;

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

    let chatForgetState = {
        active: false,
        cutoff: 0
    };
    const forgottenChatObjects = new WeakSet();
    const forgottenChatSignatures = new Set();
    let chatForgetObserver = null;


    // HELPERS
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
        const player = typeof Player !== 'undefined' ? Player : null;
        if (!player) return result;

        const possibleLists = [
            player.FriendList,
            player.Friends,
            player.FriendNumbers
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
        const player = typeof Player !== 'undefined' ? Player : null;
        if (!player) return 0;

        const candidates = [
            player.OwnerNumber,
            player.OwnerMemberNumber,
            player.Owner?.MemberNumber,
            player.Owner?.memberNumber,
            player.Owner
        ];

        for (const value of candidates) {
            const n = normalizeMemberNumber(
                typeof value === 'object'
                    ? value?.MemberNumber ?? value?.memberNumber
                    : value
            );
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

    function getBCXModAPI() {
        try {
            const bcx = window.bcx;
            if (!bcx) return null;

            const candidates = [];

            if (typeof bcx.getModApi === 'function') {
                for (const name of [
                    'BondageClubExtended',
                    'Bondage Club Extended',
                    'BCX',
                    'bcx'
                ]) {
                    try {
                        const api = bcx.getModApi(name);
                        if (api) candidates.push(api);
                    } catch {}
                }
            }

            if (bcx.api) candidates.push(bcx.api);
            candidates.push(bcx);

            return candidates.find(api => {
                return api && (
                    typeof api.getCharacterRole === 'function' ||
                    typeof api.GetCharacterRole === 'function' ||
                    typeof api.getRole === 'function'
                );
            }) || null;
        } catch {
            return null;
        }
    }

    function getBCXCharacterRole(memberNumber) {
        const member = normalizeMemberNumber(memberNumber);
        if (!member) return null;

        try {
            const api = getBCXModAPI();
            if (!api) return null;

            const methods = [
                'getCharacterRole',
                'GetCharacterRole',
                'getRole'
            ];

            for (const methodName of methods) {
                if (typeof api[methodName] !== 'function') continue;

                const role = api[methodName](member);
                if (
                    typeof role === 'string' &&
                    Object.prototype.hasOwnProperty.call(
                        BCX_ACCESS_LEVEL,
                        role.toLowerCase()
                    )
                ) {
                    return role.toLowerCase();
                }
            }
        } catch (error) {
            console.debug('Bambi Obeys: BCX role lookup unavailable', error);
        }

        return null;
    }

    function relationIsTrue(memberNumber, methodNames) {
        const member = normalizeMemberNumber(memberNumber);
        if (!member) return false;

        const owners = [
            typeof Player !== 'undefined' ? Player : null,
            typeof ChatRoomCharacter !== 'undefined' ? ChatRoomCharacter : null
        ];

        for (const object of owners) {
            if (!object) continue;

            for (const methodName of methodNames) {
                try {
                    if (typeof object[methodName] === 'function') {
                        if (object[methodName](member)) return true;
                    }
                } catch {}
            }
        }

        return false;
    }

    function isMemberInPlayerWhitelist(memberNumber) {
        const member = normalizeMemberNumber(memberNumber);
        if (!member) return false;

        const lists = [
            typeof Player !== 'undefined' ? Player.WhiteList : null,
            typeof Player !== 'undefined' ? Player.Whitelist : null,
            typeof Player !== 'undefined' ? Player.WhiteListMembers : null
        ];

        for (const list of lists) {
            if (!Array.isArray(list)) continue;

            for (const entry of list) {
                const number = normalizeMemberNumber(
                    typeof entry === 'object'
                        ? entry?.MemberNumber ?? entry?.memberNumber
                        : entry
                );

                if (number === member) return true;
            }
        }

        return relationIsTrue(member, [
            'IsPlayerInWhitelist',
            'IsInWhitelist',
            'IsWhiteListed'
        ]);
    }

    function isMemberFriend(memberNumber) {
        const member = normalizeMemberNumber(memberNumber);
        if (!member) return false;

        if (getFriendNumbers().has(member)) return true;

        return relationIsTrue(member, [
            'IsFriendOfMemberNumber',
            'IsFriendOf'
        ]);
    }

    function isMemberLover(memberNumber) {
        const member = normalizeMemberNumber(memberNumber);
        if (!member) return false;

        return relationIsTrue(member, [
            'IsLoverOfMemberNumber',
            'IsLoverOf',
            'IsLover'
        ]);
    }

    function isMemberOwner(memberNumber) {
        const member = normalizeMemberNumber(memberNumber);
        if (!member) return false;

        if (member === getOwnerNumber()) return true;

        return relationIsTrue(member, [
            'IsOwnedByMemberNumber',
            'IsOwnedBy'
        ]);
    }

    function getBambiAccessLevel(memberNumber) {
        const member = normalizeMemberNumber(memberNumber);
        if (!member) return BCX_ACCESS_LEVEL.public;

        const myNumber = normalizeMemberNumber(
            typeof Player !== 'undefined' ? Player.MemberNumber : 0
        );

        if (member === myNumber) return BCX_ACCESS_LEVEL.self;

        const bcxRole = getBCXCharacterRole(member);
        if (bcxRole) {
            return BCX_ACCESS_LEVEL[bcxRole] ?? BCX_ACCESS_LEVEL.public;
        }

        // owner -> lover -> whitelist -> friend -> public.
        if (isMemberOwner(member)) return BCX_ACCESS_LEVEL.owner;
        if (isMemberLover(member)) return BCX_ACCESS_LEVEL.lover;
        if (isMemberInPlayerWhitelist(member)) return BCX_ACCESS_LEVEL.whitelist;
        if (isMemberFriend(member)) return BCX_ACCESS_LEVEL.friend;

        return BCX_ACCESS_LEVEL.public;
    }

    function getAuthorityMinimumLevel() {
        switch (settings.authorityMode) {
            case 'owner':
                return BCX_ACCESS_LEVEL.owner;
            case 'lover':
                return BCX_ACCESS_LEVEL.lover;
            case 'friends':
                return BCX_ACCESS_LEVEL.friend;
            case 'whitelist':
                return BCX_ACCESS_LEVEL.whitelist;
            case 'anyone':
                return BCX_ACCESS_LEVEL.public;
            default:
                return BCX_ACCESS_LEVEL.owner;
        }
    }

    function getAuthorityModeLabel() {
        switch (settings.authorityMode) {
            case 'owner': return 'Owner only';
            case 'lover': return 'Lovers only';
            case 'friends': return 'Friends only';
            case 'whitelist': return 'Whitelist only';
            case 'anyone': return 'Anyone';
            default: return 'Owner only';
        }
    }

    function getRoleName(memberNumber) {
        const member = normalizeMemberNumber(memberNumber);
        if (!member) return 'Unknown';

        const customWhitelist = getWhitelist();
        if (customWhitelist.has(member)) return 'Bambi whitelist';

        const role = getBCXCharacterRole(member);
        if (role) {
            const labels = {
                self: 'Self',
                clubowner: 'Club owner',
                owner: 'Owner',
                lover: 'Lover',
                mistress: 'Mistress',
                whitelist: 'BCX whitelist',
                friend: 'Friend',
                public: 'Public'
            };
            return labels[role] || role;
        }

        const level = getBambiAccessLevel(member);
        for (const [key, value] of Object.entries(BCX_ACCESS_LEVEL)) {
            if (value === level) {
                const labels = {
                    self: 'Self',
                    clubowner: 'Club owner',
                    owner: 'Owner',
                    lover: 'Lover',
                    mistress: 'Mistress',
                    whitelist: 'Whitelist',
                    friend: 'Friend',
                    public: 'Public'
                };
                return labels[key] || key;
            }
        }

        return 'Public';
    }

    function setStatus(text) {
        if (statusText) statusText.textContent = text || '';
    }


    // STORAGE

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

    function migrateLegacySettings() {
        let current = null;
        let legacy = null;

        try {
            current = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        } catch (error) {
            console.debug('Bambi Obeys: current settings could not be parsed', error);
        }

        try {
            legacy = JSON.parse(localStorage.getItem(LEGACY_SETTINGS_KEY));
        } catch (error) {
            console.debug('Bambi Obeys: legacy settings could not be parsed', error);
        }

        if (current && typeof current === 'object') {
            mergeSettings(current);

            if (current.authorityMode === 'connected' ||
                !['owner', 'lover', 'friends', 'whitelist', 'anyone'].includes(settings.authorityMode)) {
                settings.authorityMode = 'owner';
            }

            return;
        }

        if (legacy && typeof legacy === 'object') {
            const migrated = Object.assign({}, legacy);

            // The old connection-based authority mode no longer exists.
            if (migrated.authorityMode === 'connected' || !migrated.authorityMode) {
                migrated.authorityMode = 'owner';
            }

            delete migrated.autoAcceptConnections;
            mergeSettings(migrated);

            try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            } catch (error) {
                console.error('Bambi Obeys: failed to save migrated settings', error);
            }

            return;
        }

        mergeSettings(DEFAULT_SETTINGS);
    }

    function loadStorage() {
        migrateLegacySettings();

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
            let saved = JSON.parse(localStorage.getItem(SLEEP_KEY));

            if (!saved) {
                saved = JSON.parse(localStorage.getItem(LEGACY_SLEEP_KEY));
            }

            if (saved?.active && Number(saved.startedAt) > 0) {
                sleepState.active = true;
                sleepState.startedAt = Number(saved.startedAt);
            }
        } catch (error) {
            console.error('Bambi Obeys: sleep state load failed', error);
        }

        try {
            const saved = JSON.parse(
                localStorage.getItem(CHAT_FORGET_KEY)
            );

            if (saved?.active && Number(saved.cutoff) > 0) {
                chatForgetState.active = true;
                chatForgetState.cutoff = Number(saved.cutoff);
            }
        } catch (error) {
            console.error('Bambi Obeys: chat forget state load failed', error);
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

    function saveChatForgetState() {
        try {
            localStorage.setItem(
                CHAT_FORGET_KEY,
                JSON.stringify(chatForgetState)
            );
        } catch (error) {
            console.error('Bambi Obeys: chat forget state save failed', error);
        }
    }


    // VERSION / UPDATE NOTIFICATIONS
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


    // BC MODSDK
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


    // AUDIO

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

        if (!options.skipCharacterEffect) {
            const sleepIndex = triggerIndexByName('Bambi sleep');
            const wakeIndex = triggerIndexByName('Bambi wake and obey');
            const forgetIndex = triggerIndexByName('Snap and forget');

            if (index === sleepIndex) {
                startBambiSleepState();
            } else if (index === wakeIndex) {
                wakeCharacter(true);
                clearBambiSleepState();
            } else if (index === forgetIndex) {
                activateSnapAndForget();
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


    // CHARACTER SLEEP / AUTO WAKE

    function getLSCGStateSettings() {
        try {
            if (
                typeof Player !== 'undefined' &&
                Player?.LSCG?.StateModule
            ) {
                return Player.LSCG.StateModule;
            }
        } catch {}

        return null;
    }

    function getLSCGSleepConfig() {
        const stateSettings =
            getLSCGStateSettings();

        if (
            !stateSettings ||
            !Array.isArray(stateSettings.states)
        ) {
            return null;
        }

        let config =
            stateSettings.states.find(
                state => state?.type === 'asleep'
            );

        if (!config) {
            config = {
                type: 'asleep',
                active: false,
                activationCount: 0,
                extensions: {}
            };

            stateSettings.states.push(config);
        }

        return config;
    }

    function getLSCGSleepState() {
        try {
            if (
                typeof Player !== 'undefined' &&
                Player?.LSCG?.StateModule?.SleepState
            ) {
                return Player.LSCG.StateModule.SleepState;
            }
        } catch {}

        try {
            if (
                window.LSCG?.StateModule?.SleepState
            ) {
                return window.LSCG.StateModule.SleepState;
            }
        } catch {}

        try {
            if (
                typeof window.LSCG?.getModule === 'function'
            ) {
                const stateModule =
                    window.LSCG.getModule('StateModule');

                if (stateModule?.SleepState) {
                    return stateModule.SleepState;
                }
            }
        } catch {}

        return null;
    }

    function isLSCGImmersive() {
        try {
            const stateSettings =
                getLSCGStateSettings();

            if (
                stateSettings &&
                typeof stateSettings.immersive === 'boolean'
            ) {
                return stateSettings.immersive;
            }
        } catch {}

        try {
            const sleepStateApi =
                getLSCGSleepState();

            const stateModule =
                sleepStateApi?.StateModule;

            if (
                stateModule &&
                typeof stateModule.settings?.immersive === 'boolean'
            ) {
                return stateModule.settings.immersive;
            }
        } catch {}

        return false;
    }

    function addBambiForceKneel() {
        try {
            if (typeof addCustomEffect === 'function') {
                addCustomEffect(
                    Player,
                    'ForceKneel'
                );
                return true;
            }
        } catch {}

        return false;
    }

    function removeBambiForceKneel() {
        try {
            if (typeof removeCustomEffect === 'function') {
                removeCustomEffect(
                    Player,
                    'ForceKneel'
                );
                return true;
            }
        } catch {}

        return false;
    }

    function setBambiSleepExpression(duration) {
        try {
            if (
                typeof CharacterSetFacialExpression !==
                'function'
            ) {
                return;
            }

            if (!!duration) {
                CharacterSetFacialExpression(
                    Player,
                    'Eyes',
                    'Closed',
                    duration / 1000
                );

                CharacterSetFacialExpression(
                    Player,
                    'Emoticon',
                    'Sleep',
                    duration / 1000
                );
            } else {
                CharacterSetFacialExpression(
                    Player,
                    'Eyes',
                    'Closed'
                );

                CharacterSetFacialExpression(
                    Player,
                    'Emoticon',
                    'Sleep'
                );
            }
        } catch (error) {
            console.error(
                'Bambi Obeys: sleep expression failed',
                error
            );
        }
    }

    function fallDownIfPossible() {
        try {
            if (
                typeof PoseSetActive === 'function' &&
                typeof Player !== 'undefined' &&
                typeof Player.CanKneel === 'function' &&
                Player.CanKneel()
            ) {
                PoseSetActive(
                    Player,
                    'Kneel',
                    true
                );
            }
        } catch (error) {
            console.debug(
                'Bambi Obeys: kneel state could not be applied',
                error
            );
        }
    }

    function releaseAllBambiGrabs() {
        // LSCG calls LeashingModule.ReleaseAllLeashingsAsSource().
        // The module is internal to LSCG, so use any exposed equivalent
        // that the current client makes available.
        try {
            const api =
                getLSCGSleepState();

            const module =
                api?.StateModule?.LeashingModule ||
                window.LSCG?.LeashingModule;

            if (
                module &&
                typeof module.ReleaseAllLeashingsAsSource ===
                'function'
            ) {
                module.ReleaseAllLeashingsAsSource();
                return true;
            }
        } catch {}

        try {
            if (
                typeof Player !== 'undefined' &&
                typeof Player.ReleaseAllLeashingsAsSource ===
                'function'
            ) {
                Player.ReleaseAllLeashingsAsSource();
                return true;
            }
        } catch {}

        return false;
    }

    function saveLSCGSleepConfig(
        config
    ) {
        if (!config) return;

        try {
            if (typeof settingsSave === 'function') {
                settingsSave(true);
                return;
            }
        } catch {}

        try {
            if (typeof localStorage !== 'undefined') {
                const playerState =
                    getLSCGStateSettings();

                if (
                    playerState &&
                    typeof playerState === 'object'
                ) {
                    // LSCG owns the actual persistent settings format.
                    // Do not attempt to recreate its complete storage key.
                }
            }
        } catch {}
    }

    function replicateLSCGSleepActivate(
        memberNumber
    ) {
        try {
            SendAction(
                "%NAME% slumps weakly as %PRONOUN% slips into unconciousness."
            );
        } catch {}

        setBambiSleepExpression();

        fallDownIfPossible();

        releaseAllBambiGrabs();

        addBambiForceKneel();

        const config =
            getLSCGSleepConfig();

        if (config) {
            config.active = true;
            config.activatedAt = Date.now();
            config.activatedBy =
                normalizeMemberNumber(memberNumber) || -1;
            config.activationCount =
                Number(config.activationCount) + 1;
            config.duration = undefined;
            saveLSCGSleepConfig(config);
        }
    }

    function replicateLSCGSleepRecover(
        emote = true
    ) {
        try {
            if (emote) {
                SendAction(
                    "%NAME%'s eyelids flutter and start to open sleepily..."
                );
            }
        } catch {}

        try {
            if (
                typeof CharacterSetFacialExpression ===
                'function'
            ) {
                CharacterSetFacialExpression(
                    Player,
                    'Eyes',
                    'Dazed',
                    15
                );

                if (
                    typeof WardrobeGetExpression ===
                    'function' &&
                    WardrobeGetExpression(
                        Player
                    )?.Emoticon ===
                    'Sleep'
                ) {
                    CharacterSetFacialExpression(
                        Player,
                        'Emoticon',
                        null
                    );
                }
            }
        } catch (error) {
            console.error(
                'Bambi Obeys: wake expression failed',
                error
            );
        }

        removeBambiForceKneel();

        const config =
            getLSCGSleepConfig();

        if (config) {
            config.active = false;
            config.recoveredAt = Date.now();
            saveLSCGSleepConfig(config);
        }
    }

    function sleepCharacterIndefinitely() {
        const sleepStateApi =
            getLSCGSleepState();

        // Use LSCG's actual SleepState object whenever
        // the client exposes it.
        if (
            sleepStateApi &&
            typeof sleepStateApi.Activate ===
            'function'
        ) {
            try {
                sleepStateApi.Activate(
                    typeof Player !== 'undefined'
                        ? Player.MemberNumber
                        : -1,
                    undefined,
                    true
                );
                return true;
            } catch (error) {
                console.error(
                    'Bambi Obeys: LSCG sleep activation failed',
                    error
                );
            }
        }

        // Fallback: replicate LSCG's SleepState.Activate().
        replicateLSCGSleepActivate(
            typeof Player !== 'undefined'
                ? Player.MemberNumber
                : -1
        );

        return false;
    }

    function wakeCharacter(
        emote = true
    ) {
        const sleepStateApi =
            getLSCGSleepState();

        if (
            sleepStateApi &&
            typeof sleepStateApi.Recover ===
            'function'
        ) {
            try {
                sleepStateApi.Recover(
                    emote
                );
                return true;
            } catch (error) {
                console.error(
                    'Bambi Obeys: LSCG wake failed',
                    error
                );
            }
        }

        // Fallback: replicate LSCG's SleepState.Recover().
        replicateLSCGSleepRecover(
            emote
        );

        return false;
    }

    function startBambiSleepState() {
        if (sleepState.active) {
            setBambiSleepExpression();
            fallDownIfPossible();
            addBambiForceKneel();
            scheduleRemainingWake();
            return;
        }

        sleepState.active = true;
        sleepState.startedAt = now();

        saveSleepState();

        sleepCharacterIndefinitely();
        scheduleRemainingWake();
    }

    function clearBambiSleepState() {
        if (sleepTimer) {
            clearTimeout(
                sleepTimer
            );
            sleepTimer = null;
        }

        sleepState.active = false;
        sleepState.startedAt = 0;

        saveSleepState();
    }

    function scheduleRemainingWake() {
        if (sleepTimer) {
            clearTimeout(
                sleepTimer
            );
            sleepTimer = null;
        }

        if (!sleepState.active) {
            return;
        }

        if (
            !settings.autoWakeEnabled ||
            Number(settings.autoWakeMinutes) <= 0
        ) {
            // Indefinite sleep, exactly like an LSCG SleepState with no duration.
            if (!getLSCGSleepState()) {
                setBambiSleepExpression();
                fallDownIfPossible();
                addBambiForceKneel();
            }

            return;
        }

        const total =
            Math.max(
                0,
                Number(settings.autoWakeMinutes)
            ) *
            60 *
            1000;

        const elapsed =
            now() -
            sleepState.startedAt;

        const remaining =
            Math.max(
                0,
                total - elapsed
            );

        if (remaining <= 0) {
            performAutoWake();
            return;
        }

        // Keep the exact LSCG sleep state active while the auto-wake timer runs.
        if (!getLSCGSleepState()) {
            setBambiSleepExpression();
            fallDownIfPossible();
            addBambiForceKneel();
        }

        sleepTimer =
            setTimeout(
                performAutoWake,
                remaining
            );
    }

    function performAutoWake() {
        if (!sleepState.active) {
            return;
        }

        wakeCharacter(true);
        clearBambiSleepState();

        const wakeIndex =
            triggerIndexByName(
                'Bambi wake and obey'
            );

        if (wakeIndex >= 0) {
            playTrigger(
                wakeIndex,
                {
                    ignoreLocalSafety: false,
                    trackSleep: false,
                    skipCharacterEffect: true
                }
            );
        }
    }


    // AUTHORITY

    function canTrigger(senderMemberNumber) {
        const sender = normalizeMemberNumber(senderMemberNumber);
        if (!sender) return false;

        if (settings.authorityMode === 'anyone') {
            return true;
        }

        // The Bambi whitelist is only active while Whitelist only is selected.
        if (settings.authorityMode === 'whitelist') {
            return getWhitelist().has(sender);
        }

        const senderLevel = getBambiAccessLevel(sender);
        const minimumLevel = getAuthorityMinimumLevel();

        return senderLevel <= minimumLevel;
    }


    // NETWORK

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
                Sender: typeof Player !== 'undefined' ? Player.MemberNumber : 0,
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

    function announcePresence() {
        const myNumber = normalizeMemberNumber(
            typeof Player !== 'undefined' ? Player.MemberNumber : 0
        );
        if (!myNumber) return;

        sendBambiRoomMessage(null, {
            type: 'presence',
            memberNumber: myNumber,
            name: typeof Player !== 'undefined' ? Player.Name || 'Bambi' : 'Bambi',
            labelXOffset: Number(settings.labelXOffset),
            labelYOffset: Number(settings.labelYOffset)
        });
    }

    function createTriggerRequestId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function sendTriggerToUser(memberNumber, triggerIndex) {
        const target = normalizeMemberNumber(memberNumber);
        const myNumber = normalizeMemberNumber(
            typeof Player !== 'undefined' ? Player.MemberNumber : 0
        );

        if (!target) {
            setStatus('Enter a Member Number or choose someone in the room.');
            return;
        }

        if (target === myNumber) {
            setStatus('Use Test Trigger Locally for yourself.');
            return;
        }

        if (!TRIGGERS[triggerIndex]) return;

        if (!settings.outOfRoomTriggers && !isInCurrentRoom(target)) {
            setStatus('Out of room triggers are disabled.');
            return;
        }

        const requestId = createTriggerRequestId();

        pendingTriggerRequests.set(
            requestId,
            {
                memberNumber: target,
                triggerIndex
            }
        );

        const sent =
            sendBambiAccountMessage(
                target,
                {
                    type: 'trigger',
                    targetMemberNumber: target,
                    triggerIndex,
                    requestId,
                    senderName:
                        typeof Player !== 'undefined'
                            ? Player.Name || 'Bambi'
                            : 'Bambi'
                }
            );

        if (!sent) {
            pendingTriggerRequests.delete(requestId);
            setStatus('Could not send the trigger.');
            return;
        }

        setStatus('Sent');

        setTimeout(() => {
            if (!pendingTriggerRequests.has(requestId)) {
                return;
            }

            pendingTriggerRequests.delete(requestId);
            setStatus('No response');
        }, 8000);
    }

    function packetIsForMe(payload) {
        if (!payload || typeof payload !== 'object') return false;

        if (payload.type === 'presence') return true;

        const myNumber = normalizeMemberNumber(
            typeof Player !== 'undefined' ? Player.MemberNumber : 0
        );
        const target = normalizeMemberNumber(payload.targetMemberNumber);

        return target !== 0 && target === myNumber;
    }


    // SNAP AND FORGET

    function randomGagWord(length) {
        const syllables = [
            'mm',
            'mph',
            'ph',
            'hm',
            'mh',
            'mp',
            'ah',
            'uh',
            'eh',
            'am',
            'um',
            'hy',
            'py',
            'my',
            'ha',
            'pa',
            'ma'
        ];

        const targetLength = Math.max(3, Math.min(12, Number(length) || 4));
        let result = '';

        while (result.length < targetLength) {
            result += syllables[Math.floor(Math.random() * syllables.length)];
        }

        return result.slice(0, targetLength);
    }

    function muffleGagText(text) {
        return String(text || '').replace(/[\p{L}\p{N}]+/gu, token => {
            return randomGagWord(token.length);
        });
    }

    function getChatDOMContainers() {
        const selectors = [
            '#TextAreaChatLog',
            '#TextAreaChatLog2',
            '#ChatRoomChatLog',
            '.ChatRoomChatLog',
            '[id*="ChatLog" i]'
        ];

        const found = [];
        const seen = new Set();

        for (const selector of selectors) {
            let nodes = [];
            try {
                nodes = document.querySelectorAll(selector);
            } catch {
                nodes = [];
            }

            for (const node of nodes) {
                if (!node || seen.has(node)) continue;
                seen.add(node);
                found.push(node);
            }
        }

        return found.filter(node => {
            const text = String(node.textContent || '').trim();
            return text.length > 0;
        });
    }

    function getDOMNodeTime(node) {
        if (!node || typeof node.getAttribute !== 'function') return null;

        const values = [
            node.getAttribute('data-time'),
            node.getAttribute('data-timestamp'),
            node.getAttribute('data-created'),
            node.getAttribute('data-date')
        ];

        for (const value of values) {
            if (!value) continue;

            const asNumber = Number(value);
            if (Number.isFinite(asNumber)) {
                return asNumber < 10000000000 ? asNumber * 1000 : asNumber;
            }

            const parsed = Date.parse(value);
            if (Number.isFinite(parsed)) return parsed;
        }

        return null;
    }

    function muffleHistoricalChatDOM() {
        if (!chatForgetState.active || !chatForgetState.cutoff) return;

        for (const containerElement of getChatDOMContainers()) {
            for (const child of [...containerElement.childNodes]) {
                const timestamp = getDOMNodeTime(child);

                if (timestamp !== null && timestamp <= chatForgetState.cutoff) {
                    const signature = getNodeSignature(child);
                    if (signature) forgottenChatSignatures.add(signature);
                    forgottenChatObjects.add(child);
                    muffleDOMTree(child);
                }
            }
        }
    }

    function getNodeSignature(node) {
        if (!node) return '';

        const id = node.id || '';
        const classes = typeof node.className === 'string'
            ? node.className
            : '';
        const text = String(node.textContent || '').trim();
        const member = node.getAttribute?.('data-membernumber') ||
            node.getAttribute?.('data-member-number') || '';
        const time = node.getAttribute?.('data-time') || '';

        return `${id}|${classes}|${member}|${time}|${text}`;
    }

    function muffleDOMTree(node) {
        if (!node) return;

        if (node.nodeType === 3) {
            node.nodeValue = muffleGagText(node.nodeValue || '');
            return;
        }

        if (node.nodeType !== 1) return;

        const tag = String(node.tagName || '').toLowerCase();
        if (tag === 'script' || tag === 'style') return;

        // Snap and Forget keeps the forgotten chat visibly pink so it is
        // clearly separated from anything said after the trigger.
        try {
            node.style.color = '#ff69b4';
        } catch {}

        for (const child of [...node.childNodes]) {
            muffleDOMTree(child);
        }
    }

    function muffleExistingChatDOM() {
        for (const containerElement of getChatDOMContainers()) {
            for (const child of [...containerElement.childNodes]) {
                const signature = getNodeSignature(child);
                if (signature) forgottenChatSignatures.add(signature);
                forgottenChatObjects.add(child);
                muffleDOMTree(child);
            }
        }
    }

    function getChatLogArrays() {
        const names = [
            'ChatRoomChatLog',
            'ChatRoomChatLogData',
            'ChatRoomLog',
            'ChatRoomChatHistory'
        ];

        const result = [];
        const seen = new Set();

        for (const name of names) {
            try {
                const value = window[name];
                if (!Array.isArray(value) || seen.has(value)) continue;
                seen.add(value);
                result.push(value);
            } catch {}
        }

        return result;
    }

    function getChatEntryTime(entry) {
        if (!entry || typeof entry !== 'object') return null;

        const candidates = [
            entry.Timestamp,
            entry.TimeStamp,
            entry.Time,
            entry.CreationTime,
            entry.Date,
            entry.timestamp,
            entry.time,
            entry.date
        ];

        for (const candidate of candidates) {
            if (typeof candidate === 'number' && Number.isFinite(candidate)) {
                return candidate < 10000000000 ? candidate * 1000 : candidate;
            }

            if (typeof candidate === 'string') {
                const parsed = Date.parse(candidate);
                if (Number.isFinite(parsed)) return parsed;

                const numeric = Number(candidate);
                if (Number.isFinite(numeric)) {
                    return numeric < 10000000000 ? numeric * 1000 : numeric;
                }
            }
        }

        return null;
    }

    function muffleChatObject(entry) {
        if (!entry || typeof entry !== 'object') return;
        if (forgottenChatObjects.has(entry)) return;

        forgottenChatObjects.add(entry);

        const nameFields = [
            'Name',
            'MemberName',
            'SenderName',
            'Nickname',
            'name',
            'memberName',
            'senderName',
            'nickname'
        ];

        const textFields = [
            'Content',
            'Message',
            'Text',
            'content',
            'message',
            'text'
        ];

        for (const field of nameFields) {
            if (typeof entry[field] === 'string') {
                entry[field] = randomGagWord(4 + Math.floor(Math.random() * 5));
            }
        }

        for (const field of textFields) {
            if (typeof entry[field] === 'string') {
                entry[field] = muffleGagText(entry[field]);
            }
        }

        // Keep the chat entry pink when Bondage Club exposes a style field.
        try {
            if (typeof entry.Style === 'object' && entry.Style) {
                entry.Style.Color = '#ff69b4';
            } else if (typeof entry.style === 'object' && entry.style) {
                entry.style.color = '#ff69b4';
            }
        } catch {}
    }

    function muffleHistoricalChatData() {
        if (!chatForgetState.active || !chatForgetState.cutoff) return;

        for (const log of getChatLogArrays()) {
            for (const entry of log) {
                const timestamp = getChatEntryTime(entry);

                if (timestamp !== null && timestamp <= chatForgetState.cutoff) {
                    muffleChatObject(entry);
                }
            }
        }
    }

    function installChatForgetObserver() {
        if (chatForgetObserver || typeof MutationObserver === 'undefined') return;

        const containers = getChatDOMContainers();
        if (containers.length === 0) return;

        chatForgetObserver = new MutationObserver(mutations => {
            if (!chatForgetState.active) return;

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!node || node.nodeType !== 1) continue;

                    const signature = getNodeSignature(node);
                    if (signature && forgottenChatSignatures.has(signature)) {
                        forgottenChatObjects.add(node);
                        muffleDOMTree(node);
                    }
                }
            }
        });

        for (const node of containers) {
            try {
                chatForgetObserver.observe(node, {
                    childList: true,
                    subtree: true
                });
            } catch {}
        }
    }

    function activateSnapAndForget() {
        chatForgetState.active = true;
        chatForgetState.cutoff = now();
        saveChatForgetState();

        muffleExistingChatDOM();
        muffleHistoricalChatData();
        installChatForgetObserver();
    }

    function restoreSnapAndForget() {
        if (!chatForgetState.active) return;

        // After a page refresh, use timestamps when the chat exposes them
        // so messages that happened after Snap and Forget stay clear.
        muffleHistoricalChatData();
        muffleHistoricalChatDOM();
        installChatForgetObserver();
    }


    // MESSAGE HANDLING
    function processBambiPayload(senderMemberNumber, payload, senderName = '') {
        if (!payload || typeof payload !== 'object') return false;

        const sender = normalizeMemberNumber(senderMemberNumber);
        if (!sender) return false;

        const myNumber = normalizeMemberNumber(
            typeof Player !== 'undefined' ? Player.MemberNumber : 0
        );

        if (sender === myNumber) return true;

        const resolvedSenderName =
            senderName ||
            payload.senderName ||
            getCharacterName(sender) ||
            'Unknown';

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

        if (payload.type === 'trigger_result') {
            const requestId = String(payload.requestId || '');
            if (!requestId) return true;

            const pending = pendingTriggerRequests.get(requestId);
            if (!pending) return true;

            pendingTriggerRequests.delete(requestId);

            if (payload.accepted === true) {
                const targetName = isInCurrentRoom(sender)
                    ? getCharacterName(sender)
                    : `#${sender}`;

                setStatus(
                    `Sent "${TRIGGERS[pending.triggerIndex]?.name || 'trigger'}" to ${targetName}`
                );
            } else {
                setStatus('No access');
            }

            return true;
        }

        if (!packetIsForMe(payload)) return true;

        if (payload.type === 'trigger') {
            const index = Number(payload.triggerIndex);

            if (
                !Number.isInteger(index) ||
                !TRIGGERS[index]
            ) {
                return true;
            }

            const resultRequestId =
                String(payload.requestId || '');

            const sendResult = (accepted, reason = '') => {
                if (!resultRequestId) return;

                sendBambiAccountMessage(
                    sender,
                    {
                        type: 'trigger_result',
                        targetMemberNumber: sender,
                        requestId: resultRequestId,
                        accepted,
                        reason
                    }
                );
            };

            if (!settings.acceptIncoming) {
                setStatus('No access');
                sendResult(false, 'no_access');
                return true;
            }

            if (
                !settings.outOfRoomTriggers &&
                !isInCurrentRoom(sender)
            ) {
                setStatus('No access');
                sendResult(false, 'out_of_room');
                return true;
            }

            if (!canTrigger(sender)) {
                console.log(
                    'Bambi Obeys: trigger rejected by authority mode:',
                    settings.authorityMode,
                    'sender:',
                    sender,
                    'role:',
                    getRoleName(sender)
                );

                setStatus('No access');
                sendResult(false, 'no_access');
                return true;
            }

            sendResult(true);
            playTrigger(
                index,
                {
                    senderMemberNumber: sender
                }
            );

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

        return true;
    }

    function installChatForgetHook() {
        // ChatRoomMessage is already hooked below. This helper only ensures
        // historical data is re-muffled if Bondage Club redraws its log.
        if (!chatForgetState.active) return;
        muffleHistoricalChatData();
        installChatForgetObserver();
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
                            installChatForgetHook();
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

                        // Snap and forget only affects messages that existed at
                        // the moment the trigger fired. New chat is left alone.
                        installChatForgetHook();
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

    // CHARACTER SLEEP HOOKS

    function installBambiSleepHooks() {
        if (bambiSleepHooksInstalled) {
            return true;
        }

        if (
            !bambiMod ||
            typeof bambiMod.hookFunction !== 'function'
        ) {
            return false;
        }

        const hook = (name, priority, callback) => {
            try {
                bambiMod.hookFunction(
                    name,
                    priority,
                    callback
                );
                return true;
            } catch (error) {
                console.debug(
                    `Bambi Obeys: ${name} sleep hook unavailable`,
                    error
                );
                return false;
            }
        };

        hook(
            'ChatRoomSync',
            10,
            (args, next) => {
                const result = next(args);

                if (sleepState.active) {
                    setBambiSleepExpression();
                    fallDownIfPossible();
                    addBambiForceKneel();
                }

                return result;
            }
        );

        hook(
            'TimerProcess',
            10,
            (args, next) => {
                const result = next(args);

                if (sleepState.active) {
                    setBambiSleepExpression();
                    fallDownIfPossible();
                    addBambiForceKneel();
                }

                return result;
            }
        );

        hook(
            'Player.CanTalk',
            1,
            (args, next) => {
                if (sleepState.active) {
                    return false;
                }

                return next(args);
            }
        );

        // LSCG's SleepState only restricts walking while immersive.
        hook(
            'Player.CanWalk',
            1,
            (args, next) => {
                if (
                    sleepState.active &&
                    isLSCGImmersive()
                ) {
                    return false;
                }

                return next(args);
            }
        );

        hook(
            'Player.CanChangeClothesOn',
            1,
            (args, next) => {
                if (sleepState.active) {
                    return false;
                }

                return next(args);
            }
        );

        hook(
            'Player.GetDeafLevel',
            1,
            (args, next) => {
                if (sleepState.active) {
                    return 4;
                }

                return next(args);
            }
        );

        // LSCG uses the blind level to hide the room view while still
        // keeping the sleeping character visible. Bambi uses the same
        // mechanism, but always uses the highest sleep blindness level.
        hook(
            'Player.GetBlindLevel',
            1,
            (args, next) => {
                if (sleepState.active) {
                    return 3;
                }

                return next(args);
            }
        );

        hook(
            'Player.CanInteract',
            1,
            (args, next) => {
                if (sleepState.active) {
                    return false;
                }

                return next(args);
            }
        );

        hook(
            'InventoryGroupIsBlockedForCharacter',
            1,
            (args, next) => {
                if (sleepState.active) {
                    return true;
                }

                return next(args);
            }
        );

        hook(
            'ChatRoomCanAttemptStand',
            1,
            (args, next) => {
                if (sleepState.active) {
                    return false;
                }

                return next(args);
            }
        );

        hook(
            'PoseCanChangeUnaided',
            6,
            (args, next) => {
                if (sleepState.active) {
                    return false;
                }

                return next(args);
            }
        );

        hook(
            'DialogFacialExpressionsLoad',
            5,
            (args, next) => {
                if (sleepState.active) {
                    return;
                }

                return next(args);
            }
        );

        // These are the same expression-menu restrictions LSCG installs
        // for the Eyes and Emoticon restrictions on SleepState.
        try {
            if (
                typeof DialogSelfMenuMapping !== 'undefined' &&
                DialogSelfMenuMapping?.Expression?.clickStatusCallbacks
            ) {
                DialogSelfMenuMapping.Expression.clickStatusCallbacks.bambiObeys =
                    (C, clickedExpression) => {
                        if (!sleepState.active) return null;

                        if (clickedExpression.Group !== 'Emoticon') {
                            return 'Movement restricted by LSCG';
                        }

                        switch (clickedExpression.Group) {
                            case 'Eyes':
                                return 'Eyes restricted by LSCG';
                            case 'Emoticon':
                                return 'Emoticon restricted by LSCG';
                            default:
                                return null;
                        }
                    };
            }

            const menubarValidator = () => {
                if (!sleepState.active) {
                    return null;
                }

                return {
                    state: 'disabled',
                    status: 'Movement restricted by LSCG'
                };
            };

            if (
                typeof DialogSelfMenuMapping !== 'undefined' &&
                DialogSelfMenuMapping?.Expression?.menubarEventListeners
            ) {
                const blink =
                    DialogSelfMenuMapping.Expression.menubarEventListeners.blink;
                const clear =
                    DialogSelfMenuMapping.Expression.menubarEventListeners.clear;

                if (blink) {
                    (blink.validate ??= {}).bambiObeys = menubarValidator;
                }

                if (clear) {
                    (clear.validate ??= {}).bambiObeys = menubarValidator;
                }
            }
        } catch (error) {
            console.debug(
                'Bambi Obeys: expression menu restrictions unavailable',
                error
            );
        }

        hook(
            'ServerSend',
            5,
            (args, next) => {
                if (
                    sleepState.active &&
                    args[0] === 'ChatRoomChat' &&
                    args[1]?.Type === 'Chat' &&
                    String(args[1]?.Content || '')[0] !== '('
                ) {
                    try {
                        if (typeof SendAction === 'function') {
                            SendAction(
                                [
                                    "%NAME%'s eyes move dreamily under %POSSESSIVE% closed eyelids...",
                                    "%NAME% exhales slowly, fully relaxed...",
                                    "%NAME%'s muscles twitch weakly in %POSSESSIVE% sleep...",
                                    "%NAME% moans softly and relaxes..."
                                ][
                                    Math.floor(
                                        Math.random() * 4
                                    )
                                ]
                            );
                        }
                    } catch {}

                    return null;
                }

                return next(args);
            }
        );

        bambiSleepHooksInstalled = true;
        return true;
    }


    // BAMBI LABELS
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


    // UI HELPERS

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


    // AUTHORITY TAB

    function buildAuthorityTab(content) {
        const heading = document.createElement('div');
        heading.textContent = 'Trigger authority';
        heading.style.fontWeight = 'bold';
        heading.style.marginBottom = '7px';
        content.appendChild(heading);

        const description = document.createElement('div');
        description.textContent =
            'Choose who is allowed to send Bambi triggers. This does not depend on connections.';
        Object.assign(description.style, {
            color: '#d994ba',
            fontSize: '11px',
            lineHeight: '1.4',
            marginBottom: '10px'
        });
        content.appendChild(description);

        const modes = [
            ['owner', 'Owner only'],
            ['lover', 'Lovers only'],
            ['friends', 'Friends only'],
            ['whitelist', 'Whitelist only'],
            ['anyone', 'Anyone']
        ];

        for (const [value, labelText] of modes) {
            const row = document.createElement('label');
            Object.assign(row.style, {
                display: 'flex',
                gap: '7px',
                marginBottom: '7px',
                cursor: 'pointer'
            });

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'bambi-authority';
            input.value = value;
            input.checked =
                settings.authorityMode === value;

            input.addEventListener('change', () => {
                if (!input.checked) return;

                settings.authorityMode = value;

                saveSettings();
                refreshAllUI();
            });

            const label = document.createElement('span');
            label.textContent = labelText;

            row.appendChild(input);
            row.appendChild(label);
            content.appendChild(row);
        }

        whitelistLabelElement =
            document.createElement('div');

        whitelistLabelElement.textContent =
            'Bambi whitelist Member Numbers';

        Object.assign(
            whitelistLabelElement.style,
            {
                color: '#ffb8d9',
                fontSize: '12px',
                marginTop: '12px',
                marginBottom: '4px'
            }
        );

        content.appendChild(
            whitelistLabelElement
        );

        whitelistInput =
            document.createElement('textarea');

        whitelistInput.value =
            settings.whitelist;

        whitelistInput.placeholder =
            '12345, 67890, 13579';

        Object.assign(
            whitelistInput.style,
            {
                width: '100%',
                minHeight: '60px',
                boxSizing: 'border-box',
                background: '#fff0f7',
                color: '#48172f',
                border: '1px solid #ff69b4',
                borderRadius: '5px',
                padding: '6px',
                resize: 'vertical',
                marginBottom: '4px'
            }
        );

        whitelistInput.addEventListener(
            'change',
            () => {
                // Keep the saved list even when the mode changes.
                settings.whitelist =
                    whitelistInput.value;

                saveSettings();
                refreshAllUI();
            }
        );

        content.appendChild(
            whitelistInput
        );

        const whitelistNote =
            document.createElement('div');

        whitelistNote.textContent =
            'Whitelist entries are only active while Whitelist only is selected. Your saved IDs stay here when another authority mode is selected.';

        Object.assign(
            whitelistNote.style,
            {
                fontSize: '10px',
                color: '#b77d9e',
                lineHeight: '1.4',
                marginBottom: '8px'
            }
        );

        content.appendChild(
            whitelistNote
        );

        const roleHeading =
            document.createElement('div');

        roleHeading.textContent =
            'Selected target access';

        Object.assign(
            roleHeading.style,
            {
                color: '#ffb8d9',
                fontSize: '12px',
                marginTop: '8px',
                marginBottom: '4px'
            }
        );

        content.appendChild(
            roleHeading
        );

        authorityRoleStatus =
            document.createElement('div');

        Object.assign(
            authorityRoleStatus.style,
            {
                fontSize: '11px',
                color: '#d994ba',
                lineHeight: '1.4',
                minHeight: '34px'
            }
        );

        content.appendChild(
            authorityRoleStatus
        );

        const note =
            document.createElement('div');

        note.textContent =
            'Authority follows BCX access levels when available. Higher-authority roles retain access to lower minimum levels, the same way BCX permissions work.';

        Object.assign(
            note.style,
            {
                fontSize: '10px',
                color: '#b77d9e',
                lineHeight: '1.4',
                marginTop: '8px'
            }
        );

        content.appendChild(note);

        refreshAuthorityControls();
    }


    // TRIGGERS TAB

    function buildTriggersTab(content) {
        const targetLabel = document.createElement('div');
        targetLabel.textContent = 'Target';
        Object.assign(targetLabel.style, {
            color: '#ffb8d9',
            fontSize: '12px',
            marginBottom: '4px'
        });
        content.appendChild(targetLabel);

        targetSelect = document.createElement('select');
        styleSelect(targetSelect);
        targetSelect.addEventListener('change', () => {
            selectedTarget = targetSelect.value;
            if (targetMemberInput) targetMemberInput.value = '';
            refreshAuthorityRoleStatus();
        });
        content.appendChild(targetSelect);

        const remoteLabel = document.createElement('div');
        remoteLabel.textContent = 'Or enter a Member Number';
        Object.assign(remoteLabel.style, {
            color: '#ffb8d9',
            fontSize: '11px',
            marginTop: '4px',
            marginBottom: '4px'
        });
        content.appendChild(remoteLabel);

        targetMemberInput = document.createElement('input');
        targetMemberInput.type = 'number';
        targetMemberInput.min = '1';
        targetMemberInput.placeholder = 'Member Number';
        Object.assign(targetMemberInput.style, {
            width: '100%',
            padding: '7px',
            marginBottom: '8px',
            boxSizing: 'border-box',
            background: '#fff0f7',
            color: '#48172f',
            border: '1px solid #ff69b4',
            borderRadius: '5px'
        });

        targetMemberInput.addEventListener('input', () => {
            const value = normalizeMemberNumber(targetMemberInput.value);
            selectedTarget = value ? String(value) : '';
            if (targetSelect) targetSelect.value = '';
            refreshAuthorityRoleStatus();
        });

        content.appendChild(targetMemberInput);

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
            minHeight: '46px',
            marginBottom: '8px'
        });
        content.appendChild(triggerDescription);

        content.appendChild(
            makeButton(
                '▶ Send Trigger',
                () => {
                    const inputTarget = normalizeMemberNumber(targetMemberInput?.value);
                    const finalTarget = inputTarget || normalizeMemberNumber(selectedTarget);

                    if (!finalTarget) {
                        setStatus('Choose a target or enter a Member Number.');
                        return;
                    }

                    sendTriggerToUser(finalTarget, selectedTrigger);
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

        const targetingNote = document.createElement('div');
        targetingNote.textContent =
            'Cross-server targets work through the Member Number field when out-of-room triggers are enabled.';
        Object.assign(targetingNote.style, {
            fontSize: '10px',
            color: '#b77d9e',
            lineHeight: '1.4'
        });
        content.appendChild(targetingNote);

        refreshTriggerDescription();
    }

    function refreshTriggerDescription() {
        if (!triggerDescription) return;
        triggerDescription.textContent =
            TRIGGERS[selectedTrigger]?.description || '';
    }


    function refreshAuthorityControls() {
        const whitelistEnabled =
            settings.authorityMode === 'whitelist';

        if (whitelistInput) {
            whitelistInput.disabled =
                !whitelistEnabled;

            whitelistInput.style.background =
                whitelistEnabled
                    ? '#fff0f7'
                    : '#5a4a52';

            whitelistInput.style.color =
                whitelistEnabled
                    ? '#48172f'
                    : '#aaa';

            whitelistInput.style.borderColor =
                whitelistEnabled
                    ? '#ff69b4'
                    : '#777';

            whitelistInput.style.cursor =
                whitelistEnabled
                    ? 'text'
                    : 'not-allowed';

            whitelistInput.style.opacity =
                whitelistEnabled
                    ? '1'
                    : '0.55';
        }

        if (whitelistLabelElement) {
            whitelistLabelElement.style.color =
                whitelistEnabled
                    ? '#ffb8d9'
                    : '#777';

            whitelistLabelElement.style.opacity =
                whitelistEnabled
                    ? '1'
                    : '0.65';
        }
    }

    function refreshAuthorityRoleStatus() {
        if (!authorityRoleStatus) return;

        const target = normalizeMemberNumber(
            targetMemberInput?.value || selectedTarget
        );

        if (!target) {
            authorityRoleStatus.textContent =
                `Current authority: ${getAuthorityModeLabel()}. Select a target to inspect their role.`;
            return;
        }

        const allowed = canTrigger(target);
        const role = getRoleName(target);
        const name = isInCurrentRoom(target)
            ? getCharacterName(target)
            : `Member #${target}`;

        authorityRoleStatus.textContent =
            `${name}: ${role}. ${allowed ? 'Allowed to send triggers.' : 'Not allowed to send triggers.'}`;
    }


    // LIMITS TAB

    function buildLimitsTab(content) {
        const heading = document.createElement('div');
        heading.textContent = 'Trigger limits';
        heading.style.fontWeight = 'bold';
        heading.style.marginBottom = '8px';
        content.appendChild(heading);

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

        content.appendChild(
            makeCheckbox(
                'Out of room triggers',
                settings.outOfRoomTriggers,
                checked => {
                    settings.outOfRoomTriggers = checked;
                    saveSettings();
                    refreshAllUI();
                }
            )
        );

        const rangeNote = document.createElement('div');
        rangeNote.textContent =
            'When disabled, a trigger sender must be in the same room as Bambi. Cross-server or cross-room trigger packets are rejected.';
        Object.assign(rangeNote.style, {
            fontSize: '10px',
            color: '#b77d9e',
            lineHeight: '1.4',
            marginBottom: '10px'
        });
        content.appendChild(rangeNote);

        const autoHeading = document.createElement('div');
        autoHeading.textContent = 'Sleep limit';
        autoHeading.style.fontWeight = 'bold';
        autoHeading.style.margin = '8px 0 7px';
        content.appendChild(autoHeading);

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
                value => value === 0 ? 'Indefinite' : `${value} min`,
                value => {
                    settings.autoWakeMinutes = value;
                    saveSettings();
                    scheduleRemainingWake();
                }
            )
        );

        const explanation = document.createElement('div');
        explanation.textContent =
            'The Bambi sleep trigger itself is indefinite. This option only controls whether the separate auto-wake timer wakes her later.';
        Object.assign(explanation.style, {
            fontSize: '10px',
            color: '#b77d9e',
            lineHeight: '1.4',
            marginBottom: '10px'
        });
        content.appendChild(explanation);

        const enabledHeading = document.createElement('div');
        enabledHeading.textContent = 'Allowed triggers';
        enabledHeading.style.fontWeight = 'bold';
        enabledHeading.style.margin = '8px 0 7px';
        content.appendChild(enabledHeading);

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


    // CUSTOMIZATION TAB

    function buildCustomizationTab(content) {
        const heading = document.createElement('div');
        heading.textContent = 'Audio';
        heading.style.fontWeight = 'bold';
        heading.style.marginBottom = '8px';
        content.appendChild(heading);

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
        labelHeading.style.margin = '14px 0 7px';
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


    // UI REFRESH


    function refreshTargetDropdown() {
        if (!targetSelect) return;

        const oldValue = selectedTarget;
        targetSelect.innerHTML = '';

        const myNumber = normalizeMemberNumber(
            typeof Player !== 'undefined' ? Player.MemberNumber : 0
        );

        const roomMembers = getRoomCharacters()
            .map(character => ({
                memberNumber: normalizeMemberNumber(character?.MemberNumber),
                name: character?.Nickname || character?.Name || 'Unknown'
            }))
            .filter(entry => entry.memberNumber && entry.memberNumber !== myNumber)
            .sort((a, b) => String(a.name).localeCompare(String(b.name)));

        if (roomMembers.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No other users in room';
            targetSelect.appendChild(option);
        } else {
            for (const entry of roomMembers) {
                const option = document.createElement('option');
                option.value = String(entry.memberNumber);
                option.textContent = entry.name;
                targetSelect.appendChild(option);
            }
        }

        if (
            oldValue &&
            [...targetSelect.options].some(option => option.value === String(oldValue))
        ) {
            targetSelect.value = String(oldValue);
        } else if (roomMembers.length > 0 && !targetMemberInput?.value) {
            selectedTarget = targetSelect.value || '';
        }

        refreshAuthorityRoleStatus();
    }

    function refreshStatus() {
        if (!statusText) return;

        const authority = getAuthorityModeLabel();
        const range = settings.outOfRoomTriggers ? 'Out-of-room: ON' : 'Out-of-room: OFF';
        const bambiState = sleepState.active ? 'Sleeping' : 'Awake';

        statusText.textContent =
            `${authority} · ${range} · ${bambiState}`;
    }

    function refreshAllUI() {
        refreshTargetDropdown();
        refreshStatus();
        refreshTriggerDescription();
        refreshAuthorityControls();
        refreshAuthorityRoleStatus();
    }


    // DRAGGING

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

    // UI

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

        for (const name of ['Authority', 'Triggers', 'Limits', 'Customization']) {
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

        for (const name of ['Authority', 'Triggers', 'Limits', 'Customization']) {
            const content = createContentArea();
            content.style.display = name === activeTab ? 'block' : 'none';
            tabContents[name] = content;
            panel.appendChild(content);
        }

        buildAuthorityTab(tabContents.Authority);
        buildTriggersTab(tabContents.Triggers);
        buildLimitsTab(tabContents.Limits);
        buildCustomizationTab(tabContents.Customization);

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


    // ROOM MAINTENANCE

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

        announcePresence();
        refreshAllUI();
        installChatForgetHook();
    }


    // INIT

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
        installBambiSleepHooks();

        if (!bambiMessageHookInstalled || !bambiDrawHookInstalled || !bambiSleepHooksInstalled || !window.__BAMBI_OBEYS_SYNC_HOOK_INSTALLED__ || !window.__BAMBI_OBEYS_ACCOUNT_BEEP_HOOK_INSTALLED__) {
            if (initAttempts > 1200) clearInterval(initInterval);
            return;
        }

        clearInterval(initInterval);

        createUI();
        scheduleRemainingWake();
        restoreSnapAndForget();
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
