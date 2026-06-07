import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiCalendar, FiLock, FiEdit2, FiShoppingBag,
  FiChevronRight, FiUpload, FiMail, FiPackage, FiLogOut,
  FiCheck, FiX, FiTruck, FiClock
} from "react-icons/fi";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  withCredentials: true,
});

const STATUS_CONFIG = {
  Delivered:  { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: FiCheck },
  Shipped:    { color: "#6366f1", bg: "rgba(99,102,241,0.12)", icon: FiTruck },
  Processing: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: FiClock },
  Pending:    { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: FiPackage },
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({ name: "", password: "", profileImage: "" });
  const [activeTab, setActiveTab] = useState("profile");
  const [imageFile, setImageFile] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const fetchData = async () => {
      try {
        const [profileRes, ordersRes] = await Promise.all([
          axios.get(`${BACKEND}/users/profile`, getAuthHeaders()),
          axios.get(`${BACKEND}/orders`, getAuthHeaders()),
        ]);
        const u = profileRes.data.data;
        setUser(u);
        setFormData({ name: u.name, password: "", profileImage: u.profileImage || "" });
        setOrders(ordersRes.data.data || []);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load profile";
        toast.error(msg);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const uploadImage = async () => {
    if (!imageFile) return formData.profileImage;
    const data = new FormData();
    data.append("file", imageFile);
    data.append("upload_preset", "ml_default");
    const res = await axios.post("https://api.cloudinary.com/v1_1/dbmsdibhu/image/upload", data);
    return res.data.secure_url;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const imageUrl = await uploadImage();
      const payload = { ...formData, profileImage: imageUrl };
      await axios.put(`${BACKEND}/users/profile`, payload, getAuthHeaders());
      setUser((prev) => ({ ...prev, name: payload.name, profileImage: imageUrl }));
      setFormData({ ...payload, password: "" });
      setImageFile(null);
      setEditMode(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    axios.defaults.headers.common["Authorization"] = "";
    toast.success("Logged out");
    navigate("/login");
  };

  const initials = user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingOrb} />
        <p style={styles.loadingText}>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Background */}
      <div style={styles.bgGradient} />
      <div style={styles.bgGrid} />

      <div style={styles.container}>
        {/* ── SIDEBAR ── */}
        <motion.aside
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={styles.sidebar}
        >
          {/* Avatar */}
          <div style={styles.avatarSection}>
            <div style={styles.avatarRing}>
              <div style={styles.avatar}>
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt="avatar" style={styles.avatarImg} />
                ) : (
                  <span style={styles.avatarInitials}>{initials}</span>
                )}
              </div>
            </div>
            <h2 style={styles.sidebarName}>{user?.name}</h2>
            <p style={styles.sidebarEmail}>{user?.email}</p>
            <div style={styles.badge}>
              <span style={styles.badgeDot} />
              Verified Member
            </div>
          </div>

          {/* Nav */}
          <nav style={styles.nav}>
            {[
              { key: "profile", label: "Profile", icon: FiUser },
              { key: "orders", label: "Orders", icon: FiShoppingBag },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  ...styles.navBtn,
                  ...(activeTab === key ? styles.navBtnActive : {}),
                }}
              >
                <Icon size={16} />
                {label}
                {activeTab === key && <FiChevronRight size={14} style={{ marginLeft: "auto" }} />}
              </button>
            ))}
          </nav>

          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{orders.length}</span>
              <span style={styles.statLabel}>Orders</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <span style={styles.statNum}>
                {orders.filter((o) => o.status === "Delivered").length}
              </span>
              <span style={styles.statLabel}>Delivered</span>
            </div>
          </div>

          <button onClick={handleLogout} style={styles.logoutBtn}>
            <FiLogOut size={14} />
            Sign Out
          </button>
        </motion.aside>

        {/* ── MAIN ── */}
        <main style={styles.main}>
          <AnimatePresence mode="wait">
            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div style={styles.cardHeader}>
                  <div>
                    <h1 style={styles.cardTitle}>Personal Information</h1>
                    <p style={styles.cardSubtitle}>Manage your account details</p>
                  </div>
                  {!editMode && (
                    <button onClick={() => setEditMode(true)} style={styles.editBtn}>
                      <FiEdit2 size={14} />
                      Edit Profile
                    </button>
                  )}
                </div>

                <div style={styles.card}>
                  {!editMode ? (
                    /* ── VIEW MODE ── */
                    <div style={styles.infoGrid}>
                      {[
                        { icon: FiUser, label: "Full Name", value: user?.name },
                        { icon: FiMail, label: "Email", value: user?.email },
                        { icon: FiCalendar, label: "Member Since", value: new Date(user?.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                        { icon: FiPackage, label: "Total Orders", value: orders.length + " orders placed" },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} style={styles.infoRow}>
                          <div style={styles.infoIcon}><Icon size={16} color="#6366f1" /></div>
                          <div>
                            <p style={styles.infoLabel}>{label}</p>
                            <p style={styles.infoValue}>{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* ── EDIT MODE ── */
                    <form onSubmit={handleUpdate} style={styles.form}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Full Name</label>
                        <div style={styles.inputWrap}>
                          <FiUser size={15} color="#64748b" style={styles.inputIcon} />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={styles.input}
                            required
                            placeholder="Your full name"
                          />
                        </div>
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Email Address</label>
                        <div style={styles.inputWrap}>
                          <FiMail size={15} color="#64748b" style={styles.inputIcon} />
                          <input
                            type="email"
                            value={user?.email}
                            style={{ ...styles.input, opacity: 0.5, cursor: "not-allowed" }}
                            disabled
                          />
                        </div>
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Profile Photo</label>
                        <div style={styles.uploadZone}>
                          <FiUpload size={20} color="#6366f1" />
                          <span style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
                            {imageFile ? imageFile.name : "Click to upload image"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files[0];
                              if (f) {
                                setImageFile(f);
                                const r = new FileReader();
                                r.onloadend = () => setFormData((p) => ({ ...p, profileImage: r.result }));
                                r.readAsDataURL(f);
                              }
                            }}
                            style={styles.fileInput}
                          />
                        </div>
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>New Password <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span></label>
                        <div style={styles.inputWrap}>
                          <FiLock size={15} color="#64748b" style={styles.inputIcon} />
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={styles.input}
                            placeholder="Leave blank to keep current"
                          />
                        </div>
                      </div>

                      <div style={styles.formActions}>
                        <button
                          type="button"
                          onClick={() => { setEditMode(false); setImageFile(null); }}
                          style={styles.cancelBtn}
                        >
                          <FiX size={14} /> Cancel
                        </button>
                        <button type="submit" disabled={updating} style={styles.saveBtn}>
                          {updating ? (
                            <span style={styles.spinner} />
                          ) : (
                            <><FiCheck size={14} /> Save Changes</>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── ORDERS TAB ── */}
            {activeTab === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div style={styles.cardHeader}>
                  <div>
                    <h1 style={styles.cardTitle}>Order History</h1>
                    <p style={styles.cardSubtitle}>{orders.length} orders placed</p>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div style={styles.emptyState}>
                    <FiShoppingBag size={48} color="#334155" />
                    <h3 style={styles.emptyTitle}>No orders yet</h3>
                    <p style={styles.emptyText}>Your order history will appear here</p>
                    <Link to="/products" style={styles.shopBtn}>Browse Products</Link>
                  </div>
                ) : (
                  <div style={styles.ordersList}>
                    {orders.map((order, i) => {
                      const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
                      const StatusIcon = cfg.icon;
                      return (
                        <motion.div
                          key={order._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          style={styles.orderCard}
                        >
                          <div style={styles.orderTop}>
                            <div>
                              <p style={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</p>
                              <p style={styles.orderDate}>
                                <FiCalendar size={12} style={{ marginRight: 5 }} />
                                {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                              <div style={{ ...styles.statusBadge, background: cfg.bg, color: cfg.color }}>
                                <StatusIcon size={12} />
                                {order.status}
                              </div>
                              <p style={styles.orderTotal}>₹{order.totalPrice?.toLocaleString()}</p>
                            </div>
                          </div>

                          <div style={styles.orderItems}>
                            {order.items.slice(0, 3).map((item) => (
                              <div key={item._id} style={styles.orderItem}>
                                <div style={styles.orderItemImg}>
                                  <img
                                    src={item.productImage || "https://via.placeholder.com/60"}
                                    alt={item.productTitle}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={styles.orderItemName}>{item.productTitle}</p>
                                  <p style={styles.orderItemQty}>Qty: {item.quantity}</p>
                                </div>
                                <p style={styles.orderItemPrice}>₹{(item.productPrice * item.quantity).toLocaleString()}</p>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p style={styles.moreItems}>+{order.items.length - 3} more items</p>
                            )}
                          </div>

                          <Link to={`/orders/${order._id}`} style={styles.viewOrderBtn}>
                            View Details <FiChevronRight size={14} />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ─── STYLES ─── */
const styles = {
  root: {
    minHeight: "100vh",
    background: "#060b18",
    position: "relative",
    fontFamily: "'DM Sans', sans-serif",
    overflowX: "hidden",
  },
  bgGradient: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(16,185,129,0.08) 0%, transparent 60%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  bgGrid: {
    position: "fixed",
    inset: 0,
    backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    pointerEvents: "none",
    zIndex: 0,
  },
  loadingScreen: {
    minHeight: "100vh",
    background: "#060b18",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingOrb: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "2px solid rgba(99,102,241,0.2)",
    borderTopColor: "#6366f1",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#64748b",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "40px 24px",
    display: "flex",
    gap: 28,
    alignItems: "flex-start",
  },
  sidebar: {
    width: 280,
    flexShrink: 0,
    background: "rgba(15,23,42,0.8)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 20,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    position: "sticky",
    top: 40,
  },
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 0 24px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 8,
  },
  avatarRing: {
    padding: 3,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #10b981)",
    marginBottom: 14,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: "50%",
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: "2px solid #060b18",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: {
    fontSize: 26,
    fontWeight: 700,
    background: "linear-gradient(135deg, #6366f1, #10b981)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontFamily: "'DM Sans', sans-serif",
  },
  sidebarName: {
    fontSize: 17,
    fontWeight: 600,
    color: "#f1f5f9",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  sidebarEmail: {
    fontSize: 12,
    color: "#64748b",
    margin: "4px 0 10px",
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: "#10b981",
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 20,
    padding: "3px 10px",
    fontWeight: 500,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10b981",
    display: "inline-block",
    animation: "pulse 2s infinite",
  },
  nav: { display: "flex", flexDirection: "column", gap: 4, margin: "8px 0" },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "left",
  },
  navBtnActive: {
    background: "rgba(99,102,241,0.12)",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,0.2)",
  },
  statsRow: {
    display: "flex",
    background: "rgba(99,102,241,0.06)",
    border: "1px solid rgba(99,102,241,0.1)",
    borderRadius: 12,
    padding: "14px 0",
    margin: "8px 0",
  },
  statBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
  },
  statDivider: {
    width: 1,
    background: "rgba(99,102,241,0.15)",
    margin: "4px 0",
  },
  statNum: { fontSize: 22, fontWeight: 700, color: "#a5b4fc" },
  statLabel: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px",
    borderRadius: 10,
    border: "1px solid rgba(239,68,68,0.2)",
    background: "rgba(239,68,68,0.06)",
    color: "#f87171",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 8,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
  main: { flex: 1, minWidth: 0 },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  cardSubtitle: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  editBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 16px",
    borderRadius: 10,
    border: "1px solid rgba(99,102,241,0.3)",
    background: "rgba(99,102,241,0.1)",
    color: "#a5b4fc",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: "rgba(15,23,42,0.8)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(99,102,241,0.12)",
    borderRadius: 20,
    padding: 28,
  },
  infoGrid: { display: "flex", flexDirection: "column", gap: 4 },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "rgba(99,102,241,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoLabel: { fontSize: 11, color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 15, color: "#e2e8f0", margin: "3px 0 0", fontWeight: 500 },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  formGroup: { display: "flex", flexDirection: "column", gap: 7 },
  label: { fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 },
  inputWrap: { position: "relative" },
  inputIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
  input: {
    width: "100%",
    padding: "11px 14px 11px 40px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
    transition: "border 0.2s",
  },
  uploadZone: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    border: "1.5px dashed rgba(99,102,241,0.25)",
    borderRadius: 12,
    background: "rgba(99,102,241,0.04)",
    cursor: "pointer",
    gap: 4,
  },
  fileInput: {
    position: "absolute",
    inset: 0,
    opacity: 0,
    cursor: "pointer",
    width: "100%",
    height: "100%",
  },
  formActions: { display: "flex", gap: 10, paddingTop: 4 },
  cancelBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "11px 20px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  saveBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "11px 20px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    background: "rgba(15,23,42,0.8)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(99,102,241,0.12)",
    borderRadius: 20,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: "#e2e8f0", margin: 0 },
  emptyText: { fontSize: 14, color: "#64748b", margin: 0 },
  shopBtn: {
    marginTop: 8,
    padding: "10px 24px",
    borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
  },
  ordersList: { display: "flex", flexDirection: "column", gap: 14 },
  orderCard: {
    background: "rgba(15,23,42,0.8)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(99,102,241,0.1)",
    borderRadius: 16,
    overflow: "hidden",
  },
  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "18px 20px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  orderId: { fontSize: 14, fontWeight: 700, color: "#a5b4fc", margin: 0, letterSpacing: 0.5 },
  orderDate: {
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 20,
    letterSpacing: 0.3,
  },
  orderTotal: { fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  orderItems: { padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 },
  orderItem: { display: "flex", alignItems: "center", gap: 12 },
  orderItemImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: "hidden",
    background: "#0f172a",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: 500,
    color: "#e2e8f0",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 200,
  },
  orderItemQty: { fontSize: 12, color: "#64748b", margin: "3px 0 0" },
  orderItemPrice: { marginLeft: "auto", fontSize: 13, fontWeight: 600, color: "#a5b4fc" },
  moreItems: { fontSize: 12, color: "#64748b", margin: "4px 0 0", textAlign: "center" },
  viewOrderBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "12px",
    borderTop: "1px solid rgba(255,255,255,0.04)",
    color: "#6366f1",
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
    transition: "background 0.2s",
  },
};