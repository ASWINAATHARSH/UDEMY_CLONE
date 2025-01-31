const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection with proper error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('MongoDB Connected Successfully!');
    console.log('Connected to database:', conn.connection.name);
    console.log('Host:', conn.connection.host);
    console.log('Port:', conn.connection.port);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Define User Schema with proper validation
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  progress: {
    type: Object,
    default: {
      currentLevel: 1,
      completedLessons: [],
      lastAccessed: new Date()
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Define Cart Schema
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  items: [{
    courseId: {
      type: String,
      required: [true, 'Course ID is required']
    },
    title: {
      type: String,
      required: [true, 'Course title is required']
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price cannot be negative']
    },
    imgSrc: {
      type: String,
      required: [true, 'Course image is required']
    }
  }]
}, {
  timestamps: true // This will add createdAt and updatedAt fields automatically
});

cartSchema.index({ userId: 1 });

const Cart = mongoose.model('Cart', cartSchema);

const checkoutSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  items: [{
    courseId: { type: String, required: true },
    title: { type: String, required: true },
    imgSrc: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Checkout = mongoose.model('Checkout', checkoutSchema);

app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration request received:', { ...req.body, password: '[HIDDEN]' });
    const { username, email, password } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      progress: {
        currentLevel: 1,
        completedLessons: [],
        lastAccessed: new Date()
      }
    });

    // Save user to database
    const savedUser = await user.save();
    console.log('User registered successfully:', { id: savedUser._id, email: savedUser.email });

    // Create empty cart for new user
    const cart = new Cart({
      userId: savedUser._id,
      items: []
    });
    await cart.save();
    console.log('Cart created for new user:', savedUser._id);

    res.status(201).json({
      message: 'Registration successful',
      userId: savedUser._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }

    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId: user._id });
    console.log('User logged in successfully:', email);

    const userData = {
      _id: user._id,
      email: user.email,
      username: user.username,
      cart: cart ? cart.items : []
    };

    res.json(userData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/users/:id/progress', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { progress: req.body.progress } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      // Create new cart if it doesn't exist
      cart = new Cart({
        userId,
        items: []
      });
      await cart.save();
    }

    res.json({ items: cart.items });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/api/cart', async (req, res) => {
  try {
    const { userId, items } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    // Validate each item in the cart
    for (const item of items) {
      if (!item.courseId || !item.title || typeof item.price !== 'number') {
        return res.status(400).json({ 
          error: 'Each item must have courseId, title, and price' 
        });
      }
    }

    // Find cart or create new one
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    cart.items = items;
    await cart.save();
    console.log('Cart updated successfully for user:', userId);

    res.json({ message: 'Cart updated successfully', items: cart.items });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

app.post('/api/cart/add', async (req, res) => {
  try {
    const { userId, courseId, title, price, imgSrc } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!courseId || !title || typeof price !== 'number') {
      return res.status(400).json({ 
        error: 'Course ID, title, and price are required' 
      });
    }

    // Find cart or create new one
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if course already exists in cart
    const courseExists = cart.items.some(item => item.courseId === courseId);
    if (courseExists) {
      return res.status(400).json({ error: 'Course already in cart' });
    }

    // Add new course to cart
    cart.items.push({
      courseId,
      title,
      price,
      imgSrc
    });

    await cart.save();
    console.log('Course added to cart:', { userId, courseId, title });

    res.json({ 
      message: 'Course added to cart successfully',
      items: cart.items 
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add course to cart' });
  }
});

app.delete('/api/cart/:userId/items/:courseId', async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId provided' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.courseId !== courseId);
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error('Delete cart item error:', error);
    res.status(500).json({ 
      error: 'Failed to delete cart item',
      details: error.message 
    });
  }
});

app.delete('/api/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId provided' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      error: 'Failed to clear cart',
      details: error.message 
    });
  }
});

app.post('/api/checkout', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId provided' });
    }

    // Verify MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection is not ready');
    }

    // Get the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((sum, item) => sum + (item.price || 0), 0);

    // Create checkout record
    const checkout = new Checkout({
      userId,
      items: cart.items,
      totalAmount,
      status: 'completed',
      purchaseDate: new Date()
    });

    // Save checkout record
    const savedCheckout = await checkout.save();
    if (!savedCheckout) {
      throw new Error('Failed to save checkout record');
    }

    // Clear the cart after successful checkout
    cart.items = [];
    await cart.save();

    console.log('Checkout successful:', {
      userId,
      checkoutId: savedCheckout._id,
      totalAmount
    });

    res.status(200).json({
      message: 'Checkout successful',
      checkout: savedCheckout,
      totalAmount
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      error: 'Failed to process checkout',
      details: error.message
    });
  }
});

app.get('/api/checkout/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId provided' });
    }

    const checkouts = await Checkout.find({ userId })
      .sort({ purchaseDate: -1 }); // Most recent first

    res.json(checkouts);
  } catch (error) {
    console.error('Error fetching checkout history:', error);
    res.status(500).json({
      error: 'Failed to fetch checkout history',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
});
