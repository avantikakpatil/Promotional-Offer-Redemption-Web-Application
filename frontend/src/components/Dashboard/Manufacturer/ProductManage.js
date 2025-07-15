import React, { useEffect, useState } from 'react';
import { productAPI } from '../../../services/api';

const initialForm = {
  name: '',
  description: '',
  category: '',
  sku: '',
  brand: '',
  basePrice: '',
  resellerPrice: '',
  retailPrice: '',
  pointsPerUnit: '',
};

const ProductManage = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getManufacturerProducts();
      setProducts(res.data);
    } catch (err) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      sku: product.sku || '',
      brand: product.brand || '',
      basePrice: product.basePrice,
      resellerPrice: product.resellerPrice,
      retailPrice: product.retailPrice,
      pointsPerUnit: product.pointsPerUnit,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Build payload with correct types
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        sku: form.sku,
        brand: form.brand,
        basePrice: parseFloat(form.basePrice),
        resellerPrice: parseFloat(form.resellerPrice),
        retailPrice: parseFloat(form.retailPrice),
        pointsPerUnit: form.pointsPerUnit ? parseInt(form.pointsPerUnit) : 0,
      };
      let res;
      if (editingId) {
        res = await productAPI.updateProduct(editingId, payload);
        if (res.status === 204) {
          setEditingId(null);
          setForm(initialForm);
          fetchProducts();
          setError('');
          alert('Product updated successfully!');
        } else {
          throw new Error('Unexpected response from server');
        }
      } else {
        res = await productAPI.createProduct(payload);
        if (res.status === 201) {
          setForm(initialForm);
          fetchProducts();
          setError('');
          alert('Product added successfully!');
        } else {
          throw new Error('Unexpected response from server');
        }
      }
    } catch (err) {
      // Try to show backend error message
      let msg = 'Error saving product.';
      if (err.response && err.response.data) {
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          msg = err.response.data.errors.join(', ');
        } else if (err.response.data.message) {
          msg = err.response.data.message;
        }
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Products</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input name="name" value={form.name} onChange={handleInputChange} required className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <input name="category" value={form.category} onChange={handleInputChange} required className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input name="sku" value={form.sku} onChange={handleInputChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <input name="brand" value={form.brand} onChange={handleInputChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Base Price *</label>
            <input name="basePrice" type="number" min="0" step="0.01" value={form.basePrice} onChange={handleInputChange} required className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reseller Price *</label>
            <input name="resellerPrice" type="number" min="0" step="0.01" value={form.resellerPrice} onChange={handleInputChange} required className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Retail Price *</label>
            <input name="retailPrice" type="number" min="0" step="0.01" value={form.retailPrice} onChange={handleInputChange} required className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Points Per Unit *</label>
            <input name="pointsPerUnit" type="number" min="0" value={form.pointsPerUnit} onChange={handleInputChange} required className="w-full border rounded px-2 py-1" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleInputChange} className="w-full border rounded px-2 py-1" />
          </div>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-2 mt-2">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {editingId ? 'Update Product' : 'Add Product'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="px-6 py-2 bg-gray-300 text-gray-800 rounded">Cancel</button>
          )}
        </div>
      </form>
      <h2 className="text-xl font-semibold mb-4">Your Products</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full text-sm border">
          <thead>
            <tr>
              <th className="px-2 py-1 border">Name</th>
              <th className="px-2 py-1 border">Category</th>
              <th className="px-2 py-1 border">SKU</th>
              <th className="px-2 py-1 border">Brand</th>
              <th className="px-2 py-1 border">Base Price</th>
              <th className="px-2 py-1 border">Reseller Price</th>
              <th className="px-2 py-1 border">Retail Price</th>
              <th className="px-2 py-1 border">Points/Unit</th>
              <th className="px-2 py-1 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-2 py-1 border">{product.name}</td>
                <td className="px-2 py-1 border">{product.category}</td>
                <td className="px-2 py-1 border">{product.sku}</td>
                <td className="px-2 py-1 border">{product.brand}</td>
                <td className="px-2 py-1 border">{product.basePrice}</td>
                <td className="px-2 py-1 border">{product.resellerPrice}</td>
                <td className="px-2 py-1 border">{product.retailPrice}</td>
                <td className="px-2 py-1 border">{product.pointsPerUnit}</td>
                <td className="px-2 py-1 border">
                  <button onClick={() => handleEdit(product)} className="px-3 py-1 bg-yellow-400 text-white rounded mr-2">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductManage; 