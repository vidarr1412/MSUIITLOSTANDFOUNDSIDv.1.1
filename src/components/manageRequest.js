import React, { useState, useEffect } from 'react';
import { FaSearch, FaTable } from 'react-icons/fa';
import { IoGridOutline } from 'react-icons/io5';
import axios from 'axios';
import Sidebar from './sidebar';
import Header from './header';
import Pagination from './pagination';
import '../style/manageRequest.css';
import Filter from '../filterered/manageFilt';
import Modal from './image'; // Import the Modal component
import { FaPlus } from "react-icons/fa6";
const accessToken = process.env.REACT_APP_ACCESS_TOKEN;
const pageId = process.env.REACT_APP_pageId;
const API_URL = process.env.REACT_APP_API_URL;
function ManageRequest() {

  const [filterText, setFilterText] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [viewMode, setViewMode] = useState('table');
  const [itemDetails, setItemDetails] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all'); // State for selected tab
  const [imageModalOpen, setImageModalOpen] = useState(false); // State for image modal
  const [selectedImage, setSelectedImage] = useState(''); // State for selected image



  // New filter states
  const [dateLost, setDateLost] = useState('');
  const [generalLocation, setGeneralLocation] = useState('');
  const [sortByDate, setSortByDate] = useState('ascending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/retrieval-requests`);
      console.log("API Response Data:", response.data);

      if (Array.isArray(response.data) && response.data.length > 0) {
        setRequests(response.data);
      } else {
        console.error("Invalid API response:", response.data);
        setRequests([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching retrieval requests:', error);
      setLoading(false);
    }
  };
  

  const fetchItemDetails = async (itemId) => {
    try {
      const response = await axios.get(`${API_URL}/items/${itemId}`);
      setItemDetails(response.data);
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  const handleStatusUpdate = async (type, id, updatedStatus) => {
    let endpoint = '';

    if (type === 'request') {
      endpoint = `${API_URL}/retrieval-request/${id}/status`;
    } else if (type === 'item') {
      if (!id) {
        console.error("Error: Item ID is undefined.");
        return;
      }
      endpoint = `${API_URL}/found-item/${id}/status`;
    }

    try {
      await axios.put(endpoint, { status: updatedStatus });
      
      fetchRequests(); // Refresh UI after update
    } catch (error) {
      console.error(`Error updating ${type} status:`, error);
    }
    setImageModalOpen(false);
  };

  // Combine filters
  const getFilteredRequests = () => {
    let filtered = requests;

    // Apply tab-based filtering
    switch (selectedTab) {
      case 'declined':
        filtered = filtered.filter(request => request.status === 'declined');
        break;
      case 'pending':
        filtered = filtered.filter(request => request.status === 'pending')
          .sort((a, b) => new Date(b.date_Lost) - new Date(a.date_Lost));
        break;
      case 'approved':
        filtered = filtered.filter(request => request.status === 'approved');
        break;
      case 'all':
      default:
        break;
    }

    // Apply additional filters from Filter component
    if (generalLocation) {
      filtered = filtered.filter(request => request.general_location === generalLocation);
    }

    if (dateLost) {
      filtered = filtered.filter(request => request.date_Lost === dateLost);
    }

    // // Sort by date if specified
    // if (sortByDate === 'ascending') {
    //   filtered = filtered.sort((a, b) => new Date(b.date_Lost) - new Date(a.date_Lost));
    // } else {
    //   filtered = filtered.sort((a, b) => new Date(a.date_Lost) - new Date(b.date_Lost));
    // }

    // Sort by date and time if specified
    if (sortByDate === 'descending') {
      filtered = filtered.sort((a, b) => new Date(a.date_Lost + ' ' + a.time_Lost) - new Date(b.date_Lost + ' ' + b.time_Lost));
    } else {
      filtered = filtered.sort((a, b) => new Date(b.date_Lost + ' ' + b.time_Lost) - new Date(a.date_Lost + ' ' + a.time_Lost));
    }




    return filtered;
  };

const filteredRequests = getFilteredRequests().filter((request) => {
    const lowerCaseFilterText = filterText.toLowerCase();
    return (
      (request.item_name?.toLowerCase().includes(lowerCaseFilterText) || '') ||
      (request.description?.toLowerCase().includes(lowerCaseFilterText) || '') ||
      (request.specific_location?.toLowerCase().includes(lowerCaseFilterText) || '')||
      (request.claimer_name?.toLowerCase().includes(lowerCaseFilterText) || '')
      
    );
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const displayedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleViewMode = () => setViewMode(viewMode === 'table' ? 'grid' : 'table');

  const handleRequestSelect = (request) => {
    setSelectedRequest(request);
    fetchItemDetails(request.itemId);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true); // Open the image modal
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage('');
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
        <Header />
        <div className="content">
          <div className="manage-bulletin5">
            <div className='tit'>
              <div className="breadcrumb5">Manage</div>
              <div className="breadcrumb0">Request</div>
            </div>

            <div className="search-bar5">
              <input
                type="text"
                placeholder="Search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="search-input5"
              />
              <button onClick={toggleViewMode} className="view-mode-toggle5">
                {viewMode === 'table' ? <FaTable /> : <IoGridOutline />}
              </button>
            </div>

            {/* Tabs for filtering requests */}
            <div className="tabs5">
              {['all', 'pending', 'approved', 'declined'].map(tab => (
                <button
                  key={tab}
                  className={`tab-button5 ${selectedTab === tab ? 'active' : ''}`}
                  onClick={() => setSelectedTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <Filter onApplyFilters={({ dateLost, generalLocation, sortByDate }) => {
              setDateLost(dateLost);
              setGeneralLocation(generalLocation);
              setSortByDate(sortByDate);
            }} />

            {loading ? (
              <p>Loading requests...</p>
            ) : displayedRequests.length === 0 ? (
              <p>No matching requests found.</p>
            ) : viewMode === 'table' ? (
              <div className="table-container5">
                <table className="ffound-items-table5">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Constituent</th>
                      <th>Description</th>
                      <th>General Location</th>
                      <th>Specific Location</th>
                      <th>Date Lost</th>
                      <th>Time Lost</th>
                      <th>Item Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRequests.map((request) => (
                      <tr key={request._id}>
                        <td>{request.item_name || "N/A"}</td>
                        <td>{request.claimer_name||"N/A"}</td>
                        <td>{request.description || "N/A"}</td>
                        <td>{request.general_location || "N/A"}</td>
                        <td>{request.specific_location || "N/A"}</td>
                        <td>{request.date_Lost || "N/A"}</td>
                        <td>{request.time_Lost || "N/A"}</td>
                        <td>
                          <span className={`status-btn5 ${request.status}`}>
                            {request.status || "N/A"}
                          </span>
                        </td>
                        <td>
                          <button className="view-btn5" onClick={() => handleRequestSelect(request)}>
                            <FaPlus /> Show
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid-container5">
                {displayedRequests.map((request) => (
                  <div className="grid-item5" key={request._id}>
                    <h2>{request.item_name}</h2>
                    <p><strong>Constituent:</strong> <span className="description5">{request.claimer_name}</span></p>
                    <p><strong>Description:</strong> <span className="description5">{request.description}</span></p>
                    <p><strong>General Location:</strong> {request.general_location}</p>
                    <p><strong>Specific Location:</strong><span className="location5">{request.specific_location}</span></p>
                    <p><strong>Date Lost:</strong> {request.date_Lost}</p>
                    <p><strong>Time Lost:</strong> {request.time_Lost}</p>
                    <p>
                      <strong>Status:</strong>
                      <span className={`status-btn5 ${request.status}`}>
                        {request.status || "N/A"}
                      </span>
                    </p>

                    <button className="view-btn5" onClick={() => handleRequestSelect(request)}>
                      <FaPlus /> Show
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
        </div>
        <Modal isOpen={imageModalOpen} onClose={handleCloseImageModal} imageUrl={selectedImage} />

        {selectedRequest && (
          <div className="modal-overlay5">
            <div className="modal5">
              <div className="modal-details5">
                <div className="card5">
                  <h2>Request Details</h2>
                  <img
                    src={selectedRequest.owner_image || 'sad.jpg'}
                    alt="Product"
                    className={`default-image-url13 ${!selectedRequest.owner_image ? '.default-image-url12' : ''}`} // Add fallback class conditionally
                    onClick={() => handleImageClick(selectedRequest.owner_image || 'sad.jpg')} // Add click handler
                  />
                   <p><strong>Claimer Name:</strong> {selectedRequest.claimer_name || "N/A"}</p>
                  <p><strong>Item Name:</strong> {selectedRequest.item_name || "N/A"}</p>
                  <p><strong>Description:</strong> {selectedRequest.description || "N/A"}</p>
                  <p><strong>General Location:</strong> {selectedRequest.general_location || "N/A"}</p>
                  <p><strong>Specific Location:</strong> {selectedRequest.specific_location || "N/A"}</p>
                  {/* <p><strong>Status:</strong> {selectedRequest.status || "N/A"}</p> */}



                </div>
                {itemDetails && (
                  <div className="card5">
                    <h2>Item Requested Details</h2>
                    <img
                      src={itemDetails.IMAGE_URL || 'sad.jpg'}
                      alt="Product"
                      className={`default-image-url12 ${!itemDetails.IMAGE_URL ? '.default-image-url12' : ''}`} // Add fallback class conditionally
                      onClick={() => handleImageClick(itemDetails.IMAGE_URL || 'sad.jpg')} // Add click handler
                    />
                    <p><strong>Item Name:</strong> {itemDetails.ITEM || "N/A"}</p>
                    <p><strong>Item Type:</strong> {itemDetails.ITEM_TYPE || "N/A"}</p>
                    <p><strong>Item Description:</strong> {itemDetails.DESCRIPTION || "N/A"}</p>
                    <p><strong>Contact of the Finder:</strong> {itemDetails.CONTACT_OF_THE_FINDER || "N/A"}</p>
                    <p><strong>Date Found:</strong> {itemDetails.DATE_FOUND || "N/A"}</p>
                    <p><strong>General Location:</strong> {itemDetails.GENERAL_LOCATION || "N/A"}</p>
                    <p><strong>Specific Location:</strong> {itemDetails.FOUND_LOCATION || "N/A"}</p>


                  </div>
                )}

              </div>

             <div className="button-container5">
                {/* Conditional rendering of action buttons based on status */}
                {selectedRequest.status === 'declined' && (
                  <button onClick={() => {handleStatusUpdate('request', selectedRequest._id, 'pending');setSelectedRequest(null); }} className="reAccept-btn5">Re-Pending</button>
                )}

                {selectedRequest.status === 'pending' && (
                  <div className="button-container-secondary5">
                    <button onClick={() => {handleStatusUpdate('request', selectedRequest._id, 'approved');setSelectedRequest(null); }} className="approved-btn5">Approve</button>
                    <button onClick={() => {handleStatusUpdate('request', selectedRequest._id, 'declined');setSelectedRequest(null); }} className="decline-btn5">Decline</button>
                  </div>
                )}

                {selectedRequest.status === 'approved' && (
                  
                    <button onClick={() => {handleStatusUpdate('request', selectedRequest._id, 'declined');setSelectedRequest(null); }} className="reDecline-btn5">Re-Decline</button>
                  
                )}

                <button onClick={() => setSelectedRequest(null)} className="close-btn5">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ManageRequest;
