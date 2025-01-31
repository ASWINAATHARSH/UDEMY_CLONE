import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import config from '../config';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import cpImage from './../asserts/cp.png';
import pyImage from './../asserts/py.jpeg';
import jaImage from './../asserts/ja.jpeg';
import mernImage from './../asserts/MERN.webp';
import flImage from './../asserts/fl.jpeg';
import uImage from './../asserts/u.jpeg';

// Predefined course list with imported images
const popularCourses = [
  { id: 'cp001', imgSrc: cpImage, title: 'C Programming', price: 49.99 },
  { id: 'py001', imgSrc: pyImage, title: 'Python', price: 59.99 },
  { id: 'ja001', imgSrc: jaImage, title: 'Java', price: 54.99 }
];

const newCourses = [
  { id: 'mern001', imgSrc: mernImage, title: 'MERN Stack', price: 79.99 },
  { id: 'fl001', imgSrc: flImage, title: 'Flutter', price: 69.99 },
  { id: 'un001', imgSrc: uImage, title: 'Unity', price: 64.99 }
];

const Takecource = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showCourses, setShowCourses] = useState(false);
  const [loading, setLoading] = useState(true);

  // Combine popularCourses and newCourses
  const allCourses = [...popularCourses, ...newCourses];

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    // Filter courses based on the search term
    const results = allCourses.filter(course => 
      course.title.toLowerCase().includes(term.toLowerCase())
    );
    
    setFilteredCourses(results);
  };

  const handleAddToCart = async (course) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          courseId: course.id,
          title: course.title,
          price: course.price,
          imgSrc: course.imgSrc
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add course to cart');
      }

      // Update localStorage with new cart items
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      cartItems.push({
        courseId: course.id,
        title: course.title,
        price: course.price,
        imgSrc: course.imgSrc
      });
      localStorage.setItem('cartItems', JSON.stringify(cartItems));

      alert('Course added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.message || 'Failed to add course to cart. Please try again.');
    }
  };

  const handleShowCourses = () => {
    setShowCourses(true);
  };

  useEffect(() => {
    // Simulate loading courses
    setTimeout(() => {
      setCourses(allCourses);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6 offset-md-3">
          <div className="card">
            <div className="card-header">
              <h3>Take a Course</h3>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={handleShowCourses} className="btn btn-primary mb-3">
                    Show Courses
                  </button>
                  
                  {showCourses && (
                    <div>
                      {/* If search results exist, show search results */}
                      {searchTerm && filteredCourses.length > 0 ? (
                        <div className="row">
                          {filteredCourses.map((course, index) => (
                            <div key={index} className="col-md-4 mb-3">
                              <div className="card">
                                <img 
                                  src={course.imgSrc} 
                                  className="card-img-top" 
                                  alt={course.title} 
                                />
                                <div className="card-body">
                                  <h5 className="card-title">{course.title}</h5>
                                  <p className="card-text">${course.price}</p>
                                  <button 
                                    className="btn btn-primary"
                                    onClick={() => handleAddToCart(course)}
                                  >
                                    Add to cart
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // If no search results or no search term, show all courses
                        <div className="row">
                          {courses.map((course, index) => (
                            <div key={index} className="col-md-4 mb-3">
                              <div className="card">
                                <img 
                                  src={course.imgSrc} 
                                  className="card-img-top" 
                                  alt={course.title} 
                                />
                                <div className="card-body">
                                  <h5 className="card-title">{course.title}</h5>
                                  <p className="card-text">${course.price}</p>
                                  <button 
                                    className="btn btn-primary"
                                    onClick={() => handleAddToCart(course)}
                                  >
                                    Add to cart
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Takecource;
