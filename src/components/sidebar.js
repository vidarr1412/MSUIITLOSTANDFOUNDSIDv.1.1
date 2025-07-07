import React, { useState, useEffect } from "react";
import { VscReport } from "react-icons/vsc";
import { FaClipboardList } from "react-icons/fa6";
import { IoMdAnalytics } from "react-icons/io";
import { TbMessageReportFilled } from "react-icons/tb";
import { NavLink } from "react-router-dom"; // Use NavLink for active class
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from "react-router-dom";

import { FaHome, FaBox, FaQrcode, FaFileAlt,  FaUserCheck, FaUser, FaBoxOpen, FaUserPlus, FaSignOutAlt, FaExclamationCircle, FaChartLine, FaBars,FaClipboard, FaHandHoldingHeart, FaTasks	 } from "react-icons/fa";
import "../style/sidebar.css"; // Optional: for styling the sidebar
//import Image from 'next/image'
const Sidebar = () => {

  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle("sidebar-open", !isOpen);
  };

  const getusertype = () => {
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
  const usertype = getusertype();
  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("token"); // Clear only the token
    window.location.href = "/";

};

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.scrollTo(0, 0); // Ensure the page resets to the top
        window.location.reload(); // Force refresh to fix layout issues
      }
    };
  
    window.addEventListener("pageshow", handlePageShow);
  
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);


  return (
    <>
                  {/* Menu Toggle Button */}
                  <button className="menu-toggle" onClick={toggleSidebar}>
        <FaBars />
      </button>

      <div className={`sidebar ${isOpen ? "open" : ""}`}>

        <img src="log.png" alt="FIRI" className="logo" />
        <nav className="nav-menu">
        {usertype === null || usertype === "" ? (
            <>
              <NavLink to="/" >
                <FaHome className="nav-icon" /> Home
              </NavLink>
              <NavLink to="/bulletinboard" >
                <FaClipboard className="nav-icon" /> Bulletin
              </NavLink>
              <NavLink to="/login"  >
                <FaUserPlus className="nav-icon" /> Sign Up
              </NavLink>
            </>
          ) : usertype !== "admin" && (
            <>
              <NavLink to="/" >
                <FaHome className="nav-icon" /> Home
              </NavLink>
              <NavLink to="/userComplaints" >
                <FaFileAlt className="nav-icon" /> File Report
              </NavLink>
              <NavLink to="/bulletinboard"  >
                <FaClipboard className="nav-icon" /> Bulletin
              </NavLink>
              <NavLink to="/retrievalRequests" >
                <IoMdAnalytics   className="nav-icon" /> Retrieval Status
              </NavLink>
              <NavLink to="/profile" >
              <FaHome className="nav-icon" /> Profile
            </NavLink>
            <div className="logout">
              <button onClick={handleLogout}> 
              <FaSignOutAlt className="nav-icon" /> Log Out {/* dhea: <FaSignOutAlt  /> Log Out*/}
              </button>
              </div>

            </>
          )}
          {usertype === "admin" && (
            <>
              <NavLink to="/dashboard" >
                <FaChartLine className="nav-icon" /> Dashboard
              </NavLink>
              <NavLink to="/Complaints">
                <FaExclamationCircle className="nav-icon" /> Lost Complaint
              </NavLink>
              <NavLink to="/additem" >
                <FaBoxOpen className="nav-icon" /> Found Items
              </NavLink>
             <NavLink to="/scan_item" >
                <FaQrcode className="nav-icon" /> Scan QR
              </NavLink>
              
              {/* <NavLink to="/donation"  >
                <FaHandHoldingHeart className="nav-icon" /> Donation
              </NavLink> */}
            
              <NavLink to="/manaRequests"  >
                <FaTasks className="nav-icon" /> Manage Request
              </NavLink>
              <NavLink to="/profile"  >
              <FaHome className="nav-icon" /> Profile
            </NavLink>
            <div className="logout">
              <button onClick={handleLogout}>
              <FaSignOutAlt className="nav-icon" /> Log Out {/* dhea: <FaSignOutAlt  /> Log Out*/}

              </button>
              </div>
            </>
            
          )}
      
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
