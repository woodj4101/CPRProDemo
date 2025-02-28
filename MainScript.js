


const PHASE = {
	None: -1,
	Fibrill: 0,
	ChResp: 1,
	Call119: 2,
	ReqAED: 3,
	ChBreath: 4,
	StartCPR: 5,
	ArriveAED: 6,
	PowerOnAED: 7,
	AttachPads: 8,
	AnalyzeECG1C: 9,
	Clear1C: 10,
	Shock1C: 11,
	AnalyzeECG2C: 12,
	Clear2C: 13,
	Shock2C: 14,
	AnalyzeECG3C: 15,
	Clear3C: 16,
	Shock3C: 17,
	Restored: 18,
	FullArrest: 19
};

const glowTarget = [
	"#arrestBtn",
	"#checkResponseBtn",
	"#call119Btn",
	"#requestAEDBtn",
	"#checkBreathBtn",
	"#startCPRBtn",
	"#aedArriveBtn",
	"#aedPowerOnBtn",
	"#attachPadsBtn",
	"#analyzeECGBtn",
	"#ensureClearBtn",
	"#shockBtn"
];

const apprentice = [
	".apprenticeN1",
	".apprenticeN2"
];

var stage = PHASE.None;
var patient = true;

var timeStamp = Array.from({length: PHASE.FullArrest + 1}, () => 0);

function updateBtn() {
	if (stage < PHASE.Restored) stage++;

	resetGlowCSS();

	if (stage == PHASE.Fibrill) {
		$("#arrestBtn").css({
			backgroundColor: "#a9a9a9",
			color: "#696969",
			border: "solid 1px #909090"
		});
		$("#arrestBtn").text("환자 : 세동");

		showBtn(glowTarget, 1, true);

		setTimeout( () => {
			if (stage < PHASE.StartCPR) {
				patient = false;
				$("#arrestBtn").text("환자 : 심정지");
			}
		}, 480000);
	} else if (stage < PHASE.StartCPR) {
		disableBtn(glowTarget[glowindx]);
		let second = 1;
		if (stage == PHASE.ChResp) second = 3.5;
		else if (stage == PHASE.ChBreath) second = 5;
		showBtn(glowTarget, second, true);
	} else if (stage == PHASE.StartCPR) {
		showBtn(glowTarget, 60, true);
		showBtn("#switchCompressBtn");
		showBtn("#metronumeBtn");
	} else if (stage < PHASE.Shock3C) {
		disableBtn(glowTarget[glowindx]);
		showBtn(glowTarget, 1, true);
	} else if (stage == PHASE.Shock3C) {
		endTraining();
	}

	timeStamp[stage] = new Date();
}

function disableBtn(target) {
	$(target).css({ display: "none" });
}

function showBtn(target, second = 0, isGlowIndxIncrease = false) {
	if (isGlowIndxIncrease) {
		if (glowindx >= 11) glowindx = 9;
			else glowindx++;
		}

		if (target == glowTarget) target = glowTarget[glowindx];

		if (second <= 0) {
			$(target).css({ display: "block" });
		} else {
			setTimeout( () => {
				$(target).css({ display: "block" });
			}, second * 1000);
		}
}

var currentCPR = false;
var currentApprentice = 0;
var totalCPRTime = Array.from({length: 2}, () => 0);
var totalStopTime = Array.from({length: 2}, () => 0);
var startCPRTime = 0;
var stopCPRTime = 0;
var updateCCFGauge = 0;
function measureCPR(isEnd = false) {
	if (updateCCFGauge == 0) updateCCFGauge = setInterval(updateCCF, 100);

	if (isEnd) {
		if (currentCPR) {
			totalCPRTime[currentApprentice] += Date.now() - startCPRTime;
			disableBtn("#stopCPRBtn");
			changeSVGColor(apprentice[currentApprentice]);
		} else {
			totalStopTime[currentApprentice] += Date.now() - stopCPRTime;
			disableBtn("#startCPRBtn");
		}
		startCPRTime = 0;
		stopCPRTime = 0;
		currentCPR = false;
		clearInterval(updateCCFGauge);
		updateCCF();
		return;
	}

	if (currentCPR) {
		showBtn("#startCPRBtn");
		disableBtn("#stopCPRBtn");
		changeSVGColor(apprentice[currentApprentice]);
		currentCPR = false;
		stopCPRTime = Date.now();
		totalCPRTime[currentApprentice] += stopCPRTime - startCPRTime;
		startCPRTime = 0;
	} else {
		showBtn("#stopCPRBtn");
		disableBtn("#startCPRBtn");
		changeSVGColor(apprentice[currentApprentice], "#ff0000");
		currentCPR = true;
		startCPRTime = Date.now();
		if (stopCPRTime != 0) totalStopTime[currentApprentice] += startCPRTime - stopCPRTime;
		stopCPRTime = 0;
	}
}

function swapApprentice() {
	requestAnimationFrame(function() {
		if (currentCPR) measureCPR();

		let appren1 = $("#WrapA1").children();
		let appren2 = $("#WrapA2").children();

		if (currentApprentice == 0) {
			currentApprentice = 1;
		} else {
			currentApprentice = 0;
		}
					
		$("#WrapA1").empty().append(appren2);
		$("#WrapA2").empty().append(appren1);

		disableBtn("#switchCompressBtn");
		showBtn("#switchCompressBtn", 10);
	});
}

function changeSVGColor(target, color = "") {
	if (color == "") {
		$(target).css({ fill : "" });
		$(target + " *").css({ stroke : "" });
	} else {
		$(target).css({ fill : color });
		$(target + " *").css({ stroke : color });
	}
}
			
var ccfPercent = 0;
function updateCCF() {
	let total = Date.now() - timeStamp[PHASE.StartCPR];
	let totalStop = 0;
	if (currentCPR) {
		totalStop = totalStopTime[0] + totalStopTime[1];
		ccfPercent = (total - totalStop) / total;
	} else {
		totalCPR = totalCPRTime[0] + totalCPRTime[1];
		ccfPercent = totalCPR / total;
	}
	ccfPercent = ccfPercent * 100;

	if (!isChangeCCFRunning) startChangeCCF();
}

var isGlowBtnRunning = true;
var glow = false;
var glowindx = 0;
function stopGlowBtn() { isGlowBtnRunning = false; }
function restartGlowBtn() { isGlowBtnRunning = true; requestAnimationFrame(glowBtn); }
function glowBtn() {
	if (!isGlowBtnRunning) return;

	if ($(glowTarget[glowindx]).css("display") == "none") {
		requestAnimationFrame(glowBtn);
		return;
	}

	let glowTextColor;
	let glowBackgroundColor;
	let glowBorderColor;

	if (glowTarget[glowindx] == "#arrestBtn") {
		glowTextColor = "#ffff00";
		glowBackgroundColor = "#FDECDA";
		glowBorderColor = "1px solid #FF9D7F";
	} else {
		glowTextColor = "#ffa500";
		glowBackgroundColor = "#ffffe0";
		glowBorderColor = "1px solid #ff9248";
	}

	if (glow) {
		resetGlowCSS();
		glow = false;
		setTimeout(() => requestAnimationFrame(glowBtn), 1000);
	} else {
		$(glowTarget[glowindx]).css({
			color: glowTextColor,
			backgroundColor: glowBackgroundColor,
			border: glowBorderColor
		});
		glow = true;
		setTimeout(() => requestAnimationFrame(glowBtn), 150);
	}
}

function resetGlowCSS() {
	$(glowTarget[glowindx]).css({
		color: "",
		backgroundColor: "",
		border: ""
	});
}

var isChangeCCFRunning = false;
function stopChangeCCF() { isChangeCCFRunning = false; }
function startChangeCCF() { isChangeCCFRunning = true; requestAnimationFrame(changeCCF); }
function changeCCF() {
	if (!isChangeCCFRunning) return;

	$("#ccfValue").css({ width: ccfPercent + "%" });
	$("#ccfProgress").attr("data-percent", (Math.round(ccfPercent * 10) / 10) + "%");

	let maxWidth = $("#ccfProgress").width();
	let currentWidth = $("#ccfValue").width();
	let widthPercent = (currentWidth / maxWidth);

	if (widthPercent < 0.3) {
		$("#ccfValue").css({ backgroundColor: "#ff0000" });
	} else if (widthPercent < 0.45) {
		$("#ccfValue").css({ backgroundColor: "#FF8000" });
	} else if (widthPercent < 0.6) {
		$("#ccfValue").css({ backgroundColor: "#ffff00" });
	} else if (widthPercent < 0.8) {
		$("#ccfValue").css({ backgroundColor: "#A6D728" });
	} else {
		$("#ccfValue").css({ backgroundColor: "#4caf50" });
	}

	requestAnimationFrame(changeCCF);
}

function endTraining() {
	if (patient) timeStamp[++stage] = new Date();
	else timeStamp[PHASE.FullArrest] = new Date();
	resetGlowCSS();
	disableBtn(".defaultBtn");
	stopChangeCCF();
	stopGlowBtn();
	measureCPR(true);
}

$(function() {
	$(".mainPanel").on("click", "button", function(event) {
		const buttonId = event.target.id;
		const buttonClass = event.target.classList;

		if (buttonId == "arrestBtn") {
			if (stage == PHASE.None) updateBtn();
		} else if (buttonId == "startCPRBtn" || buttonId == "stopCPRBtn") {
			measureCPR();
		} else if (buttonId == "switchCompressBtn") {
			swapApprentice();
		}

		if (buttonClass.contains("defaultBtn")) {
			if ($("#WrapA1").find(event.target).length > 0 || $("#WrapA2").find(event.target).length > 0) {
				if (stage <= PHASE.ChBreath) updateBtn();
			} else {
				if (stage <= PHASE.Shock3C) updateBtn();
			}
		}
	});

	requestAnimationFrame(glowBtn);
});