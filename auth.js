
(() => {
  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error("Uravu: Supabase client not initialized.");
    return;
  }

  const auth = {
    user: null,

    async signIn() {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });

      if (error) {
        alert("Google sign-in failed: " + error.message);
      }
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert("Sign-out failed: " + error.message);
        return;
      }

      window.location.reload();
    },

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
      const button = document.getElementById("account-button");
      if (!button) return;

      if (!button.dataset.googleAuthBound) {
        const replacement = button.cloneNode(true);
        replacement.dataset.googleAuthBound = "true";
        button.replaceWith(replacement);

        replacement.addEventListener("click", () => {
          if (auth.user) {
            const name =
              auth.user.user_metadata?.full_name ||
              auth.user.user_metadata?.name ||
              auth.user.email ||
              "your account";

            if (confirm(`Signed in as ${name}.\nSign out of Uravu?`)) {
              auth.signOut();
            }
          } else {
            auth.signIn();
          }
        });
      }

      const accountButton = document.getElementById("account-button");
      if (!accountButton) return;

      const name =
        auth.user?.user_metadata?.full_name ||
        auth.user?.user_metadata?.name ||
        auth.user?.email ||
        "";

      accountButton.textContent = auth.user
        ? name.charAt(0).toUpperCase()
        : "G";

      accountButton.title = auth.user
        ? `Signed in as ${name}. Click to sign out.`
        : "Sign in with Google";

      accountButton.setAttribute(
        "aria-label",
        accountButton.title
      );
    }
  };

  window.uravuAuth = auth;

  document.addEventListener("DOMContentLoaded", () => auth.init());
})();
