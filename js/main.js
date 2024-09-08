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

    function generateMathProblem() {
        var isCorrectAnswer = getRandomInt(1, 1000) <= 500;
        var isHardMode = score > 25;
        var operationIndex = isHardMode ? getRandomInt(1, 5000) % 5 : getRandomInt(1, 4000) % 4;
        var operation = ["+", "\u2013", "\u00d7", "/", "@"][operationIndex];
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
                break;
            case "@":
                y = getRandomInt(1000, 7999);
                result = getRandomInt(0, 20) * 100 + getRandomInt(0, 1);
                // while (Math.abs((x % 100) - (y % 100)) > 1) {
                //     y = getRandomInt(1000, 9999);
                // }
                x = result + y;
                operation = "\u2013";
                if (!isCorrectAnswer) {
                  var minValue = Math.min(x, y, result);
                  var adjustment = getRandomInt(-minValue, minValue);
                  adjustment = adjustment || 1;
                  result += adjustment;
                }
                break;
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
        updateGameState();
        updateScoreDisplay();
        updateProblemDisplay();
        animateTimeline();
        updateGameUI();
    }

    function endGame() {
        if (!isGameOver) {
            isGameOver = true;
            updateGameUI();
            displayWrongAnswers();
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
        currentProblem,
        score = 0,
        totalProblems = 0,
        wrongAnswers = [];

    var scoreValueElement = getElement("score_value"),
        resultScoreValueElement = getElement("result_score_value"),
        taskElement = getElement("task"),
        taskXElement = getElement("task_x"),
        taskOperationElement = getElement("task_op"),
        taskYElement = getElement("task_y"),
        taskResultElement = getElement("task_res"),
        timelineProgressElement = getElement("timeline_progress"),
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
                if (hasClass(target, "button")) {
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
