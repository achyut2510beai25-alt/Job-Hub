
/*
  JobHub Authentication Helpers
  FRONTEND DEMO ONLY
  Browser storage is not secure for real authentication.
*/

const JobHubAuth = (() => {

    const USERS_KEY = "jobhub_users";
    const CURRENT_KEY = "jobhub_current_user";
    const PREFILL_KEY = "jobhub_signup_email";
    const THEME_KEY = "jobhub_theme";

    // ===== GET REGISTERED USERS =====

    function users() {
        try {
            const data = JSON.parse(
                localStorage.getItem(USERS_KEY) || "[]"
            );

            return Array.isArray(data) ? data : [];

        } catch (error) {
            return [];
        }
    }

    // ===== GET CURRENT LOGGED-IN USER =====

    function currentUser() {
        try {
            const raw =
                sessionStorage.getItem(CURRENT_KEY) ||
                localStorage.getItem(CURRENT_KEY);

            if (!raw) return null;

            const session = JSON.parse(raw);

            if (!session || !session.id) return null;

            const registeredUser = users().find(
                user => user.id === session.id
            );

            if (!registeredUser) return null;

            return {
                id: registeredUser.id,
                name: registeredUser.name,
                email: registeredUser.email
            };

        } catch (error) {
            console.error("Session error:", error);
            return null;
        }
    }

    // ===== SAVE LOGIN SESSION =====

    function setCurrentUser(user, remember = false) {

        localStorage.removeItem(CURRENT_KEY);
        sessionStorage.removeItem(CURRENT_KEY);

        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        const storage = remember
            ? localStorage
            : sessionStorage;

        storage.setItem(
            CURRENT_KEY,
            JSON.stringify(safeUser)
        );
    }

    // ===== LOGOUT =====

    function logout() {

        localStorage.removeItem(CURRENT_KEY);
        sessionStorage.removeItem(CURRENT_KEY);

        window.location.href = "login.html";
    }

    // ===== FIELD ERROR MESSAGE =====

    function message(field, text) {

        if (!field) return;

        const group =
            field.closest(".form-group") ||
            field.parentElement;

        let error = group.querySelector(".jobhub-error");

        if (!error) {
            error = document.createElement("div");
            error.className = "jobhub-error";
            error.setAttribute("role", "alert");
            group.appendChild(error);
        }

        error.textContent = text;

        field.setAttribute(
            "aria-invalid",
            text ? "true" : "false"
        );

        if (text) field.focus();
    }

    function clearError(field) {

        if (!field) return;

        const group =
            field.closest(".form-group") ||
            field.parentElement;

        const error = group.querySelector(".jobhub-error");

        if (error) error.textContent = "";

        field.removeAttribute("aria-invalid");
    }

    // ===== TOAST NOTIFICATIONS =====

    function toast(text, isError = false) {

        let element = document.querySelector(".jobhub-toast");

        if (!element) {
            element = document.createElement("div");
            element.className = "jobhub-toast";
            element.setAttribute("role", "status");
            document.body.appendChild(element);
        }

        element.textContent = text;

        element.style.background = isError
            ? "#a42d20"
            : "#1b4332";

        element.classList.add("visible");

        clearTimeout(toast.timer);

        toast.timer = setTimeout(() => {
            element.classList.remove("visible");
        }, 3500);
    }

    // ===== PASSWORD SHOW / HIDE =====

    function passwordEye(input) {

        if (!input) return;

        // Prevent duplicate custom eye buttons
        if (input.closest(".jobhub-password-wrap")) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "jobhub-password-wrap";

        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "jobhub-eye";
        button.textContent = "👁";

        button.setAttribute("aria-label", "Show password");
        button.setAttribute("aria-pressed", "false");

        button.addEventListener("click", () => {

            const showing = input.type === "password";

            input.type = showing ? "text" : "password";

            button.textContent = showing ? "🙈" : "👁";

            button.setAttribute(
                "aria-label",
                showing ? "Hide password" : "Show password"
            );

            button.setAttribute(
                "aria-pressed",
                String(showing)
            );
        });

        wrapper.appendChild(button);
    }

    // ===== CAPTCHA =====

    function captcha(form) {

        const visual = form.querySelector(".captcha-visual");
        const field = form.querySelector(".captcha-box input");

        if (!visual || !field) return null;

        field.removeAttribute("pattern");
        field.removeAttribute("title");

        field.autocomplete = "off";
        field.maxLength = 5;

        let button = form.querySelector(".jobhub-refresh");

        if (!button) {
            button = document.createElement("button");
            button.type = "button";
            button.className = "jobhub-refresh";
            button.textContent = "↻";

            button.setAttribute(
                "aria-label",
                "Refresh CAPTCHA"
            );

            button.title = "Refresh CAPTCHA";

            visual.insertAdjacentElement("afterend", button);
        }

        let code = "";

        function refresh() {

            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

            code = "";

            for (let i = 0; i < 5; i++) {
                code += chars[
                    Math.floor(Math.random() * chars.length)
                ];
            }

            visual.replaceChildren();

            for (const character of code) {
                const span = document.createElement("span");
                span.textContent = character;
                visual.appendChild(span);
            }

            field.value = "";
            clearError(field);
        }

        button.addEventListener("click", refresh);

        refresh();

        return {
            field,
            refresh,
            valid: () =>
                field.value.trim().toUpperCase() === code
        };
    }

    // ===== CLEAR VALIDATION ERRORS =====

    function initErrors(form) {

        form.querySelectorAll("input, select").forEach(field => {

            field.addEventListener("input", () => {
                clearError(field);
            });

            field.addEventListener("change", () => {
                clearError(field);
            });
        });
    }

    // ===== PASSWORD HASHING =====

    async function hashPassword(password, salt) {

        if (!window.crypto?.subtle) {
            throw new Error(
                "Secure context required. Use HTTPS or localhost."
            );
        }

        const data = new TextEncoder().encode(
            `${salt}:${password}`
        );

        const digest = await crypto.subtle.digest(
            "SHA-256",
            data
        );

        return Array.from(
            new Uint8Array(digest),
            byte => byte.toString(16).padStart(2, "0")
        ).join("");
    }

    // ===== RANDOM USER ID =====

    function randomId() {

        if (window.crypto?.randomUUID) {
            return crypto.randomUUID();
        }

        const bytes = new Uint8Array(16);

        crypto.getRandomValues(bytes);

        return Array.from(
            bytes,
            byte => byte.toString(16).padStart(2, "0")
        ).join("");
    }

    // ===== GLOBAL THEME =====

    function initTheme() {

        const themeToggle =
            document.getElementById("themeToggle");

        if (!themeToggle) return;

        // Restore saved theme
        themeToggle.checked =
            localStorage.getItem(THEME_KEY) === "dark";

        // Save changes
        themeToggle.addEventListener("change", () => {

            localStorage.setItem(
                THEME_KEY,
                themeToggle.checked ? "dark" : "light"
            );
        });
    }

    return {
        USERS_KEY,
        CURRENT_KEY,
        PREFILL_KEY,
        THEME_KEY,
        users,
        currentUser,
        setCurrentUser,
        logout,
        message,
        clearError,
        toast,
        passwordEye,
        captcha,
        initErrors,
        hashPassword,
        randomId,
        initTheme
    };

})();

// Initialize theme on every page using auth.js
document.addEventListener("DOMContentLoaded", () => {
    JobHubAuth.initTheme();
});
