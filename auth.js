(() => {
  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error("Uravu: Supabase client not initialized. Check supabase-config.js.");
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

      if (error) alert("Google sign-in failed: " + error.message);
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert("Sign-out failed: " + error.message);
        return;
      }
      window.location.reload();
    },

    render() {
      const button = document.getElementById("google-signin-button");
      const label = document.getElementById("google-signin-label");
      if (!button || !label) return;

      if (!button.dataset.googleAuthBound) {
        button.dataset.googleAuthBound = "true";
        button.addEventListener("click", () => {
          if (!auth.user) {
            auth.signIn();
            return;
          }

          const name =
            auth.user.user_metadata?.full_name ||
            auth.user.user_metadata?.name ||
            auth.user.email ||
            "your account";

          if (window.confirm(`Signed in as ${name}.\nSign out of Uravu?`)) {
            auth.signOut();
          }
        });
      }

      const name =
        auth.user?.user_metadata?.full_name ||
        auth.user?.user_metadata?.name ||
        auth.user?.email ||
        "";

      label.textContent = auth.user ? "Sign out" : "Sign in with Google";
      button.title = auth.user
        ? `Signed in as ${name}. Click to sign out.`
        : "Sign in with Google";
      button.setAttribute("aria-label", button.title);
    },

    async init() {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Uravu session error:", error.message);

      auth.user = data?.session?.user ?? null;
      auth.render();

      supabase.auth.onAuthStateChange((_event, session) => {
        auth.user = session?.user ?? null;
        auth.render();
      });
    }
  };

  window.uravuAuth = auth;
  document.addEventListener("DOMContentLoaded", () => auth.init());
})();
