
document.addEventListener("DOMContentLoaded", () => {

    const auth = typeof JobHubAuth !== "undefined"
        ? JobHubAuth : null;

    const getUser = () => auth?.currentUser() || null;

    const PRICES = {
        basic: 0,
        pro: 299,
        executive: 799
    };

    const NAMES = {
        basic: "Basic",
        pro: "Pro Candidate",
        executive: "Executive"
    };

    const STORAGE = "jobhub_demo_subscriptions_v1";

    let billing = "monthly";
    let selectedPlan = null;
    let paymentProcessing = false;

    const $ = selector => document.querySelector(selector);

    function money(amount) {
        return "₹" + amount.toLocaleString("en-IN");
    }

    function price(plan) {
        if (billing === "yearly") {
            return Math.round(PRICES[plan] * 12 * 0.8);
        }
        return PRICES[plan];
    }

    // ===== LOCAL STORAGE =====

    function getData() {
        try {
            const data = JSON.parse(
                localStorage.getItem(STORAGE) || "{}"
            );

            return data && typeof data === "object"
                && !Array.isArray(data) ? data : {};
        } catch {
            return {};
        }
    }

    function accountKey() {
        const user = getUser();
        return user ? String(user.id || user.email || "") : "";
    }

    function account() {
        return getData()[accountKey()] || {
            payments: [],
            subscription: null
        };
    }

    function saveAccount(value) {
        const all = getData();
        all[accountKey()] = value;
        localStorage.setItem(STORAGE, JSON.stringify(all));
    }

    // ===== CURRENT SUBSCRIPTION =====

    function activeSubscription() {
        const subscription = account().subscription;

        if (!subscription) return null;

        const isActive = subscription.status === "active";
        const isValid =
            new Date(subscription.expiresAt).getTime() > Date.now();

        return isActive && isValid ? subscription : null;
    }

    function formatDate(value) {
        return new Date(value).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    // ===== PROFILE DROPDOWN =====

    function renderProfile() {
        const menu = $(".profile-menu");
        if (!menu) return;

        menu.replaceChildren();

        function add(tag, label, className = "") {
            const element = document.createElement(tag);
            element.textContent = label;
            element.className = className;
            menu.appendChild(element);
            return element;
        }

        const user = getUser();

        if (user) {
            add("p", "My Profile", "profile-menu-title");
            add("strong", user.name || "Candidate");
            add("p", user.email || "", "history-muted");

            const profile = add(
                "a", "View / Edit Profile",
                "btn btn-outline btn-block btn-sm"
            );
            profile.href = "home.html";

            const logout = add(
                "button", "Log Out",
                "btn btn-primary btn-block btn-sm"
            );

            logout.type = "button";

            logout.addEventListener("click", () => {
                if (auth) auth.logout();
                window.location.href = "home.html";
            });

        } else {
            add("p", "Welcome to JobHub", "profile-menu-title");

            const login = add(
                "a", "Log In",
                "btn btn-primary btn-block btn-sm"
            );
            login.href = "login.html";

            const signup = add(
                "a", "Sign Up",
                "btn btn-outline btn-block btn-sm"
            );
            signup.href = "signup.html";
        }
    }

    // ===== RENDER PRICES =====

    function render() {
        const current = activeSubscription();

        for (const plan of Object.keys(PRICES)) {
            const amount = document.querySelector(
                `.amount[data-plan="${plan}"]`
            );

            if (amount) amount.textContent = money(price(plan));

            const button = document.querySelector(
                `.pricing-card button[data-plan="${plan}"]`
            );

            if (!button) continue;

            const same = plan === "basic"
                ? !current
                : current?.plan === plan;

            if (same) {
                button.textContent = "Current Plan";
            } else if (plan === "basic") {
                button.textContent = "Choose Basic";
            } else if (plan === "pro") {
                button.textContent = "Upgrade to Pro";
            } else {
                button.textContent = "Get Executive";
            }

            button.disabled = same;
        }

        document.querySelectorAll(".period").forEach(element => {
            element.textContent = billing === "yearly"
                ? "/ year" : "/ month";
        });

        $("#monthlyBtn").classList.toggle(
            "selected", billing === "monthly"
        );

        $("#yearlyBtn").classList.toggle(
            "selected", billing === "yearly"
        );

        renderStatus();
        renderHistory();
    }

    // ===== CURRENT PLAN =====

    function renderStatus() {
        const status = $("#subscriptionStatus");
        status.replaceChildren();

        const user = getUser();
        const current = activeSubscription();

        const title = document.createElement("strong");
        const detail = document.createElement("p");

        if (!user) {
            title.textContent = "Guest Account";
            detail.textContent =
                "Log in to activate a demo subscription.";
        } else {
            title.textContent = "Current Plan: " +
                (current ? NAMES[current.plan] : "Basic");

            detail.textContent = current
                ? `Demo plan active until ${formatDate(current.expiresAt)} (${current.billing}).`
                : "No active paid demo subscription.";
        }

        status.append(title, detail);

        if (user && current) {
            const cancel = document.createElement("button");
            cancel.type = "button";
            cancel.className = "btn btn-outline btn-sm";
            cancel.textContent = "Cancel Demo Plan";

            cancel.addEventListener("click", () => {
                if (!confirm("Cancel your demo subscription now?")) {
                    return;
                }

                const data = account();

                data.subscription = {
                    ...data.subscription,
                    status: "cancelled"
                };

                try {
                    saveAccount(data);
                    render();
                } catch {
                    alert("Unable to cancel demo plan.");
                }
            });

            status.appendChild(cancel);
        }
    }

    // ===== PAYMENT HISTORY =====

    function renderHistory() {
        const history = $("#paymentHistory");
        history.replaceChildren();

        if (!getUser()) {
            history.textContent =
                "Log in to view demo payment history.";
            return;
        }

        const payments = account().payments || [];

        if (!payments.length) {
            history.textContent = "No demo payments yet.";
            return;
        }

        [...payments].reverse().forEach(payment => {
            const row = document.createElement("div");
            row.className = "history-row";

            const left = document.createElement("span");
            left.textContent =
                `${NAMES[payment.plan]} · ${payment.billing} · ${formatDate(payment.paidAt)}`;

            const right = document.createElement("strong");
            right.textContent =
                `${money(payment.amount)} · DEMO`;

            row.append(left, right);
            history.appendChild(row);
        });
    }

    // ===== CHECKOUT =====

    function openCheckout(plan) {
        if (!getUser()) {
            alert("Please log in before selecting a subscription.");
            window.location.href = "login.html";
            return;
        }

        selectedPlan = plan;

        $("#checkoutPlan").textContent =
            NAMES[plan] + " · " +
            (billing === "yearly" ? "Yearly" : "Monthly");

        $("#checkoutAmount").textContent = money(price(plan));

        $("#checkoutOverlay").hidden = false;
        $("#demoUpi").focus();
    }

    function closeCheckout() {
        if (paymentProcessing) return;

        $("#checkoutOverlay").hidden = true;
        selectedPlan = null;
        $("#demoPaymentForm").reset();
    }

    // ===== PLAN BUTTONS =====

    document.querySelectorAll(
        ".pricing-card button[data-plan]"
    ).forEach(button => {

        button.addEventListener("click", () => {
            const plan = button.dataset.plan;

            if (plan === "basic") {
                if (!getUser()) {
                    window.location.href = "signup.html";
                } else {
                    alert(
                        "Cancel your paid demo plan to return to Basic."
                    );
                }
                return;
            }

            openCheckout(plan);
        });
    });

    // ===== BILLING TOGGLE =====

    $("#monthlyBtn").addEventListener("click", () => {
        billing = "monthly";
        render();
    });

    $("#yearlyBtn").addEventListener("click", () => {
        billing = "yearly";
        render();
    });

    // ===== CLOSE MODAL =====

    $("#closeCheckout").addEventListener(
        "click", closeCheckout
    );

    $("#checkoutOverlay").addEventListener("click", event => {
        if (event.target === $("#checkoutOverlay")) {
            closeCheckout();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" &&
            !$("#checkoutOverlay").hidden) {
            closeCheckout();
        }
    });

    // ===== PROMISE FOR DEMO PAYMENT =====

    function processDemoPayment() {
        return new Promise((resolve, reject) => {

            setTimeout(() => {
                if (!getUser()) {
                    reject(
                        new Error(
                            "Session expired. Please log in again."
                        )
                    );
                } else {
                    resolve("Demo processing complete");
                }
            }, 2000);

        });
    }

    // ===== SIMULATE PAYMENT =====

    $("#demoPaymentForm").addEventListener(
        "submit", async event => {

        event.preventDefault();

        if (paymentProcessing) return;

        if (!getUser() || !selectedPlan) {
            alert("Please log in again.");
            closeCheckout();
            return;
        }

        const upi = $("#demoUpi").value.trim();

        if (upi && !/^[\w.-]{2,}@[\w.-]{2,}$/.test(upi)) {
            alert(
                "Enter a valid-looking demo UPI ID or leave it blank."
            );
            return;
        }

        const planToBuy = selectedPlan;
        const billingToBuy = billing;

        const payButton = $(
            "#demoPaymentForm button[type='submit']"
        );

        paymentProcessing = true;
        payButton.disabled = true;
        payButton.textContent = "Processing...";

        try {
            // PROMISE WITH ASYNC/AWAIT
            const result = await processDemoPayment();
            console.log(result);

            const now = new Date();
            const expiry = new Date(now);

            if (billingToBuy === "yearly") {
                expiry.setFullYear(
                    expiry.getFullYear() + 1
                );
            } else {
                expiry.setMonth(
                    expiry.getMonth() + 1
                );
            }

            const payment = {
                id: "DEMO-" + Date.now(),
                plan: planToBuy,
                billing: billingToBuy,
                amount: billingToBuy === "yearly"
                    ? Math.round(
                        PRICES[planToBuy] * 12 * 0.8
                    )
                    : PRICES[planToBuy],
                paidAt: now.toISOString(),
                status: "simulated"
            };

            const data = account();

            if (!Array.isArray(data.payments)) {
                data.payments = [];
            }

            data.payments.push(payment);

            data.subscription = {
                plan: planToBuy,
                billing: billingToBuy,
                status: "active",
                startedAt: now.toISOString(),
                expiresAt: expiry.toISOString()
            };

            saveAccount(data);

            paymentProcessing = false;
            closeCheckout();
            render();

            alert(
                "Demo Payment Successful!\n\n" +
                NAMES[payment.plan] + " activated.\n\n" +
                "No payment has been verified by JobHub."
            );

        } catch (error) {
            console.error(error);
            alert(
                error.message ||
                "Unable to process demo subscription."
            );

        } finally {
            paymentProcessing = false;
            payButton.disabled = false;
            payButton.textContent = "Simulate Payment";
        }
    });

    // ===== CLOSE PROFILE MENU =====

    document.addEventListener("click", event => {
        if (!event.target.closest(".profile-wrap")) {
            const toggle = $("#profileToggle");
            if (toggle) toggle.checked = false;
        }
    });

    // ===== INITIAL LOAD =====

    renderProfile();
    render();
});
