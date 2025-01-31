import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './main.css';
import s5 from './../asserts/pexels-mareklevak-2265488.jpg';
import s6 from './../asserts/pexels-olly-840996.jpg';
import cpImage from './../asserts/cp.png';
import pyImage from './../asserts/py.jpeg';
import jaImage from './../asserts/ja.jpeg';
import mernImage from './../asserts/MERN.webp';
import flImage from './../asserts/fl.jpeg';
import uImage from './../asserts/u.jpeg';
const Navbar = ({ cartCount, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // const handleSearch = (e) => {
  //   e.preventDefault();
  //   onSearch(searchQuery);
  // };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg" style={{ backgroundColor: 'white' }}>
      <div className="container-fluid">
        <Link className="navbar-brand logo" to="/dashboard" style={{ color: 'black' }}>
          <i className="bi bi-mortarboard-fill"  style={{ color: 'black' }}></i> Udemy Clone
        </Link>
        <div className="form-control me-2">
          <Link to="/takecourse" className="nav-item nav-link" style={{color:'black'}}>
            Take a Course
          </Link>
        </div>

        <div className="d-flex align-items-center" >
          <Link to="/cart" style={{color:'black'}} className="btn btn-outline-light me-2">
            <i className="bi bi-cart" style={{ color: 'black' }}></i> Cart ({cartCount})
          </Link>
          <button onClick={handleLogout} className="btn btn-outline-light" style={{color:'black'}}>
            <i className="bi bi-box-arrow-right" style={{ color: 'black' }}></i> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const PromoCarousel = () => {
  return (
    <div id="promoCarousel" className="carousel slide" data-bs-ride="carousel">
      <div className="carousel-inner">
        <div className="carousel-item active">
          <img src={s5} className="d-block w-100" alt="Promo 1" />
        </div>
        <div className="carousel-item">
          <img src={s6} className="d-block w-100" alt="Promo 2" />
        </div>
      </div>
      <button className="carousel-control-prev" type="button" data-bs-target="#promoCarousel" data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button className="carousel-control-next" type="button" data-bs-target="#promoCarousel" data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
};

const CourseCard = ({ imgSrc, title, onAddToCart }) => {
  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100">
        <img src={imgSrc} className="card-img-top" alt={title} />
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{title}</h5>
          <button 
            className="btn btn-primary mt-auto" 
            onClick={() => onAddToCart({ imgSrc, title })}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, courses, onAddToCart }) => {
  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>
      <div className="row">
        {courses.map((course, index) => (
          <CourseCard 
            key={index} 
            imgSrc={course.imgSrc} 
            title={course.title} 
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

const Main = () => {
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const savedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(savedCartItems);
  }, []);

  const handleAddToCart = async (item) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        navigate('/login');
        return;
      }
      const courseForCart = {
        title: item.title,
        imgSrc: item.imgSrc
      };

      const newCartItems = [...cartItems, courseForCart];
      setCartItems(newCartItems);
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      const response = await fetch('http://localhost:5001/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          items: newCartItems
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update cart in database');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add course to cart. Please try again.');
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
  };

  const popularCourses = [
    { imgSrc: cpImage, title: 'C Programming' },
    { imgSrc: pyImage, title: 'Python' },
    { imgSrc: jaImage, title: 'Java' }
  ];

  const newCourses = [
    { imgSrc: mernImage, title: 'MERN Stack' },
    { imgSrc: flImage, title: 'Flutter' },
    { imgSrc: uImage, title: 'Unity' }
  ];

  const allCourses = [...popularCourses, ...newCourses];

  const filteredCourses = searchQuery 
    ? allCourses.filter(course => course.title.toLowerCase().includes(searchQuery))
    : allCourses;

  console.log('Filtered Courses:', filteredCourses);

  return (
    <div className="main-container">
      <Navbar cartCount={cartItems.length} onSearch={handleSearch} />
      <div className="content">
        {searchQuery ? (
          <div className="container mt-5">
            <div className="section">
              <h2 className="section-title">Search Results</h2>
              {filteredCourses.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-search display-1"></i>
                  <p className="mt-3">No courses found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="row">
                  {filteredCourses.map((course, index) => (
                    <CourseCard 
                      key={index}
                      imgSrc={course.imgSrc}
                      title={course.title}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <PromoCarousel />
            <div className="container mt-5">
              <Section 
                title="Popular Courses" 
                courses={popularCourses} 
                onAddToCart={handleAddToCart} 
              />
              <Section 
                title="New Courses" 
                courses={newCourses} 
                onAddToCart={handleAddToCart} 
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Main;
