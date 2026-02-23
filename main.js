import * as pou from "./math.js"

const textWhenFocus = (text) => {
  return (e) => {
  if(e.target.value == text)
  e.target.value = "";
  }
}

const textWhenBlur = (text) => {
  return (e) => {
    if(e.target.value == "")
    e.target.value = text;
  }
}

const expressionInput = document.querySelector("#expression-input");
const variableName = document.querySelector(".variable-name");
const variableValue = document.querySelector(".variable-value");
const variableError = document.querySelector(".variable-error");

expressionInput.addEventListener("focus", textWhenFocus("Enter expression"));
expressionInput.addEventListener("blur", textWhenBlur("Enter expression"));

const addVariableButton = document.querySelector(".add-variable");
const calculateButton = document.querySelector(".calculate-button");
expressionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculateButton?.click();
  }
});

const removeVariableButton = document.querySelector(".remove-variable");

const varBoxesContainer = document.querySelector(".var-boxes-container");
const varBoxCopy = document.querySelector(".var-box").cloneNode(true);
varBoxCopy.lastElementChild.removeChild(varBoxCopy.lastElementChild.lastElementChild);

const createVarBox = () => {
  let newVarBox = varBoxCopy.cloneNode(true);
  varBoxesContainer.appendChild(newVarBox);
  newVarBox.firstElementChild.addEventListener("click", removeVarBox);
  let variableRow = newVarBox.lastElementChild.firstElementChild;
  let fields = variableRow ? Array.from(variableRow.children) : [];
  let nameIn = fields[0] ? fields[0].querySelector(".variable-name") : null;
  let valueIn = fields[1] ? fields[1].querySelector(".variable-value") : null;
  let errorIn = fields[2] ? fields[2].querySelector(".variable-error") : null;
  if (nameIn) { nameIn.addEventListener("focus", textWhenFocus("Name")); nameIn.addEventListener("blur", textWhenBlur("Name")); }
  if (valueIn) { valueIn.addEventListener("focus", textWhenFocus("Value")); valueIn.addEventListener("blur", textWhenBlur("Value")); }
  if (errorIn) { errorIn.addEventListener("focus", textWhenFocus("Error")); errorIn.addEventListener("blur", textWhenBlur("Error")); }
  newVarBox.lastElementChild.appendChild(addVariableButton);
}

const removeVarBox = (e) => {
  const varBoxes = varBoxesContainer.querySelectorAll(".var-box");
  if (varBoxes.length <= 1) return;
  varBoxesContainer.removeChild(e.currentTarget.parentElement);
  const lastVarBox = varBoxesContainer.querySelector(".var-box");
  if (lastVarBox) lastVarBox.lastElementChild.appendChild(addVariableButton);
}

addVariableButton.addEventListener("click", createVarBox);
removeVariableButton.addEventListener("click", removeVarBox);

const resultValueNum = document.querySelector(".result-value__num");
const resultValueErr = document.querySelector(".result-value__err");

const historyListEl = document.getElementById("history-list");
const MAX_HISTORY = 30;
const expressionHistory = [];

function addToHistory(expr) {
  const trimmed = (expr || "").trim();
  if (!trimmed) return;
  if (expressionHistory[0] === trimmed) return;
  expressionHistory.unshift(trimmed);
  if (expressionHistory.length > MAX_HISTORY) expressionHistory.pop();
  renderHistory();
}

function renderHistory() {
  if (!historyListEl) return;
  historyListEl.textContent = "";
  expressionHistory.forEach((expr) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.textContent = expr;
    item.setAttribute("role", "listitem");
    item.addEventListener("click", () => {
      expressionInput.value = expr;
      expressionInput.focus();
    });
    historyListEl.appendChild(item);
  });
}

calculateButton.addEventListener("click", () => {
  calculateButton.classList.add("loading");
  let variableAttributeArray = [[], [], []];
  let varBoxesArray = varBoxesContainer.children;
  Array.from(varBoxesArray).forEach(element => {
    let variableRow = element.lastElementChild.firstElementChild;
    let fields = variableRow ? Array.from(variableRow.children) : [];
    let nameInput = fields[0] ? fields[0].querySelector(".variable-name") : null;
    let valueInput = fields[1] ? fields[1].querySelector(".variable-value") : null;
    let errorInput = fields[2] ? fields[2].querySelector(".variable-error") : null;
    if (nameInput && valueInput && errorInput && !isNaN(valueInput.value) && !isNaN(errorInput.value)) {
      variableAttributeArray[0].push(nameInput.value);
      variableAttributeArray[1].push(Number(valueInput.value));
      variableAttributeArray[2].push(Number(errorInput.value));
    }
  });
  const expr = (expressionInput.value || "").replace(/\^/g, "**");
  let pouNode = new pou.Node();
  pou.parseInputString(expr);
  pouNode = pou.readExpression(pouNode);
  pou.substituteVariable(pouNode, variableAttributeArray[0], variableAttributeArray[1]);
  let resultNumericValue = pou.computeExpression(pouNode);
  let resultError = pou.propagateUncertainty(pouNode, variableAttributeArray[0], variableAttributeArray[1], variableAttributeArray[2]);
  if(Number.isNaN(resultNumericValue) || Number.isNaN(resultError)) {
    if (resultValueNum) resultValueNum.textContent = "NaN";
    if (resultValueErr) resultValueErr.textContent = "";
    expressionInput.classList.add("shake");
    setTimeout(() => expressionInput.classList.remove("shake"), 400);
    calculateButton.classList.remove("loading");
    return;
  }
  let [approximatedNumericValue, approximatedErrorValue] = pou.approximateResult(resultNumericValue, resultError);
  if (resultValueNum) resultValueNum.textContent = approximatedNumericValue;
  if (resultValueErr) resultValueErr.textContent = approximatedErrorValue;
  addToHistory(expressionInput.value);
  calculateButton.classList.remove("loading");
})




