
/* JobHub Login */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector(".auth-card form");

    if (!form) return;

    form.noValidate = true;

    const email = document.getElementById("email");
    const password = document.getElementById("password");

    const remember = form.querySelector(
        'input[name="remember"]'
    );

    const submit = form.querySelector(
        'button[type="submit"]'
    );

    // ===== PASSWORD EYE =====

    JobHubAuth.passwordEye(password);

    // ===== CAPTCHA =====

    const cap = JobHubAuth.captcha(form);

    // ===== FORM ERRORS =====

    JobHubAuth.initErrors(form);

    // ===== PREFILL EMAIL AFTER SIGNUP =====

    const prefill = sessionStorage.getItem(
        JobHubAuth.PREFILL_KEY
    );

    if (prefill) {
        email.value = prefill;

        sessionStorage.removeItem(
            JobHubAuth.PREFILL_KEY
        );
    }

    // ===== FORGOT PASSWORD =====

    const forgot = document.querySelector(".forgot-link");

    if (forgot) {
        forgot.addEventListener("click", (e) => {

            e.preventDefault();

            JobHubAuth.toast(
                "Password reset requires a secure backend. Please contact support.",
                true
            );
        });
    }

    // ===== LOGIN SUBMIT =====

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        if (submit.disabled) return;

        const mail = email.value.trim().toLowerCase();

        const fail = (field, text) => {
            JobHubAuth.message(field, text);
            JobHubAuth.toast(text, true);
        };

        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
            return fail(
                email,
                "Enter a valid email address."
            );
        }

        // Password validation
        if (!password.value) {
            return fail(
                password,
                "Enter your password."
            );
        }

        // CAPTCHA validation
        if (!cap || !cap.valid()) {

            if (cap) {
                cap.refresh();

                fail(
                    cap.field,
                    "Incorrect CAPTCHA. Please try again."
                );
            } else {
                JobHubAuth.toast(
                    "CAPTCHA is unavailable. Refresh the page.",
                    true
                );
            }

            return;
        }

        submit.disabled = true;

        let loginSuccessful = false;

        try {

            // Find registered user
            const user = JobHubAuth.users().find(
                user => user.email?.toLowerCase() === mail
            );

            // Verify password
            const valid =
                user?.passwordSalt &&
                user?.passwordHash &&
                (await JobHubAuth.hashPassword(
                    password.value,
                    user.passwordSalt
                )) === user.passwordHash;

            if (!valid) {

                cap.refresh();

                fail(
                    password,
                    "Invalid email or password."
                );

                return;
            }

            // ===== SAVE LOGIN SESSION =====

            JobHubAuth.setCurrentUser(
                user,
                Boolean(remember?.checked)
            );

            loginSuccessful = true;
            JobHubAuth.toast(
                `Login successful! Welcome back, ${user.firstName || user.name}!`
            );

            // Redirect to home page
            setTimeout(() => {
                window.location.href = "home.html";
            }, 1100);

        } catch (error) {

            console.error("Login error:", error);

            JobHubAuth.toast(
                "Login failed. Please check browser storage and HTTPS.",
                true
            );

        } finally {

            if (!loginSuccessful) {
                submit.disabled = false;
            }
        }
    });

});
