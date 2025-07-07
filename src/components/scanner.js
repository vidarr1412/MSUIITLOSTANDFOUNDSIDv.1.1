
import { FaSearch, FaFilter } from 'react-icons/fa';
import Sidebar from "./sidebar";
// import '../style/scanner.css';
import axios from 'axios';
import ReactQrScanner from 'react-qr-scanner'; // Import the QR scanner
import emailjs from 'emailjs-com'; // Import EmailJS SDK
import React, { useState, useEffect, useRef } from 'react';
import { FaTable } from "react-icons/fa6";
import { IoGridOutline } from "react-icons/io5";
import { MdQrCodeScanner } from 'react-icons/md'; // QR scan icon
import { IoMdArrowDropdown } from "react-icons/io";
import { FaPlus } from "react-icons/fa6";
import CryptoJS from "crypto-js";
import '../style/Found.css';

import { storage } from "../firebase"; // Import Firebase storage
import Pagination from './pagination';
import { ref, uploadBytesResumable, uploadString, getDownloadURL } from "firebase/storage";
import Header from './header';
import Filter from '../filterered/foundFilt'; // Adjust the import path as necessary
import Modal from './image'; // Import the Modal component

import showAlert from '../utils/alert';


function ItemScanner() {
  const [facingMode, setFacingMode] = useState('environment'); // or 'user'

     const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(""); // State to hold the QR code data
  const [userDetails, setUserDetails] = useState({ email: '', firstName: '', lastName: '' }); // State to hold user details
  const [filterText, setFilterText] = useState('');
  const [requests, setRequests] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMore, setIsViewMore] = useState(false); // New state to track if modal is for viewing more details
  const itemsPerPage = 10;
  const [scanning, setScanning] = useState(true); // State to control scanner reset
  const accessToken = process.env.REACT_APP_ACCESS_TOKEN;
  const pageId = process.env.REACT_APP_pageId ;
 
  const API_URL = process.env.REACT_APP_API_URL;
  const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  const CRYPTO_SECRET = process.env.REACT_APP_CRYPTO_SECRET;

  const [filteredRequests, setFilteredRequests] = useState([]);
  const [imageModalOpen, setImageModalOpen] = useState(false); // State for image modal
  const [selectedImage, setSelectedImage] = useState(''); // State for selected image
  const [activeTab, setActiveTab] = useState('item'); // State for selected image
  const [message, setMessage] = useState(
    `Dear ${userDetails.firstName || "Recipient"},\n\nWe found your item and would love to return it to you. Please let us know how we can arrange for you to get it back.\n\nBest regards,\nMindanao State University - Iligan Insitute of Technology - Security and Investigation Division`
  );
  
  const [itemData, setItemData] = useState({
   
    FINDER: '',//based  on their csv
    FINDER_TYPE: '',//for data visualization 
    ITEM: '',//item name ,based on their csv
    ITEM_TYPE: '',//for data visualization
    DESCRIPTION: '',//item description ,base on their csv
    IMAGE_URL: '',//change to item image later
    CONTACT_OF_THE_FINDER: '',//based on their csv
    DATE_FOUND: '',//based on their csv
    GENERAL_LOCATION: '',//for data visualization
    FOUND_LOCATION: '',//based on their csv
    TIME_RETURNED: '',  //time received
    OWNER: '',
    OWNER_COLLEGE: '',
    OWNER_CONTACT: '',
    OWNER_IMAGE: '',
    DATE_CLAIMED: '',
    TIME_CLAIMED: '',
    STATUS: 'unclaimed',
  });

  const [image, setImage] = useState(null); // State to hold the captured image
  const [ownerImage, setOwnerImage] = useState(null); // State to hold the captured owner image
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchItems();
    if (showModal) {
      startCamera(); // Start camera when modal is shown
      setScanning(false);
      setTimeout(() => setScanning(true), 5000);
    }
  }, [showModal]);


  //NEW FIXED
  const openModal = (item = null) => {
    setSelectedItem(item);
    setItemData(
      item || {
        FINDER: '',//based  on their csv
        FINDER_TYPE: 'STUDENT',//for data visualization 
        ITEM: '',//item name ,based on their csv
        ITEM_TYPE: '',//for data visualization
        DESCRIPTION: '',//item description ,base on their csv
        IMAGE_URL: '',//change to item image later
        CONTACT_OF_THE_FINDER: '',//based on their csv
        DATE_FOUND: '',//based on their csv
        GENERAL_LOCATION: '',//for data visualization
        FOUND_LOCATION: '',//based on their csv
        TIME_RETURNED: '',  //time received
        OWNER: '',
        OWNER_COLLEGE: '',
        OWNER_CONTACT: '',
        OWNER_IMAGE: '',
        DATE_CLAIMED: '',
        TIME_CLAIMED: '',
        STATUS: 'unclaimed',
      }
    );
    setImage(null); // Reset the captured image when opening the modal
    setShowModal(true);

    // Reset the view mode and editing state when opening the "Add Found Item" modal
    setIsViewMore(false); // Ensure we are not in view mode
    setIsEditing(false); // Ensure we are not in editing mode
    startCamera();
  };


  const fetchUserData = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/api/profile/${userId}`);
        const data = response.data;

        if (!data) {
            console.error("No user data found.");
            return;
        }

        // Get current date and time
        const now = new Date();
        const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const formattedTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
        setUserDetails({
          email: data.email || '',
          firstName: data.firstName || '',
          lastName: data.lastName || ''
        });
        // Update itemData with the scanned owner's details
        setItemData((prevData) => ({
            ...prevData,
            OWNER: `${data.firstName} ${data.lastName}` || '',
            OWNER_CONTACT: data.contactNumber || '',
            OWNER_IMAGE: data.image_Url || '',
            OWNER_COLLEGE: data.college || '',
            DATE_CLAIMED: '',
            TIME_CLAIMED: '',
            STATUS: 'unclaimed' // Mark as claimed
        }));
     
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
};

  const decryptQRValue = (encryptedId, isAuthorized) => {
    if (!encryptedId) return "";
    setScanning(false);
    setTimeout(() => setScanning(true), 5000);
    try {
        // If authorized, decrypt
        if (isAuthorized) {
            const bytes = CryptoJS.AES.decrypt(encryptedId, CRYPTO_SECRET);
            return bytes.toString(CryptoJS.enc.Utf8) || "Invalid ID";
        }
        // If unauthorized, show asterisks
        return "*".repeat(8);
        setScanning(false);
        setTimeout(() => setScanning(true), 5);
    } catch (error) {
        return "Invalid ID";
        setScanning(false);
        setTimeout(() => setScanning(true), 5);
    }
    setScanning(false);
    setTimeout(() => setScanning(true), 5);
};

const handleScan = (data) => {
  if (!data || !scanning) return;

  setLoading(true);
  console.log("Scanned QR Data:", data);
  setScanning(false);
  setTimeout(() => setScanning(true), 5000);
  // Extract the encrypted user ID from QR code
  const match = data.text.match(/<([^>]*)>/);
  if (!match) {

    console.error("Invalid QR Code format");
    setScanning(false);
    setTimeout(() => setScanning(true), 5000);
    
    return;
  }

  const encryptedId = match[1]; // Extracted encrypted ID
  console.log("Extracted Encrypted ID:", encryptedId);

  // Decrypt the value (pass true for authorized devices)
  const decryptedUserId = decryptQRValue(encryptedId, true);
  console.log("Decrypted User ID:", decryptedUserId);
  setScanning(false);
  setTimeout(() => setScanning(true), 50000);
  if (decryptedUserId !== "Invalid ID") {
    setQrData(decryptedUserId);
    fetchUserData(decryptedUserId); // Auto-fill OWNER details
    setLoading(false);
    setShowModal(true); // Open the modal

    // Restart scanning after a delay
    setTimeout(() => setScanning(true), 5000); // Re-enable scanning after 2s
  } else {

    window.alert("Invalid QR Code. Please try again.");
    setScanning(false);
    setTimeout(() => setScanning(true), 5000);
  }

  setScanning(false);
  setTimeout(() => setScanning(true), 5000);
};
const restartScanning = () => {
  setQrData(null); // Clear scanned data
  setShowModal(false); // Close modal
  setIsEditing(false); // Reset editing mode
  setScanning(true); // Restart scanner
};



const handleError = (err) => {
  
  console.error("QR Scan Error:", err);
  setScanning(false);
  setTimeout(() => setScanning(true), 5000);
};


const filterRequests = () => {
  if (!filterText) {
    return filteredRequests; // If no filter text, return all filtered requests
  }

  return filteredRequests.filter(request => {
    // Check if request.ITEM is defined before calling toLowerCase
    const itemName = request.ITEM ? request.ITEM.toLowerCase() : '';
    return itemName.includes(filterText.toLowerCase());
  });
};


const fetchItems = async () => {
  try {
    const response = await axios.get(`${API_URL}/items`); // ✅ Correct

    //10.10.83.224 SID
    //10.10.83.224 BH
    const sortedRequests = response.data.sort((a, b) => {
      // Combine DATE_FOUND and TIME_RETURNED into a single Date object
      const dateA = new Date(`${a.DATE_FOUND}T${a.TIME_RETURNED}`);
      const dateB = new Date(`${b.DATE_FOUND}T${b.TIME_RETURNED}`);
      return dateB - dateA; // Sort in descending order
    });
    setCurrentPage(1); // Set current page to 1 when data is fetched
    setRequests(sortedRequests);
  } catch (error) {
    console.error('Error fetching items:', error);
  }
};

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setItemData({ ...itemData, [name]: value });
};

const handleFormSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  let imageUrl = itemData.IMAGE_URL; // Default to existing URL if any
  let ownerImageUrl = itemData.OWNER_IMAGE; // Default to existing owner image URL if any

  // Check if adding a new item and no image is captured
  if (!selectedItem && !image && !ownerImage) {
    alert('Please capture an image before submitting the form.'); // Alert if no image is captured
    return; // Exit the function
  }
  // Step 1: Upload the image to Firebase Storage if available
  if (image) {
    const imageRef = ref(storage, `FIRI/${Date.now()}.png`);
    try {
      await uploadString(imageRef, image, 'data_url');
      const downloadURL = await getDownloadURL(imageRef);

      imageUrl = downloadURL; // Update the URL

    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  // Step 2: Upload the owner image to Firebase Storage if available
  if (ownerImage) {
    const ownerImageRef = ref(storage, `FIRI/owner_${Date.now()}.png`);
    try {
      await uploadString(ownerImageRef, ownerImage, 'data_url');
      const downloadURL = await getDownloadURL(ownerImageRef);
      ownerImageUrl = downloadURL; // Update the URL for the owner image
    } catch (error) {
      console.error('Error uploading owner image:', error);
      alert('Error uploading owner image. Please try again.'); // Alert on error
      return; // Exit the function
    }
  }

  // Step 3: Update itemData with the image URLs
  const updatedData = { ...itemData, IMAGE_URL: imageUrl, OWNER_IMAGE: ownerImageUrl };

  try {
    if (selectedItem) {
      const response = await axios.put(`${API_URL}/items/${selectedItem._id}`, updatedData); // ✅ Correct

      showAlert('Item Updated!', 'complaint_success');
    } else {
      const response = await axios.post(`${API_URL}/items`, updatedData); // ✅ Correct

      setRequests([...requests, response.data]);
      showAlert('Item Added!', 'complaint_success');
      
        
      console.log("Form Submitted! Sending request to Facebook...");

      // Construct the message
      const message = `
      📌 *❗❗❗Lost & Found Item❗❗❗*  
      
      Item Name: ${itemData.ITEM}  
      General Location: ${itemData.GENERAL_LOCATION}  
      Date Found: ${itemData.DATE_FOUND}  
      Time Received: ${itemData.TIME_RETURNED}  

      For inquiries : SECURITY AND INVESTIGATION DIVISION(SID) MSU-IIT
      *Located at Infront of Cafeteria and behind MPH(Multipurpose Hall/Basketball Court)*
      `;
      
      console.log("Message to be posted:", message);
      showAlert('Posted to facebook', 'complaint_success');
      // Your Facebook Page Access Token
    
      
      let formData = new FormData();
      formData.append("message", message);
      formData.append("access_token", accessToken);
      
      if (imageUrl) {
          formData.append("url", imageUrl); // Attach image
      }
      
      try {
          // **Single request to post with image & message**
          const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
              method: "POST",
              body: formData,
          });
      
          const fbResult = await fbResponse.json();
          console.log("Facebook API Response:", fbResult);
      
          if (fbResult.id) {
         
          } else {
              alert("Error posting to Facebook: " + JSON.stringify(fbResult));
          }
      
          setShowModal(false);
          showAlert('Email Sent', 'complaint_success');
          setLoading(false);
          fetchItems();
      } catch (error) {
          console.error("Error submitting form:", error);
          alert("Error submitting form. Please try again.");
      }
       }
    setShowModal(false);
    fetchItems();
  }  catch (error) {
    console.error("Error submitting form:", error);
    alert("Error submitting form. Please try again.");
}
  e.preventDefault();

  // Prepare email content
  const emailContent = {
    to_email: userDetails.email,
    subject: "Message from FIRI",
    message: message || "Hello " + userDetails.firstName + ",\n\nThis is a default message from the FIRI system. Please let us know if you have any questions.\n\nBest regards,\nFIRI Team",
  };

  // Use EmailJS to send the email
emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailContent, EMAILJS_PUBLIC_KEY)
    .then((response) => {
      console.log('Email sent successfully!', response);
      setShowModal(false); // Close the modal on successful email
    })
    .catch((error) => {
      console.error('Failed to send email', error);
    });
};




const applyFilters = (filters) => {
  let filtered = [...requests]; // Use a copy of the original requests state

  // Apply filters
  if (filters.finderType) {
    filtered = filtered.filter(item => item.FINDER_TYPE === filters.finderType);
  }

  if (filters.itemType) {
    filtered = filtered.filter(item => item.ITEM_TYPE === filters.itemType);
  }

  if (filters.dateFound) {
    filtered = filtered.filter(item => item.DATE_FOUND === filters.dateFound);
  }

  if (filters.generalLocation) {
    filtered = filtered.filter(item => item.GENERAL_LOCATION.toLowerCase().includes(filters.generalLocation.toLowerCase()));
  }

  if (filters.status) {
    filtered = filtered.filter(item => item.STATUS === filters.status);
  }

  // Apply sorting
  if (filters.sortByDate === 'ascending') {
    filtered.sort((a, b) => new Date(a.DATE_FOUND) - new Date(b.DATE_FOUND));
  } else if (filters.sortByDate === 'descending') {
    filtered.sort((a, b) => new Date(b.DATE_FOUND) - new Date(a.DATE_FOUND));
  }

  // Only update filteredRequests if it has changed
  if (JSON.stringify(filtered) !== JSON.stringify(filteredRequests)) {
    setFilteredRequests(filtered);
  }


};


//UPDATE PAGINATIOn
const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

const displayedRequests = filterRequests().slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

const handlePageChange = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages) {
    setCurrentPage(pageNumber);
  }
};





let currentStream = null;  // Store the current camera stream

// Function to start the camera with the specified facing mode (always environment)
async function startCamera(facingMode) {
  const constraints = {
    video: {
      facingMode: { exact: facingMode },  // Always use 'environment' (back camera)
    },
    audio: false,
  };

  try {
    // If there's an existing stream, stop it before starting a new one
    if (currentStream) {
      const tracks = currentStream.getTracks();
      tracks.forEach(track => track.stop());  // Stop all tracks of the current stream
    }

    // Start the camera with the specified facing mode (back camera)
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const videoElement = document.querySelector('video');
    
    if (videoElement) {
      videoElement.srcObject = stream;
      currentStream = stream;  // Store the current stream
      await videoElement.play();
      console.log('Back camera started.');
    }
  } catch (error) {
    console.error(`Error accessing back camera:`, error);
  }
}

// Avoid forcing reinitialization of the scanner component unnecessarily
useEffect(() => {
  startCamera('environment'); // Always start camera with the back camera on mount
}, []);  // Empty dependency array ensures camera starts only once when component mounts

// Capture image function, no changes needed here
const captureImage = () => {
  const canvas = canvasRef.current;
  const video = videoRef.current;

  if (video && canvas) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png'); // Capturing the image in base64 format

    // Update the appropriate state based on the active tab
    if (activeTab === 'item') {
      setImage(imageData); // Set the captured image for the item
      setItemData({ ...itemData, IMAGE_URL: imageData }); // Update itemData with the captured image
    } else if (activeTab === 'owner') {
      setOwnerImage(imageData); // Set the captured image for the owner
      setItemData({ ...itemData, OWNER_IMAGE: imageData }); // Update itemData with the captured owner image
    }
  }
};

// UseEffect to handle scanning (ensure back camera stays)
useEffect(() => {
  // Ensure back camera is started after scanning and reset
  if (currentStream) {
    const videoElement = document.querySelector('video');
    if (videoElement) {
      startCamera('environment');  // Reset to back camera after scanning
    }
  }
}, [scanning]);  // Triggers whenever scanning changes

const switchCamera = () => {
  const newFacingMode = facingMode === 'user' ? 'environment' : 'user'; // Toggle between 'user' and 'environment'
  setFacingMode(newFacingMode);
  startCamera(newFacingMode);  // Restart the camera with the new facing mode
};

const handleViewMore = (request) => {
  setSelectedItem(request);
  setItemData(request);
  setIsEditing(false); // Ensure we are in view mode
  setIsViewMore(true); // Set to view more mode
  setShowModal(true); // Open modal for viewing more details
  // Start the camera when viewing more details
  startCamera();
};

const handleEdit = () => {
  setIsEditing(true); // Switch to edit mode
  startCamera(); // Start the camera when editing
};


const handleImageClick = (imageUrl) => {
  setSelectedImage(imageUrl);
  setImageModalOpen(true); // Open the image modal
};

const handleCloseImageModal = () => {
  setImageModalOpen(false);
  setSelectedImage('');
};

useEffect(() => {
  setMessage(
    `Dear ${userDetails.firstName || "Recipient"},
    We found your ${itemData.ITEM || "item"}
    at ${itemData.FOUND_LOCATION || "location"}
    and would love to return it to you.
    Please let us know how we can arrange for you to get it back.
    Best regards,
    SID - MSUIIT`
  );
}, [userDetails, itemData]);


// Handle sending email
const sendEmail = (e) => {
  e.preventDefault();

  // Prepare email content
  const emailContent = {
    to_email: userDetails.email,
    item:userDetails.firstName,
    subject: "Message from FIRI",
    message: message  };

  // Use EmailJS to send the email
emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailContent, EMAILJS_PUBLIC_KEY)
    .then((response) => {
      console.log('Email sent successfully!', response);
      setShowModal(false); // Close the modal on successful email
    })
    .catch((error) => {
      console.error('Failed to send email', error);
    });
};  

  

  return (
    <>
        {loading && (
      <div className="loading-overlay">
        <img src="/loadinggif.gif" alt="Loading..." className="loading-gif" />
      </div>
    )}
    <div className="home-container">
      <Sidebar />
      <Header/>
 
      <div className="contentsms">
        <div className="manage-bulletin0">
        <div className='tit7'>
              <div className="breadcrumb57">Qr code </div>
              <div className="breadcrumb07">Scanner</div>
            </div>          {/* <div className="top-right-buttons">
            <button className="add-item-btn">+ Add Found Item</button>
            <button className="register-qr-btn">Register QR Code</button>
          </div> */}
          <div className="camera-sectionsms">
            {/* Use ReactQrScanner to handle QR code scanning */}
          
            {scanning && (
                <ReactQrScanner









                  key={scanning} // Changing key forces reinitialization
                  delay={5000} // Scan delay
                  // style={{ width: "50%" ,transform: 'scaleX(-1)'  }} // Adjust scanner view
                  onScan={handleScan} // Handle scan
                  onError={handleError} // Handle error
                  className="qr-scanner" // Your custom class name

                />
              )}
  </div>
            <div className='ska'> 
                  <MdQrCodeScanner className="scan-icon" /> 
                  <h2> Scan Lost Item Here</h2>
              </div>
          <div>
            {/* <p>Scanned QR Code Value: {qrData} </p>
            {userDetails.email && ( */}
              {/* // <div>
              //   <p><strong>Email:</strong> {userDetails.email}</p>
              //   <p><strong>First Name:</strong> {userDetails.firstName}</p>
              //   <p><strong>Last Name:</strong> {userDetails.lastName}</p>
              //   <button>Send Message</button>
                {/* Open modal when clicking Send Email */}
              {/* <button onClick={() => setShowModal(true)}>Send Email</button>
              </div> */}
            {/* )}
          // </div> */} 
          </div>
        </div>
      </div>

      {/* Modal for custom message input */}
      {showModal && (
       <div className="modal-overlay1">
                <div className="modal1">
                  <h2>{isViewMore ? (isEditing ? 'Edit Item' : 'View Found Item Details') : 'File a Found Item'}</h2>
      
                  {/* Conditionally render the tab buttons */}
                  {!isViewMore || isEditing ? (
                    <div className="tabs1">
                      <button className={`tab-button1 ${activeTab === 'item' ? 'active' : ''}`} onClick={() => setActiveTab('item')}>Item Details</button>
                      <button className={`tab-button1 ${activeTab === 'owner' ? 'active' : ''}`} onClick={() => setActiveTab('owner')}>Owner Details </button>
                      </div>
                  ) : null}
      
                  {/* Wrap form fields and camera in a flex container */}
                  {isViewMore ? (
                    isEditing ? (
                      <div className="form-and-camera">
                        <form onSubmit={handleFormSubmit} className="form-fields">
      
      
                          {activeTab === 'item' ? (
                            <>
                              <div className="form-group1">
                        
                              </div>
      
      
                            </>
                          ) : (
                            <>
                              {/* Owner Details Form Fields */}
                           
                            </>
                          )}
      
                          {/* Buttons inside the form */}
                          <div className="button-container1">
                            <button type="submit" className="submit-btn1">Update</button>
                            {/* delete modal */}
                          
                            <button type="button" className="cancel-btn1" onClick={restartScanning}>
  Cancel
</button>

                          </div>
                        </form>
      
      
      
      
      
      
      
                        {/* Camera Section for both Item and Owner */}
                   
      
                      </div>
                    ) : (
                     <div>
                      </div>
                    )
                  ) : (
                    <div className="form-and-camera">
                      <form onSubmit={handleFormSubmit} className="form-fields">
                        {activeTab === 'item' ? (
                          <>
                            <div className="form-group1">
                              <label htmlFor="finderName">Finder Name edit </label>
                              <input
                                type="text"
                                id="finderName"
                                name="FINDER"
                                maxLength="100"
                                placeholder="Finder Name"
                                value={itemData.FINDER}
                                onChange={handleInputChange}
                                required={!selectedItem}
                              />
                            </div>
      
      
                            <div className="form-group1">
                              <label htmlFor="finderType">Finder TYPE</label>  {/* ADD DROP DOWN */}
      
                              <select
                                id="finderType"
                                name="FINDER_TYPE"
      
                                placeholder="Finder TYPE"
                                value={itemData.FINDER_TYPE}
                                onChange={handleInputChange}
                                required={!selectedItem}
                              >
                                 <option value="STUDENT">STUDENT</option>
                            <option value="UTILITIES">UTILITIES</option>
                            <option value="GUARD">GUARD</option>
                            <option value="VISITORS">VISITORS</option>
                              </select>
                            </div>
                            <div className="form-group1">
                              <label htmlFor="itemName">Item Name</label>
                              <input
                                type="text"
                                id="itemName"
                                name="ITEM"
                                maxLength="100"
                                placeholder="Item Name"
                                value={itemData.ITEM}
                                onChange={handleInputChange}
                                required={!selectedItem}
                              />
                            </div>
                            <div className="form-group1">
                              <label htmlFor="itemType">ITEM TYPE</label>  {/* ADD DROP DOWN */}
                              <select
      
                                id="itemType"
                                name="ITEM_TYPE"
                                placeholder="Item TYPE"
                                value={itemData.ITEM_TYPE}
                                onChange={handleInputChange}
                                required={!selectedItem}
                              >
                               <option value="">Please select</option>
                               <option value="Electronics">Electronics</option>
                            <option value="Personal Items">Personal Items</option>
                            <option value="Clothing Accessories">Clothing & Accessories</option>
                            <option value="Bags and Stationery">Bags & stationary</option>
                            <option value="Sports and Miscellaneous">Sports & Miscellaneous</option>
                              </select>
                            </div>
                            <div className="form-group1">
                              <label htmlFor="description">Item Description</label>
                              <textarea
                                id="description"
                                name="DESCRIPTION"
                                maxLength="500"
                                placeholder="Description"
                                value={itemData.DESCRIPTION}
                                onChange={handleInputChange}
                                required={!selectedItem}
                              ></textarea>
                            </div>
      
                            <div className="form-group1">
                              <label htmlFor="contact">Finder Contact</label>
                              <input
                                type="text"
                                id="contact"
                                name="CONTACT_OF_THE_FINDER"
                                maxLength="50"
                                placeholder="Contact Number"
                                value={itemData.CONTACT_OF_THE_FINDER}
                                onChange={handleInputChange}
                                required={!selectedItem}
                              />
                            </div>
      
                            
                            <div className="form-group1">
                              <label htmlFor="generalLocation">General Location</label>  {/* ADD DROP DOWN */}
      
                              <select
                                id="generalLocation"
                                name="GENERAL_LOCATION"
                                placeholder="General Location"
                                value={itemData.GENERAL_LOCATION}
                                onChange={handleInputChange}
                              >
                                            <option value="Pedestrian & Traffic Zones">Pedestrian & Traffic Zones</option>
                                <option value="INSIDE IIT">INSIDE IIT</option>
                                <option value="Institute Gymnasium Area">Institute Gymnasium Area</option>
                                <option value="COET Area">COET Area</option>
                                <option value="Admission & Admin Offices">Admission & Admin Offices</option>
                                <option value="CHS Area">CHS Area</option>
                                <option value="CSM Area">CSM Area</option>
                                <option value="IDS Area">IDS Area</option>
                                <option value="Food Court Area">Food Court Area</option>
                                <option value="Research Facility">Research Facility</option>
                                <option value="CCS Area">CCS Area</option>
                                <option value="CASS Area">CASS Area</option>
                                <option value="ATM & Banking Area">ATM & Banking Area</option>
                                <option value="Institute Park & Lawn">Institute Park & Lawn</option>
                                <option value="Restrooms (CRs)">Restrooms(CRs)</option>
                                <option value="CEBA Area">CEBA Area</option>
                                <option value="CED Area">CED Area</option>
                                <option value="OUTSIDE IIT">OUTSIDE IIT</option>
                              </select>
                            </div>
                            <div className="form-group1">
                              <label htmlFor="location">Specific Location</label>
                              <input
                                type="text"
                                id="location"
                                name="FOUND_LOCATION"
                                maxLength="200"
                                placeholder="Specific Location"
                                value={itemData.FOUND_LOCATION}
                                onChange={handleInputChange}
                                required={!selectedItem}
                              />
                            </div>
      
                            <div className="form-group1">
                              <label htmlFor="dateFound">Date Found</label>
                              <input
                                type="date"
                                id="dateFound"
                                name="DATE_FOUND"
                                value={itemData.DATE_FOUND}
                                onChange={handleInputChange}
                                required={!selectedItem}
                              />
                            </div>
      
                            <div className="form-group1">
                              <label htmlFor="timeReceived">Time Received</label>
                              <input
                                type="time"
                                id="timeReceived"
                                name="TIME_RETURNED"
                                value={itemData.TIME_RETURNED}
                                onChange={handleInputChange}
                                required={!selectedItem}
                              />
                            </div>
      
      
      
      
                            <div className="form-group1">
                              <label htmlFor="status">Status</label>
                              <select
                                id="status"
                                name="STATUS"
                                value={itemData.STATUS}
                                onChange={handleInputChange}
                              >
                                <option value="unclaimed">Unclaimed</option>
                                <option value="claimed">Claimed</option>
                              </select>
                            </div>
      
                          </>
                        ) : (
                          <>

      
                   <div className="form-group1">
                                         <label htmlFor="owner">Owner Name</label>
                                         <input
                                           type="text"
                                           id="owner"
                                           name="OWNER"
                                           maxLength="50"
                                           placeholder="Owner Name"
                                           value={itemData.OWNER}
                                           onChange={handleInputChange}
                                         />
                                       </div>
                                       <div className="form-group1">
                                         <label htmlFor="ownerCollege">Owner College</label>
                                         <select
                                           id="ownerCollege"
                                           name="OWNER_COLLEGE"
                                           value={itemData.OWNER_COLLEGE}
                                           onChange={handleInputChange}
                                         >
                                           <option value="coe">COE</option>
                                           <option value="ccs">CCS</option>
                                           <option value="cass">CASS</option>
                                           <option value="csm">CSM</option>
                                           <option value="ceba">CEBA</option>
                                           <option value="chs">CHS</option>
                                           <option value="ced">CED</option>
                                         </select>
                                       </div>
                                       {/* Additional owner fields can be added here */}
                                       <div className="form-group1">
                                         <label htmlFor="ownerContact">Owner Contact</label>
                                         <input
                                           type="text"
                                           id="ownerContact"
                                           name="OWNER_CONTACT"
                                           maxLength="50"
                                           placeholder="Owner Contact"
                                           value={itemData.OWNER_CONTACT}
                                           onChange={handleInputChange}
                                         />
                                       </div>
                                      
                                       <div className="form-group1">
                                         <label htmlFor="status">Status</label>
                                         <select
                                           id="status"
                                           name="STATUS"
                                           value={itemData.STATUS}
                                           onChange={handleInputChange}
                                         >
                                           <option value="unclaimed">Unclaimed</option>
                                           <option value="claimed">Claimed</option>
                                         </select>
                                       </div>
                 
                                     </>
                 
                                   )}
                 
                                   {/* Buttons inside the form */}
                                   <div className="button-container1">
                                     <button type="submit" className="submit-btn1">Submit</button>
                                     {/* delete modal */}
                 
                                     <button type="button" className="cancel-btn1" onClick={restartScanning}>
  Cancel
</button>

                                   </div>
                                 </form>
                 
                 
                                 <div className="camera-section">
                                   <video ref={videoRef} width="320" height="240" autoPlay    />
                                   <canvas ref={canvasRef} style={{ display: 'none' }} />
                                   <div className="camera-buttons">
                                   <button type="button" onClick={switchCamera}>Switch Camera</button> 
                                     <button type="button" onClick={captureImage}>Capture Image</button>
                                     
                                   </div>

                                   {/* Show the captured image based on the active tab */}
                                   {activeTab === 'item' && image && (
                                     <img src={image} alt="Captured Item" className="captured-image" />
                                   )}
                                   {activeTab === 'owner' && ownerImage && (
                                     <img src={ownerImage} alt="Captured Owner" className="captured-image" />
                                   )}
                                 </div>
                 
                               </div>
      
                  )}
                </div>
      
              </div>
      )}
    </div>
    </>
  );
}

export default ItemScanner;
