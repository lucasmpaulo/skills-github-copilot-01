document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  const showMessage = (text, type = "info") => {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  };

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) =>
      ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[char])
    );

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Selecione uma atividade --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section
        const participants = details.participants || [];
        let participantsHtml = `<div class="participants">
          <h5>Participantes</h5>`;

        if (participants.length) {
          participantsHtml += '<ul>' + participants.map((p) => {
            const safeParticipant = escapeHtml(p);
            const safeActivity = escapeHtml(name);
            return `
              <li class="participant-item">
                <span class="participant-name">${safeParticipant}</span>
                <button
                  type="button"
                  class="participant-remove-btn"
                  data-activity="${safeActivity}"
                  data-email="${safeParticipant}"
                  title="Remover participante"
                >
                  ×
                </button>
              </li>`;
          }).join('') + '</ul>';
        } else {
          participantsHtml += '<p class="no-participants">Nenhum participante inscrito ainda.</p>';
        }

        participantsHtml += '</div>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Horario:</strong> ${details.schedule}</p>
          <p><strong>Disponibilidade:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  const removeParticipant = async (activity, email) => {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();
      showMessage(result.message, response.ok ? "success" : "error");

      if (response.ok) {
        fetchActivities();
      }
    } catch (error) {
      showMessage("Não foi possível remover o participante. Tente novamente.", "error");
      console.error("Error removing participant:", error);
    }
  };

  activitiesList.addEventListener("click", (event) => {
    const button = event.target.closest(".participant-remove-btn");
    if (!button) return;

    const activity = button.dataset.activity;
    const email = button.dataset.email;
    if (activity && email) {
      removeParticipant(activity, email);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
