"use strict";
/**
 * @fileoverview 履歴ファイルを読み込み、コマンドを実行するためのスクリプト
 */
/**
 * @classdesc 日付のパターンを保持するクラス
 */
class Patterns {
    constructor() { }
}
Patterns.DATE = /^20\d{2}\/\d{1,2}\/\d{1,2}\(.+\)\r?$/g;
Patterns.YEAR = /^20\d{2}/g;
Patterns.MONTH_DAY = /\d{2}/g;
Patterns.DATE_NO_WEEK = /^20\d{2}\/\d{1,2}\/\d{1,2}$/g;
/**
 * @classdesc 履歴ファイルを保持するクラス
 */
class LineHistory {
    constructor(data) {
        if (data != null) {
            this.historyData = data.replace(/\r/g, "").split("\n");
        }
        else {
            this.historyData = [];
        }
        this.dateIndices = this.calcDateIndices();
        this.currentDate = undefined;
    }
    set currentDate(date) {
        this._currentDate = date;
    }
    get currentDate() {
        return this._currentDate != undefined
            ? new Date(this._currentDate)
            : undefined;
    }
    get exists() {
        return this.historyData != null
            && this.historyData != undefined
            && this.historyData.length != 0;
    }
    searchByDate(dateString) {
        return this.hashSearchByDate(dateString);
        // return this.seqSearchByDate(dateString);
    }
    hashSearchByDate(dateString) {
        const dateInput = this.currentDate = generateDate(dateString);
        let output = "";
        const startIndex = this.dateIndices[dateInput.toLocaleDateString()];
        if (startIndex == undefined) {
            return "この日の履歴はありません。<br>";
        }
        let countStop = -1;
        for (let i = startIndex; i < this.historyData.length; i++) {
            const line = this.historyData[i];
            if (Patterns.DATE.test(line) && i != startIndex) {
                countStop = i;
                break;
            }
            const lineNum = i - startIndex;
            output += createLineWithTime(line, lineNum, this.currentDate);
            if (i >= this.historyData.length - 1) {
                countStop = i;
                break;
            }
        }
        output += `${countStop - startIndex}行<br>`;
        return output;
    }
    /**
     * 指定した日付の履歴を検索する
     * @param dateString 日付を表す文字列 yyyy/mm/dd
     * @returns 指定した日の履歴
     */
    seqSearchByDate(dateString) {
        var _a;
        const dateInput = generateDate(dateString);
        let countStart = -1;
        let countStop = -1;
        let countFlag = false;
        let output = "";
        for (let i = 0; i < this.historyData.length; i++) {
            let line = this.historyData[i];
            if (Patterns.DATE.test(line)) {
                let dateTmp = generateDate(line.substring(0, 10));
                if (dateTmp.getTime() == dateInput.getTime()) {
                    countStart = i;
                    countFlag = true;
                    output += `${line}<br>`;
                    this.currentDate = dateTmp;
                }
                else if (countFlag && dateInput.getTime() < dateTmp.getTime()) {
                    countStop = i;
                    break;
                }
            }
            else if (countFlag) {
                let lineInfo = line.split("\t");
                let lineNum = i - countStart;
                if (lineInfo.length >= 2) {
                    lineInfo[0] = `<a href="javascript:showLineInfoAlert('${(_a = this.currentDate) === null || _a === void 0 ? void 0 : _a.toLocaleDateString()}',${lineNum});">${lineInfo[0]}</a>`;
                }
                output += `<span id="${lineNum}">${lineInfo.join("\t")}</span><br>`;
                if (i == this.historyData.length - 1) {
                    countStop = i;
                    break;
                }
            }
        }
        if (countStart == -1) {
            output = "この日の履歴はありません。<br>";
        }
        else {
            output += `${countStop - countStart}行<br>`;
        }
        return output;
    }
    searchByKeyword(keyword) {
        let counter = 0;
        let output = "";
        let date = new Date(1, 1, 1);
        let max_date = new Date(1970, 1, 1);
        let countStart = -1;
        if (keyword.length == 1) {
            output += "注意: 1文字検索は大量にヒットする可能性があり、リソースの消費量が多くなる可能性があります。<br><br>";
        }
        for (let i = 0; i < this.historyData.length; i++) {
            let line = this.historyData[i];
            if (Patterns.DATE.test(line)) {
                if (generateDate(line.substring(0, 10)).getTime() >= max_date.getTime()) {
                    date = generateDate(line.substring(0, 10));
                    max_date = date;
                    countStart = i;
                }
            }
            else {
                if (line.search(keyword) != -1) {
                    counter++;
                    if (/\d{2}:\d{2}.*/.test(line)) {
                        line = line.substring(6);
                    }
                    if (line.length >= 60) {
                        line = `${line.substring(0, 60)}...`;
                    }
                    const lineNum = i - countStart;
                    const year = date.getFullYear();
                    const month = zeroPadding(date.getMonth() + 1, 2);
                    const day = zeroPadding(date.getDate(), 2);
                    const dateString = `${year}/${month}/${day}`;
                    output += `<a href="javascript:runSearchByDate('${dateString}', '${lineNum}');" id="dateLink"><spam style="font-weight: bold;">${dateString}@${lineNum}</spam></a> ${line}<br>`;
                }
            }
        }
        output = output == "" ? "見つかりませんでした。" : output;
        this.currentDate = undefined;
        return `<h3 style="display:inline">${counter}件</h3><br><br>${output}`;
    }
    searchByRandom() {
        const dates = Object.keys(this.dateIndices);
        const randomDate = dates[Math.floor(Math.random() * dates.length)];
        const dateString = generateDate(randomDate).toLocaleDateString();
        return this.searchByDate(dateString);
    }
    calcDateIndices() {
        const result = {};
        let current = new Date(1, 1, 1);
        for (let i = 0; i < this.historyData.length; i++) {
            let line = this.historyData[i];
            if (Patterns.DATE.test(line)) {
                const dateTmp = generateDate(line.substring(0, 10));
                if (dateTmp.getTime() >= current.getTime()) {
                    current = dateTmp;
                    result[dateTmp.toLocaleDateString()] = i;
                }
            }
        }
        return result;
    }
}
function createLineWithTime(line, lineNum, currentDate) {
    const lineInfo = line.split("\t");
    if (lineInfo.length >= 2) {
        lineInfo[0] = `
            <a href="javascript:showLineInfoAlert('${currentDate === null || currentDate === void 0 ? void 0 : currentDate.toLocaleDateString()}',${lineNum});">
                ${lineInfo[0]}
            </a>
        `;
    }
    return `<span id="${lineNum}">${lineInfo.join("\t")}</span><br>`;
}
function checkDate(year = 1970, month = 1, day = 1) {
    return year > 0
        && 0 < month
        && month < 13
        && 0 < day
        && day < 32;
}
function generateDate(dateString) {
    const splitDate = dateString.split("/");
    let result;
    if (splitDate.length != 3) {
        result = new Date(1970, 1, 1);
    }
    else {
        const year = parseInt(splitDate[0]);
        const month = parseInt(splitDate[1]);
        const day = parseInt(splitDate[2]);
        if (checkDate(year, month, day)) {
            result = new Date(year, month - 1, day);
        }
        else {
            result = new Date(1970, 1, 1);
        }
    }
    return result;
}
function getRandom(n, m) {
    return Math.floor(Math.random() * (m + 1 - n)) + n;
}
function addAsterisk(message) {
    let result = "";
    const inputSplitted = message.split("<br>");
    for (let i = 0; i < inputSplitted.length; i++) {
        const line = inputSplitted[i];
        result += `＊${line}<br>`;
    }
    return result;
}
function showLineInfoAlert(date, lineNumber) {
    const info = date.split("/").slice(0, 3);
    const year = Number.parseInt(info[0]);
    const month = zeroPadding(Number.parseInt(info[1]), 2);
    const day = zeroPadding(Number.parseInt(info[2]), 2);
    alert(`この行の情報:\n${year}/${month}/${day}@${lineNumber}`);
}
function runCommand(command_, history) {
    const command = command_.split(" ");
    if (command.length < 5) {
        for (let i = 0; i < 5 - command.length; i++) {
            command.push("");
        }
    }
    const commandName = command[0];
    let output = "";
    if (/^20\d{2}\/\d{1,2}\/\d{1,2}$/.test(commandName)) {
        // output = history.searchByDate(commandName);
        output = history.searchByDate(commandName);
    }
    else if (commandName == "/help") {
    }
    else if (commandName == "/random") {
        output = history.searchByRandom();
    }
    else if (commandName == "/search") {
        output = history.searchByKeyword(command[1]);
    }
    else {
        output = makeErrorMessage("command_error");
    }
    if (history.exists == false) {
        output = "⚠️履歴ファイルを選択してください。";
    }
    return output;
}
function makeErrorMessage(message) {
    let result = "コマンドエラーが発生しました。";
    if (message != "") {
        result += `type: ${message}`;
    }
    return result;
}
function zeroPadding(number, length) {
    const numberString = number.toString();
    if (numberString.length >= length)
        return numberString;
    return (Array(length).join('0') + numberString).slice(-length);
}
function runSearchByDate(date, id) {
    var _a;
    const outputField = document.getElementById("outputField");
    const result = runCommand(date, lineHistory);
    writeResult(result, outputField);
    if (id) {
        (_a = document.getElementById(id)) === null || _a === void 0 ? void 0 : _a.scrollIntoView(true);
    }
}
const title = document.getElementById("title");
const fileField = document.getElementById("file");
const dateInput = document.getElementById("dateTimeInput");
const dateSubmitButton = document.getElementById("dateSubmitButton");
const wordInputField = document.getElementById("wordInput");
let inputWord = "";
const wordSubmitButton = document.getElementById("wordSubmitButton");
const randomSubmitButton = document.getElementById("randomSubmitButton");
const outputField = document.getElementById("outputField");
const specialMessage = document.getElementById("specialMessage");
const nextDateButton = document.getElementById("nextDateButton");
const previousDateButton = document.getElementById("previousDateButton");
const currentDateField = document.getElementById("currentDateField");
let lineHistory = new LineHistory();
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
let isLightMode = !mediaQuery.matches;
if (outputField === null || outputField === void 0 ? void 0 : outputField.innerHTML) {
    outputField.innerHTML = `
        <br>
        Welcome back<br>
        <br>
        `;
}
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const day = today.getDate();
const yearDiff = year - 2022;
const monthString = zeroPadding(month, 2);
const dayString = zeroPadding(day, 2);
currentDateField.value = `${year}-${monthString}-${dayString}`;
// 特別な表示の処理 ///////////////////////////
// n周年記念日の表示
// 毎年2/10から2/16に表示
// const today = new Date(2023,2-1,13);
if (month == 2 && 10 <= day && day <= 16 && specialMessage) {
    let ordinal; // 序数詞
    const onesPlace = yearDiff % 10;
    switch (onesPlace) {
        case 1:
            ordinal = "st";
            break;
        case 2:
            ordinal = "nd";
            break;
        case 3:
            ordinal = "rd";
            break;
        default:
            ordinal = "th";
            break;
    }
    specialMessage.innerHTML = `🎉${yearDiff}${ordinal} Anniv!`;
    specialMessage.style.display = "block";
}
// 新年の表示
if (month == 1 && day == 1 && specialMessage) {
    specialMessage.innerHTML = `HappyNewYear!`;
    specialMessage.style.display = "block";
}
//////////////////////////////////////////////////////
let file;
let text;
fileField === null || fileField === void 0 ? void 0 : fileField.addEventListener("change", (e) => {
    var _a, _b;
    file = (_b = (_a = e.target) === null || _a === void 0 ? void 0 : _a.files) !== null && _b !== void 0 ? _b : new FileList();
    let reader = new FileReader();
    reader.readAsText(file[0]);
    reader.onload = (e) => {
        var _a;
        text = (_a = reader.result) !== null && _a !== void 0 ? _a : "";
        if (typeof text == "string") {
            lineHistory = new LineHistory(text);
        }
    };
}, false);
wordInputField === null || wordInputField === void 0 ? void 0 : wordInputField.addEventListener("keyup", (e) => {
    inputWord = e.target.value;
});
dateSubmitButton === null || dateSubmitButton === void 0 ? void 0 : dateSubmitButton.addEventListener("click", (e) => {
    const result = runCommand(dateInput === null || dateInput === void 0 ? void 0 : dateInput.value.replace(/-/g, "/"), lineHistory);
    writeResult(result, outputField);
});
wordSubmitButton === null || wordSubmitButton === void 0 ? void 0 : wordSubmitButton.addEventListener("click", (e) => {
    const result = runCommand(`/search ${inputWord}`, lineHistory);
    writeResult(result, outputField);
});
randomSubmitButton === null || randomSubmitButton === void 0 ? void 0 : randomSubmitButton.addEventListener("click", (e) => {
    const result = runCommand(`/random`, lineHistory);
    writeResult(result, outputField);
});
previousDateButton === null || previousDateButton === void 0 ? void 0 : previousDateButton.addEventListener("click", (e) => {
    const current = lineHistory.currentDate;
    if (current != undefined) {
        const date = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1);
        const result = runCommand(date.toLocaleString().split(' ')[0], lineHistory);
        writeResult(result, outputField);
    }
});
nextDateButton === null || nextDateButton === void 0 ? void 0 : nextDateButton.addEventListener("click", (e) => {
    const current = lineHistory.currentDate;
    if (current != undefined) {
        const date = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
        const result = runCommand(date.toLocaleString().split(' ')[0], lineHistory);
        writeResult(result, outputField);
    }
});
currentDateField === null || currentDateField === void 0 ? void 0 : currentDateField.addEventListener("change", (e) => {
    const result = runCommand(currentDateField === null || currentDateField === void 0 ? void 0 : currentDateField.value.replace(/-/g, "/"), lineHistory);
    writeResult(result, outputField);
});
function writeResult(result, htmlElement) {
    if ((htmlElement === null || htmlElement === void 0 ? void 0 : htmlElement.innerHTML) && result != "") {
        htmlElement.innerHTML = addAsterisk(result);
    }
    if (currentDateField) {
        const currentDate = lineHistory.currentDate;
        if (currentDate != undefined) {
            const month = zeroPadding(currentDate.getMonth() + 1, 2);
            const date = zeroPadding(currentDate.getDate(), 2);
            currentDateField.value = `${currentDate === null || currentDate === void 0 ? void 0 : currentDate.getFullYear()}-${month}-${date}`;
        }
        else {
            currentDateField.value = "";
        }
    }
}