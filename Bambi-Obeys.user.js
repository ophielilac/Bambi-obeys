// ==UserScript==
// @name         Bambi Obeys
// @namespace    BC-Hypnosis
// @version      1.4.5
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
            file: "Bambi Focus.m4a"
        },
        {
            name: "Bambi Freeze",
            file: "Bambi Freeze.m4a"
        },
        {
            name: "Bambi Reset",
            file: "Bambi Reset.m4a"
        },
        {
            name: "Bambi does as she's told",
            file: "Bambi does as she's told.m4a"
        },
        {
            name: "Bambi sleep",
            file: "Bambi sleep.m4a"
        },
        {
            name: "Bambi wake and obey",
            file: "Bambi wake and obey.m4a"
        },
        {
            name: "Blonde Moment",
            file: "Blonde Moment.m4a"
        },
        {
            name: "Drop for cock",
            file: "Drop for cock.m4a"
        },
        {
            name: "Good girl",
            file: "Good girl.m4a"
        },
        {
            name: "Safe and Secure",
            file: "Safe and Secure.m4a"
        },
        {
            name: "Snap and forget",
            file: "Snap and forget.m4a"
        },
        {
            name: "Zap cock drain obey",
            file: "Zap cock drain obey.m4a"
        },
        {
            name: "Bambi Obey",
            file: "Bambi Obeys.m4a"
        },
        {
            name: "Airhead barbie",
            file: "Airhead barbie.m4a"
        },
        {
            name: "Braindead bobblehead",
            file: "Braindead bobblehead.m4a"
        },
        {
            name: "Cockblank lovedoll",
            file: "Cockblank lovedoll.m4a"
        }
    ];

    const SETTINGS_KEY =
        "bambiObeysSettings_v3";

    const CONNECTIONS_KEY =
        "bambiObeysConnections_v3";

    const PENDING_KEY =
        "bambiObeysPending_v3";

    const PROTOCOL =
        "BAMBI_OBEYS_V1";

    const CONNECT_COMMAND =
        ":Bambi Connect";

    const DISCONNECT_COMMAND =
        ":Bambi Disconnect";

    // =========================================================
    // STATE
    // =========================================================

    let selectedTrigger = 0;
    let selectedTarget = "";

    let audio = null;

    let panelOpen = false;

    let socketHookInstalled = false;

    let targetSelect = null;
    let connectionStatus = null;
    let pendingStatus = null;

    let connectedUsers = new Map();
    let pendingRequests = new Map();

    let settings = {
        acceptIncoming: true
    };

    // =========================================================
    // STORAGE
    // =========================================================

    function loadStorage() {

        try {

            const savedSettings =
                JSON.parse(
                    localStorage.getItem(
                        SETTINGS_KEY
                    )
                );

            if (savedSettings) {

                if (
                    typeof savedSettings.acceptIncoming ===
                    "boolean"
                ) {
                    settings.acceptIncoming =
                        savedSettings.acceptIncoming;
                }

            }

        } catch (error) {

            console.error(
                "Bambi Obeys: settings load failed",
                error
            );

        }

        try {

            const savedConnections =
                JSON.parse(
                    localStorage.getItem(
                        CONNECTIONS_KEY
                    )
                );

            if (Array.isArray(savedConnections)) {

                for (
                    const connection
                    of savedConnections
                ) {

                    if (
                        connection &&
                        Number.isFinite(
                            Number(connection.memberNumber)
                        )
                    ) {

                        connectedUsers.set(
                            Number(
                                connection.memberNumber
                            ),
                            {
                                memberNumber:
                                    Number(
                                        connection.memberNumber
                                    ),

                                name:
                                    connection.name ||
                                    "Unknown"
                            }
                        );
                    }
                }
            }

        } catch (error) {

            console.error(
                "Bambi Obeys: connections load failed",
                error
            );

        }

        try {

            const savedPending =
                JSON.parse(
                    localStorage.getItem(
                        PENDING_KEY
                    )
                );

            if (Array.isArray(savedPending)) {

                for (
                    const request
                    of savedPending
                ) {

                    if (
                        request &&
                        Number.isFinite(
                            Number(request.memberNumber)
                        )
                    ) {

                        pendingRequests.set(
                            Number(
                                request.memberNumber
                            ),
                            {
                                memberNumber:
                                    Number(
                                        request.memberNumber
                                    ),

                                name:
                                    request.name ||
                                    "Unknown"
                            }
                        );
                    }
                }
            }

        } catch (error) {

            console.error(
                "Bambi Obeys: pending load failed",
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

    function saveSettings() {

        try {

            localStorage.setItem(
                SETTINGS_KEY,
                JSON.stringify(settings)
            );

        } catch (error) {

            console.error(
                "Bambi Obeys: settings save failed",
                error
            );

        }
    }

    // =========================================================
    // AUDIO
    // =========================================================

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

    function playTrigger(index) {

        const url =
            getTriggerURL(index);

        if (!url) {
            console.error(
                "Bambi Obeys: invalid trigger",
                index
            );
            return;
        }

        console.log(
            "Bambi Obeys: playing",
            TRIGGERS[index].name
        );

        if (audio) {

            audio.pause();
            audio.currentTime = 0;
            audio.src = "";

            if (audio.parentNode) {
                audio.remove();
            }

            audio = null;
        }

        audio =
            document.createElement("audio");

        audio.src = url;
        audio.volume = 1.0;
        audio.preload = "auto";

        document.body.appendChild(audio);

        audio.onloadeddata = () => {

            console.log(
                "Bambi Obeys: audio loaded",
                TRIGGERS[index].name
            );

        };

        audio.onerror = () => {

            console.error(
                "Bambi Obeys: audio error",
                url,
                audio?.error
            );

        };

        audio.onended = () => {

            if (audio) {

                audio.remove();
                audio = null;

            }

        };

        const promise =
            audio.play();

        if (promise) {

            promise.catch(error => {

                console.error(
                    "Bambi Obeys: playback failed",
                    error
                );

            });

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

        return getRoomCharacters().some(
            character =>
                Number(
                    character.MemberNumber
                ) ===
                Number(memberNumber)
        );
    }

    function getCharacterName(
        memberNumber
    ) {

        const character =
            getRoomCharacters().find(
                c =>
                    Number(
                        c.MemberNumber
                    ) ===
                    Number(memberNumber)
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

    function refreshRoomNames() {

        for (
            const [
                memberNumber,
                user
            ] of connectedUsers
        ) {

            if (isInCurrentRoom(
                memberNumber
            )) {

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

            if (isInCurrentRoom(
                memberNumber
            )) {

                user.name =
                    getCharacterName(
                        memberNumber
                    );

            }

        }

        saveConnections();
        savePendingRequests();

        refreshTargetDropdown();
        updateConnectionStatus();
    }

    // =========================================================
    // BC NETWORK
    // =========================================================

    function sendWhisper(
        memberNumber,
        content
    ) {

        if (
            typeof ServerSend !==
            "function"
        ) {

            console.error(
                "Bambi Obeys: ServerSend unavailable"
            );

            return false;
        }

        try {

            ServerSend(
                "ChatRoomChat",
                {
                    Content: content,
                    Type: "Whisper",
                    Target:
                        Number(
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

    function sendHidden(
        memberNumber,
        payload
    ) {

        if (
            typeof ServerSend !==
            "function"
        ) {

            console.error(
                "Bambi Obeys: ServerSend unavailable"
            );

            return false;
        }

        try {

            ServerSend(
                "ChatRoomChat",
                {
                    Content:
                        PROTOCOL +
                        "|" +
                        JSON.stringify(
                            payload
                        ),

                    Type: "Hidden",

                    Target:
                        Number(
                            memberNumber
                        )
                }
            );

            return true;

        } catch (error) {

            console.error(
                "Bambi Obeys: hidden send failed",
                error
            );

            return false;
        }
    }

    // =========================================================
    // CONNECTION REQUESTS
    // =========================================================

    function requestConnection(
        memberNumber
    ) {

        memberNumber =
            Number(memberNumber);

        if (!memberNumber) {
            return;
        }

        if (
            memberNumber ===
            Number(
                Player.MemberNumber
            )
        ) {
            return;
        }

        const name =
            getCharacterName(
                memberNumber
            );

        if (
            connectedUsers.has(
                memberNumber
            )
        ) {

            console.log(
                "Bambi Obeys:",
                name,
                "is already connected"
            );

            return;
        }

        const sent =
            sendWhisper(
                memberNumber,
                CONNECT_COMMAND
            );

        if (sent) {

            console.log(
                "Bambi Obeys: connection request sent to",
                name
            );

            pendingStatus.textContent =
                `Request sent to ${name}`;

        }
    }

    function acceptConnection(
        memberNumber
    ) {

        memberNumber =
            Number(memberNumber);

        const name =
            pendingRequests.get(
                memberNumber
            )?.name ||
            getCharacterName(
                memberNumber
            );

        pendingRequests.delete(
            memberNumber
        );

        connectedUsers.set(
            memberNumber,
            {
                memberNumber,
                name
            }
        );

        savePendingRequests();
        saveConnections();

        // Tell the other client that we accepted.
        sendHidden(
            memberNumber,
            {
                type: "connection_accepted"
            }
        );

        refreshTargetDropdown();
        updateConnectionStatus();
        refreshPendingUI();

        console.log(
            "Bambi Obeys: connected to",
            name,
            memberNumber
        );
    }

    function disconnectUser(
        memberNumber
    ) {

        memberNumber =
            Number(memberNumber);

        if (
            !connectedUsers.has(
                memberNumber
            )
        ) {
            return;
        }

        connectedUsers.delete(
            memberNumber
        );

        saveConnections();

        sendHidden(
            memberNumber,
            {
                type: "connection_removed"
            }
        );

        refreshTargetDropdown();
        updateConnectionStatus();

        console.log(
            "Bambi Obeys: disconnected from",
            memberNumber
        );
    }

    // =========================================================
    // CONNECTION MESSAGES
    // =========================================================

    function handleHiddenPayload(
        data
    ) {

        if (!data) {
            return;
        }

        if (
            typeof data.Content !==
            "string"
        ) {
            return;
        }

        if (
            !data.Content.startsWith(
                PROTOCOL + "|"
            )
        ) {
            return;
        }

        let payload;

        try {

            payload =
                JSON.parse(
                    data.Content.substring(
                        PROTOCOL.length + 1
                    )
                );

        } catch (error) {

            console.error(
                "Bambi Obeys: malformed protocol packet",
                error
            );

            return;
        }

        const sender =
            Number(data.Sender);

        if (!sender) {
            return;
        }

        if (
            payload.type ===
            "connection_accepted"
        ) {

            const name =
                getCharacterName(
                    sender
                );

            connectedUsers.set(
                sender,
                {
                    memberNumber:
                        sender,

                    name
                }
            );

            saveConnections();
            refreshTargetDropdown();
            updateConnectionStatus();

            console.log(
                "Bambi Obeys: connection accepted by",
                name
            );

            return;
        }

        if (
            payload.type ===
            "connection_removed"
        ) {

            connectedUsers.delete(
                sender
            );

            saveConnections();
            refreshTargetDropdown();
            updateConnectionStatus();

            console.log(
                "Bambi Obeys: connection removed by",
                sender
            );

            return;
        }

        if (
            payload.type ===
            "trigger"
        ) {

            if (
                !settings.acceptIncoming
            ) {

                console.log(
                    "Bambi Obeys: incoming trigger blocked"
                );

                return;
            }

            if (
                !connectedUsers.has(
                    sender
                )
            ) {

                console.warn(
                    "Bambi Obeys: trigger received from unconnected user",
                    sender
                );

                return;
            }

            const triggerIndex =
                Number(
                    payload.trigger
                );

            if (
                !Number.isInteger(
                    triggerIndex
                ) ||
                !TRIGGERS[
                    triggerIndex
                ]
            ) {

                console.warn(
                    "Bambi Obeys: invalid trigger",
                    payload.trigger
                );

                return;
            }

            playTrigger(
                triggerIndex
            );

            return;
        }
    }

    // =========================================================
    // FIND OBJECTS INSIDE SOCKET.IO PAYLOADS
    // =========================================================

    function findMessageObjects(
        value,
        depth = 0,
        results = []
    ) {

        if (
            depth > 6 ||
            value == null
        ) {
            return results;
        }

        if (
            typeof value !==
            "object"
        ) {
            return results;
        }

        if (Array.isArray(value)) {

            for (
                const item
                of value
            ) {

                findMessageObjects(
                    item,
                    depth + 1,
                    results
                );

            }

            return results;
        }

        if (
            typeof value.Content ===
                "string" &&
            (
                value.Type ===
                    "Whisper" ||
                value.Type ===
                    "Hidden" ||
                value.Type ===
                    "Action"
            )
        ) {

            results.push(
                value
            );
        }

        for (
            const key
            of Object.keys(value)
        ) {

            if (
                key === "socket" ||
                key === "io" ||
                key === "_callbacks"
            ) {
                continue;
            }

            try {

                findMessageObjects(
                    value[key],
                    depth + 1,
                    results
                );

            } catch (error) {
                // Ignore inaccessible properties
            }
        }

        return results;
    }

    // =========================================================
    // HANDLE INCOMING WHISPERS
    // =========================================================

    function handleIncomingWhisper(
        data
    ) {

        if (
            !data ||
            typeof data.Content !==
                "string"
        ) {
            return;
        }

        const content =
            data.Content.trim();

        const sender =
            Number(data.Sender);

        if (!sender) {
            return;
        }

        // -----------------------------------------------------
        // CONNECT
        // -----------------------------------------------------

        if (
            data.Type === "Whisper" &&
            content.toLowerCase() ===
                CONNECT_COMMAND.toLowerCase()
        ) {

            const name =
                getCharacterName(
                    sender
                );

            pendingRequests.set(
                sender,
                {
                    memberNumber: sender,
                    name
                }
            );

            savePendingRequests();
            refreshPendingUI();

            console.log(
                "Bambi Obeys: connection request from",
                name
            );

            return;
        }

        // -----------------------------------------------------
        // DISCONNECT
        // -----------------------------------------------------

        if (
            data.Type === "Whisper" &&
            content.toLowerCase() ===
                DISCONNECT_COMMAND.toLowerCase()
        ) {

            connectedUsers.delete(
                sender
            );

            saveConnections();
            refreshTargetDropdown();
            updateConnectionStatus();

            console.log(
                "Bambi Obeys: disconnected by",
                sender
            );

            return;
        }
    }

    // =========================================================
    // SOCKET HOOK
    // =========================================================

    function installSocketHook() {

        if (
            socketHookInstalled
        ) {
            return true;
        }

        if (
            typeof ServerSocket ===
                "undefined" ||
            !ServerSocket ||
            typeof ServerSocket.onAny !==
                "function"
        ) {

            return false;
        }

        ServerSocket.onAny(
            (...args) => {

                try {

                    const messages =
                        findMessageObjects(
                            args
                        );

                    for (
                        const message
                        of messages
                    ) {

                        handleIncomingWhisper(
                            message
                        );

                        handleHiddenPayload(
                            message
                        );

                    }

                } catch (error) {

                    console.error(
                        "Bambi Obeys: socket handler error",
                        error
                    );

                }

            }
        );

        socketHookInstalled =
            true;

        console.log(
            "Bambi Obeys: Socket.IO hook installed"
        );

        return true;
    }

    // =========================================================
    // TRIGGER
    // =========================================================

    function sendTriggerToUser(
        memberNumber,
        triggerIndex
    ) {

        memberNumber =
            Number(memberNumber);

        if (
            !connectedUsers.has(
                memberNumber
            )
        ) {

            console.warn(
                "Bambi Obeys: target is not connected"
            );

            return;
        }

        if (
            !isInCurrentRoom(
                memberNumber
            )
        ) {

            console.warn(
                "Bambi Obeys: target is not currently in the room"
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

        sendHidden(
            memberNumber,
            {
                type: "trigger",
                trigger:
                    triggerIndex
            }
        );

        console.log(
            "Bambi Obeys: sent",
            TRIGGERS[
                triggerIndex
            ].name,
            "to",
            memberNumber
        );
    }

    // =========================================================
    // UI HELPERS
    // =========================================================

    function refreshTargetDropdown() {

        if (!targetSelect) {
            return;
        }

        const previous =
            selectedTarget;

        targetSelect.innerHTML =
            "";

        const available =
            [...connectedUsers.values()]
                .filter(
                    user =>
                        isInCurrentRoom(
                            user.memberNumber
                        )
                )
                .sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name
                        )
                );

        if (
            available.length ===
            0
        ) {

            const option =
                document.createElement(
                    "option"
                );

            option.value = "";

            option.textContent =
                "No connected users";

            targetSelect.appendChild(
                option
            );

            selectedTarget =
                "";

        } else {

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

            const stillExists =
                available.some(
                    user =>
                        String(
                            user.memberNumber
                        ) ===
                        String(previous)
                );

            if (stillExists) {

                targetSelect.value =
                    previous;

                selectedTarget =
                    previous;

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

        updateConnectionStatus();
    }

    function updateConnectionStatus() {

        if (
            !connectionStatus
        ) {
            return;
        }

        const connectedCount =
            [...connectedUsers.values()]
                .filter(
                    user =>
                        isInCurrentRoom(
                            user.memberNumber
                        )
                ).length;

        connectionStatus.textContent =
            `${connectedCount} connected in room`;

    }

    function refreshPendingUI() {

        if (
            !pendingStatus
        ) {
            return;
        }

        const requests =
            [...pendingRequests.values()];

        if (
            requests.length ===
            0
        ) {

            pendingStatus.textContent =
                "";

            return;
        }

        pendingStatus.textContent =
            `${requests.length} pending connection request`;

    }

    // =========================================================
    // UI
    // =========================================================

    function makeDraggable(
        element,
        handle
    ) {

        let dragging = false;

        let offsetX = 0;
        let offsetY = 0;

        handle.addEventListener(
            "mousedown",
            event => {

                if (
                    event.button !== 0
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

                dragging = true;

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

                dragging = false;

                handle.style.cursor =
                    "grab";

                document.body.style.userSelect =
                    "";

            }
        );
    }

    function createUI() {

        // -----------------------------------------------------
        // CONTAINER
        // -----------------------------------------------------

        const container =
            document.createElement(
                "div"
            );

        Object.assign(
            container.style,
            {
                position: "fixed",
                left: "20px",
                top: "100px",
                zIndex: "999999",
                fontFamily:
                    "Arial, sans-serif"
            }
        );

        // -----------------------------------------------------
        // FLOATING BUTTON
        // -----------------------------------------------------

        const floatingButton =
            document.createElement(
                "button"
            );

        floatingButton.textContent =
            "B";

        Object.assign(
            floatingButton.style,
            {
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border:
                    "2px solid #ff8fc7",
                background:
                    "#ff4fa3",
                color: "#fff",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "grab",
                boxShadow:
                    "0 4px 12px rgba(255, 50, 150, 0.4)"
            }
        );

        floatingButton.title =
            "Bambi Obeys";

        // -----------------------------------------------------
        // PANEL
        // -----------------------------------------------------

        const panel =
            document.createElement(
                "div"
            );

        Object.assign(
            panel.style,
            {
                display: "none",
                width: "290px",
                marginTop: "8px",
                background:
                    "#3a1730",
                color: "#fff",
                padding: "12px",
                borderRadius: "10px",
                boxShadow:
                    "0 4px 18px rgba(0,0,0,0.45)",
                border:
                    "1px solid #ff69b4"
            }
        );

        // -----------------------------------------------------
        // HEADER
        // -----------------------------------------------------

        const header =
            document.createElement(
                "div"
            );

        Object.assign(
            header.style,
            {
                display: "flex",
                alignItems: "center",
                justifyContent:
                    "space-between",
                marginBottom: "12px"
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
                fontWeight: "bold",
                fontSize: "16px",
                color: "#ff9bce"
            }
        );

        const closeButton =
            document.createElement(
                "button"
            );

        closeButton.textContent =
            "×";

        Object.assign(
            closeButton.style,
            {
                background:
                    "transparent",
                border: "none",
                color: "#ff9bce",
                fontSize: "22px",
                cursor: "pointer"
            }
        );

        closeButton.onclick =
            () => {

                panelOpen = false;

                panel.style.display =
                    "none";

            };

        header.appendChild(
            title
        );

        header.appendChild(
            closeButton
        );

        panel.appendChild(
            header
        );

        // -----------------------------------------------------
        // CONNECT TO
        // -----------------------------------------------------

        const connectLabel =
            document.createElement(
                "div"
            );

        connectLabel.textContent =
            "Connect to";

        Object.assign(
            connectLabel.style,
            {
                marginBottom: "5px",
                fontSize: "13px",
                color: "#ffb8d9"
            }
        );

        panel.appendChild(
            connectLabel
        );

        const connectSelect =
            document.createElement(
                "select"
            );

        Object.assign(
            connectSelect.style,
            {
                width: "100%",
                padding: "7px",
                marginBottom: "7px",
                boxSizing:
                    "border-box",
                background:
                    "#fff0f7",
                color: "#48172f",
                border:
                    "1px solid #ff69b4",
                borderRadius: "5px"
            }
        );

        panel.appendChild(
            connectSelect
        );

        const connectButton =
            document.createElement(
                "button"
            );

        connectButton.textContent =
            "💗 Send :Bambi Connect";

        Object.assign(
            connectButton.style,
            {
                width: "100%",
                padding: "7px",
                marginBottom: "12px",
                cursor: "pointer",
                background:
                    "#ff4fa3",
                color: "#fff",
                border:
                    "1px solid #ff8fc7",
                borderRadius: "5px"
            }
        );

        connectButton.onclick =
            () => {

                const target =
                    Number(
                        connectSelect.value
                    );

                if (!target) {
                    return;
                }

                requestConnection(
                    target
                );

            };

        panel.appendChild(
            connectButton
        );

        // -----------------------------------------------------
        // PENDING REQUESTS
        // -----------------------------------------------------

        pendingStatus =
            document.createElement(
                "div"
            );

        Object.assign(
            pendingStatus.style,
            {
                fontSize: "11px",
                color: "#ff9bce",
                marginBottom: "6px"
            }
        );

        panel.appendChild(
            pendingStatus
        );

        const acceptBox =
            document.createElement(
                "div"
            );

        Object.assign(
            acceptBox.style,
            {
                marginBottom: "12px"
            }
        );

        function rebuildPendingButtons() {

            acceptBox.innerHTML =
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
                requests.length ===
                0
            ) {

                return;
            }

            const label =
                document.createElement(
                    "div"
                );

            label.textContent =
                "Connection requests";

            Object.assign(
                label.style,
                {
                    fontSize: "13px",
                    color: "#ffb8d9",
                    marginBottom:
                        "5px"
                }
            );

            acceptBox.appendChild(
                label
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
                        display: "flex",
                        gap: "5px",
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

                        rebuildPendingButtons();

                    };

                row.appendChild(
                    name
                );

                row.appendChild(
                    accept
                );

                acceptBox.appendChild(
                    row
                );

            }
        }

        panel.appendChild(
            acceptBox
        );

        // -----------------------------------------------------
        // SEND TO
        // -----------------------------------------------------

        const sendLabel =
            document.createElement(
                "div"
            );

        sendLabel.textContent =
            "Send to";

        Object.assign(
            sendLabel.style,
            {
                marginBottom: "5px",
                fontSize: "13px",
                color: "#ffb8d9"
            }
        );

        panel.appendChild(
            sendLabel
        );

        targetSelect =
            document.createElement(
                "select"
            );

        Object.assign(
            targetSelect.style,
            {
                width: "100%",
                padding: "7px",
                marginBottom: "10px",
                boxSizing:
                    "border-box",
                background:
                    "#fff0f7",
                color: "#48172f",
                border:
                    "1px solid #ff69b4",
                borderRadius: "5px"
            }
        );

        targetSelect.onchange =
            () => {

                selectedTarget =
                    targetSelect.value;

            };

        panel.appendChild(
            targetSelect
        );

        connectionStatus =
            document.createElement(
                "div"
            );

        Object.assign(
            connectionStatus.style,
            {
                fontSize: "11px",
                color: "#ff9bce",
                marginBottom: "10px"
            }
        );

        panel.appendChild(
            connectionStatus
        );

        // -----------------------------------------------------
        // TRIGGER
        // -----------------------------------------------------

        const triggerLabel =
            document.createElement(
                "div"
            );

        triggerLabel.textContent =
            "Trigger";

        Object.assign(
            triggerLabel.style,
            {
                marginBottom: "5px",
                fontSize: "13px",
                color: "#ffb8d9"
            }
        );

        panel.appendChild(
            triggerLabel
        );

        const triggerSelect =
            document.createElement(
                "select"
            );

        Object.assign(
            triggerSelect.style,
            {
                width: "100%",
                padding: "7px",
                marginBottom: "10px",
                boxSizing:
                    "border-box",
                background:
                    "#fff0f7",
                color: "#48172f",
                border:
                    "1px solid #ff69b4",
                borderRadius: "5px"
            }
        );

        TRIGGERS.forEach(
            (trigger, index) => {

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

        triggerSelect.onchange =
            () => {

                selectedTrigger =
                    Number(
                        triggerSelect.value
                    );

            };

        panel.appendChild(
            triggerSelect
        );

        // -----------------------------------------------------
        // SEND TRIGGER
        // -----------------------------------------------------

        const sendButton =
            document.createElement(
                "button"
            );

        sendButton.textContent =
            "▶ Send Trigger";

        Object.assign(
            sendButton.style,
            {
                width: "100%",
                padding: "8px",
                marginBottom: "12px",
                cursor: "pointer",
                background:
                    "#ff4fa3",
                color: "#fff",
                border:
                    "1px solid #ff8fc7",
                borderRadius: "5px",
                fontWeight:
                    "bold"
            }
        );

        sendButton.onclick =
            () => {

                if (!selectedTarget) {
                    return;
                }

                sendTriggerToUser(
                    selectedTarget,
                    selectedTrigger
                );

            };

        panel.appendChild(
            sendButton
        );

        // -----------------------------------------------------
        // ACCEPT INCOMING
        // -----------------------------------------------------

        const incomingRow =
            document.createElement(
                "label"
            );

        Object.assign(
            incomingRow.style,
            {
                display: "flex",
                alignItems:
                    "center",
                gap: "7px",
                marginBottom:
                    "8px",
                cursor:
                    "pointer"
            }
        );

        const incomingCheckbox =
            document.createElement(
                "input"
            );

        incomingCheckbox.type =
            "checkbox";

        incomingCheckbox.checked =
            settings.acceptIncoming;

        incomingCheckbox.onchange =
            () => {

                settings.acceptIncoming =
                    incomingCheckbox.checked;

                saveSettings();

            };

        const incomingText =
            document.createElement(
                "span"
            );

        incomingText.textContent =
            "Accept incoming triggers";

        incomingRow.appendChild(
            incomingCheckbox
        );

        incomingRow.appendChild(
            incomingText
        );

        panel.appendChild(
            incomingRow
        );

        // -----------------------------------------------------
        // DISCONNECT
        // -----------------------------------------------------

        const disconnectButton =
            document.createElement(
                "button"
            );

        disconnectButton.textContent =
            "Disconnect selected";

        Object.assign(
            disconnectButton.style,
            {
                width: "100%",
                padding: "7px",
                cursor: "pointer",
                background:
                    "#6b3158",
                color: "#fff",
                border:
                    "1px solid #9d477e",
                borderRadius: "5px"
            }
        );

        disconnectButton.onclick =
            () => {

                if (
                    !selectedTarget
                ) {
                    return;
                }

                disconnectUser(
                    selectedTarget
                );

            };

        panel.appendChild(
            disconnectButton
        );

        // -----------------------------------------------------
        // EXPAND / COLLAPSE
        // -----------------------------------------------------

        let mouseDownX = 0;
        let mouseDownY = 0;

        floatingButton.addEventListener(
            "mousedown",
            event => {

                mouseDownX =
                    event.clientX;

                mouseDownY =
                    event.clientY;

            }
        );

        floatingButton.addEventListener(
            "click",
            event => {

                const moved =
                    Math.abs(
                        event.clientX -
                        mouseDownX
                    ) > 5 ||
                    Math.abs(
                        event.clientY -
                        mouseDownY
                    ) > 5;

                if (moved) {
                    return;
                }

                panelOpen =
                    !panelOpen;

                panel.style.display =
                    panelOpen
                        ? "block"
                        : "none";

                rebuildPendingButtons();

            }
        );

        // -----------------------------------------------------
        // DOM
        // -----------------------------------------------------

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

        function refreshConnectDropdown() {

            connectSelect.innerHTML =
                "";

            const others =
                getRoomCharacters()
                    .filter(
                        character =>
                            Number(
                                character.MemberNumber
                            ) !==
                            Number(
                                Player.MemberNumber
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
                others.length ===
                0
            ) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = "";

                option.textContent =
                    "No one else in room";

                connectSelect.appendChild(
                    option
                );

            } else {

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
        }

        // Expose local refresh function.
        container._refresh =
            () => {

                refreshConnectDropdown();
                refreshTargetDropdown();
                updateConnectionStatus();
                refreshPendingUI();
                rebuildPendingButtons();

            };

        refreshConnectDropdown();
        refreshTargetDropdown();
        updateConnectionStatus();
        refreshPendingUI();
        rebuildPendingButtons();

        return container;
    }

    // =========================================================
    // INITIALIZATION
    // =========================================================

    loadStorage();

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

                const ui =
                    createUI();

                installSocketHook();

                clearInterval(wait);

                console.log(
                    "Bambi Obeys 1.3.0 loaded successfully."
                );

                setTimeout(
                    () => {

                        refreshRoomNames();

                        if (
                            ui &&
                            typeof ui._refresh ===
                            "function"
                        ) {
                            ui._refresh();
                        }

                    },
                    1000
                );

                setInterval(
                    () => {

                        refreshRoomNames();

                        if (
                            ui &&
                            typeof ui._refresh ===
                            "function"
                        ) {
                            ui._refresh();
                        }

                    },
                    5000
                );

            },
            1000
        );

})();
