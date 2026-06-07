import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const backendURL = import.meta.env.VITE_BACKEND_URL;

const EMPTY_FORM = {
  productTitle: "",
  productDesc: "",
  productPrice: "",
  productImage: "",
  category: "",
  brand: "",
};

const STATUS_COLORS = {
  Pending:    { bg: "#FEF3C7", color: "#92400E" },
  Processing: { bg: "#DBEAFE", color: "#1E40AF" },
  Shipped:    { bg: "#EDE9FE", color: "#5B21B6" },
  Delivered:  { bg: "#D1FAE5", color: "#065F46" },
};

const StatusBadge = ({ status }) => {
  const style = STATUS_COLORS[status] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.3,
      }}
    >
      {status}
    </span>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: color + "22",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        color,
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Admin check
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/users/check-auth`, { withCredentials: true });
        if (res.data.data.role !== "admin") {
          toast.error("Access denied: Admins only");
          navigate("/admin/login");
        }
      } catch {
        toast.error("Please login to access the dashboard");
        navigate("/admin/login");
      }
    };
    checkAdmin();
  }, [navigate]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/products`);
        setProducts(res.data.data.products || []);
      } catch (err) {
        setProducts([]);
        toast.error(err?.response?.data?.message || "Failed to fetch products");
      }
    };
    fetchProducts();
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendURL}/api/orders/admin`, {
        params: { page: currentPage, limit: 5, search: searchQuery },
        withCredentials: true,
      });
      setOrders(res.data.data.orders || []);
      setTotalPages(res.data.data.totalPages || 1);
    } catch (err) {
      setOrders([]);
      toast.error(err?.response?.data?.message || "Failed to fetch orders");
      if (err?.response?.status === 403) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, navigate]);

  useEffect(() => {
    if (activeTab === "orders") fetchOrders();
  }, [activeTab, currentPage, searchQuery, fetchOrders]);

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await axios.put(
          `${backendURL}/api/products/${editingProduct._id}`,
          formData,
          { withCredentials: true }
        );
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? res.data.data : p))
        );
        setEditingProduct(null);
        toast.success("Product updated successfully");
      } else {
        const res = await axios.post(`${backendURL}/api/products`, formData, {
          withCredentials: true,
        });
        setProducts((prev) => [...prev, res.data.data]);
        toast.success("Product added successfully");
      }
      setFormData(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      productTitle: product.productTitle,
      productDesc: product.productDesc,
      productPrice: product.productPrice,
      productImage: product.productImage,
      category: product.category,
      brand: product.brand,
    });
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${backendURL}/api/products/${id}`, { withCredentials: true });
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product deleted successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete product");
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${backendURL}/api/orders/${orderId}`,
        { status },
        { withCredentials: true }
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o))
      );
      toast.success("Order status updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update order status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#FAFAFA",
    transition: "border 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 4,
  };

  const tabs = [
    { key: "overview", label: "📊 Overview" },
    { key: "products", label: "📦 Products" },
    { key: "orders", label: "🛒 Orders" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F3F4F6", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 220,
          background: "#1E1B4B",
          color: "#fff",
          padding: "28px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>⚙️ AdminPanel</div>
          <div style={{ fontSize: 12, color: "#A5B4FC", marginTop: 4 }}>Store Management</div>
        </div>

        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              background: activeTab === tab.key ? "#4F46E5" : "transparent",
              color: activeTab === tab.key ? "#fff" : "#C7D2FE",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            background: "transparent",
            color: "#FCA5A5",
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            {activeTab === "overview" && "Dashboard Overview"}
            {activeTab === "products" && (editingProduct ? "✏️ Edit Product" : "📦 Manage Products")}
            {activeTab === "orders" && "🛒 Manage Orders"}
          </h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Welcome back, Admin!</p>
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
              <StatCard label="Total Products" value={products.length} icon="📦" color="#4F46E5" />
              <StatCard label="Total Orders" value={orders.length || "—"} icon="🛒" color="#059669" />
              <StatCard label="Pending Orders" value={pendingOrders || "—"} icon="⏳" color="#D97706" />
            </div>
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "20px 24px",
                border: "1px solid #E5E7EB",
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "#111827" }}>
                Recent Products
              </h3>
              {products.slice(0, 5).map((p) => (
                <div
                  key={p._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid #F3F4F6",
                  }}
                >
                  <img
                    src={p.productImage}
                    alt={p.productTitle}
                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", background: "#E5E7EB" }}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{p.productTitle}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{p.category} · {p.brand}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#4F46E5" }}>₹{p.productPrice}</div>
                </div>
              ))}
              {products.length === 0 && (
                <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>No products yet</p>
              )}
            </div>
          </>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === "products" && (
          <>
            {/* Product Form */}
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "24px",
                border: "1px solid #E5E7EB",
                marginBottom: 28,
              }}
            >
              <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600, color: "#111827" }}>
                {editingProduct ? "Update Product" : "Add New Product"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  {[
                    { label: "Product Title", name: "productTitle", type: "text" },
                    { label: "Description", name: "productDesc", type: "text" },
                    { label: "Price (₹)", name: "productPrice", type: "number" },
                    { label: "Image URL", name: "productImage", type: "text" },
                    { label: "Category", name: "category", type: "text" },
                    { label: "Brand", name: "brand", type: "text" },
                  ].map(({ label, name, type }) => (
                    <div key={name}>
                      <label style={labelStyle}>{label}</label>
                      <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleInputChange}
                        style={inputStyle}
                        required
                        placeholder={`Enter ${label.toLowerCase()}`}
                        onFocus={(e) => (e.target.style.border = "1px solid #4F46E5")}
                        onBlur={(e) => (e.target.style.border = "1px solid #D1D5DB")}
                      />
                    </div>
                  ))}
                </div>

                {/* Image Preview */}
                {formData.productImage && (
                  <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>Image Preview</label>
                    <img
                      src={formData.productImage}
                      alt="preview"
                      style={{ height: 100, borderRadius: 8, objectFit: "cover", border: "1px solid #E5E7EB" }}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      background: "#4F46E5",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    {editingProduct ? "✅ Update Product" : "➕ Add Product"}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => { setEditingProduct(null); setFormData(EMPTY_FORM); }}
                      style={{
                        padding: "10px 20px",
                        background: "#F3F4F6",
                        color: "#374151",
                        border: "1px solid #D1D5DB",
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Product List */}
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
              All Products ({products.length})
            </h2>
            {products.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9CA3AF", padding: 40, background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB" }}>
                No products added yet.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
                {products.map((product) => (
                  <div
                    key={product._id}
                    style={{
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    }}
                  >
                    <img
                      src={product.productImage}
                      alt={product.productTitle}
                      style={{ width: "100%", height: 180, objectFit: "cover", background: "#F3F4F6" }}
                      onError={(e) => (e.target.style.background = "#E5E7EB")}
                    />
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 4 }}>
                        {product.productTitle}
                      </div>
                      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>{product.productDesc}</div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#4F46E5", marginBottom: 6 }}>
                        ₹{product.productPrice}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                        <span style={{ fontSize: 11, background: "#EEF2FF", color: "#4338CA", padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>
                          {product.category}
                        </span>
                        <span style={{ fontSize: 11, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>
                          {product.brand}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleEdit(product)}
                          style={{
                            flex: 1,
                            padding: "7px 0",
                            background: "#FEF3C7",
                            color: "#92400E",
                            border: "none",
                            borderRadius: 7,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          style={{
                            flex: 1,
                            padding: "7px 0",
                            background: "#FEE2E2",
                            color: "#991B1B",
                            border: "none",
                            borderRadius: 7,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && (
          <>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="🔍 Search by Order ID (exact match)"
              style={{ ...inputStyle, marginBottom: 20, background: "#fff" }}
            />

            {loading ? (
              <div style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9CA3AF", padding: 40, background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB" }}>
                No orders found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {orders.map((order) => (
                  <div
                    key={order._id}
                    style={{
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: 12,
                      padding: "18px 20px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>Order ID</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>{order._id}</div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>Customer</div>
                        <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          {order.userId?.name} <span style={{ color: "#6B7280" }}>({order.userId?.email})</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>Date</div>
                        <div style={{ fontSize: 13, color: "#374151" }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>Total</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4F46E5" }}>₹{order.totalPrice}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>Address</div>
                        <div style={{ fontSize: 13, color: "#374151" }}>{order.address}</div>
                      </div>
                    </div>

                    {/* Items */}
                    <div
                      style={{
                        background: "#F9FAFB",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 14,
                      }}
                    >
                      {order.items.map((item) => (
                        <div
                          key={item._id}
                          style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151", padding: "3px 0" }}
                        >
                          <span>{item.productTitle} <span style={{ color: "#9CA3AF" }}>×{item.quantity}</span></span>
                          <span style={{ fontWeight: 600 }}>₹{item.productPrice * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status Change */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Update Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                        style={{
                          padding: "6px 10px",
                          border: "1px solid #D1D5DB",
                          borderRadius: 7,
                          fontSize: 13,
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        {["Pending", "Processing", "Shipped", "Delivered"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid #D1D5DB",
                  background: currentPage === 1 ? "#F3F4F6" : "#fff",
                  color: currentPage === 1 ? "#9CA3AF" : "#374151",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: 14, color: "#6B7280" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid #D1D5DB",
                  background: currentPage === totalPages ? "#F3F4F6" : "#fff",
                  color: currentPage === totalPages ? "#9CA3AF" : "#374151",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;