/* ===============================
   FORM VALIDATION
================================ */
function validateForm(form) {
  let isValid = true;
  const inputs = form.querySelectorAll("input, select, textarea");

  inputs.forEach(input => {
    input.classList.remove("error");

    if (input.hasAttribute("required") && !input.value.trim()) {
      input.classList.add("error");
      isValid = false;
    }

    if (
      input.id === "phone" &&
      input.value.trim() &&
      !/^[0-9]{10}$/.test(input.value)
    ) {
      input.classList.add("error");
      isValid = false;
    }

    if (input.id === "date" && input.value) {
      const selectedDate = new Date(input.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        input.classList.add("error");
        isValid = false;
      }
    }
  });

  return isValid;
}

/* ===============================
   TIME HELPERS
================================ */
// "08:00 AM" → "08:00"
function convertTo24Hour(timeStr) {
  if (!timeStr) return "";
  const [time, meridian] = timeStr.split(" ");
  let [hour, minute] = time.split(":").map(Number);

  if (meridian === "PM" && hour !== 12) hour += 12;
  if (meridian === "AM" && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

// "08:00" → "08:00 AM"
function toAmPmLabel(time24) {
  const [hh, mm] = time24.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = ((hh + 11) % 12) + 1;
  return `${hour12.toString().padStart(2, "0")}:${mm
    .toString()
    .padStart(2, "0")} ${ampm}`;
}

/* ===============================
   LOAD AVAILABLE SLOTS (BACKEND)
================================ */
async function loadAvailableSlots(dateStr) {
  const timeSelect = document.getElementById("time");

  if (!dateStr) {
    timeSelect.innerHTML = '<option value="">Select a date first</option>';
    return;
  }

  timeSelect.innerHTML = '<option value="">Checking availability...</option>';

  try {
    const res = await fetch(
      `http://127.0.0.1:5000/available-slots?date=${dateStr}`
    );
    const data = await res.json();

    if (data.status !== "success") {
      timeSelect.innerHTML =
        '<option value="">Unable to load slots</option>';
      return;
    }

    const slots = data.slots || [];

    if (slots.length === 0) {
      timeSelect.innerHTML =
        '<option value="">No slots available</option>';
      return;
    }

    timeSelect.innerHTML = '<option value="">Select a time</option>';

    slots.forEach(time24 => {
      const option = document.createElement("option");
      option.value = toAmPmLabel(time24);
      option.textContent = toAmPmLabel(time24);
      timeSelect.appendChild(option);
    });
  } catch (err) {
    console.error(err);
    timeSelect.innerHTML = '<option value="">Server error</option>';
  }
}

/* ===============================
   FORM SUBMISSION (BACKEND)
================================ */
async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const statusMsg = document.getElementById("status-msg");

  if (!validateForm(form)) {
    statusMsg.textContent = "❌ Please correct the highlighted fields.";
    statusMsg.style.color = "#dc3545";
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  const payload = {
    name: data.name,
    date: data.date,
    time: convertTo24Hour(data.time),
    reason: `
Service: ${data.service}
Phone: ${data.phone}
Address: ${data.address}
Notes: ${data.notes || "N/A"}
`.trim()
  };

  statusMsg.textContent = "Booking your appointment...";
  statusMsg.style.color = "#0fa3d4";

  try {
    const res = await fetch(
      "http://127.0.0.1:5000/create-appointment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const result = await res.json();

    if (result.status === "success") {
      statusMsg.textContent =
        "✅ Appointment booked and added to Google Calendar!";
      statusMsg.style.color = "#198754";
      alert("Appointment booked successfully!");
      form.reset();
      document.getElementById("time").innerHTML =
        '<option value="">Select a time</option>';
    } else {
      statusMsg.textContent =
        "❌ " + (result.message || "Slot not available.");
      statusMsg.style.color = "#dc3545";
    }
  } catch (err) {
    console.error(err);
    statusMsg.textContent =
      "❌ Could not connect to booking server.";
    statusMsg.style.color = "#dc3545";
    alert("Make sure backend (python app.py) is running.");
  }
}

/* ===============================
   EVENT LISTENERS
================================ */
const bookingForm = document.getElementById("bookingForm");
if (bookingForm) {
  bookingForm.addEventListener("submit", handleFormSubmit);
}

const dateInput = document.getElementById("date");
if (dateInput) {
  dateInput.addEventListener("change", e =>
    loadAvailableSlots(e.target.value)
  );
}

/* ===============================
   SCROLL TO TOP
================================ */
(function () {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 300);
  });

  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
})();
