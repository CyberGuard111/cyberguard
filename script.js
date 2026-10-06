const input = document.getElementById("inputText");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const result = document.getElementById("result");

const riskTitle = document.getElementById("riskTitle");
const riskIcon = document.getElementById("riskIcon");
const riskProgress = document.getElementById("riskProgress");
const riskScore = document.getElementById("riskScore");
const reasonsList = document.getElementById("reasonsList");
const adviceText = document.getElementById("adviceText");

const mainPage = document.getElementById("mainPage");
const infoPage = document.getElementById("infoPage");
const logoHome = document.getElementById("logoHome");
const navInfoBtn = document.getElementById("navInfoBtn");
const backToHomeBtn = document.getElementById("backToHomeBtn");

function analyzeText(text) {
    let score = 0;
    let reasons = [];
    const lower = text.toLowerCase();

    const keywords = [
        { words: ["пароль", "password", "passwd"], points: 20, reason: "Запитується пароль." },
        { words: ["терміново", "негайно", "urgent"], points: 15, reason: "Використовується тиск та терміновість." },
        { words: ["підтвердіть", "verify", "verification"], points: 15, reason: "Текст просить підтвердити акаунт." },
        { words: ["код підтвердження", "otp", "2fa"], points: 25, reason: "Запитується секретний код підтвердження." },
        { words: ["банк", "bank", "кредитна картка"], points: 20, reason: "Згадуються конфіденційні банківські дані." },
        { words: ["ви виграли", "winner", "приз", "bonus"], points: 15, reason: "Обіцяється раптовий приз або нагорода." }
    ];

    for (const item of keywords) {
        for (const word of item.words) {
            if (lower.includes(word)) {
                score += item.points;
                reasons.push(item.reason);
                break;
            }
        }
    }

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlRegex);

    if (urls) {
        score += Math.min(urls.length * 5, 15);
        reasons.push(`Виявлено посилань у тексті: ${urls.length}.`);

        const urlResult = { score: 0, reasons: [] };
        for (const url of urls) {
            analyzeURL(url, urlResult);
        }
        
        score += urlResult.score;
        reasons.push(...urlResult.reasons);
    }

    score = Math.min(score, 100);
    return { score, reasons };
}

function analyzeURL(url, resultObj) {
    try {
        const parsed = new URL(url);

        if (parsed.protocol === "http:") {
            resultObj.score += 15;
            resultObj.reasons.push("Посилання використовує незахищений протокол HTTP замість HTTPS.");
        }
        if (url.includes("@")) {
            resultObj.score += 25;
            resultObj.reasons.push("У посиланні знайдено символ @ — це прийом приховування реального домену.");
        }
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}\$/;
        if (ipRegex.test(parsed.hostname)) {
            resultObj.score += 25;
            resultObj.reasons.push("Посилання веде прямо на IP-адресу, маскуючись під назву сайту.");
        }
        const shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly"];
        if (shorteners.includes(parsed.hostname)) {
            resultObj.score += 15;
            resultObj.reasons.push("Використовується скорочена URL-адреса (може приховувати небезпечний фішинг).");
        }
        if (url.length > 180) {
            resultObj.score += 10;
            resultObj.reasons.push("Посилання незвично довге.");
        }
        if (parsed.hostname.includes("--") || parsed.hostname.includes("..")) {
            resultObj.score += 10;
            resultObj.reasons.push("Домен має дивну структуру піддоменів.");
        }
        const suspiciousWords = ["login", "verify", "secure", "account", "update", "password"];
        for (const word of suspiciousWords) {
            if (parsed.hostname.includes(word)) {
                resultObj.score += 10;
                resultObj.reasons.push(`У самій назві домену знайдено підозріле слово: "${word}".`);
                break;
            }
        }
    } catch {
        resultObj.score += 10;
        resultObj.reasons.push("Виявлено текст, дуже схожий на пошкоджене посилання.");
    }
}

function runAnalysis(text) {
    const analysis = analyzeText(text);
    analysis.reasons = [...new Set(analysis.reasons)];
    return {
        score: Math.min(analysis.score, 100),
        reasons: analysis.reasons
    };
}

function showResult(score, reasons) {
    result.classList.remove("hidden");
    riskScore.textContent = score;
    riskProgress.style.width = score + "%";
    reasonsList.innerHTML = "";

    if (reasons.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Явних підозрілих ознак не виявлено.";
        reasonsList.appendChild(li);
    } else {
        for (const reason of reasons) {
            const li = document.createElement("li");
            li.textContent = reason;
            reasonsList.appendChild(li);
        }
    }

    if (score < 25) {
        riskTitle.textContent = "Низький ризик";
        riskIcon.textContent = "✓";
        riskIcon.style.backgroundColor = "#123b2d";
        riskIcon.style.color = "#5bf0ae";
        riskProgress.style.backgroundColor = "#35d394";
        adviceText.textContent = "Явних підозрілих ознак мало. Але автоматичний аналіз не гарантує безпеку.";
    } 
    else if (score < 60) {
        riskTitle.textContent = "Підозріло";
        riskIcon.textContent = "!";
        riskIcon.style.backgroundColor = "#3b3214";
        riskIcon.style.color = "#f0cf5b";
        riskProgress.style.backgroundColor = "#d8b83d";
        adviceText.textContent = "Будьте обережні. Повідомлення нагадує хитрощі соц. інженерії. Не передавайте особисті дані.";
    } 
    else {
        riskTitle.textContent = "Високий ризик";
        riskIcon.textContent = "×";
        riskIcon.style.backgroundColor = "#3b1616";
        riskIcon.style.color = "#ff6262";
        riskProgress.style.backgroundColor = "#e33b3b";
        adviceText.textContent = "Вкрай висока ймовірність обману! Виявлено кілька маркерів шахрайства.";
    }
    
    result.scrollIntoView({ behavior: 'smooth' });
}

analyzeBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) {
        alert("Будь ласка, вставте текст повідомлення.");
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "⏳ СКАНУВАННЯ...";
    result.classList.add("hidden"); 

    setTimeout(() => {
        const analysis = runAnalysis(text);
        showResult(analysis.score, analysis.reasons);
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "🔍 ПЕРЕВІРИТИ";
    }, 800); 
});

clearBtn.addEventListener("click", () => {
    input.value = "";
    result.classList.add("hidden");
    riskProgress.style.width = "0%";
});

function goToHomePage() {
    infoPage.classList.add("hidden");
    mainPage.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToInfoPage() {
    mainPage.classList.add("hidden");
    infoPage.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

logoHome.addEventListener("click", goToHomePage);
backToHomeBtn.addEventListener("click", goToHomePage);
navInfoBtn.addEventListener("click", goToInfoPage);
