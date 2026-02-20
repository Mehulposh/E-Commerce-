import Product from '../models/productModel.js';
import { getCache, setCache, invalidateProductCache } from '../utils/Cache.js';

// GET /api/products
const getAllProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, search, page = 1, limit = 10 } = req.query;

    // Build cache key from query params
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    // Build query
    const query = { isActive: true };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    const result = {
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };

    await setCache(cacheKey, result, 300); // Cache for 5 minutes
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const cacheKey = `product:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ product: cached, fromCache: true });

    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await setCache(cacheKey, product);
    res.json({ product });
  } catch (err) {
    next(err);
  }
};

// POST /api/products  (admin only)
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      imageUrl,
      createdBy: req.user.id,
    });

    await invalidateProductCache();
    res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id  (admin only)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    await invalidateProductCache(req.params.id);
    res.json({ message: 'Product updated', product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id  (admin only - soft delete)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: 'Product not found' });

    await invalidateProductCache(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

export {
    deleteProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    createProduct,
}