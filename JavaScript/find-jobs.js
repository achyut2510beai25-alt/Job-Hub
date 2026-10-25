
/* JobHub Find Jobs - Frontend Demo with Promises */

document.addEventListener("DOMContentLoaded", () => {

    const auth = typeof JobHubAuth !== "undefined"
        ? JobHubAuth : null;

    const form = document.getElementById("jobsSearch");
    const queryInput = document.getElementById("jobQuery");
    const locationInput = document.getElementById("jobLocation");
    const sidebar = document.querySelector(".filter-sidebar");
    const feed = document.querySelector(".job-feed");
    const profileMenu = document.querySelector(".profile-menu");
    const profileToggle = document.getElementById("profileToggle");

    if (!form || !queryInput || !locationInput || !sidebar || !feed) {
        console.error("Find Jobs HTML elements are missing.");
        return;
    }

    // ===== DEMO JOB DATA =====

    const jobs = [
        {
            id: 1,
            title: "Senior Frontend Developer",
            company: "TechFlow Inc.",
            location: "Remote (US/Canada)",
            salaryMin: 120000,
            salaryMax: 145000,
            type: "Remote",
            level: "Senior Level",
            badge: "Featured",
            skills: "React JavaScript HTML CSS frontend"
        },
        {
            id: 2,
            title: "UI/UX Product Designer",
            company: "Creative Scale",
            location: "New York, NY",
            salaryMin: 95000,
            salaryMax: 115000,
            type: "Full-time",
            level: "Mid Level",
            badge: "Full-time",
            skills: "Figma UI UX product design"
        },
        {
            id: 3,
            title: "Backend Systems Engineer",
            company: "DataPulse Labs",
            location: "Remote",
            salaryMin: 130000,
            salaryMax: 160000,
            type: "Remote",
            level: "Senior Level",
            badge: "Remote",
            skills: "Java Python SQL backend APIs"
        },
        {
            id: 4,
            title: "Technical Product Manager",
            company: "CloudNet Systems",
            location: "Austin, TX",
            salaryMin: 110000,
            salaryMax: 135000,
            type: "Full-time",
            level: "Mid Level",
            badge: "Full-time",
            skills: "product management agile cloud"
        },
        {
            id: 5,
            title: "Junior Java Developer",
            company: "CodeCraft",
            location: "Bangalore, India",
            salaryMin: 60000,
            salaryMax: 75000,
            type: "Full-time",
            level: "Entry Level",
            badge: "Entry Level",
            skills: "Java DSA Spring Boot"
        },
        {
            id: 6,
            title: "React Developer",
            company: "WebNova",
            location: "Remote",
            salaryMin: 85000,
            salaryMax: 110000,
            type: "Remote",
            level: "Mid Level",
            badge: "Remote",
            skills: "React JavaScript CSS frontend"
        },
        {
            id: 7,
            title: "Data Analyst Intern",
            company: "Insight Labs",
            location: "Delhi, India",
            salaryMin: 60000,
            salaryMax: 70000,
            type: "Part-time",
            level: "Entry Level",
            badge: "Part-time",
            skills: "Python SQL Excel statistics"
        },
        {
            id: 8,
            title: "Python Software Engineer",
            company: "ByteWorks",
            location: "Remote",
            salaryMin: 90000,
            salaryMax: 120000,
            type: "Contract",
            level: "Mid Level",
            badge: "Contract",
            skills: "Python Django Flask APIs"
        },
        {
            id: 9,
            title: "Engineering Director",
            company: "NextGen Cloud",
            location: "San Francisco, CA",
            salaryMin: 160000,
            salaryMax: 190000,
            type: "Full-time",
            level: "Director / Executive",
            badge: "Full-time",
            skills: "leadership cloud architecture engineering"
        },
        {
            id: 10,
            title: "Frontend Developer Intern",
            company: "Pixel Studio",
            location: "Chandigarh, India",
            salaryMin: 60000,
            salaryMax: 65000,
            type: "Part-time",
            level: "Entry Level",
            badge: "Entry Level",
            skills: "HTML CSS JavaScript frontend"
        }
    ];

    const PAGE_SIZE = 4;
    const APPLICATIONS_KEY = "jobhub_applications";

    let currentPage = 1;
    let filteredJobs = [];
    let searchRequestId = 0;

    // ===== SEARCH FROM HOME PAGE =====

    const params = new URLSearchParams(window.location.search);

    queryInput.value = params.get("q") || "";
    locationInput.value = params.get("l") || "";

    // ===== FILTER CHECKBOXES =====

    const groups = [...sidebar.querySelectorAll(".filter-group")];

    function getSelected(groupIndex) {
        const group = groups[groupIndex];
        if (!group) return [];

        return [...group.querySelectorAll("label")]
            .filter(label => label.querySelector("input")?.checked)
            .map(label => label.textContent.trim());
    }

    sidebar.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.checked = false;
    });

    // ===== SALARY FILTER =====

    function matchesSalary(job, ranges) {
        if (ranges.length === 0) return true;

        return ranges.some(range => {
            if (range.includes("$60k")) {
                return job.salaryMin <= 80000 &&
                       job.salaryMax >= 60000;
            }

            if (range.includes("$80k")) {
                return job.salaryMin <= 120000 &&
                       job.salaryMax >= 80000;
            }

            if (range.includes("$120k+")) {
                return job.salaryMax >= 120000;
            }

            return false;
        });
    }

    // ===== PROMISE FOR JOB LOADING =====

    function loadJobsAsync() {
        return new Promise((resolve, reject) => {

            setTimeout(() => {
                if (!Array.isArray(jobs)) {
                    reject(
                        new Error("Job data is unavailable.")
                    );
                } else {
                    resolve(jobs);
                }
            }, 800);

        });
    }

    // ===== FILTER JOBS USING ASYNC/AWAIT =====

    async function filterJobs(resetPage = true) {
        const requestId = ++searchRequestId;

        feed.replaceChildren();

        const loading = document.createElement("p");
        loading.textContent = "Loading jobs...";
        loading.style.color = "var(--text-muted)";
        loading.setAttribute("role", "status");

        feed.appendChild(loading);

        let availableJobs;

        try {
            availableJobs = await loadJobsAsync();

        } catch (error) {
            if (requestId !== searchRequestId) return;

            feed.textContent =
                "Unable to load jobs. Please try again.";

            console.error(error);
            return;
        }

        if (requestId !== searchRequestId) return;

        if (resetPage) currentPage = 1;

        const keyword = queryInput.value.trim().toLowerCase();
        const location = locationInput.value.trim().toLowerCase();

        const types = getSelected(0);
        const levels = getSelected(1);
        const salaries = getSelected(2);

        filteredJobs = availableJobs.filter(job => {

            const searchable = [
                job.title,
                job.company,
                job.skills,
                job.type,
                job.level
            ].join(" ").toLowerCase();

            const keywordMatch =
                !keyword || searchable.includes(keyword);

            const locationMatch =
                !location ||
                job.location.toLowerCase().includes(location);

            const typeMatch =
                types.length === 0 || types.includes(job.type);

            const levelMatch =
                levels.length === 0 || levels.includes(job.level);

            return keywordMatch &&
                   locationMatch &&
                   typeMatch &&
                   levelMatch &&
                   matchesSalary(job, salaries);
        });

        renderJobs();
    }

    // ===== APPLICATION STORAGE =====

    function getApplications() {
        try {
            const data = JSON.parse(
                localStorage.getItem(APPLICATIONS_KEY) || "[]"
            );

            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    function hasApplied(jobId) {
        const user = auth?.currentUser();

        if (!user) return false;

        return getApplications().some(
            app => app.userId === user.id &&
                   app.jobId === jobId
        );
    }

    function applyForJob(job) {
        if (!auth) {
            alert("Authentication is unavailable.");
            return;
        }

        const user = auth.currentUser();

        if (!user) {
            alert("Please log in before applying for a job.");
            window.location.href = "login.html";
            return;
        }

        if (hasApplied(job.id)) {
            alert("You have already applied for this job.");
            return;
        }

        const applications = getApplications();

        applications.push({
            userId: user.id,
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            appliedAt: new Date().toISOString()
        });

        try {
            localStorage.setItem(
                APPLICATIONS_KEY,
                JSON.stringify(applications)
            );

            auth.toast("Demo application saved successfully!");
            renderJobs();

        } catch (error) {
            console.error(error);
            auth.toast("Could not save application.", true);
        }
    }

    // ===== CREATE JOB CARD =====

    function createJobCard(job) {
        const card = document.createElement("div");
        card.className = "job-card";

        const details = document.createElement("div");

        const badge = document.createElement("span");
        badge.className = "job-badge";
        badge.textContent = job.badge;

        const title = document.createElement("h3");
        title.style.margin = "8px 0 4px";
        title.textContent = job.title;

        const company = document.createElement("p");
        company.style.color = "var(--text-muted)";
        company.style.fontSize = "0.9rem";
        company.textContent =
            `${job.company} • ${job.location}`;

        const salary = document.createElement("p");
        salary.style.marginTop = "12px";
        salary.style.fontWeight = "700";
        salary.style.color = "var(--accent)";

        const formatMoney = amount =>
            "$" + amount.toLocaleString("en-US");

        salary.textContent =
            `${formatMoney(job.salaryMin)} - ${formatMoney(job.salaryMax)} / yr`;

        details.append(badge, title, company, salary);

        const applyButton = document.createElement("button");
        applyButton.type = "button";
        applyButton.className = "btn btn-primary btn-sm";

        const applied = hasApplied(job.id);

        applyButton.textContent =
            applied ? "Applied ✓" : "Apply Now";

        applyButton.disabled = applied;

        if (applied) {
            applyButton.style.opacity = "0.65";
            applyButton.style.cursor = "default";
        }

        applyButton.addEventListener(
            "click", () => applyForJob(job)
        );

        card.append(details, applyButton);

        return card;
    }

    // ===== PAGINATION =====

    function renderPagination(totalPages) {
        const pagination = document.createElement("div");
        pagination.className = "pagination-wrapper";

        function addButton(
            text, page, disabled = false, active = false
        ) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = active ? "btn active" : "btn";
            button.textContent = text;
            button.disabled = disabled;

            if (disabled) button.style.opacity = "0.45";

            button.addEventListener("click", () => {
                if (disabled) return;

                currentPage = page;
                renderJobs();

                document.querySelector(".filter-wrapper")
                    ?.scrollIntoView({ behavior: "smooth" });
            });

            pagination.appendChild(button);
        }

        addButton(
            "Previous", currentPage - 1,
            currentPage === 1
        );

        for (let page = 1; page <= totalPages; page++) {
            addButton(
                String(page), page,
                false, page === currentPage
            );
        }

        addButton(
            "Next", currentPage + 1,
            currentPage === totalPages
        );

        feed.appendChild(pagination);
    }

    // ===== DISPLAY JOBS =====

    function renderJobs() {
        feed.replaceChildren();

        const count = document.createElement("p");
        count.style.color = "var(--text-muted)";
        count.style.fontWeight = "600";

        count.textContent =
            `${filteredJobs.length} job${filteredJobs.length === 1 ? "" : "s"} found`;

        feed.appendChild(count);

        if (filteredJobs.length === 0) {
            const empty = document.createElement("div");
            empty.className = "job-card";

            empty.textContent =
                "No matching jobs found. Try another keyword, location or filter.";

            feed.appendChild(empty);
            return;
        }

        const totalPages = Math.ceil(
            filteredJobs.length / PAGE_SIZE
        );

        currentPage = Math.min(currentPage, totalPages);

        const start = (currentPage - 1) * PAGE_SIZE;

        filteredJobs
            .slice(start, start + PAGE_SIZE)
            .forEach(job => {
                feed.appendChild(createJobCard(job));
            });

        if (totalPages > 1) {
            renderPagination(totalPages);
        }
    }

    // ===== SEARCH BUTTON =====

    form.addEventListener("submit", event => {
        event.preventDefault();

        const url = new URL(window.location.href);

        url.searchParams.delete("q");
        url.searchParams.delete("l");

        if (queryInput.value.trim()) {
            url.searchParams.set(
                "q", queryInput.value.trim()
            );
        }

        if (locationInput.value.trim()) {
            url.searchParams.set(
                "l", locationInput.value.trim()
            );
        }

        window.history.replaceState({}, "", url);

        filterJobs();
    });

    // ===== SIDEBAR FILTERS =====

    sidebar.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener("change", () => {
            filterJobs();
        });
    });

    // ===== RESET FILTERS =====

    const resetButton = sidebar.querySelector("button");

    if (resetButton) {
        resetButton.addEventListener("click", () => {

            sidebar.querySelectorAll(
                'input[type="checkbox"]'
            ).forEach(input => {
                input.checked = false;
            });

            queryInput.value = "";
            locationInput.value = "";

            window.history.replaceState(
                {}, "", window.location.pathname
            );

            filterJobs();
        });
    }

    // ===== PROFILE DROPDOWN =====

    if (profileMenu) {
        profileMenu.replaceChildren();

        function addMenuItem(tag, text, className) {
            const element = document.createElement(tag);
            element.textContent = text;
            element.className = className;
            profileMenu.appendChild(element);
            return element;
        }

        const user = auth?.currentUser();

        if (user) {
            addMenuItem(
                "p", "Signed in as", "profile-menu-title"
            );

            addMenuItem(
                "strong",
                user.name || "Candidate",
                "jobhub-profile-greeting"
            );

            addMenuItem(
                "p",
                user.email || "",
                "jobhub-profile-email"
            );

            const profile = addMenuItem(
                "a",
                "View / Edit Profile",
                "btn btn-outline btn-block btn-sm"
            );

            profile.href = "home.html";

            const logout = addMenuItem(
                "button",
                "Log Out",
                "btn btn-primary btn-block btn-sm"
            );

            logout.type = "button";
            logout.addEventListener("click", () => {
                auth.logout();
            });

        } else {
            addMenuItem(
                "p", "Welcome to JobHub",
                "profile-menu-title"
            );

            const login = addMenuItem(
                "a", "Log In",
                "btn btn-primary btn-block btn-sm"
            );
            login.href = "login.html";

            const signup = addMenuItem(
                "a", "Sign Up",
                "btn btn-outline btn-block btn-sm"
            );
            signup.href = "signup.html";
        }
    }

    // ===== CLOSE PROFILE MENU =====

    document.addEventListener("click", event => {
        if (
            profileToggle &&
            !event.target.closest(".profile-wrap")
        ) {
            profileToggle.checked = false;
        }
    });

    // ===== INITIAL DISPLAY =====

    filterJobs();
});
