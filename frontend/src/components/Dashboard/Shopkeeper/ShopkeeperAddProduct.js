import React, { useState, useEffect } from 'react';

const ShopkeeperAddProduct = () => {
  const [form, setForm] = useState({ name: '', brand: '', price: '', description: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/shopkeeper/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand,
          retailPrice: parseFloat(form.price),
          description: form.description,
          category: form.category
        })
      });
      if (response.ok) {
        setSuccess('Product added successfully!');
        setForm({ name: '', brand: '', price: '', description: '', category: '' });
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to add product.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Product Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Brand</label>
          <input
            type="text"
            name="brand"
            value={form.brand}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Price</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
            rows={3}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Category</label>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Product'}
        </button>
        {success && <div className="mt-2 text-green-600">{success}</div>}
        {error && <div className="mt-2 text-red-600">{error}</div>}
      </form>
    </div>
  );
};

export default ShopkeeperAddProduct; 