
/* JobHub Home - Profile, Role Cards and Logout */

document.addEventListener("DOMContentLoaded", function () {
    const auth = JobHubAuth;

    if (!auth) {
        console.error("JobHubAuth not loaded. Check auth.js path.");
        return;
    }

    const menu = document.querySelector(".profile-menu");
    const profileToggle = document.getElementById("profileToggle");
    const jobCard = document.getElementById("jobCard");
    const profileCard = document.getElementById("profileCard");
    const search = document.querySelector(".home-search");

    if (search) search.action = "find-jobs.html";

    // Theme is restored and saved by auth.js
    const user = auth.currentUser();

    if (!menu) {
        console.error("Profile menu missing in home.html");
        return;
    }

    let modal = null;

    function add(tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        menu.appendChild(element);
        return element;
    }

    function updateCard(card, label, heading, description, buttonText, href) {
        if (!card) return;

        card.querySelector(".role-label").textContent = label;
        card.querySelector("h3").textContent = heading;
        card.querySelector(".role-desc").textContent = description;

        const button = card.querySelector(".btn");
        button.textContent = buttonText;
        button.href = href;

        return button;
    }

    function renderHome() {
        menu.replaceChildren();

        // ===== BEFORE LOGIN =====
        if (!user) {
            add("p", "profile-menu-title", "Welcome to JobHub");

            const login = add(
                "a",
                "btn btn-primary btn-block btn-sm",
                "Log In"
            );
            login.href = "login.html";

            const signup = add(
                "a",
                "btn btn-outline btn-block btn-sm",
                "Sign Up"
            );
            signup.href = "signup.html";

            updateCard(
                jobCard,
                "New Job Seeker?",
                "Create your candidate profile",
                "Upload your resume, set job alerts, and apply to job opportunities.",
                "Sign Up Free",
                "signup.html"
            );

            updateCard(
                profileCard,
                "Returning Candidate",
                "Access your portal",
                "Log in to view your profile and explore opportunities.",
                "Log In",
                "login.html"
            );

            return;
        }

        // ===== AFTER LOGIN =====
        const firstName =
            (user.name || "Candidate").trim().split(/\s+/)[0];

        add("p", "profile-menu-title", "My Profile");

        const greeting = add(
            "strong",
            "jobhub-profile-greeting",
            user.name || "Candidate"
        );

        const emailText = add(
            "p",
            "jobhub-profile-email",
            user.email || ""
        );

        const edit = add(
            "button",
            "btn btn-outline btn-block btn-sm",
            "View / Edit Profile"
        );
        edit.type = "button";
        edit.addEventListener("click", openProfile);

        // Logout appears BELOW the profile button
        const logout = add(
            "button",
            "btn btn-primary btn-block btn-sm",
            "Log Out"
        );
        logout.type = "button";
        logout.addEventListener("click", auth.logout);

        updateCard(
            jobCard,
            `Welcome back, ${firstName}!`,
            "Explore Job Opportunities",
            "Discover jobs that match your skills and career goals.",
            "Browse Jobs",
            "find-jobs.html"
        );

        const profileButton = updateCard(
            profileCard,
            "Your JobHub Account",
            "Manage Your Profile",
            "View and update your personal details, contact information and career status.",
            "Edit Profile",
            "#"
        );

        if (profileButton) {
            profileButton.addEventListener("click", function (event) {
                event.preventDefault();
                openProfile();
            });
        }

        function updateProfileDisplay(name, email) {
            user.name = name;
            user.email = email;

            greeting.textContent = name;
            emailText.textContent = email;

            const first = name.trim().split(/\s+/)[0];
            if (jobCard) {
                jobCard.querySelector(".role-label").textContent =
                    `Welcome back, ${first}!`;
            }
        }

        // ===== PROFILE MODAL =====
        function openProfile() {
            if (modal) return;

            const record = auth.users().find(
                item => item.id === user.id
            );

            if (!record) {
                auth.toast("Account not found. Please log in again.", true);
                return;
            }

            if (profileToggle) profileToggle.checked = false;

            modal = document.createElement("div");
            modal.className = "jobhub-profile-overlay";

            modal.innerHTML = `
                <section class="jobhub-profile-dialog"
                         role="dialog"
                         aria-modal="true"
                         aria-labelledby="jobhub-profile-title">

                    <div class="jobhub-profile-header">
                        <h2 id="jobhub-profile-title">My Profile</h2>
                        <button type="button"
                                class="jobhub-profile-close"
                                aria-label="Close profile">×</button>
                    </div>

                    <p class="jobhub-profile-subtitle">
                        Your candidate details
                    </p>

                    <form id="jobhub-profile-form" novalidate>
                        <div class="jobhub-profile-fields">

                            <label>First Name
                                <input id="jobhub-edit-first"
                                       required maxlength="80">
                            </label>

                            <label>Last Name
                                <input id="jobhub-edit-last"
                                       required maxlength="80">
                            </label>

                            <label>Email Address
                                <input id="jobhub-edit-email"
                                       type="email"
                                       required maxlength="254">
                            </label>

                            <label>Phone Number (optional)
                                <input id="jobhub-edit-phone"
                                       type="tel"
                                       maxlength="10"
                                       inputmode="numeric">
                            </label>

                            <label>Current Status
                                <select id="jobhub-edit-status">
                                    <option value="actively-looking">
                                        Actively Looking for Jobs
                                    </option>
                                    <option value="open">
                                        Open to Opportunities
                                    </option>
                                    <option value="student">
                                        Student / Recent Graduate
                                    </option>
                                </select>
                            </label>

                            <p class="jobhub-profile-resume"></p>
                            <p class="jobhub-profile-error"
                               role="alert"></p>
                        </div>

                        <button type="submit"
                                class="btn btn-primary btn-block">
                            Save Changes
                        </button>

                        <button type="button"
                                id="jobhub-profile-logout"
                                class="btn btn-outline btn-block">
                            Log Out
                        </button>
                    </form>
                </section>
            `;

            document.body.appendChild(modal);

            const get = id => modal.querySelector("#" + id);

            get("jobhub-edit-first").value =
                record.firstName || record.name?.split(" ")[0] || "";

            get("jobhub-edit-last").value =
                record.lastName ||
                record.name?.split(" ").slice(1).join(" ") || "";

            get("jobhub-edit-email").value = record.email || "";
            get("jobhub-edit-phone").value = record.phone || "";
            get("jobhub-edit-status").value = record.status || "student";

            modal.querySelector(".jobhub-profile-resume").textContent =
                "Resume: " + (record.resumeName || "Not recorded") +
                " (file itself is not stored)";

            get("jobhub-edit-phone").addEventListener("input", event => {
                event.target.value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
            });

            function closeProfile() {
                modal.remove();
                modal = null;
                document.removeEventListener("keydown", handleEscape);
            }

            function handleEscape(event) {
                if (event.key === "Escape") closeProfile();
            }

            document.addEventListener("keydown", handleEscape);

            modal.querySelector(".jobhub-profile-close")
                .addEventListener("click", closeProfile);

            modal.addEventListener("click", event => {
                if (event.target === modal) closeProfile();
            });

            get("jobhub-profile-logout")
                .addEventListener("click", auth.logout);

            get("jobhub-edit-first").focus();

            // ===== SAVE PROFILE =====
            get("jobhub-profile-form").addEventListener("submit", event => {
                event.preventDefault();

                const first = get("jobhub-edit-first").value.trim();
                const last = get("jobhub-edit-last").value.trim();
                const email = get("jobhub-edit-email")
                    .value.trim().toLowerCase();
                const phone = get("jobhub-edit-phone").value.trim();
                const status = get("jobhub-edit-status").value;

                const error = modal.querySelector(".jobhub-profile-error");
                error.textContent = "";

                if (!first || !last) {
                    error.textContent = "Enter your first and last name.";
                    return;
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    error.textContent = "Enter a valid email address.";
                    return;
                }

                if (phone && !/^[6-9]\d{9}$/.test(phone)) {
                    error.textContent = "Enter a valid 10-digit phone number.";
                    return;
                }

                const all = auth.users();

                if (all.some(item =>
                    item.id !== record.id &&
                    item.email?.toLowerCase() === email
                )) {
                    error.textContent = "Email already registered.";
                    return;
                }

                const index = all.findIndex(
                    item => item.id === record.id
                );

                if (index === -1) {
                    error.textContent = "Account not found.";
                    return;
                }

                const name = `${first} ${last}`;

                all[index] = {
                    ...all[index],
                    firstName: first,
                    lastName: last,
                    name,
                    email,
                    phone,
                    status,
                    updatedAt: new Date().toISOString()
                };

                try {
                    localStorage.setItem(
                        auth.USERS_KEY,
                        JSON.stringify(all)
                    );

                    const storage = sessionStorage.getItem(auth.CURRENT_KEY)
                        ? sessionStorage
                        : localStorage;

                    storage.setItem(
                        auth.CURRENT_KEY,
                        JSON.stringify({
                            id: record.id,
                            name,
                            email
                        })
                    );

                    updateProfileDisplay(name, email);

                    auth.toast("Profile updated successfully!");
                    closeProfile();

                } catch (saveError) {
                    console.error(saveError);
                    error.textContent = "Unable to save profile.";
                }
            });
        }
    }

    renderHome();
});
