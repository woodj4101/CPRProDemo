


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

/*
			
			const STATE = {
				NORMAL: "NORMAL",
				VF: "VF",
				CPR: "CPR",
				DEF: "DEF",
				END: "END"
			};
			
			var isPatientAttachPad = false;
			
			let patient = STATE.NORMAL;
			
			const anormalECG = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
							0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
							0.08, 0.18, 0.08, 0, 0, 0, 0, 0, 0, -0.04, 
							-0.08, 0.3, 0.7, 0.3, -0.17, 0.00, 0.04, 0.04, 
							0.05, 0.05, 0.06, 0.07, 0.08, 0.10, 0.11, 0.11, 
							0.10, 0.085, 0.06, 0.04, 0.03, 0.01, 0.01, 0.01, 
							0.01, 0.02, 0.03, 0.05, 0.05, 0.05, 0.03, 0.02, 0, 0, 0];
							
			const normalECG = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0, 0, 0, 1,];

			var normalECGidx = 0;
			
			function getNormalECG() {
				if (normalECGidx++ >= normalECG.length - 1) normalECGidx=0;
				var output = new Array();
				output[0] = normalECG[normalECGidx] + hysteresisRandom()/10;
				return output;
			}
			
			const defECG = [-1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
			
			var defECGidx = 0;
			function getDefECG() {
				var output = new Array();
				if (defECGidx < 15) {
					output[0] = -1;
				} else if (defECGidx < 30) {
					output[0] = 1;
				} else {
					output[0] = 0;
				}
				
				if (defECGidx >= 40) {
					defECGidx=0;
					patient = STATE.NORMAL;
					output[0] = 0;
				}
				
				defECGidx = defECGidx + 1;
				return output;
			}
			
			function generateVFECGData(length) {
    const data = [];
    let value = 0;
    for (let i = 0; i < length; i++) {
        // -0.05에서 0.05 사이의 무작위 값 생성
        const change = (Math.random() - 0.5) * 0.1;
        value += change;
        // 값이 -1과 1 사이로 유지되도록 제한
        if (value > 1) value = 1;
        if (value < -1) value = -1;
        data.push(value);
    }
    return data;
}
			
			var data1 = generateVFECGData(1000);

			var count1 = 0;
			function getECG(){
				
				if (count1 >= anormalECG.length) count1 = 0;
				
				var output = new Array();
				if (!isPatientAttachPad) {
					output[0] = -1 + hysteresisRandom()/10;
				} else {
					output[0] = anormalECG[count1] + hysteresisRandom()/10;
				}
				count1 = count1 + 1;
				return output;
			}
			
			const ecgChart = new PlethGraph("ecgChart", getECG);
			
			ecgChart.scaleFactor = 1;
			ecgChart.speed = 2;
			ecgChart.linewidth = 0.5;
			ecgChart.start();
			
			document.getElementById("AEDPadBtn").addEventListener("click", () => {
				isPatientAttachPad = true;
			});
*/