const { supabase } = require("../config/supabase");

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Get user's profile to know their role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return res.status(401).json({ error: "Unauthorized: Profile not found" });
    }

    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    let userRole = req.profile?.role;
    if (userRole === "pg_owner") {
      userRole = "owner";
    }
    if (!req.profile || (!roles.includes(userRole) && !roles.includes(req.profile.role))) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };
