(() => {
  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error(
      "Uravu: Supabase client not found. Check supabase-config.js."
    );
    return;
  }

  const auth = {
    user: null,
    busy: false,

    async init() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error.message);
      }

      auth.user = data?.session?.user ?? null;
      auth.render();

      supabase.auth.onAuthStateChange((_event, session) => {
        auth.user = session?.user ?? null;
        auth.render();
      });
    },

    render() {
      let panel = document.getElementById("uravu-auth-panel");

      if (!panel) {
        panel = document.createElement("section");
        panel.id = "uravu-auth-panel";
        panel.style.cssText = `
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(10, 20, 15, .72);
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
        `;

        panel.innerHTML = `
          <div style="
            background: var(--surface, #fff);
            color: var(--text, #202820);
            width: 100%;
            max-width: 390px;
            padding: 25px;
            border-radius: 18px;
            box-sizing: border-box;
          ">
            <h2 id="uravu-auth-title">Sign in to Uravu</h2>
            <p id="uravu-auth-description">
              Enter your phone number to receive a verification code.
            </p>

            <form id="uravu-auth-form">
              <label for="uravu-phone">Phone number</label>
              <input
                id="uravu-phone"
                type="tel"
                autocomplete="tel"
                placeholder="+919876543210"
                required
                style="display:block;width:100%;box-sizing:border-box;padding:12px;margin:8px 0 16px"
              />

              <div id="uravu-otp-wrap" hidden>
                <label for="uravu-otp">Verification code</label>
                <input
                  id="uravu-otp"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxlength="6"
                  placeholder="6-digit code"
                  style="display:block;width:100%;box-sizing:border-box;padding:12px;margin:8px 0 16px"
                />
              </div>

              <p id="uravu-auth-message" role="status"></p>

              <button
                id="uravu-auth-submit"
                type="submit"
                style="width:100%;padding:12px;cursor:pointer"
              >Send OTP</button>

              <button
                id="uravu-auth-close"
                type="button"
                style="width:100%;padding:12px;margin-top:8px;cursor:pointer"
              >Close</button>
            </form>
          </div>
        `;

        document.body.appendChild(panel);

        panel.querySelector("#uravu-auth-close").onclick = () => {
          panel.style.display = "none";
        };

        panel.querySelector("#uravu-auth-form").onsubmit =
          auth.handleSubmit;
      }

      const accountButton = document.getElementById("account-button");

      if (accountButton && !accountButton.dataset.uravuAuthBound) {
        accountButton.dataset.uravuAuthBound = "true";

        // Replace the demo account button behavior.
        const replacement = accountButton.cloneNode(true);
        accountButton.replaceWith(replacement);

        replacement.addEventListener("click", () => {
          if (auth.user) {
            auth.showAccountActions();
          } else {
            auth.showLogin();
          }
        });
      }
    },

    showLogin() {
      const panel = document.getElementById("uravu-auth-panel");
      panel.style.display = "flex";

      document.getElementById("uravu-auth-title").textContent =
        "Sign in to Uravu";

      document.getElementById("uravu-auth-description").textContent =
        "Enter your phone number with country code.";

      document.getElementById("uravu-phone").hidden = false;
      document.getElementById("uravu-otp-wrap").hidden = true;
      document.getElementById("uravu-auth-message").textContent = "";
      document.getElementById("uravu-auth-submit").textContent =
        "Send OTP";

      document.getElementById("uravu-phone").focus();
    },

    showAccountActions() {
      const choice = window.confirm(
        "You are signed in as " +
        (auth.user.phone || auth.user.id) +
        ". Press OK to sign out."
      );

      if (choice) auth.signOut();
    },

    async handleSubmit(event) {
      event.preventDefault();

      if (auth.busy) return;

      const phone = document
        .getElementById("uravu-phone").value.trim();

      const otpInput = document.getElementById("uravu-otp");
      const message = document.getElementById("uravu-auth-message");
      const button = document.getElementById("uravu-auth-submit");
      const otpVisible =
        !document.getElementById("uravu-otp-wrap").hidden;

      message.textContent = "";
      auth.busy = true;
      button.disabled = true;

      try {
        if (!otpVisible) {
          if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
            throw new Error(
              "Enter a valid phone number with country code, e.g. +919876543210."
            );
          }

          const { error } = await supabase.auth.signInWithOtp({
            phone
          });

          if (error) throw error;

          document.getElementById("uravu-otp-wrap").hidden = false;
          document.getElementById("uravu-auth-description").textContent =
            "Enter the verification code sent to " + phone;

          button.textContent = "Verify OTP";
          otpInput.required = true;
          otpInput.focus();

          message.textContent = "OTP requested. Check your messages.";
        } else {
          const token = otpInput.value.trim();

          if (!/^\d{6}$/.test(token)) {
            throw new Error("Enter the 6-digit verification code.");
          }

          const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: "sms"
          });

          if (error) throw error;

          auth.user = data.user;
          message.textContent = "Signed in successfully.";
          document.getElementById("uravu-auth-panel").style.display =
            "none";

          // Reload so the application can initialize with the session.
          window.location.reload();
        }
      } catch (error) {
        message.textContent = error.message || "Authentication failed.";
      } finally {
        auth.busy = false;
        button.disabled = false;
      }
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert("Could not sign out: " + error.message);
        return;
      }

      auth.user = null;
      window.location.reload();
    }
  };

  window.uravuAuth = auth;

  document.addEventListener("DOMContentLoaded", () => auth.init());
})();
