import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
const backendURL = import.meta.env.VITE_BACKEND_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    productTitle: "",
    productDesc: "",
    productPrice: "",
    productImage: "",
    category: "",
    brand: "",
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

 useEffect(() => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token) {
    toast.error("Please login to access the dashboard");
    navigate("/admin/login");
    return;
  }

  if (!user || user.role !== "admin") {
    toast.error("Access denied: Admins only");
    navigate("/admin/login");
  }
}, [navigate]);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/products`);
        setProducts(res.data.data.products || []);
        setError("");
      } catch (err) {
        setProducts([]);
        if (err.response && err.response.data) {
          setError(err.response.data.message || "Failed to fetch products");
          toast.error(err.response.data.message || "Failed to fetch products");
        } else {
          setError("Network error or server not responding");
          toast.error("Network error or server not responding");
        }
      }
    };
    fetchProducts();
  }, []);

  // Fetch all orders (admin) with pagination and search
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/orders/admin`, {
        params: { page: currentPage, limit: 5, search: searchQuery },
        withCredentials: true,
      });
      setOrders(res.data.data.orders || []);
      setTotalPages(res.data.data.totalPages || 1);
      setError("");
    } catch (err) {
      setOrders([]);
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Failed to fetch orders");
        toast.error(err.response.data.message || "Failed to fetch orders");
        if (err.response.status === 403) {
          navigate("/admin/login");
        }
      } else {
        setError("Network error or server not responding");
        toast.error("Network error or server not responding. Check if server is running.");
      }
    }
  };

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [currentPage, searchQuery, activeTab, navigate]);

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add or Update Product
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await axios.put(
          `${backendURL}/api/products/${editingProduct._id}`,
          formData,
          { withCredentials: true }
        );
        setProducts(products.map((p) => (p._id === editingProduct._id ? res.data.data : p)));
        setEditingProduct(null);
      } else {
        const res = await axios.post(`${backendURL}/api/products`, formData, {
          withCredentials: true,
        });
        setProducts([...products, res.data.data]);
      }
      setFormData({
        productTitle: "",
        productDesc: "",
        productPrice: "",
        productImage: "",
        category: "",
        brand: "",
      });
      setError("");
      toast.success(editingProduct ? "Product updated successfully" : "Product added successfully");
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Failed to save product");
        toast.error(err.response.data.message || "Failed to save product");
      } else {
        setError("Network error or server not responding");
        toast.error("Network error or server not responding");
      }
    }
  };

  // Edit Product
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
  };

  // Delete Product
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${backendURL}/api/products/${id}`, {
          withCredentials: true,
        });
        setProducts(products.filter((p) => p._id !== id));
        setError("");
        toast.success("Product deleted successfully");
      } catch (err) {
        if (err.response && err.response.data) {
          setError(err.response.data.message || "Failed to delete product");
          toast.error(err.response.data.message || "Failed to delete product");
        } else {
          setError("Network error or server not responding");
          toast.error("Network error or server not responding");
        }
      }
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const res = await axios.put(
        `${backendURL}/api/orders/${orderId}`,
        { status },
        { withCredentials: true }
      );
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: res.data.data.status } : order
        )
      );
      setError("");
      toast.success("Order status updated successfully", { autoClose: 3000 });
      fetchOrders(); // Re-fetch to sync with backend
    } catch (err) {
      console.error("Update status error:", err);
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Failed to update order status");
        toast.error(err.response.data.message || "Failed to update order status");
      } else {
        setError("Network error or server not responding");
        toast.error("Network error or server not responding. Check if server is running.");
      }
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-600 text-white p-4">
        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
        <ul>
          <li className="mb-4">
            <button
              onClick={() => setActiveTab("products")}
              className={`w-full text-left p-2 rounded ${activeTab === "products" ? "bg-blue-700" : "hover:bg-blue-700"}`}
            >
              Manage Products
            </button>
          </li>
          <li className="mb-4">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full text-left p-2 rounded ${activeTab === "orders" ? "bg-blue-700" : "hover:bg-blue-700"}`}
            >
              Manage Orders
            </button>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="w-full text-left p-2 rounded hover:bg-blue-700"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Profile Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-bold">Admin Profile</h3>
          <p>Welcome back, Admin!</p>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Manage Products Tab */}
        {activeTab === "products" && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">
              {editingProduct ? "Update Product" : "Add New Product"}
            </h2>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Title</label>
                  <input
                    type="text"
                    name="productTitle"
                    value={formData.productTitle}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    name="productDesc"
                    value={formData.productDesc}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    name="productPrice"
                    value={formData.productPrice}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="text"
                    name="productImage"
                    value={formData.productImage}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                {editingProduct ? "Update Product" : "Add Product"}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                      productTitle: "",
                      productDesc: "",
                      productPrice: "",
                      productImage: "",
                      category: "",
                      brand: "",
                    });
                  }}
                  className="mt-2 w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                >
                  Cancel Edit
                </button>
              )}
            </form>

            <h2 className="text-2xl font-bold mb-6 text-center">Manage Products</h2>
            {products.length === 0 ? (
              <p className="text-center text-gray-600">No products available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product._id} className="border rounded-lg p-4 shadow-md">
                    <img
                      src={product.productImage}
                      alt={product.productTitle}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                    <h3 className="text-lg font-semibold">{product.productTitle}</h3>
                    <p className="text-gray-600">{product.productDesc}</p>
                    <p className="text-gray-800 font-bold mt-2">₹{product.productPrice}</p>
                    <p className="text-sm text-gray-500">Category: {product.category}</p>
                    <p className="text-sm text-gray-500">Brand: {product.brand}</p>
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Manage Orders Tab */}
        {activeTab === "orders" && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Manage Orders</h2>
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by order ID (exact match)"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {orders.length === 0 ? (
              <p className="text-center text-gray-600">No orders available</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="border rounded-lg p-4 shadow-md">
                    <p className="text-sm text-gray-500">Order ID: {order._id}</p>
                    <p className="text-sm text-gray-500">
                      User: {order.userId?.name} ({order.userId?.email})
                    </p>
                    <p className="text-sm text-gray-500">
                      Placed on: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">Total: ₹{order.totalPrice}</p>
                    <p className="text-sm text-gray-500">Address: {order.address}</p>
                    <div className="mt-2">
                      <h4 className="text-lg font-semibold">Items:</h4>
                      {order.items.map((item) => (
                        <div key={item._id} className="flex justify-between">
                          <p>{item.productTitle} (x{item.quantity})</p>
                          <p>₹{item.productPrice * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                      <label className="text-sm font-medium">Status:</label>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Pagination Controls */}
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:bg-gray-200"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:bg-gray-200"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;