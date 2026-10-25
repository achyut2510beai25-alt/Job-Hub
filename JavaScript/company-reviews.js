
/* JobHub Company Reviews */

document.addEventListener("DOMContentLoaded", () => {

    const auth = typeof JobHubAuth !== "undefined"
        ? JobHubAuth
        : null;

    const grid = document.querySelector(".review-grid");
    const searchBar = document.querySelector(".home-search");
    const searchInput = searchBar?.querySelector("input");
    const searchButton = searchBar?.querySelector("button");
    const writeButton = document.querySelector(".about-text-card button");
    const profileMenu = document.querySelector(".profile-menu");
    const profileToggle = document.getElementById("profileToggle");

    if (!grid || !searchInput || !searchButton || !writeButton) {
        console.error("Company Reviews elements not found.");
        return;
    }

    const REVIEWS_KEY = "jobhub_company_reviews";

    // Original HTML review cards stay unchanged.
    const originalCards = [...grid.querySelectorAll(".review-card")];

    let currentSearch = "";
    let sortOrder = "default";

    // ===== STORAGE =====

    function getReviews() {
        try {
            const data = JSON.parse(
                localStorage.getItem(REVIEWS_KEY) || "[]"
            );
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    function saveReviews(reviews) {
        localStorage.setItem(
            REVIEWS_KEY,
            JSON.stringify(reviews)
        );
    }

    // ===== SMALL HELPERS =====

    function showMessage(text, error = false) {
        if (auth) {
            auth.toast(text, error);
        } else {
            alert(text);
        }
    }

    function getRating(card) {
        const badge = card.querySelector("span[style*='font-weight']");
        const rating = badge?.textContent.match(/\d+(\.\d+)?/);
        return rating ? Number(rating[0]) : 0;
    }

    function getCompany(card) {
        return card.querySelector("h3")?.textContent.trim() || "";
    }

    // ===== CREATE USER REVIEW CARD =====

    function createReviewCard(review) {

        const card = document.createElement("div");
        card.className = "review-card";
        card.dataset.userReview = "true";

        const header = document.createElement("div");
        header.style.cssText =
            "display:flex;justify-content:space-between;" +
            "align-items:start;gap:12px;margin-bottom:12px;";

        const details = document.createElement("div");

        const company = document.createElement("h3");
        company.style.marginBottom = "2px";
        company.textContent = review.company;

        const industry = document.createElement("p");
        industry.style.cssText =
            "color:var(--text-muted);font-size:0.85rem;";
        industry.textContent = review.industry;

        details.append(company, industry);

        const rating = document.createElement("span");
        rating.style.cssText =
            "font-weight:700;color:#D97706;" +
            "background:rgba(217,119,6,0.1);" +
            "padding:4px 10px;border-radius:20px;" +
            "font-size:0.85rem;white-space:nowrap;";

        rating.textContent = "★ " + review.rating.toFixed(1);

        header.append(details, rating);

        const comment = document.createElement("p");
        comment.style.marginBottom = "16px";
        comment.textContent = `"${review.comment}"`;

        const footer = document.createElement("div");
        footer.style.cssText =
            "font-size:0.8rem;color:var(--text-muted);" +
            "border-top:1px solid var(--border);" +
            "padding-top:10px;";

        const date = new Date(review.createdAt);

        footer.textContent =
            `${review.role} • ${date.toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric"
            })} • Community review`;

        card.append(header, comment, footer);

        return card;
    }

    // ===== RENDER REVIEWS =====

    function renderReviews() {

        const savedCards = getReviews().map(createReviewCard);

        let cards = [...originalCards, ...savedCards];

        // Search by company or industry, only after submit.
        if (currentSearch) {
            cards = cards.filter(card => {
                const heading = getCompany(card).toLowerCase();

                const industry =
                    card.querySelector("h3 + p")
                        ?.textContent.toLowerCase() || "";

                return heading.includes(currentSearch) ||
                       industry.includes(currentSearch);
            });
        }

        if (sortOrder === "highest") {
            cards.sort((a, b) => getRating(b) - getRating(a));
        } else if (sortOrder === "lowest") {
            cards.sort((a, b) => getRating(a) - getRating(b));
        }

        grid.replaceChildren(...cards);

        const oldEmpty = document.getElementById("reviewEmpty");
        if (oldEmpty) oldEmpty.remove();

        if (cards.length === 0) {
            const empty = document.createElement("p");
            empty.id = "reviewEmpty";
            empty.textContent =
                "No reviews found. Try another company or industry.";
            empty.style.cssText =
                "text-align:center;color:var(--text-muted);" +
                "padding:24px;";

            grid.after(empty);
        }

        countText.textContent =
            `${cards.length} review${cards.length === 1 ? "" : "s"} found`;
    }

    // ===== SEARCH FORM =====

    // Convert existing div into a form without changing layout.
    // We use a submit event so Enter and button both work.
    const form = document.createElement("form");
    form.className = searchBar.className;

    while (searchBar.firstChild) {
        form.appendChild(searchBar.firstChild);
    }

    searchBar.replaceWith(form);

    searchButton.type = "submit";

    form.addEventListener("submit", event => {
        event.preventDefault();

        currentSearch = searchInput.value.trim().toLowerCase();

        renderReviews();
    });

    // ===== SORT + RESET CONTROLS =====

    const controls = document.createElement("div");

    controls.style.cssText =
        "display:flex;align-items:center;justify-content:" +
        "space-between;gap:12px;flex-wrap:wrap;" +
        "margin:20px 0 0;";

    const countText = document.createElement("p");
    countText.style.cssText =
        "font-weight:600;color:var(--text-muted);";

    const actions = document.createElement("div");
    actions.style.cssText =
        "display:flex;gap:10px;align-items:center;flex-wrap:wrap;";

    const sortSelect = document.createElement("select");
    sortSelect.setAttribute("aria-label", "Sort reviews");

    sortSelect.style.cssText =
        "padding:12px;border:1px solid var(--border);" +
        "border-radius:8px;background:var(--card-bg);" +
        "color:var(--text);font:inherit;";

    [
        ["default", "Default Order"],
        ["highest", "Highest Rated"],
        ["lowest", "Lowest Rated"]
    ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        sortSelect.appendChild(option);
    });

    sortSelect.addEventListener("change", () => {
        sortOrder = sortSelect.value;
        renderReviews();
    });

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "btn btn-outline btn-sm";
    resetButton.textContent = "Reset";

    resetButton.addEventListener("click", () => {
        searchInput.value = "";
        currentSearch = "";
        sortOrder = "default";
        sortSelect.value = "default";
        renderReviews();
    });

    actions.append(sortSelect, resetButton);
    controls.append(countText, actions);

    grid.before(controls);

    // ===== WRITE REVIEW MODAL =====

    let modal = null;

    function closeModal() {
        if (!modal) return;

        modal.remove();
        modal = null;
        document.removeEventListener("keydown", handleEscape);
    }

    function handleEscape(event) {
        if (event.key === "Escape") closeModal();
    }

    function openReviewModal() {

        if (modal) return;

        const user = auth?.currentUser();

        if (!user) {
            showMessage("Please log in to write a review.", true);
            window.location.href = "login.html";
            return;
        }

        modal = document.createElement("div");
        modal.className = "jobhub-review-overlay";

        modal.innerHTML = `
            <section class="jobhub-review-dialog"
                     role="dialog"
                     aria-modal="true"
                     aria-labelledby="reviewTitle">

                <div class="jobhub-review-header">
                    <h2 id="reviewTitle">Write a Company Review</h2>
                    <button type="button"
                            class="jobhub-review-close"
                            aria-label="Close">×</button>
                </div>

                <p class="jobhub-review-note">
                    Share your experience. Your name and email
                    will not be shown publicly.
                </p>

                <form id="reviewForm">

                    <label>
                        Company Name
                        <input id="reviewCompany"
                               type="text"
                               maxlength="100"
                               required>
                    </label>

                    <label>
                        Industry
                        <input id="reviewIndustry"
                               type="text"
                               maxlength="100"
                               placeholder="e.g. Software & Technology"
                               required>
                    </label>

                    <label>
                        Your Job Role
                        <input id="reviewRole"
                               type="text"
                               maxlength="100"
                               placeholder="e.g. Software Developer"
                               required>
                    </label>

                    <label>
                        Rating
                        <select id="reviewRating" required>
                            <option value="">Select rating</option>
                            <option value="5">★★★★★ - 5 Stars</option>
                            <option value="4">★★★★☆ - 4 Stars</option>
                            <option value="3">★★★☆☆ - 3 Stars</option>
                            <option value="2">★★☆☆☆ - 2 Stars</option>
                            <option value="1">★☆☆☆☆ - 1 Star</option>
                        </select>
                    </label>

                    <label>
                        Your Review
                        <textarea id="reviewComment"
                                  rows="5"
                                  minlength="20"
                                  maxlength="1000"
                                  placeholder="Describe your experience..."
                                  required></textarea>
                    </label>

                    <button type="submit"
                            class="btn btn-primary btn-block">
                        Submit Review
                    </button>

                </form>
            </section>
        `;

        document.body.appendChild(modal);

        modal.querySelector(".jobhub-review-close")
            .addEventListener("click", closeModal);

        modal.addEventListener("click", event => {
            if (event.target === modal) closeModal();
        });

        document.addEventListener("keydown", handleEscape);

        modal.querySelector("#reviewCompany").focus();

        modal.querySelector("#reviewForm")
            .addEventListener("submit", event => {

                event.preventDefault();

                const get = id =>
                    modal.querySelector("#" + id).value.trim();

                const company = get("reviewCompany");
                const industry = get("reviewIndustry");
                const role = get("reviewRole");
                const rating = Number(get("reviewRating"));
                const comment = get("reviewComment");

                if (
                    !company ||
                    !industry ||
                    !role ||
                    !Number.isInteger(rating) ||
                    rating < 1 ||
                    rating > 5 ||
                    comment.length < 20
                ) {
                    showMessage(
                        "Fill all fields and write at least 20 characters.",
                        true
                    );
                    return;
                }

                const currentUser = auth.currentUser();

                if (!currentUser) {
                    showMessage("Session expired. Log in again.", true);
                    return;
                }

                const review = {
                    id: auth?.randomId
                        ? auth.randomId()
                        : String(Date.now()),
                    userId: currentUser.id,
                    company,
                    industry,
                    role,
                    rating,
                    comment,
                    createdAt: new Date().toISOString()
                };

                try {
                    const reviews = getReviews();
                    reviews.push(review);
                    saveReviews(reviews);

                    currentSearch = "";
                    searchInput.value = "";
                    sortOrder = "default";
                    sortSelect.value = "default";

                    closeModal();
                    renderReviews();

                    showMessage("Review submitted successfully!");

                } catch (error) {
                    console.error(error);
                    showMessage("Unable to save review.", true);
                }
            });
    }

    writeButton.addEventListener("click", openReviewModal);

    // ===== PROFILE MENU =====

    if (profileMenu) {

        profileMenu.replaceChildren();

        function menuItem(tag, text, className) {
            const element = document.createElement(tag);
            element.textContent = text;
            element.className = className;
            profileMenu.appendChild(element);
            return element;
        }

        const user = auth?.currentUser();

        if (user) {
            menuItem("p", "My Profile", "profile-menu-title");

            menuItem(
                "strong",
                user.name || "Candidate",
                "jobhub-profile-greeting"
            );

            menuItem(
                "p",
                user.email || "",
                "jobhub-profile-email"
            );

            const edit = menuItem(
                "a",
                "View / Edit Profile",
                "btn btn-outline btn-block btn-sm"
            );
            edit.href = "home.html";

            const logout = menuItem(
                "button",
                "Log Out",
                "btn btn-primary btn-block btn-sm"
            );
            logout.type = "button";
            logout.addEventListener("click", () => auth.logout());

        } else {

            menuItem("p", "Welcome to JobHub", "profile-menu-title");

            const login = menuItem(
                "a",
                "Log In",
                "btn btn-primary btn-block btn-sm"
            );
            login.href = "login.html";

            const signup = menuItem(
                "a",
                "Sign Up",
                "btn btn-outline btn-block btn-sm"
            );
            signup.href = "signup.html";
        }
    }

    document.addEventListener("click", event => {
        if (
            profileToggle &&
            !event.target.closest(".profile-wrap")
        ) {
            profileToggle.checked = false;
        }
    });

    // ===== INITIAL RENDER =====

    renderReviews();

});
