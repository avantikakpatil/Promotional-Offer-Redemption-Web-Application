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
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const openAddModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setError('');
    setShowModal(true);
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
    setError('');
    setShowModal(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setError('');
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
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
          setShowModal(false);
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
          setShowModal(false);
          alert('Product added successfully!');
        } else {
          throw new Error('Unexpected response from server');
        }
      }
    } catch (err) {
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

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await productAPI.deleteProduct(id);
      setDeleteId(null);
      fetchProducts();
      alert('Product deleted successfully!');
    } catch (err) {
      alert('Failed to delete product.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Group and sort products by category
  const groupedProducts = Object.entries(
    products
      .slice()
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
      .reduce((acc, product) => {
        acc[product.category] = acc[product.category] || [];
        acc[product.category].push(product);
        return acc;
      }, {})
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Products</h1>
      <button
        onClick={openAddModal}
        className="mb-6 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
      >
        + Add Product
      </button>
      {loading ? (
        <div>Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-gray-500">No products found.</div>
      ) : (
        groupedProducts.map(([category, prods]) => (
          <div key={category} className="mb-10">
            <div className="bg-gray-100 px-3 py-2 rounded-t font-bold text-lg border border-b-0 border-gray-300">{category}</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-300 rounded-b shadow">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-1 border">Name</th>
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
                  {prods.map((product) => (
                    <tr key={product.id} className="even:bg-gray-50">
                      <td className="px-2 py-1 border font-medium">{product.name}</td>
                      <td className="px-2 py-1 border">{product.sku}</td>
                      <td className="px-2 py-1 border">{product.brand}</td>
                      <td className="px-2 py-1 border">₹{product.basePrice}</td>
                      <td className="px-2 py-1 border">₹{product.resellerPrice}</td>
                      <td className="px-2 py-1 border">₹{product.retailPrice}</td>
                      <td className="px-2 py-1 border">{product.pointsPerUnit}</td>
                      <td className="px-2 py-1 border flex gap-2 justify-center items-center">
                        <button
                          onClick={() => handleEdit(product)}
                          className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Modal for Add/Edit Product */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={handleCancelEdit}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-semibold mb-4">{editingId ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <button type="button" onClick={handleCancelEdit} className="px-6 py-2 bg-gray-300 text-gray-800 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm relative">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this product?</p>
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
                onClick={() => setDeleteId(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                onClick={() => handleDelete(deleteId)}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManage; 