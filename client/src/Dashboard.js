import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard({ name, email, onLogout }) {
  // State management
  const [specialty, setSpecialty] = useState('');
  const [insurance, setInsurance] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [specialtiesRes, insurancesRes] = await Promise.all([
          axios.get('/api/specialties'),
          axios.get('/api/insurances')
        ]);
        
        if (specialtiesRes.data.success) {
          setSpecialties(specialtiesRes.data.specialties);
        }
        
        if (insurancesRes.data.success) {
          setInsurances(insurancesRes.data.insurances);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('Failed to load form data. Please refresh the page.');
      }
    };
    
    fetchData();
  }, []);
  
  // Event handlers
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const params = {};
      if (specialty) params.specialty = specialty;
      if (insurance) params.insurance = insurance;
      if (zipcode) params.zipcode = zipcode;
      
      const response = await axios.get('/api/doctors/search', { params });
      
      if (response.data.success) {
        setDoctors(response.data.doctors);
        if (response.data.doctors.length === 0) {
          setMessage('No doctors found matching your criteria.');
        }
      }
    } catch (error) {
      setMessage('Error searching for doctors.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDoctor = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/doctors/${id}`);
      if (response.data.success) {
        setSelectedDoctor(response.data.doctor);
      }
    } catch (error) {
      setMessage('Error loading doctor details.');
    } finally {
      setLoading(false);
    }
  };
  
  // Main render
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h2>Doctor Finder</h2>
        <div className="user-info">
          <p>Hello, {name}</p>
          <p className="email">{email}</p>
        </div>
      </header>
      
      {/* Main content */}
      <main className="dashboard-main">
        {loading && <div className="loading">Loading...</div>}
        
        {selectedDoctor ? (
          <div className="doctor-details">
            <button 
              className="back-button" 
              onClick={() => setSelectedDoctor(null)}
            >
              &larr; Back to search
            </button>
            
            <h3>{selectedDoctor.name}</h3>
            <p>{selectedDoctor.affiliation}</p>
            
            <div className="info-section">
              <h4>Specialties</h4>
              <p>{selectedDoctor.specialties.join(', ')}</p>
            </div>
            
            <div className="info-section">
              <h4>Contact</h4>
              <p>{selectedDoctor.address}, {selectedDoctor.city}, {selectedDoctor.state} {selectedDoctor.zipcode}</p>
              <p>Phone: {selectedDoctor.phone}</p>
              <p>Email: {selectedDoctor.email}</p>
            </div>
            
            <div className="info-section">
              <h4>About</h4>
              <p>{selectedDoctor.bio}</p>
            </div>
            
            <div className="info-section">
              <h4>Insurance Accepted</h4>
              <p>{selectedDoctor.insurances.join(', ')}</p>
            </div>
          </div>
        ) : (
          <div className="search-panel">
            <div className="search-form">
              <h3>Find a Doctor</h3>
              <form onSubmit={handleSearch}>
                <div className="form-group">
                  <label>Specialty</label>
                  <select 
                    value={specialty} 
                    onChange={(e) => setSpecialty(e.target.value)}
                  >
                    <option value="">All Specialties</option>
                    {specialties.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Insurance</label>
                  <select 
                    value={insurance} 
                    onChange={(e) => setInsurance(e.target.value)}
                  >
                    <option value="">All Insurance Plans</option>
                    {insurances.map(i => (
                      <option key={i.id} value={i.name}>{i.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Zipcode</label>
                  <input 
                    type="text" 
                    value={zipcode} 
                    onChange={(e) => setZipcode(e.target.value)}
                    placeholder="e.g. 30310"
                  />
                </div>
                
                <button type="submit" className="search-button">Search</button>
                <button 
                  type="button" 
                  className="clear-button"
                  onClick={() => {
                    setSpecialty('');
                    setInsurance('');
                    setZipcode('');
                    setDoctors([]);
                    setMessage('');
                  }}
                >
                  Clear
                </button>
              </form>
            </div>
            
            <div className="results-area">
              {message && <p className="message">{message}</p>}
              
              {doctors.length > 0 && (
                <div className="results-list">
                  <h3>Results</h3>
                  {doctors.map(doctor => (
                    <div key={doctor.id} className="doctor-card">
                      <h4>{doctor.name}</h4>
                      <p className="affiliation">{doctor.affiliation}</p>
                      <p>Specialties: {doctor.specialties.join(', ')}</p>
                      <button 
                        onClick={() => handleViewDoctor(doctor.id)}
                        className="view-button"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Footer with logout */}
      <footer className="dashboard-footer">
        <button onClick={onLogout} className="logout-button">
          Log Out
        </button>
      </footer>
    </div>
  );
}

export default Dashboard;