import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom"; 
import Sidebar from "./sidebar";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope, faUserGear } from '@fortawesome/free-solid-svg-icons';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from "react-router-dom";

import { FaBox, FaCheck, FaFileAlt, FaUser } from "react-icons/fa";
import { FaFacebook, FaEnvelope, FaGithub } from "react-icons/fa";

import Header from "./header";
import '../style/home.css'; 

const API_URL = process.env.REACT_APP_API_URL;

function Home() {
  // State to store dashboard data
  
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    listedFoundItems: 0,
    totalClaims: 0,
    totalLostReports: 0,
    totalRetrievalRequests: 0,
  });
  const [complaintsData, setComplaintsData] = useState([]);
  const [foundItemsData, setFoundItemsData] = useState([]); // State for found items data
  const [servicesVisible, setServicesVisible] = useState(false);
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Check cache first
        const cachedData = localStorage.getItem("dashboardData");
        if (cachedData) {
          setDashboardData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
  
        // Fetch fresh data if cache is empty
        const [itemsResponse, complaintsResponse, retrievalResponse] = await Promise.all([
          axios.get(`${API_URL}/items`),
          axios.get(`${API_URL}/complaints`),
          axios.get(`${API_URL}/retrieval-requests`)
        ]);
  
        const foundItems = itemsResponse.data;
        const lostReports = complaintsResponse.data;
        const retrievalRequests = retrievalResponse.data;
  
        const newData = {
          listedFoundItems: foundItems.length,
 
          totalLostReports: lostReports.length,
          totalRetrievalRequests: retrievalRequests.length,
        };
  
        setDashboardData(newData);
        setComplaintsData(lostReports);
        setFoundItemsData(foundItems);
  
        // Cache the data
        localStorage.setItem("dashboardData", JSON.stringify(newData));
  
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
  
    fetchDashboardData();
  }, []);
  
  useEffect(() => {
    const serviceSection = document.querySelector(".services-section");
    const serviceCards = document.querySelectorAll(".service-card");
    const devCards = document.querySelectorAll(".developer-card");
        const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            serviceCards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add("slide-in");
              }, index * 200); // Delay each card animation
            });
          } else {
            // Reset animation when scrolled away
            serviceCards.forEach((card) => {
              card.classList.remove("slide-in");
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    if (serviceSection) observer.observe(serviceSection);

    return () => {
      observer.disconnect(); // Clean up when component unmounts
    };
  }, []);
  useEffect(() => {
    let isScrolling = false;
    const sections = document.querySelectorAll(".section");

    const scrollToSection = (index) => {
        if (index < 1 || index >= sections.length) return;
        isScrolling = true;

        sections[index].scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        setTimeout(() => {
            isScrolling = false;
        }, 800); // Increased timeout for smooth transitions
    };

    const handleScroll = (event) => {
        if (isScrolling) return;

        const scrollPosition = window.scrollY + window.innerHeight / 4;
        let currentSection = 1;

        for (let i = 1; i < sections.length; i++) {
            if (sections[i].offsetTop > scrollPosition) {
                break;
            }
            currentSection = i;
        }

        if (event.deltaY > 0) {
            scrollToSection(currentSection + 1);
        } else {
            scrollToSection(currentSection - 1);
        }
    };

    window.addEventListener("wheel", handleScroll);
    return () => window.removeEventListener("wheel", handleScroll);
}, []);

useEffect(() => {
  const sections = document.querySelectorAll(".services-section, .developer-team-section, .stat-section");
  const cardsMap = {
    "services-section": document.querySelectorAll(".service-card"),
    "developer-team-section": document.querySelectorAll(".developer-card"),
    "stat-section": document.querySelectorAll(".stat-item"),
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const targetCards = cardsMap[entry.target.classList[0]] || [];

        if (entry.isIntersecting) {
          targetCards.forEach((card, index) => {
            setTimeout(() => {
              card.classList.add("slide-in");
            }, index * 200);
          });
        } else {
          targetCards.forEach((card) => card.classList.remove("slide-in"));
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach((section) => observer.observe(section));

  // **Trigger animation on page load**
  Object.values(cardsMap).forEach((cards) => {
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add("slide-in");
      }, index * 200);
    });
  });

  return () => observer.disconnect(); // Cleanup
}, []);


  const getUserType = () => {
    const token = localStorage.getItem("token"); // Replace with your token storage method
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        return decodedToken.usertype; // Assuming 'usertype' is in the token
      } catch (err) {
        console.error("Invalid token:", err);
        return null;
      }
    }
    return null;
  };
  const navigate = useNavigate();
  const usertype = getUserType();

  return (
    <>{loading && (
      <div className="loading-overlay">
        <img src="/loadinggif.gif" alt="Loading..." className="loading-gif" />
      </div>
    )}
    <div className="home-container">
      <Sidebar />
      <Header />

      <div className="main-content">
        {/* Content Section */}
        <div className="cont section">
          <h1>Lost Something? <br /></h1><h2>Don't worry, we've got you covered!</h2>
          <p>
          MSU IIT Security and Investigation Division's Lost and Found system makes it easier than ever to report and recover lost items. 
  If you’ve misplaced or lost something, simply upload the details — we’ll handle the rest. 
  Let us help you reconnect with what’s yours! </p>
  {usertype === null || usertype === "" ? (
    <>
          <NavLink to="/userComplaints">
            <button className="get-qr-button">File Complaint Now</button>
          </NavLink>
           </>
          ) : usertype !== "admin"&&(
            <>
          <NavLink to="/userComplaints">
            <button className="get-qr-button">File Complaint Now</button>
          </NavLink>
          </>
          )}
          {usertype === "admin" && (
             <>
             <NavLink to="/Complaints">
               <button className="get-qr-button">File Complaint Now</button>
             </NavLink>
             </>
          )}
          <div className='divider'></div>
        </div>

        {/* Statistics Section */}
        <div className="statistics section">
          <div className="stat-item">
            <h2>{dashboardData.listedFoundItems}</h2>
            <p>Listed Found Items</p>
          </div>
          <div className="stat-item">
            <h2>{dashboardData.totalClaims}</h2>
            <p>Total Claims</p>
          </div>  
          <div className="stat-item">
            <h2>{dashboardData.totalLostReports}</h2>
            <p>Total Lost Reports</p>
          </div>
        </div>
      </div>

<div className="maincontent2">
  <div className="lost-found-container">
    <div className="gif-section">
      <img src="find.gif" alt="Lost and Found GIF" className="gif-icon" />
    </div>
    <div className="text-section">
      <h2 className="section-title">Lost & Found</h2>
      <p className="section-description">
        Misplaced something? Found a lost item? Our Lost and Found system helps you report or recover items with ease. Just upload details, and let us handle the rest!
      </p>
    </div>
  </div>
</div>
      {/* Services Section */}
      <div className="services-section section">
        <h2 className="services1"></h2>
        <div className="services-grid">
        <div className={`service-card ${servicesVisible ? "slide-in" : ""}`}>
            <h3>Mission</h3>
            <p>To safeguard the lives of all persons and properties in the campus by providing sound security measures and policies which are instinctive under all circumstances.</p>
            <div className='bottom'>
              <img src="pin.png" alt="miss" className="pin" />
              <p>MSU-IIT SECURITY AND INVESTIGATION DIVISION</p>
            </div>
          </div>
          <div className={`service-card ${servicesVisible ? "slide-in" : ""}`}>
            <h3>Mandate</h3>
            <p>A responsive division actively promoting a culture of peace and order, safeguarding Institute physical assets and infrastructures, and ensuring protective services to the constituents of the Institute and its immediate environs.</p>
            <div className='bottom'>
              <img src="pin.png" alt="miss" className="pin" />
              <p>MSU-IIT SECURITY AND INVESTIGATION DIVISION</p>
            </div>
          </div>
        </div>
      </div>

     {/* <div className="developer-team-section">
        <h2>Meet Our Developer Team</h2>
        <div className="developer-grid">
          <div className="developer-card">
            <img src="po.jpg" alt="Paul Gary L. Oca" className="developer-img" />
            <h3>Paul Gary L. Oca</h3>
            <h4>BS Information Technology</h4>
            
            <p>Back-End Developer</p>
            <div className="social-icons">
              <a href="mailto:paul@example.com">
                <FaEnvelope size={25} />
              </a>
              <a href="https://facebook.com/paul">
                <FaFacebook size={25} />
              </a>
              <a href="https://github.com/paul">
                <FaGithub size={25} />
              </a>
            </div>
          </div>

          <div className="developer-card">
            <img src="mo.jpg" alt="Paul Gary L. Oca" className="developer-img" />
            <h3>Christian Albert B. Muaña</h3>
            <h4>BS Information Technology</h4>
                        <p>Front-End Developer</p>
            <div className="social-icons">
              <a href="mailto:paul@example.com">
                <FaEnvelope size={25} />
              </a>
              <a href="https://facebook.com/paul">
                <FaFacebook size={25} />
              </a>
              <a href="https://github.com/paul">
                <FaGithub size={25} />
              </a>
            </div>
          </div>

          <div className="developer-card">
            <img src="de.jpg" alt="Paul Gary L. Oca" className="developer-img" />
            <h3>Jean Dhea Mae Ampong</h3>
            <h4>BS Information Technology</h4>

            <p>Front-End Developer</p>
            <div className="social-icons">
              <a href="mailto:paul@example.com">
                <FaEnvelope size={25} />
              </a>
              <a href="https://facebook.com/paul">
                <FaFacebook size={25} />
              </a>
              <a href="https://github.com/paul">
                <FaGithub size={25} />
              </a>
            </div>
          </div>
        </div>
      </div>  */}
      
      {/* footer */}
      <footer className="site-footer">
        <div className="footer-row">
          <ul className="contact-list">

            <li>
              <FontAwesomeIcon icon={faPhone} className="footer-icon" />
              +(63) 221-4062 
            </li>
            <li>
              <FontAwesomeIcon icon={faEnvelope} className="footer-icon" />
              sid@g.msuiit.edu.ph
            </li>
            <li>
              <FontAwesomeIcon icon={faFacebook} className="footer-icon" />
              <a href="https://www.facebook.com/profile.php?id=100088475913475" target="_blank" rel="noopener noreferrer">
                @MSUIIT Security and Investigation Division
              </a>
            </li>
          </ul>

        </div>
      </footer>

    


 

    </div>

    </>
      );

}

export default Home;
