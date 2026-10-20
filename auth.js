(() => {
  const supabase = window.supabaseClient;
  const AUTH_EVENT = "uravu:auth";
  const translate = value => typeof window.uravuTranslate === "function" ? window.uravuTranslate(value) : value;

  const auth = {
    user: null,
    loading: true,
    async signIn() {
      if (!supabase) {
        alert(translate("Uravu could not connect to Supabase. Check supabase-config.js."));
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: new URL("./", window.location.href).toString() }
      });
      if (error) {
        console.error("Uravu Google sign-in:", error);
        alert(translate("Google sign-in failed: " + error.message));
      }
    },
    async signOut() {
      if (!supabase) return;
      const button = document.getElementById("sign-out-button");
      if (button) button.disabled = true;
      const { error } = await supabase.auth.signOut();
      if (button) button.disabled = false;
      if (error) {
        console.error("Uravu sign-out:", error);
        alert(translate("Sign-out failed: " + error.message));
        return;
      }
      auth.user = null;
      auth.publish();
    },
    publish() {
      document.dispatchEvent(new CustomEvent(AUTH_EVENT, {
        detail: { user: auth.user, loading: auth.loading }
      }));
      auth.renderHeader();
    },
    renderHeader() {
      const signIn = document.getElementById("header-signin");
      const menu = document.getElementById("user-menu");
      const nameNode = document.getElementById("user-name");
      const avatarNode = document.getElementById("user-avatar");
      const appAvatarNode = document.getElementById("app-nav-avatar");
      const name = auth.user?.user_metadata?.full_name ||
        auth.user?.user_metadata?.name ||
        auth.user?.email ||
        "Account";
      const avatar = auth.user?.user_metadata?.avatar_url ||
        auth.user?.user_metadata?.picture;
      if (signIn) signIn.hidden = Boolean(auth.user) || auth.loading;
      if (menu) menu.hidden = !auth.user || auth.loading;
      if (nameNode) nameNode.textContent = name;
      if (avatarNode) {
        if (avatar) {
          const img = document.createElement("img");
          img.src = avatar;
          img.alt = "";
          img.referrerPolicy = "no-referrer";
          avatarNode.replaceChildren(img);
        } else {
          avatarNode.textContent = name.trim().charAt(0).toUpperCase() || "U";
        }
      }
      if (appAvatarNode) {
        let image = appAvatarNode.querySelector("img");
        if (avatar) {
          if (!image) {
            image = document.createElement("img");
            image.alt = "";
            image.referrerPolicy = "no-referrer";
            appAvatarNode.appendChild(image);
          }
          image.src = avatar;
        } else if (image) {
          image.remove();
        }
        appAvatarNode.classList.toggle("has-photo", Boolean(avatar));
      }
    },
    async init() {
      if (!supabase) {
        auth.loading = false;
        auth.publish();
        throw new Error("Supabase client is missing.");
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Uravu session check:", error.message);
      auth.user = data?.session?.user ?? null;
      auth.loading = false;
      auth.publish();
      supabase.auth.onAuthStateChange((_event, session) => {
        auth.user = session?.user ?? null;
        auth.loading = false;

        setTimeout(() => auth.publish(), 0);
      });
      return auth.user;
    }
  };

  document.getElementById("header-signin")?.addEventListener("click", () => auth.signIn());
  document.getElementById("hero-signin")?.addEventListener("click", () => auth.signIn());
  document.getElementById("sign-out-button")?.addEventListener("click", () => auth.signOut());
  window.uravuAuth = auth;
  auth.ready = auth.init().catch(error => {
    console.error("Uravu auth initialization:", error);
    return null;
  });
})();
