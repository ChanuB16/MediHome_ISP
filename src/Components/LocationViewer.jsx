import { useState, useEffect, useRef } from 'react';
import { FiX, FiMapPin } from 'react-icons/fi';

const LocationViewer = ({ location, isOpen, onClose }) => {
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [address, setAddress] = useState('');
    const mapRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        link.integrity = 'sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        script.integrity = 'sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==';
        script.crossOrigin = '';
        script.onload = initMap;
        document.body.appendChild(script);

        return () => {
            document.head.removeChild(link);
            document.body.removeChild(script);
        };
    }, [isOpen]);

    const initMap = () => {
        if (!window.L || !mapRef.current) return;

        // Initialize map centered on Sri Lanka
        const mapInstance = window.L.map(mapRef.current).setView([7.8731, 80.7718], 8);
        
        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance);

        setMap(mapInstance);

        // If location is provided, geocode it
        if (location) {
            geocodeLocation(location, mapInstance);
        }
    };

    const geocodeLocation = async (locationString, mapInstance) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&countrycodes=lk&limit=1`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const latLng = [parseFloat(lat), parseFloat(lon)];
                
                // Center map on location
                mapInstance.setView(latLng, 15);
                
                // Add marker
                const markerInstance = window.L.marker(latLng).addTo(mapInstance);
                setMarker(markerInstance);
                setAddress(display_name);
            }
        } catch (error) {
            console.error('Error geocoding location:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Patient Location</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FiX size={24} />
                    </button>
                </div>
                
                <div className="p-4">
                    <div className="mb-4">
                        <div className="flex items-center mb-2">
                            <FiMapPin className="text-blue-400 mr-2" />
                            <span className="text-white font-medium">Location:</span>
                        </div>
                        <p className="text-gray-300 ml-6">{location || 'No location provided'}</p>
                    </div>
                    
                    <div 
                        ref={mapRef}
                        className="w-full h-96 rounded-lg border border-gray-600"
                    />
                    
                    {address && (
                        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                            <p className="text-white text-sm">{address}</p>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationViewer; 