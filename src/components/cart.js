import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import config from '../config';
import './main.css';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user._id) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/cart/${user._id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch cart items');
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data.items)) {
        throw new Error('Invalid cart data received');
      }

      setCartItems(data.items);
      localStorage.setItem('cartItems', JSON.stringify(data.items));
    } catch (error) {
      console.error('Error loading cart:', error);
      setError(error.message || 'Failed to load cart items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (index) => {
    try {
      setError(null);
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user._id) {
        navigate('/login');
        return;
      }

      const newItems = cartItems.filter((_, i) => i !== index);
      
      const response = await fetch(`${config.API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          items: newItems
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update cart');
      }

      setCartItems(newItems);
      localStorage.setItem('cartItems', JSON.stringify(newItems));
    } catch (error) {
      console.error('Error removing item:', error);
      setError(error.message || 'Failed to remove item. Please try again.');
    }
  };

  const handleCheckout = async () => {
    try {
      setError(null);
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        navigate('/login');
        return;
      }

      if (cartItems.length === 0) {
        setError('Your cart is empty');
        return;
      }

      // Calculate total amount
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

      // Confirm checkout
      if (!window.confirm(`Proceed with checkout? Total amount: $${totalAmount.toFixed(2)}`)) {
        return;
      }

      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Checkout failed');
      }

      // Clear local cart
      setCartItems([]);
      localStorage.setItem('cartItems', JSON.stringify([]));

      // Show success message
      alert(`Checkout successful! Total amount paid: $${data.totalAmount.toFixed(2)}`);
      
      // Reload cart data to ensure sync with server
      await loadCart();
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during checkout:', error);
      setError(error.message || 'Failed to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCourses = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          <Link className="navbar-brand logo" to="/dashboard">
            <i className="bi bi-mortarboard-fill"></i> Udemy-Clone
          </Link>
          <button onClick={handleBackToCourses} className="btn btn-outline-light">
            <i className="bi bi-arrow-left"></i> Back to Courses
          </button>
        </div>
      </nav>
      
      <div className="content">
        <div className="container mt-4">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">Your Cart</h2>
            </div>
            <div className="card-body">
              {cartItems.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-cart-x display-1"></i>
                  <p className="mt-3">Your cart is empty.</p>
                  <button 
                    className="btn btn-primary mt-3"
                    onClick={handleBackToCourses}
                  >
                    Browse Courses
                  </button>
                </div>
              ) : (
                <>
                  <div className="list-group">
                    {cartItems.map((item, index) => (
                      <div 
                        key={index}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      >
                        <div className="d-flex align-items-center">
                          <img
                            src={item.imgSrc || 'placeholder.jpg'}
                            alt={item.title}
                            className="me-3"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                          <div>
                            <h5 className="mb-1">{item.title}</h5>
                            {item.price && <p className="mb-1 text-muted">${item.price}</p>}
                          </div>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div>
                      <button 
                        className="btn btn-secondary me-2"
                        onClick={handleBackToCourses}
                      >
                        Continue Shopping
                      </button>
                    </div>
                    <div>
                      <p className="mb-2 text-end">
                        Total: ${cartItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                      </p>
                      <button 
                        className="btn btn-primary"
                        onClick={handleCheckout}
                        disabled={cartItems.length === 0}
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;