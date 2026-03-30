const form = document.getElementById("contactForm");

let formStartTime = Date.now();

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const button = form.querySelector("button");
    button.innerText = "Sending...";
    button.disabled = true;

    // ✅ Get values by ID (correct way)
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const message = document.getElementById("message").value.trim();
    const honeypot = document.getElementById("honeypot").value;

    const data = {
        name,
        email,
        phone,
        message,
        honeypot,
        formTime: formStartTime
    };

    // 🔒 Validation
    if (!name || !email || !message) {
        showMessage("All fields are required", "red");
        return resetBtn(button);
    }

    if (!email.includes("@")) {
        showMessage("Invalid email", "red");
        return resetBtn(button);
    }

    if (Date.now() - formStartTime < 3000) {
        showMessage("Please wait before submitting", "red");
        return resetBtn(button);
    }

    try {
        const res = await fetch("https://contact-backend-2yw5.onrender.com/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.success) {
            showMessage("Message sent successfully!", "green");
            form.reset();
            formStartTime = Date.now();
        } else {
            showMessage(result.error || "Failed to send", "red");
        }

    } catch (err) {
        showMessage("Server error", "red");
    }

    resetBtn(button);
});

// helpers
function showMessage(msg, color) {
    let el = document.getElementById("formMsg");

    if (!el) {
        el = document.createElement("p");
        el.id = "formMsg";
        form.appendChild(el);
    }

    el.innerText = msg;
    el.style.color = color;
}

function resetBtn(button) {
    button.innerText = "Send";
    button.disabled = false;
}