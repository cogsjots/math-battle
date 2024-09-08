/* Math Battle Game */
(function(window, document) {
    function getElement(element) {
        return typeof element == "string" ? document.getElementById(element) : element;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function generateMathProblem() {
        var operationIndex = getRandomInt(1, 4000) % 4;
        var isCorrectAnswer = getRandomInt(1, 1000) <= 500;
        var operation = ["+", "\u2013", "\u00d7", "/"][operationIndex];
        var x, y, result;

        switch (operation) {
            case "+":
                x = getRandomInt(0, 200);
                y = getRandomInt(0, 200);
                result = x + y;
                break;
            case "\u2013":
                result = getRandomInt(0, 200);
                y = getRandomInt(0, 200);
                x = result + y;
                break;
            case "\u00d7":
                x = getRandomInt(2, 13);
                y = getRandomInt(2, 13);
                result = x * y;
                break;
            case "/":
                result = getRandomInt(2, 13);
                y = getRandomInt(2, 13);
                x = result * y;
                break;
        }

        if (!isCorrectAnswer) {
            var minValue = Math.min(x, y, result);
            var adjustment = getRandomInt(-minValue, minValue);
            adjustment = adjustment || 1;
            result += adjustment;
        }

        return {
            x: x,
            operation: operation,
            y: y,
            result: result,
            isCorrect: isCorrectAnswer,
        };
    }

    function displayProblems() {
        var problemsContainer = getElement("problems_container");
        var problemsHtml = "<h3>Math Problems:</h3>";
        for (var i = 0; i < 10; i++) {
            var problem = generateMathProblem();
            problemsHtml += "<div>" + problem.x + " " + problem.operation + " " + problem.y + " = " + problem.result + "</div>";
        }
        problemsContainer.innerHTML = problemsHtml;
    }

    var problemsContainer = document.createElement("div");
    problemsContainer.id = "problems_container";
    document.body.appendChild(problemsContainer);

    displayProblems();

})(window, document);
