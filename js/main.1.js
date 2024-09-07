/* https://telegram.org/js/games.js */
(function () {
  // Function to safely decode URL-encoded strings
  function decodeURIComponentSafely(encodedString) {
    try {
      return decodeURIComponent(encodedString);
    } catch (error) {
      return encodedString;
    }
  }

  // Function to post events to the parent frame or external services
  function postEventToParent(eventType, callback, eventData) {
    if (!callback) {
      callback = function () {};
    }
    if (eventData === undefined) {
      eventData = "";
    }

    if (window.TelegramWebviewProxy !== undefined) {
      TelegramWebviewProxy.postEvent(eventType, eventData);
      callback();
    } else if (window.external && "notify" in window.external) {
      window.external.notify(
        JSON.stringify({ eventType: eventType, eventData: eventData }),
      );
      callback();
    } else if (isIframe) {
      try {
        var trustedTarget = "https://web.telegram.org";
        // For now we don't restrict target, for testing purposes
        trustedTarget = "*";
        window.parent.postMessage(
          JSON.stringify({ eventType: eventType, eventData: eventData }),
          trustedTarget,
        );
      } catch (error) {
        callback(error);
      }
    } else {
      callback({ notAvailable: true });
    }
  }

  // Function to handle received events
  function handleReceivedEvent(eventType, eventData) {
    var eventHandlers = eventHandlersMap[eventType];
    if (eventHandlers === undefined || !eventHandlers.length) {
      return;
    }
    for (var i = 0; i < eventHandlers.length; i++) {
      try {
        eventHandlers[i](eventType, eventData);
      } catch (error) {}
    }
  }

  // Function to parse initialization parameters from the URL hash
  function parseInitializationParamsFromHash(hash) {
    hash = hash.replace(/^#/, "");
    var params = {};
    if (!hash.length) {
      return params;
    }
    if (hash.indexOf("=") < 0 && hash.indexOf("?") < 0) {
      params._path = decodeURIComponentSafely(hash);
      return params;
    }
    var queryIndex = hash.indexOf("?");
    if (queryIndex >= 0) {
      var pathParam = hash.substr(0, queryIndex);
      params._path = decodeURIComponentSafely(pathParam);
      hash = hash.substr(queryIndex + 1);
    }
    var hashParams = hash.split("&");
    var i, paramName, paramValue;
    for (i = 0; i < hashParams.length; i++) {
      var param = hashParams[i].split("=");
      paramName = decodeURIComponentSafely(param[0]);
      paramValue = param[1] == null ? null : decodeURIComponentSafely(param[1]);
      params[paramName] = paramValue;
    }
    return params;
  }

  var eventHandlersMap = {};
  var initializationParams = "";
  try {
    initializationParams = location.hash.toString();
  } catch (error) {}
  var parsedInitializationParams =
    parseInitializationParamsFromHash(initializationParams);

  var isIframe = false;
  try {
    isIframe = window.parent != null && window != window.parent;
  } catch (error) {}

  window.TelegramGameProxy_receiveEvent = handleReceivedEvent;

  window.TelegramGameProxy = {
    initParams: parsedInitializationParams,
    receiveEvent: handleReceivedEvent,
    onEvent: function (eventType, callback) {
      if (eventHandlersMap[eventType] === undefined) {
        eventHandlersMap[eventType] = [];
      }
      var index = eventHandlersMap[eventType].indexOf(callback);
      if (index === -1) {
        eventHandlersMap[eventType].push(callback);
      }
    },
    shareScore: function () {
      postEventToParent("share_score", function (error) {
        if (error) {
          var shareScoreUrl =
            parsedInitializationParams.tgShareScoreUrl ||
            parsedInitializationParams.shareScoreUrl;
          if (shareScoreUrl) {
            var openInNewTab = false;
            try {
              openInNewTab = window.open(shareScoreUrl, "_blank");
            } catch (error) {
              openInNewTab = false;
            }
            openInNewTab || (location.href = shareScoreUrl);
          }
        }
      });
    },
  };
})();

/* Math Battle */
(function (window, document) {
  // Function to get an element by ID or directly if it's already an element
  function getElementByIdOrSelf(element) {
    return "string" == typeof element
      ? document.getElementById(element)
      : element;
  }

  // Function to trim whitespace from a string
  function trimString(input) {
    return (input || "").replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, "");
  }

  // Function to check if an element has a specific class
  function hasClass(element, className) {
    return (
      (element = getElementByIdOrSelf(element)) &&
      new RegExp("(\\s|^)" + className + "(\\s|$)").test(element.className)
    );
  }

  // Function to add a class to an element
  function addClass(element, className) {
    (element = getElementByIdOrSelf(element)) &&
      !hasClass(element, className) &&
      (element.className = trimString(element.className + " " + className));
  }

  // Function to remove a class from an element
  function removeClass(element, className) {
    (element = getElementByIdOrSelf(element)) &&
      hasClass(element, className) &&
      (element.className = trimString(
        element.className.replace(
          new RegExp("(\\s+|^)" + className + "(\\s+|$)"),
          " ",
        ),
      ));
  }

  // Function to toggle a class on an element
  function toggleClass(element, className, add) {
    ("undefined" == typeof add ? hasClass(element, className) : !add)
      ? removeClass(element, className)
      : addClass(element, className);
  }

  // Function to add event listeners to an element
  function addEventListeners(element, events, callback) {
    if (
      ((element = getElementByIdOrSelf(element)),
      (callback = callback || function () {}),
      element && 3 != element.nodeType && 8 != element.nodeType)
    ) {
      element.setInterval && element != window && (element = window);
      events = events.split(" ");
      for (var i = 0, len = events.length; len > i; i++) {
        var event = events[i];
        element.addEventListener
          ? element.addEventListener(event, callback, !1)
          : element.attachEvent && element.attachEvent("on" + event, callback);
      }
    }
  }

  // Function to generate a random number within a range
  function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // Function to generate a math problem
  function generateMathProblem() {
    var operatorIndex = generateRandomNumber(1, 4000) % 4;
    var isCorrect = generateRandomNumber(1, 1000) <= 500;
    var hardMode = score > 30;
    var operators = ["+", "\u2013", "\u00d7", "/"];
    var operator = operators[operatorIndex];
    var num1, num2, result;

    switch (operator) {
      case "+":
      case "\u2013":
        if (operator == "+") {
          num1 = generateRandomNumber(hardMode ? 10 : 0, hardMode ? 200 : 100);
          num2 = generateRandomNumber(hardMode ? 10 : 0, hardMode ? 200 : 100);
          result = num1 + num2;
        } else {
          result = generateRandomNumber(
            hardMode ? 10 : 0,
            hardMode ? 200 : 100,
          );
          num2 = generateRandomNumber(hardMode ? 10 : 0, hardMode ? 200 : 100);
          num1 = result + num2;
        }
        if (!isCorrect) {
          var minVal = Math.min(num1, num2);
          minVal = Math.min(minVal, result);
          minVal = generateRandomNumber(-minVal, minVal) || minVal++;
          result += minVal;
        }
        break;
      case "\u00d7":
      case "/":
        if (operator == "\u00d7") {
          num1 = generateRandomNumber(hardMode ? 3 : 1, hardMode ? 20 : 10);
          num2 = generateRandomNumber(hardMode ? 3 : 1, hardMode ? 20 : 10);
          result = num1 * num2;
        } else {
          result = generateRandomNumber(hardMode ? 3 : 1, hardMode ? 20 : 10);
          num2 = generateRandomNumber(hardMode ? 3 : 1, hardMode ? 20 : 10);
          num1 = result * num2;
        }
        if (!isCorrect) {
          var minVal = Math.min(num1, num2);
          minVal = Math.min(minVal, result);
          minVal = generateRandomNumber(-minVal, minVal) || minVal++;
          result += minVal;
        }
        break;
    }
    return {
      x: num1,
      op: operator,
      y: num2,
      res: result,
      correct: isCorrect,
    };
  }

  // Function to update the game state
  function updateGameState() {
    clearTimeout(timeoutId);
    updateGameStateHelper(true);
    isGameRunning && (timeoutId = setTimeout(updateGameState, 30));
  }

  // Function to update the game state helper
  function updateGameStateHelper(shouldReset, callback) {
    if (0 < timeLeft - +new Date()) return handleTimeout(callback);
    clearTimeout(timeoutId);
    isGameRunning = false;
    shouldReset
      ? resetGameState()
      : handleTimeout(callback, function () {
          resetGameState();
        });
  }

  // Function to update the score display
  function updateScoreDisplay() {
    var scoreValue = +score || "0";
    scoreElement.innerHTML = scoreValue;
    resultScoreElement.innerHTML = scoreValue;
  }

  // Function to update the problem display
  function updateProblemDisplay() {
    if (currentProblem) {
      taskXElement.innerHTML = +currentProblem.x || "0";
      taskOperatorElement.innerHTML = currentProblem.op || "";
      taskYElement.innerHTML = +currentProblem.y || "0";
      taskResultElement.innerHTML = +currentProblem.res || "0";
    }
  }

  // Function to handle timeout
  function handleTimeout(callback, nextCallback) {
    var timeFraction = (timeLeft - +new Date()) / 10000;
    timeFraction = Math.max(0, Math.min(1, timeFraction));
    callback &&
      (clearTimeout(animationTimeoutId),
      addClass(timelineProgressElement, "animated"),
      (animationTimeoutId = setTimeout(function () {
        removeClass(timelineProgressElement, "animated");
      }, 150)));
    timelineProgressElement.style.right = 100 - 100 * timeFraction + "%";
    nextCallback && setTimeout(nextCallback, 300);
  }

  // Function to reset the game state
  function resetGameState() {
    updateScoreDisplay();
    updateProblemDisplay();
    handleTimeout();
    updateGameStateUI();
  }

  // Function to update the game UI state
  function updateGameStateUI() {
    toggleClass(pageWrapElement, "in_greet", !isGameStarted);
    toggleClass(pageWrapElement, "in_game", !isGameOver);
    toggleClass(pageWrapElement, "in_result", isGameOver);
  }

  // Function to find the current player's score
  function findCurrentPlayerScore() {
    if (highScores && highScores.length) {
      for (var i = 0; i < highScores.length; i++) {
        var score = highScores[i];
        if (score.current) {
          currentPlayerScore = score.score;
          break;
        }
      }
    }
  }

  // Function to update the scores table
  function updateScoresTable() {
    if (highScores !== false && highScores) {
      var html = "";
      for (var i = 0; i < highScores.length; i++) {
        var score = highScores[i];
        html +=
          '<li class="row' +
          (score.current ? " you" : "") +
          '"><span class="place">' +
          score.pos +
          '.</span><span class="score">' +
          score.score +
          '</span><div class="name">' +
          score.name +
          "</div></li>";
      }
      scoresTableElement.innerHTML = html;
      highScores.length > 0
        ? addClass(scoresTableWrapElement, "opened")
        : removeClass(scoresTableWrapElement, "opened");
    }
  }

  // Function to start the game
  function startGame() {
    isGameRunning = isGameStarted = true;
    isGameOver = false;
    currentProblem = generateMathProblem();
    timeLeft = +new Date() + 10000;
    score = 0;
    isScoreShared = false;
    updateGameState();
    updateScoreDisplay();
    updateProblemDisplay();
    handleTimeout();
    updateGameStateUI();
    toggleClass(scoreShareButtonElement, "shown", isScoreShared);
  }

  // Function to send a POST request
  function sendPostRequest(url, data, callback) {
    var xhr = new XMLHttpRequest();
    var params = [];
    for (var key in data) {
      params.push(
        encodeURIComponent(key) + "=" + encodeURIComponent(data[key]),
      );
    }
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        callback(JSON.parse(xhr.responseText));
      }
    };
    xhr.open("POST", url, true);
    xhr.send(params.join("&"));
  }

  // Function to set the score
  function setScore() {
    if (gameData) {
      sendPostRequest(
        "/api/setScore",
        {
          data: gameData,
          score: score || 0,
        },
        function (response) {
          highScores = response.scores;
          findCurrentPlayerScore();
          updateScoresTable();
          response["new"] &&
            isGameOver &&
            ((isScoreShared = true),
            toggleClass(scoreShareButtonElement, "shown", isScoreShared));
        },
      );
    }
  }

  // Function to get high scores
  function getHighScores() {
    if (gameData) {
      sendPostRequest(
        "/api/getHighScores",
        {
          data: gameData,
        },
        function (response) {
          highScores = response.scores;
          findCurrentPlayerScore();
          updateScoresTable();
        },
      );
    }
  }

  // Function to end the game
  function endGame() {
    if (!isGameOver) {
      isGameOver = true;
      var currentScore = score;
      if (playerName && currentScore) {
        highScores || (highScores = []);
        for (var i = 0, pos = 0; i < highScores.length; i++) {
          var score = highScores[i];
          if (score.current) {
            if (score.score >= currentScore) break;
            pos = score.pos;
            break;
          }
        }
        pos ||
          ((pos = score ? score.pos + 1 : 1),
          highScores.push({
            pos: pos,
            score: 0,
            name: playerName,
            current: true,
          }));
        var temp = false;
        for (i = 0; i < highScores.length; i++) {
          var score = highScores[i];
          if (temp) {
            if (score.pos <= pos)
              temp.pos++, (highScores[i] = temp), (temp = score);
            else break;
          } else if (currentScore > score.score) {
            highScores[i] = {
              pos: score.pos,
              score: currentScore,
              name: playerName,
              current: true,
            };
            temp = score;
          }
        }
      }
      updateScoresTable();
      score > currentPlayerScore ? setScore() : getHighScores();
      updateGameStateUI();
    }
  }

  // Function to handle user input
  function handleUserInput(isCorrect) {
    if (isGameRunning) {
      if (isCorrect === !currentProblem.correct) {
        timeLeft += 1500;
        timeLeft > 10000 && (timeLeft = +new Date() + 10000);
        score++;
        updateScoreDisplay();
      } else {
        timeLeft -= 4000;
        handleTimeout();
      }
      updateGameStateHelper(false, !isCorrect !== !currentProblem.correct);
      currentProblem = generateMathProblem();
      updateProblemDisplay();
    }
  }

  // Function to handle hover effect
  function handleHoverEffect(element) {
    addClass(element, "hover");
    setTimeout(function () {
      removeClass(element, "hover");
    }, 100);
  }

  var timeLeft,
    timeoutId,
    isGameStarted = false,
    isGameRunning = false,
    isGameOver = true,
    currentProblem,
    highScores = false,
    score = 0,
    isScoreShared,
    gameData = (location.hash || "").substr(1);
  gameData = gameData.replace(/[\?&].*/g, "");
  var currentPlayerScore = 0,
    playerName = false;
  if (gameData)
    try {
      var decodedData = decodeURIComponent(escape(atob(gameData)));
      playerName = JSON.parse(decodedData.substr(0, decodedData.length - 32))
        .n.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/\n/g, "<br>");
    } catch (error) {}

  var scoreElement = getElementByIdOrSelf("score_value"),
    resultScoreElement = getElementByIdOrSelf("result_score_value"),
    scoreShareButtonElement = getElementByIdOrSelf("score_share"),
    taskElement = getElementByIdOrSelf("task"),
    taskXElement = getElementByIdOrSelf("task_x"),
    taskOperatorElement = getElementByIdOrSelf("task_op"),
    taskYElement = getElementByIdOrSelf("task_y"),
    taskResultElement = getElementByIdOrSelf("task_res"),
    timelineProgressElement = getElementByIdOrSelf("timeline_progress"),
    scoresTableElement = getElementByIdOrSelf("table"),
    scoresTableWrapElement = getElementByIdOrSelf("table_wrap"),
    pageWrapElement = getElementByIdOrSelf("page_wrap"),
    gameTitleElement = getElementByIdOrSelf("game_title"),
    correctButtonElement = getElementByIdOrSelf("button_correct"),
    wrongButtonElement = getElementByIdOrSelf("button_wrong"),
    animationTimeoutId;

  addEventListeners(gameTitleElement, "click", function () {
    isGameStarted || startGame();
  });

  addEventListeners(correctButtonElement, "click", function () {
    !isGameStarted || isGameOver ? startGame() : handleUserInput(true);
  });

  addEventListeners(wrongButtonElement, "click", function () {
    isGameRunning && handleUserInput(false);
  });

  addEventListeners(scoreShareButtonElement, "click", function () {
    isScoreShared && TelegramGameProxy && TelegramGameProxy.shareScore();
  });

  addEventListeners(document, "keydown", function (event) {
    event.preventDefault();
    var keyCode = event.which || event.keyCode;
    isGameRunning
      ? (37 == keyCode &&
          (handleHoverEffect(correctButtonElement), handleUserInput(true)),
        39 == keyCode &&
          (handleHoverEffect(wrongButtonElement), handleUserInput(false)))
      : (isGameStarted && !isGameOver) ||
        32 != keyCode ||
        (handleHoverEffect(correctButtonElement), startGame());
  });

  updateScoreDisplay();
  updateProblemDisplay();
  updateGameStateUI();
  getHighScores();

  var touchHandler = {
    obj: null,
    start: function (event) {
      event.touches &&
        1 == event.touches.length &&
        (touchHandler.end(event),
        (touchHandler.obj = this || null),
        touchHandler.obj && addClass(touchHandler.obj, "hover"));
    },
    cancel: function (event) {
      touchHandler.obj && touchHandler.end(event);
    },
    end: function () {
      touchHandler.obj &&
        (removeClass(touchHandler.obj, "hover"),
        (touchHandler.obj = null),
        (touchHandler.highlight = false));
    },
    check: function (element) {
      if (!element) return false;
      do
        if (hasClass(element, "button") || hasClass(element, "score_share"))
          return element;
      while ((element = element.parentNode));
      return false;
    },
  };

  addEventListeners(document, "touchmove touchcancel", touchHandler.cancel);
  addEventListeners(document, "touchend", touchHandler.end);
  addEventListeners(document, "touchstart", function (event) {
    var element = touchHandler.check(event.target);
    element && touchHandler.start.call(element, event);
  });

  "ontouchstart" in document || addClass(document.body, "_hover");
})(window, document);
