// Utility to map product IDs to names for manufacturer dashboard
import { productAPI } from '../../../services/api';

export const fetchProductMap = async () => {
  try {
    const response = await productAPI.getManufacturerProducts();
    if (Array.isArray(response.data)) {
      const map = {};
      response.data.forEach(p => { map[p.id] = p.name; });
      return map;
    } else if (Array.isArray(response.data.products)) {
      const map = {};
      response.data.products.forEach(p => { map[p.id] = p.name; });
      return map;
    }
    return {};
  } catch (err) {
    return {};
  }
};
