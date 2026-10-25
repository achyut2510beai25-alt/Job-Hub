
/* JobHub Salary Guide - Indian Rupees Demo */

document.addEventListener("DOMContentLoaded", () => {

    const auth = typeof JobHubAuth !== "undefined"
        ? JobHubAuth
        : null;

    const searchBox = document.querySelector(".home-search");
    const searchInput = searchBox?.querySelector("input");
    const searchButton = searchBox?.querySelector("button");
    const stats = document.querySelectorAll(".stat");
    const tableBody = document.querySelector(".salary-table tbody");
    const tableCard = document.querySelector(".salary-table-card");
    const profileMenu = document.querySelector(".profile-menu");
    const profileToggle = document.getElementById("profileToggle");

    if (!searchBox || !searchInput || !searchButton ||
        !tableBody || !tableCard) {
        console.error("Salary Guide elements missing.");
        return;
    }

    // All annual amounts are in LPA (Lakhs Per Annum).
    // Illustrative Indian salary data, not live market data.
    const salaries = [
        {
            title: "Software Engineer",
            category: "Software",
            fresher: 5.5,
            mid: 12,
            senior: 25,
            demand: "High",
            growth: 12
        },
        {
            title: "Senior Frontend Developer",
            category: "Software",
            fresher: 5,
            mid: 13,
            senior: 24,
            demand: "High",
            growth: 14
        },
        {
            title: "Backend Systems Engineer",
            category: "Software",
            fresher: 6,
            mid: 15,
            senior: 28,
            demand: "Very High",
            growth: 18
        },
        {
            title: "Full Stack Developer",
            category: "Software",
            fresher: 5.5,
            mid: 13,
            senior: 25,
            demand: "High",
            growth: 15
        },
        {
            title: "Java Developer",
            category: "Software",
            fresher: 4.5,
            mid: 10,
            senior: 21,
            demand: "High",
            growth: 11
        },
        {
            title: "Python Developer",
            category: "Software",
            fresher: 4.8,
            mid: 11,
            senior: 23,
            demand: "High",
            growth: 13
        },
        {
            title: "Data Scientist",
            category: "Data & AI",
            fresher: 7,
            mid: 16,
            senior: 30,
            demand: "Very High",
            growth: 17
        },
        {
            title: "Machine Learning Engineer",
            category: "Data & AI",
            fresher: 7.5,
            mid: 18,
            senior: 34,
            demand: "Very High",
            growth: 19
        },
        {
            title: "Data Analyst",
            category: "Data & AI",
            fresher: 4,
            mid: 9,
            senior: 18,
            demand: "High",
            growth: 12
        },
        {
            title: "UI/UX Product Designer",
            category: "Design",
            fresher: 4.5,
            mid: 10,
            senior: 20,
            demand: "Moderate",
            growth: 8
        },
        {
            title: "Technical Product Manager",
            category: "Product",
            fresher: 8,
            mid: 19,
            senior: 35,
            demand: "High",
            growth: 11
        },
        {
            title: "DevOps Specialist",
            category: "Software",
            fresher: 5.5,
            mid: 14,
            senior: 27,
            demand: "High",
            growth: 12
        },
        {
            title: "Cloud Engineer",
            category: "Software",
            fresher: 5,
            mid: 13,
            senior: 26,
            demand: "Very High",
            growth: 16
        },
        {
            title: "Cybersecurity Analyst",
            category: "Software",
            fresher: 5,
            mid: 12,
            senior: 24,
            demand: "High",
            growth: 15
        }
    ];

    const locations = {
        india: { label: "India Average", factor: 1 },
        chandigarh: { label: "Chandigarh / Mohali", factor: 0.85 },
        delhi: { label: "Delhi NCR", factor: 1.1 },
        bengaluru: { label: "Bengaluru", factor: 1.2 },
        hyderabad: { label: "Hyderabad", factor: 1.1 },
        mumbai: { label: "Mumbai", factor: 1.15 },
        pune: { label: "Pune", factor: 1.05 },
        other: { label: "Other Cities", factor: 0.9 }
    };

    let activeQuery = "";
    let activeExperience = "mid";
    let activeLocation = "india";
    let activeSort = "default";

    const formatINR = amount =>
        "₹" + Math.round(amount).toLocaleString("en-IN");

    const formatLPA = amount =>
        "₹" + Number(amount.toFixed(1)).toLocaleString("en-IN") +
        " LPA";

    function estimatedSalary(role) {
        return role[activeExperience] *
            locations[activeLocation].factor;
    }

    function estimatedTopPay(role) {
        return estimatedSalary(role) * 1.4;
    }

    function monthlySalary(lpa) {
        return lpa * 100000 / 12;
    }

    // ===== CONVERT SEARCH DIV INTO FORM =====

    const form = document.createElement("form");
    form.className = searchBox.className;

    while (searchBox.firstChild) {
        form.appendChild(searchBox.firstChild);
    }

    searchBox.replaceWith(form);

    searchInput.placeholder = "Job title (e.g., Java Developer)";
    searchInput.setAttribute("aria-label", "Search job title");
    searchButton.type = "submit";

    // ===== EXPERIENCE AND LOCATION FILTERS =====

    const controls = document.createElement("div");

    controls.style.cssText =
        "display:flex;flex-wrap:wrap;gap:14px;" +
        "align-items:end;margin:0 0 24px;";

    function createSelect(labelText, options, initialValue) {
        const wrapper = document.createElement("label");

        wrapper.style.cssText =
            "display:grid;gap:6px;flex:1;min-width:175px;" +
            "font-size:0.9rem;font-weight:600;";

        const label = document.createElement("span");
        label.textContent = labelText;

        const select = document.createElement("select");

        select.style.cssText =
            "width:100%;padding:12px;border-radius:8px;" +
            "border:1px solid var(--border);" +
            "background:var(--card-bg);color:var(--text);" +
            "font:inherit;";

        options.forEach(([value, text]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = text;
            select.appendChild(option);
        });

        select.value = initialValue;
        wrapper.append(label, select);
        controls.appendChild(wrapper);

        return select;
    }

    const experienceSelect = createSelect(
        "Experience Level",
        [
            ["fresher", "Fresher (0–2 years)"],
            ["mid", "Mid-Level (3–6 years)"],
            ["senior", "Senior (7+ years)"]
        ],
        activeExperience
    );

    const locationSelect = createSelect(
        "Location",
        Object.entries(locations).map(
            ([key, value]) => [key, value.label]
        ),
        activeLocation
    );

    const sortSelect = createSelect(
        "Sort Salaries",
        [
            ["default", "Default Order"],
            ["highest", "Highest Salary First"],
            ["lowest", "Lowest Salary First"],
            ["title", "Job Title A–Z"]
        ],
        activeSort
    );

    tableCard.before(controls);

    experienceSelect.addEventListener("change", () => {
        activeExperience = experienceSelect.value;
        render();
    });

    locationSelect.addEventListener("change", () => {
        activeLocation = locationSelect.value;
        render();
    });

    sortSelect.addEventListener("change", () => {
        activeSort = sortSelect.value;
        render();
    });

    // ===== SALARY RESULT PANEL =====

    const result = document.createElement("section");

    result.className = "salary-result-panel";
    result.hidden = true;

    result.style.cssText =
        "padding:24px;border:1.5px solid var(--border);" +
        "background:var(--card-bg-soft);border-radius:16px;" +
        "margin-bottom:24px;";

    tableCard.before(result);

    function showSalaryResult(matches) {
        result.replaceChildren();

        if (!activeQuery) {
            result.hidden = true;
            return;
        }

        result.hidden = false;

        const heading = document.createElement("h3");
        heading.style.marginBottom = "12px";

        if (matches.length === 0) {
            heading.textContent =
                `No salary data found for "${activeQuery}"`;

            const note = document.createElement("p");
            note.textContent =
                "Try searching Java, Python, Data, Design, " +
                "Software Engineer or Product Manager.";

            result.append(heading, note);
            return;
        }

        const role = matches[0];
        const annual = estimatedSalary(role);
        const topPay = estimatedTopPay(role);

        heading.textContent = role.title;

        const info = document.createElement("p");
        info.style.color = "var(--text-muted)";
        info.textContent =
            `${locations[activeLocation].label} • ` +
            experienceSelect.selectedOptions[0].text;

        const salary = document.createElement("h2");
        salary.style.cssText =
            "color:var(--accent);margin:14px 0 8px;";

        salary.textContent = formatLPA(annual);

        const monthly = document.createElement("p");
        monthly.textContent =
            `Approx. monthly gross equivalent: ` +
            formatINR(monthlySalary(annual));

        const top = document.createElement("p");
        top.style.marginTop = "8px";
        top.textContent =
            `Illustrative upper benchmark: ${formatLPA(topPay)}`;

        const disclaimer = document.createElement("p");
        disclaimer.style.cssText =
            "font-size:0.82rem;color:var(--text-muted);" +
            "margin-top:12px;";

        disclaimer.textContent =
            "Demo estimate only. Actual CTC depends on company, " +
            "skills, location and experience. Monthly amount is " +
            "not take-home salary.";

        result.append(
            heading, info, salary, monthly, top, disclaimer
        );
    }

    // ===== UPDATE STATS =====

    function average(category) {
        const items = salaries.filter(
            role => role.category === category
        );

        if (!items.length) return 0;

        const sum = items.reduce(
            (total, role) => total + estimatedSalary(role),
            0
        );

        return sum / items.length;
    }

    function updateStats() {
        if (stats.length < 4) return;

        const values = [
            [formatLPA(average("Software")), "Avg Software Role"],
            [formatLPA(average("Design")), "Avg Design Role"],
            [formatLPA(average("Product")), "Avg Product Role"],
            [String(salaries.length), "Roles in Demo Dataset"]
        ];

        stats.forEach((card, index) => {
            if (!values[index]) return;

            card.querySelector(".stat-num").textContent =
                values[index][0];

            card.querySelector(".stat-label").textContent =
                values[index][1];
        });
    }

    // ===== DYNAMIC SALARY TABLE =====

    function getMatchingRoles() {
        const query = activeQuery.toLowerCase();

        const matching = salaries.filter(role =>
            role.title.toLowerCase().includes(query) ||
            role.category.toLowerCase().includes(query)
        );

        if (activeSort === "highest") {
            matching.sort(
                (a, b) => estimatedSalary(b) - estimatedSalary(a)
            );
        } else if (activeSort === "lowest") {
            matching.sort(
                (a, b) => estimatedSalary(a) - estimatedSalary(b)
            );
        } else if (activeSort === "title") {
            matching.sort(
                (a, b) => a.title.localeCompare(b.title)
            );
        }

        return matching;
    }

    function renderTable(roles) {
        tableBody.replaceChildren();

        if (roles.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 4;
            cell.textContent =
                "No matching roles. Try another job title.";

            cell.style.textAlign = "center";
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        roles.forEach(role => {
            const row = document.createElement("tr");

            const titleCell = document.createElement("td");
            const strong = document.createElement("strong");
            strong.textContent = role.title;
            titleCell.appendChild(strong);

            const averageCell = document.createElement("td");
            averageCell.textContent =
                formatLPA(estimatedSalary(role));

            const topCell = document.createElement("td");
            topCell.textContent =
                formatLPA(estimatedTopPay(role));

            const demandCell = document.createElement("td");
            const badge = document.createElement("span");

            badge.style.cssText =
                "color:#3E7D5D;font-weight:600;";

            badge.textContent =
                `${role.demand} (+${role.growth}% demo indicator)`;

            demandCell.appendChild(badge);

            row.append(
                titleCell,
                averageCell,
                topCell,
                demandCell
            );

            tableBody.appendChild(row);
        });
    }

    function render() {
        const matches = getMatchingRoles();

        updateStats();
        renderTable(matches);
        showSalaryResult(matches);
    }

    // ===== SEARCH ONLY ON BUTTON OR ENTER =====

    form.addEventListener("submit", event => {
        event.preventDefault();

        activeQuery = searchInput.value.trim();

        render();

        if (activeQuery) {
            result.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    });

    // ===== RESET BUTTON =====

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "btn btn-outline btn-sm";
    resetButton.textContent = "Reset";

    controls.appendChild(resetButton);

    resetButton.addEventListener("click", () => {
        searchInput.value = "";
        activeQuery = "";
        activeExperience = "mid";
        activeLocation = "india";
        activeSort = "default";

        experienceSelect.value = activeExperience;
        locationSelect.value = activeLocation;
        sortSelect.value = activeSort;

        render();
    });

    // ===== PROFILE MENU =====

    if (profileMenu) {
        profileMenu.replaceChildren();

        function menuItem(tag, text, className) {
            const element = document.createElement(tag);
            element.className = className;
            element.textContent = text;
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

            const profile = menuItem(
                "a",
                "View / Edit Profile",
                "btn btn-outline btn-block btn-sm"
            );
            profile.href = "home.html";

            const logout = menuItem(
                "button",
                "Log Out",
                "btn btn-primary btn-block btn-sm"
            );

            logout.type = "button";
            logout.addEventListener("click", () => auth.logout());

        } else {
            menuItem(
                "p",
                "Welcome to JobHub",
                "profile-menu-title"
            );

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

    // ===== INITIAL PAGE =====

    render();

});
