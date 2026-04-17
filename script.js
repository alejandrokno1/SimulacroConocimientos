
let quizData = null;

const questionsContainer = document.getElementById("questionsContainer");
const quizForm = document.getElementById("quizForm");
const resetBtn = document.getElementById("resetBtn");
const loadingMessage = document.getElementById("loadingMessage");

const resultModal = document.getElementById("resultModal");
const closeModalBtn = document.getElementById("closeModalBtn");

const scoreValue = document.getElementById("scoreValue");
const percentageValue = document.getElementById("percentageValue");
const performanceValue = document.getElementById("performanceValue");
const resultMessage = document.getElementById("resultMessage");
const resultStudent = document.getElementById("resultStudent");
const studentName = document.getElementById("studentName");

const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");

function getPerformanceByPercentage(percentage) {
  if (percentage >= 90) {
    return {
      level: "Excelente desempeño",
      interpretation: "Tu resultado refleja un dominio muy sólido del contenido evaluado. Mantén este nivel de preparación y continúa reforzando detalles puntuales."
    };
  }

  if (percentage >= 75) {
    return {
      level: "Muy buen desempeño",
      interpretation: "Tu resultado muestra una preparación favorable. Existen algunos puntos por revisar, pero en general avanzas con buen nivel."
    };
  }

  if (percentage >= 60) {
    return {
      level: "Buen avance",
      interpretation: "Tu resultado evidencia avances importantes, aunque todavía conviene reforzar varios temas antes de una evaluación formal."
    };
  }

  return {
    level: "Debes seguir fortaleciendo",
    interpretation: "Tu resultado indica que aún es necesario reforzar varios contenidos. Revisar las preguntas incorrectas te ayudará a orientar mejor tu estudio."
  };
}

function renderQuestions() {
  const totalQuestions = quizData.questions.length;

  questionsContainer.innerHTML = quizData.questions.map((question) => {
    const optionsHtml = Object.entries(question.options).map(([letter, text]) => `
      <label class="option">
        <input type="radio" name="q${question.number}" value="${letter}">
        <span><strong>${letter}.</strong> ${text}</span>
      </label>
    `).join("");

    return `
      <article class="question-card" data-question="${question.number}">
        <p class="question-title"><strong>${question.number}.</strong> ${question.question}</p>
        <div class="options">${optionsHtml}</div>
      </article>
    `;
  }).join("");

  loadingMessage.classList.add("hidden");
  progressText.textContent = `0 de ${totalQuestions} preguntas respondidas`;
  addProgressListeners();
  updateProgress();
}

function addProgressListeners() {
  const inputs = quizForm.querySelectorAll('input[type="radio"]');
  inputs.forEach((input) => {
    input.addEventListener("change", () => {
      removeMissingHighlight(input.name);
      updateProgress();
    });
  });
}

function updateProgress() {
  if (!quizData) return;

  let answered = 0;
  for (const question of quizData.questions) {
    const selected = quizForm.querySelector(`input[name="q${question.number}"]:checked`);
    if (selected) answered++;
  }

  const percent = Math.round((answered / quizData.questions.length) * 100);
  progressText.textContent = `${answered} de ${quizData.questions.length} preguntas respondidas`;
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

function clearMissingHighlights() {
  document.querySelectorAll(".question-card.missing").forEach((card) => {
    card.classList.remove("missing");
  });
}

function removeMissingHighlight(questionName) {
  const number = questionName.replace("q", "");
  const card = document.querySelector(`.question-card[data-question="${number}"]`);
  if (card) card.classList.remove("missing");
}

function highlightMissingQuestions(missingNumbers) {
  clearMissingHighlights();
  missingNumbers.forEach((number) => {
    const card = document.querySelector(`.question-card[data-question="${number}"]`);
    if (card) card.classList.add("missing");
  });
}

function openModal() {
  resultModal.classList.remove("hidden");
}

function closeModal() {
  resultModal.classList.add("hidden");
}

async function loadQuiz() {
  try {
    const response = await fetch("preguntas_simulacro_milla_extra.json");
    quizData = await response.json();
    renderQuestions();
  } catch (error) {
    loadingMessage.textContent = "No se pudieron cargar las preguntas. Verifica que el archivo JSON esté en la misma carpeta.";
    console.error(error);
  }
}

quizForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!quizData) return;

  const formData = new FormData(quizForm);
  let unansweredQuestions = [];
  let correctCount = 0;
  let incorrectCount = 0;
  let incorrectItems = [];

  for (const question of quizData.questions) {
    const selected = formData.get(`q${question.number}`);

    if (selected === null) {
      unansweredQuestions.push(question.number);
    } else if (selected === question.correct) {
      correctCount++;
    } else {
      incorrectCount++;
      incorrectItems.push(question.number);
    }
  }

  if (unansweredQuestions.length > 0) {
    highlightMissingQuestions(unansweredQuestions);

    const firstMissing = document.querySelector(`.question-card[data-question="${unansweredQuestions[0]}"]`);
    if (firstMissing) {
      firstMissing.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    alert(
      "Por favor responda todas las preguntas antes de calcular el resultado.\n\n" +
      "Le faltan las preguntas: " + unansweredQuestions.join(", ")
    );
    return;
  }

  clearMissingHighlights();

  const percentage = ((correctCount / quizData.questions.length) * 100).toFixed(1);
  const performance = getPerformanceByPercentage(Number(percentage));
  const name = studentName.value.trim();

  resultStudent.textContent = name
    ? `Participante: ${name}`
    : "Resultado general del simulacro";

  scoreValue.textContent = `${correctCount} / ${quizData.questions.length}`;
  percentageValue.textContent = `${percentage}%`;
  performanceValue.textContent = performance.level;

  const incorrectText = incorrectItems.length > 0
    ? incorrectItems.join(", ")
    : "No se identifican preguntas incorrectas.";

  resultMessage.innerHTML = `
    <div class="detail-card">
      <h3 class="detail-title">Detalle del resultado</h3>

      <div class="detail-list">
        <div class="detail-item">
          <span>Respuestas correctas</span>
          <strong>${correctCount}</strong>
        </div>
        <div class="detail-item">
          <span>Respuestas incorrectas</span>
          <strong>${incorrectCount}</strong>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-item success">
          <strong>${correctCount}</strong>
          <p>preguntas fueron respondidas correctamente y aportaron a tu puntaje final.</p>
        </div>

        <div class="summary-item neutral">
          <strong>${incorrectCount}</strong>
          <p>preguntas quedaron incorrectas y conviene revisarlas nuevamente.</p>
        </div>
      </div>

      <div class="items-box">
        <h4>Preguntas por revisar</h4>
        <p>${incorrectText}</p>
      </div>

      <div class="interpret-box">
        <h4>Interpretación</h4>
        <p>${performance.interpretation}</p>
      </div>

      <div class="note-box">
        <h4>Nota final</h4>
        <p>Este resultado tiene un carácter académico y de práctica. Puedes repetir el simulacro para reforzar los temas que requieren mayor estudio.</p>
      </div>
    </div>
  `;

  openModal();
});

resetBtn.addEventListener("click", () => {
  quizForm.reset();
  studentName.value = "";
  updateProgress();
  closeModal();
  clearMissingHighlights();

  scoreValue.textContent = "0 / 0";
  percentageValue.textContent = "0%";
  performanceValue.textContent = "—";
  resultMessage.innerHTML = "";
  resultStudent.textContent = "";
});

closeModalBtn.addEventListener("click", closeModal);

resultModal.addEventListener("click", (event) => {
  if (event.target === resultModal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

loadQuiz();
