// Telegram Game Proxy setup
(function() {
    function decodeURIComponentSafe(encodedURIComponent) {
        try {
            return decodeURIComponent(encodedURIComponent);
        } catch (error) {
            return encodedURIComponent;
        }
    }

    function postEventToParent(eventType, callback, eventData) {
        callback = callback || function() {};
        eventData = eventData || "";

        if (typeof window.TelegramWebviewProxy !== 'undefined') {
            TelegramWebviewProxy.postEvent(eventType, eventData);
            callback();
        } else if (window.external && "notify" in window.external) {
            window.external.notify(JSON.stringify({
                eventType: eventType,
                eventData: eventData
            }));
            callback();
        } else if (isInIframe) {
            try {
                var targetOrigin = "https://web.telegram.org";
                targetOrigin = "*";
                window.parent.postMessage(JSON.stringify({
                    eventType: eventType,
                    eventData: eventData
                }), targetOrigin);
            } catch (error) {
                callback(error);
            }
        } else {
            callback({ notAvailable: true });
        }
    }

    function triggerEventListeners(eventType, eventData) {
        var listeners = eventListeners[eventType];
        if (typeof listeners !== 'undefined' && listeners.length) {
            for (var i = 0; i < listeners.length; i++) {
                try {
                    listeners[i](eventType, eventData);
                } catch (error) {
                    // Silent error handling
                }
            }
        }
    }

    var eventListeners = {};
    var locationHash = "";

    try {
        locationHash = location.hash.toString();
    } catch (error) {
        // Silent error handling
    }

    var parseLocationHash = function(hash) {
        hash = hash.replace(/^#/, "");
        var params = {};
        if (!hash.length) return params;
        if (hash.indexOf("=") < 0 && hash.indexOf("?") < 0) {
            params._path = decodeURIComponentSafe(hash);
            return params;
        }
        var queryStartIndex = hash.indexOf("?");
        if (queryStartIndex >= 0) {
            var path = hash.substr(0, queryStartIndex);
            params._path = decodeURIComponentSafe(path);
            hash = hash.substr(queryStartIndex + 1);
        }
        var pairs = hash.split("&");
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split("=");
            var key = decodeURIComponentSafe(pair[0]);
            var value = pair[1] == null ? null : decodeURIComponentSafe(pair[1]);
            params[key] = value;
        }
        return params;
    };

    var initParams = parseLocationHash(locationHash);
    var isInIframe = false;

    try {
        isInIframe = window.parent != null && window != window.parent;
    } catch (error) {
        // Silent error handling
    }

    window.TelegramGameProxy_receiveEvent = triggerEventListeners;

    window.TelegramGameProxy = {
        initParams: initParams,
        receiveEvent: triggerEventListeners,
        onEvent: function(eventType, callback) {
            if (typeof eventListeners[eventType] === 'undefined') {
                eventListeners[eventType] = [];
            }
            if (eventListeners[eventType].indexOf(callback) === -1) {
                eventListeners[eventType].push(callback);
            }
        },
        shareScore: function() {
            postEventToParent("share_score", function(error) {
                if (error) {
                    var shareUrl = initParams.tgShareScoreUrl || initParams.shareScoreUrl;
                    if (shareUrl) {
                        var windowOpened = false;
                        try {
                            windowOpened = window.open(shareUrl, "_blank");
                        } catch (openError) {
                            windowOpened = false;
                        }
                        if (!windowOpened) {
                            location.href = shareUrl;
                        }
                    }
                }
            });
        }
    };
})();

/* Math Battle Game */
(function(window, document) {
    function getElement(element) {
        return typeof element == "string" ? document.getElementById(element) : element;
    }

    function trim(str) {
        return (str || "").replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, "");
    }

    function hasClass(element, className) {
        element = getElement(element);
        return element && (new RegExp("(\\s|^)" + className + "(\\s|$)")).test(element.className);
    }

    function addClass(element, className) {
        element = getElement(element);
        if (element && !hasClass(element, className)) {
            element.className = trim(element.className + " " + className);
        }
    }

    function removeClass(element, className) {
        element = getElement(element);
        if (element && hasClass(element, className)) {
            element.className = trim(element.className.replace(new RegExp("(\\s+|^)" + className + "(\\s+|$)"), " "));
        }
    }

    function toggleClass(element, className, force) {
        if (typeof force === "undefined" ? !hasClass(element, className) : force) {
            addClass(element, className);
        } else {
            removeClass(element, className);
        }
    }

    function addEvent(element, eventNames, handler) {
        element = getElement(element);
        handler = handler || defaultEventHandler;

        if (element && element.nodeType !== 3 && element.nodeType !== 8) {
            if (element.setInterval && element != window) {
                element = window;
            }

            eventNames = eventNames.split(" ");
            for (var i = 0, len = eventNames.length; len > i; i++) {
                var eventName = eventNames[i];
                if (element.addEventListener) {
                    element.addEventListener(eventName, handler, false);
                } else if (element.attachEvent) {
                    element.attachEvent("on" + eventName, handler);
                }
            }
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Function to generate a math problem
    function generateMathProblem() {
        var operationIndex = getRandomInt(1, 4000) % 4;
        var isCorrectAnswer = getRandomInt(1, 1000) <= 500;
        var isHardMode = score > 30;
        var operation = ["+", "\u2013", "\u00d7", "/"][operationIndex];
        var x, y, result;

        switch (operation) {
            case "+":
            case "\u2013":
                if (operation == "+") {
                    x = getRandomInt(isHardMode ? 10 : 0, isHardMode ? 200 : 100);
                    y = getRandomInt(isHardMode ? 10 : 0, isHardMode ? 200 : 100);
                    result = x + y;
                } else {
                    result = getRandomInt(isHardMode ? 10 : 0, isHardMode ? 200 : 100);
                    y = getRandomInt(isHardMode ? 10 : 0, isHardMode ? 200 : 100);
                    x = result + y;
                }
                if (!isCorrectAnswer) {
                    var minValue = Math.min(x, y, result);
                    var adjustment = getRandomInt(-minValue, minValue);
                    adjustment = adjustment || 1;
                    result += adjustment;
                }
                break;
            case "\u00d7":
            case "/":
                if (operation == "\u00d7") {
                    x = getRandomInt(isHardMode ? 3 : 1, isHardMode ? 13 : 12);
                    y = getRandomInt(isHardMode ? 3 : 1, isHardMode ? 13 : 12);
                    result = x * y;
                } else {
                    result = getRandomInt(isHardMode ? 3 : 1, isHardMode ? 13 : 12);
                    y = getRandomInt(isHardMode ? 3 : 1, isHardMode ? 13 : 12);
                    x = result * y;
                }
                if (!isCorrectAnswer) {
                    var minValue = Math.min(x, y, result);
                    var adjustment = getRandomInt(-minValue, minValue);
                    adjustment = adjustment || 1;
                    result += adjustment;
                }
        }

        totalProblems++; // Increment total problems answered
        return {
            x: x,
            operation: operation,
            y: y,
            result: result,
            isCorrect: isCorrectAnswer,
        };
    }

    function updateGameState() {
        clearTimeout(gameLoopTimeout);
        updateTimeline(true);
        if (isGameRunning) {
            gameLoopTimeout = setTimeout(updateGameState, 30);
        }
    }

    function updateTimeline(animate, callback) {
        if (endTime - Date.now() > 0) {
            return animateTimeline(callback);
        }
        clearTimeout(gameLoopTimeout);
        isGameRunning = false;
        animate ? endGame() : animateTimeline(callback, function() {
            endGame();
        });
    }

    function updateScoreDisplay() {
        var currentScore = score.toString() || "0";
        scoreValueElement.innerHTML = currentScore;
        resultScoreValueElement.innerHTML = currentScore + " out of " + totalProblems;
    }

    function updateProblemDisplay() {
        if (currentProblem) {
            taskXElement.innerHTML = currentProblem.x.toString() || "0";
            taskOperationElement.innerHTML = currentProblem.operation || "";
            taskYElement.innerHTML = currentProblem.y.toString() || "0";
            taskResultElement.innerHTML = currentProblem.result.toString() || "0";
        }
    }

    function animateTask() {
        clearTimeout(taskAnimationTimeout);
        addClass(taskElement, "tossing");
        taskAnimationTimeout = setTimeout(function() {
            removeClass(taskElement, "tossing");
        }, 350);
    }

    function animateTimeline(animate, callback) {
        var progress = (endTime - Date.now()) / 3e4;
        if (progress < 0) progress = 0;
        if (progress > 1) progress = 1;

        if (animate) {
            clearTimeout(timelineAnimationTimeout);
            addClass(timelineProgressElement, "animated");
            timelineAnimationTimeout = setTimeout(function() {
                removeClass(timelineProgressElement, "animated");
            }, 150);
        }

        timelineProgressElement.style.right = (100 - 100 * progress) + "%";

        if (callback) {
            setTimeout(callback, 300);
        }
    }

    function updateHighScores() {
        if (highScores && highScores.length) {
            for (var i = 0; i < highScores.length; i++) {
                var score = highScores[i];
                if (score.current) {
                    currentHighScore = score.score;
                    break;
                }
            }
        }
    }

    function renderHighScores() {
        if (highScores !== false && isGameOver) {
            var tableHTML = "";
            for (var i = 0; i < highScores.length; i++) {
                var score = highScores[i];
                tableHTML += '<li class="row' + (score.current ? " you" : "") + '">' +
                             '<span class="place">' + score.pos + '.</span>' +
                             '<span class="score">' + score.score + '</span>' +
                             '<div class="name">' + score.name + "</div></li>";
            }
            highScoreTableElement.innerHTML = tableHTML;
            toggleClass(tableWrapElement, "opened", highScores.length > 0);
        }
    }

    function updateGameUI() {
        toggleClass(pageWrapElement, "in_greet", !isGameStarted);
        toggleClass(pageWrapElement, "in_game", !isGameOver);
        toggleClass(pageWrapElement, "in_result", isGameOver);
    }

    function startGame() {
        isGameRunning = true;
        isGameStarted = true;
        isGameOver = false;
        currentProblem = generateMathProblem();
        endTime = Date.now() + 3e4;
        score = 0;
        totalProblems = 0;
        wrongAnswers = []; // Initialize wrong answers array
        isNewHighScore = false;
        updateGameState();
        updateScoreDisplay();
        updateProblemDisplay();
        animateTimeline();
        updateGameUI();
        toggleClass(scoreShareElement, "shown", isNewHighScore);
    }

    function sendApiRequest(url, data, callback) {
        var xhr = new XMLHttpRequest();
        var params = [];
        for (var key in data) {
            params.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                callback(JSON.parse(xhr.responseText));
            }
        };
        xhr.open("POST", url, true);
        xhr.send(params.join("&"));
    }

    function setScore() {
        if (gameData) {
            sendApiRequest("/api/setScore", {
                data: gameData,
                score: score || 0
            }, function(response) {
                highScores = response.scores;
                updateHighScores();
                renderHighScores();
                if (response["new"] && isGameOver) {
                    isNewHighScore = true;
                    toggleClass(scoreShareElement, "shown", isNewHighScore);
                }
            });
        }
    }

    function getHighScores() {
        if (gameData) {
            sendApiRequest("/api/getHighScores", {
                data: gameData
            }, function(response) {
                highScores = response.scores;
                updateHighScores();
                renderHighScores();
            });
        }
    }

    function endGame() {
        if (!isGameOver) {
            isGameOver = true;
            updateHighScores();
            if (playerName && score) {
                if (!highScores) {
                    highScores = [];
                }
                var playerPosition = 0;
                var updatedPlayerScore = false;
                for (var i = 0; i < highScores.length; i++) {
                    var highScore = highScores[i];
                    if (highScore.current) {
                        if (highScore.score >= score) {
                            break;
                        }
                        playerPosition = highScore.pos;
                        break;
                    }
                }
                if (!playerPosition) {
                    playerPosition = highScore ? highScore.pos + 1 : 1;
                    highScores.push({
                        pos: playerPosition,
                        score: 0,
                        name: playerName,
                        current: true
                    });
                }
                var tempScore;
                for (var i = 0; i < highScores.length; i++) {
                    var highScore = highScores[i];
                    if (tempScore) {
                        if (highScore.pos <= playerPosition) {
                            tempScore.pos++;
                            highScores[i] = tempScore;
                            tempScore = highScore;
                        } else {
                            break;
                        }
                    } else if (score > highScore.score) {
                        highScores[i] = {
                            pos: highScore.pos,
                            score: score,
                            name: playerName,
                            current: true
                        };
                        tempScore = highScore;
                    }
                }
            }
            renderHighScores();
            score > currentHighScore ? setScore() : getHighScores();
            updateGameUI();
            displayWrongAnswers(); // Display wrong answers at the end
        }
    }

    function handleUserInput(isCorrect) {
        if (isGameRunning) {
            if (isCorrect === currentProblem.isCorrect) {
                endTime += 1500;
                if (endTime - Date.now() > 3e4) {
                    endTime = Date.now() + 3e4;
                }
                score++;
                updateScoreDisplay();
            } else {
                endTime -= 4000;
                animateTask();
                wrongAnswers.push({
                    problem: currentProblem.x + " " + currentProblem.operation + " " + currentProblem.y + " = " + currentProblem.result,
                    promptedAnswer: currentProblem.isCorrect ? "Correct" : "Wrong"
                }); // Store wrong answer
            }
            updateTimeline(false, isCorrect !== currentProblem.isCorrect);
            currentProblem = generateMathProblem();
            updateScoreDisplay();
            updateProblemDisplay();
        }
    }

    function animateButton(button) {
        addClass(button, "hover");
        setTimeout(function() {
            removeClass(button, "hover");
        }, 100);
    }

    function displayWrongAnswers() {
        var wrongAnswersContainer = getElement("wrong_answers");
        var wrongAnswersHtml = "<h3>Wrong Answers:</h3>";
        for (var i = 0; i < wrongAnswers.length; i++) {
            wrongAnswersHtml += "<div>" + wrongAnswers[i].problem + "</div>";
        }
        wrongAnswersContainer.innerHTML = wrongAnswersHtml;
    }

    var endTime, gameLoopTimeout, isGameStarted = false,
        isGameRunning = false,
        isGameOver = true,
        currentProblem, highScores = false,
        score = 0,
        totalProblems = 0,
        wrongAnswers = [],
        isNewHighScore, gameData = (location.hash || "").substr(1);

    gameData = gameData.replace(/[\?&].*/g, "");
    var currentHighScore = 0,
        playerName = false;

    if (gameData) {
        try {
            var decodedData = decodeURIComponent(escape(atob(gameData)));
            playerName = JSON.parse(decodedData.substr(0, decodedData.length - 32)).n
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;")
                .replace(/\n/g, "<br>");
        } catch (error) {
            // Silent error handling
        }
    }

    var scoreValueElement = getElement("score_value"),
        resultScoreValueElement = getElement("result_score_value"),
        scoreShareElement = getElement("score_share"),
        taskElement = getElement("task"),
        taskXElement = getElement("task_x"),
        taskOperationElement = getElement("task_op"),
        taskYElement = getElement("task_y"),
        taskResultElement = getElement("task_res"),
        timelineProgressElement = getElement("timeline_progress"),
        highScoreTableElement = getElement("table"),
        tableWrapElement = getElement("table_wrap"),
        pageWrapElement = getElement("page_wrap");

    var gameTitleElement = getElement("game_title"),
        correctButtonElement = getElement("button_correct"),
        wrongButtonElement = getElement("button_wrong"),
        taskAnimationTimeout, timelineAnimationTimeout;

    addEvent(gameTitleElement, "click", function() {
        if (!isGameStarted) {
            startGame();
        }
    });

    addEvent(correctButtonElement, "click", function() {
        if (!isGameStarted || isGameOver) {
            startGame();
        } else {
            handleUserInput(true);
        }
    });

    addEvent(wrongButtonElement, "click", function() {
        if (isGameRunning) {
            handleUserInput(false);
        }
    });

    addEvent(scoreShareElement, "click", function() {
        if (isNewHighScore && window.TelegramGameProxy) {
            window.TelegramGameProxy.shareScore();
        }
    });

    addEvent(document, "keydown", function(event) {
        event.preventDefault();
        var keyCode = event.which || event.keyCode;
        if (isGameRunning) {
            if (keyCode == 37) {
                animateButton(correctButtonElement);
                handleUserInput(true);
            }
            if (keyCode == 39) {
                animateButton(wrongButtonElement);
                handleUserInput(false);
            }
        } else if ((!isGameStarted || isGameOver) && keyCode == 32) {
            animateButton(correctButtonElement);
            startGame();
        }
    });

    updateScoreDisplay();
    updateProblemDisplay();
    updateGameUI();
    getHighScores();

    var touchHandler = {
        obj: null,
        start: function(event) {
            if (event.touches && event.touches.length == 1) {
                touchHandler.end(event);
                touchHandler.obj = this || null;
                if (touchHandler.obj) {
                    addClass(touchHandler.obj, "hover");
                }
            }
        },
        cancel: function(event) {
            if (touchHandler.obj) {
                touchHandler.end(event);
            }
        },
        end: function() {
            if (touchHandler.obj) {
                removeClass(touchHandler.obj, "hover");
                touchHandler.obj = null;
                touchHandler.highlight = false;
            }
        },
        check: function(target) {
            if (!target) return false;
            do {
                if (hasClass(target, "button") || hasClass(target, "score_share")) {
                    return target;
                }
            } while (target = target.parentNode);
            return false;
        }
    };

    addEvent(document, "touchmove touchcancel", touchHandler.cancel);
    addEvent(document, "touchend", touchHandler.end);
    addEvent(document, "touchstart", function(event) {
        var target = touchHandler.check(event.target);
        if (target) {
            touchHandler.start.call(target, event);
        }
    });

    if (!("ontouchstart" in document)) {
        addClass(document.body, "_hover");
    }

})(window, document);
